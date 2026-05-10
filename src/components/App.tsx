/**
 * External dependencies
 */
import React, { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import DefaultPreference from 'react-native-default-preference';
import { PaperProvider, useTheme } from 'react-native-paper';
import {
	CanvasAdapterModule,
	MapEventResponse,
	useMapLayersCreated,
	MapLifeCycleResponse,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import type { HierarchyItem, InitialPosition, BottomBarHeight } from '../types';
import { AppContext, MapContext } from '../Context';
import SplashScreen from './SplashScreen';
import AppView from './AppView';
import SplashScreenUpdater from './SplashScreenUpdater';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RoutingProvider from './RoutingProvider';
import { selectInitialized as selectSettingsInitialized_appearance } from '../store/features/appearance/selectors';
import { selectInitialized as selectSettingsInitialized_dashboard } from '../store/features/dashboard/selectors';
import { selectInitialized as selectSettingsInitialized_general } from '../store/features/general/selectors';
import { selectInitialized as selectSettingsInitialized_dirs } from '../store/features/dirs/selectors';
import {
	selectMapsforgeGeneral,
	selectInitialized as selectSettingsInitialized_baseMap,
} from '../store/features/baseMap/selectors';
import { useAppSelector } from '../store/hooks';
import { useSetupTheme } from '../store/features/appearance/hooks';
import { selectElements } from '../store/features/dashboard/selectors';
import {
	selectInitialized as selectSettingsInitialized_ui,
	selectIsBusy,
} from '../store/features/ui/selectors';
import { useIsBusyPromiseQueueState } from '../store/features/ui/hooks';
import useUpdater from '../store/features/general/hooks/useUpdater';

const AppWrapper = () => {
	const theme = useSetupTheme();

	return (
		<PaperProvider theme={theme}>
			<App />
		</PaperProvider>
	);
};

const useInitialCenter = (currentMapEventRef: MutableRefObject<MapEventResponse | null>) => {
	const [initialized, setInitialized] = useState(false);

	const initialPositionRef = useRef<undefined | InitialPosition>(undefined);

	useEffect(() => {
		DefaultPreference.get('initialPosition')
			.then((newInitialPosition) => {
				if (newInitialPosition) {
					initialPositionRef.current = JSON.parse(newInitialPosition);
				} else {
					initialPositionRef.current = {
						center: {
							lng: -70.239,
							lat: -10.65,
						},
						zoomLevel: 5,
					};
				}
				setInitialized(true);
			})
			.catch((err) => 'ERROR' + console.log(err));
	}, []);

	const getCurrentPosition = useCallback((response?: MapLifeCycleResponse | MapEventResponse) => {
		let newPosition: undefined | InitialPosition = undefined;
		if (response && response?.center && response?.zoomLevel) {
			newPosition = {
				center: response.center,
				zoomLevel: response.zoomLevel,
			};
		} else if (currentMapEventRef?.current?.center && currentMapEventRef?.current?.zoomLevel) {
			newPosition = {
				center: currentMapEventRef.current.center,
				zoomLevel: currentMapEventRef.current.zoomLevel,
			};
		} else if (initialPositionRef?.current?.center && initialPositionRef?.current?.zoomLevel) {
			newPosition = {
				center: initialPositionRef.current.center,
				zoomLevel: initialPositionRef.current.zoomLevel,
			};
		}
		return newPosition;
	}, []);

	const saveCurrentPositionToInitial = useCallback(
		(response?: MapLifeCycleResponse | MapEventResponse) => {
			const newPosition = getCurrentPosition(response);
			if (newPosition) {
				DefaultPreference.set('initialPosition', JSON.stringify(newPosition)).catch(
					(err) => 'ERROR' + console.log(err)
				);
			}
		},
		[getCurrentPosition]
	);

	// Save position every x seconds.
	const intervalIdRef = useRef<null | NodeJS.Timeout>(null);
	useEffect(() => {
		if (initialized && currentMapEventRef?.current && null === intervalIdRef.current) {
			const newIntervalId = setInterval(saveCurrentPositionToInitial, 1000 * 30);
			intervalIdRef.current = newIntervalId;
		}
		return () => {
			if (intervalIdRef.current) {
				clearInterval(intervalIdRef.current);
			}
		};
	}, [initialized, saveCurrentPositionToInitial]);

	return {
		initialized,
		initialPositionRef,
		saveCurrentPositionToInitial,
	};
};

const useShowSplash = ({
	mapViewNativeNodeHandle,
	isBusy,
}: {
	mapViewNativeNodeHandle: null | number;
	isBusy: boolean;
}) => {
	const mapLayersCreated = useMapLayersCreated(mapViewNativeNodeHandle);
	const [mapLayersCreatedDef, setMapLayersCreatedDef] = useState(false);
	const [showSplash, setShowSplash] = useState(true);
	useEffect(() => {
		if (mapLayersCreated) {
			setTimeout(() => {
				setMapLayersCreatedDef(true);
			}, 100);
		}
	}, [mapLayersCreated]);
	useEffect(() => {
		if (showSplash && mapLayersCreatedDef && !isBusy) {
			setShowSplash(false);
		}
	}, [
		mapLayersCreatedDef,
		isBusy,
		showSplash,
	]);
	return showSplash;
};

const App = () => {
	const theme = useTheme();
	const [ready, setReady] = useState<boolean>(false);
	const [topAppBarHeight, setTopAppBarHeight] = useState<number>(0);
	const [bottomBarHeight, setBottomBarHeight] = useState<BottomBarHeight>({});
	const [selectedHierarchyItems, setSelectedHierarchyItems] = useState<null | HierarchyItem[]>(
		null
	);

	const currentMapEventRef = useRef<MapEventResponse | null>(null);

	useIsBusyPromiseQueueState();
	const isBusy = useAppSelector(selectIsBusy);

	const { width, height } = useSafeAreaFrame();

	const [mapViewNativeNodeHandle, setMapViewNativeNodeHandle] = useState<null | number>(null);

	const showSplash = useShowSplash({
		mapViewNativeNodeHandle,
		isBusy,
	});

	const settingsInitialized_appearance = useAppSelector(selectSettingsInitialized_appearance);
	const settingsInitialized_dashboard = useAppSelector(selectSettingsInitialized_dashboard);
	const settingsInitialized_general = useAppSelector(selectSettingsInitialized_general);
	const settingsInitialized_dirs = useAppSelector(selectSettingsInitialized_dirs);
	const settingsInitialized_ui = useAppSelector(selectSettingsInitialized_ui);
	const settingsInitialized_baseMap = useAppSelector(selectSettingsInitialized_baseMap);

	// Remove bottomBar if no dashboard elements.
	const dashboardElements = useAppSelector(selectElements);
	useEffect(() => {
		if (!dashboardElements.length) {
			setBottomBarHeight((bottomBarHeight) => ({
				...bottomBarHeight,
				dashboard: 0,
			}));
		}
	}, [dashboardElements]);

	const {
		initialized: initialPositionInitialized,
		initialPositionRef,
		saveCurrentPositionToInitial,
	} = useInitialCenter(currentMapEventRef);

	const mapsforgeGeneral = useAppSelector(selectMapsforgeGeneral);

	// Set CanvasAdapter props on app start, when settingsInitialized_baseMap, before the map gets initialized.
	useEffect(() => {
		if (settingsInitialized_baseMap) {
			CanvasAdapterModule.setLineScale(mapsforgeGeneral.lineScale);
			CanvasAdapterModule.setTextScale(mapsforgeGeneral.textScale);
			CanvasAdapterModule.setSymbolScale(mapsforgeGeneral.symbolScale);
		}
	}, [settingsInitialized_baseMap, mapsforgeGeneral]);

	const appInnerHeight = height - topAppBarHeight;

	useEffect(() => {
		if (
			!!(
				initialPositionInitialized &&
				settingsInitialized_appearance &&
				settingsInitialized_dashboard &&
				settingsInitialized_dirs &&
				settingsInitialized_general &&
				settingsInitialized_ui &&
				settingsInitialized_baseMap
			)
		) {
			setReady(true);
		}
	}, [
		initialPositionInitialized,
		settingsInitialized_appearance,
		settingsInitialized_dashboard,
		settingsInitialized_dirs,
		settingsInitialized_general,
		settingsInitialized_ui,
		settingsInitialized_baseMap,
	]);

	const { isUpdating, setIsUpdating } = useUpdater({
		ready,
	});

	const style = {
		backgroundColor: theme.colors.background,
		height,
		width,
	};

	if (!ready || true === isUpdating) {
		return (
			<View style={style}>
				<SplashScreen />
			</View>
		);
	}

	if (false !== isUpdating) {
		return (
			<View style={style}>
				<SplashScreenUpdater
					isUpdating={isUpdating}
					setIsUpdating={setIsUpdating}
				/>
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
				selectedHierarchyItems,
				setSelectedHierarchyItems,
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
				<RoutingProvider>
					<GestureHandlerRootView>
						<AppView
							showSplash={showSplash}
							initialPositionRef={initialPositionRef}
							saveCurrentPositionToInitial={saveCurrentPositionToInitial}
							setTopAppBarHeight={setTopAppBarHeight}
							setBottomBarHeight={setBottomBarHeight}
							setMapViewNativeNodeHandle={setMapViewNativeNodeHandle}
						/>
					</GestureHandlerRootView>
				</RoutingProvider>
			</MapContext.Provider>
		</AppContext.Provider>
	);
};

export default AppWrapper;
