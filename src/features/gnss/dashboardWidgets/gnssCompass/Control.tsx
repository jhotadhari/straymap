/**
 * External dependencies
 */
import React, { FC, useCallback } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectEditItem } from '../../../dashboard/selectors';
import { setItem } from '../../../dashboard/slice';
import { DashboardItem } from '../../../dashboard/types';
import ItemMinWidthControl from '../../../dashboard/components/controls/ItemMinWidthControl';
import ItemFontSizeControl from '../../../dashboard/components/controls/ItemFontSizeControl';
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import { sharedStyles } from '../../../dashboard/dashboardWidgets/sharedDeps';
import { Options } from './Display';

const Control: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const { item } = useAppSelector(selectEditItem) as {
		item?: DashboardItem<Options>;
	};

	const showNumber = item?.options?.showNumber !== false;

	// Toggling only writes this item's `showNumber` option — no other
	// side effects.
	const handleToggleShowNumber = useCallback(() => {
		if (!item) {
			return;
		}
		dispatch(
			setItem({
				...item,
				options: {
					...item.options,
					showNumber: !showNumber,
				},
			})
		);
	}, [
		dispatch,
		item,
		showNumber,
	]);

	return (
		<View style={sharedStyles.container}>
			<ItemMinWidthControl buttonLabel={t('dashboard.useDefault')} />

			<ItemFontSizeControl buttonLabel={t('dashboard.followDashboardSetting')} />

			<ToggleRowControl
				label={t('dashboard.showNumber')}
				value={showNumber}
				onToggle={handleToggleShowNumber}
				Info={t('dashboard.hint.item.showNumber')}
			/>
		</View>
	);
};

export default Control;
