/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { useAppSelector } from '../../../../hooks';
import { selectSelectedInfos } from '../../selectors';
import { sharedStyles } from './sharedDeps';

const RowToggleOnMap: FC = () => {
	const theme = useTheme();

	const { line, selectLine } = useContext(LineEditModalContext);

	const { selectedIds } = useAppSelector(selectSelectedInfos);

	const isSelected = useMemo(
		() => selectedIds.includes(line?.id ?? -1),
		[selectedIds, line?.id]
	);

	const disabled = useMemo(() => !line?.id, [line?.id]);

	const handlePress = useCallback(() => {
		if (line?.id) {
			selectLine(line.id, !isSelected);
		}
	}, [line?.id, isSelected, selectLine]);

	const icon = useMemo(() => (isSelected ? 'map-minus' : 'map-plus'), [isSelected]);

	const label = useMemo(() => (isSelected ? 'Hide from map' : 'Show on map'), [isSelected]);

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
		<InfoRowControl label={label}>
			<ButtonHighlight
				style={buttonStyle}
				mode="outlined"
				compact={true}
				disabled={disabled}
				onPress={handlePress}
				icon={icon}
				contentStyle={sharedStyles.buttonContent}
				labelStyle={sharedStyles.buttonLabel}
				textColor={theme.colors.onBackground}
			>
				{label}
			</ButtonHighlight>
		</InfoRowControl>
	);
};

export default RowToggleOnMap;
