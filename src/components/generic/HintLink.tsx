/**
 * External dependencies
 */
import { get } from 'lodash-es';
import { FC, useCallback, useMemo } from 'react';
import { Linking, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const HintLink: FC<{ label: string; url: string; style?: ViewStyle }> = ({ label, url, style }) => {
	const theme = useTheme();

	const styleLink = useMemo(() => ({ color: get(theme.colors, 'link') }), [theme]);

	const handlePress = useCallback(() => Linking.openURL(url), [url]);

	return (
		<View style={style}>
			<Text>{label}</Text>
			<Text
				style={styleLink}
				onPress={handlePress}
			>
				{url}
			</Text>
		</View>
	);
};

export default HintLink;
