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
import { selectIsCenterActive, selectShowMeasurementLabel } from '../selectors';
import { setShowMeasurementLabel } from '../slice';
import { selectMeasureActive } from '../../measure/selectors';

/**
 * Short-press source for the GNSS center-mode measurement label: offers
 * "Hide label" / "Show label" (persisted). Contributes only when center
 * mode is active, no measure-distance measurement is running, and the
 * menu was triggered by the label itself (a native map label hit) or by
 * a press near the viewport center.
 */
const GnssLabelShortSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const dispatch = useAppDispatch();
	const isCenterActive = useAppSelector(selectIsCenterActive);
	const showMeasurementLabel = useAppSelector(selectShowMeasurementLabel);
	const measureActive = useAppSelector(selectMeasureActive);
	const { mapPositionSvRef } = useContext(MapContext);

	const options = useMemo<MenuActionOption[]>(() => {
		if (context.press !== 'short' || !isCenterActive || measureActive) {
			return [];
		}
		if (
			context.pressOrigin !== 'label' &&
			!isPressOnLabel(context) &&
			!isPressNearCenter(context, mapPositionSvRef.current)
		) {
			return [];
		}
		return showMeasurementLabel
			? [
					{
						key: 'hideMeasurement',
						label: 'gnss.hideMeasurement',
						leadingIcon: 'ruler-square',
						cb: () => {
							dispatch(setShowMeasurementLabel(false));
						},
					},
				]
			: [
					{
						key: 'showMeasurement',
						label: 'gnss.showMeasurement',
						leadingIcon: 'ruler-square',
						cb: () => {
							dispatch(setShowMeasurementLabel(true));
						},
					},
				];
	}, [
		context,
		isCenterActive,
		showMeasurementLabel,
		measureActive,
		mapPositionSvRef,
		dispatch,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default GnssLabelShortSource;
