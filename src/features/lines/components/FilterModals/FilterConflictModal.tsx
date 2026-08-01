/**
 * External dependencies
 */
import { FC, memo, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { formatDistance, formatHeightDepth } from '../../../../lib/formatting';
import { sharedStyles, getUnitPrefKey } from './sharedDeps';
import { FilterConflict } from '../../db/filterConflicts';

const FilterConflictModal: FC<{
	visible: boolean;
	conflicts: FilterConflict[];
	onDismiss: () => void;
}> = ({ visible, conflicts, onDismiss }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const onSurfaceStyle = useMemo(() => ({ color: theme.colors.onSurface }), [theme]);
	const onSurfaceVariantStyle = useMemo(
		() => ({ color: theme.colors.onSurfaceVariant }),
		[theme]
	);

	const descriptions = useMemo(() => {
		return conflicts.map((c) => {
			// Resolve column keys to human-readable labels and
			// format numeric values with the correct unit.
			const params: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(c.descriptionParams)) {
				if (k === 'column' && typeof v === 'string') {
					params[k] = t(`lines.columns.${v}`);
				} else if (
					(k === 'min' || k === 'max') &&
					typeof v === 'number' &&
					typeof c.descriptionParams.column === 'string'
				) {
					const unitKey = getUnitPrefKey(c.descriptionParams.column);
					const unitPref = unitKey ? unitPrefs[unitKey] : undefined;
					if (unitKey === 'distance' && unitPref) {
						params[k] = formatDistance(v, unitPref);
					} else if (unitKey === 'heightDepth' && unitPref) {
						params[k] = formatHeightDepth(v, unitPref);
					} else {
						params[k] = v;
					}
				} else {
					params[k] = v;
				}
			}
			return t(c.descriptionKey, params);
		});
	}, [
		conflicts,
		t,
		unitPrefs,
	]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={t('lines.filterConflictTitle')}
			innerStyle={sharedStyles.modalInner}
		>
			<Text style={onSurfaceStyle}>{t('lines.filterConflictHint')}</Text>

			{descriptions.map((desc, i) => (
				<Text
					key={i}
					style={onSurfaceVariantStyle}
				>
					• {desc}
				</Text>
			))}
		</ModalWrapper>
	);
};

export default memo(FilterConflictModal);
