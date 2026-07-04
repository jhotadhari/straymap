/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation();

	const { line, selectLine } = useContext(LineEditModalContext);

	const { selectedIds } = useAppSelector(selectSelectedInfos);

	const isSelected = useMemo(() => selectedIds.includes(line?.id ?? -1), [selectedIds, line?.id]);

	const disabled = useMemo(() => !line?.id, [line?.id]);

	const handlePress = useCallback(() => {
		if (line?.id) {
			selectLine(line.id, !isSelected);
		}
	}, [
		line?.id,
		isSelected,
		selectLine,
	]);

	const icon = useMemo(() => (isSelected ? 'map-minus' : 'map-plus'), [isSelected]);

	const label = useMemo(
		() => (isSelected ? t('lines.hideFromMap') : t('lines.showOnMap')),
		[isSelected, t]
	);

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
			label={label}
			Info={t('lines.hintToggleOnMap')}
		>
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
