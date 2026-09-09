# Implementation Plan: AI Slop Remediation

Address the findings identified during the codebase audit against [ai-slop-inspection-guide.md](file:///f:/AI/repos/BlinkBudget/todo/ai-slop-inspection-guide.md). The plan is divided into three phased passes: safety & high-severity bug fixes, dead code & orphan file pruning, and maintainability & design system cleanup.

## Proposed Changes

### Phase 1: DONE
---

### Phase 2: Orphan File & Dead Export Pruning (🔴 High)

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
