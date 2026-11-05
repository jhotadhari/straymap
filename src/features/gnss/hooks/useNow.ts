/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Current timestamp that updates every `intervalMs` — a cheap ticker for
 * time-based staleness checks without dispatching Redux actions.
 */
export const useNow = (intervalMs: number): number => {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), intervalMs);
		return () => clearInterval(timer);
	}, [intervalMs]);
	return now;
};
