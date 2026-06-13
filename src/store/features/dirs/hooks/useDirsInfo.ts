/**
 * External dependencies
 */
import { useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { FsModule } from '../../../../nativeModules';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { AbsPath, DirInfo, DirInfoMap } from '../types';
import { getDirInfoCacheId } from '../utils';
import { addDirInfoCacheEntry } from '../slice';
import { selectDirsInfoCacheEntry } from '../selectors';

const useDirsInfo = ({
	navDirs,
	extensions,
	recursive,
}: {
	navDirs: AbsPath[];
	extensions?: string[];
	recursive?: boolean;
}): DirInfoMap | undefined => {
	const dispatch = useAppDispatch();

	const dirInfoCacheId = useMemo(
		() =>
			getDirInfoCacheId({
				navDirs,
				extensions,
				recursive,
			}),
		[
			navDirs,
			extensions,
			recursive,
		]
	);

	const infos = useAppSelector((state) => selectDirsInfoCacheEntry(state, dirInfoCacheId));

	useEffect(() => {
		if (undefined === infos) {
			Promise.all(
				[...navDirs].map((navDir) => {
					return new Promise((resolve: (value: DirInfoMap | false) => void) => {
						FsModule.getInfo(
							navDir,
							extensions && extensions.length ? extensions : null,
							!!recursive
						)
							.then(async (info: DirInfo) => {
								if (info) {
									resolve({ [navDir]: info });
								} else {
									resolve(false);
								}
							})
							.catch((err: any) => {
								console.log(err);
								resolve(false);
							});
					});
				})
			)
				.then((maps: (false | DirInfoMap)[]) => {
					let newInfos: DirInfoMap = {};
					[...maps].map((dirInfoMap: DirInfoMap | false) => {
						if (dirInfoMap) {
							newInfos = {
								...newInfos,
								...dirInfoMap,
							};
						}
					});
					dispatch(
						addDirInfoCacheEntry({
							id: dirInfoCacheId,
							entry: newInfos,
						})
					);
				})
				.catch((err: any) => console.log(err));
		}
	}, [
		navDirs,
		extensions,
		recursive,
		infos,
		dirInfoCacheId,
	]);

	return infos;
};

export default useDirsInfo;
