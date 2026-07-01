/**
 * External dependencies
 */
import { useContext, useMemo } from 'react';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DashboardElementProps } from '../types';
import { useAppSelector } from '../../../hooks';
import { selectDashboardStyle, selectElementsSettings } from '../selectors';
import { ControlContext } from '../ControlContext';

const useItemStyle = (item: DashboardElementProps['item']) => {
	const dashboardElements = useAppSelector(selectElementsSettings);

	const { position } = useContext(ControlContext);
	const dashboardStyle = useAppSelector((state) => selectDashboardStyle(state, position));

	const fontSize = item?.fontSize ?? dashboardStyle.fontSize;

	const minWidth = useMemo(
		() =>
			item?.minWidth ??
			get(dashboardElements, [item?.elementType || '', 'defaultMinWidth'], 75),
		[
			item?.minWidth,
			item?.elementType,
			dashboardElements,
		]
	);

	const textAlign: 'left' | 'right' | 'center' = useMemo(() => {
		switch (dashboardStyle.align) {
			case 'left':
			case 'right':
				return dashboardStyle.align;
			default:
				return 'center';
		}
	}, [dashboardStyle]);

	return useMemo(
		() => ({
			fontSize: fontSize ? fontSize : 1,
			minWidth: minWidth ? minWidth : 1,
			textAlign,
		}),
		[
			fontSize,
			minWidth,
			textAlign,
		]
	);
};

export default useItemStyle;
