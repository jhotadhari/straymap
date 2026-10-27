/**
 * External dependencies
 */
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Request POST_NOTIFICATIONS on Android 13+ (API 33).  Returns true when
 * granted or when not required (pre-33 / non-Android).  Denials are
 * non-fatal for the caller's feature — the foreground service still runs,
 * only its notification is hidden.
 */
const ensureNotificationPermission = async (): Promise<boolean> => {
	if (Platform.OS !== 'android' || Platform.Version < 33) {
		return true;
	}

	try {
		const result = await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
		return result === PermissionsAndroid.RESULTS.GRANTED;
	} catch {
		return false;
	}
};

export default ensureNotificationPermission;
