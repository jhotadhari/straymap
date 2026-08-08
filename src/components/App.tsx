/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Dimensions, processColor, StyleSheet, View } from 'react-native';
import { PaperProvider, Text, useTheme } from 'react-native-paper';
import { MapEventResponse } from 'react-native-mapsforge-vtm';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import type { SharedValue } from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import type { BottomBarHeight } from '../types';
import { AppContext, MapContext } from '../Context';
import SplashScreen from './SplashScreen';
import AppView from './AppView';
import SplashScreenUpdater from '../features/updater/components/SplashScreenUpdater';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppSelector, useSettingsInitialized } from '../store/hooks';
import { useSetupTheme } from '../features/appearance/hooks';
import { selectIsUpdating } from '../features/updater/selectors';
import useInitialCenter from '../compose/useInitialCenter';
import { DrawerControls } from '../features/drawers/types';
import {
	selectDbMigrated,
	selectDbPendingMigrations,
	selectInitialized,
	selectRequireReload,
} from '../features/dbLoader/selectors';
import { dbConnection } from '../features/dbLoader/DBConnection';
import { HelperModule } from '../nativeModules';
import ErrorToastProvider from './ErrorToast/ErrorToastProvider';

const App: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [topAppBarHeight, setTopAppBarHeight] = useState<number>(0);
	const [bottomBarHeight, setBottomBarHeight] = useState<BottomBarHeight>({});

	const currentMapEventRef = useRef<MapEventResponse | null>(null);
	const centerPositionSvRef = useRef<SharedValue<[number, number] | null> | null>(null);
	const drawerControlsRef = useRef<DrawerControls | null>(null);

	// Prevent app from closing on hardwareBackPress.
	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
		return () => backHandler.remove();
	}, []);

	const { width, height } = useMemo(() => Dimensions.get('window'), []);

	const [mapViewNativeNodeHandle, setMapViewNativeNodeHandle] = useState<null | number>(null);

	const [moveEnabled, setMoveEnabled] = useState(true);
	const [mapCornerComponentsHeight, setMapCornerComponentsHeight] = useState<number>(0);

	const settingsInitialized = useSettingsInitialized();

	const {
		initialized: initialPositionInitialized,
		initialPositionRef,
		saveCurrentPositionToInitial,
	} = useInitialCenter(currentMapEventRef);

	const appInnerHeight = height - topAppBarHeight;

	const isUpdating = useAppSelector(selectIsUpdating);

	const dbMigrated = useAppSelector(selectDbMigrated);

	const dbPendingMigrations = useAppSelector(selectDbPendingMigrations);

	const requireReload = useAppSelector(selectRequireReload);

	const isReady =
		initialPositionInitialized &&
		settingsInitialized &&
		true === dbMigrated &&
		!requireReload &&
		!isUpdating;

	useEffect(() => {
		if (isReady) {
			const rawColor = processColor(theme.colors.background);
			if (rawColor != null) {
				// eslint-disable-next-line no-bitwise
				const hex = '#' + ((rawColor as number) >>> 0).toString(16).padStart(8, '0');
				HelperModule.setWindowBackgroundColor(hex);
			}
		}
	}, [isReady, theme]);

	const splashStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			height,
			width,
		}),
		[
			theme,
			height,
			width,
		]
	);

	const appContextValue = useMemo(
		() => ({
			mapViewNativeNodeHandle,
			appInnerHeight,
			topAppBarHeight,
			bottomBarHeight,
			setTopAppBarHeight,
			setBottomBarHeight,
			drawerControlsRef,
			moveEnabled,
			setMoveEnabled,
			mapCornerComponentsHeight,
			setMapCornerComponentsHeight,
			mapHeight: Math.round(
				(appInnerHeight || height) -
					(Object.values(bottomBarHeight).reduce((acc, nb) => acc + nb, 0) || 0)
			),
		}),
		[
			mapViewNativeNodeHandle,
			appInnerHeight,
			topAppBarHeight,
			bottomBarHeight,
			moveEnabled,
			mapCornerComponentsHeight,
			height,
		]
	);

	const mapContextValue = useMemo(
		() => ({
			currentMapEventRef,
			centerPositionSvRef,
		}),
		[]
	);

	if (isUpdating) {
		return (
			<AppContext.Provider value={appContextValue}>
				<View style={splashStyle}>
					<SplashScreenUpdater />
				</View>
			</AppContext.Provider>
		);
	}

	if (
		!initialPositionInitialized ||
		!settingsInitialized ||
		true !== dbMigrated ||
		requireReload
	) {
		const isDbError = dbMigrated && 'string' === typeof dbMigrated;
		return (
			<AppContext.Provider value={appContextValue}>
				<View style={splashStyle}>
					<SplashScreen displayLogo={!isDbError && !requireReload}>
						{!isDbError &&
							!requireReload &&
							true !== dbMigrated &&
							dbPendingMigrations !== undefined &&
							dbPendingMigrations > 0 && (
								<Text style={styles.splashText}>
									{t('dbLoader.dbInitializing')}
								</Text>
							)}
						{isDbError && (
							<Text style={styles.splashText}>
								{sprintf(t('dbLoader.dbMigrationError'), dbMigrated)}
							</Text>
						)}
						{requireReload && (
							<Text style={styles.splashText}>
								{sprintf(t('dbLoader.requireReload'), dbMigrated)}
							</Text>
						)}
					</SplashScreen>
				</View>
			</AppContext.Provider>
		);
	}

	return (
		<AppContext.Provider value={appContextValue}>
			<MapContext.Provider value={mapContextValue}>
				<AppView
					initialPositionRef={initialPositionRef}
					saveCurrentPositionToInitial={saveCurrentPositionToInitial}
					setMapViewNativeNodeHandle={setMapViewNativeNodeHandle}
				/>
			</MapContext.Provider>
		</AppContext.Provider>
	);
};

const styles = StyleSheet.create({
	splashText: {
		textAlign: 'center',
	},
});

export default () => {
	const theme = useSetupTheme();

	const gestureHandlerStyle = useMemo(
		() => ({ flex: 1, backgroundColor: theme.colors.background }),
		[theme.colors.background]
	);

	const dbLoaderInitialized = useAppSelector(selectInitialized);

	return (
		<PaperProvider theme={theme}>
			<GestureHandlerRootView style={gestureHandlerStyle}>
				<ErrorToastProvider>
					{dbLoaderInitialized && dbConnection?.queryClient ? (
						<QueryClientProvider client={dbConnection.queryClient}>
							<App />
						</QueryClientProvider>
					) : (
						<App />
					)}
				</ErrorToastProvider>
			</GestureHandlerRootView>
		</PaperProvider>
	);
};
