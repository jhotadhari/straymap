/**
 * External dependencies
 */
import { FC, memo, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectKeepAppActive } from '../../selectors';
import { setKeepAppActive } from '../../slice';
import { localStyles } from '../styles';

const KeepAppActiveControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const keepAppActive = useAppSelector(selectKeepAppActive);

	const handleToggleKeepAppActive = useCallback(async () => {
		const next = !keepAppActive;
		if (next && Platform.OS === 'android' && Platform.Version >= 33) {
			try {
				const result = await PermissionsAndroid.request(
					'android.permission.POST_NOTIFICATIONS'
				);
				if (result !== PermissionsAndroid.RESULTS.GRANTED) {
					return;
				}
			} catch {
				return;
			}
		}
		dispatch(setKeepAppActive(next));
	}, [keepAppActive, dispatch]);

	return (
		<ToggleRowControl
			label={t('import.keepAppActive')}
			value={keepAppActive}
			onToggle={handleToggleKeepAppActive}
			Info={t('import.hint.keepAppActive')}
			labelStyle={localStyles.autoWidth}
		/>
	);
};

export default memo(KeepAppActiveControl);
