# Chart feature

Elevation/slope profile charts rendered with `react-native-svg` +
`react-native-gesture-handler` (no charting library). A chart visualizes
one route — either the active routing route or a stored line — in two
hosts:

- **Bottom drawer items** — one `chart:` entry per source (routing + one
  per line with a chart enabled).
- **Fullscreen UiItem** (`chartFullscreen`) — dedicated to a single line,
  opened from `LineEditModal`.

All data math lives in pure functions in `utils.ts`; the components only
compose, transform and render. The feature has no database access of its
own — coordinates come from the routing slice or the lines query layer,
and statistics always come from SpatiaLite (never recomputed in the chart).

## Chart sources and keys

```ts
CHART_KEY_PREFIX = 'chart:'

getChartSourceKey.routing()          → 'chart:routing'
getChartSourceKey.line(lineId)       → 'chart:line:<id>'
getChartSourceKey.fullscreen(lineId) → 'chart:fullscreen:<id>'
```

`getChartSourceFromKey` parses a key back into a `ChartSource`
(`{ type: 'routing' }` or `{ type: 'line', lineId }` — the fullscreen key
also resolves to `type: 'line'`).

## Bottom drawer integration

### Derived item keys (not persisted)

`bottomDrawer/selectors.ts` (`selectItemKeys`) derives the chart keys from
the owning features' state:

- `chart:routing` — while routing is active.
- `chart:line:<id>` — for each line in `lines.chartLines` that is also in
  `lines.selected` and isn't the routing line.

All keys (static + derived) are filtered against the registered item
resolvers, so stale persisted keys never produce broken drawer entries.

### Dynamic item resolver

`resolver.ts` registers a `bottomDrawer` dynamic item resolver at module
scope (`registerChartItemResolver()`, called from `index.ts` before the
first render). Every key starting with `chart:` resolves to
`{ iconSource: 'chart-areaspline-variant', DisplayComponent: ChartDisplay }`.

`ChartDisplay` reads `activeItemKey` and `settingsModalVisible` from
`BottomDrawerContext` and renders `ChartContent` with `variant="drawer"`.

### Labels

`useChartItemLabels` provides the drawer menu labels: the i18n key
`chart.routingTitle` for the routing source, and the real line titles
(`line.title` falling back to `custom_date`/`created_at` formatted with
the user's date-time format) from a batched `['lines', chartLines]` query.

### Auto-activation on routing

`routing/connectStorage.ts` listens for `setIsRoutingAction` and, when
routing becomes active, dispatches `setActiveKey('chart:routing')` — the
routing chart becomes the drawer's active content (the drawer itself
stays closed).

## Fullscreen UiItem

- Key: `CHART_FULLSCREEN_UI_ITEM_KEY = 'chartFullscreen'`, registered in
  `uiItems` with label `chart.fullscreen` and icon
  `chart-areaspline-variant`.
- `openFullscreenChart(lineId)` sets `fullscreenLineId` and pushes the
  key onto the UiItem stack; `closeFullscreenChart()` removes it and
  clears the line.
- Settings live under `chart:fullscreen:<id>` — **independent** from the
  same line's drawer chart (`chart:line:<id>`).
- Entry point: `RowChartFullscreen` in `lines/components/LineEditModal/`.
- Heading and statistics are always shown in the fullscreen variant (see
  `ChartContent.displaySettings`); the modal hides the route-selection,
  heading/stats and remove rows.

## Redux state (`slice.ts`)

```ts
ChartState extends SliceSettingsBase {
  initialized: boolean;                   // from SliceSettingsBase
  charts: Record<string, ChartSettings>; // per-chart-key settings
  general: ChartSettings;                // fallback for charts without their own
  fullscreenLineId?: number;             // line the fullscreen UiItem is dedicated to
}
```

Entries in `charts` carry **only explicitly written values** — there is
deliberately no `DEFAULT_CHART_SETTINGS` base on write, otherwise every
chart that ever received a per-chart value (ratio, follow-map) would count
as "custom" in `selectHasOwnChartSettings`.

### Actions

| Action                              | What it does                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `setChartSettings({key, settings})` | Shallow-merge `settings` into `charts[key]` (no defaults base, see above)                      |
| `removeChartSettings(keys)`         | Delete the given chart keys' settings entries                                                  |
| `resetChartSettingsToPerChart(key)` | Keep only `ratioValue`/`followMap` of the chart's own entry; delete the entry when none remain |
| `setGeneralSettings(partial)`       | Merge into `general` (defaults base)                                                           |
| `setFullscreenLineId(lineId?)`      | Set/clear the fullscreen chart's dedicated line                                                |

