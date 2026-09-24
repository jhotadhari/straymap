/**
 * External dependencies
 */
import React, { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { BottomDrawerItem } from '../types';
import { BOTTOM_DRAWER_DEBUG } from '../constants';

const ExampleContent: FC = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<Text style={[styles.text, { color: BOTTOM_DRAWER_DEBUG.handleIconActive }]}>
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
