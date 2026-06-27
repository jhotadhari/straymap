/**
 * External dependencies
 */
import { FC, useCallback, useContext } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import useDeleteLinesCbModal from '../../hooks/useDeleteLinesCbModal';
import { sharedStyles } from './sharedDeps';
import { selectLineTemp } from '../../selectors';
import { useAppSelector } from '../../../../hooks';

const RowDelete: FC = () => {
	const theme = useTheme();

	const lineTemp = useAppSelector(selectLineTemp);

	const { selectLine, route, onDismiss, onDeleteSuccess } = useContext(LineEditModalContext);

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

	return (
		<InfoRowControl
			label={'delete???'} // ??? translation
		>
			{modalNodeDelete}
			<ButtonHighlight
				mode="outlined"
				compact={true}
				onPress={handleDelete}
				icon={iconSourceDelete}
				contentStyle={sharedStyles.buttonContent}
				labelStyle={sharedStyles.buttonLabel}
				textColor={theme.colors.onBackground}
			>
				<View>
					<Text>{'delete???'}</Text>
				</View>
			</ButtonHighlight>
		</InfoRowControl>
	);
};

export default RowDelete;
