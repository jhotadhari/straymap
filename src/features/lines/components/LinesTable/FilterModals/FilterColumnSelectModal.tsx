/**
 * External dependencies
 */
import { FC, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../../components/generic/wrapper/ModalWrapper';
import { useAppSelector } from '../../../../../store/hooks';
import { selectLinesFilterableColumns } from '../../../selectors';
import { tableStyles } from '../../tableResources';
import RadioListItem from '../../../../../components/generic/wrapper/RadioListItem';
import { getFilterColumnType } from '../sharedDeps';

const FilterColumnSelectModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	onSelectColumn: (columnKey: string) => void;
}> = ({ visible, onDismiss, onSelectColumn }) => {
	const { t } = useTranslation();

	const filterableColumns = useAppSelector(selectLinesFilterableColumns);

	const options = useMemo(
		() =>
			filterableColumns
				.filter((col) => {
					// Only columns with a filter type are selectable.
					return !!getFilterColumnType(col.key);
				})
				.map((col) => ({
					key: col.key,
					label: t(`lines.columns.${col.key}`),
				})),
		[filterableColumns, t]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={t('lines.addFilter')}
			innerStyle={tableStyles.modalInner}
		>
			{options.map((opt) => (
				<RadioListItem
					key={opt.key}
					opt={opt}
					onPress={() => onSelectColumn(opt.key)}
					status="unchecked"
					labelExtractor={(a) => a.label}
				/>
			))}
		</ModalWrapper>
	);
};

export default memo(FilterColumnSelectModal);