### Thunks

| Thunk                         | What it does                                                    |
| ----------------------------- | --------------------------------------------------------------- |
| `openFullscreenChart(lineId)` | Set `fullscreenLineId` + push the fullscreen UiItem key         |
| `closeFullscreenChart()`      | Remove the UiItem key from the stack + clear `fullscreenLineId` |

## Settings model (`types.ts`)

```ts
ChartSettings {
  primary: 'none' | 'elevation' | 'slope';
  primaryColor: 'axis' | 'elevation' | 'elevationFill' | 'slope' | 'slopeFill';
  secondary: ChartSeriesValue;
  secondaryColor: ChartColorMode;
  xMode: 'distance' | 'time';
  ratioValue?: number;   // fixed aspect ratio: visible x-range per visible y-range unit
  followMap: boolean;    // viewport follows the map's covered route segment (1:1)
  showHeading: boolean;
  showStats: boolean;
}
```

### General vs per-chart split (`selectors.ts`)

| Constant                     | Keys                       | Meaning                                                        |
| ---------------------------- | -------------------------- | -------------------------------------------------------------- |
| `PER_CHART_SETTINGS_KEYS`    | `ratioValue`, `followMap`  | Always per-chart — the general settings never contribute these |
| `GENERAL_ONLY_SETTINGS_KEYS` | `showHeading`, `showStats` | Always general — a chart's own entry never contributes these   |

Every other key participates in the Default/Custom mode (general vs own).

### Selectors

| Selector                                | Returns                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `selectChartSettings(state, key)`       | Effective settings: `DEFAULT_CHART_SETTINGS` ← `general` (minus per-chart keys) ← own (minus general-only keys) |
| `selectGeneralSettings`                 | `DEFAULT_CHART_SETTINGS` merged with `general`                                                                  |
| `selectHasOwnChartSettings(state, key)` | `true` when the own entry has keys outside the two exclusion sets → drives Default/Custom mode                  |
| `selectOwnPerChartSettings(state, key)` | `pick` of `ratioValue`/`followMap` from the own entry                                                           |
| `selectFullscreenLineId`                | The fullscreen chart's dedicated line                                                                           |
| `selectInitialized`                     | Storage-restore completion flag                                                                                 |

### Default/Custom mode switching (`ChartSettingsModal`)

- **→ Custom (own)**: copies the current general settings (minus both
  exclusion sets) plus the existing per-chart settings into the chart's
  own entry.
- **→ Default (general)**: `resetChartSettingsToPerChart` — discards the
  own entry, keeping only `ratioValue`/`followMap`.
- The mode follows `hasOwn` on `chartKey` change; `update()` dispatches
  `setChartSettings` (own mode) or `setGeneralSettings` (general mode).

## Persistence (`connectStorage.ts`)

- Storage key `'chartSettings'` in `DefaultPreference`.
- `initializeFromStorage`: parses `{ charts, general }`, dispatches
  `setChartSettings` per chart and `setGeneralSettings`, and **always**
  completes with `setInitialized(true)` — a failed read or corrupt JSON
  degrades to defaults instead of hanging app startup.
- `saveToStorage`: persists **only** `charts` and `general`.
  `initialized` and `fullscreenLineId` are ephemeral and must never
  accumulate in storage.
- Save listener matcher: `setChartSettings`, `removeChartSettings`,
  `setGeneralSettings`.

## Listeners (`listeners.ts`)

`resetRatioIfLoneChart`: when a chart key newly becomes the **only**
`chart:*` key in the drawer and it has a stored ratio and doesn't follow
the map, its `ratioValue` is cleared — a freshly added chart opens at the
natural fit. The ratio stays relevant (and is kept) while following the
map, for when follow-map is switched off.

Triggers:

