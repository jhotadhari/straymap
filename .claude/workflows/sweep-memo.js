export const meta = {
  name: 'sweep-memo',
  description:
    'Sweep a React/RN codebase for missing useMemo on hook returns, missing React.memo on components, missing useMemo on Object.values() in render, and missing useMemo on hook aggregators.',
  phases: [
    { title: 'Hooks', detail: 'Scan for hooks returning non-memoized object literals' },
    { title: 'Components', detail: 'Scan for components & aggregators missing memo' },
    { title: 'Report', detail: 'Compile all fixable candidates' },
  ],
};

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const HOOK_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      file: { type: 'string' },
      hookName: { type: 'string' },
      returnsObjectLiteral: { type: 'boolean' },
      alreadyMemoized: { type: 'boolean' },
      suggestedDeps: { type: 'array', items: { type: 'string' } },
      isAggregator: { type: 'boolean', description: 'Calls other useX hooks and merges into a Record' },
      notes: { type: 'string' },
    },
    required: ['file', 'returnsObjectLiteral', 'alreadyMemoized'],
  },
};

const COMPONENT_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      file: { type: 'string' },
      componentName: { type: 'string' },
      hasReactMemo: { type: 'boolean' },
      receivesObjectProps: { type: 'boolean', description: 'Any prop typed as an object or array?' },
      hasObjectValuesInRender: { type: 'boolean', description: 'Calls Object.values() in JSX without useMemo?' },
      recommendation: { type: 'string', enum: ['add-react-memo', 'add-usememo-to-objectvalues', 'none'] },
      notes: { type: 'string' },
    },
    required: ['file', 'hasReactMemo'],
  },
};

// ---------------------------------------------------------------------------
// Scan directories
// ---------------------------------------------------------------------------

const SCAN_DIRS = [
  'src/compose',
  'src/components',
  'src/features/lines',
  'src/features/routing',
  'src/features/drawers',
  'src/features/dashboard',
  'src/features/dirs',
  'src/features/appearance',
  'src/features/dbLoader',
  'src/features/general',
  'src/features/ui',
  'src/features/lang',
  'src/features/updater',
  'src/features',
  'src/store',
  'src/lib',
];

// ---------------------------------------------------------------------------
// Track A – Hook analysis (useMemo candidates)
// ---------------------------------------------------------------------------

phase('Hooks');

const hookResults = await parallel(
  SCAN_DIRS.map((dir) => () =>
    agent(
      [
        `You are analyzing a React/React-Native codebase at /home/jhotadhari/Development/android/straymap.`,
        ``,
        `## Task: Find hooks needing useMemo`,
        `1. Search \`${dir}/\` recursively for files defining custom hooks (functions starting with "use", e.g. \`const useFoo = () => { … }\`).`,
        `2. For each hook file, read it and determine:`,
        `   - **hookName**: the function name`,
        `   - **returnsObjectLiteral**: does it \`return { … }\` (an object literal)?  If it returns a primitive, array, function, or nothing → false.`,
        `   - **alreadyMemoized**: is that returned object wrapped in \`useMemo(() => ({ … }), […])\`?`,
        `   - **suggestedDeps**: if NOT memoized but returns an object, list the variable names the object's values depend on. Look at the values inside the returned object and trace them back to their definitions (props, state, refs, useCallback fns, selectors, etc.).  Examples: \`["cb"]\`, \`["cb","iconSource","modalNode"]\`, \`["infos"]\`, \`["isToggling","handleToggleRouting"]\`.  If unsure, use [] and add a note.`,
        `   - **isAggregator**: does this hook call other \`useXxx\` hooks and merge their returned objects into a single Record?  (Pattern: \`const a = useA(); actions[a.key] = a; return actions;\`)`,
        `   - **notes**: any caveats (e.g. "contains Reanimated shared values", "destructured immediately so low priority").`,
        `3. Skip __tests__ and node_modules.  If dir has no hooks, return [].`,
        ``,
        `Return via StructuredOutput.`,
      ].join('\n'),
      { label: `hooks:${dir}`, schema: HOOK_SCHEMA, effort: 'low' }
    )
  )
);

// ---------------------------------------------------------------------------
// Track B – Component / consumer analysis (React.memo + Object.values candidates)
// ---------------------------------------------------------------------------

phase('Components');

