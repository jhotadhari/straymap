# Generic Controls

Reusable form control components wrapping react-native-paper inputs with consistent layout, info/help modals, and validation patterns. Located at `src/components/generic/controls/`.

## Architecture patterns

There are two control layout patterns in this directory:

### 1. InfoRowControl wrapper (row controls)

Components that render a **label + control in a horizontal row**, with an optional `Info` modal accessible by tapping the label. These are used inside modals or settings panels where fields are stacked vertically.

```
Label (underlined if Info present)    [ Control ]
```

All row controls accept at minimum: `label`, `Info` (ReactNode for the help modal), `style`. They compose `InfoRowControl` internally (or are consumed as standalone by callers that build their own layout).

### 2. ListItem-anchored controls

Components that render a **paper ListItem as a tappable anchor** which opens either a popover menu (`ListItemMenuControl`) or a modal (`ListItemModalControl`). Used in navigation-style settings screens.

## Components

### InfoRowControl

The foundational row-layout wrapper. Renders a label (underlined + tappable if `Info` is provided) and places `children` to its right. Tapping the label opens `InfoControlWrapper` as a modal.

| Prop | Type | Notes |
|------|------|-------|
| `label` | `string?` | Displayed left of children |
| `children` | `ReactNode?` | Control(s) rendered right of label |
| `Info` | `ReactNode \| string?` | Content shown in info modal; presence also makes label tappable+underlined |
| `Below` | `ReactNode?` | Rendered below the row (e.g. extra hint text) |
| `backgroundBlur` | `boolean` | Passed through to `InfoControlWrapper` modal |
| `headerPlural` | `boolean` | If true, header uses plural form ("What are …") |
| `style` | `ViewStyle?` | Applied to the outer row container |
| `labelStyle` | `TextStyle?` | Applied to the label Text |
| `onLabelPress` | `() => void?` | Additional callback when label is tapped (besides opening Info) |

Exports:
- `default`: the component
- `labelMinWidth` (named, `90`): minimum label width constant, used for alignment across multiple rows

### NumericRowControl

Single numeric input with save-on-type and blur-validation.

| Prop | Type | Notes |
|------|------|-------|
| `label` | `string?` | |
| `value` | `number` | Current numeric value |
| `onUpdate` | `(newValue: number) => void` | Called on save |
| `inputStyle` | `TextStyle?` | Applied to the TextInput |
| `style` | `ViewStyle?` | Applied to InfoRowControl wrapper |
| `Info` | `ReactNode?` | |
| `numType` | `NumType` | `'int'` (default) or `'float'` |
| `saveOnType` | `boolean` | If true (default), saves on every keystroke (debounced via ref); if false, only saves on blur |
| `validate` | `(val: number) => boolean?` | Custom validation; sets error state if false |

### NumericRowControlSegmented

A button + numeric input pair where the button toggles whether the numeric value is active. Used for optional numeric overrides (e.g. "Auto" button → toggles to manual numeric entry).

| Prop | Type | Notes |
|------|------|-------|
| `label` | `string?` | |
| `buttonLabel` | `string?` | Text on the toggle button |
| `numValueActive` | `boolean` | Whether the numeric input is active/enabled |
| `toggleOption` | `() => void` | Called to toggle `numValueActive` |
| `value` | `number \| string` | Current numeric value |
| `onUpdate` | `(newValue: number) => void` | |
| `inputStyle` | `TextStyle?` | |
| `style` | `ViewStyle?` | |
| `Info` | `ReactNode?` | |
| `numType` | `NumType` | `'int'` (default) or `'float'` |
| `saveOnType` | `boolean` | Default `true` |
| `validate` | `(val: number) => boolean?` | |

### NumericRowControlMulti

Two numeric inputs side by side (e.g. min/max range). Each with optional label text.

| Prop | Type | Notes |
|------|------|-------|
| `label` | `string?` | Overall row label |
| `values` | `number[]` | Two-element array `[min, max]` |
| `optLabels` | `string[]` | Two-element array of labels above each input |
| `onUpdate` | `(newValues: number[]) => void` | |
| `Info` | `ReactNode?` | |
| `numType` | `NumType` | `'int'` (default) or `'float'` |
| `saveOnType` | `boolean` | Default `true` |
| `validate` | `(val: number) => boolean?` | Applied per-input |

