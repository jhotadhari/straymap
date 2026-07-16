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
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useAppSelector } from '../../../../store/hooks';
import { selectSelected } from '../../selectors';
import { sharedStyles } from './sharedDeps';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';

const RowToggleOnMap: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { line, selectLine } = useContext(LineEditModalContext);

	const selectedIds = useAppSelector(selectSelected);

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
		() => (isSelected ? t('lines.removeFromMap') : t('lines.showOnMap')),
		[isSelected, t]
	);

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
		</InfoLabelRow>
	);
};

export default RowToggleOnMap;
