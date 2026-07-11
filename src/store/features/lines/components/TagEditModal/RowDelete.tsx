/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { TagEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import { deleteTag } from '../../db/actionsTag';
import { invalidateTagsTable, invalidateLinesQueries } from '../../db/queryFns';
import { featureRegistry } from '../../../FeatureRegistry';
import { ErrorToastContext } from '../../../../../components/ErrorToast/Context';
import { logError } from '../../../../../lib/utils';
import { sharedStyles as appSharedStyles } from '../../../../../sharedStyles';
import { sharedStyles } from './sharedDeps';

const RowDelete: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const { tag, onDismiss } = useContext(TagEditModalContext);

	const [confirmVisible, setConfirmVisible] = useState(false);

	const isSystemTag = tag
		? featureRegistry.getSystemTagLabels().includes(tag.label ?? '')
		: false;

	const deleteMutation = useMutation({
		mutationFn: async (id: number) => {
			await deleteTag(id);
		},
		onSuccess: async () => {
			invalidateTagsTable(queryClient);
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			await invalidateLinesQueries(queryClient);
			setConfirmVisible(false);
			onDismiss();
		},
		onError: (err) => {
			logError('RowDelete', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handlePress = useCallback(() => {
		setConfirmVisible(true);
	}, []);

	const handleConfirm = useCallback(() => {
		if (!tag) return;
		deleteMutation.mutate(tag.id);
	}, [tag, deleteMutation]);

	const handleDismissConfirm = useCallback(() => {
		setConfirmVisible(false);
	}, []);

	return (
		<>
			<InfoRowControl
				label={t('lines.delete')}
				Info={t('lines.hintDelete')}
			>
				<ButtonHighlight
					onPress={handlePress}
					mode="contained"
					disabled={isSystemTag || deleteMutation.isPending}
					buttonColor={isSystemTag ? undefined : theme.colors.errorContainer}
					textColor={isSystemTag ? undefined : theme.colors.onErrorContainer}
					contentStyle={sharedStyles.buttonContent}
					labelStyle={sharedStyles.buttonLabel}
				>
					<Text
						style={{
							color: isSystemTag
								? theme.colors.onSurfaceDisabled
								: theme.colors.onErrorContainer,
						}}
					>
						{t('lines.delete')}
					</Text>
				</ButtonHighlight>
			</InfoRowControl>

			<ModalWrapper
				visible={confirmVisible}
				onDismiss={handleDismissConfirm}
				header={t('lines.deleteConfirm')}
				innerStyle={appSharedStyles.modal}
			>
				<Text>{sprintf(t('lines.tagsDeleteConfirmationBody'), 1)}</Text>

				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDismissConfirm}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('cancel')}</Text>
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleConfirm}
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('lines.delete')}</Text>
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		</>
	);
};

export default RowDelete;
