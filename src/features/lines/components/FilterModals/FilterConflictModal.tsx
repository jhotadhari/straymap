/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { sharedStyles } from './sharedDeps';
import { FilterConflict } from '../../db/filterConflicts';

const FilterConflictModal: FC<{
	visible: boolean;
	conflicts: FilterConflict[];
	onDismiss: () => void;
}> = ({ visible, conflicts, onDismiss }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const descriptions = useMemo(() => {
		return conflicts.map((c) => {
			// Resolve column keys to human-readable labels for the
			// translation interpolation params.
			const params: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(c.descriptionParams)) {
				if (k === 'column' && typeof v === 'string') {
					params[k] = t(`lines.columns.${v}`);
				} else {
					params[k] = v;
				}
			}
			return t(c.descriptionKey, params);
		});
	}, [conflicts, t]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={t('lines.filterConflictTitle')}
			innerStyle={sharedStyles.modalInner}
		>
			<Text style={{ color: theme.colors.onSurface }}>{t('lines.filterConflictHint')}</Text>

			{descriptions.map((desc, i) => (
				<Text
					key={i}
					style={{ color: theme.colors.onSurfaceVariant }}
				>
					• {desc}
				</Text>
			))}
		</ModalWrapper>
	);
};

export default FilterConflictModal;
