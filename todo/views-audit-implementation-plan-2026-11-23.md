# Views Audit Implementation Plan

**Date:** 2026-11-23  
**Target Scope:** `src/views/` and `src/views/financial-planning/`  
**Playbook Reference:** `todo/code-quality-and-design-system-playbook.md`  

---

## 🔒 User Review Required (Decision Gate)

Per Playbook Part 1 #11 and Part 8.3, security-sensitive code and destructive data-deletion paths are **never auto-remediated** without explicit author confirmation.

### 0. Dynamic `ConfirmDialog` Load Failure Handling (Priority: HIGH · Risk: Low · 🔒 Security / Deletion)

- **Problem:**
  When deleting transactions, budgets, goals, or investment holdings, each view dynamically imports `ConfirmDialog.js`:
  - `src/views/EditView.js` (line ~197 hint): `import('../components/ConfirmDialog.js').then(...)` has **no `.catch()`**.
  - `src/views/financial-planning/BudgetsSection.js` (line ~309 hint): `await import('../../components/ConfirmDialog.js')` has **no `try/catch`**.
  - `src/views/financial-planning/GoalsSection.js` (line ~653 hint): `await import('../../components/ConfirmDialog.js')` has **no `try/catch`**.
  - `src/views/financial-planning/InvestmentsSection.js` (line ~520, 766 hints): `.catch(err => console.error(...))` logs only, giving **zero user feedback**.
  If a network failure or chunk cache eviction occurs while offline, clicking "Delete" silently fails or raises an unhandled promise rejection with no user feedback.
- **Proposed Solution:**
  Wrap dynamic imports in a consistent error-handling pattern across all 4 files. If the module cannot load, log the diagnostic and display a user toast:
  ```javascript
  // Illustrative snippet (re-read before applying)
  try {
    const { ConfirmDialog } = await import('../../components/ConfirmDialog.js');
    ConfirmDialog({ ... });
  } catch (error) {
    console.error('Failed to open confirmation dialog:', error);
    showErrorToast('Failed to open confirmation dialog. Please check your connection.');
  }
  ```
- **Files:**
  - `src/views/EditView.js`
  - `src/views/financial-planning/BudgetsSection.js`
  - `src/views/financial-planning/GoalsSection.js`
  - `src/views/financial-planning/InvestmentsSection.js`
- **Verification:**
  Simulate a dynamic import failure (e.g., block the chunk URL or simulate offline chunk rejection), click "Delete" in all four locations, and verify that the user receives an error toast rather than an unresponsive UI or unhandled rejection.
- **Success Criteria:**
  Zero unhandled promise rejections on delete actions; error toast is shown whenever `ConfirmDialog` fails to load.
- **Rollback:**
  Revert the commit touching the 4 files.

---

## Sequencing Overview

```
Phase 1 (High Severity Defects)          Fix broken layout classes, async DOM race conditions, and swallowed errors
Phase 2 (Medium Severity & Consistency)  Remove dead re-exports, fix filter mutation order, clean stale comments
Phase 3 (Token Hygiene & Low Severity)   Clean Object.assign blind spots, dead fallbacks, magic storage keys, innerHTML
Deferred (Architectural Modularization)  Split 7 view files exceeding the 500-line limit into focused submodules
```

---

## Change-Summary Table

| # | File | Change Type | Risk | Phase |
|---|------|-------------|------|-------|
| 1 | `src/views/ReportsView.js` | Preserve `income-expense-section` class on spacer add | Medium | Phase 1 |
| 2 | `src/views/financial-planning/ForecastsSection.js` | Stabilize chart DOM ordering against async race | Medium | Phase 1 |
| 3 | `src/views/financial-planning/InvestmentsSection.js` | Add `console.warn` to empty catch | Low | Phase 1 |
| 4 | `src/views/FinancialPlanningView.js` | Render error placeholder when data loading fails | Low | Phase 1 |
| 5 | `src/views/DashboardView.js` | Delete unused `export { setSelectedStyle }` | Low | Phase 2 |
| 6 | `src/views/EditView.js` | Move `sessionStorage` filter set after successful update | Low | Phase 2 |
| 7 | `src/views/financial-planning/GoalsSection.js` | Remove stale `StorageService` comment | Low | Phase 2 |
| 8 | `src/views/LoginView.js` | Replace raw style literals in `Object.assign` with tokens/classes | Low | Phase 3 |
| 9 | `src/views/SettingsView.js` | Remove dead `#333` fallback in `--color-border` style | Low | Phase 3 |
| 10 | `src/utils/constants.js` & `src/views/DashboardView.js` | Export `STORAGE_KEYS.DASHBOARD_DATE_RANGE_FILTER` | Low | Phase 3 |
| 11 | `src/views/financial-planning/OverviewSection.js` | Use `formatCurrency` instead of raw `'€'` string | Low | Phase 3 |
| 12 | `src/views/SettingsView.js` & `src/views/FinancialPlanningView.js` | Replace `innerHTML = '← Back'` with `textContent` | Low | Phase 3 |
| 13 | 7 view modules exceeding 500 lines | Submodule extraction & modularization | High | Deferred |

