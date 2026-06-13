/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectEditItem, selectElementsSettings } from '../../selectors';
import { setItem } from '../../slice';
import { get, omit } from 'lodash-es';
import NumericRowControlSegmented from '../../../../../components/generic/controls/NumericRowControlSegmented';

const validate = (val: number) => val > 0 && val <= 999;

const ItemMinWidthControl: FC<{ buttonLabel?: string }> = ({ buttonLabel }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { item } = useAppSelector(selectEditItem);
	const dashboardElements = useAppSelector(selectElementsSettings);

	const defaultMinWidth = useMemo(
		() => get(dashboardElements, [item?.elementType || '', 'defaultMinWidth'], 75),
		[item?.elementType, dashboardElements]
	);

	const handleToggleOption = useCallback(() => {
		if (undefined === item?.minWidth) {
			item &&
				dispatch(
					setItem({
						...item,
						minWidth: defaultMinWidth,
					})
				);
		} else {
			item && dispatch(setItem(omit(item, 'minWidth')));
		}
	}, [item]);

	const numValueActive = undefined !== item?.minWidth;

	const handleUpdate = useCallback(
		(newValue: number) => {
			numValueActive &&
				dispatch(
					setItem({
						...item,
						minWidth: newValue,
					})
				);
		},
		[item, numValueActive]
	);

	return (
		<NumericRowControlSegmented
			label={t('dashboard.minWidth')}
			buttonLabel={buttonLabel}
			numValueActive={undefined !== item?.minWidth}
			toggleOption={handleToggleOption}
			value={item?.minWidth ?? defaultMinWidth}
			onUpdate={handleUpdate}
			numType="int"
			validate={validate}
		/>
	);
};

export default ItemMinWidthControl;
