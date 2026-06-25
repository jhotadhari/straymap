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
	type MapContainerProps,
	MapEventResponse,
	ResponseInclude,
	CanvasAdapterModule,
} from 'react-native-mapsforge-vtm'; // also exports useMap, see emitsHardwareKeyUp note below.

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
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectMapEventRate } from '../store/features/general/selectors'; // also exports selectHardwareKeys, see emitsHardwareKeyUp note below.
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
import LineEditModal from '../store/features/lines/components/LineEditModal/LineEditModal';
import { setLineSelected } from '../store/features/lines/slice';

const AppView = ({
	initialPositionRef,
	saveCurrentPositionToInitial,
	setMapViewNativeNodeHandle,
}: {
	initialPositionRef: MutableRefObject<InitialPosition | undefined>;
	saveCurrentPositionToInitial: (response?: MapEventResponse) => void;
	setMapViewNativeNodeHandle: Dispatch<SetStateAction<null | number>>;
}) => {
	const theme = useTheme();
	const systemIsDarkMode = useColorScheme() === 'dark';

	const showSplash = useShowInitialSplash();

	// const hardwareKeys = useAppSelector(selectHardwareKeys); // see emitsHardwareKeyUp note below.

	const dashboardItems = useAppSelector((state) => selectItems(state, { position: 'bottom' }));
	const mapEventRate = useAppSelector(selectMapEventRate);
	const hgtInterpolation = useAppSelector(selectHgtInterpolation);
	const hgtFileInfoPurgeThreshold = useAppSelector(selectHgtFileInfoPurgeThreshold);
	const hgtDirPathStore = useAppSelector(selectHgtDirPath);
	const hgtReadFileRate = useAppSelector(selectHgtReadFileRate);
	const uiItems = useAppSelector(selectUiItemKeys);
	const dashboardElements = useAppSelector(selectElementsSettings);

	const { width, height } = Dimensions.get('window');

	const { mapViewNativeNodeHandle, mapHeight, moveEnabled } = useContext(AppContext);

	const { currentMapEventRef } = useContext(MapContext);

	// const { zoomTo, zoomOut, getPosition } = useMap(mapViewNativeNodeHandle); // see emitsHardwareKeyUp note below.

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

	// ??? emitsHardwareKeyUp/onHardwareKeyUp aren't wired up to MapContainer in the New
	// Architecture rewrite of react-native-mapsforge-vtm -- the native TurboModule still has the
	// constant, but the Fabric view's codegen props and the MapContainer wrapper don't forward it
	// anymore. Disabled until upstream re-adds it.
	// const emitsHardwareKeyUp = useMemo(
	// 	() =>
	// 		hardwareKeys
	// 			.filter((keyConf) => 'none' !== keyConf.actionKey)
	// 			.map((keyConf) => keyConf.keyCodeString),
	// 	[hardwareKeys]
	// );

	// const handleHardwareKeyUp = useCallback(
	// 	(response: { keyCodeString: string }) => {
	// 		hardwareKeys.forEach((keyConf) => {
	// 			if (response.keyCodeString === keyConf.keyCodeString) {
	// 				switch (keyConf.actionKey) {
	// 					case 'zoomIn':
	// 						getPosition().then((position) => zoomTo(position.zoomLevel + 1));
	// 						break;
	// 					case 'zoomOut':
	// 						zoomOut();
	// 						break;
	// 				}
	// 			}
	// 		});
	// 	},
	// 	[hardwareKeys, getPosition, zoomTo, zoomOut]
	// );

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

	const handleMapError = useCallback((err: unknown) => console.log('Error', err), []);

	const handleMapResume = useCallback(
		(response: MapEventResponse) => console.log('lifecycle event onResume', response),
		[]
	);

	const handleMapEvent = useCallback(
		(response: MapEventResponse) => {
			currentMapEventRef.current = response;
		},
		[currentMapEventRef]
	);

	const styleOuter = useMemo(
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

	const styleMapWrapper = useMemo(() => ({ height: mapHeight, width }), [mapHeight, width]);

	const styleNoMap = useMemo(() => ({ height: mapHeight || 0, width }), [mapHeight, width]);

	return (
		<View style={styleOuter}>
			{showSplash && <SplashScreen />}

			<StatusBar barStyle={systemIsDarkMode ? 'light-content' : 'dark-content'} />

			<TopAppBar />

			<View style={styleMapWrapper}>
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
						moveEnabled={moveEnabled ?? true}
						tiltEnabled={false}
						rotationEnabled={false}
						zoomEnabled={true}
						// react-native-mapsforge-vtm's MapContainerProps types onPause/onResume/onMapUpdate
						// as DirectEventHandler<...> (the raw codegen native-component prop type), but
						// MapContainer's own implementation forwards them straight through as plain
						// (response: MapEventResponse) => void callbacks -- a library typing bug, not a
						// real runtime mismatch.
						onPause={saveCurrentPositionToInitial as MapContainerProps['onPause']}
						onError={handleMapError}
						onResume={handleMapResume as MapContainerProps['onResume']}
						onMapUpdate={handleMapEvent as MapContainerProps['onMapUpdate']}
					>
						<DebugBla />

						<BaseMap />

						<LayerScalebar />

						<LinesMapView />
						<RoutingMapView />
					</MapContainer>
				)}

				{!showMap && <View style={styleNoMap} />}

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

			<LineEditModalWrapper />
		</View>
	);
};

const LineEditModalWrapper: FC = () => {
	const dispatch = useAppDispatch();
	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const selectLine = useCallback((id: number, isSelected: boolean) => {
		dispatch(setLineSelected(id, isSelected));
	}, []);

	// Hide if linesDirectory, because selectLine has to be different. See LinesTable.
	return !uiItemsKeys.length || 'linesDirectory' !== uiItemsKeys[uiItemsKeys.length - 1] ? (
		<LineEditModal selectLine={selectLine} />
	) : undefined;
};

const styles = StyleSheet.create({
	zObove: { zIndex: 20 },
});

export default AppView;
