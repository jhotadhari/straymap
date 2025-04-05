/**
 * External dependencies
 */
import { useState, useEffect } from 'react';

/**
 * Internal dependencies
 */
import { FsModule } from '../nativeModules';

export type CacheSubDir = {
	readableSize: string;
	basename: string;
};

export type CacheDir = {
	path: string;
	caches: CacheSubDir[];
};

const useCacheDirsInfo = (
	start?: any
) : any => {

	const [cacheDirs,setCacheDirs] = useState<CacheDir[]>( [] );

    useEffect( () => {
		if ( undefined === start || ( undefined !== start && start ) ) {
            FsModule.getCacheInfo().then( ( cacheDirs : CacheDir[] ) => {
				setCacheDirs( cacheDirs );
            } ).catch( ( err : any ) => console.log( err ) );
		}
	}, [start] );

	return cacheDirs;
};

export default useCacheDirsInfo;