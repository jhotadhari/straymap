/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { continueRecording } from '../../../trackRecording/slice';
import { selectIsRecording } from '../../../trackRecording/selectors';
import ensureLocationPermission from '../../../../lib/locationPermission';
import ensureNotificationPermission from '../../../../lib/notificationPermission';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { useButtonProps } from '../../../../compose/useButtonProps';

/**
 * Continue recording on this line — only rendered for lines carrying the
 * system 'recorded' tag.  Disabled while any recording is active (the
 * active line can't be re-started; other lines require stopping first).
 */
const RowContinueRecording: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const { line, onDismiss } = useContext(LineEditModalContext);
	const activateTrackingDrawerItem = useActivateDrawerItem('tracking');

	const isRecording = useAppSelector(selectIsRecording);

	const hasRecordedTag = useMemo(
		() => (line?.tags ?? []).some((tag) => tag.label === 'recorded'),
		[line?.tags]
	);

	const disabled = useMemo(
		() => typeof line?.id !== 'number' || isRecording,
		[
			line?.id,
			isRecording,
		]
	);

	const handlePress = useCallback(async () => {
		if (disabled || typeof line?.id !== 'number') {
			return;
		}
		const granted = await ensureLocationPermission();
		if (!granted) {
			return;
		}
		await ensureNotificationPermission();
		onDismiss();
		dispatch(continueRecording(line.id));
		activateTrackingDrawerItem();
	}, [
		disabled,
		line?.id,
		onDismiss,
		dispatch,
		activateTrackingDrawerItem,
	]);

	const buttonProps = useButtonProps({
		mode: 'outlined',
		disabled,
		paddingHorizontal: true,
	});

	if (!hasRecordedTag) {
		return null;
	}

	return (
		<InfoLabelRow
			label={t('trackRecording.continueRecording')}
			Info={
				isRecording
					? t('lines.lineBusy.trackRecording')
					: t('trackRecording.hintContinueRecording')
			}
		>
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={handlePress}
				icon={'record-rec'}
			>
				{t('trackRecording.continueRecording')}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowContinueRecording;
