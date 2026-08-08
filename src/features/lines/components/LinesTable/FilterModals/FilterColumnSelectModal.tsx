/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../../components/generic/wrapper/ModalWrapper';
import { useAppSelector } from '../../../../../store/hooks';
import { selectLinesFilterableColumns } from '../../../selectors';
import { tableStyles } from '../../tableResources';
import RadioListItem from '../../../../../components/generic/wrapper/RadioListItem';

const FilterColumnSelectModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	onSelectColumn: (columnKey: string) => void;
}> = ({ visible, onDismiss, onSelectColumn }) => {
	const { t } = useTranslation();

	const filterableColumns = useAppSelector(selectLinesFilterableColumns);

	const options = useMemo(
		() =>
			filterableColumns.map((col) => ({
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

export default FilterColumnSelectModal;
