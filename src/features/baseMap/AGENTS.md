# BaseMap feature

Map layer management: layers configuration, mapsforge rendering profiles,
global DEM directory, and runtime layer metadata. Layers are rendered
inside `MapContainer` via `BaseMap` (a `mapComponent` with priority 100).

## Extension points

| Point | Value |
|---|---|
| `uiItems` / `settingsPageKeys` | `'maps'` — full-screen settings page with layers, profiles, global mapsforge settings, cache manager |
| `drawerPanels` | `mapsDrawerItem` — side-drawer accordion with layers + profiles |
| `mapComponents` | `BaseMap` — iterates layers and delegates to type-specific renderers |
| `mapCornerComponents` | `MapLayersAttribution` — map-corner attribution overlay |

## Redux state (`slice.ts`)

```ts
BaseMapState extends SliceSettingsBase, BaseMapSettings {
  initialized: boolean;
  layers: LayerConfig[];                 // committed layer list
  mapsforgeProfiles: MapsforgeProfile[]; // committed profile list
  hgtDirPath?: string;                   // global DEM directory
  mapsforgeGeneral: MapsforgeGeneral;    // { textScale, lineScale, symbolScale }
  renderStylesCache: RenderStylesCache;  // cached render-style options per theme

  // Ephemeral (unsaved editing state):
  layersTemp?: LayerConfig[];
  layerTemp?: LayerConfig;               // single layer being edited in modal
  mapsforgeProfilesTemp?: MapsforgeProfile[];
  mapsforgeProfileTemp?: MapsforgeProfile;
  layerInfos: { [key: string]: LayerInfo }; // runtime metadata per layer
}
```

### Key reducers (all exported as actions)

| Reducer | Purpose |
|---|---|
| `setLayers({ layers?, temp? })` | Sets committed layers (`temp=false`) or editing copy (`temp=true`); if called without `layers`, commits `layersTemp` |
| `setLayerTemp(layer?)` | Sets/clears the layer being edited; upserts into `layersTemp` by key |
| `setMapsforgeProfiles({ profiles?, temp? })` | Same pattern for profiles |
| `setMapsforgeProfileTemp(profile?)` | Sets/clears the profile being edited; upserts into `profilesTemp` |
| `setHgtDirPath(path?)` | Sets global DEM directory |
| `setMapsforgeGeneral({...})` | Sets line/text/symbol scales |
| `setRenderStylesCache({...})` | Caches render style options/defaults per theme |
| `setLayerInfos({...})` | Stores runtime layer metadata (attribution, description, comment, createdBy) |

### Key thunks

| Thunk | Purpose | Notes |
|---|---|---|
| `setLayerTemp` | Sets layer being edited | `getSetterThunkWithGetter` wrapper — skips dispatch if unchanged |
| `setMapsforgeProfileTemp` | Sets profile being edited | Same skip-if-unchanged guard |
| `setMapsforgeGeneral` | Sets global scale settings | Same skip-if-unchanged guard |
| `setLayerInfos` | Sets runtime layer metadata | Same skip-if-unchanged guard |

## Key selectors (`selectors.ts`)

| Selector | Returns | Notes |
|---|---|---|
| `selectInitialized` | `boolean` | Whether settings were restored from storage |
| `selectLayers(state, opts?)` | `LayerConfig[]` | Returns temp copy when `opts?.temp`; fills defaults via `fillLayerConfigOptionsWithDefaults` |
| `selectLayerTemp` | `LayerConfig \| undefined` | Current editing layer with defaults filled, cast as `LayerConfig` |
| `selectMapsforgeProfiles(state, opts?)` | `MapsforgeProfile[]` | Temp copy when `opts?.temp` |
| `selectMapsforgeProfileTemp` | `MapsforgeProfile \| undefined` | Profile being edited |
| `selectHgtDirPath` | `string \| undefined` | Global DEM directory |
| `selectMapsforgeGeneral` | `MapsforgeGeneral` | Global scale settings |
| `selectRenderStylesCache` | `RenderStylesCache` | Cached render style options |
| `selectLayerInfos` | `{ [key: string]: LayerInfo }` | Runtime layer metadata |

## Layer renderers (`mapComponents/BaseMap/`)

Each layer type has its own renderer component. All are called from `BaseMap/index.tsx`
which reads committed layers from Redux, reverses them (last = topmost), and filters
by `layer.type` (falsy = not rendered).

