# Remaining AI-Slop Work (verified against the working tree 2026-09-25)

Only items that are **not yet implemented**. Everything already landed was checked
in source and is deliberately not listed here.

**Verified done — do not redo:** Phase A (A1 corrupt-accounts reseed, A2 budget-insights
`console.warn`, A3 emergency-export `warnings`), covered by
`tests/Account/account-corrupt-data.test.js` + `tests/core/phase-a-fallbacks.test.js` (8/8 pass).
**Phase B (B1–B5) — all five deletions landed** (`isChartJSReady`, `getCachedModule`,
`getStats`, `clearFilters`, and `getStatistics`/`mostUsedCategories` retired together);
re-greps clean, 43/43 tests, `yarn run fix` + `yarn run build` green.
**Phase C (C1–C3) — all three landed**, one commit each: `3f08c23` (C1 error contracts),
`1fdbc75` (C2 import-time side effects), `74f6f04` (C3 date-normalization helpers).
**Phase D — landed in two batches**: `3f08c23` cleared every listed line, `f39483c`
cleared the remainder. Full suite 76 files / 536 tests, `yarn run check` +
`yarn run fix` + `yarn run build` green after each commit.
Components C01, C02, C03, C04, C05, C07, C09, C10, C12, C14, C15, C17, C18, C19, C20, C21.

Standing verification bar for every item: targeted Vitest for each touched file →
`yarn run fix` → `yarn run build`. One commit per item; never bundle.

---

## 1. Phase C + D — LANDED (details for future readers, nothing to do)

**C1 `3f08c23` — error contracts.** Each emitter now documents
`event → listener → user-visible feedback`. Two findings the docs surfaced:

- **`sync-error` has no listener anywhere** — it is a pure extension point; its
  message is always duplicated on the sibling `toast`, so the user is still covered.
  → **This is the "real gap" C1 was told to look for. Verdict: no gap, do NOT
  normalize to one map.**
- **`backup-operation` never raises a toast** — `SettingsView` only `console.error`s
  it; each failure site dispatches its own separate `toast`. `main.js` is genuinely the
  only user-facing bridge, and that is now recorded in its comment.

**C2 `1fdbc75` — import-time side effects removed.** `mobile-utils.js` no longer
self-initializes; `main.js` imports the class and calls `initialize()` itself (L22),
inside the same `try/catch` convention as the other `init()` calls. `env-validator.js`
no longer auto-validates. Behaviour preserved: module scripts are deferred, so
`readyState` is already `interactive` and the singleton is still published
synchronously. Verified every `window.mobileUtils` read in `src/` is inside a function
and guarded.

**C3 `74f6f04` — date helpers extracted.** Note for the record: the two `goal-planner`
blocks were **not** identical (`batchSetGoals` backfills a missing date with `now`,
`_loadGoals` lets it become an `Invalid Date`). That divergence is real and is now
documented on `_normalizeDates(goal, fallbackToNow)` rather than silently collapsed.
Proved behaviour-identical against the old expressions across ISO / `undefined` /
`null` / `''` / epoch / garbage / array / object on both paths.

**Phase D `3f08c23` + `f39483c`.** The listed line numbers were incomplete — e.g. the
`// Create preload promise` the todo named once appeared **twice**, the second time in
`preloadCloudData()`. Swept all three files rather than trusting the positions.
Deliberately kept: the step labels inside the async preload body and
`// Use setTimeout to not block initial render`, which explain a non-obvious ordering
choice rather than restating the next line.

---

## 2. A3 follow-up — surface the partial-export warning in the UI

`_collectExportData()` now sets `warnings`, and `createEmergencyExport()` threads it onto
the result (`src/core/backup-service.js` L411–412, L426–427), but the **export** path
never reads it.

- `src/components/DataManagementSection.js` L168–175 always shows
  `"Your emergency data file has been downloaded. File size: ..."` even when
  `result.partial === true` / `result.warnings` contains `'budgets'`.
- ⚠️ **Do not be misled by the `console.error('Warnings:', result.warnings)` at
  `DataManagementSection.js` L381** — that belongs to the `performEmergencyRecovery()`
  path, a different method. A `grep warnings src/` hits it and makes this item look
  already-done. Re-verified 2026-09-25: the item is still open.
