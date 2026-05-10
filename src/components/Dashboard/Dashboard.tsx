/**
 * External dependencies
 */
import { View } from 'react-native';
import { Dispatch, SetStateAction } from 'react';
import { get } from 'lodash-es';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { BottomBarHeight } from '../../types';
import * as dashboardElementComponents from './elements';
import { DashboardElementConf, DashboardStyle } from '../../store/features/dashboard/types';
import { UnitPref } from '../../store/features/general/types';

const Dashboard = ({
	elements,
	dashboardStyle,
	unitPrefs,
	setBottomBarHeight,
	outerWidth,
}: {
	elements: DashboardElementConf[];
	dashboardStyle: DashboardStyle;
	unitPrefs: { [value: string]: UnitPref };
	setBottomBarHeight?: Dispatch<SetStateAction<BottomBarHeight>>;
	outerWidth: number;
}) => {
	const theme = useTheme();
	return (
		<View
			style={{
				bottom: 0,
				position: 'absolute',
				width: outerWidth,
				// zIndex: 100,
				backgroundColor: theme.colors.background,
			}}
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
