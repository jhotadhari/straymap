/**
 * Internal dependencies
 */
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	registerTask(label: string, maxProgress: number): Promise<number>;
	updateTask(taskId: number, progress: number, detail: string): Promise<boolean>;
	unregisterTask(taskId: number): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BackgroundTaskModule');
