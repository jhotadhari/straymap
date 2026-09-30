/**
 * External dependencies
 */
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { MenuActionOption } from '../../../types';
import BottomDrawerContext from '../BottomDrawerContext';
import { getBottomDrawerItem } from '../dynamicItems';
import { selectItemKeys } from '../selectors';
import { useChartItemLabels } from '../../chart/hooks/useChartItemLabels';

/**
 * Menu options for the bottom drawer's item switcher: one per available
 * drawer item, with labels, icons, and a callback that activates the item
 * (expanding the drawer when collapsed). Labels are returned translated —
 * chart labels come pre-translated from useChartItemLabels, so only item
 * i18n keys are run through t() here.
 */
export const useBottomDrawerMenuOptions = (): MenuActionOption[] => {
	const { t } = useTranslation();
	const { setActiveItemKey, getIsFullyCollapsed, expand } = useContext(BottomDrawerContext);

	const itemKeys = useAppSelector(selectItemKeys);
	const chartLabels = useChartItemLabels();

	return useMemo(
		() =>
			itemKeys.map((key): MenuActionOption => {
				const item = getBottomDrawerItem(key);
				return {
					key,
					label: item?.label ? t(item.label) : (chartLabels[key] ?? key),
					leadingIcon: item?.iconSource,
					IconComponent: item?.IconComponent,
					cb: () => {
						setActiveItemKey(key);
						if (getIsFullyCollapsed()) {
							expand(true);
						}
					},
				};
			}),
		[
			t,
			itemKeys,
			chartLabels,
			setActiveItemKey,
			getIsFullyCollapsed,
			expand,
		]
	);
};
