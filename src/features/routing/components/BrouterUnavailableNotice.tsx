/**
 * External dependencies
 */
import React, { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import { useTranslation } from 'react-i18next';

const BrouterUnavailableNotice: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<MaterialIcons
				name="error-outline"
				size={48}
				color={theme.colors.onSurfaceVariant}
				style={styles.icon}
			/>
			<Text
				variant="titleMedium"
				style={styles.title}
			>
				{t('routing.brouterUnavailableTitle')}
			</Text>
			<Text
				variant="bodyMedium"
				style={styles.message}
			>
				{t('routing.brouterUnavailableMessage')}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
	icon: {
		marginBottom: 16,
	},
	title: {
		textAlign: 'center',
		marginBottom: 12,
	},
	message: {
		textAlign: 'center',
		lineHeight: 20,
	},
});

export default BrouterUnavailableNotice;
