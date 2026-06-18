/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { without } from 'lodash-es';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../../drawers/constants';
import { sprintf } from 'sprintf-js';
import { sharedStyles } from './sharedDeps';
import BulkActions from './BulkActions';
import { FooterContext } from './Context';

const Footer: FC = () => {
	const theme = useTheme();

	const { checkedIds, linesCount, setCheckedIds, lineIds } = useContext(FooterContext);

	const style = useMemo(
		() => [
			sharedStyles.footer,
			{
				borderColor: theme.colors.onBackground,
			},
		],
		[theme]
	);

	const toggleCheckedIds = useCallback(() => {
		setCheckedIds &&
			setCheckedIds((ids) => {
				return without(lineIds, ...ids);
			});
	}, [lineIds]);

	const labelStyle = useMemo(
		() => ({
			color: checkedIds.length ? theme.colors.onBackground : theme.colors.onSurfaceDisabled,
		}),
		[theme, checkedIds]
	);

	return (
		<View style={style}>
			<BulkActions />

			<Text style={labelStyle}>
				{[
					'???Bulk actions',
					sprintf('%s/%s selected???', checkedIds.length, linesCount),
				].join(', ')}
			</Text>

			<ButtonHighlight
				mode="text"
				compact={true}
				onPress={toggleCheckedIds}
			>
				<Icon
					source={'swap-horizontal-variant'}
					size={iconSize}
				/>
			</ButtonHighlight>
		</View>
	);
};

export default Footer;
