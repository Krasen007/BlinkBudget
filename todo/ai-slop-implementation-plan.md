# AI Slop Implementation Plan — src/core (2026-09-18)

Source report: `todo/ai-slop-report.md` (scope: `src/core`, 42 files).
Gate: `todo/ai-slop-inspection-guide.md` → "From findings to implementation plan".

## Phasing

- **Phase A** — 🔴 High: crash chain + silent data-loss paths. Lands first, alone.
- **Phase B** — 🟡 Medium, safe deletions: dead exports/aliases + stale TODO wiring.
- **Phase C** — 🟡 Medium, structural: error-contract docs, import-time side effects, duplication.
- **Phase D** — ⚪ Low: trivial comments, opportunistic only.
- **User Review Required** (never bundled): 🔒 guard, whole-file deletions, downgraded items.
- **Deferred / Intentional**: explicit destination for everything else.

## Phase A — High severity (Rules 2, 10)

### A1. Harden corrupt-accounts chain (Report: Rule 2, 10 — account-service + transaction-service)

- **Files/lines:** `src/core/Account/account-service.js:35-41`; `src/core/transaction-service.js:27-34,70-72`
- **Problem:** corrupt `blinkbudget_accounts` → `getAccounts()` returns `[]` → `getDefaultAccount()` returns `undefined` → `.id` throws in `TransactionService.getAll()/add()` (white screen / lost write).
- **Change:**
  1. `getAccounts()`: on parse/clean failure, re-seed + persist a default account (same shape as the no-data branch at lines 22–32) instead of returning `[]`; keep `console.error` with the parse error.
  2. `getDefaultAccount()`: belt-and-braces — if `find(...) || accounts[0]` is falsy, create/persist/return the default account rather than `undefined`.
  3. `TransactionService.getAll()/add()`: keep behavior, now guaranteed a default; no signature change.
- **Tests:** new `tests/Account/account-corrupt-data.test.js` — (a) seed corrupt JSON, assert `getAll()` returns transactions with a valid `accountId`; (b) seed `[]`, assert `add()` succeeds and a default account exists.
- **Existing tests to run:** `tests/Account/account-section.test.js`, `tests/Account/account-section-errors.test.js`, `tests/core/transaction-undo.test.js`, `tests/utilities/transaction-form.test.js`.
- **Verify:** `yarn run fix`, `yarn run build`.
- **Manual QA:** open DevTools → corrupt `blinkbudget_accounts` (`localStorage.setItem('blinkbudget_accounts','{bad')`) → reload → dashboard renders, default account exists, adding an expense succeeds.

### A2. Budget-insights catch: log, keep swallowing (Report: Rule 2 — insights-generator.js:233-235)

- **File/lines:** `src/core/insights-generator.js:233-235`
- **Change:** `} catch (error) { console.warn('[InsightsGenerator] Budget insights failed:', error); }` — comment stays ("additive; never fail insight generation").
- **Tests:** `tests/services/insights-generator.test.js` — force `BudgetPlanner.getBudgetsStatus` to throw, assert other insights still return + `console.warn` called.
- **Manual QA:** n/a (non-UI path; warn visible in console only).

### A3. Emergency-export budgets fallback: log + partial flag (Report: Rule 2 — backup-service.js:299-304)

- **File/lines:** `src/core/backup-service.js:293-318` (`_collectExportData`)
- **Change:**
  1. `catch (error) { console.warn('[Backup] budgets unavailable for export:', error); budgets = []; budgetsPartial = true; }`
  2. Thread a `partial`/`warnings` marker to the export result so a missing-budgets export never reports full success (keep the same `wrap()` shape; add `partial: true` + warning string on the budgets section or top-level `warnings` array — whichever the existing export-result contract already supports).
  3. Keep `transactions/accounts` unguarded (a failure there should still throw — an empty "successful" backup is worse than an error).
- **Tests:** extend `tests/components/backup-restore-section.test.js` or add `tests/core/backup-partial-export.test.js` — mock `BudgetService.getAll` to throw, assert export succeeds with `partial:true`/warning and `budgets.items === []`.
- **Existing tests to run:** `tests/components/backup-restore-section.test.js`.
- **Verify:** `yarn run fix`, `yarn run build`.
- **Manual QA:** stub `BudgetService.getAll` to throw (DevTools override) → run emergency export → confirm UI shows "partial export — budgets unavailable" (or equivalent warning), transaction/account data intact.

**Phase A exit:** targeted tests green + fix + build + both manual QAs pass. Then re-audit `account-service.js`, `transaction-service.js`, `backup-service.js`, `insights-generator.js` before starting Phase B.

- **Phase D** — ⚪ Low: trivial comments, opportunistic only.
- **User Review Required** (never bundled): 🔒 guard, whole-file deletions, downgraded items.
- **Deferred / Intentional**: explicit destination for everything else.

