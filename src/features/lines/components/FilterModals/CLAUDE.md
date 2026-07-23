# Filter architecture

Column filters for LinesTable and TagsTable, orchestrated through a
shared `FilterModalsOrchestrator` that handles the column-select →
edit-modal → save flow.

## Filter types (`../../types.ts`)

| Type | Shape | Columns |
|---|---|---|
| `NumericColumnFilter` | `{ type, columnKey, min?, max? }` | stats (length, uphill, downhill, minZ, maxZ) |
| `DateColumnFilter` | `{ type, columnKey, min?, max? }` | created_at, modified_at, custom_date |
| `StringColumnFilter` | `{ type, columnKey, operator, value }` | title (operators: includes, excludes, startsWith, endsWith, regex) |
| `TagsColumnFilter` | `{ type, columnKey, operator, value }` | tags (operators: has, notHas) |

`NumericColumnFilter` and `DateColumnFilter` bundle both `min` and `max`
into a single object. A filter can have only `min`, only `max`, or both.

## Filter identity — `getFilterKey`

Each filter has a **deterministic composite key** used for
deduplication, upsert matching, and React list keys:

```
numeric/date:  <type>:<columnKey>:<bound-signature>
string/tags:   <type>:<columnKey>:<operator>:<lowercased-value>
```

**Bound signature** for numeric/date is `min`, `max`, `min+max`, or
`none` — depending on which bounds are set. While the **upsert reducer
merges** numeric/date filters per column (so there is always at most
one entry), the bound signature is still used for badge React keys,
`removeLinesFilter`, `setLinesFilters` deduplication, and the
key-migration check in the edit modals.

**String/tags keys include operator + value**, so multiple filters on
the same column with different operators or values can coexist (e.g.,
two `includes` filters for "foo" and "bar").

All string/tags values are **normalized to lowercase** at three
levels:
1. `FilterStringModal` lowercases input on every keystroke (except for
   `regex` operator — case sensitivity is part of the pattern).
2. `upsertFilter` / `setFilters` in the Redux slice normalize on write.
3. `buildLinesWhereClause` applies `LOWER()` in SQL for case-insensitive
   matching.

## Entry points

Filters are created/edited through two paths, both rendered from
`LinesTable.tsx` (and `TagsTable/index.tsx` analogously):

### Path A: Header "+" button or badge tap

```
Header.tsx
  ↓ setEditFilter / setFilterModalVisible
LinesFilterModals (visible, editFilter?)
  ↓
FilterModalsOrchestrator
  ├─ step='selectColumn' → FilterColumnSelectModal (pick column)
  └─ step='editFilter'   → Filter{Type}Modal (edit values)
```

- **New filter** (tapping "+"): `editFilter=undefined` → column pick →
  blank modal.
- **Edit filter** (tapping a badge): `editFilter=<existing filter>` →
  skips column pick, opens modal pre-filled with existing values.

### Path B: Column header long-press

```
TableHeader.tsx long-press → Popover → "Add Filter"
  ↓ ColumnHeaderMenuContext.openFilterForColumn(columnKey)
LinesTable.tsx
  ↓ setColumnFilterInitialKey / setColumnFilterModalVisible
LinesFilterModals (visible, initialColumnKey)
  ↓
FilterModalsOrchestrator
  └─ step='editFilter' → skips column pick, opens blank modal
```

Always starts a **fresh filter** for the column — no preload.

## Orchestrator flow (`FilterModalsOrchestrator.tsx`)

```
┌──────────────┐    select column    ┌──────────────────┐
│ ColumnSelect │ ──────────────────→ │ Filter{Type}Modal │
│   Modal      │                     │                    │
└──────────────┘                     │  onSave → upsert  │
                                     │  onDelete→remove  │
                                     │  onDismiss→close  │
                                     └──────────────────┘
```

State machine: `step` ∈ `{ 'selectColumn', 'editFilter' }`, plus
`selectedColumnKey`, `tempFilter`, and the incoming `editFilter`.

**Key design rule**: For new filters (no `editFilter`), always start
fresh (`tempFilter=undefined`). The `Filter{Type}Modal` receives
`existingFilter = editFilter ?? tempFilter` — so editing a badge
passes the full existing filter, while creating a new filter passes
`undefined`.

## Redux slice (`../../slice.ts`)

| Action | Behavior |
|---|---|
| `upsertLinesFilter` | **Numeric/date**: finds any existing same-column+same-type filter and merges `min`/`max` (new values take precedence, `undefined` falls back to existing). Always at most one filter per numeric/date column. **String/tags**: finds existing by `getFilterKey` composite key → replaces if match, pushes if new. Values lowercased. |
| `removeLinesFilter` | Removes by `getFilterKey` match. |
| `setLinesFilters` | Bulk-load (e.g., from persistence). Normalizes string/tags to lowercase, deduplicates by key. |
| `resetLinesFilters` | Clears all filters. |

