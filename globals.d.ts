declare module '*.md' {
	const value: string;
	export default value;
}

declare module '*.sql' {
	const value: string;
	export default value;
}

declare module globalThis {
	var shouldLog: {
		/**Log when some connectStorage writes to DefaultPreference */
		saveToStorage: boolean;

		/** Log all dispatched actions. boolean or array of action types */
		dispatchAction: boolean | string[];

		/**
		 * Whether the store is configured with serializableCheck middleware.
		 * If true, it will log non-serializable values that are dispatched to the store.
		 * It is disabled anyway in production.
		 * And in development it slows down the store if objects are huge (e.g. routing segments).
		 * */
		serializableCheck: boolean;

		/** drizzle logger. Used in src/db/client.ts */
		drizzle: boolean;

		/** i18n logger. Used in src/assets/i18n/i18n.ts */
		i18n: boolean;
	};
}