## Phase B — Medium, safe deletions (Rules 4, 6, 11)

### B1. Remove `isChartJSReady` (Report: Rule 4 — chart-loader.js:133-135)

- **Change:** delete the function + its JSDoc; `loadChartJS` / `getChartJSModules` / `preloadChartJS` / `resetChartLoader` stay untouched.
- **Pre-check:** re-run whole-repo grep for `isChartJSReady` (report found definition only) + dynamic `import(` map.
- **Tests:** `tests/system/lazy-loading.test.js` (imports `loadChartJS/getChartJSModules/resetChartLoader/preloadChartJS` — unaffected, run to confirm).
- **Manual QA:** open Reports view → charts render (proves loader contract intact).

### B2. Remove `getCachedModule` alias (Report: Rule 4, 6 — view-preloader.js:68-70)

- **Change:** delete `getCachedModule`; callers use `getCachedView`.
- **Pre-check:** whole-repo grep for `getCachedModule` (report: zero callsites).
- **Tests:** `tests/system/lazy-loading.test.js`, `tests/views/reports-view.test.js`, `tests/system/main.test.js`.
- **Manual QA:** cold-load app → navigate dashboard → reports → confirm no delay/regression (preloader alias had no runtime behavior).

### B3. Remove `getStats` alias (Report: Rule 4, 6 — AnalyticsCache.js:463-465)

- **Change:** delete `getStats`; `getCacheStats()` is the live contract.
- **Pre-check:** whole-repo grep for `.getStats(` — must be zero outside the definition (report: only `getCacheStats` is referenced).
- **Tests:** `tests/core/cache-invalidator-ghost.test.js`, `tests/core/analytics-forecast-regressions.test.js`.
- **Manual QA:** n/a (no UI surface).

### B4. Remove `FilteringService.clearFilters` (Report: Rule 4 — FilteringService.js:348-359)

- **Change:** delete the static; nothing in src/ or tests/ calls it (report: zero callsites).
- **Pre-check:** whole-repo grep + dynamic-import inspection (filter config is built inline at call sites via `applyFilters`, not via this factory).
- **Tests:** `tests/core/analytics-forecast-regressions.test.js` + any filter-consumer suite that touches `FilteringService`.
- **Manual QA:** open Reports → apply a category + amount filter → confirm filtering still works.

### B5. Stale TODO: wire or delete `mostUsedCategories` (Report: Rule 11 — custom-category-service.js:859)

- **Decision (author picks one; default = wire):**
  - **Option 1 (wire, preferred):** `getStatistics()` returns `mostUsedCategories: CategoryUsageService.getMostFrequentCategories(5)` — resolves the misleading TODO with existing infrastructure.
  - **Option 2 (delete):** remove the field + TODO if no UI reads `statistics.mostUsedCategories` (grep first).
- **Pre-check:** grep `mostUsedCategories` repo-wide; check `CategoryUsageService.getMostFrequentCategories` return shape matches what consumers expect.
- **Tests:** `tests/services/category-usage-service.test.js` + category-selector suites (`tests/components/category-selector.test.js`).
- **Manual QA:** open Category Manager / statistics surface → confirm most-used list renders (Option 1) or no missing-field error (Option 2).

**Phase B exit:** four deletions + one wire/delete, each with its pre-check grep re-run; targeted tests + fix + build; manual QAs pass. Re-audit changed files + `chart-config.js` (chart-loader sibling) + category consumers.

> Rule: `yarn run fix` + `yarn run build` once per phase (not once at the end). Targeted Vitest per touched file. Concrete manual QA per phase below. After all phases, re-run the audit scoped to changed files + siblings (guide runbook step 7).

## Phase C — Medium, structural (Rules 7, 8, 9)

### C1. Document (don't yet unify) sync/backup/preloader error contracts (Report: Rule 7)

- **Files:** `src/core/sync-service.js:121-192,295-313`; `src/core/backup-service.js:99-107,259-272`; `src/core/view-preloader.js:42-47`
- **Change (docs-only, zero runtime risk):** add a short header comment to each emitter mapping event → listener → user-visible toast: `sync-error`+`toast`, `sync-state:error`+`toast`, `backup-operation`+`toast`, preloader warn-only (intentionally silent/non-blocking). If `main.js:75-80` only bridges `toast`, note which emitters bypass it.
- **Follow-up (separate change, not this phase):** normalize to one map if the docs reveal a real gap.
- **Tests:** none new; run `tests/system/main.test.js`, `tests/components/backup-restore-section.test.js`.
- **Manual QA:** force offline → confirm exactly one "saved locally" toast path fires (no duplicates from overlapping contracts).

### C2. Move import-time side effects to explicit init (Report: Rule 8)

