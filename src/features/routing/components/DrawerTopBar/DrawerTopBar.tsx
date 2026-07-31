/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import LucideIcons from '@react-native-vector-icons/lucide/static';

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
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import useRoute from '../../hooks/useRoute';
import { queryLinesWithoutGeom } from '../../../lines/db/queryFns';
import { LinePartial } from '../../../lines/types';
import { setLineTemp } from '../../../lines/slice';
import useActions from './useActions';
import RoutingActionsButton from '../RoutingActionsButton';
import useToggleRouting from './useToggleRouting';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { selectUnitPrefs } from '../../../general/selectors';
import { Route } from '../../types';
import RoutingProfileInfo from '../RoutingProfileInfo';
import RouteProfileModal from '../RouteProfileModal';
import IconCustom from '../../../../components/generic/primitives/IconCustom';

const DrawerTopBar: FC = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { side } = useContext(DrawerContext);

	const unitPrefs = useAppSelector(selectUnitPrefs);
	const distUnit = unitPrefs.distance;

	const [routeProfileModalVisible, setRouteProfileModalVisible] = useState(false);

	const route = useRoute([
		'id',
		'line_id',
		'points',
		'profile',
	]) as Route | undefined;

	const { id: routeId, line_id: routingLineId, points } = route || {};

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

	const styleProfileInfo = useMemo(
		() => [
			'right' === side && { marginLeft: 4 },
		],
		[side]
	);

	const { nestedIconColor: nestedIconColorAdd, ...buttonPropsAdd } = useButtonProps({
		disabled: isToggling,
		isSuccess: true,
		paddingHorizontal: true,
	});

	const { nestedIconColor: nestedIconColorToggle, ...buttonPropsToggle } = useButtonProps({
		mode: 'outlined',
		disabled: isToggling,
		paddingHorizontal: true,
	});

	const { nestedIconColor: nestedIconColorLine, ...buttonPropsLine } = useButtonProps({
		mode: 'outlined',
		disabled: isToggling,
		paddingHorizontal: true,
	});
	const { nestedIconColor: nestedIconColorProfile, ...buttonPropsProfile } = useButtonProps({
		mode: 'outlined',
		disabled: isToggling,
		paddingHorizontal: true,
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
								compact={true}
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
								buttonPropsProps={{ paddingHorizontal: true }}
								compact={true}
							/>

							{line && (
								<ButtonHighlight
									{...buttonPropsLine}
									onPress={handleEditPress}
									compact={true}
								>
									<IconCustom
										name="route_cog"
										size={20}
										color={nestedIconColorLine}
									/>
								</ButtonHighlight>
							)}
						</>
					)}

					<ButtonHighlight
						{...buttonPropsToggle}
						onPress={handleToggleRouting}
						compact={!!routeId}
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

			{route && route.profile && (
				<View style={styleItem}>
					<View style={styleButtonRow}>
						<RoutingProfileInfo
							profile={route.profile}
							distUnit={distUnit}
							style={styleProfileInfo}
						/>
						<ButtonHighlight
							{...buttonPropsProfile}
							compact={true}
							onPress={() => setRouteProfileModalVisible(true)}
						>
							<LucideIcons
								size={20}
								color={nestedIconColorProfile}
								name="settings-2"
							/>
						</ButtonHighlight>
					</View>
				</View>
			)}

			{route && (
				<RouteProfileModal
					route={route}
					visible={routeProfileModalVisible}
					onDismiss={() => setRouteProfileModalVisible(false)}
				/>
			)}
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
