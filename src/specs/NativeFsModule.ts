import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

interface Spec extends TurboModule {
	getInfo(
		navDir: string,
		extensions: Array<string> | null,
		recursive: boolean
	): Promise<UnsafeObject>;
	deleteDir(path: string): Promise<boolean>;
	getCacheInfo(): Promise<UnsafeObject>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('FsModule');
