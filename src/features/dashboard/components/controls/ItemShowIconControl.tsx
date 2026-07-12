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

const ItemShowIconControl: FC<{ buttonLabel?: string }> = ({ buttonLabel }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { position } = useContext(ControlContext);

	const { item } = useAppSelector(selectEditItem);

	const dashboardStyle = useAppSelector((state) => selectDashboardStyle(state, position));

	const handleToggleOption = useCallback(() => {
		if (undefined === item?.showIcon) {
			item &&
				dispatch(
					setItem({
						...item,
						showIcon: dashboardStyle.showIcon,
					})
				);
		} else {
			item && dispatch(setItem(omit(item, 'showIcon')));
		}
	}, [
		dispatch,
		item,
		dashboardStyle,
	]);

	const boolValueActive = undefined !== item?.showIcon;

	const handleUpdate = useCallback(
		(newValue: boolean) => {
			item &&
				dispatch(
					setItem({
						...item,
						showIcon: newValue,
					})
				);
		},
		[dispatch, item]
	);

	return (
		<ToggleRowControlSegmented
			label={t('dashboard.showIcon')}
			Info={t('dashboard.hint.item.showIcon')}
			buttonLabel={buttonLabel}
			boolValueActive={boolValueActive}
			toggleOption={handleToggleOption}
			value={item?.showIcon ?? dashboardStyle.showIcon}
			onUpdate={handleUpdate}
		/>
	);
};

export default ItemShowIconControl;
