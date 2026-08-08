/**
 * External dependencies
 */
import { useCallback, useState } from 'react';

const useAsyncBusy = <Args extends any[], T>(fn: (...args: Args) => Promise<T>) => {
	const [isLoading, setIsLoading] = useState(false);

	const run = useCallback(
		(...args: Args) => {
			setIsLoading(true);
			return fn(...args).finally(() => setIsLoading(false));
		},
		[fn]
	);

	return [isLoading, run] as const;
};

export default useAsyncBusy;
