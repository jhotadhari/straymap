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
import HintLink from '../../../../../../components/generic/HintLink';
import RadioListItem from '../../../../../../components/generic/RadioListItem';
import { sharedStyles as appSharedStyles } from '../../../../../../sharedStyles';
import { sharedStyles } from '../sharedDeps';
import { StringColumnFilter, StringFilterOperator } from '../../../types';
import { dbConnection } from '../../../../dbLoader/DBConnection';

const OPERATORS: StringFilterOperator[] = [
	'includes',
	'excludes',
	'startsWith',
	'endsWith',
	'regex',
];

const FilterStringModal: FC<{
	visible: boolean;
	columnKey: string;
	existingFilter?: StringColumnFilter;
	onDismiss: () => void;
	onSave: (filter: StringColumnFilter) => void;
	onDelete?: () => void;
}> = ({ visible, columnKey, existingFilter, onDismiss, onSave, onDelete }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [operator, setOperator] = useState<StringFilterOperator>(
		existingFilter?.operator ?? 'includes'
	);
	const [value, setValue] = useState<string>(existingFilter?.value ?? '');

	const saveRef = useRef<undefined | (() => void)>(undefined);

	useEffect(() => {
		saveRef.current = () => {
			if (value) {
				onSave({
					type: 'string',
					columnKey,
					operator,
					value,
				});
			}
		};
	}, [columnKey, operator, value, onSave]);

	const prevVisibleRef = useRef(false);
	useEffect(() => {
		const justOpened = visible && !prevVisibleRef.current;
		prevVisibleRef.current = visible;
		if (justOpened) {
			setOperator(existingFilter?.operator ?? 'includes');
			setValue(existingFilter?.value ?? '');
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

	const operatorOptions = useMemo(
		() =>
			OPERATORS.map((op) => ({
				key: op,
				label: t(`lines.filter${op.charAt(0).toUpperCase() + op.slice(1)}`),
			})),
		[t]
	);

	const regexUnavailable = operator === 'regex' && !dbConnection.regexpAvailable;

	const inputStyle = useMemo(
		() => [
			localStyles.input,
			{
				color: theme.colors.onSurface,
				borderColor: regexUnavailable
					? theme.colors.error
					: theme.colors.outline,
			},
		],
		[theme, regexUnavailable]
	);

	const stringFilterInfo = useMemo(
		() => (
			<View>
				<Text>{t('lines.hintStringFilter')}</Text>
			</View>
		),
		[t]
	);

	const regexInfo = useMemo(
		() => (
			<View>
				<Text style={localStyles.regexInfoText}>{t('lines.regexInfo')}</Text>
				<HintLink
					label="regexr.com"
					url="https://regexr.com/"
				/>
			</View>
		),
		[t]
	);

	const infoForOperator = operator === 'regex' ? regexInfo : stringFilterInfo;

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			header={columnLabel}
			innerStyle={sharedStyles.modalInner}
		>
			{operatorOptions.map((opt) => (
				<RadioListItem
					key={opt.key}
					opt={opt}
					onPress={() => setOperator(opt.key as StringFilterOperator)}
					status={operator === opt.key ? 'checked' : 'unchecked'}
					labelExtractor={(a) => a.label}
				/>
			))}

			<InfoRowControl
				label={t('lines.filterValue')}
				Info={infoForOperator}
			>
				<TextInput
					style={inputStyle}
					value={value}
					onChangeText={setValue}
					placeholder={operator === 'regex' ? '^Mount.*' : t('lines.filterValue')}
					placeholderTextColor={theme.colors.outline}
				/>
			</InfoRowControl>

			{regexUnavailable && (
				<Text style={[localStyles.regexUnavailableText, { color: theme.colors.error }]}>
					{t('lines.regexUnavailable')}
				</Text>
			)}

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

const localStyles = StyleSheet.create({
	input: {
		borderWidth: 1,
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		minWidth: 150,
		textAlign: 'right',
	},
	regexInfoText: {
		marginBottom: 12,
	},
	regexUnavailableText: {
		fontSize: 12,
	},
});

export default FilterStringModal;
