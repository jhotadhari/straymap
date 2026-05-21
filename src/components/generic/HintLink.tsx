import { get } from 'lodash-es';
import { FC } from 'react';
import { Linking, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const HintLink: FC<{ label: string; url: string; style?: ViewStyle }> = ({ label, url, style }) => {
	const theme = useTheme();
	return (
		<View>
			<Text>{label}</Text>
			<Text
				style={{ color: get(theme.colors, 'link') }}
				onPress={() => Linking.openURL(url)}
			>
				{url}
			</Text>
		</View>
	);
};

export default HintLink;
