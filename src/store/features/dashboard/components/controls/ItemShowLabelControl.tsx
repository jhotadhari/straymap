/**
 * External dependencies
 */
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectEditItem } from '../../selectors';
import { setItem } from '../../slice';
import ToggleRowControl from '../../../../../components/generic/controls/ToggleRowControl';

const ItemShowLabelControl: FC<{}> = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { item } = useAppSelector(selectEditItem);

	const value = item?.showLabel !== false; // default true

	const handleToggle = useCallback(() => {
		if (!item) return;
		dispatch(
			setItem({
				...item,
				showLabel: !value,
			})
		);
	}, [
		dispatch,
		item,
		value,
	]);

	if (!item) return null;

	return (
		<ToggleRowControl
			label={t('dashboard.showLabel')}
			value={value}
			onToggle={handleToggle}
		/>
	);
};

export default ItemShowLabelControl;
