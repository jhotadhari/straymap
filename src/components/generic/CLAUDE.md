# Generic Components

Reusable UI components shared across features. Located at `src/components/generic/`.

## Directory structure

```
generic/
├── controls/       Value-holding form inputs (numeric, toggle, text, file picker)
├── infoWrapper/    Primitives wrapped with an Info-label + help modal
├── primitives/     Small "atom" components — buttons, icons, links, loading
└── wrapper/        Layout shells — modals, list items, menu items, popovers
```

Each group has a clear identity. When adding a new component, pick the group that
matches its role. If nothing fits, it may belong in a feature directory instead.

## controls/

Form inputs that manage a value with an `onUpdate` / `onSelect` / `onToggle` callback.

| Component | Purpose |
|---|---|
| `NumericRowControl` | Single numeric text input, save-on-type, blur validation |
| `NumericRowControlMulti` | Two numeric inputs side by side (min/max range) |
| `NumericRowControlSegmented` | Toggle button + numeric input (auto/manual override) |
| `ToggleRowControl` | Boolean switch |
| `ToggleRowControlSegmented` | Toggle button + boolean switch |
| `NameRowControl` | Text input for an entity's `name`, debounced (300ms) |
| `FileSourceRowControl` | File/directory picker modal with radio selection |
| `ColorPaletteInline` | Color swatch picker from the 10-color palette |

All row controls compose `InfoLabelRow` from `infoWrapper/` for the label + layout.

**Shared styles:** `sharedDeps.ts` exports `sharedStyles.flexRow`.

## infoWrapper/

Components that wrap a primitive or control with a tappable label that opens an Info/help modal.

| Component | Purpose |
|---|---|
| `InfoLabelRow` | Foundational row: label (tappable → Info modal) + children on the right |
| `InfoWrapper` | Generic wrapper: takes children + Info, renders ModalWrapper when tapped |
| `InfoButton` | IconButtonHighlight + Info modal (convenience composition) |

`InfoLabelRow` is the workhorse — most form rows in settings panels are built on it.

## primitives/

Small presentational "atom" components with no internal dependencies on other generic
components.

| Component | Purpose |
|---|---|
| `ButtonHighlight` | Paper `Button` with press-in/press-out background highlight |
| `IconButtonHighlight` | Same as above, for `IconButton` |
| `IconIcomoon` | IcoMoon icon set (built from `selection.json` at import time) |
| `HintLink` | Tappable URL text that opens via `Linking.openURL` |
| `LoadingIndicator` | Paper `ActivityIndicator`, always animated, uses `theme.colors.primary` |
| `Badge` | Small colored badge/chip, outlined or contained, from `PaletteColor` |
| `TextInputNativeMultiline` | Auto-resizing multiline TextInput (class component, ref-forwarding workaround) |

## wrapper/

Layout shell components — modals, list/menu items, popovers.

| Component | Purpose |
|---|---|
| `ModalWrapper` | Full-featured modal shell: reanimated keyboard-avoidance, blur backdrop, scroll |
| `ListItem` | `TouchableHighlight` list row with optional leading icon and active state |
| `MenuItem` | Similar to `ListItem`, tighter padding, used inside menus/popovers |
| `RadioListItem` | Radio-button list item, used in file-picker modals |
| `PopoverMenuItems` | Renders a list of `MenuItem` from `MenuActionOption[]` |
| `ListItemMenuControl` | `ListItem` anchor that opens a `Popover` menu on press |
| `ListItemModalControl` | `ListItem` anchor that opens a `ModalWrapper` on press |

## Related components (outside generic/)

- **HgtSourceRowControl** — DEM/HGT elevation data picker, lives in `features/general/components/controls/` (feature-specific, Redux-coupled)

## Import convention

Direct file imports — no barrel files. Long paths are normal:

```ts
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ModalWrapper from '../../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../../components/generic/primitives/ButtonHighlight';
```
