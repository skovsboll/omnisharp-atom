import {helpers, Observable, ReplaySubject, Subject, CompositeDisposable, BehaviorSubject, Disposable, Scheduler} from 'rx';
import manager from "./solution-manager";
import {Solution} from "./solution";
import _ = require('lodash');
import {basename} from "path";
import {DriverState} from "omnisharp-client";
import {ProjectViewModel} from "./view-model";

// Time we wait to try and do our active switch tasks.
const DEBOUNCE_TIMEOUT = 100;

function wrapEditorObservable(observable: Observable<Atom.TextEditor>) {
    return observable
        .subscribeOn(Scheduler.timeout)
        .observeOn(Scheduler.timeout)
        .debounce(DEBOUNCE_TIMEOUT)
        .where(editor => !editor || !editor.isDestroyed());
}

class Omni implements Rx.IDisposable {
    private disposable: CompositeDisposable;

    private _editors: Observable<Atom.TextEditor>;
    private _configEditors: Observable<Atom.TextEditor>;

    private _activeEditorSubject = new BehaviorSubject<Atom.TextEditor>(null);
    private _activeEditor = wrapEditorObservable(this._activeEditorSubject)
        .shareReplay(1);

    private _activeConfigEditorSubject = new BehaviorSubject<Atom.TextEditor>(null);
    private _activeConfigEditor = wrapEditorObservable(this._activeConfigEditorSubject)
        .shareReplay(1);

    private _activeEditorOrConfigEditor = wrapEditorObservable(Observable.combineLatest(this._activeEditorSubject, this._activeConfigEditorSubject, (editor, config) => editor || config || null));

    private _activeProject = this._activeEditorOrConfigEditor
        .flatMap(editor => manager.getSolutionForEditor(editor)
            .flatMap(z => z.model.getProjectForEditor(editor)))
        .shareReplay(1);

    private _activeFramework = this._activeEditorOrConfigEditor
        .flatMapLatest(editor => manager.getSolutionForEditor(editor)
            .flatMapLatest(z => z.model.getProjectForEditor(editor)))
        .flatMapLatest(project => project.observe.activeFramework.map(framework => ({ project, framework })))
        .shareReplay(1);

    private _isOff = true;

    public get isOff() { return this._isOff; }
    public get isOn() { return !this.isOff; }

    public activate() {
        var openerDisposable = makeOpener();
        this.disposable = new CompositeDisposable;
        manager.activate(this._activeEditorOrConfigEditor);

        // we are only off if all our solutions are disconncted or erroed.
        this.disposable.add(manager.solutionAggregateObserver.state.subscribe(z => this._isOff = _.all(z, x => x.value === DriverState.Disconnected || x.value === DriverState.Error)));

        this._editors = Omni.createTextEditorObservable(this._supportedExtensions, this.disposable);
        this._configEditors = Omni.createTextEditorObservable(['.json'], this.disposable);

        this.disposable.add(atom.workspace.observeActivePaneItem((pane: any) => {
            if (pane && pane.getGrammar) {
                if (_.any(this._supportedExtensions, ext => _.endsWith(pane.getPath(), ext))) {
                    this._activeConfigEditorSubject.onNext(null);
                    this._activeEditorSubject.onNext(pane);
                    return;
                }

                var filename = basename(pane.getPath());
                if (filename === 'project.json') {
                    this._activeEditorSubject.onNext(null);
                    this._activeConfigEditorSubject.onNext(pane);
                    return;
                }
            }
            // This will tell us when the editor is no longer an appropriate editor
            this._activeEditorSubject.onNext(null);
            this._activeConfigEditorSubject.onNext(null);
        }));

        this.disposable.add(this._editors.subscribe(editor => {
            var cd = new CompositeDisposable();
            // TODO: Update once rename/codeactions support optional workspace changes
            //var omniChanges: { oldRange: TextBuffer.Range; newRange: TextBuffer.Range; oldText: string; newText: string; }[] = (<any>editor).__omniChanges__ = [];

            /*cd.add(editor.getBuffer().onDidChange((change: { oldRange: TextBuffer.Range; newRange: TextBuffer.Range; oldText: string; newText: string; }) => {
                //omniChanges.push(change);
            }));*/

            cd.add(editor.onDidStopChanging(_.debounce(() => {
                /*if (omniChanges.length) {
                }*/
                this.request(editor, solution => solution.updatebuffer({}, { silent: true }));
            }, 1000)));

            cd.add(editor.onDidSave(() => this.request(editor, solution => solution.updatebuffer({ FromDisk: true }, { silent: true }))));

            cd.add(editor.onDidDestroy(() => {
                cd.dispose();
            }));

            this.disposable.add(cd);
        }));

        this.disposable.add(Disposable.create(() => {
            this._activeEditorSubject.onNext(null);
            this._activeConfigEditorSubject.onNext(null);
        }));
    }

