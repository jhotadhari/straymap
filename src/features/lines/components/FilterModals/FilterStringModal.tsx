/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import HintLink from '../../../../components/generic/primitives/HintLink';
import RadioListItem from '../../../../components/generic/wrapper/RadioListItem';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { sharedStyles } from './sharedDeps';
import { StringColumnFilter, StringFilterOperator } from '../../types';

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
			// Save when value is non-empty, OR when an existing filter
			// exists (clearing the value removes the filter for this
			// column).  If there's no existing filter and the value is
			// empty, skip — don't create a meaningless empty entry.
			if (value || existingFilter) {
				onSave({
					type: 'string',
					columnKey,
					operator,
					value,
				});
			}
		};
	}, [
		columnKey,
		operator,
		value,
		onSave,
		existingFilter,
	]);

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

	const inputStyle = useMemo(
		() => [
			localStyles.input,
			{
				color: theme.colors.onSurface,
				borderColor: theme.colors.outline,
			},
		],
		[theme]
	);

	const hintStringFilterInfo = useMemo(() => {
		const paragraphs = t('lines.hintStringFilter').split('\n\n');
		const regexIdx = paragraphs.findIndex((p) => p.includes('regex'));
		return (
			<View>
				{paragraphs.map((text, i) => (
					<Fragment key={i}>
						<Text
							style={
								i < paragraphs.length - 1 ? localStyles.hintParagraph : undefined
							}
						>
							{text}
						</Text>

						{i === regexIdx && <HintLink url="https://regexr.com/" />}
					</Fragment>
				))}
			</View>
		);
	}, [t]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			headerLabel={columnLabel}
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

			<InfoLabelRow
				label={t('lines.filterValue')}
				Info={hintStringFilterInfo}
			>
				<TextInput
					style={inputStyle}
					value={value}
					onChangeText={setValue}
					placeholder={operator === 'regex' ? '^Mount.*' : t('lines.filterValue')}
					placeholderTextColor={theme.colors.outline}
				/>
			</InfoLabelRow>

			{onDelete && (
				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDelete}
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('lines.removeFilter')}</Text>
					</ButtonHighlight>
				</View>
			)}
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
	hintParagraph: {
		marginBottom: 12,
	},
});

export default FilterStringModal;