---

## Phase 1: High-Severity Defects

### 1. Fix Clobbered Class Name in ReportsView (Priority: HIGH · Risk: Medium · Decision needed: no)

- **Problem:**
  In `src/views/ReportsView.js` (lines ~1286–1288 hint), `section.className = 'reports-section-spacer'` directly assigns the class string, immediately clobbering `section.className = 'income-expense-section'`. Sibling method `updateCategorySelector` (line ~1126 hint) correctly uses `classList.add()`. Because `income-expense-section` is removed from the DOM element, multiple rules in `src/styles/components/reports.css` (`.view-reports .income-expense-section`) fail to match the container.
- **Solution:**
  Use `section.classList.add('reports-section-spacer')` instead of overwriting `section.className`.
  ```javascript
  // Illustrative snippet
  section = document.createElement('div');
  section.className = 'income-expense-section';
  section.id = 'income-expense-section';
  section.classList.add('reports-section-spacer');
  ```
- **Files:** `src/views/ReportsView.js`
- **Verification:**
  Inspect the generated DOM of the Reports page in browser or test. Verify that `#income-expense-section` retains both classes: `income-expense-section` and `reports-section-spacer`.
- **Success Criteria:**
  `.income-expense-section` is present on the section DOM node; `reports.css` rules for `.income-expense-section` apply.
- **Rollback:**
  Revert commit for `ReportsView.js`.

---

### 2. Fix Fire-and-Forget Chart Insertion Race in ForecastsSection (Priority: HIGH · Risk: Medium · Decision needed: no)

- **Problem:**
  In `src/views/financial-planning/ForecastsSection.js` (lines ~540–578 hint), `createForecastComparisonChart` and `createProjectedBalanceChart` return promises that append their elements into `section` when resolved. Meanwhile, `section.appendChild(forecastTable)` runs synchronously. As a result, the charts are inserted *below* `forecastTable` in the DOM, and whichever chart promise settles first appears first, causing layout thrashing.
- **Solution:**
  Create dedicated slot containers synchronously in the correct visual sequence (comparison chart slot, projected balance chart slot, then forecast table) and append the resolved charts into their dedicated slots; or await the chart promises with `await Promise.all(...)` before rendering the section.
  ```javascript
  // Illustrative snippet
  const comparisonSlot = document.createElement('div');
  comparisonSlot.className = 'forecast-chart-slot';
  section.appendChild(comparisonSlot);

  const balanceSlot = document.createElement('div');
  balanceSlot.className = 'forecast-chart-slot';
  section.appendChild(balanceSlot);

  createForecastComparisonChart(...).then(({ section: chartSection, chart }) => {
    comparisonSlot.appendChild(chartSection);
    activeCharts.set('forecast-comparison', chart);
  });
  // ...
  section.appendChild(forecastTable);
  ```
- **Files:** `src/views/financial-planning/ForecastsSection.js`
- **Verification:**
  Navigate to Financial Planning -> Forecasts. Verify charts always appear in deterministic order above the detailed historical forecast table.
- **Success Criteria:**
  Charts reliably render in fixed order above the forecast table on every load regardless of network or calculation speed.
- **Rollback:**
  Revert commit for `ForecastsSection.js`.

---

### 3. Add Warning Log to Empty Catch in InvestmentsSection (Priority: HIGH · Risk: Low · Decision needed: no)

- **Problem:**
  In `src/views/financial-planning/InvestmentsSection.js` (lines ~964–976 hint), an empty `catch` block silently swallows any exception thrown during progressive unlock card instantiation without logging. Corrupt storage data or schema issues are masked completely.