### Shared hooks

| Hook | Purpose |
|---|---|
| `useMakeLayerBusy(layerKey, layerType, shouldRender)` | Adds a busy key while layer is rendering, removes on unmount or when `shouldRender` becomes false |
| `useLayerChangeCallback(layerKey, onLayerChange)` | Stable callback binding a layer key to `onLayerChange` |

### Busy key lifecycle

All four layer renderers use the same pattern:
1. `useMakeLayerBusy` adds busy key when visibility + source are available
2. `handleCreate` (wrapping `useLayerChangeCallback`) calls `onLayerCreated` after native layer init, removing the busy key
3. `onChange` (from the library, fired on source/prop changes) calls `useLayerChangeCallback` directly — no busy-key interaction needed
4. `useMakeLayerBusy` cleanup removes the key on unmount as safety net

Busy keys follow the pattern `map:base-layer:<layerType>:<layerKey>`.

### Renderer behaviors

| Renderer | Source check | Lifecycle |
|---|---|---|
| `LayerRendererMapsforge` | `!!opts.mapFile` | `useLayerChangeCallback` + `handleCreate` |
| `LayerRendererRasterMBtiles` | `!!opts.mapFile` | `useLayerChangeCallback` + `handleCreate` |
| `LayerRendererHillshading` | `!!(opts.hgtDirPath ?? appHgtDirPath)` | `useLayerChangeCallback` + `handleCreate` |
| `LayerRendererOnlineRasterXYZ` | `!!opts.url` | `useLayerChangeCallback` + `handleCreate` |

When source is missing or layer is not visible, the renderer returns `null` early
(no native layer is created).

## Persistence (`connectStorage.ts`)

- Key: `'baseMapSettings'` in `react-native-default-preference`
- Persisted: `layers`, `mapsforgeProfiles`, `hgtDirPath`, `mapsforgeGeneral`, `renderStylesCache`
- Gated by `initialized` (no save before restore completes)
- Edits to `layersTemp` / `profilesTemp` (temp copy) are NOT persisted — only when committed via `setLayers({ temp: false })`
- Listener middleware watches `setLayers`, `setMapsforgeProfiles`, `setHgtDirPath`, `setMapsforgeGeneralAction`, `setRenderStylesCache`

## Utils (`utils.ts`)

| Function | Purpose |
|---|---|
| `getNewLayer()` | Returns a new `LayerConfig` with UUID key, no type, visible=true |
| `getNewProfile()` | Returns a new `MapsforgeProfile` with UUID key, theme='DEFAULT' |
| `getLayerKind(layer)` | Returns `'base'` or `'overlay'` by looking up `layer.type` in `mapTypeOptions` |
| `fillLayerConfigOptionsWithDefaults(type, options)` | Deep-merges defaults for given layer type into options |
| `getLayerLabel(layer, props?)` | Returns `{ key, params }` for i18next — an i18n key for hillshading layers, or a raw string for other types. Returns `undefined` when no source is configured. |
| `hasLayerSource(layer, appHgtDirPath?)` | Returns `true` when the layer has a configured source (delegates to `getLayerLabel`). Used for warning icons and guard checks. |
| `labelFromDemPath(path)` | Converts a DEM directory path to a short label (`"media"`, `"sdcard data"`, etc.). Not i18n'd — these are path segments. |
| `makeLayerBusyKey(layerType, layerKey)` | Returns `"map:base-layer:<layerType>:<layerKey>"` |
| `resolveCacheDirBase(cacheDirBase, internalCacheDir)` | Resolves `'internal'` → app's internal cache dir, otherwise passes through |
| `getHillshadingCacheDirChild(options)` | Derives cache subdirectory name from shading options |
| `getShadingAlgorithmOptions(options)` | Builds `ShadingAlgorithmOptions` from user-configurable values |
| `stringifyProp(prop, deli?)` | Converts any value to deterministic filesystem-safe string (used for cache dir names) |

### `getLayerLabel` contract

`getLayerLabel` returns `{ key, params? }` or `undefined`. For most layer types, `key` is a raw string — `t()` passes it through as-is. For hillshading, `key` is an i18n key (`baseMap.demLabel.shading` / `baseMap.demLabel.shadingGlobal`) with a `label` interpolation param. Source-existence checks should use `hasLayerSource` — do not use `getLayerLabel` for boolean checks. The translation keys `baseMap.demLabel.shading` and `baseMap.demLabel.shadingGlobal` use `{{label}}` interpolation so translations can reorder words.

