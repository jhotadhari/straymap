---
description: Sweep the codebase for missing useMemo / React.memo and apply fixes
---

## What this covers

1. **Hooks** — custom hooks returning object literals without `useMemo`
2. **Components** — components receiving object/array props without `React.memo`
3. **Object.values()** — calls in JSX/component render without wrapping `useMemo`
4. **Aggregators** — hooks that compose sub-hooks into a Record without memoizing the Record

## Procedure

### Step 1: Discover source directories

Use Glob to find all directories under `src/` that contain `.ts` or `.tsx` files. Build a list of unique directories. Skip `__tests__` and `node_modules`.

### Step 2: Fan out parallel scans

For each directory, launch a parallel `Task` subagent (`subagent_type: "explore"`) that:

**Hooks scan** — Find custom hooks (functions starting with `use`, e.g. `const useFoo = () => { … }`). For each:
- **hookName**: the function name
- **returnsObjectLiteral**: does it `return { … }`?
- **alreadyMemoized**: is the return wrapped in `useMemo(() => ({ … }), [deps])`?
- **isAggregator**: does this hook call other `useXxx` hooks and merge their returns into a single Record? (Pattern: `const a = useA(); actions[a.key] = a; return actions;`)
- **suggestedDeps**: if not memoized but returns an object, list variable names the values depend on. Trace each value in the returned object back to its definition (props, state, refs, useCallback fns, selectors). Examples: `["cb"]`, `["cb","iconSource","modalNode"]`.
- **notes**: caveats (e.g. "contains Reanimated shared values", "destructured immediately")

**Components scan** — Find React components (functions returning JSX). For each:
- **componentName**: the component name
- **hasReactMemo**: is it already wrapped in `React.memo()`?
- **receivesObjectProps**: does its Props type contain object/array/function-typed fields?
- **hasObjectValuesInRender**: does it call `Object.values(someObject)` directly in JSX without `useMemo`?
- **recommendation**: "add-react-memo" / "add-usememo-to-objectvalues" / "none"
- **notes**: context

Also check **hook aggregator files** — files named `index.ts` inside `useActions/` or `useBulkActions/` directories — note whether their returned Record is wrapped in useMemo.

### Step 3: Apply fixes

For every hook that returns an object literal without useMemo:
- If the file imports from 'react', add `useMemo` to the import
- If not, add `import { useMemo } from 'react';` in the External dependencies block
- Wrap the return: `return useMemo(() => ({ … }), [deps])`
- Preserve existing formatting (tabs, spacing, comment blocks)

For every component needing React.memo:
- Import `memo` from 'react'
- Wrap the export: `export default memo(Foo)` or update existing export

For every Object.values() in JSX without useMemo:
- Wrap in `useMemo(() => Object.values(obj), [obj])`

For every aggregator hook without memoized Record:
- Wrap the returned Record in `useMemo(() => ({ … }), [hook1, hook2, …])`

### Step 4: Verify

```bash
yarn typecheck
yarn lint
```

Ignore pre-existing errors (e.g. `react-native-popover-view/`). Only fix new errors introduced by the sweep.

### Step 5: Report

Summarize:
- How many hooks/components were scanned
- How many fixes were applied (by category)
- Any skipped items with reasons

Do NOT commit. The user will review and commit manually.
