# Import feature

Imports GPX, KML, and GeoJSON files into the local SQLite database
as track/route lines. Supports single-file and directory-batch modes,
merge-into-route, duplicate handling, auto-tagging, title extraction,
and date extraction from filenames.

## Architecture

The feature follows the standard `AppFeature` contract:

- `selectInitialized`, `translation` (de/en/es/pt), `initializeFromStorage`
- Exposes one `uiItem` (`'import'`); settings page registration is commented out — the importer is reached via the Routes Browser instead

## Step flow

```
idle → scanning/parsing → configuration → importing → result
```

| Step            | Renders                                      | Purpose                                        |
| --------------- | -------------------------------------------- | ---------------------------------------------- |
| `idle`          | `StepIdle`                                   | Pick file or directory                         |
| `scanning`      | `LoadingIndicator`                           | Scanning storage directory for supported files |
| `parsing`       | `LoadingIndicator`                           | Reading and parsing a single file              |
| `configuration` | `StepConfiguration/index.tsx` + all controls | Configure import settings, select tracks/files |
| `importing`     | `LoadingIndicator`                           | Running the mutation                           |
| `result`        | `StepResult`                                 | Success/failure summary                        |

## Component tree

### StepConfiguration (`StepConfiguration/index.tsx`)

Renders all configuration controls in order:

1. **`FeatureFileList`** — track/file selector with checkboxes and select-all/none buttons.
   Opens a modal with a `FlashList`. Single-file mode shows parsed GeoJSON features;
   directory mode shows discovered files.

2. **`FileLimitControl`** — numeric input for max files (directory mode only, hidden otherwise).
   Validates `>= 0` (0 = no limit).

3. **`KeepAppActiveControl`** — toggle for background-import with Android notification permission request.

4. **`MergeModeControl`** — toggle for merging all tracks in a file into a single route.

5. **`OverwriteModeControl`** — menu control for duplicate handling: `create` / `skip` / `overwrite`.
   The hint text uses `sprintf` to dynamically insert translated column names (`lines.columns.modified_at`, `lines.columns.created_at`).

6. **`TitleExtractControl`** — dropdown for title mode: `none`, `filenameWithoutExt`, `filenameWithExt`, `nameProperty`, `regex`.
   When `regex` is selected, shows a `TextInput` with validation warnings (invalid syntax, no capture group, empty capture group, DOS risk) via `getRegexWarnings()`.

7. **`TagExtractControl`** — anchor button opening `TagExtractModal`.
   Button label shows mode summary: "No additional tags" / "N additional tags" / "Regex — N pattern(s)".

8. **`TagExtractModal`** — modal wrapper with three sub-views based on `tagMode`:
    - **`none`**: descriptive text about auto `imported` tag
    - **`existing`**: tag list loaded from DB, each tag toggleable. System tags disabled, "imported" preselected + locked. "Create tag" button opens `CreateTagModal` (imported from `src/features/lines/components/CreateTagModal`).
    - **`regex`**: list of regex pattern inputs with per-pattern preview, delete button, and "Add pattern" button. Uses `getRegexWarnings()` for validation.

9. **`DateExtractRowControl`** — switch for auto date extraction + gear icon to open `DatePatternEditorModal`.
   Date patterns are tried in order — the first matching pattern wins.

10. **`ImportButton`** — dry-run switch + "Start Import" / "Start dry run" button.
    Disabled when `selectionCount === 0` or when `titleMode === 'regex'` and `getRegexWarnings()` returns a warning.

### Result display (`StepResult/`)

The result page is split into four files:

