/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { get } from 'lodash-es';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import * as drawerItems from '../items';
import DrawerContext from '../DrawerContext';
import { DrawerItem } from '../types';

const handleSize = 50;

const DrawerContent: FC<{}> = () => {
	const { activeItemKey, width, height } = useContext(DrawerContext);

	const theme = useTheme();
	const { isScrollContent, DisplayComponent } = useMemo(() => {
		if (!activeItemKey) {
			return {};
		}
		let isScrollContent = false;
		let DisplayComponent:
			| DrawerItem['DisplayComponent']
			| DrawerItem['DisplayComponentScroll'] = get(
			drawerItems as { [itemKey: string]: DrawerItem },
			[
				activeItemKey,
				'DisplayComponentScroll',
			]
		);

		if (DisplayComponent) {
			isScrollContent = true;
		} else {
			DisplayComponent = get(drawerItems as { [itemKey: string]: DrawerItem }, [
				activeItemKey,
				'DisplayComponent',
			]);
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

	const styleScrollView = useMemo(
		() => [styles.scrollView, { backgroundColor: theme.colors.background, height, width }],
		[
			theme,
			height,
			width,
		]
	);

	if (!DisplayComponent) {
		return null;
	}

	return (
		<View style={styles.container}>
			{isScrollContent && DisplayComponent && (
				<ScrollView
					scrollEnabled={scrollEnabled}
					style={styleScrollView}
				>
					<DisplayComponent
						scrollEnabled={scrollEnabled}
						setScrollEnabled={setScrollEnabled}
					/>

					{/* Thats a weird fix for a padding that doesn't work */}
					<View style={styles.paddingFix} />
				</ScrollView>
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
