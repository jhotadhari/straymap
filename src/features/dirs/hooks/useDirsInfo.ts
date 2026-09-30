/**
 * External dependencies
 */
import { useContext, useEffect, useMemo, useRef } from 'react';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { FsModule } from '../../../nativeModules';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { AbsPath, DirInfo, DirInfoMap } from '../types';
import { getDirInfoCacheId } from '../utils';
import { addDirInfoCacheEntry } from '../slice';
import { selectDirsInfoCacheEntry } from '../selectors';
import { logError } from '../../../lib/utils';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';

const useDirsInfo = ({
	navDirs,
	extensions,
	recursive,
	skipCache = false,
}: {
	navDirs: AbsPath[];
	extensions?: string[];
	recursive?: boolean;
	skipCache?: boolean;
}): { dirsInfo: DirInfoMap | undefined; isLoading: boolean } => {
	const dispatch = useAppDispatch();

	const { t } = useTranslation();

	const { showError } = useContext(ErrorToastContext);

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

	// Read through a per-render ref so the effect never re-runs merely
	// because the cached entry reference changed — with skipCache that
	// would make every fetch dispatch a fresh entry and loop forever.
	const infosRef = useRef(infos);
	infosRef.current = infos;

	useEffect(() => {
		if (skipCache || undefined === infosRef.current) {
			Promise.all(
				navDirs.map((navDir) => {
					return new Promise((resolve: (value: DirInfoMap | false) => void) => {
						FsModule.getInfo(
							navDir,
							extensions && extensions.length ? extensions : null,
							!!recursive,
							null,
							null
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
					maps.forEach((dirInfoMap: DirInfoMap | false) => {
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
		skipCache,
		dirInfoCacheId,
		showError,
		t,
		dispatch,
	]);

	return useMemo(
		() => ({
			dirsInfo: infos,
			isLoading: undefined === infos,
		}),
		[infos]
	);
};

export default useDirsInfo;
