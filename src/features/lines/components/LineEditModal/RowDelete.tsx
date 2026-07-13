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
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import useDeleteLinesCbModal from '../../hooks/useDeleteLinesCbModal';
import { sharedStyles } from './sharedDeps';
import { selectLineTemp } from '../../selectors';
import { useAppSelector, useSystemLineIds } from '../../../../store/hooks';

const RowDelete: FC = () => {
	const theme = useTheme();
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

	const buttonStyle = useMemo(
		() => ({
			borderColor: theme.colors.onBackground,
			...(isSystemLine && {
				opacity: 0.5,
				borderColor: theme.colors.onSurfaceDisabled,
			}),
		}),
		[theme, isSystemLine]
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
				disabled={isSystemLine}
				onPress={handleDelete}
				icon={iconSourceDelete}
				contentStyle={sharedStyles.buttonContent}
				labelStyle={sharedStyles.buttonLabel}
				textColor={theme.colors.onBackground}
			>
				<View>
					<Text>{isSystemLine ? t('lines.isRoutingLine') : t('lines.delete')}</Text>
				</View>
			</ButtonHighlight>
		</InfoRowControl>
	);
};

export default RowDelete;
