/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { DashboardWidget } from '../../types';
import Control from './Control';
import Display, { Options } from './Display';
import { CenterInner } from '../../../appearance/appOverlays/Center';
import { useAppSelector } from '../../../../store/hooks';
import { selectCursor } from '../../../appearance/selectors';

const Icon: FC<{
	color: string;
	size: number;
}> = ({ color, size }) => {
	const cursorConfigStore = useAppSelector(selectCursor);
	const cursorConfig = useMemo(
		() => ({
			...cursorConfigStore,
			size,
			color,
		}),
		[
			cursorConfigStore,
			size,
			color,
		]
	);
	return <CenterInner cursor={cursorConfig} />;
};

export default {
	key: 'centerCoordinates',
	label: 'dashboard.centerCoordinates',
	Display,
	Control,
	Icon,
	defaultMinWidth: 250,
} as DashboardWidget<Options>;