### FileSourceRowControl

File/directory picker with preset directories + custom URI option. Opens a modal listing available files across configured directories, with radio-button selection.

| Prop | Type | Notes |
|------|------|-------|
| `label` | `string` | Row label |
| `value` | `string?` | Currently selected file path/URI |
| `onSelect` | `(newValue?: string) => void?` | Called on selection change |
| `onModalDismiss` | `(newValue?: string) => void?` | Called when modal is dismissed |
| `dirs` | `AbsPath[]?` | Directories to scan for files |
| `extensions` | `string[]?` | File extensions to filter by |
| `filePattern` | `RegExp?` | Regex filter (alternative to `extensions`) |
| `header` | `string?` | Modal header (defaults to `label`) |
| `Info` | `ReactNode \| string?` | |
| `After` | `ReactNode?` | Rendered after the trigger button |
| `filesHeading` | `string?` | Heading above file list |
| `noFilesHeading` | `string?` | Heading when no files found |
| `dismissModalOnSelect` | `boolean?` | If true, closes modal immediately on selection |
| `canCreateNewOption` | `boolean?` | If true, shows a "create new" text input |
| `hasCustom` | `boolean?` | If true, adds a "Custom" option that opens `openDocument()` |
| `newOptionLabel` | `string?` | Label for the "create new" option |
| `initialOptionsByPath` | `OptionsByPathType?` | Pre-populated options keyed by path |
| `AlternativeButton` | `AlternativeButtonType?` | Replace the trigger button with a custom component |
| `styleContent` | `ViewStyle?` | Style for the button row |

Exports:
- `default`: the component
- `AlternativeButtonType` (named type): `(props: { setModalVisible }) => ReactElement | null`

### HgtSourceRowControl

Specialized file source picker for DEM/HGT elevation data directories. Similar pattern to `FileSourceRowControl` but specialized for the `hgtDir` option with embedded Info content about SRTM data sources and download links.

| Prop | Type | Notes |
|------|------|-------|
| `dirs` | `AbsPath[]` | HGT directories to choose from |
| `options` | `object` | Options object (mutated by reference) |
| `optKey` | `string` | Key in `options` to write selection to |
| `setOptions` | `(options: object) => void` | Setter for options |
| `onlyThreeSeconds` | `boolean?` | If true, shows "3-second" hint in Info |

### ListItemMenuControl

A paper `ListItem` that opens a `Popover` menu on press. Used for select-from-list controls where the options fit in a popover rather than a full modal.

| Prop | Type | Notes |
|------|------|-------|
| `anchorLabel` | `string` | ListItem title |
| `options` | `OptionBase[]?` | Menu items (`{ key, label }`) |
| `value` | `string?` | Currently selected option key |
| `setValue` | `(newValue: string) => void?` | Selection callback |
| `listItemStyle` | `ViewStyle?` | |
| `menuItemStyle` | `ViewStyle \| ((idx: number) => ViewStyle)?` | |
| `anchorLabelAppendSelected` | `boolean?` | If true, appends selected option label in parens |
| `anchorIcon` | `(props) => ReactNode?` | Icon for the ListItem |

### ListItemModalControl

A paper `ListItem` that opens a `ModalWrapper` on press. The modal contains arbitrary `children` plus an OK button.

| Prop | Type | Notes |
|------|------|-------|
| `anchorLabel` | `string` | ListItem title |
| `header` | `string` | Modal header |
| `children` | `ReactNode` | Modal content |
| `listItemStyle` | `ViewStyle?` | |
| `innerStyle` | `ViewStyle?` | Passed to ModalWrapper |
| `backgroundBlur` | `boolean` | Default `true` |
| `scrollEnabled` | `boolean` | Default `true` |
| `onLayout` | `(event) => void?` | |
| `anchorIcon` | `(props) => ReactNode?` | |
| `afterDismiss` | `() => void?` | Called after modal closes |

### NameRowControl