- **Files:** `src/core/mobile-utils.js:602-603`; `src/core/env-validator.js:494-509`; caller `src/main.js:16`
- **Change:**
  1. `mobile-utils.js`: remove bottom `MobileUtils.initialize()`; export stays. `main.js` replaces `import './core/mobile-utils.js'` with a named import + `MobileUtils.initialize()` before first `window.mobileUtils` use (line 37+).
  2. `env-validator.js`: remove auto-validate-on-import block; expose `validateForProduction()` for `main.js`/build to call explicitly (keep the singleton export, drop the side effect).
- **Risk:** import order — `main.js` must init before `initMobileNav`/`onResponsiveChange` paths. Keep the existing `window.mobileUtils?.` guards.
- **Tests:** `tests/system/main.test.js`, `tests/components/mobile/*`, `tests/form-utils/keyboard.test.js`.
- **Manual QA:** cold load on a narrow viewport → mobile nav appears; rotate/resize → orientation event still fires; no validation spam on plain util import.

### C3. Extract date-normalization helpers (Report: Rule 9)

- **Files:** `src/core/investment-tracker.js:262-294 vs 335-359`; `src/core/goal-planner.js:549-567 vs 600-634`
- **Change:** one private `_normalizeDates()`-style helper per class covering `new Date(...)` → `isNaN` check → filter-invalid; `_loadX` and `batchSetX` both call it. Behavior-identical refactor, no shape changes.
- **Tests:** `tests/services/investment-tracker.test.js`, `tests/utilities/goal-planner.test.js`, `tests/utilities/data-loss-prevention*.test.js`, `tests/financial-planning/*`.
- **Manual QA:** restore a backup containing goals + investments → confirm no "invalid date" drops beyond pre-change behavior.

**Phase C exit:** docs land, side effects move, helpers extract — each behind its listed tests + fix + build. Re-audit changed files + siblings (`main.js`, `storage.js`, financial-planning views).

## Phase D — Low, opportunistic only (Rule 1)

- **Items:** trivial comments in `backup-service.js:53-56`, `view-preloader.js:25,34,89-92`, `sync-service.js:40-41` (Report: Rule 1).
- **Rule:** clean only while already touching those functions in Phases A–C. No dedicated pass, no comment-only diff.
- **Verify:** covered by the phase's own tests + fix.

## User Review Required (never bundled into A–D)

1. **🔒 BudgetService userId filter** (`src/core/budget-service.js:23-27`) — report verdict: intentional IDOR protection. Question for author: keep as-is (recommended) or adjust? No code change lands without explicit human approval.
2. **Whole-file deletions** — `src/core/savings-goals-service.js`, `src/core/env-validator.js` (minus the Phase C side-effect trim), `src/core/click-tracking-service.js`. Note: `ClickTracker` IS imported by `src/components/TransactionForm.js` and `src/utils/form-utils/category-chips.js`, so it is not dead — only `env-validator` (zero production importers) and `savings-goals-service` (GoalsSection uses StorageService directly) are real orphan candidates. Any deletion requires: filename + symbol grep across `*.js + *.html + *.json + README/AGENTS.md`, dynamic-import check, quarantine to `_deprecated/` + full test suite + production build, then real delete in a follow-up commit.
3. **Downgraded items** — `clearFilters` High→Medium downgrade; orphan-file "possibly intentional" calls. Confirm the downgrade reasoning before Phase B deletes anything.

## Deferred / Intentional (traceability — nothing disappears)

| Report finding                                                                            | Destination                    | Reason                                           |
| ----------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------ |
| Rule 2 logged background paths (auth, firebase-config, sync push-chain, preloader, cache) | Intentional, no change         | They log; silence is the contract (non-blocking) |
| Rule 2/10 JSON/URL validation idiom                                                       | False positive, no change      | No `if` alternative; catch is the validation     |
| Rule 3 guard sweep (no dead guards found)                                                 | No change                      | Every candidate guard fires on real inputs       |
| Rule 5 canvas/palette/`16px` hardcodes                                                    | Intentional, no change         | Canvas API / user data / iOS floor / runtime px  |
| Rule 6 analytics-engine facade                                                            | Intentional, no change         | Stable facade; inlining costs more than it saves |
| Rule 6 storage `_pushToCloudSafe` alias                                                   | Intentional, no change         | Single funnel, live callers in-file              |
| Rule 14 file bloat (13 files >500 lines)                                                  | Deferred to separate follow-up | Splits must not ride along with slop cleanup     |

## Final verification (after all phases)

1. Targeted Vitest for every touched file (list above, per phase) — not just the High-severity ones.
2. `yarn run fix` + `yarn run build` per phase (already gated above), plus one final full pass.
3. Re-run the audit scoped to changed files + their siblings; confirm no half-migrated aliases (e.g. `getStats` removed in cache but still called somewhere) and no new swallowed errors introduced by the fixes themselves.
