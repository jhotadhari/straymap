/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { DRAWER_HANDLE_SIZE, itemStyles } from '../../../drawers/constants';
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { nestedIconColor: _nestedIconColorToggle, ...buttonPropsToggle } = useButtonProps({
		mode: 'outlined',
		disabled: isToggling,
		paddingHorizontal: true,
	});

	const { nestedIconColor: nestedIconColorLine, ...buttonPropsLine } = useButtonProps({
		mode: 'outlined',
		disabled: isToggling,
		paddingHorizontal: true,
	});
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { nestedIconColor: _nestedIconColorProfile, ...buttonPropsProfile } = useButtonProps({
		mode: 'outlined',
		disabled: isToggling,
		paddingHorizontal: true,
	});

	return (
		<View>
			<View style={itemStyles.item}>
				<View style={styleButtonRow}>
					{routeId && (
						<RoutingActionsButton
							actions={actions}
							disabled={isToggling}
							buttonPropsProps={{ paddingHorizontal: true }}
							compact={true}
						/>
					)}

					{!routeId && (
						<ButtonHighlight
							{...buttonPropsToggle}
							onPress={handleToggleRouting}
						>
							{t('routing.startRouting')}
						</ButtonHighlight>
					)}

					{route && route.profile && (
						<ButtonHighlight
							{...buttonPropsProfile}
							compact={true}
							onPress={() => setRouteProfileModalVisible(true)}
						>
							<RoutingProfileInfo
								profile={route.profile}
								distUnit={distUnit}
								style={styleProfileInfo}
							/>
						</ButtonHighlight>
					)}

					{routeId && line && (
						<>
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
						</>
					)}
				</View>
			</View>

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

export default DrawerTopBar;