| File                                 | Role                                                                                                                                                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StepResult/index.tsx`               | Container: dry-run notice banner, button bar ("Back to Configuration" / "Close Importer"), FlashList of file rows. In dry-run mode, hardware back button is intercepted → goes back to configuration instead of popping the navigation stack.                         |
| `StepResult/FileRow.tsx`             | Per-file result row. Shows: status icon, filename, per-file counts (merged / new tracks / overwritten / skipped / skipped-geom), title extraction info, tag badges via `TagBadge`, custom date extraction info. Renders `<UnmatchedLines />` for stale unmatched IDs. |
| `StepResult/UnmatchedLines.tsx`      | Owns the `remainingIds` local state. Conditionally renders the warning button (`"N unmatched track(s) need attention"`) + `UnmatchedLinesModal`. Button auto-hides when all IDs are deleted.                                                                          |
| `StepResult/UnmatchedLinesModal.tsx` | Modal with explanatory text, select-all / select-none buttons, FlashList of unmatched lines with `ListItem` + `Checkbox` rows, and "Delete N checked" button. After delete, calls `onIdsChange` to update parent state.                                               |

The `FileRow` counts logic handles merge mode, overwrite, and partial-import scenarios with distinct labels (`resultTracksMerged`, `resultNewTracks`, `resultTracksOf`, `resultSuccess`, `resultOverwritten`, `resultSkippedExisting`, `resultSkippedGeom`).

## Redux state (`slice.ts`)

```ts
ImportState extends SliceSettingsBase {
    datePatterns: DatePattern[];      // ordered list for auto date extraction
    autoCustomDate: boolean;          // enable date extraction
    mergeMode: boolean;               // merge tracks per file into one route
    overwriteMode: OverwriteMode;     // 'create' | 'skip' | 'overwrite'
    dryRun: boolean;                  // preview mode — no DB writes
    keepAppActive: boolean;           // prevent system from killing app during import
    fileLimit: number;                // max files (directory mode, 0 = unlimited)
    titleMode: TitleMode;             // 'none' | 'filenameWithoutExt' | 'filenameWithExt' | 'nameProperty' | 'regex'
    titleRegex: string;               // single regex for title extraction
    tagMode: TagMode;                 // 'none' | 'existing' | 'regex'
    tagRegexes: string[];             // array of regex patterns for tag extraction
    selectedTagIds: number[];         // tag IDs selected in existing-tag mode
}
```

### Key selectors

Each state field has a corresponding selector: `selectOverwriteMode`, `selectTitleMode`, `selectTagMode`, `selectTagRegexes`, etc.

### Persistence

`connectStorage.ts` uses `react-native-default-preference` key `'importSettings'`. Listener middleware watches all setting actions and saves on change. No migration — `tagRegexes` replaces old `tagRegex` with no backward compat.

## Import mutation (`useImportMutation.ts`)

The mutation is initialized in `ImportPage.tsx` via `MutationBootstrap`, a component that calls `useImportMutation()` and stores the result in a ref (`mutationRef.current`). `MutationBootstrap` rerenders on every parent render to capture fresh context closures via the ref/callback pattern described in the root AGENTS.md.

### Import modes

**Directory mode** (`importMode === 'directory'`):

- Iterates over `selectedFileUris` (respecting `fileLimit`)
- For each file: reads content, detects format, parses features
- Read-ahead: the next file's native read overlaps the current file's
  parse/write
- **No timer-based yields inside the loop**: RN schedules JS timers on
  choreographer frame boundaries, which stop ticking when the app is
  backgrounded — a `setTimeout` await would freeze the import there.
  Responsiveness comes from the loop's natural native awaits
  (`readFile`, op-sqlite), which return control to the event loop so a
  Stop press (checked via `stopRequestedRef` at the top of every
  iteration) is processed between files.
- Optionally starts a background task to keep the app alive
- Reports per-file results

**Single-file mode** (`importMode === 'file'`):

- Uses `features` array filtered by `selectedIndices`
- Single result entry

### Performance work (batch import)

- **Overwrite mode writes are batched**: `updateLinesBatch`
  (`lines/db/actionsLine.ts`) replaces the per-line `updateLine` loop —
  one pre-flight query for current tag relations + one transaction with
  per-row UPDATEs and a single multi-row tag-relation INSERT/DELETE.
- **Existing-line lookup is pre-fetched once per batch**: directory
  mode runs chunked `json_extract(data, '$.import.sourceFilePath') IN (...)`
  queries (500 URIs each) for all selected URIs before the loop (indexed
  by migration `0003_sourcePathIndex`); skip/overwrite/dry-run-skip read
  from the resulting map instead of querying per file. In skip mode,
  files that already exist are **fast-skipped before being read or
  parsed** — a directory re-import with thousands of preexisting files
  costs one map lookup per file, not a disk read + GPX parse.
- **Tag resolution is cached across the batch**: `resolveTagObjects`
  memoizes label→tag and id→tag lookups in `tagCacheRef` for the whole
  mutation run (reset at the start of each run), so later files reuse
  earlier results instead of re-querying.
- **GPX parsing**: `lines/utils/importParser.ts` uses fast-xml-parser
  with an xmldom + togeojson fallback; KML/GeoJSON are unchanged.

### Per-point timestamps (`line_points`)

`parseImportContent` returns `times: (number[] | null)[]` aligned with
its features — per-point epoch timestamps from GPX `<trkpt>/<rtept>`
`<time>` elements (togeojson-style `coordinateProperties.times`), plus
`tinyCount` (tracks with exactly one point — zero-distance recordings
that can never become LineStrings; the importer reports them with the
`noTrackPoints` message instead of the generic "nothing found").
The import writes them into the `line_points` table
(`lines/db/schema/schema.ts`, migration `0004_mushy_maginty`) via
`createLinePoints` / `replaceLinePoints`
(`lines/db/actionsLinePoints.ts`); `buildLinePoints`
(`import/utils.ts`) derives per-segment speed from haversine distances.
Inserts are chunked (500 rows per statement) — a single INSERT for a
100k+ point track would exceed SQLite's SQL variable limit and overflow
Hermes' native stack. When no date is extracted from the filename,
`custom_date` falls back to the track's first timestamp (`firstTimeIso`)
instead of the SQL `current_timestamp` default. In merge mode, times
are concatenated in feature order and only stored when every feature
has full coverage.

### Giant tracks are split (`LINE_MAX_POINTS`)

Features larger than `LINE_MAX_POINTS` (30,000 points — defined in
`lines/db/repairGiantGeometries.ts`) are split into consecutive parts
at write time (`expandToWriteItems` / `partTitleSuffix` in
`import/utils.ts`): parts share `properties` and `trackIndexInFile`,
get titles like `name (2/3)`, and their `line_points` times are sliced
in sync. Overwrite mode pairs parts with existing line ids by order;
extra parts are created, leftover ids go to the unmatched list. Merge
mode splits its merged output the same way. Existing oversized lines
from before this change are split once at startup by
`repairGiantGeometries()` (dbLoader init, after migrations).

### Stopping an import

A user-initiated stop throws `{ __aborted: true }` after persisting the
partial results. The `onError` handler invalidates all line/tag query
families (partial writes must become visible — query `staleTime` is
Infinity) and, for a user stop with partial results, shows the result
page with a stopped-early notice (`importAborted` context flag).

### Overwrite handling

**`create`** (default): always creates new lines from features. No existing-line check.

**`skip`**: queries existing lines by source file path. If any exist, reports them as skipped and continues to the next file. Dry-run also simulates skip correctly.

**`overwrite`**: always updates lines in-place — never deletes and recreates.

- **Merge mode**: finds the existing merged line (`trackIndexInFile = null`). If found, updates it in-place via `updateLine()`. If not found, creates via `createLines()`. Non-merged lines from the same source (survivors from prior `'create'` imports with non-null `trackIndexInFile`) are cleaned up. Extra merged-line duplicates are also removed.
- **Non-merge mode**: queries existing lines, groups IDs by `trackIndexInFile` into `Map<number, number[]>`. For each feature:
    - Matching track index → updates ALL matching lines in-place via `updateLine()`, preserving `created_at` and setting fresh `modified_at`. All duplicates from prior `'create'` imports are updated, not just one.
    - No match → collected for `createLines()`.
    - Stale existing lines (track indices not matching any feature) → collected into `unmatchedIds` for user review in `StepResult`.

### Tag assignment (`extractTagInfo` + `resolveTagObjects`)

Tag extraction is split into two phases (both defined inline inside `useImportMutation.ts` as `useCallback` closures):

1. **`extractTagInfo(name)`** — pure extraction, no DB access. Returns `{ labels: string[], existingIds: number[] }`:
    - Always includes `'imported'` in labels
    - `existing` mode: collects `selectedTagIds` from Redux state into `existingIds`
    - `regex` mode: runs regexes on filename (validated via `classifyRegex` from `src/lib/regexUtils.ts`), collects matched labels
    - `none` mode: only `'imported'`

2. **`resolveTagObjects(labels, existingIds, isDryRun)`** — resolves labels and IDs to full `{ id?, label, data? }` objects suitable for `<TagBadge />`:
    - Queries DB for existing tags by label and by ID
    - For labels not in DB: real import calls `ensureTagByLabel()` to create them; dry run returns `{ label }` without an ID (no DB writes)
    - Real import extracts numeric `uniqueTagIds` from resolved objects for `createLines`/`updateLine` calls

This pipeline runs **before** the dry-run check, so both real and dry-run results include full tag/title/date extraction info in `ImportFileResult`.

### Title derivation (`deriveTitle`, inline in `useImportMutation.ts`)

Maps `titleMode` to a function of `(filename, featurePropertiesName)`:

- `none` → `""`
- `filenameWithoutExt` → strip extension
- `filenameWithExt` → full filename
- `nameProperty` → feature's `properties.name`
- `regex` → delegates to `applyTitleRegex`, which runs `classifyRegex` (from `src/lib/regexUtils.ts`) then extracts the first capture group; `null` if no match

In merge mode, the first track's `properties.name` is passed instead of `undefined`, so `nameProperty` mode has a meaningful fallback.

### Import metadata (`data` column)

Each imported line stores:

```json
{
	"import": {
		"sourceFilePath": "<uri>",
		"originalFilename": "<name>",
		"importBatchId": "<batch>",
		"trackIndexInFile": 0
	}
}
```

`sourceFilePath` is the deduplication key for overwrite/skip modes. `trackIndexInFile` maps features to existing lines for in-place updates.

## Utility functions

| Function                          | Location                         | Purpose                                                        |
| --------------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `extractTagInfo`                  | Inline in `useImportMutation.ts` | Extract tag labels/IDs from filename                           |
| `resolveTagObjects`               | Inline in `useImportMutation.ts` | Resolve to full tag objects (batch-cached)                     |
| `deriveTitle` / `applyTitleRegex` | Inline in `useImportMutation.ts` | Derive title from filename or feature                          |
| `buildImportData`                 | Inline in `useImportMutation.ts` | Build the `data` column JSON                                   |
| `queryExistingBySourcePath`       | Inline in `useImportMutation.ts` | Query existing lines (single-file skip/overwrite)              |
| `extractDateFromFilename`         | `utils.ts`                       | Extract ISO date string from filename                          |
| `extractDateWithPattern`          | `utils.ts`                       | Extract date + pattern name                                    |
| `buildLinePoints`                 | `utils.ts`                       | Build `line_points` rows (derived segment speeds)              |
| `firstTimeIso`                    | `utils.ts`                       | ISO string of a track's first timestamp (custom_date fallback) |
| `getRegexWarnings`                | `src/lib/regexUtils.ts`          | Validate regex for common issues                               |
| `classifyRegex`                   | `src/lib/regexUtils.ts`          | Classify/parse regex with validation                           |

`utils.ts` contains date-extraction helpers and the `line_points`
builders. The core import logic (tag resolution, title derivation,
overwrite queries) is defined inline inside `useImportMutation.ts` via
`useCallback` closures to follow the stale-closure-avoiding ref pattern
described in the root AGENTS.md.

## Directory scanning

- App-managed directories (`handleSelectAppDir`) are scanned via
  `FsModule.listFilePaths` — a lightweight native method returning a
  plain `String[]` of matching paths (much smaller bridge payload than
  `getInfo`'s per-file info maps for large directories).
- Custom SAF directories (`handleSelectCustom`) use
  `react-native-scoped-storage` `listFiles` (known slow on large trees
  — a native SAF walk is a possible follow-up).

## Types (`types.ts`)

Domain types (`ImportMode`, `ImportStep`, `TagMode`, `TitleMode`, `OverwriteMode`, `ImportFileResult`, `isValidGeometry`) and `DatePattern`. Redux-specific `ImportSettings` and `ImportState` live in `slice.ts`.

```ts
Type ImportMode = 'file' | 'directory';
Type TitleMode = 'none' | 'filenameWithoutExt' | 'filenameWithExt' | 'nameProperty' | 'regex';
Type TagMode = 'none' | 'existing' | 'regex';
Type OverwriteMode = 'create' | 'skip' | 'overwrite';
Type ImportStep = 'idle' | 'scanning' | 'parsing' | 'configuration' | 'importing' | 'result';

