/**
 * External dependencies
 */
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectDashboardStyle, selectEditItem } from '../../selectors';
import { setItem } from '../../dashboardSlice';
import { omit } from 'lodash-es';
import { SegmentedNumericRowControl } from '../../../../../components/generic/controls/NumericRowControlsNew';

const validate = (val: number) => val >= 0 && val <= 99;

const ItemFontSizeControl: FC<{ buttonLabel?: string }> = ({ buttonLabel }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { item } = useAppSelector(selectEditItem);

	const dashboardStyle = useAppSelector(selectDashboardStyle);

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
		[item,numValueActive]
	);

	return (
		<SegmentedNumericRowControl
			label={t('fontSize')}
			Info={t('hint.dashboard.item.fontSize')}
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
