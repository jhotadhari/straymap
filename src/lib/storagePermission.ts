/**
 * External dependencies
 */
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Request WRITE_EXTERNAL_STORAGE on Android API ≤ 28.
 *
 * The permission is declared in the manifest with maxSdkVersion="28",
 * so it only exists on API 28 and below. On API 29+ (scoped storage)
 * the app uses SAF and app-specific directories — no permission needed.
 *
 * Returns true if permission is granted or not required.
 */
const ensureStoragePermission = async (): Promise<boolean> => {
	if (Platform.OS !== 'android') {
		return true;
	}

	const apiLevel = Platform.Version as number;

	// On API 29+ the permission is suppressed by maxSdkVersion="28"
	if (apiLevel >= 29) {
		return true;
	}

	try {
		const result = await PermissionsAndroid.request(
			'android.permission.WRITE_EXTERNAL_STORAGE'
		);
		return result === PermissionsAndroid.RESULTS.GRANTED;
	} catch {
		return false;
	}
};

export default ensureStoragePermission;
