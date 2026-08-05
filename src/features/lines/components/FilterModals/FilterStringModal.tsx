/**
 * External dependencies
 */
import { FC, Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
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
import { getRegexWarnings, RegexValidationMessage } from '../../../../lib/regexUtils';

const extractLabel = (a: { label: string }) => a.label;

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

	const [regexValidation, setRegexValidation] = useState<RegexValidationMessage | null>(null);

	const saveRef = useRef<undefined | (() => void)>(undefined);

	const validateRegex = useCallback((text: string) => {
		setRegexValidation(getRegexWarnings(text));
	}, []);

	useEffect(() => {
		if (operator !== 'regex') {
			setRegexValidation(null);
		}
	}, [operator]);

	useEffect(() => {
		saveRef.current = () => {
			// Don't save an invalid regex — let the user fix it first.
			if (operator === 'regex' && value) {
				if (getRegexWarnings(value)) return;
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
			if (existingFilter?.operator === 'regex' && existingFilter?.value) {
				validateRegex(existingFilter.value);
			} else {
				setRegexValidation(null);
			}
		}
	}, [
		visible,
		existingFilter,
		validateRegex,
	]);

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
				validateRegex(text);
			} else {
				setRegexValidation(null);
			}
		},
		[operator, validateRegex]
	);

	const columnLabel = useMemo(() => t(`lines.columns.${columnKey}`), [t, columnKey]);

	const operatorOptions = useMemo(
		() =>
			OPERATORS.map((op) => ({
				key: op,
				label: t(`lines.filter${op.charAt(0).toUpperCase() + op.slice(1)}`),
			})),
		[t]
	);

	const hintStringFilterInfo = useMemo(() => {
		const paragraphs = t('lines.hintStringFilter').split('\n\n');
		const regexIdx = paragraphs.findIndex((p) => p.includes('regex'));
		return (
			<View style={appSharedStyles.gap}>
				{paragraphs.map((text, i) => (
					<Fragment key={i}>
						<Text>{text}</Text>
						{regexIdx === i && <HintLink url="https://regexr.com/" />}
					</Fragment>
				))}
			</View>
		);
	}, [t]);

	const styleRegexWarning = useMemo(
		() => [localStyles.regexFeedbackText, { color: theme.colors.error }],
		[theme]
	);

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
					underlineColor="transparent"
					error={!!regexValidation}
					value={value}
					onChangeText={handleChangeText}
					dense={true}
					maxLength={300}
					placeholder={operator === 'regex' ? '^Mount.*' : t('lines.filterValue')}
				/>
				{regexValidation && (
					<Text
						style={styleRegexWarning}
					>
						{t(regexValidation.key)}
					</Text>
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
	regexFeedbackText: {
		marginTop: 2,
	},
});

export default memo(FilterStringModal);