- Change: when `result.warnings` is non-empty, show a "partial export — budgets
  unavailable" (or equivalent) notice alongside the success message. Transactions/accounts
  must stay unguarded — an empty "successful" backup is worse than an error.
- Verify: extend `tests/core/phase-a-fallbacks.test.js` (or
  `tests/components/backup-restore-section.test.js`) asserting the warning text; run
  `tests/components/backup-restore-section.test.js`.
- Manual QA: stub `BudgetService.getAll` to throw → emergency export → UI shows the partial warning, transaction/account data intact.

---

## 3. Components — open 🔒 author-review gates and partial findings

### C06 🔒 — secondary import failure replaces the original error

Catch blocks still do `await import('./MobileModal.js')` _before_ reporting the original
failure; if that second import rejects, the original error is lost.

- `src/components/AccountDeletionSection.js` L208–211 and L214–216.
- `src/components/DataManagementSection.js` L184–186, L251–253, and the sibling
  emergency-export/integrity catches (report sites: L188–200, L258–270, L327–339, L401–413, L485–497).

Change: report/log the original error **first**, then attempt the secondary dialog import
inside its own guard so its failure cannot mask the original. Preserve deletion/recovery
semantics — never bypass confirmation as a fallback.

- Verify: `npx vitest run tests/components/account-deletion-section.test.js tests/components/integrity-report.test.js`
  (`integrity-report.test.js` is the only suite exercising `DataManagementSection`) — add a
  regression where the `MobileModal` import rejects.

### C08 🔒 — unused exported APIs (decision required, then delete)

Whole-repo searches still find definitions only, no application callers:

- `createExpandableSection` — `src/components/ExpandableSection.js` (~L209); zero call sites.
- `PromptDialog` — `src/components/ConfirmDialog.js` L161–245.
- `SavingsGoalCard` — `src/components/ui/ActionCard.js` L282–332.
- ChartRenderer: `addTouchOptimizations` (L569), `updateChart`, `resizeChart`, loading helpers.

Do **not** delete `getActiveCharts` (integration tests exercise it) or `MobileBackButton`
(has real tests). Confirm intent with the author first — unused APIs are not proven defects.

### C11 🔒 — empty date-input click listener

Still present at `src/components/DateInput.js` L70–73:

```js
realDate.addEventListener('click', () => {
  // Let the native behavior handle the click - don't interfere
});
```

Blame traces it to date-input bug fixes, so browser-specific intent needs confirmation.
**Check iOS/native picker behavior before removing** — no automated test can cover this.

### C13 (partial) — raw values still bypass existing tokens

Only the BackupRestoreSection metadata radius was converted. Still open:

- `src/components/AccountSection.js` **L69** and **L437** — `max-width: 400px` (account-dialog dimensions).
- Sweep the remaining ordinary presentation sites for dimension/radius/layer tokens.

Constraints: no blanket numeric replacement; canvas colors need resolved color strings,
not CSS vars; `PrivacyControls.js` sites are moot (module retired).

### C16 (partial) — backup-restore diagnostic logging

Ordinary add/copy/split diagnostics landed, but the restore-failure catch at
`src/components/BackupRestoreSection.js` L142–144 shows an alert with no
`console.error`/`console.warn`. Add the diagnostic while preserving existing user feedback.

### C22 (deferred) — split the oversized component modules

Still over the 500-line guideline (current physical counts):

| File                                                   | Lines |
| ------------------------------------------------------ | ----: |
| `src/components/ChartRenderer.js`                      |  1268 |
| `src/components/TimePeriodSelector.js`                 |  1197 |
| `src/components/CustomCategoryManager.js`              |   915 |
| `src/components/AccountSection.js`                     |   759 |
| `src/components/financial-planning/TimelineYoYCard.js` |   620 |
| `src/components/MobileModal.js`                        |   552 |
| `src/components/TransactionListItem.js`                |   534 |

Keep structural splits in their own commits, separate from behavior fixes.

---

## 4. File splits from the post-cleanup runbook (none of the four landed)

### 4.1 Delete the quarantined barrel (trivial, do first)