    public dispose() {
        if (manager._unitTestMode_) return;
        this.disposable.dispose();
        manager.deactivate();
    }

    public connect() { manager.connect(); }

    public disconnect() { manager.disconnect(); }

    public toggle() {
        if (manager.connected) {
            manager.disconnect();
        } else {
            manager.connect();
        }
    }

    public navigateTo(response: { FileName: string; Line: number; Column: number; }) {
        atom.workspace.open(response.FileName, <any>{ initialLine: response.Line, initialColumn: response.Column })
            .then((editor) => {
                editor.setCursorBufferPosition([response.Line && response.Line, response.Column && response.Column])
            });
    }

    public getFrameworks(projects: string[]): string {
        var frameworks = _.map(projects, (project: string) => {
            return project.indexOf('+') === -1 ? '' : project.split('+')[1];
        }).filter((fw: string) => fw.length > 0);
        return frameworks.join(',');
    }

    public addTextEditorCommand(commandName: string, callback: (...args: any[]) => any) {
        return atom.commands.add("atom-text-editor", commandName, (event) => {
            var editor = atom.workspace.getActiveTextEditor();
            if (!editor) {
                return;
            };

            if (_.any(this._supportedExtensions, ext => _.endsWith(editor.getPath(), ext))) {
                event.stopPropagation();
                event.stopImmediatePropagation();
                callback(event);
            }
        });
    }

