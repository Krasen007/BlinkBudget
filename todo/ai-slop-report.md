# AI Slop Report — `src/views/` (CLOSED)

**Original audit date:** 2026-09-25 · **Phases 1–4 completed:** 2026-09-26
**Guide:** [`ai-slop-inspection-guide.md`](ai-slop-inspection-guide.md)
**Original scope:** `src/views/` — 17 `.js` files, 9,252 lines (incl. `src/views/financial-planning/`)
**Method:** Rule-by-rule sweep with `rg`, then per-finding line re-derivation and a repo-wide
grep for every "dead" claim.

> **This file records a closed audit.** All 20 findings were fixed across Phases 1–4. What follows
> is what is still outstanding by design, the resolutions, and testing notes for whoever touches
> this code next.
> **Line numbers were re-derived against the post-Phase-4 tree** — they are current.

## Executive summary

**No open defects remain.** The report's single headline bug (the unreachable "approximate data"
banner) is **fixed and covered by a regression test**, and the one 🔒 cross-user data bleed found
during the audit is **closed and proven by a revert test**.

| Bucket                    | Count | Status                                                               |
| ------------------------- | ----- | -------------------------------------------------------------------- |
| **User Review Required**  | 0     | #2.5 (🔒), #4.2, #6.1 — all resolved in Phase 4 with author sign-off |
| **Own follow-up**         | 1     | #14.1 file bloat — deliberately not bundled with a cleanup           |
| **Deferred**              | 1     | #7.2 — currently equivalent; will drift on first fix                 |
| **Confirmed intentional** | 2     | #2.4, #2.6 — re-confirmed correct as written, no change recommended  |
| ~~Done~~                  | 20    | Phases 1–2 (11) + cosmetic (6) + author-reviewed (3)                 |

### Severity of what remains