## Controls (`components/controls/`)

### `layers/`

| Control | Purpose |
|---|---|
| `LayersControl.tsx` | Sortable drag-and-drop layer list. Each row: visibility toggle, name (with derived fallback), type badge, edit button. Two modes: `saveOnChange` (drawer, saves immediately) and `saveOnUnmount` (settings page, saves on cleanup). Exports `mapTypeOptions[]` and `itemHeight`. |
| `LayerControlOnlineRasterXYZ.tsx` | XYZ tile layer config: 15 presets + custom URL (validated to contain `{X}`, `{Y}`, `{Z}`), zoom ranges, alpha, cache. |
| `LayerControlMapsforge.tsx` | Mapsforge vector layer config: `.map` file picker, profile dropdown, enabled zoom. |
| `LayerControlRasterMBTiles.tsx` | MBTiles raster layer config: `.mbtiles` file picker, enabled zoom. |
| `LayerControlHillshading.tsx` | Hillshading config: DEM source picker (per-layer or fallback to global), zoom ranges, magnitude, slopes, asymmetry, cache. |
| `CacheControl.tsx` | Shared cache UI: size control, directory selector, resolved path, clear button. |
| `VisibilityControl.tsx` | Eye/eye-off toggle button and `VisibilityRowControl` wrapper. |

### `profiles/`

| Control | Purpose |
|---|---|
| `ProfilesControl.tsx` | Sortable drag-and-drop profile list. Each row: name (with theme-derived fallback), layer count badge, theme label, edit button. Two modes like layers. |
| `ThemeControl.tsx` | `.xml` render theme file picker + reset cache button. Lists built-in themes. |
| `RenderStyleControl.tsx` | Dropdown for render style variants within chosen theme. |
| `RenderOverlaysControl.tsx` | Multi-select modal for render overlays (roads, paths, buildings, etc.). |
| `HasBuildingsControl.tsx` | Toggle for 3D buildings. |
| `HasLabelsControl.tsx` | Toggle for labels. |
| `LayerCount.tsx` | Read-only count of layers referencing this profile. |

### Other controls

| Control | Purpose |
|---|---|
| `LabelRowControl.tsx` | Debounced (300ms) text input for renaming layers/profiles. Uses refs so debounce always writes the latest value. |
| `MapsforgeGeneralControl.tsx` | Modal with line/text/symbol scale sliders. Uses local state snapshots — commits to Redux only on dismiss to avoid map re-creation on keystrokes. |
| `CacheManager.tsx` | Accordion listing all cache directories with sizes, layer associations, and delete buttons. |

## Gotchas

- **`selectLayerTemp` cast to `LayerConfig`** — the selector fills defaults and returns the result as `LayerConfig` via `as LayerConfig` because `fillLayerConfigOptionsWithDefaults` returns a generic options type that the compiler can't prove is the full `LayerConfig`. This is safe — all required fields are present.

- **Layer ordering is reversed** — the last layer in the array renders on top. `BaseMap` reverses the list before mapping. Insertion position differs for base vs. overlay layers.

- **`saveOnChange` vs `saveOnUnmount`** — drawer panels use the former (immediate commits to Redux), settings page uses the latter (commits in cleanup effect). The `temp: true` flag on slice actions creates temp copies that aren't persisted until committed.

- **Hillshading labels use i18n interpolation** — `getLayerLabel` returns `{ key: 'baseMap.demLabel.shading', params: { label: 'media' } }` for hillshading layers (or `'...shadingGlobal'` when using the global DEM). Callers must pass the result through `t(key, params)`. Source-existence checks use `hasLayerSource()` — never `getLayerLabel().

- **`MapsforgeGeneralControl` uses local snapshots** — never dispatches to Redux on keystroke because Redux state changes trigger map re-initialization. The modal captures a snapshot on open and commits only on dismiss (and only if changed).

- **Cache directory resolution** — `'internal'` resolves to the app's internal cache dir via `selectAppDirs.internalCacheDir`. Any other value is used as-is. `/` falls back to the platform cache dir. This logic is in `resolveCacheDirBase()`.
