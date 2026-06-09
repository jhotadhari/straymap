/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
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
	const { activeItemKey, width, height, side } = useContext(DrawerContext);

	const theme = useTheme();
	const DisplayComponent = useMemo(
		() =>
			activeItemKey
				? get(drawerItems as { [itemKey: string]: DrawerItem }, [
						activeItemKey,
						'DisplayComponent',
					])
				: undefined,
		[activeItemKey]
	);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	useEffect(() => {
		setScrollEnabled(true);
	}, [DisplayComponent]);

	if (!DisplayComponent) {
		return null;
	}

	return (
		<View
			style={{
				marginTop: handleSize / 4,
			}}
		>
			<ScrollView
				scrollEnabled={scrollEnabled}
				style={{
					backgroundColor: theme.colors.background,
					height,
					width,
					position: 'absolute',
				}}
			>
				<DisplayComponent
					scrollEnabled={scrollEnabled}
					setScrollEnabled={setScrollEnabled}
				/>

				{/* Thats a weird fix for a padding that doesn't work */}
				<View style={{ height: 8 }} />
			</ScrollView>
		</View>
	);
};

export default DrawerContent;
