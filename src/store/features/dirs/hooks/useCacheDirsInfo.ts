/**
 * External dependencies
 */
import { useContext, useEffect, useCallback } from 'react';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { FsModule } from '../../../../nativeModules';
import { CacheDir } from '../types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectCacheDirsCache } from '../selectors';
import { setCacheDirsCache } from '../slice';
import { logError } from '../../../../lib/utils';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';

const useCacheDirsInfo = (shouldUpdate?: any): any => {
	const dispatch = useAppDispatch();

	const { t } = useTranslation();

	const { showError } = useContext(ErrorToastContext);

	const cacheDirs = useAppSelector(selectCacheDirsCache);

	const updateCacheDirs = useCallback(() => {
		FsModule.getCacheInfo()
			.then((newCacheDirs) => {
				dispatch(setCacheDirsCache(newCacheDirs as CacheDir[]));
			})
			.catch((err) => {
				logError('useCacheDirsInfo.getCacheInfo', err);
				showError(sprintf(t('errorGeneric'), err?.message ?? String(err)));
			});
	}, [showError, t]);

	useEffect(() => {
		if (shouldUpdate) {
			updateCacheDirs();
		}
	}, [updateCacheDirs, shouldUpdate]);

	return {
		updateCacheDirs,
		cacheDirs,
	};
};

export default useCacheDirsInfo;
