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
import { selectMergeMode } from '../../selectors';
import { setMergeMode } from '../../slice';
import { localStyles } from '../styles';

const MergeModeControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const mergeMode = useAppSelector(selectMergeMode);

	const handleToggleMergeMode = useCallback(() => {
		dispatch(setMergeMode(!mergeMode));
	}, [dispatch, mergeMode]);

	return (
		<ToggleRowControl
			label={t('import.mergeMode')}
			value={mergeMode}
			onToggle={handleToggleMergeMode}
			Info={t('import.hint.mergeMode')}
			labelStyle={localStyles.autoWidth}
		/>
	);
};

export default memo(MergeModeControl);
