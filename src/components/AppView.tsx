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
import {
	Dimensions,
	NativeSyntheticEvent,
	PixelRatio,
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
	TapEventResponse,
	useMap,
} from 'react-native-mapsforge-vtm';
import { useMapPosition } from 'react-native-mapsforge-vtm/reanimated';

/**
 * react-native-hardwarekey-event dependencies
 */
import { useHardwareKeyEvent } from 'react-native-hardwarekey-event';
import type { KeyCode } from 'react-native-hardwarekey-event';

/**
 * Internal dependencies
 */
import TopAppBar from '../store/features/ui/components/TopAppBar';
import type { InitialPosition } from '../types';
import { AppContext, MapContext } from '../Context';
import { ErrorToastContext } from './ErrorToast/Context';
import SplashScreen from './SplashScreen';
import { useAppSelector } from '../store/hooks';
import { selectMapUpdateInterval, selectHardwareKeys } from '../store/features/general/selectors';
import { selectElementsSettings, selectItems } from '../store/features/dashboard/selectors';
import { DashboardItem } from '../store/features/dashboard/types';
import { selectHgtDirPath, selectMapsforgeGeneral } from '../store/features/baseMap/selectors';
import UiItemComponent from '../store/features/ui/components/UiItemComponent';
import useShowInitialSplash from '../compose/useShowInitialSplash';
import { DRAWER_HANDLE_SIZE } from '../store/features/drawers/constants';
import { selectItemKeys, selectControlHandleSide } from '../store/features/drawers/selectors';
import { getDrawerWidthResponsive } from '../store/features/drawers/utils';
import { useAppDispatch } from '../store/hooks';
import { featureRegistry } from '../store/features/FeatureRegistry';
import { setMapEvent } from '../store/features/gnss/slice';

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
	const hardwareKeys = useAppSelector(selectHardwareKeys);

	const dashboardItems = useAppSelector((state) => selectItems(state, { position: 'bottom' }));
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const hgtDirPathStore = useAppSelector(selectHgtDirPath);
	const dashboardElements = useAppSelector(selectElementsSettings);

	const controlHandleSide = useAppSelector(selectControlHandleSide);
	const leftItemKeys = useAppSelector((state) => selectItemKeys(state, { side: 'left' }));
	const rightItemKeys = useAppSelector((state) => selectItemKeys(state, { side: 'right' }));

	const getDrawerHandleHeight = useCallback(
		(itemsCount: number) =>
			itemsCount * DRAWER_HANDLE_SIZE + itemsCount * (DRAWER_HANDLE_SIZE / 2),
		[]
	);

	const { width, height } = Dimensions.get('window');

	const { mapViewNativeNodeHandle, mapHeight, moveEnabled, drawerControlsRef } =
		useContext(AppContext);

	const { currentMapEventRef, centerPositionSvRef } = useContext(MapContext);

	const { getPosition, flyTo } = useMap(mapViewNativeNodeHandle);

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
				{ zoomLevel: 2, center: 2 }
			) as ResponseInclude,
		[dashboardItems, dashboardElements]
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
			(event) => {
				const keyConf = hardwareKeys.find((kc) => kc.keyCodeString === event.keyCodeString);
				if (!keyConf) return;

				switch (keyConf.actionKey) {
					case 'zoomIn':
						getPosition().then((position) =>
							flyTo({ zoomLevel: position.zoomLevel + 1 })
						);
						break;
					case 'zoomOut':
						getPosition().then((position) =>
							flyTo({ zoomLevel: position.zoomLevel - 1 })
						);
						break;
				}
			},
			[
				hardwareKeys,
				getPosition,
				flyTo,
			]
		),
	});

	const insideMapComponents = useMemo(
		() => featureRegistry.getMapViewComponents('inside-map'),
		[]
	);
	const siblingOverlayComponents = useMemo(
		() => featureRegistry.getMapViewComponents('sibling-overlay'),
		[]
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
			// Dispatch for listener middleware (track recording watches this)
			dispatch(
				setMapEvent({
					center: event.nativeEvent.center,
					accuracy: (event.nativeEvent as any).accuracy,
				})
			);
		},
		[currentMapEventRef, handleMapUpdate, dispatch]
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

			<TopAppBar />

			<View style={styleMapWrapper}>
				<UiItemComponent />

				{showMap && (
					<MapContainer
						mapUpdateInterval={mapUpdateInterval}
						nativeNodeHandle={mapViewNativeNodeHandle}
						setNativeNodeHandle={setMapViewNativeNodeHandle}
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
						onTap={handleMapTap}
					>
						{insideMapComponents.map(({ key, Component, props }) => (
							<Component
								key={key}
								{...props}
							/>
						))}

						<LayerScalebar />
					</MapContainer>
				)}

				{!showMap && <View style={styleNoMap} />}

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

export default AppView;
