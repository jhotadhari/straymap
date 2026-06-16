/**
 * External dependencies
 */
import React, {
	Dispatch,
	MutableRefObject,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { Dimensions, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { get } from 'lodash-es';
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
	CanvasAdapterModule,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import TopAppBar from '../store/features/ui/components/TopAppBar';
import type { InitialPosition } from '../types';
import { AppContext, MapContext } from '../Context';
import Center from '../store/features/appearance/components/Center';
import Drawers from '../store/features/drawers/components/Drawers';
import SplashScreen from './SplashScreen';
// import AltitudeProfile from '../store/features/routing/components/AltitudeProfile';
import RoutingMapView from '../store/features/routing/components/RoutingMapView';
import { useAppSelector } from '../store/hooks';
import { selectHardwareKeys, selectMapEventRate } from '../store/features/general/selectors';
import { selectElementsSettings, selectItems } from '../store/features/dashboard/selectors';
import { DashboardItem } from '../store/features/dashboard/types';
import {
	selectHgtDirPath,
	selectHgtFileInfoPurgeThreshold,
	selectHgtInterpolation,
	selectHgtReadFileRate,
	selectMapsforgeGeneral,
} from '../store/features/baseMap/selectors';
import BaseMap from '../store/features/baseMap/components/BaseMap';
import UiItemComponent from '../store/features/ui/components/UiItemComponent';
import { selectUiItemKeys } from '../store/features/ui/selectors';
import MapLayersAttribution from '../store/features/baseMap/components/MapLayersAttribution';
import { DashboardWrapped } from '../store/features/dashboard/components/Dashboard';
import useShowInitialSplash from '../compose/useShowInitialSplash';
import DebugBla from '../store/features/lines/components/DebugBla';
import LinesMapView from '../store/features/lines/components/LinesMapView';
import LineEditModal from '../store/features/lines/components/LineEditModal';

const AppView = ({
	initialPositionRef,
	saveCurrentPositionToInitial,
	setMapViewNativeNodeHandle,
}: {
	initialPositionRef: MutableRefObject<InitialPosition | undefined>;
	saveCurrentPositionToInitial: (response?: MapLifeCycleResponse | MapEventResponse) => void;
	setMapViewNativeNodeHandle: Dispatch<SetStateAction<null | number>>;
}) => {
	const theme = useTheme();
	const systemIsDarkMode = useColorScheme() === 'dark';

	const showSplash = useShowInitialSplash();

	const hardwareKeys = useAppSelector(selectHardwareKeys);

	const dashboardItems = useAppSelector((state) => selectItems(state, { position: 'bottom' }));
	const mapEventRate = useAppSelector(selectMapEventRate);
	const hgtInterpolation = useAppSelector(selectHgtInterpolation);
	const hgtFileInfoPurgeThreshold = useAppSelector(selectHgtFileInfoPurgeThreshold);
	const hgtDirPathStore = useAppSelector(selectHgtDirPath);
	const hgtReadFileRate = useAppSelector(selectHgtReadFileRate);
	const uiItems = useAppSelector(selectUiItemKeys);
	const dashboardElements = useAppSelector(selectElementsSettings);

	const { width, height } = Dimensions.get('window');

	const { mapViewNativeNodeHandle, mapHeight } = useContext(AppContext);

	const { currentMapEventRef } = useContext(MapContext);

	const hgtDirPath = useMemo(
		() =>
			hgtDirPathStore &&
			(dashboardItems.reduce((acc: boolean, ele: DashboardItem) => {
				return acc || !ele.elementType
					? acc
					: get(dashboardElements, [ele.elementType, 'shouldSetHgtDirPath'], false);
			}, false) as boolean)
				? hgtDirPathStore
				: undefined,
		[
			hgtDirPathStore,
			dashboardItems,
			dashboardElements,
		]
	);

	const responseInclude = useMemo(
		() =>
			dashboardItems.reduce(
				(acc: object, ele: DashboardItem) => {
					return ele.elementType
						? {
								...acc,
								...get(dashboardElements, [ele.elementType, 'responseInclude'], {}),
							}
						: acc;
				},
				{ zoomLevel: 2 }
			) as ResponseInclude,
		[dashboardItems, dashboardElements]
	);

	const emitsHardwareKeyUp = useMemo(
		() =>
			hardwareKeys
				.filter((keyConf) => 'none' !== keyConf.actionKey)
				.map((keyConf) => keyConf.keyCodeString) as MapContainerProps['emitsHardwareKeyUp'],
		[hardwareKeys, mapViewNativeNodeHandle]
	);

	const handleHardwareKeyUp = useCallback(
		(response: HardwareKeyEventResponse) => {
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
		},
		[hardwareKeys, mapViewNativeNodeHandle]
	);

	const [showMap, setShowMap] = useState(false);
	const mapsforgeGeneral = useAppSelector(selectMapsforgeGeneral);
	useEffect(() => {
		setShowMap(false);
		setTimeout(() => {
			CanvasAdapterModule.setLineScale(mapsforgeGeneral.lineScale);
			CanvasAdapterModule.setTextScale(mapsforgeGeneral.textScale);
			CanvasAdapterModule.setSymbolScale(mapsforgeGeneral.symbolScale);
			setShowMap(true);
		}, 1);
	}, [mapsforgeGeneral]);

	return (
		<View
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

				{showMap && (
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
						<DebugBla />

						<BaseMap />

						<LayerScalebar />

						{/* has to be last. bug until MapContainer.View is mixing up reactTreeIndex */}
						<LinesMapView />
						<RoutingMapView />
					</MapContainer>
				)}

				{!showMap && (
					<View
						style={{
							height: mapHeight || 0,
							width: width,
						}}
					/>
				)}

				<Center
					height={mapHeight || 0}
					width={width}
				/>

				<MapLayersAttribution />

				<Drawers
					height={mapHeight || 0}
					outerWidth={width}
					hidden={!!uiItems?.length}
				/>
			</View>

			<View>
				{/*
				<AltitudeProfile outerWidth={width} />
				*/}
				<DashboardWrapped
					style={styles.zObove}
					position="bottom"
				/>
			</View>

			<LineEditModal/>
		</View>
	);
};

const styles = StyleSheet.create({
	zObove: { zIndex: 20 },
});

export default AppView;
