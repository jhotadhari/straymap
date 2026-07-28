/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import {
	DRAWER_HANDLE_SIZE,
	DRAWER_ICON_SIZE as handleIconSize,
	itemStyles,
} from '../../../drawers/constants';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch } from '../../../../store/hooks';
import useRoute from '../../hooks/useRoute';
import { queryLinesWithoutGeom } from '../../../lines/db/queryFns';
import { LinePartial } from '../../../lines/types';
import { setLineTemp } from '../../../lines/slice';
import useActions from './useActions';
import RoutingActionsButton from '../RoutingActionsButton';
import useToggleRouting from './useToggleRouting';
import { useButtonProps } from '../../../../compose/useButtonProps';

const DrawerTopBar: FC = () => {
	const { t } = useTranslation();

	const theme = useTheme();

	const dispatch = useAppDispatch();

	const { side } = useContext(DrawerContext);

	const {
		id: routeId,
		line_id: routingLineId,
		points,
	} = useRoute([
		'id',
		'line_id',
		'points',
	]) || {};

	const { data: line } = useQuery({
		queryKey: ['lines', routingLineId ? [routingLineId] : []],
		queryFn: queryLinesWithoutGeom,
		select: (lines: LinePartial[]) => (lines.length ? lines[0] : null),
	});

	const { isToggling, handleToggleRouting } = useToggleRouting({
		routeId,
	});

	const actions = useActions({
		routeId,
		points,
	});

	const handleEditPress = useCallback(() => {
		routingLineId && dispatch(setLineTemp({ id: routingLineId }));
	}, [dispatch, routingLineId]);

	const styleButtonRow = useMemo(
		() => [
			itemStyles.buttonRow,
			styles.flexRow,
			'left' === side && styles.buttonRowReverse,
		],
		[side]
	);

	const { nestedIconColor: nestedIconColorAdd, ...buttonPropsAdd } = useButtonProps({
		disabled: isToggling,
		isSuccess: true,
	});

	const { nestedIconColor: nestedIconColorToggle, ...buttonPropsToggle } = useButtonProps({
		mode: 'outlined',
		disabled: isToggling,
	});

	const { nestedIconColor: nestedIconColorLine, ...buttonPropsLine } = useButtonProps({
		mode: 'outlined',
		disabled: isToggling,
	});

	return (
		<View>
			<View style={styleItem}>
				<View style={styleButtonRow}>
					{routeId && (
						<>
							<ButtonHighlight
								{...buttonPropsAdd}
								onPress={actions.appendPoint.cb}
							>
								<Icon
									source={'plus'}
									size={20}
									color={nestedIconColorAdd}
								/>
							</ButtonHighlight>

							<RoutingActionsButton
								actions={actions}
								disabled={isToggling}
							/>
						</>
					)}

					<ButtonHighlight
						{...buttonPropsToggle}
						onPress={handleToggleRouting}
					>
						{!routeId && t('routing.startRouting')}
						{routeId && (
							<Icon
								source={'close'}
								size={20}
								color={nestedIconColorToggle}
							/>
						)}
					</ButtonHighlight>
				</View>
			</View>

			<View style={styleItem}>
				<View style={styleButtonRow}>
					{line && (
						<Fragment>
							<Text>{line?.title}</Text>

							<ButtonHighlight
								{...buttonPropsLine}
								onPress={handleEditPress}
							>
								<Icon
									size={20}
									source="cog"
									color={nestedIconColorLine}
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
		top: -(DRAWER_HANDLE_SIZE - handleIconSize) / 6,
	},
	flexRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: DRAWER_HANDLE_SIZE,
	},
	buttonRowReverse: {
		flexDirection: 'row-reverse',
	},
});

const styleItem = [itemStyles.item, styles.item];

export default DrawerTopBar;
