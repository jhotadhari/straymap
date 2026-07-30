/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { AppContext } from '../../../../Context';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectSelected } from '../../selectors';
import { bbox as turfBbox } from '@turf/turf';
import { MAP_ANIMATION_PADDING_PX } from '../../../../constants';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { setUiItemKeys } from '../../../ui/slice';

const RowFlyTo: FC = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { mapViewNativeNodeHandle, drawerControlsRef } = useContext(AppContext);

	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const { line, onDismiss } = useContext(LineEditModalContext);

	const selectedIds = useAppSelector(selectSelected);

	const isSelected = useMemo(() => selectedIds.includes(line?.id ?? -1), [selectedIds, line?.id]);

	const handlePress = useCallback(() => {
		if (line?.envelope && mapViewNativeNodeHandle && isSelected) {
			const bbox = turfBbox(line.envelope);
			flyToBounds(bbox, { paddingPx: MAP_ANIMATION_PADDING_PX });
			// close ui items.
			dispatch(setUiItemKeys([]));
			// Close modal.
			onDismiss();
			// Close drawers.
			drawerControlsRef.current?.left.expand(false);
			drawerControlsRef.current?.right.expand(false);
		}
	}, [
		drawerControlsRef,
		onDismiss,
		flyToBounds,
		mapViewNativeNodeHandle,
		line?.envelope,
		isSelected,
	]);

	const disabled = useMemo(() => !line?.envelope || !isSelected, [line?.envelope, isSelected]);

	const buttonProps = useButtonProps({
		mode: 'outlined',
		disabled,
		paddingHorizontal: true,
	});

	return (
		<InfoLabelRow
			label={t('lines.flyTo')}
			Info={t('lines.hintFlyTo')}
		>
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={handlePress}
				icon={'image-filter-center-focus-strong-outline'}
			>
				{t('lines.flyTo')}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowFlyTo;
