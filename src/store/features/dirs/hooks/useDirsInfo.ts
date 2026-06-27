/**
 * External dependencies
 */
import { useContext, useEffect, useMemo } from 'react';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { FsModule } from '../../../../nativeModules';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { AbsPath, DirInfo, DirInfoMap } from '../types';
import { getDirInfoCacheId } from '../utils';
import { addDirInfoCacheEntry } from '../slice';
import { selectDirsInfoCacheEntry } from '../selectors';
import { logError } from '../../../../lib/utils';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';

const useDirsInfo = ({
	navDirs,
	extensions,
	recursive,
}: {
	navDirs: AbsPath[];
	extensions?: string[];
	recursive?: boolean;
}): { dirsInfo: DirInfoMap | undefined; isLoading: boolean } => {
	const dispatch = useAppDispatch();

	const { t } = useTranslation();

	const { showError } = useContext(ErrorToastContext);

	const dirInfoCacheId = useMemo(
		() =>
			getDirInfoCacheId({
				dispatch,
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
							.catch((err) => {
								logError('useDirsInfo.getInfo', err);
								showError(sprintf(t('errorGeneric'), err?.message ?? String(err)));
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
				.catch((err) => {
					logError('useDirsInfo.addDirInfoCacheEntry', err);
					showError(sprintf(t('errorGeneric'), err?.message ?? String(err)));
				});
		}
	}, [
		navDirs,
		extensions,
		recursive,
		infos,
		dirInfoCacheId,
		showError,
		t,
	]);

	return {
		dirsInfo: infos,
		isLoading: undefined === infos,
	};
};

export default useDirsInfo;
