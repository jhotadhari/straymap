/**
 * External dependencies
 */
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from './Context';
import { registerErrorToastHandler } from './service';

type ToastEntry = {
	id: number;
	message: string;
};

const DISPLAY_DURATION = 5000;

let nextId = 0;

const ErrorToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const theme = useTheme();

	const [toasts, setToasts] = useState<ToastEntry[]>([]);

	const dismiss = useCallback((id: number) => {
		setToasts((current) => current.filter((toast) => toast.id !== id));
	}, []);

	const showError = useCallback(
		(message: string) => {
			const id = nextId++;
			setToasts((current) => [...current, { id, message }]);
			setTimeout(() => dismiss(id), DISPLAY_DURATION);
		},
		[dismiss]
	);

	useEffect(() => {
		registerErrorToastHandler(showError);
		return () => registerErrorToastHandler(null);
	}, [showError]);

	const contextValue = useMemo(() => ({ showError }), [showError]);

	const styleToast = useMemo(
		() => [
			styles.toast,
			{
				backgroundColor: theme.colors.errorContainer,
				borderRadius: theme.roundness,
			},
		],
		[theme]
	);

	return (
		<ErrorToastContext.Provider value={contextValue}>
			{children}
			<View
				style={styles.host}
				pointerEvents="box-none"
			>
				{toasts.map((toast) => (
					<Pressable
						key={toast.id}
						onPress={() => dismiss(toast.id)}
						style={styleToast}
					>
						<Text style={{ color: theme.colors.onErrorContainer }}>
							{toast.message}
						</Text>
					</Pressable>
				))}
			</View>
		</ErrorToastContext.Provider>
	);
};

const styles = StyleSheet.create({
	host: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 24,
		alignItems: 'center',
		zIndex: 1000,
	},
	toast: {
		marginTop: 8,
		paddingVertical: 10,
		paddingHorizontal: 16,
		maxWidth: '90%',
	},
});

export default ErrorToastProvider;
