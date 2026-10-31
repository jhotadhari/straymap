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
let pendingRegistration: Promise<number> | null = null;

export const startRecordingTask = async (): Promise<void> => {
	if (recordingTaskId != null || pendingRegistration != null) {
		return;
	}
	const registration = registerBackgroundTask(i18n.t('trackRecording.backgroundTask'), 0, true);
	pendingRegistration = registration;
	try {
		const tid = await registration;
		if (pendingRegistration !== registration) {
			// stopRecordingTask ran while registration was in flight —
			// it already unregistered this id. Unregister again for
			// safety; the native registry tolerates unknown ids.
			try {
				await unregisterBackgroundTask(tid);
			} catch (err) {
				logError('trackRecording/backgroundTask.start.cleanup', err);
			}
			return;
		}
		recordingTaskId = tid;
	} catch (err) {
		logError('trackRecording/backgroundTask.start', err);
	} finally {
		if (pendingRegistration === registration) {
			pendingRegistration = null;
		}
	}
};

export const stopRecordingTask = async (): Promise<void> => {
	const pending = pendingRegistration;
	pendingRegistration = null;
	const tid = recordingTaskId;
	recordingTaskId = null;
	try {
		if (pending != null) {
			// Registration still in flight — await it and remove the
			// task it creates, so a quick start/stop cannot leak the
			// notification.
			const resolvedId = await pending;
			await unregisterBackgroundTask(resolvedId);
		}
		if (tid != null) {
			await unregisterBackgroundTask(tid);
		}
	} catch (err) {
		logError('trackRecording/backgroundTask.stop', err);
	}
};
