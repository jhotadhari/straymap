/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	MutableRefObject,
	SetStateAction,
	useCallback,
	useContext,
	useMemo,
} from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import 'intl-pluralrules';
import { useTheme } from 'react-native-paper';
import { get } from 'lodash-es';
import { SafeAreaView, useSafeAreaFrame } from 'react-native-safe-area-context';
/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	MapContainer,
	LayerScalebar,
	type HardwareKeyEventResponse,
	type MapContainerProps,
	MapContainerModule,
	MapEventResponse,
	ResponseInclude,
	MapLifeCycleResponse,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import TopAppBar from '../store/features/ui/components/TopAppBar';
import type { InitialPosition, BottomBarHeight } from '../types';
import { AppContext, MapContext } from '../Context';
import Center from '../store/features/appearance/components/Center';
import { Dashboard } from './Dashboard';
import { Drawers } from './Drawer';
import * as dashboardElementComponents from './Dashboard/elements';
import SplashScreen from './SplashScreen';
import AltitudeProfile from './AltitudeProfile';
import RoutingMapView from './RoutingMapView';
import { useAppSelector } from '../store/hooks';
import {
	selectHardwareKeys,
	selectMapEventRate,
	selectUnitPrefs,
} from '../store/features/general/selectors';
import { selectDashboardStyle, selectElements } from '../store/features/dashboard/selectors';
import { DashboardElementConf } from '../store/features/dashboard/types';
import {
	selectHgtDirPath,
	selectHgtFileInfoPurgeThreshold,
	selectHgtInterpolation,
	selectHgtReadFileRate,
} from '../store/features/baseMap/selectors';
import BaseMap from '../store/features/baseMap/components/BaseMap';
import UiItemComponent from '../store/features/ui/components/UiItemComponent';
import { selectUiItemKeys } from '../store/features/ui/selectors';
import MapLayersAttribution from '../store/features/baseMap/MapLayersAttribution';

