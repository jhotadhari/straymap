/**
 * External dependencies
 */
import { FC, useContext, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MapContextMenuSourceComponentProps, MenuActionOption } from '../../../types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { MapContext } from '../../../Context';
import { isPressNearCenter } from '../../mapContextMenu/isPressNearCenter';
import { isPressOnLabel } from '../../mapContextMenu/isPressOnLabel';
import { selectMeasureActive } from '../../measure/selectors';
import { clearMeasurement } from '../../measure/slice';

/**
 * Short-press source for the active measure-distance measurement: offers
 * "Stop measurement". Contributes only when a measurement is active and
 * the menu was triggered by the measurement label itself (a native map
 * label hit) or by a press near the viewport center.
 */
const MeasureShortSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const dispatch = useAppDispatch();
	const measureActive = useAppSelector(selectMeasureActive);
	const { mapPositionSvRef } = useContext(MapContext);

	const options = useMemo<MenuActionOption[]>(() => {
		if (context.press !== 'short' || !measureActive) {
			return [];
		}
		if (
			context.pressOrigin !== 'label' &&
			!isPressOnLabel(context) &&
			!isPressNearCenter(context, mapPositionSvRef.current)
		) {
			return [];
		}
		return [
			{
				key: 'stopMeasurement',
				label: 'measure.stopMeasurement',
				leadingIcon: 'ruler-square',
				cb: () => {
					dispatch(clearMeasurement());
				},
			},
		];
	}, [
		context,
		measureActive,
		mapPositionSvRef,
		dispatch,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default MeasureShortSource;
