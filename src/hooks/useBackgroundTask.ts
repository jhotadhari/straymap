/**
 * External dependencies
 */
import { useEffect, useRef } from 'react';

/**
 * Internal dependencies
 */
import NativeBackgroundTaskModule from '../specs/NativeBackgroundTaskModule';

const useBackgroundTask = (label: string) => {
	const taskIdRef = useRef<number | null>(null);
	const labelRef = useRef(label);
	labelRef.current = label;

	const api = useRef({
		start: async (maxProgress?: number) => {
			try {
				taskIdRef.current = await NativeBackgroundTaskModule.registerTask(
					labelRef.current,
					maxProgress ?? 0
				);
			} catch {
				/* native module is best-effort */
			}
		},
		update: async (progress: number, detail?: string) => {
			try {
				const tid = taskIdRef.current;
				if (tid != null) {
					await NativeBackgroundTaskModule.updateTask(tid, progress, detail ?? '');
				}
			} catch {
				/* native module is best-effort */
			}
		},
		stop: async () => {
			try {
				const tid = taskIdRef.current;
				if (tid != null) {
					taskIdRef.current = null;
					await NativeBackgroundTaskModule.unregisterTask(tid);
				}
			} catch {
				/* native module is best-effort */
			}
		},
	});

	useEffect(
		() => () => {
			api.current.stop();
		},
		[]
	);

	return api.current;
};

export default useBackgroundTask;
