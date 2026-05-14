/**
 * External dependencies
 */
import { View, ViewStyle } from 'react-native';
import { Dispatch, FC, SetStateAction, useContext } from 'react';
import { get } from 'lodash-es';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { BottomBarHeight } from '../../../../types';
import * as dashboardElementComponents from '../elements';
import { useAppSelector } from '../../../hooks';
import { selectUnitPrefs } from '../../general/selectors';
import { selectItems, selectDashboardStyle } from '../selectors';
import { AppContext } from '../../../../Context';

const Dashboard: FC<{
	outerWidth: number;
	style?: ViewStyle;
}> = ({ outerWidth, style }) => {
	const theme = useTheme();

	const { setBottomBarHeight } = useContext(AppContext);

	const elements = useAppSelector((state) => selectItems(state, { position: 'bottom' }));
	const dashboardStyle = useAppSelector(selectDashboardStyle);

	return (
		<View
			style={[
				{
					bottom: 0,
					position: 'absolute',
					width: outerWidth,
					backgroundColor: theme.colors.background,
				},
				style,
			]}
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
						const Display = get(dashboardElementComponents, [
							element.elementType as string,
							'Display',
						]);
						return Display ? (
							<Display
								key={element?.key || index}
								dashboardElement={element}
							/>
						) : null;
					})}
			</View>
		</View>
	);
};

export default Dashboard;
