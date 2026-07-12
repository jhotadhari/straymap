/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { without } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { DRAWER_ICON_SIZE } from '../../../drawers/constants';
import { sharedStyles } from './sharedDeps';
import TagBulkActions from './BulkActions';
import { FooterContext } from './Context';

const TagFooter: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { checkedIds, tagsCount, setCheckedIds, tagIds } = useContext(FooterContext);

	const style = useMemo(
		() => [
			sharedStyles.footer,
			{ borderColor: theme.colors.onBackground },
		],
		[theme]
	);

	const toggleCheckedIds = useCallback(() => {
		setCheckedIds?.((ids) => {
			return without(tagIds, ...ids);
		});
	}, [tagIds, setCheckedIds]);

	const labelStyle = useMemo(
		() => ({
			color: checkedIds.length ? theme.colors.onBackground : theme.colors.onSurfaceDisabled,
		}),
		[theme, checkedIds]
	);

	return (
		<View style={style}>
			<View style={sharedStyles.flexRowGap}>
				<TagBulkActions />
				<Text style={labelStyle}>{t('lines.bulkActions')}</Text>
				<Text style={labelStyle}>
					{sprintf(t('lines.selectedCount'), checkedIds.length, tagsCount)}
				</Text>
			</View>

			<View style={sharedStyles.flexRowGap}>
				<ButtonHighlight
					mode="text"
					compact
					onPress={toggleCheckedIds}
				>
					<Icon
						source="swap-horizontal-variant"
						size={DRAWER_ICON_SIZE}
					/>
				</ButtonHighlight>
			</View>
		</View>
	);
};

export default TagFooter;
