/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import { useAppSelector } from '../../../../../store/hooks';
import { selectTagsFilterableColumns } from '../../../selectors';
import { sharedStyles } from '../sharedDeps';
import RadioListItem from '../../../../../components/generic/RadioListItem';

const TagFilterColumnSelectModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	onSelectColumn: (columnKey: string) => void;
}> = ({ visible, onDismiss, onSelectColumn }) => {
	const { t } = useTranslation();

	const filterableColumns = useAppSelector(selectTagsFilterableColumns);

	const options = useMemo(
		() =>
			filterableColumns
				.filter((col) => {
					// Only columns with a filter type are selectable
					const filterType =
						col.key === 'label'
							? 'string'
							: col.key === 'line_count'
								? 'numeric'
								: col.key === 'created_at'
									? 'date'
									: undefined;
					return !!filterType && col.visible;
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
			header={t('lines.addFilter')}
			innerStyle={sharedStyles.modalInner}
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

export default TagFilterColumnSelectModal;
