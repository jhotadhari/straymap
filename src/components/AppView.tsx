/**
 * External dependencies
 */
import React, {
	Dispatch,
	memo,
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
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { clamp, get, isEqual } from 'lodash-es';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	MapContainer,
	LayerScalebar,
	MapEventResponse,
	CanvasAdapterModule,
	ErrorWithErrorMsg,
	TapEventResponse,
	LongPressEventResponse,
	MapTapHit,
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
import { BOTTOM_DRAWER_HANDLE_HEIGHT } from '../features/bottomDrawer/constants';
import { selectItemKeys, selectControlHandleSide } from '../features/drawers/selectors';
import { getDrawerWidthResponsive } from '../features/drawers/utils';
import { useAppDispatch } from '../store/hooks';
import { featureRegistry } from '../features/FeatureRegistry';
import { emitMapContextMenu } from '../features/mapContextMenu/controller';
import { isMapPressOverDrawerUi } from './mapPressExclusions';
import LayerDebugDumpButton from './LayerDebugDumpButton';
import SceneBusyBridge from './SceneBusyBridge';
import MapCornerComponents from './MapCornerComponents';
import { useGnssSetup } from '../features/trackRecording/hooks/useGnssSetup';
import {
	selectIsRecording,
	selectResumePromptPending,
	selectUseDemAltitude,
} from '../features/trackRecording/selectors';
import { pauseRecordingForPrompt } from '../features/trackRecording/slice';
import { altitudeService } from '../lib/AltitudeService';
import { addBusyKey, removeBusyKey } from '../features/ui/slice';

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
	const isRecording = useAppSelector(selectIsRecording);
	const useDemAltitude = useAppSelector(selectUseDemAltitude);
	const resumePromptPending = useAppSelector(selectResumePromptPending);

	const controlHandleSide = useAppSelector(selectControlHandleSide);
	const leftItemKeys = useAppSelector((state) => selectItemKeys(state, { side: 'left' }));
	const rightItemKeys = useAppSelector((state) => selectItemKeys(state, { side: 'right' }));

	const { width, height } = useMemo(() => Dimensions.get('window'), []);

	const insets = useSafeAreaInsets();

	const {
		mapViewNativeNodeHandle,
		moveEnabled,
		drawerControlsRef,
		bottomBarHeight,
		bottomDrawerHeightSv,
		drawerGestureRef,
	} = useContext(AppContext);

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

	// Warm surface recreation (swipe-close with the foreground service
	// keeping the JS process alive): Redux still says isRecording, but
	// the map + GNSS pipeline died with the old surface. Pause the stale
	// recording state and ask via the resume prompt. Runs once per
	// surface mount — on a cold process start isRecording is still false
	// at this point (the restore path arms the prompt itself).
	useEffect(() => {
		if (isRecording && !resumePromptPending) {
			dispatch(pauseRecordingForPrompt());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { currentMapEventRef, centerPositionSvRef } = useContext(MapContext);

	const { flyTo } = useMap(mapViewNativeNodeHandle);

	const { centerSv, handleMapUpdate } = useMapPosition();
	// Expose the shared value through context so dashboard elements
	// can read the map center without bridge crossings.
	centerPositionSvRef.current = centerSv;

	const hgtDirPath = useMemo(() => {
		const widgetWantsDem = dashboardItems.reduce((acc: boolean, ele: DashboardItem) => {
			return acc || !ele.elementType
				? acc
				: get(dashboardWidgets, [ele.elementType, 'shouldSetHgtDirPath'], false);
		}, false) as boolean;
		// Also expose DEM altitude data while track recording is
		// active with the DEM-elevation toggle on — otherwise
		// recording silently falls back to GNSS altitude whenever
		// the centerAltitude widget is not on the dashboard.
		const recordingWantsDem = isRecording && useDemAltitude;
		return hgtDirPathStore && (widgetWantsDem || recordingWantsDem)
			? hgtDirPathStore
			: undefined;
	}, [
		hgtDirPathStore,
		dashboardItems,
		dashboardWidgets,
		isRecording,
		useDemAltitude,
	]);

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
	const mapsforgeGeneralPrevRef = useRef<typeof mapsforgeGeneral | undefined>(undefined);
	const mapWrapperRef = useRef<View>(null);
	const mapWindowOffsetRef = useRef<{ x: number; y: number } | null>(null);
	useEffect(() => {
		const prev = mapsforgeGeneralPrevRef.current;
		mapsforgeGeneralPrevRef.current = mapsforgeGeneral;
		// Values unchanged since the last run (and this is not the initial
		// mount) — the canvas scales are already applied and the map is
		// already shown, so skip the teardown/remount round-trip.
		if (undefined !== prev && isEqual(prev, mapsforgeGeneral)) {
			return;
		}
		// Snapshot the current position into initialPositionRef so the
		// recreated map resumes where the user was, rather than jumping
		// to a stale saved position.  (saveCurrentPositionToInitial only
		// writes to DefaultPreference, not the ref, so onPause during
		// unmount arrives too late for the re-mount render pass.)
		if (currentMapEventRef.current?.center && currentMapEventRef.current?.zoomLevel) {
			initialPositionRef.current = {
				center: currentMapEventRef.current.center,
				zoomLevel: currentMapEventRef.current.zoomLevel,
			};
		}
		setShowMap(false);
		setTimeout(() => {
			CanvasAdapterModule.setLineScale(mapsforgeGeneral.lineScale);
			CanvasAdapterModule.setTextScale(mapsforgeGeneral.textScale);
			CanvasAdapterModule.setSymbolScale(mapsforgeGeneral.symbolScale);
			setShowMap(true);
		}, 1);
	}, [
		mapsforgeGeneral,
		currentMapEventRef,
		initialPositionRef,
	]);

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

	// onTap/onLongPress fire for every map press (the library's HitTestLayer
	// aggregates hits from all layer managers into the event payload). On a
	// short press, close any open drawers to give the user a clear view of
	// the map and emit the press to the mapContextMenu feature. Long presses
	// open the context menu but leave the drawers alone. Presses on drawer
	// handles and drawer content (side or bottom) are excluded so that
	// interacting with a drawer never triggers map behavior.
	const handleMapPress = useCallback(
		(event: NativeSyntheticEvent<TapEventResponse>, press: 'short' | 'long') => {
			const { x, y, lng, lat } = event.nativeEvent;
			const xLogical = x / PixelRatio.get();
			const yLogical = y / PixelRatio.get();

			// While a finger is on a drawer handle (or just after it lifted),
			// the native map still receives the same touch stream and may
			// emit tap/long-press events mid-drag; ignore them outright.
			const drawerGesture = drawerGestureRef.current;
			if (drawerGesture.active > 0 || Date.now() < drawerGesture.until) {
				return;
			}

			const drawerWidthResponsive = getDrawerWidthResponsive(width);

			const leftItemCount = leftItemKeys.length + (controlHandleSide === 'left' ? 1 : 0);
			const rightItemCount = rightItemKeys.length + (controlHandleSide === 'right' ? 1 : 0);

			// Window-space press position — used for the bottom-drawer region,
			// which anchors to the window bottom and is therefore independent
			// of the map wrapper's vertical offset.
			const windowOffset = mapWindowOffsetRef.current;
			const windowY = (windowOffset?.y ?? 0) + yLogical;

			const overDrawerUi = isMapPressOverDrawerUi({
				x: xLogical,
				y: yLogical,
				windowY,
				width,
				windowHeight: height,
				insetsBottom: insets.bottom,
				drawerWidthResponsive,
				drawerHandleSize: DRAWER_HANDLE_SIZE,
				bottomDrawerHandleHeight: BOTTOM_DRAWER_HANDLE_HEIGHT,
				bottomDrawerItemsExist: (bottomBarHeight?.bottomDrawer ?? 0) > 0,
				bottomDrawerHeight: bottomDrawerHeightSv.value,
				leftTranslationX: drawerControlsRef.current?.left.translationX?.value ?? null,
				rightTranslationX: drawerControlsRef.current?.right.translationX?.value ?? null,
				leftItemCount,
				rightItemCount,
			});
			if (overDrawerUi) {
				return;
			}

			if ('short' === press) {
				drawerControlsRef.current?.left.expand(false);
				drawerControlsRef.current?.right.expand(false);
			}

			// Parse the aggregated layer hits (JSON string — see the
			// library's HitTestLayer / TapEventResponse.hits) and forward
			// to the map context menu. Filter to plain objects: a malformed
			// native payload must never surface null/primitives to sources.
			let hits: MapTapHit[] = [];
			try {
				const parsed = event.nativeEvent?.hits ? JSON.parse(event.nativeEvent.hits) : [];
				hits = Array.isArray(parsed)
					? parsed.filter((hit: unknown) => hit && typeof hit === 'object')
					: [];
			} catch {
				hits = [];
			}
			// The popover renders in a Modal (window space), so convert the
			// map-local physical px to window dp via the wrapper's offset.
			const mapEvent = currentMapEventRef.current;
			emitMapContextMenu({
				press,
				lng,
				lat,
				x,
				y,
				windowX: (windowOffset?.x ?? 0) + xLogical,
				windowY,
				...(mapEvent?.zoomLevel != null && { zoomLevel: mapEvent.zoomLevel }),
				...(mapEvent?.tileSize != null && { tileSize: mapEvent.tileSize }),
				hits,
			});
		},
		[
			drawerControlsRef,
			drawerGestureRef,
			leftItemKeys.length,
			rightItemKeys.length,
			controlHandleSide,
			width,
			height,
			currentMapEventRef,
			insets.bottom,
			bottomBarHeight,
			bottomDrawerHeightSv,
		]
	);

	const handleMapTap = useCallback(
		(event: NativeSyntheticEvent<TapEventResponse>) => handleMapPress(event, 'short'),
		[handleMapPress]
	);

	const handleMapLongPress = useCallback(
		(event: NativeSyntheticEvent<LongPressEventResponse>) => handleMapPress(event, 'long'),
		[handleMapPress]
	);

	const styleContainer: ViewStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			flex: 1,
			width,
			flexDirection: 'column',
			justifyContent: 'space-between',
		}),
		[
			theme,
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

	return (
		<View style={styleContainer}>
			{showSplash && <SplashScreen />}

			<TopAppBar />

			<View style={styleAppInner}>
				<UiItemComponent />

				<View
					style={styles.map}
					ref={mapWrapperRef}
					onLayout={() => {
						mapWrapperRef.current?.measureInWindow((x, y) => {
							mapWindowOffsetRef.current = { x, y };
						});
					}}
				>
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
							onLongPress={handleMapLongPress}
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

							<SceneBusyBridge />
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
});

export default memo(AppView);
