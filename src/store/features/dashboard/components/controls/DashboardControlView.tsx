/**
 * External dependencies
 */
import React, { FC, useContext, useEffect } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../hooks';
import { setEditItemKey, setIsEditingDashboard } from '../../dashboardSlice';
import { AppContext } from '../../../../../Context';
import NewItemControl from './NewItemControl';
import InfoButton from '../../../../../components/generic/InfoButton';
import DashboardControl from './DashboardControl';
import ItemControl from './ItemControl';

const DashboardControlView: FC<{}> = () => {
	const theme = useTheme();

	const { mapHeight } = useContext(AppContext);

	const dispatch = useAppDispatch();

	const { t } = useTranslation();

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

				{/* <DashboardControl position="bottom" /> */}

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
