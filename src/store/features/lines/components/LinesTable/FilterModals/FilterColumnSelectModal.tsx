/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import { useAppSelector } from '../../../../../hooks';
import { selectFilterableColumns } from '../../../selectors';
import { sharedStyles } from '../sharedDeps';
import RadioListItem from '../../../../../../components/generic/RadioListItem';

const FilterColumnSelectModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	onSelectColumn: (columnKey: string) => void;
}> = ({ visible, onDismiss, onSelectColumn }) => {
	const { t } = useTranslation();

	const filterableColumns = useAppSelector(selectFilterableColumns);

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
			header={t('lines.addFilter')}
			innerStyle={sharedStyles.modalInner}
		>
			{options.map((opt) => (
				<RadioListItem
					key={opt.key}
					opt={opt}
					onPress={() => onSelectColumn(opt.key)}
					status="unchecked"
				/>
			))}
		</ModalWrapper>
	);
};

export default FilterColumnSelectModal;
