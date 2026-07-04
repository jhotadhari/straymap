/**
 * Internal dependencies
 */
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	startService(): Promise<boolean>;
	stopService(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('TrackingModule');
