/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import { useAppDispatch, useAppSelector, useSystemLineIds } from '../../../store/hooks';
import { selectSelected, selectSelectedCountPromptPending } from '../selectors';
import { selectResumePromptPending } from '../../trackRecording/selectors';
import { setLinesSelected, setSelectedCountPromptPending } from '../slice';

/**
 * Shown once per start when the restored map selection exceeds the
 * prompt threshold — many selected routes slow the map down.  Gated on
 * the recording-resume prompt so the user answers the recording
 * question first (the recording line is a system line and survives a
 * clear regardless).
 *
 * Both buttons are plain outlined — clearing is a preference, not a
 * destructive action.  Backdrop dismiss = keep.
 */
const SelectedLinesCountPrompt: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const selected = useAppSelector(selectSelected);
	const pending = useAppSelector(selectSelectedCountPromptPending);
	const resumePromptPending = useAppSelector(selectResumePromptPending);
	const systemLineIds = useSystemLineIds();

	const visible = pending && !resumePromptPending;

	const handleKeep = useCallback(() => {
		dispatch(setSelectedCountPromptPending(false));
	}, [dispatch]);

	const handleClear = useCallback(() => {
		dispatch(setSelectedCountPromptPending(false));
		// System lines (recording, routing, …) always stay on the map.
		dispatch(setLinesSelected(Object.values(systemLineIds)));
	}, [
		dispatch,
		systemLineIds,
	]);

	const buttonPropsKeep = useButtonProps({ mode: 'outlined' });
	const buttonPropsClear = useButtonProps({ mode: 'outlined' });

	const body = useMemo(
		() => sprintf(t('lines.selectedLinesPromptBody'), selected.length),
		[
			selected.length,
			t,
		]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleKeep}
			headerLabel={t('lines.selectedLinesPromptTitle')}
			hasBackButton={false}
			innerStyle={styles.modal}
		>
			<Text>{body}</Text>

			<View style={styles.controls}>
				<ButtonHighlight
					onPress={handleKeep}
					{...buttonPropsKeep}
				>
					{t('lines.selectedLinesPromptKeep')}
				</ButtonHighlight>

				<ButtonHighlight
					onPress={handleClear}
					{...buttonPropsClear}
				>
					{t('lines.selectedLinesPromptClear')}
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

export default SelectedLinesCountPrompt;
