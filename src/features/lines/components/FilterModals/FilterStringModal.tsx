/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import HintLink from '../../../../components/generic/primitives/HintLink';
import RadioListItem from '../../../../components/generic/wrapper/RadioListItem';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { sharedStyles } from './sharedDeps';
import { StringColumnFilter, StringFilterOperator, getFilterKey } from '../../types';

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

	const buttonPropsDelete = useButtonProps({ isDestructive: true });

	const [operator, setOperator] = useState<StringFilterOperator>(
		existingFilter?.operator ?? 'includes'
	);
	const [value, setValue] = useState<string>(existingFilter?.value ?? '');

	const [regexError, setRegexError] = useState<string | null>(null);
	const [regexWarning, setRegexWarning] = useState<string | null>(null);

	const saveRef = useRef<undefined | (() => void)>(undefined);

	useEffect(() => {
		saveRef.current = () => {
			// Don't save an invalid regex — let the user fix it first.
			if (operator === 'regex' && value) {
				try {
					RegExp(value);
				} catch {
					return;
				}
			}
			// Save when value is non-empty, OR when an existing filter
			// exists (clearing the value removes the filter for this
			// column).  If there's no existing filter and the value is
			// empty, skip — don't create a meaningless empty entry.
			if (value || existingFilter) {
				const newFilter: StringColumnFilter = {
					type: 'string',
					columnKey,
					operator,
					value,
				};
				// If editing a filter whose key changed (e.g.,
				// different value or operator), remove the old
				// entry so no stale entry with the old key remains.
				if (existingFilter && getFilterKey(existingFilter) !== getFilterKey(newFilter)) {
					onDelete?.();
				}
				onSave(newFilter);
			}
		};
	}, [
		columnKey,
		operator,
		value,
		onSave,
		onDelete,
		existingFilter,
	]);

	const prevVisibleRef = useRef(false);
	useEffect(() => {
		const justOpened = visible && !prevVisibleRef.current;
		prevVisibleRef.current = visible;
		if (justOpened) {
			setOperator(existingFilter?.operator ?? 'includes');
			setValue(existingFilter?.value ?? '');
			setRegexError(null);
			setRegexWarning(null);
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

	const handleChangeText = useCallback(
		(text: string) => {
			setValue(operator === 'regex' ? text : text.toLowerCase());
			if (operator === 'regex' && text) {
				try {
					RegExp(text);
					setRegexError(null);
				} catch {
					setRegexError(t('lines.regexInvalid'));
					setRegexWarning(null);
					return;
				}
				const dangerous = /\([^)]*[+*?]\)[+*{]/;
				if (dangerous.test(text)) {
					setRegexWarning(t('lines.regexExpensive'));
				} else {
					setRegexWarning(null);
				}
			} else {
				setRegexError(null);
				setRegexWarning(null);
			}
		},
		[operator, t]
	);

	const extractLabel = useCallback((a: { label: string }) => a.label, []);

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
				borderColor: regexError
					? theme.colors.error
					: regexWarning
						? theme.colors.tertiary
						: theme.colors.outline,
			},
		],
		[theme, regexError, regexWarning]
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
					labelExtractor={extractLabel}
				/>
			))}

			<InfoLabelRow
				label={t('lines.filterValue')}
				Info={hintStringFilterInfo}
			>
				<TextInput
					style={inputStyle}
					value={value}
					onChangeText={handleChangeText}
					maxLength={300}
					placeholder={operator === 'regex' ? '^Mount.*' : t('lines.filterValue')}
					placeholderTextColor={theme.colors.outline}
				/>
				{regexError && (
					<View style={localStyles.regexFeedback}>
						<Icon source="alert-circle" size={14} color={theme.colors.error} />
						<Text style={[localStyles.regexFeedbackText, { color: theme.colors.error }]}>
							{regexError}
						</Text>
					</View>
				)}
				{!regexError && regexWarning && (
					<View style={localStyles.regexFeedback}>
						<Icon source="alert" size={14} color={theme.colors.tertiary} />
						<Text style={[localStyles.regexFeedbackText, { color: theme.colors.tertiary }]}>
							{regexWarning}
						</Text>
					</View>
				)}
			</InfoLabelRow>

			{onDelete && (
				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDelete}
						{...buttonPropsDelete}
					>
						{t('lines.removeFilter')}
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
	regexFeedback: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginTop: 4,
	},
	regexFeedbackText: {
		fontSize: 12,
	},
});

export default FilterStringModal;
