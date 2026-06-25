# DB improvement plan (branch: `feature/dbImprove`)

This branch is dedicated to hardening the CRUD layer documented in
[`README.md`](./README.md) in this directory. It follows on from a
security/correctness review that fixed four tag-linking bugs in
`lines/db/actionsLine.ts` (commit `780dd16`: broken `forEach(async ...)` usage
in `createLines`/`updateLine`, an inverted tag-removal condition in
`updateLine`, and a wrong existence check in `lineAddTag`). That review
surfaced three further issues, tracked here with concrete plans.

No SQL injection risk was found — drizzle parameterizes everything, including
the custom `lineString()`/`point()` geometry columns. See `README.md` for the
full architecture writeup.

## Status

- [ ] #1 Consistent error handling on update/delete functions
- [ ] #2 Orphaned `tags_to_lines` rows on delete
- [ ] #3 No db transactions on multi-statement writes

(Numbered in suggested work order — see "Suggested order of work" below for why.)

---

## Issue 1: Inconsistent error handling on update/delete

Functions with **no** try/catch/log/toast today: `updateTag`, `updateRoute`,
`updateRoutingPoint`, `lineAddTag`, `lineRemoveTag`, `deleteLine`,
`deleteLines`, `deleteTag`, `deleteRoute`, `deleteRoutingPoint`. The four
`create*` functions and `updateLine` already follow the pattern (try/catch +
`logError` + `showErrorToast` + rethrow), added when the app-wide error-toast
system was introduced.

None of the unhandled functions currently swallow errors — they have no
try/catch at all, so drizzle errors already propagate as rejected promises.
Adding the pattern is purely additive (log + toast on top of the existing
rejection), it doesn't change what callers observe on failure.

### Steps

1. Extract a small wrapper instead of copy-pasting the same 4-line try/catch
   block 10 more times (15 total across the db layer). Put it in
   `dbLoader/utils.ts` next to `logError`:
   ```ts
   const withDbErrorHandling = <Args extends any[], T>(
       context: string,
       fn: (...args: Args) => Promise<T>
   ) =>
       async (...args: Args): Promise<T> => {
           try {
               return await fn(...args);
           } catch (error) {
               logError(context, error);
               showErrorToast(
                   sprintf(i18n.t('errorGeneric'), (error as Error)?.message ?? String(error))
               );
               throw error;
           }
       };
   ```
2. Wrap all 10 functions listed above with it, e.g.
   `export const updateTag = withDbErrorHandling('lines/actionsTag.updateTag', async (id, newTag) => {...})`.
3. Optionally retrofit the existing 5 (`createLines`, `createTags`,
   `createRoutes`, `createRoutingPoints`, `updateLine`) to use the same
   wrapper instead of inline try/catch, for one consistent pattern.
4. `yarn typecheck` / `yarn lint`.
5. Smoke-test a few failure paths if feasible (e.g. temporarily reference a
   bad column to force an error and confirm the toast fires), otherwise just
   confirm success paths are unaffected.

---

## Issue 2: Orphaned `tags_to_lines` rows on delete

`deleteLine`/`deleteTag` only delete from `lines`/`tags` (there's already a
`// ??? do that with schema` comment admitting the gap in `actionsLine.ts`),
and the FK in `drizzle/0000_elite_nitro.sql` is `ON DELETE no action` — SQLite
won't clean up for you. Every line/tag delete leaves a dangling row in
`tags_to_lines`. Not a wrong-join risk (ids are autoincrement, never reused),
but unbounded storage growth and a footgun for any future `COUNT`/stats query
over that table.

### Open question (decide before/while implementing)

Two ways to fix it:
- **Schema-level cascade** (recommended): add `{ onDelete: 'cascade' }` to
  both FKs on `tagsToLinesTable` (already sketched/commented out in
  `lines/db/schema/schema.ts`).
- **App-level cleanup**: explicitly delete from `tagsToLinesTable` inside
  `deleteLine`/`deleteLines`/`deleteTag`, mirroring what `deleteRoute` already
  does for `routingPointsTable`. Cheaper short-term, but it's the same
  "remember to do this everywhere" pattern that caused the gap in the first
  place.

This also surfaces a related, separate product question: should deleting a
`line` cascade-delete its `route` (via `routesTable.line_id`, currently
nullable with no `onDelete`)? Or should the route's `line_id` just be set to
null? **Needs a decision before touching the routing-side schema** — not just
plumbing, it's a product behavior call.

