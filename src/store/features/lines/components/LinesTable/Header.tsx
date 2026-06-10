/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme, Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { styles } from './sharedDeps';

const Header: FC<{
	checkedIds: number[];
}> = ({ checkedIds }) => {
	const theme = useTheme();

	const style = useMemo(
		() => [
			styles.header,
			{
				borderColor: theme.colors.onBackground,
			},
		],
		[theme]
	);

	return (
		<View style={style}>
			<Text>{'... Some filters ???'}</Text>
		</View>
	);
};

export default Header;
