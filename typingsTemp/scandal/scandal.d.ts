// Type definitions for scandal (v2.2.0)
// Project: https://github.com/atom/scandal
// Definitions by: david-driscoll <https://github.com/david-driscoll/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// Generated by: https://github.com/david-driscoll/atom-typescript-generator
// Generation tool by david-driscoll <https://github.com/david-driscoll/>
declare module Scandal {
    /**
     * {ChunkedExecutor} will execute on an {Array} paths in a pathQueue only
     * running a max of 20 of them concurrently.
     */
    class ChunkedExecutor {
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        execPathFn: string;
    
        /**
         * Construct a {ChunkedExecutor}
         * This field or method was marked private by atomdoc. Use with caution.
         * @param pathQueue? - {Array} of paths
         * @param execPathFn? - {Function} that will execute on each path
         */
        constructor(pathQueue? : string, execPathFn? : string);
    
        /**
         * Begin execution of the `pathQueue`
         * @param doneCallback? - {Function} callback that will be called when execution is finished. 
         */
        execute(doneCallback? : Function) : any;
    
        /**
         * Push a new path on the queue
         * 
         * May or may not execute immediately.
         * @param filePath? - {String} path to a file 
         */
        push(filePath? : string) : any;
    
        /**
         * Lifecycle Methods
         * This field or method was marked private by atomdoc. Use with caution.
         */
        executeNextPathIfPossible() : string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        executePath(filePath? : string) : string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        checkIfFinished() : any;
    
    }

    /**
     * Will ensure data will be read on a line boundary. So this will always do the
     * right thing:
     */
    class ChunkedLineReader /*extends .Readable*/ {
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        static CHUNK_SIZE: any /* default */;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        static chunkedBuffer: any /* default */;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        static headerBuffer() : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        filePath: string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        constructor(filePath? : string, options? : any);
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        isBinaryFile() : Pathwatcher.File;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        _read() : any;
    
    }

    /**
     * ChunkedScanner
     * This class was not documented by atomdoc, assume it is private. Use with caution.
     */
    class ChunkedScanner extends ChunkedExecutor {
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        scanner: FirstMate.Scanner;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        constructor(scanner? : FirstMate.Scanner, execPathFn? : string);
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        execute(doneCallback? : any) : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        onFinishedScanning() : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        checkIfFinished() : any;
    
    }

    /**
     * {PathFilter} makes testing for path inclusion easy. 
     */
    class PathFilter {
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        static MINIMATCH_OPTIONS: boolean;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        static escapeRegExp(str? : any) : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        rootPath: string;
    
        /**
         * Construct a {PathFilter}
         * @param rootPath? - {String} top level directory to scan. eg. `/Users/ben/somedir`
         * @param options? - {Object} options hash
         */
        constructor(rootPath? : string, options? : Object);
    
        /**
         * Test if the `filepath` is accepted as a file based on the
         * constructing options.
         * @param filepath? - {String} path to a file. File should be a file and should exist
         */
        isFileAccepted(filepath? : string) : boolean;
    
        /**
         * Test if the `filepath` is accepted as a directory based on the
         * constructing options.
         * @param filepath? - {String} path to a directory. File should be a directory and should exist
         */
        isDirectoryAccepted(filepath? : string) : boolean;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        isPathAccepted(fileOrDirectory? : Pathwatcher.Directory, filepath? : string) : string;
    
        /**
         * Private Methods
         * This field or method was marked private by atomdoc. Use with caution.
         */
        isPathIncluded(fileOrDirectory? : Pathwatcher.Directory, filepath? : string) : string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        isPathExcluded(fileOrDirectory? : Pathwatcher.Directory, filepath? : string) : string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        isPathGloballyExcluded(fileOrDirectory? : Pathwatcher.Directory, filepath? : string) : string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        isPathExcludedByGit(filepath? : string) : string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        sanitizePaths(options? : any) : string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        excludeHidden() : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        createMatchers(patterns? : FirstMate.Pattern[], options? : (deepMatch? : any,disallowDuplicatesFrom? : any) => any) : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        containsPattern(matchers? : any, fileOrDirectory? : Pathwatcher.Directory, pattern? : FirstMate.Pattern) : FirstMate.Pattern;
    
    }

    /**
     * ReplaceTransformer
     * This class was not documented by atomdoc, assume it is private. Use with caution.
     */
    class ReplaceTransformer /*extends .Transform*/ {
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        regex: any /* default */;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        replacementText: string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        dryReplace: any /* default */;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        constructor(regex? : any, replacementText? : string, options? : (dryReplace? : any) => any);
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        _transform(chunk? : any, encoding? : string, done? : any) : any;
    
    }

    /**
     * PathReplacer
     * This class was not documented by atomdoc, assume it is private. Use with caution.
     */
    class PathReplacer /*extends NodeJS.EventEmitter*/ {
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        dryReplace: any /* default */;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        constructor({ dryReplace } : { dryReplace? : any });
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        replacePaths(regex? : any, replacementText? : string, paths? : string, doneCallback? : any) : string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        replacePath(regex? : any, replacementText? : string, filePath? : string, doneCallback? : any) : string;
    
    }

    /**
     * Scans a directory and emits events when paths matching input options
     * have been found.
     */
    class PathScanner /*extends NodeJS.EventEmitter*/ {
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        rootPath: string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        options: any /* default */;
    
        /**
         * Create a {PathScanner} object.
         * @param rootPath? - {String} top level directory to scan. eg. `/Users/ben/somedir`
         * @param options? - {Object} options hash
         */
        constructor(rootPath? : string, options? : Object);
    
        /**
         * Begin the scan 
         */
        scan() : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        readDir(filePath? : string) : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        relativize(filePath? : string) : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        processFile(filePath? : string) : Pathwatcher.File;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        stat(filePath? : string) : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        isInternalSymlink(filePath? : string) : boolean;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        asyncCallStarting() : any;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        asyncCallDone() : any;
    
    }

    /**
     * Will search through paths specified for a regex.
     */
    class PathSearcher /*extends NodeJS.EventEmitter*/ {
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        maxLineLength: number;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        wordBreakRegex: any /* default */;
    
        /**
         * Construct a {PathSearcher} object.
         */
        constructor({ maxLineLength, wordBreakRegex } : { maxLineLength? : number; wordBreakRegex? : any });
    
        /**
         * Search an array of paths.
         * 
         * Will search with a {ChunkedExecutor} so as not to immediately exhaust all
         * the available file descriptors. The {ChunkedExecutor} will execute 20 paths
         * concurrently.
         * @param regex? - {RegExp} search pattern
         * @param paths? - {Array} of {String} file paths to search
         * @param doneCallback? - called when searching the entire array of paths has finished
         */
        searchPaths(regex? : RegExp, paths? : string, doneCallback? : any) : string;
    
        /**
         * Search a file path for a regex
         * @param regex? - {RegExp} search pattern
         * @param filePath? - {String} file path to search
         * @param doneCallback? - called when searching the entire array of paths has finished
         */
        searchPath(regex? : RegExp, filePath? : string, doneCallback? : any) : string;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        searchLine(regex? : any, line? : number, lineNumber? : any) : number;
    
        /**
         * This field or method was not documented by atomdoc, assume it is private. Use with caution.
         */
        findWordBreak(line? : number, offset? : any, increment? : any) : any;
    
    }

}
declare module "scandal" {
    const main: any;
    const replace: any;
    class PathSearcher extends Scandal.PathSearcher {}
    class PathScanner extends Scandal.PathScanner {}
    const PathReplacer: any;
    export = Serializable.Serializable;
}
