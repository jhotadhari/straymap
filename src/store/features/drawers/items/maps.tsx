/**
 * External dependencies
 */
import React, { useContext, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

/**
 * Internal dependencies
 */
import LayersControl from '../../baseMap/components/controls/layers/LayersControl';
import ProfilesControl from '../../baseMap/components/controls/profiles/ProfilesControl';
import { useAppDispatch } from '../../../hooks';
import { setUiItemKeys } from '../../ui/uiSlice';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import DrawerContext from '../DrawerContext';
import { DrawerItem } from '../types';

const DisplayComponent = () => {
	const { t } = useTranslation();

	const { width, height, side } = useContext(DrawerContext);

	const theme = useTheme();

	const dispatch = useAppDispatch();

	const [scrollEnabled, setScrollEnabled] = useState(true);

	return (
		<ScrollView
			scrollEnabled={scrollEnabled}
			style={{
				backgroundColor: theme.colors.background,
				height: height,
				width,
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
				width={width}
				reverseDraggableItem={'left' === side}
				uiStateKey={'DrawerMapLayersExpanded' + side}
				newLabel={t('addNew')}
				saveOnChange={true}
				saveOnUnmount={false}
			/>

			<ProfilesControl
				setScrollEnabled={setScrollEnabled}
				width={width}
				reverseDraggableItem={'left' === side}
				uiStateKey={'DrawerMapsforgeProfilesExpanded' + side}
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
} as DrawerItem;
