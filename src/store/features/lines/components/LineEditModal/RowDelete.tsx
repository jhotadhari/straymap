/**
 * External dependencies
 */
import { FC, useCallback, useContext } from 'react';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import useDeleteLinesCbModal from '../../hooks/useDeleteLinesCbModal';
import { styles } from './sharedDeps';
import { iconSize } from '../../../drawers/constants';
import { selectLineTemp } from '../../selectors';
import { useAppSelector } from '../../../../hooks';

const RowDelete: FC = () => {
	const lineTemp = useAppSelector(selectLineTemp);

	const { selectLine, route, onDismiss, onDeleteSuccess } = useContext(LineEditModalContext);

	const removeFromMap = useCallback(() => {
		lineTemp?.id && selectLine(lineTemp.id, false);
	}, [lineTemp?.id]);

	const handleDeleteSuccess = useCallback(() => {
		onDeleteSuccess && onDeleteSuccess(lineTemp?.id);
		onDismiss();
	}, [
		onDeleteSuccess,
		onDismiss,
		lineTemp?.id,
	]);

	const { cb: handleDelete, modalNode: modalNodeDelete } = useDeleteLinesCbModal({
		deleteIdsOrId: lineTemp?.id,
		routeId: route?.id,
		routingLineId: lineTemp?.id,
		removeLinesFromMap: removeFromMap,
		onSuccess: handleDeleteSuccess,
		backgroundBlur: false,
	});

	return (
		<InfoRowControl
			label={'delete???'} // ??? translation
		>
			{modalNodeDelete}
			<ButtonHighlight
				mode="outlined"
				compact={true}
				onPress={handleDelete}
			>
				<View style={styles.buttonInner}>
					<Icon
						source="delete"
						size={iconSize}
					/>
					<Text>{'delete???'}</Text>
				</View>
			</ButtonHighlight>
		</InfoRowControl>
	);
};

export default RowDelete;
