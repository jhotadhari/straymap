/**
 * External dependencies
 */
import React, { useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

/**
 * Internal dependencies
 */
import LayersControl from '../../../store/features/baseMap/components/controls/layers/LayersControl';
import ProfilesControl from '../../../store/features/baseMap/components/controls/profiles/ProfilesControl';
import ButtonHighlight from '../../generic/ButtonHighlight';
import { useAppDispatch } from '../../../store/hooks';
import { setUiItemKeys } from '../../../store/features/ui/uiSlice';

const DisplayComponent = ({
	drawerWidth,
	drawerHeight,
	drawerSide,
}: {
	drawerWidth: number;
	drawerHeight: number;
	drawerSide: string;
}) => {
	const { t } = useTranslation();

	const theme = useTheme();

	const dispatch = useAppDispatch();

	const [scrollEnabled, setScrollEnabled] = useState(true);

	return (
		<ScrollView
			scrollEnabled={scrollEnabled}
			style={{
				backgroundColor: theme.colors.background,
				height: drawerHeight,
				width: drawerWidth,
				position: 'absolute',
				marginTop: 3,
			}}
		>
			<ButtonHighlight
				style={{ marginHorizontal: 20, marginBottom: 20 }}
				mode="outlined"
				onPress={() => dispatch(setUiItemKeys(['settings', 'maps']))}
			>
				<Text>{t('openMapsSettings')}</Text>
			</ButtonHighlight>

			<LayersControl
				setScrollEnabled={setScrollEnabled}
				width={drawerWidth}
				reverseDraggableItem={'left' === drawerSide}
				uiStateKey={'DrawerMapLayersExpanded' + drawerSide}
				newLabel={t('addNew')}
				saveOnChange={true}
				saveOnUnmount={false}
			/>

			<ProfilesControl
				setScrollEnabled={setScrollEnabled}
				width={drawerWidth}
				reverseDraggableItem={'left' === drawerSide}
				uiStateKey={'DrawerMapsforgeProfilesExpanded' + drawerSide}
				newLabel={t('addNew')}
				saveOnChange={true}
				saveOnUnmount={false}
			/>
		</ScrollView>
	);
};

export default {
	key: 'maps',
	label: 'maps',
	DisplayComponent,
	iconSource: 'map',
};
