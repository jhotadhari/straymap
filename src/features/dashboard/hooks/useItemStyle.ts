/**
 * External dependencies
 */
import { useContext, useMemo } from 'react';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DashboardWidgetProps } from '../types';
import { useAppSelector } from '../../../store/hooks';
import { selectDashboardStyle, selectElementsSettings } from '../selectors';
import { ControlContext } from '../ControlContext';

const useItemStyle = (item: DashboardWidgetProps['item']) => {
	const dashboardWidgets = useAppSelector(selectElementsSettings);

	const { position } = useContext(ControlContext);
	const dashboardStyle = useAppSelector((state) => selectDashboardStyle(state, position));

	const showLabel = item?.showLabel ?? dashboardStyle.showLabel;
	const showIcon = item?.showIcon ?? dashboardStyle.showIcon;

	const fontSize = item?.fontSize ?? dashboardStyle.fontSize;

	const minWidth = useMemo(
		() =>
			item?.minWidth ??
			get(dashboardWidgets, [item?.elementType || '', 'defaultMinWidth'], 75),
		[
			item?.minWidth,
			item?.elementType,
			dashboardWidgets,
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
			showLabel,
			showIcon,
		}),
		[
			fontSize,
			minWidth,
			textAlign,
			showLabel,
			showIcon,
		]
	);
};

export default useItemStyle;
