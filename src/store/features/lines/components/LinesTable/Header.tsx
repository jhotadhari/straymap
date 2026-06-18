/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme, Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { sharedStyles } from './sharedDeps';

const Header: FC = () => {
	const theme = useTheme();

	// const { checkedIds } = useContext(HeaderContext);

	const style = useMemo(
		() => [
			sharedStyles.header,
			{
				borderColor: theme.colors.onBackground,
			},
		],
		[theme]
	);

	return (
		<View style={style}>
			{/* ??? translation */}
			<Text>{'... Some filters ??? TODO'}</Text>
		</View>
	);
};

export default Header;