- `toggleChartLine` (a line's chart was just enabled — removals skipped).
- `routingSlice.actions.setIsRouting` with a truthy payload (routing mode
  entered).

## Component tree

```
ChartDisplay (drawer host, BottomDrawerContext)
  └─ ChartContent            — shared logic for both variants
       ├─ Chart              — pure SVG renderer
       ├─ ChartSettingsModal — rows for settings + mode + ratio
       ├─ BottomDrawerMenu   — title menu (drawer only)
       └─ Fly-to-route button (follow out-of-view)
ChartFullscreen (UiItem)
  └─ ChartContent (variant="fullscreen")
```

### ChartContent

Data, follow-map polling, ratio plumbing, header/stats UI:

- **Coordinates**: `selectPathCoords` (routing source) or the
  `['linePathCoords', lineId]` query (line source); line meta
  (title/envelope) from `['lines', [lineId]]`.
- **Series**: `getChartSeries(coordinates)` — memoized.
- **Stats**: `line?.stats` or `route.stats` via `useRoute` — always the
  SpatiaLite-computed values, rendered through the shared `LineStats`
  component.
- **Center indicator**: a `setInterval` at `mapUpdateInterval` reads
  `currentMapEventRef` (MapContext). Follow-map additionally derives the
  covered route range via `computeViewportBbox` + `getCoveredRange`;
  range updates are value-compared so an idle follow-map doesn't
  re-render the tree on every map event. The fullscreen variant only
  projects the center while it lies inside the line's envelope.
- **Nearest route point**: `windowedNearestIdx` with a per-route
  last-best index; a covering window is used when the target jumps far
  (>1000 m) or on first lookup.
- **Waypoint markers**: nearest along-route distances of the routing
  points.
- **Reset signal** (`resetSignal`): bumped by the Fit-screen button, on
  chart switches, and for the routing chart on route changes while it
  sits at the natural fit (no stored ratio, not following).
- **Ratio reporting**: the chart reports every viewport change into a
  ref (no per-frame re-renders); the settings modal snapshots it when
  opened. Axis gestures write a settled ratio back via
  `handleRatioUpdate` (always to the chart's own entry — the ratio is
  always per-chart).

### Chart (renderer)

`react-native-svg` with memoized subcomponents so map-center updates only
touch the indicator/labels, never the static plot:

| Subcomponent      | Content                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `PlotStatic`      | Area fills, series strokes, axes, ticks (memoized)                 |
| `WaypointMarkers` | Orange dashed vertical lines + numbers, in screen space (memoized) |
| `CenterIndicator` | Blue map-center lines/dots with background halos (memoized)        |
| `CenterLabels`    | Blue center values at the axes (memoized)                          |

- **Color runs**: `buildColorRuns` batches consecutive same-color
  segments into single polyline paths; `simplifyColorRuns` culls runs
  outside the visible x-window and merges sub-pixel runs (min 2 px,
  max 800 runs) so the SVG node count stays bounded at any zoom level.
  Runs at least one pixel wide keep their exact per-segment color.
- **Viewport state**: `scaleX`/`scaleY`/`translateX`/`translateY` as JS
  state; all gesture math runs from gesture-start snapshots (refs), so
  scale is never compounded across events and pan never fights the
  pinch.
- **Gestures**: one-finger pan, two-finger pinch (uniform, or x-axis-only
  when the pinch starts in the x-axis band — per-axis finger separation),
  double-tap zoom ×2. A user gesture synchronously flips follow-map off
  (`onUserGesture` → `setChartSettings({ followMap: false })`).
- **Ratio**: applied by scaling X (the y-scale stays where the user left
  it); deferred while the settings modal is open; a layout resize only
  clamps the current viewport — it never re-applies the stored ratio.
- **Follow-map**: x-window = the map-covered route range (1:1), y-scale
  kept, vertical scroll keeps the center indicator in view; the first
  user gesture stops the overwrites immediately (no jump). With the map
  panned away from the route, an empty plot + Fly-to-route button is
  rendered (`followOutOfView`).
- **Ticks**: `getNiceTicks` (1/2/5 × 10^n steps); left margin 44 / right
  margin 40 when the respective series is visible, 8 otherwise.

### ChartSettingsModal

Context (`ChartSettingsModalContext`): `chartKey`, `settings`, `update`,
`updateGeneral`, `onDismiss`, `mode`, `setMode`, `currentRatio`,
`fitRatio`, `onFitScreen`. The modal is memoized — follow-map updates
re-render the chart display tree on every map event, and stable props
keep the modal (and its popover menus) quiet.

| Row                 | Drawer | Fullscreen | Purpose                                                       |
| ------------------- | :----: | :--------: | ------------------------------------------------------------- |
| `RowSelectRoute`    |   ✓    |            | Switch the active drawer chart between chart sources          |
| `RowFollowMap`      |   ✓    |     ✓      | Toggle follow-map                                             |
| `RowRatioLock`      |   ✓    |     ✓      | Fixed aspect ratio + Fit-screen button                        |
| `RowShowHeading`    |   ✓    |            | Toggle heading (always on in fullscreen)                      |
| `RowShowStats`      |   ✓    |            | Toggle statistics (always on in fullscreen)                   |
| `RowRemoveChart`    |   ✓    |            | Remove the line's chart (`toggleChartLine`) with confirmation |
| `RowChartMode`      |   ✓    |     ✓      | Default/Custom mode switch                                    |
| `RowPrimaryData`    |   ✓    |     ✓      | Primary series (none/elevation/slope)                         |
| `RowPrimaryColor`   |   ✓    |     ✓      | Primary color mode (axis/ramp/fill)                           |
| `RowSecondaryData`  |   ✓    |     ✓      | Secondary series                                              |
| `RowSecondaryColor` |   ✓    |     ✓      | Secondary color mode                                          |

`RowXMode` (distance/time x-axis) exists but is currently commented out
of the modal.

## Hooks

| Hook                    | Purpose                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `useChartItemLabels`    | Labels for the derived chart drawer menu entries (routing i18n label + batched line titles)                |
| `useRemoveChartCbModal` | Confirmation modal for removing a chart; neutral styling — nothing is deleted, the chart can be re-enabled |

## Data sources

| Source  | Coordinates                                      | Stats                                               |
| ------- | ------------------------------------------------ | --------------------------------------------------- |
| Routing | `selectPathCoords` (routing slice, flat arrays)  | `route.stats` via `useRoute` (SpatiaLite)           |
| Line    | `['linePathCoords', lineId]` (lines query layer) | `line.stats` (SpatiaLite), rendered via `LineStats` |

The chart never reads or writes the database directly, and never
recomputes statistics — they must stay consistent with the values every
other `LineStats` usage shows.

## Cross-feature coupling

- **lines**: `lines.chartLines` drives the per-line drawer entries
  (`toggleChartLine`); `RowChart` / `RowChartFullscreen` in
  `LineEditModal`; `useDeleteLinesCbModal` dispatches
  `removeChartSettings` for both `chart:line:<id>` and
  `chart:fullscreen:<id>` keys so settings don't survive the line. The
  lines slice also prunes `chartLines` against `selected` (charts of
  lines no longer on the map disappear).
- **routing**: `routing/connectStorage.ts` auto-activates the
  `chart:routing` drawer key when routing starts; `listeners.ts` resets
  the lone-chart ratio on `setIsRouting(true)`.
- **bottomDrawer**: derived item keys (never persisted) + the dynamic
  item resolver.
- **ui**: the fullscreen UiItem key is pushed/removed via
  `addUiItemKey`/`setUiItemKeys`.
- **i18n**: keys live under the `chart.*` namespace (e.g.
  `chart.routingTitle`, `chart.flyTo`, `chart.settingsTitle`,
  `chart.removeChart`); the feature registers its translations via
  `AppFeature.translation`.

## Tests

- `__tests__/slice.test.ts` — reducer/action/thunk behavior.
- `__tests__/utils.test.ts` — pure math: series derivation, ticks,
  color runs/simplification, nearest-point search.

Run with `yarn test chart` or the full `yarn test`.

## Gotchas

- **No defaults base in `setChartSettings`**: entries in `charts` must
  only carry explicitly written values, or `selectHasOwnChartSettings`
  (Default/Custom mode) breaks.
- **Persist only `charts` + `general`**: `initialized` and
  `fullscreenLineId` are ephemeral and must never be written to
  `DefaultPreference`.
- **Storage init must always complete**: a corrupt `chartSettings`
  entry degrades to defaults instead of blocking app startup.
- **Follow-map flip-off is ref-driven**: `followActiveRef`/
  `followMapRef` are flipped synchronously on the first user gesture —
  don't sync them from settings on every render, or the gesture's
  pre-dispatch renders would undo the flip and restart the gesture.
- **Drawer and fullscreen charts are independent**: the same line has
  separate settings under `chart:line:<id>` and `chart:fullscreen:<id>`.
- **Stats come from SpatiaLite**: don't compute stats in the chart —
  the stats row must match the rest of the app (`LineStats`).
- **Deleting lines must clean chart state**: remove the `chart:line:*`
  and `chart:fullscreen:*` settings entries (and let the lines slice
  prune `chartLines`) — see `useDeleteLinesCbModal`.
- **Drawer keys are derived and filtered**: keys come from
  `bottomDrawer/selectors.ts` and are filtered against the item
  resolvers — stale persisted keys produce no entries.
- **`RowXMode` is not currently rendered** in the settings modal
  (commented out) — `xMode` is part of `ChartSettings` but only
  `'distance'` is effectively used.
