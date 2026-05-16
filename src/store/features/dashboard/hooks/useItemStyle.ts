/**
 * External dependencies
 */
import { useMemo } from 'react';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DashboardElementProps } from '../types';
import { useAppSelector } from '../../../hooks';
import { selectDashboardStyle, selectElementsSettings } from '../selectors';

const useItemStyle = (item: DashboardElementProps['item']) => {
    const dashboardElements = useAppSelector(selectElementsSettings);
    const dashboardStyle = useAppSelector(selectDashboardStyle);

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

    return {
        fontSize,
        minWidth,
        textAlign,
    };
};

export default useItemStyle;