### Steps

1. Decide cascade-vs-manual for `tags_to_lines`, and decide the line→route
   question above.
2. Update the FK definitions in `lines/db/schema/schema.ts` (and
   `routing/db/schema/schema.ts` if the line→route question calls for it).
3. Run `yarn drizzle-kit generate`, review the generated migration SQL
   (SQLite can't `ALTER` an FK in place, so expect a table-rebuild migration:
   create new table, copy rows, drop old, rename — worth checking it's
   correct before applying). Per existing project convention, no need to
   preserve data carefully — the db is dummy data only at this stage.
4. Remove the now-stale `// ??? do that with schema` comments in
   `deleteLine`/`deleteLines`.
5. Manual check: create a line + tag + relation, delete the line, confirm
   `tags_to_lines` has no leftover row (ad-hoc query, similar to the existing
   `DebugBla.tsx` debug-helper pattern).

---

## Issue 3: No db transactions on multi-statement writes

Where it bites today:
- `createLines`: inserts a line, then separately inserts `tagsToLinesTable`
  rows. If the second step throws, the line is left committed with no tags.
- `updateLine`: updates the line row, then runs separate add/remove
  tag-relation queries.
- `createRoutingPoints`: inserts a point, then separately calls `updateRoute`
  to rewrite `point_order`. If that update fails, the point exists but isn't
  in the route's order.
- `deleteRoute`: deletes `routing_points` rows, then deletes the `routes`
  row — two independent statements.

### Important finding: drizzle's op-sqlite transaction may not be safe to rely on

Reading `node_modules/drizzle-orm/op-sqlite/session.js`'s `transaction()`
method (drizzle-orm `0.45.2`, op-sqlite `16.1.0` — see `package.json`):

```js
transaction(transaction, config = {}) {
  const tx = new OPSQLiteTransaction(...);
  this.run(sql.raw(`begin...`));   // not awaited
  try {
    const result = transaction(tx); // if your callback is async, this is a
                                     // Promise, not awaited
    this.run(sql`commit`);          // fires immediately, before the body
                                     // actually finishes
    return result;
  } catch (err) {
    this.run(sql`rollback`);        // can't catch errors from an unawaited
                                     // async callback
    throw err;
  }
}
```

`run()` returns a promise (op-sqlite is fully async) but nothing here
`await`s it. So `commit` can fire before the inserts inside an
`async (tx) => {...}` callback actually complete, and an error thrown inside
that callback becomes an unhandled rejection the `catch` block never sees.
**This must be verified before being relied on** — it's exactly the kind of
thing that looks fine in casual testing and silently isn't atomic.

### Steps

1. **Spike/verify first**: write a throwaway test/script that opens a
   transaction via `dbConnection.drizzle.transaction(async (tx) => {...})`,
   inserts a row, then throws inside the callback, and checks afterward
   whether the row persists. This tells us definitively whether `.transaction()`
   is safe here.
2. **If broken** (likely, per the read above): build a thin transaction
   helper on top of the *native* op-sqlite transaction API instead —
   `dbConnection.op.transaction(async (tx) => { await tx.execute(sql, params); ... })`,
   which is genuinely async and is already used safely in `dbOpExecute`
   (`dbLoader/utils.ts`). Get the parameterized SQL out of drizzle via
   `db.insert(...).values(...).toSQL()` (`{ sql, params }`) and run it through
   `tx.execute(sql, params)` instead of `await db.insert(...)`.
3. **If it turns out to work**: wrap each multi-statement action body in
   `dbConnection.drizzle.transaction(async (tx) => {...})`, swapping
   `dbConnection.drizzle.insert/update/delete` for `tx.insert/update/delete`
   inside.
4. Apply to the four call sites above, in this order (simplest first):
   `deleteRoute` → `createRoutingPoints` → `createLines` → `updateLine`.
5. Re-test each affected flow manually (create a line with tags, edit a
   route, delete a route) since this changes execution semantics even when
   the end result looks the same.

---

## Suggested order of work

1. **Issue 1** first — low risk, mechanical, makes failures visible while we
   touch the riskier stuff below.
2. **Issue 2** next — needs a schema/product decision, then a migration.
3. **Issue 3** last — needs the transaction-safety spike, and benefits from
   issue 2's cascade semantics already being settled.
