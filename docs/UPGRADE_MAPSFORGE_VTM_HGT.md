# Upgrade: react-native-mapsforge-vtm HGT/Altitude API Redesign

## What changed in the library

The `react-native-mapsforge-vtm` library (`feature/layer-order-fix` branch, to be merged into
`main`) has undergone a complete HGT/altitude API redesign. The changes reduce the Java codebase by
~380 lines (532→150) while adding a new imperative altitude-query API.

### Removed from MapContainer view props

| Removed prop | Why |
|---|---|
| `hgtInterpolation` | Hardcoded to `true` — bilinear interpolation is always on. Nearest-neighbor mode had no known real-world use case. |
| `hgtReadFileRate` | Rate-limiting HGT file reads is no longer needed — file reads happen on-demand via explicit JS calls, not per-frame from the render thread. |
| `hgtFileInfoPurgeThreshold` | The custom spatial-purge mechanism was replaced by Android's built-in `LruCache` (count-based, 10-tile cap, ~29MB max). |

### Renamed prop

| Old name | New name | Reason |
|---|---|---|
| `mapEventRate` | `mapUpdateInterval` | The old name suggested Hz (events/second) but the value is actually **milliseconds between events**. The new name is self-documenting. Default is `40` (~25fps). |

### New imperative API: `useMap().getAltitudeAtPosition(lng, lat)`

```typescript
// Returns elevation in metres, or null if no HGT data covers that position.
const { getAltitudeAtPosition } = useMap();
const elevation = await getAltitudeAtPosition(lng, lat);
```

This is an **explicit, async, pull-based** API. Use it for:
- Tap-to-query-elevation ("what's the elevation here?")
- One-shot lookups (button press, marker placement)

It is NOT suitable for continuous 25fps display during panning — see "Continuous elevation display" below.

### Altitude restored in `onMapUpdate` center position

After the initial redesign removed altitude from `onMapUpdate` events (to avoid implicit,
synchronous per-frame lookups), feedback showed that continuous elevation display during panning
requires **push-based** delivery. Altitude was restored to the `center` array:

```typescript
// onMapUpdate event payload:
{
  center: [lng, lat, alt?]  // 3rd element present iff hgtDirPath is configured on MapContainer
}
```

The lookup is now powered by the new `ElevationReader` (thread-safe, LruCache-backed),
not the old `HgtReader`. Cached lookups are sub-millisecond — the render thread is not blocked.

### New reanimated hook: `useMapPosition()` from `/reanimated`

```typescript
import { useMapPosition } from 'react-native-mapsforge-vtm/reanimated';

const { centerSv, zoomSv, bearingSv, tiltSv, handleMapUpdate } = useMapPosition();

// Pass handleMapUpdate as the onMapUpdate callback:
<MapContainer onMapUpdate={handleMapUpdate} ...>

// centerSv is a SharedValue<[number, number] | null> — read it from worklets at 60fps
// with zero bridge crossings and zero React re-renders.
```

