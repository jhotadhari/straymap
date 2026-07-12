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
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { AppContext } from '../../../../Context';
import { useAppSelector } from '../../../../store/hooks';
import { selectSelected } from '../../selectors';
import { sharedStyles } from './sharedDeps';

const RowFlyTo: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const { line } = useContext(LineEditModalContext);

	const selectedIds = useAppSelector(selectSelected);

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
		<InfoRowControl
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
		</InfoRowControl>
	);
};

export default RowFlyTo;
