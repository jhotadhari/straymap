/**
 * External dependencies
 */
import { useEffect, useRef } from 'react';

/**
 * Internal dependencies
 */
import NativeBackgroundTaskModule from '../specs/NativeBackgroundTaskModule';

type BackgroundTaskApi = {
	start: (maxProgress?: number) => Promise<void>;
	update: (progress: number, detail?: string) => Promise<void>;
	stop: () => Promise<void>;
};

const log = (msg: string, ...args: unknown[]) => {
	if (__DEV__) console.debug(`[useBackgroundTask] ${msg}`, ...args);
};

const useBackgroundTask = (label: string): BackgroundTaskApi => {
	const taskIdRef = useRef<number | null>(null);
	const labelRef = useRef(label);
	const cancelledRef = useRef(false);
	labelRef.current = label;

	const api = useRef({
		start: async (maxProgress?: number) => {
			// Unregister any prior task before starting a new one
			const oldTid = taskIdRef.current;
			if (oldTid != null) {
				taskIdRef.current = null;
				try {
					await NativeBackgroundTaskModule.unregisterTask(oldTid);
				} catch (e) {
					log('unregister old task failed', e);
				}
			}

			cancelledRef.current = false;
			try {
				const tid = await NativeBackgroundTaskModule.registerTask(
					labelRef.current,
					maxProgress ?? 0
				);
				if (!cancelledRef.current) {
					taskIdRef.current = tid;
				} else {
					try {
						await NativeBackgroundTaskModule.unregisterTask(tid);
					} catch (e) {
						log('unregister cancelled task failed', e);
					}
				}
			} catch (e) {
				taskIdRef.current = null;
				log('registerTask failed', e);
			}
		},
		update: async (progress: number, detail?: string) => {
			try {
				const tid = taskIdRef.current;
				if (tid != null) {
					await NativeBackgroundTaskModule.updateTask(tid, progress, detail ?? '');
				}
			} catch (e) {
				log('updateTask failed', e);
			}
		},
		stop: async () => {
			cancelledRef.current = true;
			try {
				const tid = taskIdRef.current;
				if (tid != null) {
					taskIdRef.current = null;
					await NativeBackgroundTaskModule.unregisterTask(tid);
				}
			} catch (e) {
				log('unregisterTask failed', e);
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
