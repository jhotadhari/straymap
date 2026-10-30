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

getChartSourceKey.line(lineId)       → 'chart:line:<id>'
getChartSourceKey.fullscreen(lineId) → 'chart:fullscreen:<id>'
```

`getChartSourceFromKey` parses a key back into a `ChartSource`
(`{ type: 'line', lineId }` — the fullscreen key also resolves to
`type: 'line'`). There is no routing-specific key anymore: the routing
chart is the routing *line*'s chart (`chart:line:<routingLineId>`).

## Bottom drawer integration

### Derived item keys (not persisted)

`bottomDrawer/selectors.ts` (`selectItemKeys`) derives the chart keys from
the owning features' state (deduped so a line contributes one chart at
most):

- `chart:line:<routingLineId>` — while routing is active and the line exists.
- `chart:line:<activeLineId>` — while recording and the line exists.
- `chart:line:<followingLineId>` — while a line is followed.
- `chart:line:<id>` — for each line in `lines.chartLines` that is also on
  the map and not already covered by one of the feature lines above.

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

`useChartItemLabels` provides the drawer menu labels: the real line titles
(`line.title` falling back to `custom_date`/`created_at` formatted with
the user's date-time format) from a batched `['lines', lineIds]` query,
with an aggregated suffix for any modes the line carries
(`chart.modeRouting` / `chart.modeFollowing` / `chart.modeRecording`).

### Auto-activation

- Routing: `routing/connectStorage.ts` listens for `setRoutingLineId` and,
  when a routing line comes into existence, dispatches
  `setActiveKey('chart:line:<id>')` — gated on no line being followed.
- Recording: `trackRecording/connectStorage.ts` listens for `setActiveLineId`
  and selects the tracking line's chart — gated on no line being followed.
- Following: `lineFollow/connectStorage.ts` listens for `setFollowingLineId`
  and **always** selects the followed line's chart (following has priority).

In all cases the drawer itself stays closed; only the active content is set.

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
chart that ever received a per-chart value (ratio, follow mode) would
count as "custom" in `selectHasOwnChartSettings`.

### Actions

| Action                              | What it does                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `setChartSettings({key, settings})` | Shallow-merge `settings` into `charts[key]` (no defaults base, see above)                       |
| `removeChartSettings(keys)`         | Delete the given chart keys' settings entries                                                   |
| `resetChartSettingsToPerChart(key)` | Keep only `ratioValue`/`followMode` of the chart's own entry; delete the entry when none remain |
| `setGeneralSettings(partial)`       | Merge into `general` (defaults base)                                                            |
| `setFullscreenLineId(lineId?)`      | Set/clear the fullscreen chart's dedicated line                                                 |

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
  ratioValue?: number;              // fixed aspect ratio: visible x-range per visible y-range unit
  followMode: 'none' | 'map' | 'center'; // Off / follow covered segment (1:1) / follow map center
  animateFollow: boolean;           // ease the follow viewport instead of jumping (per-chart, picked via the follow control)
  showHeading: boolean;
  showStats: boolean;
}
```

### General vs per-chart split (`selectors.ts`)

| Constant                     | Keys                                        | Meaning                                                        |
| ---------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| `PER_CHART_SETTINGS_KEYS`    | `ratioValue`, `followMode`, `animateFollow` | Always per-chart — the general settings never contribute these |
| `GENERAL_ONLY_SETTINGS_KEYS` | `showHeading`, `showStats`                  | Always general — a chart's own entry never contributes these   |

Every other key participates in the Default/Custom mode (general vs own).

### Selectors

