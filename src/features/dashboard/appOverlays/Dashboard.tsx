/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, View, ViewProps, ViewStyle } from 'react-native';
import { get } from 'lodash-es';
import {
	DragStartCallback,
	DragStartParams,
	JustifyContent,
	SortableFlexDragEndCallback,
	SortableFlexDragEndParams,
} from 'react-native-sortables/dist/typescript/types';
import Sortable from 'react-native-sortables';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectDashboardStyle, selectIsEditingDashboard, selectItems } from '../selectors';
import DashboardItem from '../components/DashboardItem';
import { AppContext } from '../../../Context';
import { setEditItemKey, setItems } from '../slice';
import { ControlContext } from '../ControlContext';
import { useTheme } from 'react-native-paper';
import useDropIndicatorStyle from '../../../compose/useDropIndicatorStyle';

const Dashboard: FC<{
	style?: ViewProps['style'];
	itemStyle?: ViewStyle;
	position: string;
	onDragStart?: DragStartCallback;
	onDragEnd?: SortableFlexDragEndCallback;
	sortEnabled?: boolean;
	highlightEditItem?: boolean;
	shouldSetBottomBarHeight?: boolean;
	shouldSetTopBarHeight?: boolean;
	onPressItem?: (itemKey: string, event: GestureResponderEvent) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
}> = ({
	style,
	itemStyle,
	position,
	onDragStart,
	onDragEnd,
	sortEnabled,
	highlightEditItem,
	shouldSetBottomBarHeight,
	shouldSetTopBarHeight,
	onPressItem,
	onLayout,
}) => {
	const { setBottomBarHeight, setTopAppBarHeight } = useContext(AppContext);

	const items = useAppSelector((state) => selectItems(state, { position }));
	const dashboardStyle = useAppSelector((state) => selectDashboardStyle(state, position));

	const theme = useTheme();

	const justifyContent: JustifyContent = useMemo(
		() =>
			get(
				{
					center: 'center',
					left: 'flex-start',
					right: 'flex-end',
					around: 'space-around',
					between: 'space-between',
					evenly: 'space-evenly',
				},
				dashboardStyle.align,
				'center'
			),
		[dashboardStyle.align]
	);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { layout } = event.nativeEvent;
			if ('bottom' === position && setBottomBarHeight && shouldSetBottomBarHeight) {
				setBottomBarHeight((bottomBarHeight) => ({
					...bottomBarHeight,
					dashboard: items.length ? layout.height : 0,
				}));
			}
			if ('top' === position && setTopAppBarHeight && shouldSetTopBarHeight) {
				// setTopAppBarHeight( height );	// ??? todo // maybe handled already in @src/store/features/ui/components/TopAppBar.tsx
			}
			onLayout && onLayout(event);
		},
		[
			position,
			items.length,
			setBottomBarHeight,
			setTopAppBarHeight,
			shouldSetBottomBarHeight,
			shouldSetTopBarHeight,
			onLayout,
		]
	);

	const handleDragStart = useCallback(
		(params: DragStartParams) => {
			onDragStart && onDragStart(params);
		},
		[onDragStart]
	);

	const handleDragEnd = useCallback(
		(params: SortableFlexDragEndParams) => {
			onDragEnd && onDragEnd(params);
		},
		[onDragEnd]
	);

	const dropIndicatorStyle = useDropIndicatorStyle();

	return (
		<ControlContext.Provider value={{ position }}>
			<View
				style={[{ backgroundColor: theme.colors.background }, style]}
				onLayout={handleLayout}
			>
				<Sortable.Flex
					// dimensionsAnimationType='none'
					itemEntering={null}
					gap={0}
					padding={0}
					sortEnabled={sortEnabled}
					customHandle={true}
					showDropIndicator={true}
					dropIndicatorStyle={dropIndicatorStyle}
					justifyContent={justifyContent}
					alignItems="center"
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					{items.map((item) => {
						return (
							<DashboardItem
								isHandle={true}
								key={item.key}
								item={item}
								onPress={onPressItem}
								style={itemStyle}
								highlightEditItem={highlightEditItem}
							/>
						);
					})}
				</Sortable.Flex>

				{/* <WeirdFix
				data={data}
				setData={setData}
			/> */}
			</View>
		</ControlContext.Provider>
	);
};

