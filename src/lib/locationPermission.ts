/**
 * External dependencies
 */
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Request ACCESS_FINE_LOCATION on Android (covers COARSE as well).
 *
 * The permissions are declared in the manifest; Android requires the
 * runtime grant before the native location listener can register.
 * Returns true when granted or when not required (non-Android).
 */
const ensureLocationPermission = async (): Promise<boolean> => {
	if (Platform.OS !== 'android') {
		return true;
	}

	try {
		const result = await PermissionsAndroid.request('android.permission.ACCESS_FINE_LOCATION');
		return result === PermissionsAndroid.RESULTS.GRANTED;
	} catch {
		return false;
	}
};

export default ensureLocationPermission;
