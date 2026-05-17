/**
 * External dependencies
 */
import React, { FC, useContext, useEffect } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../hooks';
import { setEditItemKey, setIsEditingDashboard } from '../../dashboardSlice';
import { AppContext } from '../../../../../Context';
import DashboardControl from './DashboardControl';
import ItemControl from './ItemControl';

const DashboardControlView: FC<{}> = () => {

	const { mapHeight } = useContext(AppContext);

	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(setIsEditingDashboard(true));
		return () => {
			dispatch(setIsEditingDashboard(false));
			dispatch(setEditItemKey(undefined));
		};
	}, []);

	return (
		<View
			style={{
				height: mapHeight,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			}}
		>
			<ScrollView scrollEnabled={true}>
				<DashboardControl />

				{/* <GeneralControl /> */}

				<ItemControl />
			</ScrollView>

			{/*
				Can't render the sortable dashboard here because it will break the buttons if scrollView scrolled.
			 */}
		</View>
	);
};

export default DashboardControlView;
