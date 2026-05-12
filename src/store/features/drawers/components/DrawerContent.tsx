/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import * as drawerItems from '../items';
import DrawerContext from '../DrawerContext';
import { DrawerItem } from '../types';

const handleSize = 50;

const DrawerContent: FC<{}> = () => {
	const { activeItemKey } = useContext(DrawerContext);

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

	if (!DisplayComponent) {
		return null;
	}

	return (
		<View
			style={{
				padding: 20,
				marginTop: handleSize / 4,
			}}
		>
			<DisplayComponent />
		</View>
	);
};

export default DrawerContent;
