/**
 * External dependencies
 */
import React, { useEffect, useRef, useState } from 'react';
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
import { useIsBusyPromiseQueueState } from '../store/features/ui/hooks';
import { selectDbMigrated, selectIsUpdating } from '../store/features/updater/selectors';
import useInitialCenter from '../compose/useInitialCenter';
import { queryClient } from '../db/client';

const App = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [topAppBarHeight, setTopAppBarHeight] = useState<number>(0);
	const [bottomBarHeight, setBottomBarHeight] = useState<BottomBarHeight>({});

	const currentMapEventRef = useRef<MapEventResponse | null>(null);

	// Prevent app from closing on hardwareBackPress.
	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
		return () => backHandler.remove();
	}, []);

	useIsBusyPromiseQueueState();

	const { width, height } = Dimensions.get('window');

	const [mapViewNativeNodeHandle, setMapViewNativeNodeHandle] = useState<null | number>(null);

	const settingsInitialized = useSettingsInitialized();

	const {
		initialized: initialPositionInitialized,
		initialPositionRef,
		saveCurrentPositionToInitial,
	} = useInitialCenter(currentMapEventRef);

	const appInnerHeight = height - topAppBarHeight;

	const isUpdating = useAppSelector(selectIsUpdating);

	const dbMigrated = useAppSelector(selectDbMigrated);

	const style = {
		backgroundColor: theme.colors.background,
		height,
		width,
	};

	// if (true !== dbMigrated) {
	// 	return (
	// 		<View style={style}>
	// 			<SplashScreen displayLogo={!dbMigrated}>
	// 				{dbMigrated && (
	// 					<Text>{sprintf(t('updater.dbMigrationError'), dbMigrated)}</Text>
	// 				)}
	// 				{/* {!dbMigrated && (
	// 					<Text>{t('updater.dbMigration')}</Text>
	// 				)} */}
	// 			</SplashScreen>
	// 		</View>
	// 	);
	// }

	// console.log( 'debug isUpdating', isUpdating ); // debug
	if (isUpdating) {
		return (
			<View style={style}>
				<SplashScreenUpdater />
			</View>
		);
	}

	if (!initialPositionInitialized || !settingsInitialized || true !== dbMigrated) {
		return (
			<View style={style}>
				<SplashScreen displayLogo={!dbMigrated}>
					{dbMigrated && (
						<Text>{sprintf(t('updater.dbMigrationError'), dbMigrated)}</Text>
					)}
					{/* {!dbMigrated && (
					<Text>{t('updater.dbMigration')}</Text>
				)} */}
				</SplashScreen>
			</View>
		);
	}

	return (
		<AppContext.Provider
			value={{
				mapViewNativeNodeHandle,
				appInnerHeight,
				topAppBarHeight,
				bottomBarHeight,
				setTopAppBarHeight,
				setBottomBarHeight,
				mapHeight:
					(appInnerHeight || height) -
					(Object.values(bottomBarHeight).reduce((acc, nb) => acc + nb, 0) || 0),
			}}
		>
			<MapContext.Provider
				value={{
					currentMapEventRef,
				}}
			>
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
	return (
		<QueryClientProvider client={queryClient}>
			<PaperProvider theme={theme}>
				<App />
			</PaperProvider>
		</QueryClientProvider>
	);
};
