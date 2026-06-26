/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectDashboardStyle, selectEditItem } from '../../selectors';
import { setItem } from '../../slice';
import { omit } from 'lodash-es';
import { ControlContext } from '../../ControlContext';
import NumericRowControlSegmented from '../../../../../components/generic/controls/NumericRowControlSegmented';

const validate = (val: number) => val > 0 && val <= 99;

const ItemFontSizeControl: FC<{ buttonLabel?: string }> = ({ buttonLabel }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { position } = useContext(ControlContext);

	const { item } = useAppSelector(selectEditItem);

	const dashboardStyle = useAppSelector((state) => selectDashboardStyle(state, position));

	const handleToggleOption = useCallback(() => {
		if (undefined === item?.fontSize) {
			item &&
				dispatch(
					setItem({
						...item,
						fontSize: dashboardStyle.fontSize,
					})
				);
		} else {
			item && dispatch(setItem(omit(item, 'fontSize')));
		}
	}, [
		dispatch,
		item,
		dashboardStyle,
	]);

	const numValueActive = undefined !== item?.fontSize;

	const handleUpdate = useCallback(
		(newValue: number) => {
			numValueActive &&
				dispatch(
					setItem({
						...item,
						fontSize: newValue,
					})
				);
		},
		[
			dispatch,
			item,
			numValueActive,
		]
	);

	return (
		<NumericRowControlSegmented
			label={t('dashboard.fontSize')}
			Info={t('dashboard.hint.item.fontSize')}
			buttonLabel={buttonLabel}
			numValueActive={undefined !== item?.fontSize}
			toggleOption={handleToggleOption}
			value={item?.fontSize ?? dashboardStyle.fontSize}
			onUpdate={handleUpdate}
			numType="int"
			validate={validate}
		/>
	);
};

export default ItemFontSizeControl;