- **Solution:**
  Add a `console.warn` diagnostic while preserving graceful non-blocking degradation:
  ```javascript
  // Illustrative snippet
  } catch (error) {
    console.warn('[InvestmentsSection] Failed to mount progressive unlock card:', error);
  }
  ```
- **Files:** `src/views/financial-planning/InvestmentsSection.js`
- **Verification:**
  Run `yarn test tests/views/InvestmentsSection.test.js` (if existing) or verify view renders cleanly with normal and empty storage.
- **Success Criteria:**
  Zero empty `catch` blocks in `InvestmentsSection.js`.
- **Rollback:**
  Revert commit for `InvestmentsSection.js`.

---

### 4. Provide User Error Feedback on FinancialPlanningView Data Load Failure (Priority: HIGH · Risk: Low · Decision needed: no)

- **Problem:**
  In `src/views/FinancialPlanningView.js` (lines ~445–481 hint), if `planningDataManager.loadData()` throws on an initial uncached visit, the catch block logs `console.error` and sets `isLoading = false`, but leaves `content` completely empty with no error message or retry action.
- **Solution:**
  Render an error placeholder in `content` inside the `catch` block:
  ```javascript
  // Illustrative snippet
  } catch (error) {
    console.error('Error loading planning data:', error);
    content.replaceChildren(
      createPlaceholder(
        'Unable to Load Financial Data',
        'There was an error loading your financial planning data. Please try refreshing.',
        '⚠️'
      )
    );
  } finally {
  ```
- **Files:** `src/views/FinancialPlanningView.js`
- **Verification:**
  Mock `planningDataManager.loadData` to throw an error; verify that `FinancialPlanningView` renders a user-friendly error placeholder rather than a blank canvas.
- **Success Criteria:**
  A clear error message is visible to the user whenever planning data fails to load.
- **Rollback:**
  Revert commit for `FinancialPlanningView.js`.

---

## Phase 2: Medium-Severity & Consistency

### 5. Remove Dead Re-Export of `setSelectedStyle` in DashboardView (Priority: MED · Risk: Low · Decision needed: no)

- **Problem:**
  In `src/views/DashboardView.js` (line ~33 hint), `export { setSelectedStyle };` re-exports a function imported from `../utils/transaction-selection.js`. Grepping the entire repository shows zero files import `setSelectedStyle` from `DashboardView.js`.
- **Solution:**
  Remove `export { setSelectedStyle };` while retaining the local import `import { setSelectedStyle } from '../utils/transaction-selection.js';`.
- **Files:** `src/views/DashboardView.js`
- **Verification:**
  Run `yarn test` on dashboard tests; run build `yarn run build` to confirm zero export resolution breakages.
- **Success Criteria:**
  `setSelectedStyle` is no longer exported from `DashboardView.js`; all tests and build pass.
- **Rollback:**
  Revert commit for `DashboardView.js`.

---

### 6. Order Filter State Mutation After Transaction Update in EditView (Priority: MED · Risk: Low · Decision needed: no)

- **Problem:**
  In `src/views/EditView.js` (lines ~161–165 hint), `sessionStorage.setItem(STORAGE_KEYS.DASHBOARD_FILTER, data.accountId)` is called *before* `TransactionService.update(id, data)`. If `TransactionService.update` fails, the error is caught and rolled back, but the filter state in session storage was already altered. Sibling file `AddView.js` (line ~94 hint) explicitly documents and executes the filter update *after* transaction persistence.
- **Solution:**
  Move `sessionStorage.setItem` immediately after `TransactionService.update(id, data)` and `markTransactionForHighlight(id)`.
- **Files:** `src/views/EditView.js`
- **Verification:**
  Simulate a failure in `TransactionService.update` in a test; verify that `sessionStorage.getItem(STORAGE_KEYS.DASHBOARD_FILTER)` remains unchanged.
- **Success Criteria:**
  `sessionStorage` filter is only updated when transaction update completes successfully.
- **Rollback:**
  Revert commit for `EditView.js`.

---

### 7. Remove Stale Comment in GoalsSection (Priority: LOW · Risk: Low · Decision needed: no)

- **Problem:**
  In `src/views/financial-planning/GoalsSection.js` (line ~180 hint), the comment `// Import StorageService dynamically` precedes `StorageService.createGoal(...)`. `StorageService` is actually statically imported at line 27.
- **Solution:**
  Remove the stale line comment.
