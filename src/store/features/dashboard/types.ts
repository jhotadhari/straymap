/**
 * External dependencies
 */
import { ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { UnitPref } from '../general/types';

export type DashboardStyle = {
	align: string;
	fontSize: number;
};

export type DashboardElementStyle = {
	fontSize?: 'default' | number;
	minWidth?: number;
};

export type DashboardElementConf = {
	key: string;
	type: string | null;
	options?: object;
	style?: DashboardElementStyle;
};

export type DashboardDisplayComponentProps = {
	dashboardElement: DashboardElementConf;
	style?: ViewStyle;
	unitPrefs: { [value: string]: UnitPref };
	dashboardStyle: DashboardStyle;
};
