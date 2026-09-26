/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { useAppSelector } from '../../../../../store/hooks';
import { OptionBase } from '../../../../../types';
import BottomDrawerContext from '../../../../bottomDrawer/BottomDrawerContext';
import { selectItemKeys } from '../../../../bottomDrawer/selectors';
import { ALTITUDE_PROFILE_KEY_PREFIX } from '../../../types';
import { useProfileItemLabels } from '../../../hooks/useProfileItemLabels';

const RowSelectProfile: FC = () => {
	const { t } = useTranslation();
	const { activeItemKey, setActiveItemKey } = useContext(BottomDrawerContext);

	const itemKeys = useAppSelector(selectItemKeys);
	const profileLabels = useProfileItemLabels();

	const profileOptions = useMemo(
		() =>
			itemKeys
				.filter((key) => key.startsWith(ALTITUDE_PROFILE_KEY_PREFIX))
				.map((key): OptionBase => ({
					key,
					label: profileLabels[key] ?? key,
				})),
		[
			itemKeys,
			profileLabels,
		]
	);

	const activeLabel = activeItemKey ? (profileLabels[activeItemKey] ?? activeItemKey) : '';

	return (
		<>
			<InfoLabelRow label={t('altitudeProfile.activeProfile')}>
				<ButtonHighlightMenuControl
					options={profileOptions}
					value={activeItemKey}
					setValue={(v) => setActiveItemKey(v)}
					anchorLabel={activeLabel}
					compact
					buttonPropsProps={{ paddingHorizontal: true }}
				/>
			</InfoLabelRow>
		</>
	);
};

export default RowSelectProfile;