| Selector                                | Returns                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `selectChartSettings(state, key)`       | Effective settings: `DEFAULT_CHART_SETTINGS` ← `general` (minus per-chart keys) ← own (minus general-only keys) |
| `selectGeneralSettings`                 | `DEFAULT_CHART_SETTINGS` merged with `general`                                                                  |
| `selectHasOwnChartSettings(state, key)` | `true` when the own entry has keys outside the two exclusion sets → drives Default/Custom mode                  |
| `selectOwnPerChartSettings(state, key)` | `pick` of `ratioValue`/`followMode`/`animateFollow` from the own entry                                              |
| `selectFullscreenLineId`                | The fullscreen chart's dedicated line                                                                           |
| `selectInitialized`                     | Storage-restore completion flag                                                                                 |

### Default/Custom mode switching (`ChartSettingsModal`)

- **→ Custom (own)**: copies the current general settings (minus both
  exclusion sets) plus the existing per-chart settings into the chart's
  own entry.
- **→ Default (general)**: `resetChartSettingsToPerChart` — discards the
  own entry, keeping only `ratioValue`/`followMode`/`animateFollow`.
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
`chart:*` key in the drawer, its mode is Off and it has a stored ratio,
its `ratioValue` is cleared — a freshly added chart opens at the natural
fit. In the follow modes (`map`/`center`) the mode governs the viewport,
so the ratio stays relevant and is kept.

Triggers:

