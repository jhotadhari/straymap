/**
 * External dependencies
 */
import { FC, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme, Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { styles } from './sharedDeps';
import { HeaderContext } from './Context';

const Header: FC = () => {
	const theme = useTheme();

	const { checkedIds } = useContext(HeaderContext);

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
