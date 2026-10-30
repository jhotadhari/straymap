/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useAppSelector, useSystemLineIds } from '../../../../store/hooks';
import { selectSelected } from '../../selectors';
import { selectPausedLineId } from '../../../trackRecording/selectors';
import { useButtonProps } from '../../../../compose/useButtonProps';

const RowToggleOnMap: FC = () => {
	const { t } = useTranslation();

	const { line, selectLine } = useContext(LineEditModalContext);

	const selectedIds = useAppSelector(selectSelected);

	const pausedLineId = useAppSelector(selectPausedLineId);

	const systemLineIds = useSystemLineIds();
	const isSystemLine = useMemo(
		() => Object.values(systemLineIds).includes(line?.id ?? -1),
		[systemLineIds, line?.id]
	);

	const isSelected = useMemo(() => selectedIds.includes(line?.id ?? -1), [selectedIds, line?.id]);

	// System lines can't be removed from the map — except the paused
	// recording line: removing it releases the paused recording mode.
	const disabled = useMemo(
		() => !line?.id || (isSelected && isSystemLine && pausedLineId !== line.id),
		[
			line?.id,
			isSelected,
			isSystemLine,
			pausedLineId,
		]
	);

	const handlePress = useCallback(() => {
		if (!disabled && line?.id) {
			selectLine(line.id, !isSelected);
		}
	}, [
		line?.id,
		isSelected,
		selectLine,
		disabled,
	]);

	const icon = useMemo(() => (isSelected ? 'map-minus' : 'map-plus'), [isSelected]);

	const label = useMemo(
		() => (isSelected ? t('lines.removeFromMap') : t('lines.showOnMap')),
		[isSelected, t]
	);

	const buttonProps = useButtonProps({
		mode: 'outlined',
		disabled,
		paddingHorizontal: true,
	});

	return (
		<InfoLabelRow
			label={label}
			Info={t('lines.hintToggleOnMap')}
		>
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={handlePress}
				icon={icon}
			>
				{label}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowToggleOnMap;
