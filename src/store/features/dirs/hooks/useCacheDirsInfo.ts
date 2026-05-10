/**
 * External dependencies
 */
import { useEffect, useCallback } from 'react';

/**
 * Internal dependencies
 */
import { FsModule } from '../../../../nativeModules';
import { CacheDir } from '../types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectCacheDirsCache } from '../selectors';
import { setCacheDirsCache } from '../dirsSlice';

const useCacheDirsInfo = (shouldUpdate?: any): any => {
	const dispatch = useAppDispatch();

	const cacheDirs = useAppSelector(selectCacheDirsCache);

	const updateCacheDirs = useCallback(() => {
		FsModule.getCacheInfo()
			.then((newCacheDirs: CacheDir[]) => {
				dispatch(setCacheDirsCache(newCacheDirs));
			})
			.catch((err: any) => console.log(err));
	}, []);

	useEffect(() => {
		if (shouldUpdate) {
			updateCacheDirs();
		}
	}, [
		updateCacheDirs,
		shouldUpdate,
	]);

	return {
		updateCacheDirs,
		cacheDirs,
	};
};

export default useCacheDirsInfo;