A simple text input for editing an entity's `name` field. Debounces updates (300ms) and keeps a ref to the latest item/update callback to avoid stale closures.

| Prop | Type | Notes |
|------|------|-------|
| `item` | `{ name: string }` | Entity with a `name` property |
| `update` | `(newItem: { name: string }) => void` | Called debounced on change |
| `Info` | `ReactNode \| string?` | |

### sharedDeps

Small shared StyleSheet with `flexRow` layout used by multiple controls:

```ts
export const sharedStyles = StyleSheet.create({
    flexRow: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
```

## Related components (parent directory)

These live in `src/components/generic/` and are consumed by controls:

- **InfoControlWrapper** — The modal that renders `Info` content. Used by `InfoRowControl` internally. Header pattern: `t('whatIs', { count })` + label.
- **RadioListItem** — Radio-button list item used inside `FileSourceRowControl` and `HgtSourceRowControl` modals. Takes `OptionBase` + extractors.
- **ModalWrapper** — Generic modal shell with header, scroll, blur support.

## Common patterns

### Basic numeric field with info

```tsx
import NumericRowControl from '.../generic/controls/NumericRowControl';

<NumericRowControl
    label={t('settings.maxZoom')}
    value={maxZoom}
    onUpdate={setMaxZoom}
    Info={t('hint.maxZoom')}
    numType="int"
    validate={(v) => v >= 0 && v <= 22}
/>
```

### Optional numeric override (segmented)

```tsx
import NumericRowControlSegmented from '.../generic/controls/NumericRowControlSegmented';

<NumericRowControlSegmented
    label={t('settings.fontSize')}
    buttonLabel={t('auto')}
    numValueActive={!useAuto}
    toggleOption={() => setUseAuto(!useAuto)}
    value={fontSize}
    onUpdate={setFontSize}
    numType="int"
/>
```

### Min/max range

```tsx
import NumericRowControlMulti from '.../generic/controls/NumericRowControlMulti';

<NumericRowControlMulti
    label={t('filter.range')}
    values={[minVal, maxVal]}
    optLabels={[t('min'), t('max')]}
    onUpdate={([min, max]) => { setMin(min); setMax(max); }}
    numType="float"
/>
```

### File picker with preset dirs

```tsx
import FileSourceRowControl from '.../generic/controls/FileSourceRowControl';

<FileSourceRowControl
    label={t('map.mapFile')}
    dirs={[mapfilesDir]}
    extensions={['map']}
    value={selectedMapFile}
    onSelect={setSelectedMapFile}
    hasCustom={true}
    canCreateNewOption={false}
    Info={t('hint.mapFile')}
/>
```

### List item with popover menu

```tsx
import ListItemMenuControl from '.../generic/controls/ListItemMenuControl';

<ListItemMenuControl
    anchorLabel={t('theme')}
    options={themeOptions}
    value={selectedTheme}
    setValue={setSelectedTheme}
/>
```

### List item opening a modal

```tsx
import ListItemModalControl from '.../generic/controls/ListItemModalControl';

<ListItemModalControl
    anchorLabel={t('advanced')}
    header={t('advancedSettings')}
>
    <NumericRowControl label={t('cacheSize')} value={cacheSize} onUpdate={setCacheSize} />
</ListItemModalControl>
```

## When to use which

| Scenario | Component |
|----------|-----------|
| Single number input | `NumericRowControl` |
| Number with auto/manual toggle | `NumericRowControlSegmented` |
| Two numbers (min/max range) | `NumericRowControlMulti` |
| File/directory picker | `FileSourceRowControl` |
| DEM elevation data source | `HgtSourceRowControl` |
| Simple text name input | `NameRowControl` |
| Select from a short list (popover) | `ListItemMenuControl` |
| Arbitrary content in a modal | `ListItemModalControl` |
| Custom row layout with Info modal | `InfoRowControl` (used directly, or compose into your own component) |

## Import convention

Prefer direct file imports for single components (smaller bundles, avoids circular deps):

```ts
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
```

The barrel export (`index.ts`) is available but use sparingly — direct imports match the existing codebase convention.
