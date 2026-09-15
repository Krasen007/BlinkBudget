# Remaining Work — Post AI-Slop Cleanup

Source of truth for what's done: `todo/ai-slop-report.md` (Phases 1–3 landed,
barrel quarantined, all three carried-over decisions resolved).
This file tracks only what is still open. Project guideline: files under 500 lines.

## 1. Delete the quarantined barrel (trivial, do first)

- **What:** `src/utils/form-utils/_deprecated/index.js` — 17-line barrel,
  zero importers repo-wide, incomplete (never re-exported `transaction-tags.js`).
- **Step:** delete `src/utils/form-utils/_deprecated/` outright.
- **Verify:** `npx eslint src/utils` → 0 problems;
  `npx vitest run tests/form-utils tests/system/design-tokens.test.js tests/integration/chart-integration.test.js` →
  green; `yarn run build` → ✓ built.
- **Commit:** separate commit (`chore: delete quarantined form-utils barrel`).

## 2. Split `src/utils/reports-charts.js` (639 lines, guideline 500)

- **Note:** Phase 3 already extracted `createClickableStat` and removed the
  `formatCurrency` shadow — build on that, don't redo it.
- **Suggested split (own commit, per the inspection guide — never bundle):**
  - `src/utils/reports-charts.js` — chart builders only
    (`createCategoryBreakdownChart`, `createIncomeExpenseChart`)
  - `src/utils/chart-legend.js` — legend construction + `createCategoryTooltipConfig`
  - `src/utils/clickable-stat.js` — `createClickableStat` (move as-is)
  - `getColorForCategory` / `getCategoryColors` stay with the builders or move
    next to `src/core/chart-config.js` — author's call.
- **Verify:** same bar as §1 plus `tests/views/reports-view.test.js`;
  Reports view must render pie + bar + legend identically (hover a slice,
  toggle a legend item, click Income/Expenses cards).

## 3. Split `src/utils/financial-planning-charts.js` (557 lines)

- **Note:** Phase 3 already extracted `createChartSection` and unified currency
  formatting on `formatCurrency` — build on that.
- **Suggested split (own commit):**
  - `src/utils/financial-planning-charts.js` — the three chart builders only
  - `src/utils/financial-planning-summaries.js` — `createBalanceSummary`,
    `createGoalDetails` (presentational, no ChartRenderer dependency)
- **Verify:** same bar as §1 plus `tests/financial-planning/`;
  Financial Planning → Forecasts/Goals sections render as before.
  **Watch out:** those tests mock `financial-planning-helpers.js` — any new
  cross-module import added during the split must also be added to the mocks
  (this bit us once already with `formatCurrency`, see report Phase 3 follow-up).

## 4. Split `src/utils/form-utils/category-chips.js` (500 lines, at the line)

- **Suggested split (own commit):**
  - `src/utils/form-utils/category-chip.js` — `createCategoryChip` factory
    (+ `createCategoryContainer`)
  - `src/utils/form-utils/category-selector.js` — `createCategorySelector`
    (state, rendering, auto-submit via `handleFormSubmit`,
    `resolveSubmitDateValue`, `validateAmountField`)
- **Verify:** same bar as §1 plus `tests/utilities/transaction-form.test.js`;
  manual: Add view → type amount → tap a category chip (auto-submit),
  transfer flow, category-update event path.
  **Watch out:** `chip.updateState` contract between factory and selector must
  survive the split unchanged.

## Standing verification bar (every item above)

1. `npx eslint src/utils` → 0 problems
   (`npx eslint src` → 0 errors; the ~106 warnings in components/views are
   pre-existing and out of scope)
2. `npx prettier --check` over every touched file
3. Targeted tests per item (not the whole suite — see items)
4. `yarn run build` → ✓ built
5. After each item, re-run runbook steps 1–5 from
   `todo/ai-slop-inspection-guide.md` scoped to the touched files
   (the guide's named regression risk: a moved helper missing its import)

## Explicitly NOT doing

- `PrivacyControls.js` — migrated; `KNOWN_TOKEN_DEBT` empty. No follow-up.
- `.time-period-btn` rules — deleted. No follow-up.
- Token safelist — landed. No follow-up unless a *new* token family
  (outside `color|font|spacing|radius|shadow`) gets JS consumers; the
  design-tokens guard test (now non-vacuous) will catch it.
- Manual QA for the slop phases themselves — covered at each phase; only the
  per-item checks above apply going forward.