Requires `react-native-reanimated >= 3.0.0` (already in straymap's dependencies).

## Migration steps for straymap

### Step 1: Rename `mapEventRate` → `mapUpdateInterval`

This is a mechanical rename across the Redux store:

**`src/store/features/general/slice.ts`:**
```diff
- mapEventRate: MapContainerProps['mapEventRate'];
+ mapUpdateInterval: MapContainerProps['mapUpdateInterval'];

- mapEventRate: 40,
+ mapUpdateInterval: 40,

- setMapEventRate: (state, action: PayloadAction<GeneralSettings['mapEventRate']>) => {
-     state.mapEventRate = action.payload;
- },
+ setMapUpdateInterval: (state, action: PayloadAction<GeneralSettings['mapUpdateInterval']>) => {
+     state.mapUpdateInterval = action.payload;
+ },

- export const { ..., setMapEventRate, ... } = generalSlice.actions;
+ export const { ..., setMapUpdateInterval, ... } = generalSlice.actions;
```

**`src/store/features/general/selectors.ts`:**
```diff
- export const selectMapEventRate = (state: RootState) => state.general.mapEventRate;
+ export const selectMapUpdateInterval = (state: RootState) => state.general.mapUpdateInterval;
```

**`src/store/features/general/connectStorage.ts`:**
Update the persistence key to migrate existing stored values. Straymap uses Redux persistence — either:
- Add a migration that renames `mapEventRate` → `mapUpdateInterval`, or
- Keep the storage key as-is and rename only the in-memory field (simpler)

**`src/components/AppView.tsx`** (around line 314):
```diff
- mapEventRate={mapEventRate}
+ mapUpdateInterval={mapUpdateInterval}
```
Also update the variable destructuring above to use the new selector name.

**Files referencing `selectMapEventRate`:**
- `src/store/features/dashboard/elements/centerAltitude/Display.tsx` (line 32)
- `src/store/features/dashboard/elements/zoomLevel/Display.tsx`
- `src/store/features/dashboard/elements/centerCoordinates/Display.tsx`

All need `s/selectMapEventRate/selectMapUpdateInterval/g` and `s/mapEventRate/mapUpdateInterval/g`.

### Step 2: Remove deprecated HGT Redux state

The three removed props (`hgtInterpolation`, `hgtReadFileRate`, `hgtFileInfoPurgeThreshold`) are
no longer valid on `<MapContainer>`. Remove them from the Redux store:

**`src/store/features/baseMap/slice.ts`:**
```diff
export interface BaseMapSettings {
    layers: LayerConfig[];
    mapsforgeProfiles: MapsforgeProfile[];
    hgtDirPath?: LayerHillshadingProps['hgtDirPath'];
-   hgtReadFileRate: number;
-   hgtInterpolation: boolean;
-   hgtFileInfoPurgeThreshold: number;
    mapsforgeGeneral: MapsforgeGeneral;
    renderStylesCache: RenderStylesCache;
}
```

Remove from `initialSettings` and all four reducers (`setHgtReadFileRate`, `setHgtInterpolation`,
`setHgtFileInfoPurgeThreshold`). Also remove from the exported actions list.

**`src/store/features/baseMap/selectors.ts`:**
Remove `selectHgtReadFileRate`, `selectHgtInterpolation`, `selectHgtFileInfoPurgeThreshold`.

**`src/store/features/baseMap/connectStorage.ts`:**
Remove persistence keys for the three removed fields.

### Step 3: Update AppView.tsx MapContainer props

**`src/components/AppView.tsx`** (around lines 313-320):
```diff
<MapContainer
-   mapEventRate={mapEventRate}
+   mapUpdateInterval={mapUpdateInterval}
    nativeNodeHandle={mapViewNativeNodeHandle}
    setNativeNodeHandle={setMapViewNativeNodeHandle}
-   hgtInterpolation={hgtInterpolation}
-   hgtFileInfoPurgeThreshold={hgtFileInfoPurgeThreshold}
-   hgtReadFileRate={hgtReadFileRate}
    hgtDirPath={hgtDirPath}
    responseInclude={responseInclude}
    height={mapHeight || 0}
    ...
>
```

Also update the destructured variables at the top of the component to remove the three removed
props. The `hgtDirPath` prop stays — it now goes through `NativeMapContainer.setHgtDirPath()`
internally (a `useEffect` in the library's `MapContainer.tsx` handles the bridge call).

### Step 4: Update HgtControl.tsx (DEM settings UI)

**`src/store/features/general/components/controls/HgtControl.tsx`:**

Remove the "advanced settings" section that exposes `hgtReadFileRate` and
`hgtFileInfoPurgeThreshold`. These are no longer configurable — the library uses sensible
internal defaults (LruCache with 10-tile cap).

The `hgtInterpolation` toggle can also be removed — interpolation is always on.

The resulting control should only contain the HGT source directory picker.

### Step 5: Consider adopting `useMapPosition()` for centerAltitude

**`src/store/features/dashboard/elements/centerAltitude/Display.tsx`:**

The current implementation uses `setInterval` polling `currentMapEventRef.current.center[2]` at
`mapUpdateInterval` ms. This works but:

1. Requires JS-thread timer overhead
2. Triggers React re-renders on every poll
3. Relies on the `center[2]` element being present (which now requires `hgtDirPath` on `MapContainer`)

Consider replacing with `useMapPosition()`:

```typescript
import { useMapPosition } from 'react-native-mapsforge-vtm/reanimated';
import { useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

// In the component:
const { centerSv, handleMapUpdate } = useMapPosition();

// centerSv.value is [lng, lat] (no altitude in shared values currently, but you can
// combine with getAltitudeAtPosition for on-demand elevation queries)

// For 60fps coordinate display without re-renders, use useAnimatedProps.
// For altitude specifically, call getAltitudeAtPosition() from useMap() on tap
// or at a lower frequency than 25fps.
```

If you need continuous altitude display at 25fps, keep the `onMapUpdate` polling approach —
it still works, and the `center[2]` element is populated when `hgtDirPath` is set on
`MapContainer`. Just ensure `hgtDirPath` is passed.

### Step 6: Add tap-to-query-elevation feature

Add `getAltitudeAtPosition` to any map interaction where elevation context is useful:

```typescript
import { useMap } from 'react-native-mapsforge-vtm';

const { getAltitudeAtPosition } = useMap();

const handleTap = useCallback(async (event: any) => {
    const { lng, lat } = event.nativeEvent;
    const elevation = await getAltitudeAtPosition(lng, lat);
    if (elevation !== null) {
        // Show elevation in a toast, overlay, or dashboard element
        console.log(`Elevation at tap: ${elevation}m`);
    }
}, [getAltitudeAtPosition]);

<MapContainer onTap={handleTap} ...>
```

### Step 7: Update translations

Remove i18n keys that are no longer used:
- `general.hgtInterpolation`
- `general.hint.hgtInterpolation`
- `general.hgtReadFileRate`
- `general.hint.hgtReadFileRate`
- `general.hgtFileInfoPurgeThreshold`
- `general.hint.hgtFileInfoPurgeThreshold`

### Step 8: Update tests

**`src/store/features/general/__tests__/slice.test.ts`:**
- Rename `mapEventRate` → `mapUpdateInterval` in test assertions
- Remove tests for `setMapEventRate`, add tests for `setMapUpdateInterval`

**`src/store/features/baseMap/` tests (if any):**
- Remove tests for removed reducers/selectors

### Step 9: Update CLAUDE.md

Straymap's `CLAUDE.md` should document:
- The new `useMap().getAltitudeAtPosition()` API
- The `useMapPosition()` reanimated hook
- That `hgtInterpolation`/`hgtReadFileRate`/`hgtFileInfoPurgeThreshold` no longer exist
- The `mapEventRate` → `mapUpdateInterval` rename

## Three-tier map position consumption (for reference)

The library now documents three patterns for consuming map position:

| Tier | API | Bridge crossings | React re-renders | Best for |
|---|---|---|---|---|
| Callback | `MapContainer.onMapUpdate` prop | ~25/sec (native→JS push) | ~25/sec | Debug overlays, one-shot reactions, centerAltitude polling |
| Shared values | `useMapPosition()` from `/reanimated` | 0 for reads (UI thread) | 0 | Smooth 60fps coordinate displays, worklet-driven overlays |
| Imperative | `useMap().getPosition()` | 2 per call (round-trip) | 0–1 per call | Button-triggered snapshots |
| Altitude | `useMap().getAltitudeAtPosition(lng, lat)` | 2 per call (round-trip) | 0–1 per call | Tap-to-query, one-shot elevation lookups |

## Verification checklist

After completing all steps:

- [ ] `yarn typecheck` passes (0 errors)
- [ ] `yarn lint` passes (0 errors)
- [ ] `yarn example android` builds and runs on device
- [ ] Hillshading layer renders correctly with existing HGT data
- [ ] Dashboard centerAltitude displays elevation during panning
- [ ] Settings → DEM screen only shows HGT directory picker (no advanced options)
- [ ] No console warnings about unrecognized React props
- [ ] Redux DevTools shows `mapUpdateInterval` (not `mapEventRate`) in state
- [ ] Stored Redux state migrates correctly (existing `mapEventRate` values are preserved under the new key)