- `src/utils/form-utils/_deprecated/` still exists (`index.js`, 17 lines, zero importers).
- Delete the whole `_deprecated/` directory.
- Verify: `npx eslint src/utils` → 0 problems;
  `npx vitest run tests/form-utils tests/system/design-tokens.test.js tests/integration/chart-integration.test.js`;
  `yarn run build`.
- Own commit: `chore: delete quarantined form-utils barrel`.

### 4.2 Split `src/utils/reports-charts.js` — now **710 lines** (was 639)

Phase 3 already extracted `createClickableStat` and removed the `formatCurrency` shadow —
build on that, don't redo it. Suggested split (own commit):

- `src/utils/reports-charts.js` — chart builders only (`createCategoryBreakdownChart`, `createIncomeExpenseChart`).
- `src/utils/chart-legend.js` — legend construction + `createCategoryTooltipConfig`.
- `src/utils/clickable-stat.js` — `createClickableStat` (move as-is).
- `getColorForCategory` / `getCategoryColors` stay with the builders or move next to
  `src/core/chart-config.js` — author's call.

Verify: §4.1 bar plus `tests/views/reports-view.test.js`. Reports view must render pie +
bar + legend identically (hover a slice, toggle a legend item, click Income/Expenses cards).

### 4.3 Split `src/utils/financial-planning-charts.js` — **557 lines**

Phase 3 already extracted `createChartSection` and unified currency formatting. Suggested
split (own commit):

- `src/utils/financial-planning-charts.js` — the three chart builders only.
- `src/utils/financial-planning-summaries.js` — `createBalanceSummary`, `createGoalDetails`
  (presentational, no ChartRenderer dependency).

Verify: §4.1 bar plus `tests/financial-planning/`.
**Watch out:** those tests mock `financial-planning-helpers.js` — any new cross-module
import added during the split must be added to the mocks too.

### 4.4 Split `src/utils/form-utils/category-chips.js` — **500 lines** (at the line)

Suggested split (own commit):

- `src/utils/form-utils/category-chip.js` — `createCategoryChip` factory (+ `createCategoryContainer`).
- `src/utils/form-utils/category-selector.js` — `createCategorySelector` (state, rendering,
  auto-submit via `handleFormSubmit`, `resolveSubmitDateValue`, `validateAmountField`).

Verify: §4.1 bar plus `tests/utilities/transaction-form.test.js`. Manual: Add view → type
amount → tap a category chip (auto-submit), transfer flow, category-update event path.
**Watch out:** the `chip.updateState` contract between factory and selector must survive
the split unchanged.

---

## 5. Author decisions required (no code lands without explicit approval)

1. **`BudgetService` userId filter** (`src/core/budget-service.js` L23–27) — report verdict:
   intentional IDOR protection. Recommended: keep as-is. Needs a recorded yes/no.
2. **Whole-file deletions** — re-audited against the current tree; the original candidates
   need correcting:
   - `src/core/env-validator.js` — **real orphan**, zero importers outside itself. The Phase C2
     gate is now **cleared** (`1fdbc75`): the auto-validate block is gone and its reporting
     logic is exported as `runProductionValidation()`. Deliberately **no `main.js` importer was
     added** — adding one would defeat the purpose, since runtime config comes from
     `config/app.config.js`, not env vars. So the file still has zero callers, and deleting it
     is now a clean, zero-behaviour-change call. **Needs a recorded yes/no.**
   - `src/core/savings-goals-service.js` — **NOT an orphan.** `src/views/financial-planning/GoalsSection.js`
     L26 and L924 import and call it, and `tests/financial-planning/GoalsSection.test.js` mocks it.
     The plan's premise ("GoalsSection uses StorageService directly") is stale — **do not delete**.
   - `src/core/click-tracking-service.js` — **NOT dead.** Production importers:
     `TransactionForm.js`, `TransactionList.js`, `AddView.js`, `form-utils/amount-input.js`,
     `form-utils/category-chips.js`. **Do not delete.**

---

## Explicitly NOT doing

- `PrivacyControls.js` — retired; its C13/C22 sites are moot.
- `.time-period-btn` rules, token safelist — landed.
- Rule 2 logged background paths, JSON/URL validation idiom, guard sweep, canvas/palette
  hardcodes, analytics-engine facade, `_pushToCloudSafe` alias — intentional, no change.
- Manual QA for the already-landed phases — completed at the time.
