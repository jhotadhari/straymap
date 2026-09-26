/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../../compose/useButtonProps';
import { useAppDispatch } from '../../../../../store/hooks';
import BottomDrawerContext from '../../../../bottomDrawer/BottomDrawerContext';
import { toggleProfileLine } from '../../../../lines/slice';
import { getProfileSourceFromKey } from '../../../types';
import useRemoveProfileCbModal from '../../../hooks/useRemoveProfileCbModal';
import { ProfileSettingsModalContext } from '../Context';

const RowRemoveProfile: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { profileKey, onDismiss } = useContext(ProfileSettingsModalContext);
	const { setActiveItemKey } = useContext(BottomDrawerContext);

	const source = getProfileSourceFromKey(profileKey);

	const handleRemove = useCallback(() => {
		if (source?.type !== 'line') {
			return;
		}
		dispatch(toggleProfileLine(source.lineId));
		setActiveItemKey(undefined);
	}, [
		dispatch,
		source,
		setActiveItemKey,
	]);

	const { cb, modalNode } = useRemoveProfileCbModal({
		onRemove: handleRemove,
		onSuccess: onDismiss,
	});

	const buttonProps = useButtonProps({
		mode: 'outlined',
		paddingHorizontal: true,
	});

	if (source?.type !== 'line') {
		return null;
	}

	return (
		<InfoLabelRow label={t('altitudeProfile.removeProfile')}>
			{modalNode}
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={cb}
				icon="close"
			>
				{t('altitudeProfile.removeProfile')}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowRemoveProfile;
