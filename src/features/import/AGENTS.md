# Import feature

Imports GPX, KML, and GeoJSON files into the local SQLite database
as track/route lines. Supports single-file and directory-batch modes,
merge-into-route, duplicate handling, auto-tagging, title extraction,
and date extraction from filenames.

## Architecture

The feature follows the standard `AppFeature` contract:
- `selectInitialized`, `translation` (de/en/es/pt), `initializeFromStorage`
- Exposes one `uiItem` (`'import'`) registered as a settings page

## Step flow

```
idle → scanning/parsing → configuration → importing → result
```

| Step | Renders | Purpose |
|---|---|---|
| `idle` | `StepIdle` | Pick file or directory |
| `scanning` | `LoadingIndicator` | Scanning storage directory for supported files |
| `parsing` | `LoadingIndicator` | Reading and parsing a single file |
| `configuration` | `StepConfiguration/index.tsx` + all controls | Configure import settings, select tracks/files |
| `importing` | `LoadingIndicator` | Running the mutation |
| `result` | `StepResult` | Success/failure summary |

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
   - **`existing`**: tag list loaded from DB, each tag toggleable. System tags disabled, "imported" preselected + locked. "Create tag" button opens `CreateTagModal`.
   - **`regex`**: list of regex pattern inputs with per-pattern preview, delete button, and "Add pattern" button. Uses `getRegexWarnings()` for validation.

9. **`DateExtractRowControl`** — switch for auto date extraction + gear icon to open `DatePatternEditorModal`.
   Date patterns are tried in order — the first matching pattern wins.

10. **`ImportButton`** — dry-run switch + "Start Import" / "Start dry run" button.
    Disabled when `selectionCount === 0` or when `titleMode === 'regex'` and `getRegexWarnings()` returns a warning.

### Result display

`StepResult` extracts a `ResultItem` memoized component with stable `left`/`description` callbacks per result entry.

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
}
```

### Key selectors

Each state field has a corresponding selector: `selectOverwriteMode`, `selectTitleMode`, `selectTagMode`, `selectTagRegexes`, etc.

### Persistence

`connectStorage.ts` uses `react-native-default-preference` key `'importSettings'`. Listener middleware watches all setting actions and saves on change. No migration — `tagRegexes` replaces old `tagRegex` with no backward compat.

## Import mutation (`useImportMutation.ts`)

The mutation is initialized in `ImportPage.tsx` via `MutationBootstrap`, a non-memoized component that calls `useImportMutation()` on every render to capture fresh context closures. The mutation reference is stored in a ref (`mutationRef.current`).

### Import modes

**Directory mode** (`importMode === 'directory'`):
- Iterates over `selectedFileUris` (respecting `fileLimit`)
- For each file: reads content, detects format, parses features
- Optionally starts a background task to keep the app alive
- Reports per-file results

**Single-file mode** (`importMode === 'file'`):
- Uses `features` array filtered by `selectedIndices`
- Single result entry

### Overwrite handling

**`create`** (default): always creates new lines from features. No existing-line check.

**`skip`**: queries existing lines by source file path. If any exist, reports them as skipped and continues to the next file. Dry-run also simulates skip correctly.

**`overwrite`**: always updates lines in-place — never deletes and recreates.
- **Merge mode**: finds the existing merged line (`trackIndexInFile = null`). If found, updates it in-place via `updateLine()`. If not found, creates via `createLines()`. Non-merged lines from the same source (survivors from prior `'create'` imports with non-null `trackIndexInFile`) are cleaned up. Extra merged-line duplicates are also removed.
- **Non-merge mode**: queries existing lines, groups IDs by `trackIndexInFile` into `Map<number, number[]>`. For each feature:
  - Matching track index → updates ALL matching lines in-place via `updateLine()`, preserving `created_at` and setting fresh `modified_at`. All duplicates from prior `'create'` imports are updated, not just one.
  - No match → collected for `createLines()`.
  - Stale existing lines (track indices not matching any feature) → deleted.

### Tag assignment (`buildDeriveTagIds`)

Always assigns the `imported` system tag. Then, depending on `tagMode`:
- `existing`: uses `selectedTagIds` from the TagExtractModal
- `regex`: iterates `tagRegexes` array, extracts labels from filenames, creates/finds tags via `ensureTagByLabel()`. Regexes without capture groups are skipped (checked via `classifyRegex(r, { checkCaptureGroup: true }).valid`). Zero-width matches are skipped to prevent infinite loops.

### Title derivation (`deriveTitle`)

Maps `titleMode` to a function of `(filename, featurePropertiesName)`:
- `none` → `""`
- `filenameWithoutExt` → strip extension
- `filenameWithExt` → full filename
- `nameProperty` → feature's `properties.name`
- `regex` → first capture group from regex match on filename; `null` if no match

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
}
```

