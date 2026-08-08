/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import useDeleteLinesCbModal from '../../hooks/useDeleteLinesCbModal';
import { selectLineTemp } from '../../selectors';
import { useAppSelector, useSystemLineIds } from '../../../../store/hooks';
import { useButtonProps } from '../../../../compose/useButtonProps';

const RowDelete: FC = () => {
	const { t } = useTranslation();

	const lineTemp = useAppSelector(selectLineTemp);

	const { selectLine, route, onDismiss, onDeleteSuccess } = useContext(LineEditModalContext);

	const systemLineIds = useSystemLineIds();
	const isSystemLine = useMemo(
		() => Object.values(systemLineIds).includes(lineTemp?.id ?? -1),
		[systemLineIds, lineTemp?.id]
	);

	const removeFromMap = useCallback(() => {
		lineTemp?.id && selectLine(lineTemp.id, false);
	}, [selectLine, lineTemp?.id]);

	const handleDeleteSuccess = useCallback(() => {
		onDeleteSuccess && onDeleteSuccess(lineTemp?.id);
		onDismiss();
	}, [
		onDeleteSuccess,
		onDismiss,
		lineTemp?.id,
	]);

	const {
		cb: handleDelete,
		modalNode: modalNodeDelete,
		iconSource: iconSourceDelete,
	} = useDeleteLinesCbModal({
		deleteIdsOrId: lineTemp?.id,
		routeId: route?.id,
		routingLineId: lineTemp?.id,
		removeLinesFromMap: removeFromMap,
		onSuccess: handleDeleteSuccess,
		backgroundBlur: false,
	});

	const buttonProps = useButtonProps({
		mode: 'outlined',
		disabled: !!isSystemLine,
		paddingHorizontal: true,
	});

	return (
		<InfoLabelRow
			label={t('lines.delete')}
			Info={t('lines.hintDelete')}
		>
			{modalNodeDelete}
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={handleDelete}
				icon={iconSourceDelete}
			>
				{isSystemLine ? t('lines.isRoutingLine') : t('lines.delete')}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowDelete;
