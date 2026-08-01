/**
 * External dependencies
 */
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

interface Spec extends TurboModule {
	getInfo(
		navDir: string,
		extensions: Array<string> | null,
		recursive: boolean,
		stopOnFirstMatch?: boolean | null,
		maxDepth?: number | null
	): Promise<UnsafeObject>;
	deleteDir(path: string): Promise<boolean>;
	deleteFile(path: string): Promise<boolean>;
	renameFile(oldPath: string, newPath: string): Promise<boolean>;
	copyFile(sourcePath: string, destPath: string): Promise<boolean>;
	getCacheInfo(): Promise<UnsafeObject>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('FsModule');
