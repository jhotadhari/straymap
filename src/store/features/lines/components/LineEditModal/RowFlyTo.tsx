/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { Bbox, useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { AppContext } from '../../../../../Context';
import { useAppSelector } from '../../../../hooks';
import { selectSelectedInfos } from '../../selectors';
import { sharedStyles } from './sharedDeps';

const RowFlyTo: FC = () => {
	const theme = useTheme();

	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const { line } = useContext(LineEditModalContext);

	const { selectedIds } = useAppSelector(selectSelectedInfos);

	const isSelected = useMemo(() => selectedIds.includes(line?.id ?? -1), [selectedIds, line?.id]);

	const handlePress = useCallback(() => {
		if (line?.envelope && mapViewNativeNodeHandle && isSelected) {
			const ring = line.envelope.coordinates[0];
			const lngs = ring.map((c) => c[0]);
			const lats = ring.map((c) => c[1]);
			const bbox: Bbox = [
				Math.min(...lngs),
				Math.min(...lats),
				Math.max(...lngs),
				Math.max(...lats),
			];
			flyToBounds(bbox, { paddingPx: 64 });
		}
	}, [
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
				opacity: 0.5,
				borderColor: theme.colors.onSurfaceDisabled,
			}),
		}),
		[theme, disabled]
	);

	return (
		<InfoRowControl label={'fly to'}>
			<ButtonHighlight
				style={buttonStyle}
				mode="outlined"
				compact={true}
				disabled={disabled}
				onPress={handlePress}
				icon={'crosshairs-gps'}
				contentStyle={sharedStyles.buttonContent}
				labelStyle={sharedStyles.buttonLabel}
				textColor={theme.colors.onBackground}
			>
				{'fly to'}
			</ButtonHighlight>
		</InfoRowControl>
	);
};

export default RowFlyTo;
