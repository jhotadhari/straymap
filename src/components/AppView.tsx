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
import {
	Dimensions,
	NativeSyntheticEvent,
	StatusBar,
	StyleSheet,
	useColorScheme,
	View,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';
/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	MapContainer,
	LayerScalebar,
	MapEventResponse,
	ResponseInclude,
	CanvasAdapterModule,
	ErrorWithErrorMsg,
} from 'react-native-mapsforge-vtm'; // also exports useMap, see emitsHardwareKeyUp note below.

/**
 * Internal dependencies
 */
import TopAppBar from '../store/features/ui/components/TopAppBar';
import type { InitialPosition } from '../types';
import { AppContext, MapContext } from '../Context';
import { ErrorToastContext } from './ErrorToast/Context';
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
	saveCurrentPositionToInitial: (event?: NativeSyntheticEvent<MapEventResponse>) => void;
	setMapViewNativeNodeHandle: Dispatch<SetStateAction<null | number>>;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const systemIsDarkMode = useColorScheme() === 'dark';

	const { showError } = useContext(ErrorToastContext);

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

	// onPause/onResume/onMapUpdate/onError are Fabric native-view event props, so React invokes them
	// with a NativeSyntheticEvent wrapper (event.nativeEvent), not a bare response object.
	const handleMapError = useCallback(
		(event: NativeSyntheticEvent<ErrorWithErrorMsg>) => {
			console.log('Error', event.nativeEvent);
			showError(sprintf(t('errorGeneric'), event.nativeEvent.errorMsg));
		},
		[showError, t]
	);

	const handleMapResume = useCallback(
		(event: NativeSyntheticEvent<MapEventResponse>) =>
			console.log('lifecycle event onResume', event.nativeEvent),
		[]
	);

	const handleMapEvent = useCallback(
		(event: NativeSyntheticEvent<MapEventResponse>) => {
			currentMapEventRef.current = event.nativeEvent;
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
						onPause={saveCurrentPositionToInitial}
						onError={handleMapError}
						onResume={handleMapResume}
						onMapUpdate={handleMapEvent}
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