`upsertTagsFilter` / `removeTagsFilter` / `setTagsFilters` mirror the
above for the tags table.

## Key migration on edit

When editing an **existing** filter and the resulting key changes
(e.g., changing a string filter's value, adding `max` to a `min`-only
numeric filter, or clearing a previously-set bound), the modal's
save handler detects the key change via `getFilterKey`:

```
if (existingFilter && getFilterKey(existingFilter) !== getFilterKey(newFilter)) {
    onDelete?.();  // remove old entry with old key
}
onSave(newFilter);  // add/upsert new entry with new key
```

This applies to **all four filter types**. It prevents stale entries
from accumulating when a filter's identity changes.

The reducer merge (numeric/date) and key migration (all types) work
together:
- **Adding new bounds** (via "+" button): no `existingFilter`, so the
  reducer merge handles it — `{min:20}` + `{max:1000}` → merged into
  `{min:20, max:1000}`.
- **Editing a badge**: key migration deletes the old entry first, then
  the reducer upserts the new one.
- **Clearing a bound**: key migration is essential here — `undefined`
  in the new filter would fall through `??` in the merge, preserving
  the old value. Deleting the old entry first prevents this.

## SQL translation (`../../db/filterSortHelpers.ts`)

```
filters[] → buildLinesWhereClause(filters, filterLogic)
  ├─ numeric: AND(gte / lte) per filter object
  ├─ date:    AND(gte / lte) per filter object
  ├─ string:  LIKE / NOT LIKE with LOWER() on column value
  ├─ tags:    EXISTS / NOT EXISTS subquery
  └─ combined: AND/OR depending on filterLogic
```

Each filter object produces one SQL condition. Multiple filters on the
same column produce multiple conditions combined by the filter logic
(AND/OR). Min and max bounds within a single filter are ANDed together.

Regex string filters are extracted via `extractRegexFilters()` in
`fetch.ts` and applied in JS (`new RegExp().test()`) when SpatiaLite's
`regexp()` function is unavailable.

**Sole-excludes behavior**: When an `excludes` filter is the only
string filter on the title column, the generated SQL also matches rows
with an empty or NULL title (`OR title IS NULL OR title = ''`). "Does
not contain X" is satisfied by an absent title. If there are multiple
string filters on the column, standard NULL semantics apply.

## Conflict detection (`../../db/filterConflicts.ts`)

Runs in `Header.tsx` via `useMemo`.

Rule (a) is a **single-filter** check — it runs regardless of
`filterLogic` or how many filters exist (a `min > max` range produces
zero results with any logic, since bounds are always ANDed in SQL).
Rules (b)–(e) are **cross-filter** checks and require
`filterLogic === 'and'` plus at least 2 filters.

| Rule | Condition |
|---|---|
| Numeric/date range | `min > max` within a single filter (runs regardless of logic or filter count) |
| String includes+excludes | Same column, same value for both operators |
| String startsWith | Multiple patterns where neither is a prefix of the other |
| String endsWith | Multiple patterns where neither is a suffix of the other |
| Tags has+notHas | Same tag label for both operators |

Conflicts are surfaced as a red warning icon in the header, opening
`FilterConflictModal`. Numeric values in the conflict message are
formatted with the user's unit preferences (km/mi, m/ft).

## Files

| File | Role |
|---|---|
| `FilterModalsOrchestrator.tsx` | State machine: column select ↔ edit modal |
| `FilterNumericModal.tsx` | Min/max numeric input with unit conversion |
| `FilterDateModal.tsx` | Min/max date pickers |
| `FilterStringModal.tsx` | Operator radio + text input |
| `FilterTagsModal.tsx` | Operator radio + tag popover picker |
| `FilterBadge.tsx` | Visual badge for active filters |
| `FilterConflictModal.tsx` | Conflict explanation modal |
| `FilterColumnSelectModal.tsx` | Column picker (in `LinesTable/FilterModals/` and `TagsTable/FilterModals/`; per-table variant) |
| `sharedDeps.ts` | `FilterColumnType` type, `getUnitPrefKey`, `sharedStyles` |

## Entry-point wiring

| Table | FilterModals wrapper | Passes |
|---|---|---|
| LinesTable | `LinesTable/FilterModals/index.tsx` | `selectLinesFilters`, `upsertLinesFilter`, `removeLinesFilter`, `getFilterColumnType`, `FilterColumnSelectModal` |
| TagsTable | `TagsTable/FilterModals/index.tsx` | `selectTagsFilters`, `upsertTagsFilter`, `removeTagsFilter`, `getFilterColumnType`, `TagFilterColumnSelectModal` |
