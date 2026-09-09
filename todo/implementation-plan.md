# Implementation Plan: AI Slop Remediation

Address the findings identified during the codebase audit against [ai-slop-inspection-guide.md](file:///f:/AI/repos/BlinkBudget/todo/ai-slop-inspection-guide.md). The plan is divided into three phased passes: safety & high-severity bug fixes, dead code & orphan file pruning, and maintainability & design system cleanup.

## User Review Required

> [!IMPORTANT]
> **Orphan File Deletions (Phase 2)**:
> The following files have **0 callsites across all src files, tests, and configurations**:
>
> - `src/core/lazy-loader.js` (826 lines)
> - `src/core/accessibility-service.js` (627 lines)
> - `src/utils/touch-gestures.js` (351 lines)
> - `src/utils/tooltip-config.js` (335 lines)
> - `src/components/ConflictDialog.js` (127 lines)
> - `src/components/FloatingBackButton.js` (90 lines)
> - `src/components/financial-planning/DataTable.js` (82 lines)
> - `src/components/financial-planning/Placeholder.js` (27 lines)
>
> Removing them eliminates ~2,400 lines of dead code and reduces bundle clutter.

> [!WARNING]
> **Destructive Data Wipe in ReportsView.js (Phase 1)**:
> In [ReportsView.js:L553](file:///f:/AI/repos/BlinkBudget/src/views/ReportsView.js#L553), when reading transactions fails, the catch block runs `localStorage.removeItem('blinkbudget_transactions')`. This will be removed immediately as it wipes user data.

---

## Proposed Changes

### Phase 1: High-Severity Safety & Correctness Fixes (🔴 High)

#### [MODIFY] [EditView.js](file:///f:/AI/repos/BlinkBudget/src/views/EditView.js)

- Add missing `return;` inside the `onSubmit` `catch` block (line 208) so execution does not fall through leaving user stranded without feedback or navigation.
- Log error when the `transaction-undo` dynamic import fails in `onDelete` (line 222).
- Remove dead IDOR ownership check (lines 29-35) since `TransactionService.get(id)` already enforces ownership.

#### [MODIFY] [ReportsView.js](file:///f:/AI/repos/BlinkBudget/src/views/ReportsView.js)

- Remove `localStorage.removeItem('blinkbudget_transactions')` in the storage catch block (lines 551-556).
- Collapse the triple-nested recursive try/catch validation loop (lines 601-628) into a clean single validation pass with sanitization fallback.

#### [MODIFY] [account-deletion-service.js](file:///f:/AI/repos/BlinkBudget/src/core/Account/account-deletion-service.js)

- Fix verification catches (lines 426-495) where runtime or storage errors were falsely recorded as `verificationResults.* = true` (marking entities as verified deleted when they failed to query). Set to `false` and push to `result.warnings`.

#### [MODIFY] [DashboardView.js](file:///f:/AI/repos/BlinkBudget/src/views/DashboardView.js)

- Add error logging to swallowed `transaction-undo` import (line 374).
- Add warning log to swallowed catch in `_saveDismissedAnomalyId` (lines 265-267).

#### [MODIFY] [TransactionForm.js](file:///f:/AI/repos/BlinkBudget/src/components/TransactionForm.js)

- Collapse triple `setTimeout` focus escalation (lines 408-415) to immediate focus + 150ms timeout.
- Replace `'44px'` literals with `TOUCH_TARGETS.MIN_HEIGHT`.
- Remove dead `okBtn.classList.remove('mobile-btn-primary', 'touch-target-primary')`.

#### [MODIFY] [transaction-service.js](file:///f:/AI/repos/BlinkBudget/src/core/transaction-service.js)

- Remove redundant `localStorage.removeItem(TRANSACTIONS_KEY)` before `this._persist([])` in `clear()` (line 374).
- Add `console.warn` for storage write failure on `_lastLocalUpdate` (line 394).
- Replace remaining callsites of `getAllTransactions()` with `getAll()` and remove the alias.

#### [MODIFY] [custom-category-service.js](file:///f:/AI/repos/BlinkBudget/src/core/custom-category-service.js) and [sync-service.js](file:///f:/AI/repos/BlinkBudget/src/core/sync-service.js)

- Add `console.warn` for swallowed `_lastLocalUpdate` storage errors.

---

### Phase 2: Orphan File & Dead Export Pruning (🔴 High)

#### [DELETE] Orphan Files (0 callsites)

- `src/core/lazy-loader.js`
- `src/core/accessibility-service.js`
- `src/utils/touch-gestures.js`
- `src/utils/tooltip-config.js`
- `src/components/ConflictDialog.js`
- `src/components/FloatingBackButton.js`
- `src/components/financial-planning/DataTable.js`
- `src/components/financial-planning/Placeholder.js`

#### [MODIFY] [validation.js](file:///f:/AI/repos/BlinkBudget/src/utils/form-utils/validation.js)

- Remove unused composite validator export `validateTransactionForm`.

#### [MODIFY] [success-feedback.js](file:///f:/AI/repos/BlinkBudget/src/utils/success-feedback.js)

- Remove unused dead export `showSuccessCheckmark` and its helper `addSuccessStyles()`.
- Remove module-scope side effect (`if (typeof document !== 'undefined') addSuccessStyles();`).

#### [MODIFY] [touch-utils.js](file:///f:/AI/repos/BlinkBudget/src/utils/touch-utils.js)

- Remove unused dead exports `addTouchFeedback`, `addTouchFeedbackClass`, and `addHoverEffects`.

---

### Phase 3: Duplication, Indirection, and Token Cleanup (🟡 Medium / ⚪ Low)

#### [MODIFY] [submission.js](file:///f:/AI/repos/BlinkBudget/src/utils/form-utils/submission.js)

- Inline `getDateSource` duck-type helper.
- Remove unreachable `else` branch in date parsing (lines 124-126).
- Simplify overly defensive 6-guard `preserveTimeFromExistingTimestamp` (lines 68-89).
- Replace fallback ad-hoc error div with `showErrorToast`.
- Strip narrating condition comments (lines 104, 107, 111, 129, 134).

#### [MODIFY] [CustomCategoryManager.js](file:///f:/AI/repos/BlinkBudget/src/components/CustomCategoryManager.js) and [GoalsSection.js](file:///f:/AI/repos/BlinkBudget/src/views/financial-planning/GoalsSection.js)

- Replace duplicate ad-hoc error divs with standard `showErrorToast`.
- In `GoalsSection.js`, consolidate the 9 redundant dynamic imports of `storage.js`.

#### [MODIFY] [toast-notifications.js](file:///f:/AI/repos/BlinkBudget/src/utils/toast-notifications.js)

- Collapse 3-layer remove indirection (`removeToastById -> removeToast -> animateToastOut`).
- Remove `|| N` magic duration fallbacks (`TIMING.NOTIFICATION_SUCCESS || 3000`).

#### [MODIFY] [router.js](file:///f:/AI/repos/BlinkBudget/src/core/router.js)

- Remove method-restating trivial comments on `on`, `init`, `navigate`, `before`, `handleRoute`.

#### [MODIFY] [PrivacyControls.js](file:///f:/AI/repos/BlinkBudget/src/components/PrivacyControls.js)

- Replace raw hex colors (`#10b981`, `#ef4444`, etc.) with `COLORS.*` constants.

---

## Verification Plan

### Automated Tests

Targeted Vitest runs will be executed after each phase:

- `yarn vitest run tests/views/edit-view.test.js`
- `yarn vitest run tests/views/reports-view.test.js`
- `yarn vitest run tests/form-utils/submission.test.js`
- `yarn vitest run tests/utilities/transaction-form.test.js`
- `yarn vitest run tests/financial-planning/GoalsSection.test.js`
- `yarn vitest run tests/financial-planning/OverviewSection.test.js`
- `yarn vitest run tests/financial-planning/ForecastsSection.test.js`
- `yarn vitest run tests/system/main.test.js`
- `yarn run check` (Linting, stylelint, format, and doc validation)
- `yarn run build` (Vite production bundle build to ensure clean bundling with no missing imports)

### Manual Verification

- Verify edit transaction flow: edit amount, cancel, delete (with undo).
- Verify reports view loads without errors and without wiping local storage.
- Verify add transaction flow and error toasts.
