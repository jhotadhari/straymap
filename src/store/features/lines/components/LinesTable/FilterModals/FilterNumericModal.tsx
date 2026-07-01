/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
import { sharedStyles as appSharedStyles } from '../../../../../../sharedStyles';
import { sharedStyles } from '../sharedDeps';
import { NumericColumnFilter } from '../../../types';

const nbToStr = (val: number | undefined): string => {
	if (val === undefined) {
		return '';
	}
	return val.toString();
};

const strToNb = (val: string): number | undefined => {
	const trimmed = val.trim();
	if (trimmed === '' || trimmed === '-') {
		return undefined;
	}
	const parsed = parseFloat(trimmed.replace(/,/g, '.'));
	if (isNaN(parsed)) {
		return undefined;
	}
	return parsed;
};

const FilterNumericModal: FC<{
	visible: boolean;
	columnKey: string;
	existingFilter?: NumericColumnFilter;
	onDismiss: () => void;
	onSave: (filter: NumericColumnFilter) => void;
	onDelete?: () => void;
}> = ({ visible, columnKey, existingFilter, onDismiss, onSave, onDelete }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [minVal, setMinVal] = useState<string>(nbToStr(existingFilter?.min));
	const [maxVal, setMaxVal] = useState<string>(nbToStr(existingFilter?.max));

	const saveRef = useRef<undefined | (() => void)>(undefined);

	useEffect(() => {
		saveRef.current = () => {
			const minNb = strToNb(minVal);
			const maxNb = strToNb(maxVal);
			if (minNb !== undefined || maxNb !== undefined) {
				onSave({
					type: 'numeric',
					columnKey,
					min: minNb,
					max: maxNb,
				});
			}
		};
	}, [columnKey, minVal, maxVal, onSave]);

	const prevVisibleRef = useRef(false);
	useEffect(() => {
		const justOpened = visible && !prevVisibleRef.current;
		prevVisibleRef.current = visible;
		if (justOpened) {
			setMinVal(nbToStr(existingFilter?.min));
			setMaxVal(nbToStr(existingFilter?.max));
		}
	}, [visible, existingFilter]);

	const handleDismiss = useCallback(() => {
		saveRef.current?.();
		onDismiss();
	}, [onDismiss]);

	const handleDelete = useCallback(() => {
		onDelete?.();
		onDismiss();
	}, [onDelete, onDismiss]);

	const columnLabel = useMemo(() => t(`lines.columns.${columnKey}`), [t, columnKey]);

	const inputStyle = useMemo(
		() => [
			styles.input,
			{
				color: theme.colors.onSurface,
				borderColor: theme.colors.outline,
			},
		],
		[theme]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			header={columnLabel}
			innerStyle={sharedStyles.modalInner}
		>
			<InfoRowControl
				label={t('lines.filterMin')}
				Info={t('lines.hintNumericFilter')}
			>
				<TextInput
					style={inputStyle}
					value={minVal}
					onChangeText={setMinVal}
					placeholder="-"
					placeholderTextColor={theme.colors.outline}
					keyboardType="numeric"
				/>
			</InfoRowControl>

			<InfoRowControl
				label={t('lines.filterMax')}
				Info={t('lines.hintNumericFilter')}
			>
				<TextInput
					style={inputStyle}
					value={maxVal}
					onChangeText={setMaxVal}
					placeholder="-"
					placeholderTextColor={theme.colors.outline}
					keyboardType="numeric"
				/>
			</InfoRowControl>

			<View style={appSharedStyles.modalControls}>
				<ButtonHighlight
					onPress={handleDismiss}
					mode="contained"
					buttonColor={get(theme.colors, 'successContainer')}
					textColor={get(theme.colors, 'onSuccessContainer')}
				>
					<Text>{t('lines.saveFilter')}</Text>
				</ButtonHighlight>

				{onDelete && (
					<ButtonHighlight
						onPress={handleDelete}
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('lines.removeFilter')}</Text>
					</ButtonHighlight>
				)}
			</View>
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	input: {
		borderWidth: 1,
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		minWidth: 150,
		textAlign: 'right',
	},
});

export default FilterNumericModal;
