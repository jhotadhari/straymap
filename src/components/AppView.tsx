/**
 * External dependencies
 */
import React, {
	Dispatch,
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
import type { InitialPosition } from '../types';
import { AppContext, MapContext } from '../Context';
import Center from '../store/features/appearance/components/Center';
import Drawers from '../store/features/drawers/components/Drawers';
import * as dashboardElementComponents from '../store/features/dashboard/elements';
import SplashScreen from './SplashScreen';
import AltitudeProfile from './AltitudeProfile';
import RoutingMapView from './RoutingMapView';
import { useAppSelector } from '../store/hooks';
import { selectHardwareKeys, selectMapEventRate } from '../store/features/general/selectors';
import { selectItems } from '../store/features/dashboard/selectors';
import { DashboardItem } from '../store/features/dashboard/types';
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
import Dashboard from '../store/features/dashboard/components/Dashboard';

const AppView = ({
	showSplash,
	initialPositionRef,
	saveCurrentPositionToInitial,
	setMapViewNativeNodeHandle,
}: {
	showSplash: boolean;
	initialPositionRef: MutableRefObject<InitialPosition | undefined>;
	saveCurrentPositionToInitial: (response?: MapLifeCycleResponse | MapEventResponse) => void;
	setMapViewNativeNodeHandle: Dispatch<SetStateAction<null | number>>;
}) => {
	const theme = useTheme();
	const systemIsDarkMode = useColorScheme() === 'dark';

	const hardwareKeys = useAppSelector(selectHardwareKeys);

	const dashboardElements = useAppSelector((state) => selectItems(state, { position: 'bottom' }));
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
			(dashboardElements.reduce((acc: boolean, ele: DashboardItem) => {
				return acc || !ele.elementType
					? acc
					: get(
							dashboardElementComponents,
							[ele.elementType, 'shouldSetHgtDirPath'],
							false
						);
			}, false) as boolean)
				? hgtDirPathStore
				: undefined,
		[hgtDirPathStore, dashboardElements]
	);

	const responseInclude = useMemo(
		() =>
			dashboardElements.reduce(
				(acc: object, ele: DashboardItem) => {
					return ele.elementType
						? {
								...acc,
								...get(
									dashboardElementComponents,
									[ele.elementType, 'responseInclude'],
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

			<TopAppBar />

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

			<AltitudeProfile outerWidth={width} />

			<Dashboard
				position="bottom"
				sortEnabled={false}
				shouldSetBottomBarHeight={true}
			/>
		</SafeAreaView>
	);
};

export default AppView;
