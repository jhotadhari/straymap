/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Bbox, useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { AppContext } from '../../../../Context';
import { useAppSelector } from '../../../../store/hooks';
import { selectSelected } from '../../selectors';
import { sharedStyles } from './sharedDeps';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { bbox as turfBbox } from '@turf/turf';
import { MAP_ANIMATION_PADDING_PX } from '../../../../constants';

const RowFlyTo: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { mapViewNativeNodeHandle, drawerControlsRef } = useContext(AppContext);

	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const { line, onDismiss } = useContext(LineEditModalContext);

	const selectedIds = useAppSelector(selectSelected);

	const isSelected = useMemo(() => selectedIds.includes(line?.id ?? -1), [selectedIds, line?.id]);

	const handlePress = useCallback(() => {
		if (line?.envelope && mapViewNativeNodeHandle && isSelected) {
			const bbox = turfBbox(line.envelope);
			flyToBounds(bbox, { paddingPx: MAP_ANIMATION_PADDING_PX });
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

	const buttonStyle = useMemo(
		() => ({
			borderColor: theme.colors.onBackground,
			...(disabled && {
				...appSharedStyles.disabled,
				borderColor: theme.colors.onSurfaceDisabled,
			}),
		}),
		[theme, disabled]
	);

	return (
		<InfoLabelRow
			label={t('lines.flyTo')}
			Info={t('lines.hintFlyTo')}
		>
			<ButtonHighlight
				style={buttonStyle}
				mode="outlined"
				compact={true}
				disabled={disabled}
				onPress={handlePress}
				icon={'image-filter-center-focus-strong-outline'}
				contentStyle={sharedStyles.buttonContent}
				labelStyle={sharedStyles.buttonLabel}
				textColor={theme.colors.onBackground}
			>
				{t('lines.flyTo')}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowFlyTo;