    private static createTextEditorObservable(extensions: string[], disposable: CompositeDisposable) {
        var editors: Atom.TextEditor[] = [];
        var subject = new Subject<Atom.TextEditor>();
        var editorSubject = new Subject<Atom.TextEditor>();

        disposable.add(atom.workspace.observeActivePaneItem((pane: any) => !editorSubject.isDisposed && editorSubject.onNext(pane)));
        var editorObservable = editorSubject.where(z => z && !!z.getGrammar);

        disposable.add(Observable.zip(editorObservable, editorObservable.skip(1), (editor, nextEditor) => ({ editor, nextEditor }))
            .debounce(50)
            .subscribe(function({editor, nextEditor}) {
                var path = nextEditor.getPath();
                if (!path) {
                    // editor isn't saved yet.
                    if (editor && _.any(extensions, ext => _.endsWith(editor.getPath(), ext))) {
                        atom.notifications.addInfo("OmniSharp", { detail: "Functionality will limited until the file has been saved." });
                    }
                }
            }));

        disposable.add(atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
            var cb = () => {
                var p = editor.getPath();
                if (_.any(extensions, ext => _.endsWith(editor.getPath(), ext))) {
                    editors.push(editor);
                    !subject.isDisposed && subject.onNext(editor);

                    // pull old editors.
                    disposable.add(editor.onDidDestroy(() => _.pull(editors, editor)));
                }
            };

            var path = editor.getPath();
            if (!path) {
                var disposer = editor.onDidChangePath(() => {
                    cb();
                    disposer.dispose();
                });
            } else {
                cb();
            }
        }));

        disposable.add(subject);
        disposable.add(editorSubject);

        return Observable.merge(subject, Observable.defer(() => Observable.from(editors))).delay(50);
    }

    /**
    * This property can be used to listen to any event that might come across on any solutions.
    * This is a mostly functional replacement for `registerConfiguration`, though there has been
    *     one place where `registerConfiguration` could not be replaced.
    */
    public get listener() {
        return manager.solutionObserver;
    }

    /**
    * This property can be used to observe to the aggregate or combined responses to any event.
    * A good example of this is, for code check errors, to aggregate all errors across all open solutions.
    */
    public get aggregateListener() {
        return manager.solutionAggregateObserver;
    }

    /**
    * This property gets a list of solutions as an observable.
    * NOTE: This property will not emit additions or removals of solutions.
    */
    public get solutions() {
        return Observable.defer(() => Observable.from(manager.activeSolutions));
    }

    /**
    * This method allows us to forget about the entire solution model.
    * Call this method with a specific editor, or just with a callback to capture the current editor
    *
    * The callback will then issue the request
    * NOTE: This API only exposes the operation Api and doesn't expose the event api, as we are requesting something to happen
    */
    public request<T>(editor: Atom.TextEditor, callback: (solution: OmniSharp.ExtendApi) => Rx.Observable<T> | Rx.IPromise<T>): Rx.Observable<T>;
    public request<T>(callback: (solution: OmniSharp.ExtendApi) => Rx.Observable<T> | Rx.IPromise<T>): Rx.Observable<T>;
    public request<T>(editor: Atom.TextEditor | ((solution: OmniSharp.ExtendApi) => Rx.Observable<T> | Rx.IPromise<T>), callback?: (solution: OmniSharp.ExtendApi) => Rx.Observable<T> | Rx.IPromise<T>): Rx.Observable<T> {
        if (_.isFunction(editor)) {
            callback = <any>editor;
            editor = null;
        }

        if (!editor) {
            editor = atom.workspace.getActiveTextEditor();
        }

        var solutionCallback = (solution: Solution) => {
            var r = callback(solution.withEditor(<any>editor));
            if (helpers.isPromise(r)) {
                return Observable.fromPromise(<Rx.IPromise<T>>r);
            } else {
                return <Rx.Observable<T>>r;
            }
        };

        var result: Observable<T>;

        if (editor) {
            result = manager.getSolutionForEditor(<Atom.TextEditor>editor)
                .where(z => !!z)
                .flatMap(solutionCallback).share();
        } else {
            result = manager.activeSolution.take(1)
                .where(z => !!z)
                .flatMap(solutionCallback).share();
        }

        // Ensure that the underying promise is connected
        //   (if we don't subscribe to the reuslt of the request, which is not a requirement).
        result.subscribeOnCompleted(() => { });

        return result;
    }

    public getProject(editor: Atom.TextEditor) {
        return manager.getSolutionForEditor(editor)
            .flatMap(z => z.model.getProjectForEditor(editor))
            .take(1);
    }

    public getSolutionForProject(project: ProjectViewModel) {
        return Observable.just(
            _(manager.activeSolutions)
                .filter(solution => _.any(solution.model.projects, p => p.name === project.name))
                .first()
        );
    }

    /**
    * Allows for views to observe the active model as it changes between editors
    */
    public get activeModel() {
        return manager.activeSolution.map(z => z.model);
    }

    public get activeSolution() {
        return manager.activeSolution;
    }

    public get activeEditor() {
        return this._activeEditor;
    }

    public switchActiveEditor(callback: (editor: Atom.TextEditor, cd: CompositeDisposable) => void): Rx.IDisposable {
        var outerCd = new CompositeDisposable();
        outerCd.add(this.activeEditor.where(z => !!z).subscribe(editor => {
            var cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(this.activeEditor.where(active => active !== editor)
                .subscribe(() => {
                    outerCd.remove(cd);
                    cd.dispose();
                }));

            callback(editor, cd);
        }));

        return outerCd;
    }

    public whenEditorConnected(editor: Atom.TextEditor) {
        return manager.getSolutionForEditor(editor)
            .flatMap(solution => solution.whenConnected())
            .map(z => editor);
    }

    public get activeConfigEditor() {
        return this._activeConfigEditor;
    }

    public get activeEditorOrConfigEditor() {
        return this._activeEditorOrConfigEditor;
    }

    public get activeProject() {
        return this._activeProject;
    }

    public get activeFramework() {
        return this._activeFramework;
    }

    public get editors() {
        return this._editors;
    }

    public get configEditors() {
        return this._configEditors;
    }

    public eachEditor(callback: (editor: Atom.TextEditor, cd: CompositeDisposable) => void): Rx.IDisposable {
        var outerCd = new CompositeDisposable();
        outerCd.add(this._editors.subscribe(editor => {
            var cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(editor.onDidDestroy((() => {
                outerCd.remove(cd);
                cd.dispose();
            })));

            callback(editor, cd);
        }));

        return outerCd;
    }

    public eachConfigEditor(callback: (editor: Atom.TextEditor, cd: CompositeDisposable) => void): Rx.IDisposable {
        var outerCd = new CompositeDisposable();
        outerCd.add(this._configEditors.subscribe(editor => {
            var cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(editor.onDidDestroy((() => {
                outerCd.remove(cd);
                cd.dispose();
            })));

            callback(editor, cd);
        }));

        return outerCd;
    }

    public registerConfiguration(callback: (solution: Solution) => void) {
        manager.registerConfiguration(callback);
    }

    private get _kick_in_the_pants_() {
        return manager._kick_in_the_pants_;
    }

    private _supportedExtensions = ['.cs', '.csx'/*, '.cake'*/];

    public get grammars() {
        return _.filter(atom.grammars.getGrammars(),
            grammar => _.any(this._supportedExtensions,
                ext => _.any((<any>grammar).fileTypes,
                    ft => _.trimLeft(ext, '.') === ft)));
    }

    public isValidGrammar(grammar: FirstMate.Grammar) {
        return _.any(this._supportedExtensions, ext => _.any((<any>grammar).fileTypes, ft => _.trimLeft(ext, '.') === ft));
    }
}