## Constants (`constants.ts`)

`DATE_PATTERN_PRESETS` — 18 preset `DatePattern[]` for auto date extraction from filenames. Imported by `DatePatternEditorModal.tsx`.

## Context (`ImportContext.tsx`)

`ImportContextValue` provides shared state for all StepConfiguration components and the mutation. Key fields:

| Field | Type | Purpose |
|---|---|---|
| `importMode` | `ImportMode` | Current mode |
| `features` | `Feature<LineString>[]` | Parsed features (single-file) |
| `selectedIndices` | `Set<number>` | Selected feature indices |
| `dirFiles` | `{ uri, name }[]` | Discovered files (directory) |
| `selectedFileUris` | `Set<string>` | Selected file URIs |
| `selectedTagIds` | `number[]` | Tags selected in TagExtractModal |
| `importResults` | `ImportFileResult[]` | Results after import |
| `selectionCount` | `number` | Computed from current mode |
| `handleImport` | `() => void` | Triggers the mutation |
| `handleResultDone` | `() => void` | Reset to idle |
| `dismissedRef` | `MutableRefObject<boolean>` | Prevents state updates after unmount |

## i18n

Feature translations at `assets/i18n/{en,de,es,pt}.json`. Notable keys:

| Key | Purpose |
|---|---|
| `overwriteMode` | Label + hint (uses `%s` for column names) |
| `titleMode` | "Handle title" label |
| `tagMode` | "Handle tag" label + modal header |
| `tagModeNoneLabel` | Anchor button text: "No additional tags" |
| `tagModeExistingLabel` | Anchor button: "%s additional tags" |
| `tagModeRegexLabel` | Anchor button: "Regex — %s pattern(s)" |
| `startImport` | Button: "Start Import" |
| `startDryRun` | Button: "Start dry run" |
| `mergeMode` | Label: "Merge into one route per file" |

Regex validation strings live in the global `regex` namespace (`src/assets/i18n/`) — shared across import, lines, and future features.

## Known limitations (documented, not blocking)

1. **Tag regex without capture group**: the regex is silently skipped (`classifyRegex` with `checkCaptureGroup: true`). The user sees a warning in the UI but if they bypass it, no tags are extracted from that pattern.
2. **`ensureTagByLabel` edge case**: if drizzle's `INSERT` succeeds but `returning()` returns 0 rows, the tag exists but isn't linked to the imported line. Extremely rare.
3. **`nameProperty` in merge mode**: if the first track has no name, falls through to subsequent tracks until one with a `properties.name` is found. If no track has a name, the merged route gets an empty title.
4. **`custom_date`**: when `autoCustomDate` is enabled but extraction returns `null`, `createLines` falls through to SQL default (`current_timestamp`) while `updateLine` uses `?? undefined` to achieve the same default behavior. Symmetrical by design.
5. **Unmatched lines on overwrite**: when a re-imported file has fewer tracks than before, or mode changes (merge ↔ non-merge), or prior `'create'` imports created duplicates, the excess lines are NOT automatically deleted. Instead, their IDs are collected into `result.unmatchedIds` and presented in the result page with a "N unmatched tracks" warning button. The button opens a modal with a checkbox list (like `FeatureFileList`) and a "Delete checked" action. The user must explicitly choose which unmatched lines to remove. Lines that match by `trackIndexInFile` are updated in-place via `updateLine` and keep their IDs. New tracks get fresh autoincrement IDs.