export const DashboardWrapped: FC<{
	position: string;
	style?: ViewStyle;
}> = ({ position, style }) => {
	const dispatch = useAppDispatch();

	const isEditingDashboard = useAppSelector(selectIsEditingDashboard);

	const items = useAppSelector((state) => selectItems(state, { position }));

	const handleDragStart = useCallback(
		(event: DragStartParams) => {
			dispatch(setEditItemKey(event.key.replace('.$', '')));
		},
		[
			dispatch,
		]
	);

	const handleItemPress = useCallback(
		(itemKey: string) => {
			dispatch(
				setEditItemKey((editItemKey) => (itemKey === editItemKey ? undefined : itemKey))
			);
		},
		[
			dispatch,
		]
	);

	const handleDragEnd = useCallback(
		({ indexToKey }: SortableFlexDragEndParams) => {
			dispatch(
				setItems({
					position,
					items: indexToKey
						.map((toKey) => {
							return items.find((item) => item.key === toKey.replace('.$', ''));
						})
						.filter((a) => !!a),
				})
			);
		},
		[
			dispatch,
			items,
			position,
		]
	);

	const styleResult: ViewProps['style'] = useMemo(
		() => [
			style,
			{ zIndex: isEditingDashboard ? 999 : 20 },
		],
		[isEditingDashboard]
	);

	if (isEditingDashboard) {
		return (
			<Dashboard
				style={styleResult}
				position={position}
				sortEnabled={true}
				highlightEditItem={true}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onPressItem={handleItemPress}
				shouldSetBottomBarHeight={'bottom' === position}
				shouldSetTopBarHeight={'top' === position}
			/>
		);
	} else {
		return (
			<Dashboard
				style={styleResult}
				position={position}
				sortEnabled={false}
				shouldSetBottomBarHeight={true}
			/>
		);
	}
};

// const WeirdFix: FC<{
// 	data: {
// 		key: string;
// 	}[];
// 	setData: Dispatch<
// 		SetStateAction<
// 			{
// 				key: string;
// 			}[]
// 		>
// 	>;
// }> = ({ data, setData }) => {
// 	const xsRef = useRef<{ [key: number]: number }>({});
// 	const handleLayout = useCallback(
// 		(event: LayoutChangeEvent, idx: number, isFixed: boolean) => {
// 			const layout = event.nativeEvent.layout;
// 			set(xsRef.current, idx, layout.x);
// 			isFixed &&
// 				setTimeout(() => {
// 					if (layout.y > 1) {
// 						// Is second row.
// 						setData(arrayMoveImmutable(data, idx, idx - 1));
// 					} else if (get(xsRef.current, idx + 1, 0) > layout.x) {
// 						// Is not last item in row.
// 						setData(arrayMoveImmutable(data, idx, idx + 1));
// 					}
// 				}, 10);
// 		},
// 		[data]
// 	);

// 	return (
// 		<View
// 			style={{
// 				marginTop: 100,
// 				flexDirection: 'row',
// 				justifyContent,
// 				flexWrap: 'wrap',
// 				position: 'absolute',
// 				top: 999999999999,
// 			}}
// 		>
// 			{data.map((item, idx) => {
// 				const isFixed = 'Portugal' === item.key;

// 				return (
// 					<View
// 						onLayout={(e) => handleLayout(e, idx, isFixed)}
// 						key={item.key}
// 					>
// 						<RenderItem
// 							isHandle={false}
// 							key={item.key}
// 							item={item}
// 						/>
// 					</View>
// 				);
// 			})}
// 		</View>
// 	);
// };

export default Dashboard;
