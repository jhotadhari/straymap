/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { get } from 'lodash-es';
import { useTheme } from 'react-native-paper';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../../FeatureRegistry';
import DrawerContext from '../DrawerContext';
import { DrawerPanel } from '../types';
import { AppContext } from '../../../Context';

const handleSize = 50;

const DrawerContent: FC<{}> = () => {
	const { activeItemKey, width, height } = useContext(DrawerContext);

	const { bottomBarHeight, bottomDrawerHeightSv } = useContext(AppContext);

	const theme = useTheme();
	const { isScrollContent, DisplayComponent } = useMemo(() => {
		if (!activeItemKey) {
			return {};
		}
		let isScrollContent = false;
		let DisplayComponent:
			DrawerPanel['DisplayComponent'] | DrawerPanel['DisplayComponentScroll'] = get(
			featureRegistry.getDrawerPanels() as { [itemKey: string]: DrawerPanel },
			[
				activeItemKey,
				'DisplayComponentScroll',
			]
		);

		if (DisplayComponent) {
			isScrollContent = true;
		} else {
			DisplayComponent = get(
				featureRegistry.getDrawerPanels() as { [itemKey: string]: DrawerPanel },
				[
					activeItemKey,
					'DisplayComponent',
				]
			);
		}

		return {
			isScrollContent,
			DisplayComponent,
		};
	}, [activeItemKey]);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	useEffect(() => {
		setScrollEnabled(true);
	}, [DisplayComponent]);

	const baseMapHeight = height + (bottomBarHeight?.bottomDrawer ?? 0);
	const animatedHeight = useAnimatedStyle(
		() => ({
			height: baseMapHeight - bottomDrawerHeightSv.value,
		}),
		[baseMapHeight]
	);

	const styleScrollView = useMemo(
		() => [
			styles.scrollView,
			{ backgroundColor: theme.colors.background, width },
			animatedHeight,
		],
		[
			theme,
			width,
			animatedHeight,
		]
	);

	if (!DisplayComponent) {
		return null;
	}

	return (
		<View style={styles.container}>
			{isScrollContent && DisplayComponent && (
				<Animated.ScrollView
					scrollEnabled={scrollEnabled}
					style={styleScrollView}
				>
					<DisplayComponent
						scrollEnabled={scrollEnabled}
						setScrollEnabled={setScrollEnabled}
					/>

					{/* Thats a weird fix for a padding that doesn't work */}
					<View style={styles.paddingFix} />
				</Animated.ScrollView>
			)}

			{!isScrollContent && DisplayComponent && <DisplayComponent />}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { marginTop: handleSize / 4 },
	scrollView: { position: 'absolute' },
	paddingFix: { height: 8 },
});

export default DrawerContent;
