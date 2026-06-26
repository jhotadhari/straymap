/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Dimensions, View } from 'react-native';
import { PaperProvider, Text, useTheme } from 'react-native-paper';
import { MapEventResponse } from 'react-native-mapsforge-vtm';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import type { BottomBarHeight } from '../types';
import { AppContext, MapContext } from '../Context';
import SplashScreen from './SplashScreen';
import AppView from './AppView';
import SplashScreenUpdater from '../store/features/updater/components/SplashScreenUpdater';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppSelector, useSettingsInitialized } from '../store/hooks';
import { useSetupTheme } from '../store/features/appearance/hooks';
import { selectIsUpdating } from '../store/features/updater/selectors';
import useInitialCenter from '../compose/useInitialCenter';
import { DrawerControls } from '../store/features/drawers/types';
import {
	selectDbMigrated,
	selectInitialized,
	selectRequireReload,
} from '../store/features/dbLoader/selectors';
import { dbConnection } from '../store/features/dbLoader/DBConnection';
import ErrorToastProvider from './ErrorToast/ErrorToastProvider';

const App: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [topAppBarHeight, setTopAppBarHeight] = useState<number>(0);
	const [bottomBarHeight, setBottomBarHeight] = useState<BottomBarHeight>({});

	const currentMapEventRef = useRef<MapEventResponse | null>(null);
	const drawerControlsRef = useRef<DrawerControls | null>(null);

	// Prevent app from closing on hardwareBackPress.
	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
		return () => backHandler.remove();
	}, []);

	const { width, height } = Dimensions.get('window');

	const [mapViewNativeNodeHandle, setMapViewNativeNodeHandle] = useState<null | number>(null);

	const [moveEnabled, setMoveEnabled] = useState(true);

	const settingsInitialized = useSettingsInitialized();

	const {
		initialized: initialPositionInitialized,
		initialPositionRef,
		saveCurrentPositionToInitial,
	} = useInitialCenter(currentMapEventRef);

	const appInnerHeight = height - topAppBarHeight;

	const isUpdating = useAppSelector(selectIsUpdating);

	const dbMigrated = useAppSelector(selectDbMigrated);

	const requireReload = useAppSelector(selectRequireReload);

	const style = useMemo(
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
			mapHeight:
				(appInnerHeight || height) -
				(Object.values(bottomBarHeight).reduce((acc, nb) => acc + nb, 0) || 0),
		}),
		[
			mapViewNativeNodeHandle,
			appInnerHeight,
			topAppBarHeight,
			bottomBarHeight,
			moveEnabled,
			height,
		]
	);

	const mapContextValue = useMemo(
		() => ({
			currentMapEventRef,
		}),
		[]
	);

	if (isUpdating) {
		return (
			<AppContext.Provider value={appContextValue}>
				<View style={style}>
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
				<View style={style}>
					<SplashScreen displayLogo={!isDbError && !requireReload}>
						{isDbError && (
							<Text>{sprintf(t('dbLoader.dbMigrationError'), dbMigrated)}</Text>
						)}
						{/* ??? missing translation */}
						{requireReload && (
							<Text>{sprintf(t('dbLoader.requireReload'), dbMigrated)}</Text>
						)}
					</SplashScreen>
				</View>
			</AppContext.Provider>
		);
	}

	return (
		<AppContext.Provider value={appContextValue}>
			<MapContext.Provider value={mapContextValue}>
				<GestureHandlerRootView>
					<AppView
						initialPositionRef={initialPositionRef}
						saveCurrentPositionToInitial={saveCurrentPositionToInitial}
						setMapViewNativeNodeHandle={setMapViewNativeNodeHandle}
					/>
				</GestureHandlerRootView>
			</MapContext.Provider>
		</AppContext.Provider>
	);
};

export default () => {
	const theme = useSetupTheme();

	const dbLoaderInitialized = useAppSelector(selectInitialized);

	return (
		dbLoaderInitialized &&
		dbConnection?.queryClient && (
			<QueryClientProvider client={dbConnection.queryClient}>
				<PaperProvider theme={theme}>
					<ErrorToastProvider>
						<App />
					</ErrorToastProvider>
				</PaperProvider>
			</QueryClientProvider>
		)
	);
};
