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
import { selectActiveLineId } from '../../../trackRecording/selectors';
import { selectFollowingLineId } from '../../../lineFollow/selectors';
import { startFollowing, stopFollowing } from '../../../lineFollow/slice';
import { useButtonProps } from '../../../../compose/useButtonProps';

/**
 * Follow a line (progress tracking along its geometry). A line cannot be
 * the currently recording line and the followed line at the same time —
 * the button is disabled while this line is being recorded.
 */
const RowFollow: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const { line } = useContext(LineEditModalContext);

	const followingLineId = useAppSelector(selectFollowingLineId);
	const activeLineId = useAppSelector(selectActiveLineId);

	const lineId = line?.id;
	const isFollowing = typeof lineId === 'number' && followingLineId === lineId;
	const isRecordingThisLine = typeof lineId === 'number' && activeLineId === lineId;

	const disabled = useMemo(
		() => typeof lineId !== 'number' || isRecordingThisLine,
		[
			lineId,
			isRecordingThisLine,
		]
	);

	const handlePress = useCallback(() => {
		if (disabled || typeof lineId !== 'number') {
			return;
		}
		if (isFollowing) {
			dispatch(stopFollowing());
		} else {
			dispatch(startFollowing(lineId));
		}
	}, [
		disabled,
		lineId,
		isFollowing,
		dispatch,
	]);

	const buttonProps = useButtonProps({
		mode: 'outlined',
		disabled,
		paddingHorizontal: true,
	});

	return (
		<InfoLabelRow
			label={t('lineFollow.title')}
			Info={isRecordingThisLine ? t('lines.lineBusy.trackRecording') : t('lineFollow.hint')}
		>
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={handlePress}
				icon="map-marker-path"
			>
				{isFollowing ? t('lineFollow.stop') : t('lineFollow.start')}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowFollow;
