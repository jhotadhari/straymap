/**
 * External dependencies
 */
import React, { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { BottomDrawerItem } from '../types';

const ExampleContent: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<Text style={[styles.text, { color: theme.colors.onBackground }]}>
				{t('bottomDrawer.exampleContent')}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	text: {
		textAlign: 'center',
	},
});

export default {
	key: 'example',
	label: 'bottomDrawer.exampleTitle',
	iconSource: 'chart-areaspline-variant',
	DisplayComponent: ExampleContent,
} as BottomDrawerItem;
