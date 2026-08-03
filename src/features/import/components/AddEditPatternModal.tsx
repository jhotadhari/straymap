/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme, TextInput, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import HintLink from '../../../components/generic/primitives/HintLink';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import { useButtonProps } from '../../../compose/useButtonProps';
import { classifyRegex } from '../../../lib/regexUtils';
import { sharedStyles } from '../../../sharedStyles';
import { DatePattern } from '../slice';

const styles = StyleSheet.create({
	addInfo: {
		fontSize: 13,
		opacity: 0.7,
		marginBottom: 12,
	},
	addInput: {
		marginBottom: 8,
	},
	regexFeedback: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginBottom: 8,
	},
	regexFeedbackText: {
		fontSize: 12,
	},
});

const AddEditPatternModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	pattern?: DatePattern | null;
	onSave: (pattern: DatePattern) => void;
}> = memo(({ visible, onDismiss, pattern, onSave }) => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();

	const [label, setLabel] = useState('');
	const [regex, setRegex] = useState('');
	const [format, setFormat] = useState('');
	const [captureWarning, setCaptureWarning] = useState(false);
	const [dangerousWarning, setDangerousWarning] = useState(false);

	const isEditing = !!pattern;

	const buttonPropsCancel = useButtonProps({});
	const buttonPropsAdd = useButtonProps({ disabled: !regex || !format });

	useEffect(() => {
		if (visible) {
			if (pattern) {
				setLabel(pattern.label);
				setRegex(pattern.regex);
				setFormat(pattern.format);
			} else {
				setLabel('');
				setRegex('');
				setFormat('');
			}
		}
	}, [visible, pattern]);

	useEffect(() => {
		if (regex) {
			const result = classifyRegex(regex);
			if (!result.valid) {
				setCaptureWarning(false);
				setDangerousWarning(false);
			} else {
				setCaptureWarning(!regex.includes('('));
				setDangerousWarning(result.dangerous);
			}
		} else {
			setCaptureWarning(false);
			setDangerousWarning(false);
		}
	}, [regex]);

	const handleSave = useCallback(() => {
		if (!regex || !format) return;
		onSave({
			key: pattern?.key ?? '',
			regex,
			format,
			label: label || format,
			enabled: pattern?.enabled ?? true,
			removable: pattern?.removable ?? true,
		});
		onDismiss();
	}, [
		onDismiss,
		onSave,
		pattern,
		label,
		regex,
		format,
	]);

	const handleDismiss = useCallback(() => {
		setCaptureWarning(false);
		onDismiss();
	}, [onDismiss]);

	const hintRegex = useMemo(
		() => (
			<View style={sharedStyles.gap}>
				<Text>{t('import.hint.datePatternRegex')}</Text>
				<Text>{t('hint.regex.body')}</Text>
				<HintLink url="https://regexr.com/" />
			</View>
		),
		[t]
	);

	const dayJsUrl = useMemo(
		() =>
			i18n.language === 'es'
				? 'https://day.js.org/docs/es-ES/display/format'
				: 'https://day.js.org/docs/en/display/format',
		[i18n.language]
	);

	const hintFormat = useMemo(
		() => (
			<View style={sharedStyles.gap}>
				<Text>{t('import.hint.datePatternFormat')}</Text>
				<Text>{t('import.formatDocs')}</Text>
				<HintLink url={dayJsUrl} />
			</View>
		),
		[t, dayJsUrl]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			headerLabel={isEditing ? t('import.editPattern') : t('import.addPattern')}
			backgroundBlur={false}
		>
			<View style={sharedStyles.modal}>
				<Text style={styles.addInfo}>{t('import.hint.addPattern')}</Text>

				<InfoLabelRow
					label={t('import.datePatternLabel')}
					Info={t('import.hint.datePatternLabel')}
				>
					<TextInput
						dense
						style={styles.addInput}
						placeholder="e.g. EU date"
						value={label}
						onChangeText={setLabel}
					/>
				</InfoLabelRow>

				<InfoLabelRow
					label={t('import.datePatternRegex')}
					Info={hintRegex}
				>
					<TextInput
						dense
						style={styles.addInput}
						placeholder={'(\\d{2}\\.\\d{2}\\.\\d{4})'}
						value={regex}
						onChangeText={setRegex}
					/>
				</InfoLabelRow>

				{captureWarning && (
					<View style={styles.regexFeedback}>
						<Icon
							source="alert"
							size={14}
							color={theme.colors.tertiary}
						/>
						<Text
							style={[
								styles.regexFeedbackText,
								{ color: theme.colors.tertiary },
							]}
						>
							{t('import.regexNoCaptureGroup')}
						</Text>
					</View>
				)}

				{dangerousWarning && (
					<View style={styles.regexFeedback}>
						<Icon
							source="alert"
							size={14}
							color={theme.colors.tertiary}
						/>
						<Text
							style={[
								styles.regexFeedbackText,
								{ color: theme.colors.tertiary },
							]}
						>
							{t('import.regexExpensive')}
						</Text>
					</View>
				)}

				<InfoLabelRow
					label={t('import.datePatternFormat')}
					Info={hintFormat}
				>
					<TextInput
						dense
						style={styles.addInput}
						placeholder="DD.MM.YYYY"
						value={format}
						onChangeText={setFormat}
					/>
				</InfoLabelRow>
				<View style={sharedStyles.modalControls}>
					<ButtonHighlight
						{...buttonPropsCancel}
						onPress={handleDismiss}
					>
						{t('import.cancel')}
					</ButtonHighlight>
					<ButtonHighlight
						{...buttonPropsAdd}
						onPress={handleSave}
					>
						{isEditing ? t('import.save') : t('import.add')}
					</ButtonHighlight>
				</View>
			</View>
		</ModalWrapper>
	);
});

export default AddEditPatternModal;
