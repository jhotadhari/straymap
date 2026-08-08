/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { omit } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectDashboardStyle, selectEditItem } from '../../selectors';
import { setItem } from '../../slice';
import { ControlContext } from '../../ControlContext';
import ToggleRowControlSegmented from '../../../../components/generic/controls/ToggleRowControlSegmented';

const ItemShowLabelControl: FC<{ buttonLabel?: string }> = ({ buttonLabel }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { position } = useContext(ControlContext);

	const { item } = useAppSelector(selectEditItem);

	const dashboardStyle = useAppSelector((state) => selectDashboardStyle(state, position));

	const handleToggleOption = useCallback(() => {
		if (undefined === item?.showLabel) {
			item &&
				dispatch(
					setItem({
						...item,
						showLabel: dashboardStyle.showLabel,
					})
				);
		} else {
			item && dispatch(setItem(omit(item, 'showLabel')));
		}
	}, [
		dispatch,
		item,
		dashboardStyle,
	]);

	const boolValueActive = undefined !== item?.showLabel;

	const handleUpdate = useCallback(
		(newValue: boolean) => {
			item &&
				dispatch(
					setItem({
						...item,
						showLabel: newValue,
					})
				);
		},
		[dispatch, item]
	);

	return (
		<ToggleRowControlSegmented
			label={t('dashboard.showLabel')}
			Info={t('dashboard.hint.item.showLabel')}
			buttonLabel={buttonLabel}
			boolValueActive={boolValueActive}
			toggleOption={handleToggleOption}
			value={item?.showLabel ?? dashboardStyle.showLabel}
			onUpdate={handleUpdate}
		/>
	);
};

export default ItemShowLabelControl;
