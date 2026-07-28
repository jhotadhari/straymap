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
	useRef,
	useState,
} from 'react';
import {
	Dimensions,
	NativeSyntheticEvent,
	PixelRatio,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { clamp, get } from 'lodash-es';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';
import {
	MapContainer,
	LayerScalebar,
	MapEventResponse,
	CanvasAdapterModule,
	ErrorWithErrorMsg,
	TapEventResponse,
	useMap,
	ReindexScope,
} from 'react-native-mapsforge-vtm';
import { useMapPosition } from 'react-native-mapsforge-vtm/reanimated';
import { useHardwareKeyEvent } from 'react-native-hardwarekey-event';
import type { KeyCode, KeyEvent } from 'react-native-hardwarekey-event';

/**
 * Internal dependencies
 */
import TopAppBar from '../features/ui/components/TopAppBar';
import type { InitialPosition } from '../types';
import { AppContext, MapContext } from '../Context';
import { ErrorToastContext } from './ErrorToast/Context';
import SplashScreen from './SplashScreen';
import { useAppSelector } from '../store/hooks';
import { selectHardwareKeys } from '../features/general/selectors';
import { selectElementsSettings, selectItems } from '../features/dashboard/selectors';
import { DashboardItem } from '../features/dashboard/types';
import { selectHgtDirPath, selectMapsforgeGeneral } from '../features/baseMap/selectors';
import UiItemComponent from '../features/ui/components/UiItemComponent';
import useShowInitialSplash from '../compose/useShowInitialSplash';
import { DRAWER_HANDLE_SIZE } from '../features/drawers/constants';
import { selectItemKeys, selectControlHandleSide } from '../features/drawers/selectors';
import { getDrawerWidthResponsive } from '../features/drawers/utils';
import { useAppDispatch } from '../store/hooks';
import { featureRegistry } from '../features/FeatureRegistry';
import LayerDebugDumpButton from './LayerDebugDumpButton';
import MapCornerComponents from './MapCornerComponents';
import { useGnssSetup } from '../features/trackRecording/hooks/useGnssSetup';
import { altitudeService } from '../lib/AltitudeService';
import { addBusyKey, removeBusyKey } from '../features/ui/slice';
import useIsShowingUiComponent from '../features/ui/hooks/useIsShowingUiComponent';

const zoomMin = 2;
const zoomMax = 20;

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

	const { showError } = useContext(ErrorToastContext);

	const showSplash = useShowInitialSplash();

	const dispatch = useAppDispatch();
	const { gnssFilter, handleGnssPosition } = useGnssSetup();

	const hardwareKeys = useAppSelector(selectHardwareKeys);

	const dashboardItems = useAppSelector((state) => selectItems(state, { position: 'bottom' }));
	const hgtDirPathStore = useAppSelector(selectHgtDirPath);
	const dashboardWidgets = useAppSelector(selectElementsSettings);

	const controlHandleSide = useAppSelector(selectControlHandleSide);
	const leftItemKeys = useAppSelector((state) => selectItemKeys(state, { side: 'left' }));
	const rightItemKeys = useAppSelector((state) => selectItemKeys(state, { side: 'right' }));

	const getDrawerHandleHeight = useCallback(
		(itemsCount: number) =>
			itemsCount * DRAWER_HANDLE_SIZE + itemsCount * (DRAWER_HANDLE_SIZE / 2),
		[]
	);

	const { width, height } = Dimensions.get('window');

	const { mapViewNativeNodeHandle, moveEnabled, drawerControlsRef } = useContext(AppContext);

	// Wire the map's nativeNodeHandle to altitudeService so thunks
	// (routing, elevation enrichment) can query altitude without
	// needing the React tree.
	useEffect(() => {
		if (mapViewNativeNodeHandle) {
			altitudeService.wire(mapViewNativeNodeHandle);
		}
		return () => {
			altitudeService.unwire();
		};
	}, [mapViewNativeNodeHandle]);

	const { currentMapEventRef, centerPositionSvRef } = useContext(MapContext);

	const { flyTo } = useMap(mapViewNativeNodeHandle);

	const { centerSv, handleMapUpdate } = useMapPosition();
	// Expose the shared value through context so dashboard elements
	// can read the map center without bridge crossings.
	centerPositionSvRef.current = centerSv;

	const hgtDirPath = useMemo(
		() =>
			hgtDirPathStore &&
			(dashboardItems.reduce((acc: boolean, ele: DashboardItem) => {
				return acc || !ele.elementType
					? acc
					: get(dashboardWidgets, [ele.elementType, 'shouldSetHgtDirPath'], false);
			}, false) as boolean)
				? hgtDirPathStore
				: undefined,
		[
			hgtDirPathStore,
			dashboardItems,
			dashboardWidgets,
		]
	);

	// Observe hardware keys that have a non-'none' action assigned.
	// Only the key-code strings themselves are passed to the native layer;
	// the actionKey is resolved in onKeyDown via the Redux config.
	const observedKeyCodes = useMemo(
		() =>
			hardwareKeys
				.filter((keyConf) => keyConf.actionKey !== 'general.none')
				.map((keyConf) => keyConf.keyCodeString as KeyCode),
		[hardwareKeys]
	);

	useHardwareKeyEvent({
		keys: observedKeyCodes,
		onKeyDown: useCallback(
			(event: KeyEvent) => {
				const keyConf = hardwareKeys.find((kc) => kc.keyCodeString === event.keyCodeString);
				if (!keyConf || undefined === currentMapEventRef.current?.zoomLevel) return;

				switch (keyConf.actionKey) {
					case 'zoomIn':
						flyTo({
							zoomLevel: clamp(
								currentMapEventRef.current?.zoomLevel + 1,
								zoomMin,
								zoomMax
							),
						});
						break;
					case 'zoomOut':
						flyTo({
							zoomLevel: clamp(
								currentMapEventRef.current?.zoomLevel - 1,
								zoomMin,
								zoomMax
							),
						});
						break;
				}
			},
			[
				hardwareKeys,
				flyTo,
				currentMapEventRef,
			]
		),
	});

	const insideMapComponents = useMemo(() => featureRegistry.getMapComponents(), []);
	const siblingOverlayComponents = useMemo(() => featureRegistry.getAppOverlays(), []);

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

	// Busy key 'map:init': added when MapContainer mounts, removed on first rendered frame.
	const firstMapUpdateRef = useRef(false);
	useEffect(() => {
		if (showMap) {
			firstMapUpdateRef.current = false;
			dispatch(addBusyKey('map:init'));
		}
	}, [showMap, dispatch]);

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
			// Feed the same event to useMapPosition's shared values
			// so centerSv stays in sync at zero bridge cost.
			handleMapUpdate(event as { nativeEvent: Readonly<MapEventResponse> });
			// First onMapUpdate signals the native map has rendered its initial
			// frame with layers mounted — clear the 'map:init' busy key.
			if (!firstMapUpdateRef.current) {
				firstMapUpdateRef.current = true;
				dispatch(removeBusyKey('map:init'));
			}
			// Track recording positions now flow through the native gnssFilter
			// on MapContainer — onGnssPosition dispatches writeGnssPosition.
		},
		[
			currentMapEventRef,
			handleMapUpdate,
			dispatch,
		]
	);

	// onTap fires when the user taps on an empty map area (unconsumed by marker/path layers).
	// On a tap, close any open drawers to give the user a clear view of the map.
	// Taps on drawer handles and expanded drawer content are excluded so that interacting
	// with a drawer doesn't immediately close it.
	const handleMapTap = useCallback(
		(event: NativeSyntheticEvent<TapEventResponse>) => {
			const { x, y } = event.nativeEvent;
			const xLogical = x / PixelRatio.get();
			const yLogical = y / PixelRatio.get();

			const drawerWidthResponsive = getDrawerWidthResponsive(width);

			const translationXLeft = drawerControlsRef.current?.left.translationX;
			const translationXRight = drawerControlsRef.current?.right.translationX;

			// Left-side exclusion: handles always visible; when expanded, the drawer
			// content covers drawerWidth from the left edge plus the handle tab.
			const leftItemCount = leftItemKeys.length + (controlHandleSide === 'left' ? 1 : 0);
			if (leftItemCount > 0) {
				const leftHandleH = getDrawerHandleHeight(leftItemCount);
				// Get out if the tap event was within the rectangle of the left drawer handles.
				// Handles sit at the right edge of the drawer content and extend right by
				// DRAWER_HANDLE_SIZE.  The content itself is at x = translationXLeft (left edge)
				// with width = drawerWidthResponsive, so the handle rectangle is:
				//   [translationXLeft + drawerWidth, translationXLeft + drawerWidth + HANDLE_SIZE]
				const leftHandleLeft =
					(translationXLeft?.value ?? -drawerWidthResponsive) + drawerWidthResponsive;
				const leftHandleRight = leftHandleLeft + DRAWER_HANDLE_SIZE;
				if (yLogical <= leftHandleH && xLogical <= leftHandleRight) {
					return;
				}
			}

			// Right-side exclusion: mirror of the left-side logic.
			const rightItemCount = rightItemKeys.length + (controlHandleSide === 'right' ? 1 : 0);
			if (rightItemCount > 0) {
				const rightHandleH = getDrawerHandleHeight(rightItemCount);
				// Get out if the tap event was within the rectangle of the right drawer handles.
				// Handles sit at the left edge of the drawer content and extend left by
				// DRAWER_HANDLE_SIZE.  The content itself ends at x = width (flex-end) with
				// width = drawerWidthResponsive, so its left edge is:
				//   width - drawerWidth + translationXRight
				// and the handle rectangle is:
				//   [contentLeft - HANDLE_SIZE, contentLeft]
				const rightContentLeft =
					width -
					drawerWidthResponsive +
					(translationXRight?.value ?? drawerWidthResponsive);
				const rightHandleLeft = rightContentLeft - DRAWER_HANDLE_SIZE;
				if (yLogical <= rightHandleH && xLogical >= rightHandleLeft) {
					return;
				}
			}

			drawerControlsRef.current?.left.expand(false);
			drawerControlsRef.current?.right.expand(false);
		},
		[
			drawerControlsRef,
			getDrawerHandleHeight,
			leftItemKeys.length,
			rightItemKeys.length,
			controlHandleSide,
			width,
		]
	);

	const styleContainer: ViewStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			height,
			width,
			flexDirection: 'column',
			justifyContent: 'space-between',
		}),
		[
			theme,
			height,
			width,
		]
	);

	const styleAppInner: ViewStyle = useMemo(
		() => ({
			flexDirection: 'column',
			flexGrow: 1,
		}),
		[]
	);

	const isShowingUiComponent = useIsShowingUiComponent();

	const styleMap: StyleProp<ViewStyle> = useMemo(
		() => [
			styles.map,
			...(isShowingUiComponent ? [styles.hidden] : []),
		],
		[isShowingUiComponent]
	);

	return (
		<View style={styleContainer}>
			{showSplash && <SplashScreen />}

			<TopAppBar />

			<View style={styleAppInner}>
				<UiItemComponent />

				<View style={styleMap}>
					{showMap && (
						<MapContainer
							nativeNodeHandle={mapViewNativeNodeHandle}
							setNativeNodeHandle={setMapViewNativeNodeHandle}
							hgtDirPath={hgtDirPath}
							height={null}
							width={null}
							center={initialPositionRef?.current?.center}
							zoomLevel={initialPositionRef?.current?.zoomLevel}
							zoomMin={zoomMin}
							zoomMax={zoomMax}
							moveEnabled={moveEnabled ?? true}
							tiltEnabled={false}
							rotationEnabled={false}
							zoomEnabled={true}
							onPause={saveCurrentPositionToInitial}
							onError={handleMapError}
							onResume={handleMapResume}
							onMapUpdate={handleMapEvent}
							onTap={handleMapTap}
							gnssFilter={gnssFilter}
							onGnssPosition={handleGnssPosition}
						>
							{insideMapComponents.map(({ key, Component, props }) => (
								<Component
									key={key}
									{...props}
								/>
							))}

							<ReindexScope order={9999}>
								<LayerScalebar />
							</ReindexScope>

							<MapCornerComponents />

							<LayerDebugDumpButton />
						</MapContainer>
					)}
				</View>

				{siblingOverlayComponents.map(({ key, Component, props }) => (
					<Component
						key={key}
						{...props}
					/>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	map: {
		flexDirection: 'column',
		flexGrow: 1,
	},
	hidden: {
		opacity: 0,
	},
});

export default AppView;