Nothing user-facing is outstanding. What is left is one structural follow-up (#14.1 file bloat),
one deliberate deferral (#7.2), and two findings re-confirmed as correct as written (#2.4, #2.6).

**Two findings were resolved differently than their write-ups proposed**, because the code
contradicted the stated reasoning — see
[Findings whose stated reasoning was wrong](#findings-whose-stated-reasoning-was-wrong). In short:
#2.5's `catch` was inert while the real bug was a fire-and-forget async call, and #4.2's "lost"
diagnostic already existed as a tested, user-reachable service.

### Suggested next step

The audit is closed. The one substantive item left is **#14.1** — eight of seventeen view files
exceed the 500-line convention, `ReportsView.js` (1,598) being the outlier. Per the guide it must
not be bundled with a cleanup, and the extraction pattern already exists one directory over
(`insights-takeaways.js` and friends), so `GoalsSection.js` (1,069) is the cheapest place to start.

---

## Resolved — Phases 1–4

All findings from this report are now closed. #2.5, #4.2 and #6.1 — the three that were held
back for author review — were resolved in **Phase 4**; #2.5 carried a 🔒 and was changed only
after the author confirmed the approach. Their resolutions are in
[Completed work](#completed-work--phases-14) below, including two places where the original
findings' stated reasoning turned out to be wrong.

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
   1598  src/views/ReportsView.js                     (3.2x the limit)
   1317  src/views/DashboardView.js                   (2.6x)
   1069  src/views/financial-planning/GoalsSection.js (2.1x)
    670  src/views/financial-planning/InvestmentsSection.js
    610  src/views/FinancialPlanningView.js
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

- **Note:** the convention is `AGENTS.md`'s 500-line guideline. `ReportsView.js` at 1,598 lines is
  the outlier and was implicated in four of the original audit's High findings (#4.1, #4.2, #10.1,
  #10.2) — a concrete illustration of the guide's claim that bloat correlates with accumulated
  dead code and complex control flow. **Phases 1–4 have now cut it from 1,651 to 1,598** — the
  validate → sanitize → re-validate chain was flattened, the cosmetic batch trimmed comments, and
  #4.2 removed ~40 lines of dead code. That is a 3% reduction: **still a split, not a trim.**
  `DashboardView.js` moved the other way (1,298 → 1,317) because the #2.5 fix carries an
  explanatory comment and a `console.warn`.
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

## Completed work — Phases 1–4

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

### Phase 4 — author-reviewed items (#2.5, #4.2, #6.1)

| #    | Finding                              | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #2.5 | `catch {}` around a cache invalidate | **The `try/catch` was provably dead, and the real bug was elsewhere.** `AnalyticsCache.invalidate()` is declared `async`, so it never throws synchronously — a `try/catch` around the call catches nothing, and a real failure became an _unhandled rejection_ (worse than the silent swallow it appeared to be). Removed it, and fixed the actual cross-user window: capture keys with `getMatchingKeys()`, clear in-memory **synchronously** with `invalidateSync()`, then pass the captured keys to the async `invalidate()` so the persistent layer is still cleared. `.catch(console.warn)` keeps it diagnosable. The hardcoded key string was hoisted to a module-level `FINANCIAL_PLANNING_CACHE_KEY` so the preload and the invalidation cannot drift. Pattern copied from `cache-invalidator.js:38-55`.                                                                   |
| #4.2 | `checkDataIntegrity` never called    | **Deleted — but the finding's justification was wrong.** It claimed the diagnostic logic was "lost." It was not: `src/core/data-integrity-service.js` `checkDataConsistency()` already does the same orphaned-`accountId` detection, and does it better (adds a `severity`, iterates transactions once, and goes through `StorageService` rather than the parallel `TransactionService`/`AccountService` path). It is live — run by `performIntegrityCheck()` across 7 checks, surfaced by the "🔍 Data Integrity Check" button in `DataManagementSection.js`, and covered by 5 test files. The orphan was a duplicate. Also deleted `getCurrentData` / `getCurrentTimePeriod`; kept `refreshData` (called internally at line 1518). **Cascade:** removing it orphaned the `AccountService` import, which was removed too (`TransactionService` survives, still used at line 605). |
| #6.1 | Debounced empty resize listener      | **Deleted in full** at author direction (feature will not be implemented). Removed the `debounce` wrapper, the `resize` registration, the teardown line, and the initial call. **Cascade:** this orphaned _both_ the `debounce` and `TIMING` imports, which were removed — `FinancialPlanningView.js` no longer references either.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Findings whose stated reasoning was wrong

Recorded because the code contradicts the original write-ups, and the same class of error may
exist elsewhere:

1. **#2.5 blamed the `catch` for the data bleed.** The `catch` was inert, but the bleed came from
   `invalidate()` being fire-and-forget: it yields at `_acquireLock()`, so a same-tick read could
   still observe the previous user's data. Fixing only the `catch` — as the finding suggested —
   would have left the security issue fully intact while looking resolved.
2. **#4.2 claimed the logic was "currently lost."** It exists, is tested, and is user-reachable via
   the Data Integrity Check button. The orphan was a duplicate, not the last copy.

### Tests added

- `tests/views/dashboard-greeting.test.js` — 3 tests for the #2.5 auth-switch invalidation:
  synchronous in-memory clearing, pre-captured keys reaching the async `invalidate()` (and the
  persistent entry actually disappearing), and no unhandled rejection when invalidation fails.
  **Proven by revert** — restoring the single-line pre-fix call fails 2 of the 3 with
  `AssertionError: expected { goals: [ 'user-A-private-goal' ] } to be null`, i.e. the previous
  user's data surviving the switch.

**Baseline at the end of Phase 4:** 54 tests pass across `tests/views`, `tests/financial-planning`
and `tests/system/design-tokens.test.js`; ESLint reports **0 errors and 0 warnings** on all four
touched files; `prettier --check` is clean; `yarn run build` succeeds.

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

| Finding                            | Severity | Status                                                                  |
| ---------------------------------- | -------- | ----------------------------------------------------------------------- |
| #2.5 `catch {}` in auth handler    | 🔴 🔒    | **Resolved in Phase 4** — 🔒, changed only after author confirmation    |
| #4.2 `checkDataIntegrity` orphaned | 🔴       | **Resolved in Phase 4** — deleted; logic already existed in a service   |
| #6.1 debounced empty function      | 🟡       | **Resolved in Phase 4** — deleted at author direction; not implementing |
| #14.1 file bloat                   | 🟡       | **Own follow-up** — never bundled with cleanup                          |
| #7.2 delete/undo divergence        | 🟡       | **Deferred** — currently equivalent; will drift on first fix            |
| #2.4, #2.6                         | ⚪       | **Confirmed intentional** — no change recommended                       |
| #1.1, #1.2, #4.3, #5.2, #5.3, #5.4 | ⚪       | ~~Cosmetic batch~~ — **done in Phase 3**                                |

### Testing notes for whoever picks this up

1. **Re-derive every line number before editing.** The ones above were re-measured after Phase 3,
   but they are hints that decay the moment anything else in these files moves.
2. **Run lint/format/build once per commit, not only at the end**, so a bad cosmetic change doesn't
   get buried under a #14.1 refactor on top of it.
3. **Re-grep for newly orphaned code after every deletion** (rule #4, step 5). Removals cascade.
4. `tests/views/reports-view.test.js` has 12 file-level `vi.mock`s. If a future change needs to
   test a path those mocks intercept, it needs a new suite — do not delete a mock to make a test
   pass, or you permanently remove the code path from that suite.
5. **Prove each regression test fails without its fix** before trusting it. Phases 1, 2 and 4 were
   all verified this way.
6. If a #5.1-style fix ever adds tokens to `tokens.css`, re-run
   `tests/system/design-tokens.test.js` — it is the production-purge guard for exactly that class
   of change.
7. **`core.autocrlf=true` with no `text=auto` in `.gitattributes` is a live trap.** Prettier is
   configured `endOfLine: "lf"`, so any `git stash` / checkout round-trip silently rewrites working
   files to CRLF and `prettier --check` then fails on files nobody touched. Re-run
   `prettier --write` after any git operation that rewrites the working tree.

_Original report: 24 write-ups / 23 distinct findings across 9 rules. **Remaining: 0 open**
(2 own follow-up / deferred / intentional, no defects). 20 findings were fixed across Phases 1–4,
plus 3 further defects discovered during remediation._
