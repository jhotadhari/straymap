/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../../FeatureRegistry';
import BottomDrawerContext from '../BottomDrawerContext';
import { BottomDrawerItem } from '../types';
import { BOTTOM_DRAWER_DEBUG } from '../constants';

const BottomDrawerContent: FC<{}> = () => {
	const { activeItemKey } = useContext(BottomDrawerContext);

	const DisplayComponent = useMemo(() => {
		if (!activeItemKey) {
			return undefined;
		}
		return get(
			featureRegistry.getBottomDrawerItems() as { [itemKey: string]: BottomDrawerItem },
			[activeItemKey, 'DisplayComponent']
		);
	}, [activeItemKey]);

	if (!DisplayComponent) {
		return null;
	}

	return (
		<View style={[styles.container, { backgroundColor: BOTTOM_DRAWER_DEBUG.content }]}>
			<DisplayComponent />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default BottomDrawerContent;
