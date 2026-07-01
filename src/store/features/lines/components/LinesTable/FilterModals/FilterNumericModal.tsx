/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import NumericRowControl from '../../../../../../components/generic/controls/NumericRowControl';
import { sharedStyles as appSharedStyles } from '../../../../../../sharedStyles';
import { sharedStyles } from '../sharedDeps';
import { NumericColumnFilter } from '../../../types';

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

	const [minVal, setMinVal] = useState<number | undefined>(existingFilter?.min);
	const [maxVal, setMaxVal] = useState<number | undefined>(existingFilter?.max);

	const saveRef = useRef<undefined | (() => void)>(undefined);

	useEffect(() => {
		saveRef.current = () => {
			if (minVal !== undefined || maxVal !== undefined) {
				onSave({
					type: 'numeric',
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

	// Re-sync when opening for a different filter
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

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			header={columnLabel}
			innerStyle={sharedStyles.modalInner}
		>
			<NumericRowControl
				label={t('lines.filterMin')}
				value={minVal ?? 0}
				onUpdate={setMinVal}
				numType="float"
			/>

			<NumericRowControl
				label={t('lines.filterMax')}
				value={maxVal ?? 0}
				onUpdate={setMaxVal}
				numType="float"
			/>

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

export default FilterNumericModal;
