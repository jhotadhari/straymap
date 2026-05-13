/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DragStartParams, SortableFlexDragEndParams } from 'react-native-sortables';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectItems } from '../../selectors';
import { setEditItemKey, setItems } from '../../dashboardSlice';
import { AppContext } from '../../../../../Context';
import Dashboard from '../Dashboard';
import NewItemControl from './NewItemControl';
import InfoButton from '../../../../../components/generic/InfoButton';
import GeneralControl from './GeneralControl';
import OneControl from './OneControl';
import ItemControl from './ItemControl';

const DashboardControlView: FC<{}> = () => {
	const theme = useTheme();

	const [scrollEnabled, setScrollEnabled] = useState(true);

	const { appInnerHeight } = useContext(AppContext);

	const dispatch = useAppDispatch();

	const { t } = useTranslation();

	const items = useAppSelector((state) => selectItems(state, { position: 'bottom' }));

	const handleDragStart = useCallback((event: DragStartParams) => {
		dispatch(setEditItemKey(event.key.replace('.$', '')));
		setScrollEnabled(false);
	}, []);

	useEffect( () => () => {
		dispatch(setEditItemKey(undefined));
	}, [] );

	const handleItemPress = useCallback((itemKey: string) => {
		dispatch(setEditItemKey(itemKey));
	}, []);

	const handleDragEnd = useCallback(
		({ indexToKey }: SortableFlexDragEndParams) => {
			setScrollEnabled(true);
			dispatch(
				setItems({
					position: 'bottom',
					items: indexToKey
						.map((toKey) => {
							return items.find((item) => item.key === toKey.replace('.$', ''));
						})
						.filter((a) => !!a),
				})
			);
		},
		[items]
	);

	return (
		<View
			style={{
				height: appInnerHeight,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			}}
		>
			<ScrollView
				style={
					{
						// padding: 20,
						// backgroundColor: 'rgba(0,255,0,0.51)'
					}
				}
				scrollEnabled={scrollEnabled}
			>
				<View
					style={{
						justifyContent: 'space-between',
						flexDirection: 'row',
						marginBottom: 15,
						padding: 17,
					}}
				>
					<InfoButton
						label={t('dashboardElement', { count: 0 })}
						headerPlural={true}
						backgroundBlur={false}
						Info={t('hint.dashboard.elements')}
						buttonProps={{
							style: { marginTop: 0, marginBottom: 0 },
							icon: 'information-variant',
							mode: 'outlined',
							iconColor: theme.colors.primary,
						}}
					/>

					<NewItemControl />
				</View>

				<OneControl position="top" />

				<OneControl position="bottom" />

				<GeneralControl />

				<ItemControl />
			</ScrollView>

			<Dashboard
				position={'bottom'}
				sortEnabled={true}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onPressItem={handleItemPress}
			/>
		</View>
	);
};

export default DashboardControlView;