const AppView = ({
	showSplash,
	initialPositionRef,
	saveCurrentPositionToInitial,
	setTopAppBarHeight,
	setBottomBarHeight,
	setMapViewNativeNodeHandle,
}: {
	showSplash: boolean;
	initialPositionRef: MutableRefObject<InitialPosition | undefined>;
	saveCurrentPositionToInitial: (response?: MapLifeCycleResponse | MapEventResponse) => void;
	setTopAppBarHeight: Dispatch<SetStateAction<number>>;
	setBottomBarHeight: Dispatch<SetStateAction<BottomBarHeight>>;
	setMapViewNativeNodeHandle: Dispatch<SetStateAction<null | number>>;
}) => {
	const theme = useTheme();
	const systemIsDarkMode = useColorScheme() === 'dark';

	const hardwareKeys = useAppSelector(selectHardwareKeys);

	const dashboardElements = useAppSelector(selectElements);
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const dashboardStyle = useAppSelector(selectDashboardStyle);
	const mapEventRate = useAppSelector(selectMapEventRate);
	const hgtInterpolation = useAppSelector(selectHgtInterpolation);
	const hgtFileInfoPurgeThreshold = useAppSelector(selectHgtFileInfoPurgeThreshold);
	const hgtDirPathStore = useAppSelector(selectHgtDirPath);
	const hgtReadFileRate = useAppSelector(selectHgtReadFileRate);
	const uiItems = useAppSelector(selectUiItemKeys);

	const { width, height } = useSafeAreaFrame();

	const { mapViewNativeNodeHandle, mapHeight } = useContext(AppContext);

	const { currentMapEventRef } = useContext(MapContext);

	const hgtDirPath = useMemo(
		() =>
			hgtDirPathStore &&
			(dashboardElements.reduce((acc: boolean, ele: DashboardElementConf) => {
				return acc || !ele.type
					? acc
					: get(dashboardElementComponents, [ele.type, 'shouldSetHgtDirPath'], false);
			}, false) as boolean)
				? hgtDirPathStore
				: undefined,
		[hgtDirPathStore, dashboardElements]
	);

	const responseInclude = useMemo(
		() =>
			dashboardElements.reduce(
				(acc: object, ele: DashboardElementConf) => {
					return ele.type
						? {
								...acc,
								...get(
									dashboardElementComponents,
									[ele.type, 'responseInclude'],
									{}
								),
							}
						: acc;
				},
				{ zoomLevel: 2 }
			) as ResponseInclude,
		[dashboardElements]
	);

	const emitsHardwareKeyUp = useMemo(
		() =>
			hardwareKeys
				.filter((keyConf) => 'none' !== keyConf.actionKey)
				.map((keyConf) => keyConf.keyCodeString) as MapContainerProps['emitsHardwareKeyUp'],
		[hardwareKeys]
	);

	const handleHardwareKeyUp = useCallback(
		() =>
			hardwareKeys.length > 0
				? (response: HardwareKeyEventResponse) => {
						hardwareKeys.forEach((keyConf) => {
							if (response.keyCodeString === keyConf.keyCodeString) {
								switch (keyConf.actionKey) {
									case 'zoomIn':
										MapContainerModule.zoomIn(mapViewNativeNodeHandle);
										break;
									case 'zoomOut':
										MapContainerModule.zoomOut(mapViewNativeNodeHandle);
										break;
								}
							}
						});
					}
				: null,
		[hardwareKeys]
	);

	return (
		<SafeAreaView
			style={{
				backgroundColor: theme.colors.background,
				height,
				width,
			}}
		>
			{showSplash && <SplashScreen />}

			<StatusBar barStyle={systemIsDarkMode ? 'light-content' : 'dark-content'} />

			<TopAppBar setTopAppBarHeight={setTopAppBarHeight} />

			<View
				style={{
					height: mapHeight,
					width,
				}}
			>
				<UiItemComponent />

				<MapContainer
					mapEventRate={mapEventRate}
					nativeNodeHandle={mapViewNativeNodeHandle}
					setNativeNodeHandle={setMapViewNativeNodeHandle}
					hgtInterpolation={hgtInterpolation}
					hgtFileInfoPurgeThreshold={hgtFileInfoPurgeThreshold}
					hgtReadFileRate={hgtReadFileRate}
					hgtDirPath={hgtDirPath}
					responseInclude={responseInclude}
					height={mapHeight || 0}
					width={width}
					center={initialPositionRef?.current?.center}
					zoomLevel={initialPositionRef?.current?.zoomLevel}
					zoomMin={2}
					zoomMax={20}
					moveEnabled={true}
					tiltEnabled={false}
					rotationEnabled={false}
					zoomEnabled={true}
					onPause={saveCurrentPositionToInitial}
					onError={(err) => console.log('Error', err)}
					onResume={(response) => console.log('lifecycle event onResume', response)}
					onMapEvent={(response: MapEventResponse) => {
						currentMapEventRef.current = response;
					}}
					emitsHardwareKeyUp={emitsHardwareKeyUp}
					onHardwareKeyUp={handleHardwareKeyUp}
				>
					<BaseMap />

					<LayerScalebar />

					{/* has to be last. bug until MapContainer.View is mixing up reactTreeIndex */}
					<RoutingMapView />
				</MapContainer>

				<Center
					height={mapHeight || 0}
					width={width}
				/>

				<Drawers
					height={mapHeight || 0}
					outerWidth={width}
					hidden={!!uiItems?.length}
				/>

				<MapLayersAttribution />
			</View>

			<AltitudeProfile
				outerWidth={width}
				setBottomBarHeight={setBottomBarHeight}
			/>

			{dashboardElements.length > 0 && (
				<Dashboard
					elements={dashboardElements}
					dashboardStyle={dashboardStyle}
					unitPrefs={unitPrefs}
					setBottomBarHeight={setBottomBarHeight}
					outerWidth={width}
				/>
			)}
		</SafeAreaView>
	);
};

export default AppView;
