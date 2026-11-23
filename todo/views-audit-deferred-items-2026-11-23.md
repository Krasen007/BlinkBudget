# Views Audit — Deferred Items (Item 0 & Item 13)

**Date:** 2026-11-23  
**Source:** `todo/views-audit-implementation-plan-2026-11-23.md`  
**Status:** Deferred / awaiting author decision

---

## Item 0 — Dynamic `ConfirmDialog` Load Failure Handling (🔴 High · 🔒 Security/Deletion · User Review Required)

Per Playbook Part 1 #11 and Part 8.3, security-sensitive code and destructive data-deletion paths are **never auto-remediated** without explicit author confirmation. Left untouched during the Items 1–12 pass.

### Problem

When deleting transactions, budgets, goals, or investment holdings, each view dynamically imports `ConfirmDialog.js`:

| File                                                                   | Pattern                                              | Defect                        |
| ---------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------- |
| `src/views/EditView.js` (~line 197)                                    | `import('../components/ConfirmDialog.js').then(...)` | No `.catch()`                 |
| `src/views/financial-planning/BudgetsSection.js` (~line 309)           | `await import('../../components/ConfirmDialog.js')`  | No `try/catch`                |
| `src/views/financial-planning/GoalsSection.js` (~line 653)             | `await import('../../components/ConfirmDialog.js')`  | No `try/catch`                |
| `src/views/financial-planning/InvestmentsSection.js` (~lines 520, 766) | `.catch(err => console.error(...))`                  | Logs only, zero user feedback |

If a network failure or chunk cache eviction occurs while offline, clicking "Delete" silently fails or raises an unhandled promise rejection with no user feedback.

### Proposed Solution

Wrap dynamic imports in a consistent error-handling pattern across all 4 files:

```javascript
try {
  const { ConfirmDialog } = await import('../../components/ConfirmDialog.js');
  ConfirmDialog({ ... });
} catch (error) {
  console.error('Failed to open confirmation dialog:', error);
  showErrorToast('Failed to open confirmation dialog. Please check your connection.');
}
```

All four files already import `showErrorToast`, so no new dependency is needed.

### Files

- `src/views/EditView.js`
- `src/views/financial-planning/BudgetsSection.js`
- `src/views/financial-planning/GoalsSection.js`
- `src/views/financial-planning/InvestmentsSection.js`

### Verification

Simulate a dynamic import failure (block the chunk URL or simulate offline chunk rejection), click "Delete" in all four locations, and verify the user receives an error toast rather than an unresponsive UI or unhandled rejection.

### Success Criteria

- Zero unhandled promise rejections on delete actions.
- Error toast is shown whenever `ConfirmDialog` fails to load.

### Rollback

Revert the commit touching the 4 files.

---

## ⚠️ Observation (out of scope, flagged only)

`src/views/DashboardView.js` `handleBulkDelete` (~line 443) has the **same unguarded `ConfirmDialog` dynamic import** as Item 0:

```javascript
import('../components/ConfirmDialog.js').then(({ ConfirmDialog }) => {
  ConfirmDialog({ ... });
});
```

No `.catch()` — identical defect pattern to Item 0, but `DashboardView.js` is **not** among the 4 files named in the plan. Flagged here so it is not lost; requires a separate author decision on whether to include it in the Item 0 fix set.

---

## Item 13 — Modularize Views Exceeding 500-Line Limit (🟡 Medium · Risk: High · Deferred)

**Status:** Deferred to separate, dedicated refactoring passes  
**Rationale:** Per Playbook Part 1 #12 and Part 3 R15: _"Don't bundle a split-this-file refactor into an unrelated cleanup."_ Refactoring 1,400+ line files while executing bug fixes and token cleanups creates unreviewable diffs and high regression risk.

### Scope (7 view modules exceeding the 500-line limit)

| File                                                 | Lines |
| ---------------------------------------------------- | ----- |
| `src/views/ReportsView.js`                           | 1,445 |
| `src/views/DashboardView.js`                         | 1,436 |
| `src/views/financial-planning/GoalsSection.js`       | 988   |
| `src/views/financial-planning/InvestmentsSection.js` | 943   |
| `src/views/LoginView.js`                             | 540   |
| `src/views/financial-planning/ForecastsSection.js`   | 536   |
| `src/views/FinancialPlanningView.js`                 | 514   |

### Sub-plan (for dedicated refactoring passes)

1. `ReportsView.js`: Extract section updaters (`updateBudgetSummary`, `updateCategoryBreakdown`, `updateCategorySelector`, `updateIncomeExpense`) into `src/views/reports/`.
2. `DashboardView.js`: Extract selection mode handlers, filter popovers, and anomaly banner wiring into dedicated helper modules.
3. `GoalsSection.js` & `InvestmentsSection.js`: Extract form dialogs and summary statistics components.

### Rollback

Each extraction is atomic and git-revertable independently.
