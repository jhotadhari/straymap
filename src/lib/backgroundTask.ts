/**
 * External dependencies
 */
import NativeBackgroundTaskModule from '../specs/NativeBackgroundTaskModule';

/**
 * Shared non-hook wrappers around the native BackgroundTaskModule.
 *
 * The BackgroundTaskService (Android) holds a single foreground-service
 * notification shared by all features (import, track recording, …) via a
 * task registry keyed by the task id returned by registerTask.
 *
 * `useBackgroundTask` (src/hooks/useBackgroundTask.ts) builds on these
 * wrappers for React components; Redux thunks/listeners use them directly.
 */
export const registerBackgroundTask = async (
	label: string,
	maxProgress = 0,
	needsLocation = false
): Promise<number> => {
	return NativeBackgroundTaskModule.registerTask(label, maxProgress, needsLocation);
};

export const updateBackgroundTask = async (
	taskId: number,
	progress: number,
	detail = ''
): Promise<boolean> => {
	return NativeBackgroundTaskModule.updateTask(taskId, progress, detail);
};

export const unregisterBackgroundTask = async (taskId: number): Promise<boolean> => {
	return NativeBackgroundTaskModule.unregisterTask(taskId);
};