var instance = new Omni;

export = instance;

import {TextEditor} from "atom";
var metadataUri = 'omnisharp://metadata/';
function makeOpener(): Rx.IDisposable {
    function createEditorView(assemblyName: string, typeName: string) {
        function issueRequest(solution: Solution) {
            return solution.request<any, { Source: string; SourceName: string }>("metadata", { AssemblyName: assemblyName, TypeName: typeName })
                .map(response => ({ source: response.Source, path: response.SourceName, solution }));
        }

        function setupEditor({solution, path, source}: { solution: Solution; source: string; path: string }) {
            var editor = new TextEditor({});
            editor.setText(source);
            editor.onWillInsertText((e) => e.cancel());
            editor.getBuffer().setPath(path);

            (<any>editor).omniProject = (<any>solution).path;
            (<any>editor).__omniClient__ = solution;
            editor.save = function() { };
            editor.saveAs = function() { };
            (<any>editor)._metadataEditor = true;

            return editor;
        }

        return manager.activeSolution
            .take(1)
            .flatMap(issueRequest)
            .map(setupEditor)
            .toPromise();
    }

    return <any>atom.workspace.addOpener((uri: string) => {
        if (_.startsWith(uri, metadataUri)) {
            var url = uri.substr(metadataUri.length);
            var [assemblyName, typeName] = url.split('/');
            return createEditorView(assemblyName, typeName);
        }
    });
}
