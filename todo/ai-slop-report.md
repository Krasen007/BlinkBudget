# AI Slop Report — `src/views/` (REMAINING WORK)

**Original audit date:** 2026-09-25 · **Phases 1–3 completed:** 2026-09-26
**Guide:** [`ai-slop-inspection-guide.md`](ai-slop-inspection-guide.md)
**Original scope:** `src/views/` — 17 `.js` files, 9,252 lines (incl. `src/views/financial-planning/`)
**Method:** Rule-by-rule sweep with `rg`, then per-finding line re-derivation and a repo-wide
grep for every "dead" claim.

> **This file now lists only what is still outstanding.** The 17 findings fixed in Phases 1–3 have
> been removed; they are summarised in [Completed work](#completed-work--phases-13) at the bottom
> so a future session knows they were addressed and does not re-file them.
> **All line numbers below were re-derived against the post-Phase-3 tree** — they are current.

## Executive summary

**7 findings remain**, down from 23. No user-facing correctness defects are outstanding: the
report's single headline bug (the unreachable "approximate data" banner) is **fixed and covered by
a regression test**.

| Bucket                    | Count | Findings                                                            |
| ------------------------- | ----- | ------------------------------------------------------------------- |
| **User Review Required**  | 3     | #2.5 (🔒), #4.2, #6.1 — need a human decision, not an automatic fix |
| **Own follow-up**         | 1     | #14.1 file bloat — must not be bundled with a cleanup               |
| **Deferred**              | 1     | #7.2 — deliberately not scheduled                                   |
| **Confirmed intentional** | 2     | #2.4, #2.6 — re-confirmed correct as written, no change recommended |
| ~~Done~~                  | 17    | Phases 1–2 (11) + cosmetic batch (6)                                |

### Severity of what remains

There are **no user-facing correctness defects left.** Both 🔴 items that remain are dead code
rather than broken behaviour: #4.2 is a function nobody calls, and #2.5 is a 🔒 branch that is
never reached today — which is precisely why it must not be "fixed" on grep evidence alone.

| Severity  | Count | Findings                                                                                          |
| --------- | ----- | ------------------------------------------------------------------------------------------------- |
| 🔴 High   | 2     | #2.5 (🔒, never auto-remediated), #4.2 (uncalled dead code) — **neither is a user-facing defect** |
| 🟡 Medium | 2     | #6.1, #7.2, #14.1                                                                                 |
| ⚪ Low    | 2     | #2.4, #2.6 (both confirmed intentional — no action)                                               |

### Suggested next step

The **cosmetic batch is done** (Phase 3). The next decision point is the three **User Review
Required** items — they need a decision from you before any code moves; they are the only
findings where acting without confirmation would be wrong. Of those, **#2.5 is the one worth
thinking about on its merits**: a stale planning cache surviving a user switch is a cross-user
data bleed, and "we can't prove it's reachable" is not the same as "it can't happen."

---

## User Review Required

Per the guide, these are **never bundled into a numbered phase** and are never auto-remediated.
They are listed first because they block nothing but are the only items requiring judgement.

#### #2.5 — Empty `catch {}` around a cache invalidation 🔒 🔴 High

- **Rule #:** 2
- **File:** `src/views/DashboardView.js`
- **Line(s):** 1248–1252 (inside `handleAuthChange`, which starts at line 1242)
- **Severity:** 🔴 High 🔒 Security-sensitive
- **Snippet:**

```js
try {
  analyticsCache.invalidate('financial_planning_preload');
} catch {
  // ignore cache errors
}
```

- **Verdict:** slop
- **Action:** **flagged for author confirmation** — 🔒, never auto-remediated
- **Why it is not safely silent:** it looks identical to #2.4 but is not. The block runs inside an
  **authentication state transition**. If `invalidate` throws, the cache key
  `financial_planning_preload` survives the user switch, and `preloadFinancialPlanningData`
  (line 105 defines the key) short-circuits on `if (analyticsCache.get(cacheKey))`, serving the
  **previous user's** planning data. That is a cross-user data bleed on a shared device, not a
  missing banner.
- **Open question for you:** can `analyticsCache.invalidate` actually throw? Its `JSON.parse` of a
  corrupt persistent entry (`AnalyticsCache.js` `_getFromStorage`) is the likely source. If it
  cannot throw, the `try/catch` can go. If it can, the fix is a `console.warn` so the condition is
  diagnosable — **not** a silent swallow, and **not** a removal on grep evidence alone.
- **Note:** "no code path reaches this branch today" is not authorization for a 🔒 change.

#### #4.2 — `checkDataIntegrity` is exported but never called 🔴 High

- **Rule #:** 4
- **File:** `src/views/ReportsView.js`
- **Line(s):** 1552–1584 (definition), 1643 (export onto `container`)
- **Severity:** 🔴 High
- **Snippet:**

```js
  function checkDataIntegrity() {
    try {
      const transactions = TransactionService.getAll();
      const accounts = AccountService.getAccounts();
      const accountIds = new Set(accounts.map(acc => acc.id));
      const orphanedTransactions = transactions.filter(
        t => t.accountId && !accountIds.has(t.accountId)
      );
```

- **Verdict:** slop
- **Action:** **User Review Required** — irreversible deletion of unreplaceable diagnostic logic
- **Evidence (re-verified 2026-09-26):** repo-wide grep for `checkDataIntegrity` returns only its
  own definition (line 1552) and its own assignment to `container` (line 1643). Zero callers in
  `src/`, zero in `tests/`.
- **Why High despite being pure dead code — because of _what_ it does:** this is an
  orphaned-transaction detector. `DashboardView.js:461–466` shows the team already knows this class
  of corruption occurs in practice (dedicated guard + explanatory comment). The detector was
  written, wired to a public API, and never invoked. The knowledge encoded in it is currently lost.
- **Also dead in the same block:** `container.getCurrentData` (line 1644) and
  `container.getCurrentTimePeriod` (line 1645) — zero callers repo-wide.
  `container.refreshData` (line 1642) is **not** dead: `refreshData()` is called internally for
  the Ctrl+R shortcut. Only the three above are orphans.
- **Fix direction — your call:** either wire `checkDataIntegrity()` into a diagnostics path, or
  delete all three. Do not leave them exported "just in case"; they are the kind of orphan that
  hides the fact that the underlying problem is unmonitored.
- **If you delete:** no test references any of the three, so nothing breaks — but re-grep for newly
  orphaned imports afterwards (rule #4, step 5). `AccountService` is used elsewhere in this file,
  so that import survives.

#### #6.1 — Debounced no-op registered as a resize listener 🟡 Medium

- **Rule #:** 6, 3
- **File:** `src/views/FinancialPlanningView.js`
- **Line(s):** 505–507 (definition), 510 (registration), 610 (removal), 619 (call)
- **Severity:** 🟡 Medium
- **Snippet:**

```js
const updateResponsiveLayout = debounce(() => {
  // Shared title update etc
}, TIMING.DEBOUNCE_RESIZE);
```

- **Verdict:** slop
- **Action:** **User Review Required** — may be a missing feature, not dead code
- **Proof of deadness:** the arrow function body is empty apart from a comment (checklist item 2) —
  it cannot do anything, so no device testing or `git blame` can overturn it. Yet the `debounce`
  wrapper, the listener registration, the initial call, and the teardown line all exist to invoke
  an empty function on every resize.
- **The question:** compare the sibling view — `ReportsView.js` has an `updateResponsiveLayout` of
  the same name with a real ~49-line body. This one looks like a stub never filled in, kept alive
  by a comment describing the work that was planned. **Confirm whether responsive behaviour for
  this view is genuinely complete.** If it is not, the empty body _is_ the bug and this is a
  feature ticket, not a deletion — deleting it would remove the scaffolding the feature would
  slot into.

---

## Own follow-up — never bundle with a cleanup

#### #14.1 — Eight of seventeen files exceed the 500-line convention 🟡 Medium

- **Rule #:** 14
- **File:** `src/views/` (directory-level)
- **Line(s):** n/a
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** own follow-up — per the guide, do **not** bundle a split-file refactor into an
  unrelated slop-cleanup change
- **Line counts re-measured 2026-09-26** (post-Phase-3; Phases 1–3 made some files slightly
  _longer_, because each fix carries an explanatory comment, while the cosmetic batch trimmed a few):

```
   1639  src/views/ReportsView.js                     (3.3x the limit)
   1298  src/views/DashboardView.js                   (2.6x)
   1069  src/views/financial-planning/GoalsSection.js (2.1x)
    670  src/views/financial-planning/InvestmentsSection.js
    619  src/views/FinancialPlanningView.js
    603  src/views/LoginView.js
    590  src/views/financial-planning/ForecastsSection.js
    553  src/views/LandingView.js
    470  src/views/SettingsView.js
    466  src/views/financial-planning/OverviewSection.js
    404  src/views/financial-planning/BudgetsSection.js
    238  src/views/financial-planning/insights-movers-timeline.js
    219  src/views/EditView.js
    172  src/views/financial-planning/InsightsSection.js
    146  src/views/financial-planning/insights-recurring.js
    130  src/views/AddView.js
    108  src/views/financial-planning/insights-takeaways.js
```

- **Note:** the convention is `AGENTS.md`'s 500-line guideline. `ReportsView.js` at 1,639 lines is
  the outlier and was implicated in four of the original audit's High findings (#4.1, #4.2, #10.1,
  #10.2) — a concrete illustration of the guide's claim that bloat correlates with accumulated
  dead code and complex control flow. **Phases 1–3 flattened the worst control flow in that file
  (the validate → sanitize → re-validate chain) and the cosmetic batch trimmed 12 more lines, but
  none of that is a structural fix**; #4.2 will remove roughly 35 lines if you choose deletion.
  The structural work is still a split, not a trim.
- **The pattern already exists:** `insights-takeaways.js`, `insights-recurring.js` and
  `insights-movers-timeline.js` are each under 240 lines and each carry a header comment explaining
  they were "extracted … to maintain file size constraints." **`GoalsSection.js` (1,069) and
  `InvestmentsSection.js` (670) sit in that same directory and were not split** — the extraction
  pattern exists one directory over and was simply not applied. That is the cheapest place to
  start.

---

## Deferred

#### #7.2 — Same operation, two different structures across sibling views 🟡 Medium

- **Rule #:** 7
- **File:** `src/views/DashboardView.js` (lines 358–382); `src/views/EditView.js` (lines 196–213)
- **Severity:** 🟡 Medium
- **Snippet:**

```js
    import('../components/ConfirmDialog.js').then(({ ConfirmDialog }) => {
```

- **Verdict:** slop
- **Action:** **deferred** — "currently equivalent; will drift on first fix"
- **Note:** both views implement "confirm a delete, then offer undo" with different import
  mechanics — `DashboardView` spreads an array of removed entries, `EditView` handles a single
  `removed` value — and **neither wraps the outer `import()` in error handling at all**. An
  unhandled chunk-load failure yields silence. Behaviourally equivalent today. Low urgency;
  flagged so it is a _known_ divergence rather than a surprise. Fix when either is next touched.

#### #2.6 — Failed dynamic import of the undo module is console-only ⚪ Low

- **Rule #:** 2
- **File:** `src/views/DashboardView.js` (lines 377–379); `src/views/EditView.js` (lines 207–209)
- **Severity:** ⚪ Low
- **Verdict:** **intentional (confirmed with author)**
- **Action:** left as-is (reason: the delete already succeeded; undo is an optional enhancement)
- **Note:** the transaction _is_ deleted by this point. The undo affordance failing to load is a
  degraded-but-successful outcome, and the user is not left believing data was lost. Mirrors the
  documented warn-only contract in `view-preloader.js` (lines 42–48). **No change recommended.**

---

## Confirmed intentional — no action

#### #2.4 — Empty `catch {}` around the progress-unlock card ⚪ Low

- **Rule #:** 2
- **File:** `src/views/financial-planning/InvestmentsSection.js`
- **Line(s):** ~592–594
- **Severity:** ⚪ Low
- **Snippet:**

```js
  } catch {
    // Non-critical — silently fail
  }
```

- **Verdict:** **intentional (confirmed with author)**
- **Action:** left as-is (reason: wraps only the progressive-unlock hint card)
- **Note:** re-examined under checklist item 7. The wrapped block renders an _advisory_ card only;
  the investment form and list are constructed after it and are unaffected. A failure here costs an
  informational banner, not data or function. Unlike `DashboardView.js:1248` (#2.5) there is no
  plausible path to corruption. **Correctly silent — no change recommended.**

---

## Rules with no findings (original round)

Recorded so a future round knows these were checked, not skipped. A post-remediation re-check
found no regressions in any of them.

| Rule                               | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#8** Side effects at module load | **Clean.** No `src/views` module touches the DOM or registers a listener at import time. `DashboardView.js`'s preload helpers and `FinancialPlanningView.js`'s cache wrappers are all function-scoped; the only module-scope state is four inert `let` flags. No `<style>` injection in any `const` initializer.                                                                                                                                                                                              |
| **#12** Type-safety theater        | N/A — the project is plain `.js`; there is no TypeScript to audit.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **#13** Framework-specific slop    | N/A — vanilla JS with functional components; no React hooks, keys, or `useState` anywhere in scope.                                                                                                                                                                                                                                                                                                                                                                                                           |
| **#1** (partial)                   | Only 2 comment findings across ~9,252 lines. Most comments in this directory are genuinely informative — e.g. `DashboardView.js:461–465` (why the stale account filter is normalized), `insights-recurring.js:75–78`, `insights-takeaways.js:81–83`. **This is not a comment-noise directory**, and a future round should not assume otherwise.                                                                                                                                                               |
| **#9** Duplicated logic            | One candidate found and **deliberately not written up**: `createHeader()` is near-identical in `ReportsView.js`, `FinancialPlanningView.js` and `SettingsView.js` (back button + title + `createNavigationButtons`). The variants differ in which section is highlighted, `innerHTML` vs `textContent` for the arrow, and whether the time selector is nested in, so a shared helper would need parameters for all three. Filing it would be padding the report. Worth a design conversation, not a slop fix. |

---

## Completed work — Phases 1–3

Removed from the active backlog. **Do not re-file these.**

### Phase 1 — user-visible correctness

| #                | Finding                                               | Resolution                                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4.1             | `isFallback` never set → banner unreachable           | `createMinimalAnalyticsData` now sets `isFallback: true` (`src/utils/reports-utils.js`). Regression test in a **new** suite.                                                                            |
| #5.1             | `var(--token, literal)` where the token doesn't exist | Reused `reports-ui.js`'s existing `WARNING_TINT`/`WARNING_BORDER` (`color-mix` over real `--color-warning`) — **no new tokens added**. `GoalsSection`'s `var(--color-on-error, #fff)` → honest literal. |
| #10.2            | `throw` for a shape check                             | Split the `Array.isArray` check out of the `try`; a bad shape is no longer reported to the user as a storage error.                                                                                     |
| #3.1             | Dead `Router` guard                                   | Direct call, matching 4 other sites in the same file.                                                                                                                                                   |
| #2.1, #2.2, #7.1 | Swallowed / drifted write failures                    | Normalized on `console.error` + `showErrorToast(...)` across `GoalsSection`, `InvestmentsSection`, and `BudgetsSection` (new `attemptWrite` helper — it previously had no `catch` at all).              |
| #3.2             | (cross-ref of #4.1)                                   | Resolved with #4.1.                                                                                                                                                                                     |

### Phase 2 — pipeline cleanup

| #     | Finding                              | Resolution                                                                                                             |
| ----- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| #10.1 | Validation-as-control-flow           | `validateAnalyticsData` returns `{ valid, errors }`; the try-nested-in-catch-nested-in-try is now straight-line `if`s. |
| #10.3 | Rethrow discarded `minimalDataError` | Chained onto the original error so both survive for diagnosis.                                                         |
| #2.3  | Portfolio failure → misleading €0.00 | Renders an explicit "totals unavailable" notice instead of a plausible-looking wrong number.                           |

### Defects found during remediation that were **not** in the original report

Recorded because they were real, and because the same class may exist elsewhere:

1. **`sanitizeAnalyticsData` threw on exactly the inputs it existed to repair.** It dereferenced
   `sanitized.incomeVsExpenses.totalIncome` unguarded, so the validate → sanitize → re-validate
   recovery could not work for the two most likely failure modes. Now total. _Proven by revert:_
   restoring the blind read fails with `TypeError: Cannot read properties of undefined`.
2. **`validateAnalyticsData` had a latent throw of its own** — the NaN probe read through an
   `incomeVsExpenses` block an earlier check could have bypassed. Now guarded with `else if`.
3. **`showErrorToast(message, options)` was being called as `showErrorToast(msg, err)`** in at
   least one place the original report cited as the _correct_ reference (`GoalsSection.js:617`), so
   the error was passed as `options` and **never logged** despite a comment claiming it was.
   Fixed, and the pattern normalized on the genuinely-clean example (`AddView.js:89-90`) instead.
4. **A test mock would have silently broken under the #10.1 contract change** —
   `reports-view.test.js` mocked `validateAnalyticsData: () => ({ isValid: true })`, a key that
   never existed in the real contract. Under the new call site `valid` reads as `undefined` →
   falsy → every render would have gone down the sanitize path. Updated to
   `{ valid: true, errors: [] }`.

### Tests added

- `tests/views/reports-view-fallback.test.js` — 3 tests. Lives in its **own** file because
  `reports-view.test.js` mocks away the very producer under test (testing trap #1). Covers the
  reachable banner, the no-warning path, and recovery from a malformed payload.
- `tests/utilities/reports-utils-validation.test.js` — 9 tests covering the new
  `{ valid, errors }` contract and the repaired sanitizer.

**Baseline at the end of Phase 2:** 60 tests across the reports/financial-planning views pass;
`tests/system/design-tokens.test.js` passes 12/12 (the production-purge guard still holds);
`yarn run check` is green (0 lint errors — the remaining 86 warnings are pre-existing and sit in
files untouched by the remediation); `yarn run build` succeeds.

### Phase 3 — cosmetic batch

| #    | Finding                              | Resolution                                                                                                                                                                                                                                                                                                                      |
| ---- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1.1 | Placeholder comments for absent code | Deleted `// ... remaining state logic ...` and `// ... (imports)` (`ReportsView.js`), and the two false "is now imported" signposts in `FinancialPlanningView.js` — nothing in that file calls either function.                                                                                                                 |
| #1.2 | ASCII-art `UI OF APP` banner         | Deleted. The `* Render beautiful charts with progressive loading` fragment directly beneath it was **orphaned markup**, not a valid comment, and was removed with it.                                                                                                                                                           |
| #4.3 | Empty `if` kept only for a comment   | Removed the `.reports-header-container` lookup and guard. Per the finding's instruction, the archaeology note was **moved** to the `headerContainer` construction site in `createHeader()` rather than deleted.                                                                                                                 |
| #5.2 | Hardcoded rgba risk-level palette    | Replaced the nested ternary with a `RISK_LEVEL_STYLES` lookup map. Each entry pairs a `color-mix()` tint with the **same** token used for the border, so fill and border cannot desynchronise. Follows `reports-ui.js`'s established pattern.                                                                                   |
| #5.3 | Hardcoded modal overlay/size/shadow  | **Partial fix, as specified.** `maxWidth: '400px'` → `var(--modal-max-width)` and `boxShadow` → `var(--shadow-xl)` (both exact-value matches). **`zIndex: '1000'` deliberately left** — `--z-index-modal` is defined in no stylesheet — now with a comment recording why, so a later pass does not "fix" it on a false premise. |
| #5.4 | `escapeHtml` on string literals      | The three static occurrences became `createElement` + `textContent`. **`escapeHtml(CURRENT_VERSION)` was kept** — that one interpolates a real variable, and `AGENTS.md` forbids unescaped `innerHTML`. The import survives on that use.                                                                                        |

**Line 506 (`FinancialPlanningView.js`) was deliberately left alone.** It is the entire body of the
empty `updateResponsiveLayout` — the evidence #6.1 needs — so it was not deleted as part of #1.1.

**Baseline at the end of Phase 3:** 51 tests pass across `tests/views`, `tests/financial-planning`
and `tests/system/design-tokens.test.js` (the production-purge guard still holds at 12/12);
ESLint reports **0 errors** on all five touched files (5 `no-raw-style-values` warnings, all
pre-existing — confirmed identical by stashing); `yarn run build` succeeds.

---

## Traceability

Every finding has a destination. Nothing is silently dropped.

| Finding                            | Severity | Status                                                               |
| ---------------------------------- | -------- | -------------------------------------------------------------------- |
| #2.5 `catch {}` in auth handler    | 🔴 🔒    | **User Review Required** — security-sensitive, never auto-remediated |
| #4.2 `checkDataIntegrity` orphaned | 🔴       | **User Review Required** — author decides wire-up vs delete          |
| #6.1 debounced empty function      | 🟡       | **User Review Required** — may be a missing feature                  |
| #14.1 file bloat                   | 🟡       | **Own follow-up** — never bundled with cleanup                       |
| #7.2 delete/undo divergence        | 🟡       | **Deferred** — currently equivalent; will drift on first fix         |
| #2.4, #2.6                         | ⚪       | **Confirmed intentional** — no change recommended                    |
| #1.1, #1.2, #4.3, #5.2, #5.3, #5.4 | ⚪       | ~~Cosmetic batch~~ — **done in Phase 3**                             |

### Testing notes for whoever picks this up

1. **Re-derive every line number before editing.** The ones above were re-measured after Phase 3,
   but they are hints that decay the moment anything else in these files moves.
2. **Run lint/format/build once per commit, not only at the end**, so a bad cosmetic change doesn't
   get buried under a #14.1 refactor on top of it.
3. **Re-grep for newly orphaned code after every deletion** (rule #4, step 5). Removals cascade.
4. `tests/views/reports-view.test.js` has 12 file-level `vi.mock`s. If a future change needs to
   test a path those mocks intercept, it needs a new suite — do not delete a mock to make a test
   pass, or you permanently remove the code path from that suite.
5. **Prove each regression test fails without its fix** before trusting it. Both the Phase 1 and
   Phase 2 fixes were verified this way.
6. If a #5.1-style fix ever adds tokens to `tokens.css`, re-run
   `tests/system/design-tokens.test.js` — it is the production-purge guard for exactly that class
   of change.

_Original report: 24 write-ups / 23 distinct findings across 9 rules. **Remaining: 7** (3 User
Review Required incl. one 🔒, 1 own follow-up, 1 deferred, 2 confirmed intentional). 17 findings
were fixed across Phases 1–3, plus 3 further defects discovered during remediation._
