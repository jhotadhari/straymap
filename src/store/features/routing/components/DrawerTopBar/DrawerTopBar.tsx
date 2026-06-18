/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { handleSize, iconSize as handleIconSize, itemStyles } from '../../../drawers/constants';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch } from '../../../../hooks';
import useRoute from '../../hooks/useRoute';
import { queryLinesWithoutGeom } from '../../../lines/db/queryFns';
import { LinePartial } from '../../../lines/types';
import { setLineTemp } from '../../../lines/slice';
import useActions from './useActions';
import RoutingActionsButton from '../RoutingActionsButton';
import useToggleRouting from './useToggleRouting';

const DrawerTopBar: FC = () => {
	const { t } = useTranslation();

	const theme = useTheme();

	const dispatch = useAppDispatch();

	const { side } = useContext(DrawerContext);

	const {
		id: routeId,
		line_id: routingLineId,
		points,
		point_order: pointIds,
	} = useRoute([
		'id',
		'line_id',
		'points',
		'point_order',
	]) || {};

	const { data: line } = useQuery({
		queryKey: ['lines', routingLineId ? [routingLineId] : []],
		queryFn: queryLinesWithoutGeom,
		select: (lines: LinePartial[]) => (lines.length ? lines[0] : null),
	});

	const { isToggling, handleToggleRouting } = useToggleRouting({
		pointIds,
		routeId,
		routingLineId,
	});

	const actions = useActions({
		routeId,
		points,
	});

	const handleEditPress = useCallback(() => {
		routingLineId && dispatch(setLineTemp({ id: routingLineId }));
	}, [routingLineId]);

	return (
		<View>
			<View
				style={[
					itemStyles.item,
					styles.item,
				]}
			>
				<View
					style={[
						itemStyles.buttonRow,
						styles.flexRow,
						'left' === side && {
							flexDirection: 'row-reverse',
						},
					]}
				>
					{routeId && (
						<ButtonHighlight
							onPress={actions.appendPoint.cb}
							disabled={isToggling}
							mode="contained"
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Icon
								source={'plus'}
								size={20}
							/>
						</ButtonHighlight>
					)}

					{routeId && (
						<RoutingActionsButton
							actions={actions}
							disabled={isToggling}
						/>
					)}

					<ButtonHighlight
						mode="outlined"
						onPress={handleToggleRouting}
						disabled={isToggling}
					>
						{!routeId && (
							<Text>{t(routeId ? 'stop routing???' : 'start routing???')}</Text>
						)}
						{routeId && (
							<Icon
								source={'close'}
								size={20}
							/>
						)}
					</ButtonHighlight>
				</View>
			</View>

			<View
				style={[
					itemStyles.item,
					styles.item,
				]}
			>
				<View
					style={[
						itemStyles.buttonRow,
						styles.flexRow,
						'left' === side && {
							flexDirection: 'row-reverse',
						},
					]}
				>
					{line && (
						<Fragment>
							<Text>{line?.title}</Text>

							<ButtonHighlight
								mode="outlined"
								onPress={handleEditPress}
								disabled={isToggling}
							>
								<Icon
									size={20}
									source="cog"
								/>
							</ButtonHighlight>
						</Fragment>
					)}
				</View>
			</View>
		</View>
	);
};
const styles = StyleSheet.create({
	item: {
		top: -(handleSize - handleIconSize) / 6,
	},
	flexRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: handleSize,
	},
});

export default DrawerTopBar;
