/**
 * Internal dependencies
 */
import i18n from '../../assets/i18n/i18n';
import { registerBackgroundTask, unregisterBackgroundTask } from '../../lib/backgroundTask';
import { logError } from '../../lib/utils';

/**
 * Track-recording foreground task (kept alive via the shared
 * BackgroundTaskService notification).  One recording session = one
 * static task with no progress; the notification reads
 * `trackRecording.backgroundTask` ("Recording track").
 *
 * needsLocation flags the task as a location foreground service so
 * GNSS fixes keep flowing while the app is backgrounded (Android 14+
 * delivers background location only to location-type foreground
 * services or apps holding ACCESS_BACKGROUND_LOCATION).
 */
let recordingTaskId: number | null = null;

export const startRecordingTask = async (): Promise<void> => {
	if (recordingTaskId != null) {
		return;
	}
	try {
		recordingTaskId = await registerBackgroundTask(
			i18n.t('trackRecording.backgroundTask'),
			0,
			true
		);
	} catch (err) {
		logError('trackRecording/backgroundTask.start', err);
	}
};

export const stopRecordingTask = async (): Promise<void> => {
	const tid = recordingTaskId;
	recordingTaskId = null;
	if (tid == null) {
		return;
	}
	try {
		await unregisterBackgroundTask(tid);
	} catch (err) {
		logError('trackRecording/backgroundTask.stop', err);
	}
};