- `toggleChartLine` (a line's chart was just enabled — removals skipped).
- `setRoutingLineId` (the routing line's chart appeared).
- `setActiveLineId` (the tracking line's chart appeared).
- `setFollowingLineId` (the followed line's chart appeared).

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

- **Coordinates**: the `['linePathCoords', lineId]` query (all chart
  sources are lines now); line meta (title/envelope) from
  `['lines', [lineId]]`.
- **Series**: `getChartSeries(coordinates)` — memoized.
- **Stats**: `line?.stats` — always the SpatiaLite-computed values,
  rendered through the shared `LineStats` component.
- **Routing line**: detected via `lineId === selectRoutingLineId` — drives
  the waypoint markers (`useRoute(['points'])`) and the route re-fit.
- **Center indicator**: a `setInterval` reads `currentMapEventRef`
  (MapContext) — at `mapUpdateInterval`, but at half that cadence while
  a follow mode is active with the follow animation on (the eased lag
  glides the indicator between updates). In Follow-map mode it
  additionally derives the covered route range via `computeViewportBbox`
    - `getCoveredRange`; range updates are value-compared so an idle
      follow-map doesn't re-render the tree on every map event. The
      fullscreen variant only projects the center while it lies inside the
      line's envelope.
- **Nearest route point**: `windowedNearestIdx` with a per-route
  last-best index; a covering window is used when the target jumps far
  (>1000 m) or on first lookup.
- **Waypoint markers**: nearest along-route distances of the routing
  points.
- **Reset signal** (`resetSignal`): bumped by the Fit-screen button, on
  chart switches, and for the routing chart on route changes while it
  sits at the natural fit (no stored ratio, follow mode Off).
- **Ratio reporting**: the chart reports every viewport change into a
  ref (no per-frame re-renders); the settings modal snapshots it when
  opened. Axis gestures write a settled ratio back via
  `handleRatioUpdate` (always to the chart's own entry — the ratio is
  always per-chart).

### Chart (renderer)

`react-native-svg` with memoized subcomponents so map-center updates only
touch the indicator/labels, never the static plot:

| Subcomponent      | Content                                                                        |
| ----------------- | ------------------------------------------------------------------------------ |
| `PlotContent`     | Area fills + series strokes, inside the scaled `<G>` (memoized)                |
| `PlotAxes`        | Axis lines + tick marks/labels, static layer, in screen space (memoized)       |
| `WaypointMarkers` | Orange dashed vertical lines + numbers, in the plot layer (memoized)           |
| `CenterIndicator` | Blue map-center lines/dots with background halos, in the plot layer (memoized) |
| `CenterLabels`    | Blue center values at the axes, in the plot layer (memoized)                   |

- **Color runs**: `buildColorRuns` batches consecutive same-color
  segments into single polyline paths; `simplifyColorRuns` culls runs
  outside the visible x-window and merges sub-pixel runs (min 2 px,
  max 800 runs) so the SVG node count stays bounded at any zoom level.
  Runs at least one pixel wide keep their exact per-segment color.
- **Viewport state**: `scaleX`/`scaleY`/`translateX`/`translateY` as JS
  state (the logical viewport — drives ticks, run simplification and
  gesture math); the translation is mirrored to reanimated shared
  values via `writeViewport` for the plot layer's native transform.
  All gesture math runs from gesture-start snapshots (refs), so scale
  is never compounded across events and pan never fights the pinch.
- **Gestures**: one-finger pan, two-finger pinch (uniform, or x-axis-only
  when the pinch starts in the x-axis band — per-axis finger separation),
  double-tap zoom ×2. A gesture on a follow mode switches the option to
  Off and continues from the current viewport — the stored ratio is
  never re-applied on this reset. In Follow-map mode every gesture
  resets the mode; in Follow-center mode only a pan resets it — zoom
  gestures are compatible with centering and never write the
  x-translation (the centering effect owns it).
- **Ratio**: applied by scaling X (the y-scale stays where the user left
  it); deferred while the settings modal is open; a layout resize only
  clamps the current viewport — it never re-applies the stored ratio.
  The ratio field is disabled while the mode is `map` (the coverage
  overrides it).
- **Follow-map** (`followMode: 'map'`): x-window = the map-covered route
  range (1:1), y-scale kept, vertical scroll keeps the center indicator
  in view; the first user gesture stops the overwrites immediately (no
  jump). With the map panned away from the route, an empty plot +
  Fly-to-route button is rendered (`followOutOfView`).
- **Follow-center** (`followMode: 'center'`): the map center stays in
  the chart's horizontal middle — only the x-translation is derived
  (`plotW/2 − scaleX·x`, clamped to the plot edges at the route ends);
  scale and y-viewport are left alone. Re-runs on scaleX changes, so
  x-zooms re-center the chart without resetting the mode.
- **UI-thread eased translation**: the chart renders as two stacked
  Svgs — the plot layer (translated+scaled `PlotContent` + waypoint/center
  overlays, all positioned with the logical viewport) sits in an
  `Animated.View`; the static layer renders `PlotAxes`. The plot content
  is positioned exactly inside its Svg; the layer carries only a small
  **bounded lag** (`±LAG_MAX_X_PX`/`±LAG_MAX_Y_PX`, 64/48px) that follow
  writes rebase to `−clamp(Δ, ±PAD)` and ease back to zero via
  `withTiming` (200ms, `Easing.out(cubic)`) on the UI thread — no JS
  re-render and no SVG re-rasterization per eased frame, so heavy
  fill-mode charts don't lag the map. Because RNSVG rasterizes each Svg
  into a bitmap of its view size (content outside is clipped), the plot
  layer's `Animated.View` and Svg are padded by the max lag on all sides
  and all plot-layer coordinates shift by the pad — but **only while
  `animateFollow` is on**: with the animation off the lag is always zero
  and the layer keeps the exact W×H size (pre-animation rasterization
  cost). All viewport writes go through `writeViewport`: follow effects
  pass `animateTxTy: true`, gestures and one-shot writes (ratio apply,
  fit reset, layout resize) clear the lag instantly, overriding any
  in-flight glide. Accepted tradeoffs: axes/ticks snap per map event
  while the plot glides (~200ms transient offset); deltas larger than
  the lag bound snap the excess.
- **Ticks (quantized axes layer)**: `getNiceTicks` (1/2/5 × 10^n steps)
  runs off a quantized viewport (4px translate grid, 1/64 scale grid)
  and `PlotAxes` gets quantized `toScreenX/toScreenY`, so the axes Svg
  re-rasterizes at most per grid step instead of every map event. Left
  margin 44 / right margin 40 when the respective series is visible,
  8 otherwise.

### ChartSettingsModal

Context (`ChartSettingsModalContext`): `chartKey`, `settings`, `update`,
`updateGeneral`, `onDismiss`, `mode`, `setMode`, `currentRatio`,
`fitRatio`, `onFitScreen`. The modal is memoized — follow-map updates
re-render the chart display tree on every map event, and stable props
keep the modal (and its popover menus) quiet.

| Row                 | Drawer | Fullscreen | Purpose                                                             |
| ------------------- | :----: | :--------: | ------------------------------------------------------------------- |
| `RowSelectRoute`    |   ✓    |            | "Drawer content" picker (chart sources, labels prefixed "Chart ")   |
| `RowShowHeading`    |   ✓    |            | Toggle heading (always on in fullscreen)                            |
| `RowShowStats`      |   ✓    |            | Toggle statistics (always on in fullscreen)                         |
| `RowRemoveChart`    |   ✓    |            | Remove the line's chart (`toggleChartLine`) with confirmation       |
| `RowFollowMode`     |   ✓    |     ✓      | Follow mode picker: Off + follow map/center, each animated/not      |
| `RowRatioLock`      |   ✓    |     ✓      | Fixed aspect ratio + Fit-screen button                              |
| `RowChartMode`      |   ✓    |     ✓      | Default/Custom mode switch                                          |
| `RowPrimaryData`    |   ✓    |     ✓      | Primary series (none/elevation/slope)                               |
| `RowPrimaryColor`   |   ✓    |     ✓      | Primary color mode (axis/ramp/fill)                                 |
| `RowSecondaryData`  |   ✓    |     ✓      | Secondary series                                                    |
| `RowSecondaryColor` |   ✓    |     ✓      | Secondary color mode                                                |

Drawer-variant header is "Drawer settings"; fullscreen keeps "Chart
settings". The follow/ratio rows are separated from the chart-data rows
by a divider plus a "Chart data" heading.

`RowXMode` (distance/time x-axis) exists but is currently commented out
of the modal.

## Hooks

| Hook                    | Purpose                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `useChartItemLabels`    | Labels for the derived chart drawer menu entries (batched line titles + aggregated mode suffix) |
| `useRemoveChartCbModal` | Confirmation modal for removing a chart; neutral styling — nothing is deleted, the chart can be re-enabled |

## Data sources

| Source | Coordinates                                      | Stats                                              |
| ------ | ------------------------------------------------ | -------------------------------------------------- |
| Line   | `['linePathCoords', lineId]` (lines query layer) | `line.stats` (SpatiaLite), rendered via `LineStats` |

The routing line is just a line source whose `lineId` equals the active
routing line (waypoint markers are added for it in `ChartContent`). The
chart never reads or writes the database directly, and never recomputes
statistics — they must stay consistent with the values every other
`LineStats` usage shows.

## Cross-feature coupling

- **lines**: `lines.chartLines` drives the per-line drawer entries
  (`toggleChartLine`); `RowChart` / `RowChartFullscreen` in
  `LineEditModal`; `useDeleteLinesCbModal` dispatches
  `removeChartSettings` for both `chart:line:<id>` and
  `chart:fullscreen:<id>` keys so settings don't survive the line. The
  lines slice also prunes `chartLines` against `selected` (charts of
  lines no longer on the map disappear).
- **routing**: `routing/connectStorage.ts` auto-activates the routing
  line's `chart:line:<routingLineId>` drawer key when the line appears
  (`setRoutingLineId`); `listeners.ts` resets the lone-chart ratio on the
  same action.
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
- **Follow-mode flip-off is ref-driven**: `followActiveRef`/
  `followModeRef` are flipped synchronously on the first user gesture —
  don't sync them from settings on every render, or the gesture's
  pre-dispatch renders would undo the flip and restart the gesture.
  The center mode has no such gate — its derivation only re-runs when
  the center or the x-scale changes.
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