const componentResults = await parallel(
  SCAN_DIRS.map((dir) => () =>
    agent(
      [
        `You are analyzing a React/React-Native codebase at /home/jhotadhari/Development/android/straymap.`,
        ``,
        `## Task: Find components needing React.memo and Object.values() needing useMemo`,
        `1. Search \`${dir}/\` recursively for files defining React components (functions returning JSX, either \`const Foo: FC<…> = …\` or \`function Foo(…)\`).`,
        `2. For each component file, read it and determine:`,
        `   - **componentName**: the component name`,
        `   - **hasReactMemo**: is it already wrapped in \`React.memo()\` or \`memo()\`?`,
        `   - **receivesObjectProps**: does its Props type contain any object/array/function-typed fields? (These benefit from memo since shallow comparison can bail out.)`,
        `   - **hasObjectValuesInRender**: does it call \`Object.values(someObject)\` directly in JSX without wrapping in \`useMemo\`?  Look for patterns like \`{Object.values(actions).map(…)}\` or \`<Comp options={Object.values(x)} />\`.`,
        `   - **recommendation**: "add-react-memo" if the component receives object props and isn't memo'd; "add-usememo-to-objectvalues" if it calls Object.values in JSX; "none" otherwise.`,
        `   - **notes**: any context about why/why not memo (e.g. "already uses useMemo on the array, just needs React.memo on the component").`,
        `3. Also scan for **hook aggregator files** — files named \`index.ts\` inside \`useActions/\` or \`useBulkActions/\` directories — and note whether their returned Record is wrapped in useMemo. Report these as components with recommendation "add-usememo-to-aggregator".`,
        `4. Skip __tests__ and node_modules.  If dir has no components, return [].`,
        ``,
        `Return via StructuredOutput.`,
      ].join('\n'),
      { label: `comps:${dir}`, schema: COMPONENT_SCHEMA, effort: 'low' }
    )
  )
);

// ---------------------------------------------------------------------------
// Compile report
// ---------------------------------------------------------------------------

phase('Report');

const allHooks = hookResults.filter(Boolean).flat().filter(Boolean);
const allComps = componentResults.filter(Boolean).flat().filter(Boolean);

const hookNeedsFix = allHooks.filter((h) => h.returnsObjectLiteral && !h.alreadyMemoized);
const hookAlready = allHooks.filter((h) => h.returnsObjectLiteral && h.alreadyMemoized);
const hookNonObj = allHooks.filter((h) => !h.returnsObjectLiteral);

const compNeedsMemo = allComps.filter((c) => c.recommendation === 'add-react-memo');
const compNeedsUseMemo = allComps.filter((c) => c.recommendation === 'add-usememo-to-objectvalues');
const compNeedsAggMemo = allComps.filter((c) => c.recommendation === 'add-usememo-to-aggregator');
const compOk = allComps.filter((c) => c.recommendation === 'none');

log(
  [
    `## sweep-memo report`,
    ``,
    `### Hooks`,
    `| Category | Count |`,
    `|----------|-------|`,
    `| Total found | ${allHooks.length} |`,
    `| Return objects, already memoized | ${hookAlready.length} |`,
    `| Return objects, **NEED useMemo** | ${hookNeedsFix.length} |`,
    `| Return non-objects (skip) | ${hookNonObj.length} |`,
    ``,
    hookNeedsFix.length
      ? `#### Need useMemo\n${hookNeedsFix.map((h) => `- \`${h.file}\` — \`${h.hookName}\` — deps: [${(h.suggestedDeps || []).join(', ')}]${h.isAggregator ? ' ⚡ aggregator' : ''}${h.notes ? ` (${h.notes})` : ''}`).join('\n')}`
      : '#### All hook returns are memoized ✅',
    ``,
    `### Components & Consumers`,
    `| Category | Count |`,
    `|----------|-------|`,
    `| Total found | ${allComps.length} |`,
    `| **NEED React.memo** | ${compNeedsMemo.length} |`,
    `| **NEED useMemo on Object.values()** | ${compNeedsUseMemo.length} |`,
    `| **NEED useMemo on aggregator Record** | ${compNeedsAggMemo.length} |`,
    `| Already memoized / no action | ${compOk.length} |`,
    ``,
    compNeedsMemo.length
      ? `#### Need React.memo\n${compNeedsMemo.map((c) => `- \`${c.file}\` — \`${c.componentName}\`${c.notes ? ` (${c.notes})` : ''}`).join('\n')}`
      : '',
    compNeedsUseMemo.length
      ? `#### Need useMemo on Object.values()\n${compNeedsUseMemo.map((c) => `- \`${c.file}\` — \`${c.componentName}\`${c.notes ? ` (${c.notes})` : ''}`).join('\n')}`
      : '',
    compNeedsAggMemo.length
      ? `#### Need useMemo on aggregator Record\n${compNeedsAggMemo.map((c) => `- \`${c.file}\` — \`${c.componentName}\`${c.notes ? ` (${c.notes})` : ''}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
);

return {
  hooks: { total: allHooks.length, needsFix: hookNeedsFix, already: hookAlready, nonObj: hookNonObj },
  components: { total: allComps.length, needsReactMemo: compNeedsMemo, needsUseMemoOnObjectValues: compNeedsUseMemo, needsUseMemoOnAggregator: compNeedsAggMemo, ok: compOk },
};
