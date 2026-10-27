/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import { selectResumePromptPending } from '../selectors';
import { confirmRecordingResume, stopRecording } from '../slice';

/**
 * Shown once after startup when the app was killed while a recording was
 * active (or a confirmed resume was waiting for its first GNSS fix).
 *
 * Continue arms the deferred resume (recording re-activates on the first
 * native GNSS position, foreground task registered by the listener) and
 * switches GNSS on.  Discard — also on dismiss/back — stops the restored
 * recording state; the recorded line stays in the DB and remains
 * continuable via the "Continue last recording" menu.
 */
const ResumeRecordingPrompt: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { showError } = useContext(ErrorToastContext);

	const resumePromptPending = useAppSelector(selectResumePromptPending);

	const handleContinue = useCallback(async () => {
		const resumed = await dispatch(confirmRecordingResume());
		if (!resumed) {
			showError(t('trackRecording.resumeLineMissing'));
		}
	}, [
		dispatch,
		showError,
		t,
	]);

	const handleDiscard = useCallback(() => {
		dispatch(stopRecording());
	}, [dispatch]);

	// Plain outlined for both — the isDestructive/isSuccess presets pass a
	// buttonColor, which Paper uses as the background fill even in
	// outlined mode.
	const buttonPropsDiscard = useButtonProps({ mode: 'outlined' });
	const buttonPropsContinue = useButtonProps({ mode: 'outlined' });

	return (
		<ModalWrapper
			visible={resumePromptPending}
			onDismiss={handleDiscard}
			headerLabel={t('trackRecording.resumePromptTitle')}
			hasBackButton={false}
			innerStyle={styles.modal}
		>
			<Text>{t('trackRecording.resumePromptBody')}</Text>

			<View style={styles.controls}>
				<ButtonHighlight
					onPress={handleDiscard}
					{...buttonPropsDiscard}
				>
					{t('trackRecording.resumeDiscard')}
				</ButtonHighlight>

				<ButtonHighlight
					onPress={handleContinue}
					{...buttonPropsContinue}
				>
					{t('trackRecording.resume')}
				</ButtonHighlight>
			</View>
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	modal: {
		paddingHorizontal: 16,
	},
	controls: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
		marginTop: 16,
	},
});

export default ResumeRecordingPrompt;
