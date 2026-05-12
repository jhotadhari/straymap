/**
 * External dependencies
 */
import { View, ViewStyle } from 'react-native';
import { Dispatch, FC, SetStateAction } from 'react';
import { get } from 'lodash-es';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { BottomBarHeight } from '../../../../types';
import * as dashboardElementComponents from '../elements';
import { useAppSelector } from '../../../hooks';
import { selectUnitPrefs } from '../../general/selectors';
import { selectElements, selectDashboardStyle } from '../selectors';

const Dashboard : FC<{
	setBottomBarHeight?: Dispatch<SetStateAction<BottomBarHeight>>;
	outerWidth: number;
	style?: ViewStyle;
}> = ({
	setBottomBarHeight,
	outerWidth,
	style
}) => {
	const theme = useTheme();

	const elements = useAppSelector(selectElements);
	const dashboardStyle = useAppSelector(selectDashboardStyle);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	return (
		<View
			style={[{
				bottom: 0,
				position: 'absolute',
				width: outerWidth,
				backgroundColor: theme.colors.background,
			}, style]}
		>
			<View
				onLayout={(e) => {
					const { height } = e.nativeEvent.layout;
					setBottomBarHeight
						? setBottomBarHeight((bottomBarHeight) => ({
								...bottomBarHeight,
								dashboard: height,
							}))
						: null;
				}}
				style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					justifyContent: get(
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
					alignItems: 'center',
					paddingTop: 10,
					paddingBottom: 10,
				}}
			>
				{elements &&
					[...elements].map((element, index) => {
						const DisplayComponent = get(dashboardElementComponents, [
							element.type as string,
							'DisplayComponent',
						]);
						return DisplayComponent ? (
							<DisplayComponent
								key={element?.key || index}
								style={{
									paddingLeft: 10,
									paddingRight: 10,
								}}
								dashboardElement={element}
								unitPrefs={unitPrefs}
								dashboardStyle={dashboardStyle}
							/>
						) : null;
					})}
			</View>
		</View>
	);
};

export default Dashboard;