- **Files:** `src/views/financial-planning/GoalsSection.js`
- **Verification:**
  Inspection of git diff.
- **Success Criteria:**
  Stale comment removed.
- **Rollback:**
  Revert commit for `GoalsSection.js`.

---

## Phase 3: Token Hygiene & Formatting Hygiene

### 8. Remediate Style Bypasses in LoginView (Priority: LOW · Risk: Low · Decision needed: no)

- **Problem:**
  In `src/views/LoginView.js` (lines ~237–248, 311–326, 447, 455, 502–505 hints), raw pixel dimensions (`12px`, `28px`, `18px`, `10px`, `4px`, `1px`) are passed inside `Object.assign(el.style, { ... })`. This bypassed the `no-raw-style-values` linter.
- **Solution:**
  Replace raw literals with existing design constants (`SPACING.XS`, `SPACING.SM`, `TOUCH_TARGETS.MIN_HEIGHT`, or dedicated CSS classes in `src/styles/components/forms-dialogs.css`).
- **Files:** `src/views/LoginView.js`
- **Verification:**
  Run `npx eslint src/views/LoginView.js` and visual QA of login view elements (eye toggle, password checklist, Google sign-in button).
- **Success Criteria:**
  No raw pixel literals inside `LoginView.js` style assignments.
- **Rollback:**
  Revert commit for `LoginView.js`.

---

### 9. Remove Dead `#333` Fallback in SettingsView (Priority: LOW · Risk: Low · Decision needed: no)

- **Problem:**
  In `src/views/SettingsView.js` (line ~341 hint), `border-bottom: 1px solid var(--color-border, #333);` specifies a fallback for `--color-border`. `--color-border` is defined in `tokens.css:71` and `critical.css:14`, making the fallback dead per Playbook Part 5.4.
- **Solution:**
  Use `${COLORS.BORDER}` or `var(--color-border)`.
- **Files:** `src/views/SettingsView.js`
- **Verification:**
  Inspect Settings view update section border; confirm styling matches design tokens.
- **Success Criteria:**
  No `#333` fallback string literal.
- **Rollback:**
  Revert commit for `SettingsView.js`.

---

### 10. Extract `'dashboard_date_range_filter'` to Constants (Priority: LOW · Risk: Low · Decision needed: no)

- **Problem:**
  The literal string `'dashboard_date_range_filter'` is duplicated 9 times across `src/views/DashboardView.js` (lines ~268, 522, 530, 539, 571, 900, 936, 1037, 1228 hints).
- **Solution:**
  Add `DASHBOARD_DATE_RANGE_FILTER: 'dashboard_date_range_filter'` to `STORAGE_KEYS` in `src/utils/constants.js` and replace all 9 occurrences in `DashboardView.js`.
- **Files:**
  - `src/utils/constants.js`
  - `src/views/DashboardView.js`
- **Verification:**
  Run date filter flows in Dashboard view; verify date range filter persists and clears as expected.
- **Success Criteria:**
  Zero raw `'dashboard_date_range_filter'` strings in `DashboardView.js`.
- **Rollback:**
  Revert commit touching `constants.js` and `DashboardView.js`.

---

### 11. Use `formatCurrency` in OverviewSection (Priority: LOW · Risk: Low · Decision needed: no)

- **Problem:**
  In `src/views/financial-planning/OverviewSection.js` (lines ~98, 103, 108 hints), the Euro symbol `'€'` is hardcoded into recommendation strings: ``Build emergency fund to €${...}``.
- **Solution:**
  Use `formatCurrency(recommendedAmount)` from `src/utils/financial-planning-helpers.js`.
- **Files:** `src/views/financial-planning/OverviewSection.js`
- **Verification:**
  Inspect the Financial Health Overview section; verify recommendation text displays currency formatted through the app's standard currency formatter.
- **Success Criteria:**
  Zero hardcoded `'€'` characters in `OverviewSection.js`.
- **Rollback:**
  Revert commit for `OverviewSection.js`.

---

### 12. Replace `innerHTML = '← Back'` with `textContent` (Priority: LOW · Risk: Low · Decision needed: no)

- **Problem:**
  In `src/views/SettingsView.js` (line ~50 hint) and `src/views/FinancialPlanningView.js` (line ~155 hint), `backButton.innerHTML = '← Back'` is used for static text, violating the project standard in `AGENTS.md` (*"Untrusted input goes in with textContent, never innerHTML"*).
