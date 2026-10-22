/**
 * External dependencies
 */
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../components/generic/wrapper/ModalWrapper';

/**
 * Placeholder modal for sharing the tapped position. Mock content for now —
 * will be filled with real share targets/links later (see AGENTS.md TODOs).
 */
const SharePositionModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	lng: number;
	lat: number;
}> = ({ visible, onDismiss, lng, lat }) => {
	const { t } = useTranslation();

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={t('mapContextMenu.sharePosition')}
		>
			<Text>
				{t('mapContextMenu.sharePositionPlaceholder', {
					lat: lat.toFixed(6),
					lng: lng.toFixed(6),
				})}
			</Text>
		</ModalWrapper>
	);
};

export default SharePositionModal;
