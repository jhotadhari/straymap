# Roadmap

Deferred ideas and larger decisions that are out of scope for the current work, kept here so they aren't lost.

## Performance

- **Adopt React Compiler** — viable now (React 19 / RN 0.79.1). Would auto-memoize components/values, replacing most manual `useCallback`/`useMemo` (currently ~250+ calls across ~124 files) with compiler-inferred memoization, and could remove the need to hand-add `React.memo` to leaf components. Setup is small (babel plugin + eslint plugin, mind plugin ordering relative to `react-native-reanimated/plugin`); real effort is on-device verification of map/drawer/gesture-heavy components, since it has opt-in per-file rollout (`"use memo"` / `compilationMode: "annotation"`) to de-risk. Estimated ~1-2 days for a careful rollout.
- **React.memo on leaf components** — separate, smaller-grained alternative/complement to the above.
- **Swap list implementations** — e.g. FlashList for long lists (LinesTable, PointsList, etc.), if profiling shows list rendering as a bottleneck.
- **Atomic state** — revisit Redux slice granularity if re-render cost from broad state subscriptions becomes a measured problem.
