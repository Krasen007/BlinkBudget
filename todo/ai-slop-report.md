# AI Slop Report — September 2026

Audit of `src/` using the aislop rule taxonomy (reasoned, not tooled).
Files reviewed: `TransactionForm.js`, `transaction-service.js`, `router.js`, `AddView.js`, `EditView.js`,
`transaction-tags.js`, `submission.js`, `validation.js`, `toast-notifications.js`, `success-feedback.js`, `main.js`.

See [ai-slop-guide.md](ai-slop-guide.md) for how to extend this audit to other files.

---

## HIGH — Fix first

### H1 · `EditView.js` — missing `return` after error catch
After the `catch` block rolls back the ghost mutation and shows a toast, execution falls through
with no navigation — the user is stranded on the edit view. `AddView.js` correctly `return`s.

**Fix:** add `return;` at the end of the catch block in the `onSubmit` handler.

### H2 · `EditView.js` — completely swallowed dynamic-import error
```js
.catch(() => {});
```
The `.catch` on the `transaction-undo` dynamic import inside `onDelete` discards everything silently.

**Fix:** at minimum `console.error` the import failure; ideally show a fallback UI or log to monitoring.

### H3 · `transaction-service.js` — swallowed localStorage write
```js
try {
  localStorage.setItem(`${TRANSACTIONS_KEY}_lastLocalUpdate`, 'pending');
} catch {
  // ignore storage errors
}
```
Downstream sync logic depends on this marker. Silent failure means sync state is wrong with no signal.

**Fix:** `console.warn` at minimum; consider surfacing to caller.

### H4 · `success-feedback.js` — dead export runs code at import time
`showSuccessCheckmark()` is exported but never called. Its companion `addSuccessStyles()` injects
a `<style>` tag on every import of the module — side-effectful dead code.

**Fix:** delete `showSuccessCheckmark`, `addSuccessStyles`, and the injected CSS block. The
`markTransactionForHighlight` / `highlightTransactionSuccess` functions are the only ones in use.

### H5 · `transaction-service.js` — `clear()` redundant `removeItem`
```js
localStorage.removeItem(TRANSACTIONS_KEY);   // <-- no-op
this._persist([]);                           // immediately re-writes the key
```
`removeItem` is overwritten by `_persist([])` on the next line.

**Fix:** remove the `localStorage.removeItem` call; `_persist([])` alone is sufficient.

### H6 · `EditView.js` — dead IDOR ownership check
`TransactionService.get(id)` already enforces user-ownership internally and returns `undefined` on
mismatch. The explicit ownership check in `EditView` (lines 27-31) can never trigger.

**Fix:** remove the duplicate check; rely on the `if (!transaction)` guard that follows.

---

## MEDIUM — Clean up

### M1 · `TransactionForm.js` — triple `setTimeout` focus
```js
focusInput();
setTimeout(focusInput, 150);
setTimeout(focusInput, 450);
```
Two of the three calls are no-ops (`.focus()` on an already-focused element does nothing).

**Fix:** keep one `setTimeout(focusInput, 150)` and the immediate call; drop the 450ms duplicate.

### M2 · `submission.js` — `getDateSource()` duck-type factory
One-callsite wrapper that exists only to normalize `DateInput.getDate()` vs `.value`.
Adds a factory function + two getter properties + a fallback `createElement` for a single `if` check.

**Fix:** inline the check into `prepareTransactionData`; remove `getDateSource`.

### M3 · `submission.js` — unreachable else-branch
After `!isNaN(parsedDate.getTime())`, the `if (year && month && day) { ... } else { timestamp = new Date().toISOString() }` else is dead — a valid parsed date cannot produce falsy components.

**Fix:** remove the `else` branch.

### M4 · `submission.js` — 6-guard over-defensive inner function
`preserveTimeFromExistingTimestamp` has six early-return null/type checks on values already
validated by the outer function.

**Fix:** reduce to the two meaningful guards (`existingTimestamp` presence and `selectedDate.includes('T')`).

### M5 · `submission.js` + `success-feedback.js` — hardcoded values bypass design system
- `submission.js` fallback error div: `#ef4444`, `z-index: 10000`, `12px 16px`, `6px`
- `success-feedback.js`: `box-shadow: 0 4px 12px rgba(0,0,0,0.15)`, `border-radius: 8px`

**Fix:** use `COLORS.ERROR`, `var(--color-error)`, `var(--radius-md)`, `var(--shadow-md)`, `TOUCH_TARGETS`.

### M6 · `TransactionForm.js` — hardcoded `44px` touch targets
`44px` appears twice for the OK and Delete buttons. `TOUCH_TARGETS.MIN_HEIGHT` already holds this value.

**Fix:** replace both `'44px'` literals with `TOUCH_TARGETS.MIN_HEIGHT`.

### M7 · `toast-notifications.js` — magic fallback durations
```js
duration: TIMING.NOTIFICATION_SUCCESS || 3000,
```
If `TIMING` constants are undefined the fallbacks create a second source of truth.

**Fix:** assert the constants exist at app startup, or remove the `|| N` fallbacks entirely.

### M8 · `toast-notifications.js` — three-layer remove indirection
`removeToastById → removeToast → animateToastOut`: two of these layers add zero logic.

**Fix:** export `animateToastOut` directly (renaming if needed) and delete the two wrappers.

### M9 · `validation.js` — `validateTransactionForm()` has zero callsites
The composite validator is never used — `TransactionForm.js` calls the individual validators inline.

**Fix:** either delete it or wire it into `TransactionForm.js` to DRY up the validation block.

### M10 · `transaction-service.js` — `getAllTransactions()` is a zero-logic alias
The JSDoc even says "alias for getAll for API consistency". One of the names should be retired.

**Fix:** grep for all callsites; migrate to `getAll()` and delete `getAllTransactions()`.

---

## LOW — Cleanup

### L1 · `TransactionForm.js` — numbered section-heading comments
14 section comments (`// 1. Form setup`, `// 2. Account Selection`, …) including a duplicate `// 7.`
and decimal sub-numbering (`// 7.5.`, `// 8.5.`). Classic AI scaffolding noise.

**Fix:** delete all of them; the DOM operations are self-explanatory.

### L2 · `TransactionForm.js` — dead `classList.remove`
```js
okBtn.classList.remove('mobile-btn-primary', 'touch-target-primary');
```
These classes were never added to `okBtn`.

**Fix:** delete the line.

### L3 · `router.js` — trivial comments on every method
Every method has a comment that just restates its name (`// Navigate to a new route` above `navigate()`).

**Fix:** delete all of them.

### L4 · `AddView.js` — unfulfilled `"can be removed in production"` comment
```js
// Log metrics for debugging (can be removed in production)
console.log(`Transaction completed: ...`);
```
**Fix:** remove the `console.log` and its comment.

### L5 · `submission.js` — inline comments narrating visible conditions
10+ comments like `// Full timestamp provided, use it`, `// Date only provided`, `// Fallback to current time`.

**Fix:** delete them; the conditions are readable without narration.

---

## Summary

| Priority | Count | Key files |
|---|---|---|
| HIGH | 6 | `EditView.js`, `transaction-service.js`, `success-feedback.js` |
| MEDIUM | 10 | `submission.js`, `TransactionForm.js`, `toast-notifications.js`, `validation.js` |
| LOW | 5 | `TransactionForm.js`, `router.js`, `AddView.js`, `submission.js` |
