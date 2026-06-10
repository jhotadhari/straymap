/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../../drawers/constants';
import { sprintf } from 'sprintf-js';
import { styles } from './sharedDeps';

const Footer: FC<{
	checkedIds: number[];
}> = ({ checkedIds }) => {
	const theme = useTheme();

	const style = useMemo(
		() => [
			styles.footer,
			{
				borderColor: theme.colors.onBackground,
			},
		],
		[theme]
	);

	const labelStyle = useMemo(
		() => ({
			color: checkedIds.length ? theme.colors.onBackground : theme.colors.onSurfaceDisabled,
		}),
		[theme, checkedIds]
	);

	return (
		<View style={style}>
			<ButtonHighlight
				mode="text"
				compact={true}
				disabled={!checkedIds.length}
				onPress={() => {
					// ???
				}}
			>
				<Icon
					source={'square-edit-outline'}
					size={iconSize}
					color={checkedIds.length ? undefined : theme.colors.onSurfaceDisabled}
				/>
			</ButtonHighlight>

			<Text style={labelStyle}>
				{[
					'???Bulk actions',
					sprintf('%s selected???', checkedIds.length),
				].join(', ')}
			</Text>
		</View>
	);
};

export default Footer;
