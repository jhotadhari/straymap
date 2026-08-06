/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import HintLink from '../../../../components/generic/primitives/HintLink';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { getRegexWarnings } from '../../../../lib/regexUtils';
import { sharedStyles } from '../../../../sharedStyles';
import { DatePattern } from '../../types';
import { localStyles } from '../styles';

const styles = StyleSheet.create({
	addInfo: {
		fontSize: 13,
		opacity: 0.7,
		marginBottom: 12,
	},
	addInput: {
		marginBottom: 8,
	},
});

const DatePatternAddPatternModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	pattern?: DatePattern | null;
	onSave: (pattern: DatePattern) => void;
	onDelete?: () => void;
}> = memo(({ visible, onDismiss, pattern, onSave, onDelete }) => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();

	const [label, setLabel] = useState('');
	const [regex, setRegex] = useState('');
	const [format, setFormat] = useState('');

	const isEditing = !!pattern;

	const regexWarning = useMemo(() => {
		if (!regex) return null;
		return getRegexWarnings(regex, {
			checkCaptureGroup: true,
			checkEmptyCaptureGroup: true,
		});
	}, [regex]);

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

	const handleDismiss = useCallback(() => {
		if (regex && format && !regexWarning?.isError) {
			onSave({
				key: pattern?.key ?? '',
				regex,
				format,
				label: label || format,
				enabled: pattern?.enabled ?? true,
				removable: pattern?.removable ?? true,
			});
		}
		onDismiss();
	}, [onDismiss, onSave, pattern, regex, format, label, regexWarning]);

	const handleDelete = useCallback(() => {
		onDelete?.();
		onDismiss();
	}, [onDelete, onDismiss]);

	const buttonPropsDelete = useButtonProps({ isDestructive: true });

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

	const styleRegexWarning = useMemo(
		() => [localStyles.configPreview, { color: theme.colors.error }],
		[theme]
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
						underlineColor="transparent"
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
						underlineColor="transparent"
						dense
						error={!!regexWarning}
						style={styles.addInput}
						placeholder={'(\\d{2}\\.\\d{2}\\.\\d{4})'}
						value={regex}
						onChangeText={setRegex}
					/>
					{regexWarning && (
						<Text
							style={styleRegexWarning}
						>
							{t(regexWarning.key)}
						</Text>
					)}
				</InfoLabelRow>

				<InfoLabelRow
					label={t('import.datePatternFormat')}
					Info={hintFormat}
				>
					<TextInput
						underlineColor="transparent"
						dense
						style={styles.addInput}
						placeholder="DD.MM.YYYY"
						value={format}
						onChangeText={setFormat}
					/>
				</InfoLabelRow>
				<View style={sharedStyles.modalControlsEnd}>
					{onDelete && pattern?.removable && (
						<ButtonHighlight
							onPress={handleDelete}
							{...buttonPropsDelete}
						>
							{t('import.removePattern')}
						</ButtonHighlight>
					)}
				</View>
			</View>
		</ModalWrapper>
	);
});

export default DatePatternAddPatternModal;