- **Solution:**
  Change to `backButton.textContent = '← Back'`.
- **Files:**
  - `src/views/SettingsView.js`
  - `src/views/FinancialPlanningView.js`
- **Verification:**
  Visual check of back buttons in Settings and Financial Planning views.
- **Success Criteria:**
  Both files use `textContent` for the back button label.
- **Rollback:**
  Revert commit touching the two files.

---

## Deferred Phase: Architectural Modularization

### 13. Modularize Views Exceeding 500-Line Limit (Priority: MED · Risk: High · Decision needed: yes)

- **Scope:**
  - `ReportsView.js` (1,445 lines)
  - `DashboardView.js` (1,436 lines)
  - `GoalsSection.js` (988 lines)
  - `InvestmentsSection.js` (943 lines)
  - `LoginView.js` (540 lines)
  - `ForecastsSection.js` (536 lines)
  - `FinancialPlanningView.js` (514 lines)
- **Status:** **Deferred to separate, dedicated refactoring passes**
- **Rationale:**
  Per Playbook Part 1 #12 and Part 3 R15: *"Don't bundle a split-this-file refactor into an unrelated cleanup"*. Refactoring 1,400+ line files while executing bug fixes and token cleanups creates unreviewable diffs and high regression risk.
- **Sub-Plan:**
  1. `ReportsView.js`: Extract section updaters (`updateBudgetSummary`, `updateCategoryBreakdown`, `updateCategorySelector`, `updateIncomeExpense`) into `src/views/reports/`.
  2. `DashboardView.js`: Extract selection mode handlers, filter popovers, and anomaly banner wiring into dedicated helper modules.
  3. `GoalsSection.js` & `InvestmentsSection.js`: Extract form dialogs and summary statistics components.

---

## Traceability Matrix

Every finding from the audit report is mapped below to its explicit destination:

| Finding ID & Title | Severity | Status | Destination |
|---|---|---|---|
| 0. Delete `ConfirmDialog` dynamic import failure handling | 🔴 🔒 | User Review Required | Implementation Plan Item 0 |
| 1. `ReportsView.js` clobbered `income-expense-section` class | 🔴 | Scheduled | Phase 1, Item 1 |
| 2. `ForecastsSection.js` un-awaited chart insertion race | 🔴 | Scheduled | Phase 1, Item 2 |
| 3. `InvestmentsSection.js` empty catch on unlock card | 🔴 | Scheduled | Phase 1, Item 3 |
| 4. `FinancialPlanningView.js` missing load error UI | 🔴 | Scheduled | Phase 1, Item 4 |
| 5. Dead `setSelectedStyle` re-export in `DashboardView.js` | 🟡 | Scheduled | Phase 2, Item 5 |
| 6. `EditView.js` filter storage set before transaction update | 🟡 | Scheduled | Phase 2, Item 6 |
| 7. `GoalsSection.js` stale `StorageService` comment | 🟡 | Scheduled | Phase 2, Item 7 |
| 8. `LoginView.js` `Object.assign` style bypasses | ⚪ | Scheduled | Phase 3, Item 8 |
| 9. `SettingsView.js` dead `#333` fallback | ⚪ | Scheduled | Phase 3, Item 9 |
| 10. `DashboardView.js` magic `'dashboard_date_range_filter'` string | ⚪ | Scheduled | Phase 3, Item 10 |
| 11. `OverviewSection.js` hardcoded `'€'` symbol | ⚪ | Scheduled | Phase 3, Item 11 |
| 12. `innerHTML = '← Back'` in `SettingsView` & `FinancialPlanningView` | ⚪ | Scheduled | Phase 3, Item 12 |
| 13. 7 view files exceeding 500 lines limit | 🟡 | Deferred | Deferred Phase, Item 13 |

---

## Verification & Rollback Strategy

- **Phase Execution Principle:** Commit one concern at a time; never bundle Phase 1 with Phase 2 or Phase 3.
- **Automated Verification Loop per commit:**
  ```powershell
  npx eslint <changed-files>
  npx prettier --check <changed-files>
  yarn test <affected-test-suite>
  yarn run check
  ```
- **Pre-Commit Gate:**
  Revert individual fixes in test environment to verify tests fail before fix and pass after fix (Playbook Part 7.2).
- **Rollback:**
  Each phase item is atomic and git-revertable independently without breaking sibling modules.