interface ImportFileResult {
    name: string;
    success: boolean;
    error?: string;
    importedCount?: number;
    overwritten?: number;
    skipped?: number;
    skippedGeom?: number;
    unmatchedIds?: number[];

    isDryRun?: boolean;
    mergeMode?: boolean;
    tracksTotal?: number;

    titleMode?: string;
    titleExtracted?: string;
    tracksWithNames?: number;
    tracksWithoutNames?: number;

    tagMode?: string;
    tags?: { id?: number; label: string | null; data?: any }[];

    dateApplied?: string;
    datePatternName?: string;
}
```

## Constants (`constants.ts`)

`DATE_PATTERN_PRESETS` — 18 preset `DatePattern[]` for auto date extraction from filenames. Imported by `DatePatternEditorModal.tsx`.

## Context (`ImportContext.tsx`)

`ImportContextValue` provides shared state for all StepConfiguration components and the mutation. Key fields:

| Field | Type | Purpose |
|---|---|---|---|
| `importMode` | `ImportMode` | Current mode |
| `step` / `setStep` | `ImportStep` / setter | Current step in the import flow |
| `features` | `Feature<LineString>[]` | Parsed features (single-file) |
| `selectedIndices` | `Set<number>` | Selected feature indices |
| `filename` | `string` | Current file name |
| `sourceFilePath` | `string` | Current file URI |
| `dirFiles` | `{ uri, name }[]` | Discovered files (directory) |
| `selectedFileUris` | `Set<string>` | Selected file URIs |
| `importDirs` | `AbsPath[]` | Available import directories |
| `bulkProgress` | `{ current, total }` | Directory-import progress counter |
| `importResults` | `ImportFileResult[]` | Results after import |
| `selectionCount` | `number` | Computed from current mode |
| `handleImport` | `() => void` | Triggers the mutation |
| `handleCloseImporter` | `() => void` | Pops last `uiItemKey` to return to settings |
| `handleBackToConfiguration` | `() => void` | Returns to configuration step (dry-run only) |
| `handlePickFile` | `() => Promise<void>` | Opens file picker |
| `handleSelectAppDir` | `(path: AbsPath) => void` | Selects an app-managed directory |
| `handleSelectCustom` | `() => void` | Opens directory tree picker |
| `handleToggleFeature` | `(idx: number) => void` | Toggle single feature selection |
| `handleSelectAllFeatures` | `() => void` | Select all features |
| `handleDeselectAllFeatures` | `() => void` | Deselect all features |
| `handleToggleFile` | `(uri: string) => void` | Toggle single file selection |
| `handleSelectAllFiles` | `() => void` | Select all directory files |
| `handleDeselectAllFiles` | `() => void` | Deselect all directory files |
| `handleResultDone` | `() => void` | Return to settings or idle |
| `dismissedRef` | `MutableRefObject<boolean>` | Prevents state updates after unmount |
| `mutationRef` | `MutableRefObject<...\|null>` | Holds the `useMutation` result |

Note: `selectedTagIds` (tag IDs selected in existing-tag mode) lives in Redux state, not context.

## i18n

Feature translations at `assets/i18n/{en,de,es,pt}.json`. Notable keys:

| Key                            | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `overwriteMode`                | Label + hint (uses `%s` for column names)                       |
| `titleMode`                    | "Handle title" label                                            |
| `tagMode`                      | "Handle tag" label + modal header                               |
| `tagModeNoneLabel`             | Anchor button text: "No additional tags"                        |
| `tagModeExistingLabel`         | Anchor button: "%s additional tags"                             |
| `tagModeRegexLabel`            | Anchor button: "Regex — %s pattern(s)"                          |
| `startImport`                  | Button: "Start Import"                                          |
| `startDryRun`                  | Button: "Start dry run"                                         |
| `mergeMode`                    | Label: "Merge into one route per file"                          |
| `resultDryRunNotice`           | Banner: "Dry run — no data was changed on device."              |
| `resultCloseImporter`          | Button: "Close Importer"                                        |
| `resultBackToConfiguration`    | Button: "Back to Configuration" (dry run only)                  |
| `resultTitleVia`               | "Title: '%s' (%s)" — extracted title + mode label               |
| `resultTracksNamed`            | "%s named / %s unnamed" (non-merge mode)                        |
| `resultTracksMerged`           | "%s tracks merged into 1 route"                                 |
| `resultNewTracks`              | "%s new tracks imported" (when overwrite mode)                  |
| `resultDateApplied`            | "%s: %s (extracted from filename by '%s')"                      |
| `resultRegexNoMatch`           | "Title regex produced no match"                                 |
| `resultUnmatchedButton`        | "%s unmatched track(s) need attention"                          |
| `resultUnmatchedExplanation`   | Explanatory text in unmatched lines modal                       |
| `resultUnmatchedDeleteChecked` | "Delete %s checked"                                             |
| `routeN`                       | "Route %s" — fallback title for unmatched lines without a title |

Regex validation strings live in the global `regex` namespace (`src/assets/i18n/`) — shared across import, lines, and future features.

## Known limitations (documented, not blocking)

1. **Tag regex without capture group**: the regex is silently skipped (`classifyRegex` with `checkCaptureGroup: true`). The user sees a warning in the UI but if they bypass it, no tags are extracted from that pattern.
2. **`ensureTagByLabel` edge case**: if drizzle's `INSERT` succeeds but `returning()` returns 0 rows, the tag exists but isn't linked to the imported line. Extremely rare.
3. **`nameProperty` in merge mode**: if the first track has no name, falls through to subsequent tracks until one with a `properties.name` is found. If no track has a name, the merged route gets an empty title.
4. **`custom_date`**: when `autoCustomDate` is enabled but extraction returns `null`, `createLines` falls through to SQL default (`current_timestamp`) while `updateLine` uses `?? undefined` to achieve the same default behavior. Symmetrical by design.
5. **Unmatched lines on overwrite**: when a re-imported file has fewer tracks than before, or mode changes (merge ↔ non-merge), or prior `'create'` imports created duplicates, the excess line IDs are collected into `result.unmatchedIds`. They are NOT automatically deleted. The `UnmatchedLines` component renders a warning button showing the remaining count; tapping it opens `UnmatchedLinesModal` with an explanatory text, select-all/select-none buttons, a `FlashList` of lines with `ListItem` + `Checkbox` rows, and a "Delete N checked" button. The modal tracks locally via `remainingIds` state — deleted IDs vanish immediately from the list, and the parent button auto-hides when all are deleted. Lines that match by `trackIndexInFile` are updated in-place via `updateLine` and keep their IDs. New tracks get fresh autoincrement IDs.
