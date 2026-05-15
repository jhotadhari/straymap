/**
 * External dependencies
 */
import React, { FC, Fragment, useCallback, useContext, useMemo, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, View, ViewStyle } from 'react-native';
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
import { useAppSelector } from '../../../hooks';
import { selectDashboardStyle, selectItems } from '../selectors';
import DashboardItem from './DashboardItem';
import { AppContext } from '../../../../Context';

const Dashboard: FC<{
	style?: ViewStyle;
	itemStyle?: ViewStyle;
	position: string;
	onDragStart?: DragStartCallback;
	onDragEnd?: SortableFlexDragEndCallback;
	sortEnabled?: boolean;
	highlightEditItem?: boolean;
	shouldSetBottomBarHeight?: boolean;
	shouldSetTopBarHeight?: boolean;
	onPressItem?: (itemKey: string, event: GestureResponderEvent) => void;
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
}) => {
	const { setBottomBarHeight, setTopAppBarHeight } = useContext(AppContext);

	const items = useAppSelector((state) => selectItems(state, { position }));
	const dashboardStyle = useAppSelector(selectDashboardStyle);

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
				// setTopAppBarHeight( height );	// ??? todo
			}
		},
		[
			position,
			items.length,
			setBottomBarHeight,
			setTopAppBarHeight,
			shouldSetBottomBarHeight,
			shouldSetTopBarHeight,
		]
	);

	const [isDraggingKey, setIsDraggingKey] = useState<undefined | string>(undefined);

	const handleDragStart = useCallback(
		(params: DragStartParams) => {
			setIsDraggingKey(params.key.replace('.$', ''));
			onDragStart && onDragStart(params);
		},
		[onDragStart]
	);

	const handleDragEnd = useCallback(
		(params: SortableFlexDragEndParams) => {
			setIsDraggingKey(undefined);
			onDragEnd && onDragEnd(params);
		},
		[onDragEnd]
	);

	return (
		<View
			style={style}
			onLayout={handleLayout}
		>
			<Sortable.Flex
				gap={0}
				padding={0}
				sortEnabled={sortEnabled}
				customHandle={true}
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
	);
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
