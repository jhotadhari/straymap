/**
 * External dependencies
 */
import { FC, memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import LucideIcons from '@react-native-vector-icons/lucide/static';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { localStyles } from '../styles';
import UnmatchedLinesModal from './UnmatchedLinesModal';

const UnmatchedLines: FC<{
	unmatchedIds: number[] | undefined;
	filename: string;
}> = memo(({ unmatchedIds, filename }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [remainingIds, setRemainingIds] = useState(unmatchedIds ?? []);
	const [modalVisible, setModalVisible] = useState(false);

	const handleOpenModal = useCallback(() => setModalVisible(true), []);
	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const buttonProps = useButtonProps({});

	if (!remainingIds.length) return null;

	return (
		<View style={localStyles.unmatchedRow}>
			<ButtonHighlight
				{...buttonProps}
				icon={() => (
					<LucideIcons
						size={20}
						color={theme.colors.error}
						name="triangle-alert"
					/>
				)}
				onPress={handleOpenModal}
			>
				{sprintf(t('import.resultUnmatchedButton'), remainingIds.length)}
			</ButtonHighlight>
			<UnmatchedLinesModal
				visible={modalVisible}
				onDismiss={handleDismissModal}
				unmatchedIds={remainingIds}
				filename={filename}
				onIdsChange={setRemainingIds}
			/>
		</View>
	);
});

export default UnmatchedLines;
