declare module '*.md' {
    const value: string;
    export default value;
}

declare module globalThis {
    var shouldLog: {

        /**Log when some connectStorage writes to DefaultPreference */
        saveToStorage: boolean;

        /** Log all dispatched actions. boolean or array of action types */
        dispatchAction: boolean | string[];
    }
}