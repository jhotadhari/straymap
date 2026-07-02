/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import useDeleteLinesCbModal from '../../hooks/useDeleteLinesCbModal';
import { sharedStyles } from './sharedDeps';
import { selectLineTemp } from '../../selectors';
import { selectIsRouting } from '../../../routing/selectors';
import { useAppSelector } from '../../../../hooks';

const RowDelete: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const lineTemp = useAppSelector(selectLineTemp);

	const { selectLine, route, onDismiss, onDeleteSuccess } = useContext(LineEditModalContext);

	const isRouting = useAppSelector(selectIsRouting);

	// Prevent deletion of the line that is currently being routed.
	// Deleting it would orphan the active route and break the map.
	const isRoutingLine = useMemo(
		() => !!(lineTemp?.id && route?.id && isRouting === route.id),
		[
			lineTemp?.id,
			route?.id,
			isRouting,
		]
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

	const buttonStyle = useMemo(
		() => ({
			borderColor: theme.colors.onBackground,
			...(isRoutingLine && {
				opacity: 0.5,
				borderColor: theme.colors.onSurfaceDisabled,
			}),
		}),
		[theme, isRoutingLine]
	);

	return (
		<InfoRowControl
			label={t('lines.delete')}
			Info={t('lines.hintDelete')}
		>
			{modalNodeDelete}
			<ButtonHighlight
				style={buttonStyle}
				mode="outlined"
				compact={true}
				disabled={isRoutingLine}
				onPress={handleDelete}
				icon={iconSourceDelete}
				contentStyle={sharedStyles.buttonContent}
				labelStyle={sharedStyles.buttonLabel}
				textColor={theme.colors.onBackground}
			>
				<View>
					<Text>{isRoutingLine ? t('lines.isRoutingLine') : t('lines.delete')}</Text>
				</View>
			</ButtonHighlight>
		</InfoRowControl>
	);
};

export default RowDelete;
