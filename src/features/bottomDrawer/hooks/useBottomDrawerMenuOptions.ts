/**
 * External dependencies
 */
import { useContext, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { MenuActionOption } from '../../../types';
import BottomDrawerContext from '../BottomDrawerContext';
import { getBottomDrawerItem } from '../dynamicItems';
import { selectItemKeys } from '../selectors';
import { useProfileItemLabels } from '../../altitudeProfile/hooks/useProfileItemLabels';

/**
 * Menu options for the bottom drawer's item switcher: one per available
 * drawer item, with labels, icons, and a callback that activates the item
 * (expanding the drawer when collapsed).
 */
export const useBottomDrawerMenuOptions = (): MenuActionOption[] => {
	const { setActiveItemKey, getIsFullyCollapsed, expand } = useContext(BottomDrawerContext);

	const itemKeys = useAppSelector(selectItemKeys);
	const profileLabels = useProfileItemLabels();

	return useMemo(
		() =>
			itemKeys.map((key): MenuActionOption => {
				const item = getBottomDrawerItem(key);
				return {
					key,
					label: item?.label ?? profileLabels[key] ?? key,
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
			itemKeys,
			profileLabels,
			setActiveItemKey,
			getIsFullyCollapsed,
			expand,
		]
	);
};
