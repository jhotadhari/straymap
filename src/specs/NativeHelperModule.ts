/**
 * External dependencies
 */
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

interface Spec extends TurboModule {
	getAppDirs(): Promise<UnsafeObject>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('HelperModule');
