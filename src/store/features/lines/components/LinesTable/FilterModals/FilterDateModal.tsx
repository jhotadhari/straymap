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
import { DateColumnFilter } from '../../../types';

const FilterDateModal: FC<{
	visible: boolean;
	columnKey: string;
	existingFilter?: DateColumnFilter;
	onDismiss: () => void;
	onSave: (filter: DateColumnFilter) => void;
	onDelete?: () => void;
}> = ({ visible, columnKey, existingFilter, onDismiss, onSave, onDelete }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [minVal, setMinVal] = useState<string | undefined>(existingFilter?.min);
	const [maxVal, setMaxVal] = useState<string | undefined>(existingFilter?.max);

	const saveRef = useRef<undefined | (() => void)>(undefined);

	useEffect(() => {
		saveRef.current = () => {
			if (minVal !== undefined || maxVal !== undefined) {
				onSave({
					type: 'date',
					columnKey,
					min: minVal,
					max: maxVal,
				});
			}
		};
	}, [
		columnKey,
		minVal,
		maxVal,
		onSave,
	]);

	useEffect(() => {
		if (visible) {
			setMinVal(existingFilter?.min);
			setMaxVal(existingFilter?.max);
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
			<InfoRowControl label={t('lines.filterMin')}>
				<TextInput
					style={inputStyle}
					value={minVal ?? ''}
					onChangeText={setMinVal}
					placeholder="YYYY-MM-DD"
					placeholderTextColor={theme.colors.outline}
				/>
			</InfoRowControl>

			<InfoRowControl label={t('lines.filterMax')}>
				<TextInput
					style={inputStyle}
					value={maxVal ?? ''}
					onChangeText={setMaxVal}
					placeholder="YYYY-MM-DD"
					placeholderTextColor={theme.colors.outline}
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
						<Text>{t('lines.deleteFilter')}</Text>
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

export default FilterDateModal;
