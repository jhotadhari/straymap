/**
 * External dependencies
 */
import { FC, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectKeepAppActive } from '../../selectors';
import { setKeepAppActive } from '../../slice';
import ensureNotificationPermission from '../../../../lib/notificationPermission';
import { localStyles } from '../styles';

const KeepAppActiveControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const keepAppActive = useAppSelector(selectKeepAppActive);

	const handleToggleKeepAppActive = useCallback(async () => {
		const next = !keepAppActive;
		if (next) {
			const granted = await ensureNotificationPermission();
			if (!granted) {
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
