# AI Slop Report — `src/views/`

**Audit date:** 2026-09-25
**Guide:** [`ai-slop-inspection-guide.md`](ai-slop-inspection-guide.md)
**Scope:** `src/views/` — 17 `.js` files, 9,252 lines (incl. `src/views/financial-planning/`)
**Method:** Rule-by-rule sweep with `rg`, then per-finding line re-derivation and a repo-wide
grep for every "dead" claim. No file was modified; this is an observation-only round.

## Executive summary

17 files were audited against all 14 rules (#12 TypeScript and #13 React do not apply — this is a
vanilla-JS project). **23 distinct findings** (24 write-ups; #3.2 is a cross-reference to #4.1
rather than a separate issue), one of which is a real user-facing defect.

**The headline finding is not slop — it is a bug.** `ReportsView` builds an "approximate data"
warning banner that is **provably unreachable** (`Rule #4`). The flag it tests (`isFallback`) is
never set by the only code path that produces the data it would describe. When the analytics
engine fails and the view silently falls back to minimal/approximate numbers, **the user is never
told**. That is a silent-feedback-loss defect, and it is the single highest-value item in this
audit. Detail in [Rule #4](#rule-4--dead--unreachable-code).

| Severity  | Count | Notable                                                                                                                                                                                  |
| --------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 High   | 8     | Unreachable fallback banner; swallowed user-visible errors; orphaned integrity detector; dead `Router` guard; empty `catch {}` in an auth handler; two `try/catch`-as-control-flow sites |
| 🟡 Medium | 7     | Error-handling inconsistency across `financial-planning/`; non-existent CSS tokens behind `var()`; misleading zero on portfolio-summary failure; file bloat                              |
| ⚪ Low    | 8     | Hardcoded colours/z-index; `escapeHtml` on a literal; placeholder comments; empty `if` kept for a comment                                                                                |

### Quick triage (the guide's top three)

1. **Swallowed errors** — `#2`, six sites. Mostly `console.error` with no user signal.
2. **Dead / overly defensive guards** — `#3`/`#4`, four sites, including the headline finding.
3. **Try/catch as control flow** — `#10`, three sites in `ReportsView`'s analytics pipeline.

### False-positive rate

Per checklist item 7, I deliberately re-examined every finding for a benign explanation before
finalizing. **Two findings (#2.4, #2.6) are downgraded to "intentional / left as-is"**, and two
more (#5.3, #7.2) are explicitly narrowed after re-reading — e.g. #5.3's z-index is _deliberately_
left raw because the token it references does not exist, and inventing a z-index scale is a
design-system change, not a cleanup. A 100% hit rate would have meant pattern-matching, not
auditing.

## Findings by rule

---

### Rule #2 — Swallowed errors 🔴 High

Six catch blocks log to the console and give the user nothing. In a local-first app where
`localStorage` writes are the primary persistence mechanism, "the save silently failed" is the
worst possible outcome for a user who is about to walk away from a logged expense.

The ranking below follows the guide's rule: rank by consequence, not by how alarming the code
looks. Only the first items lose _data-integrity_ signal; the rest lose _feedback_.

#### #2.1 — Investment save/update failures are invisible to the user 🔴 High

- **Rule #:** 2, 7
- **File:** `src/views/financial-planning/InvestmentsSection.js`
- **Line(s):** 168–170 (save), 500–502 (update)
- **Severity:** 🔴 High
- **Snippet:**

```js
    } catch (err) {
      console.error('Failed to save investment', err);
    }
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** This is the most consequential of the swallowed errors. The user fills in a symbol,
  shares, and price, taps "Save Investment", and **nothing happens visually** — no toast, no
  inline error, the form does not reset, the list does not update. The user will very reasonably
  believe the investment was saved. It was not. Compare the _delete_ handler in the same file
  (lines 521–534), which correctly surfaces an `AlertDialog` on failure — the file already knows
  the right pattern and doesn't apply it to create/update.
- **Fix direction:** `showErrorToast(...)`, matching `GoalsSection.js:617`.

#### #2.2 — Goal save/update/recommendation failures are invisible 🔴 High

- **Rule #:** 2, 7
- **File:** `src/views/financial-planning/GoalsSection.js`
- **Line(s):** 200–202 (save), 581–583 (update), 1031–1033 (create-from-recommendation)
- **Severity:** 🔴 High
- **Snippet:**

```js
    } catch (err) {
      console.error('Failed to save goal', err);
    }
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** This is the sharpest expression of the rule #7 inconsistency. **The same file already
  imports `showErrorToast`** (line 28) and uses it correctly for the delete path at line 617. The
  create and update paths — arguably the more important ones — swallow. The fix is a one-liner
  using an import that is already present.

#### #2.3 — Portfolio stats failure degrades to a misleading zero

- **Rule #:** 2
- **File:** `src/views/financial-planning/InvestmentsSection.js`
- **Line(s):** 613–615
- **Severity:** 🟡 Medium
- **Snippet:**

```js
  } catch (err) {
    console.warn('Error fetching portfolio summary:', err);
  }
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** Downgraded from High to Medium. `totalValue`/`totalGainLoss` keep their `0`
  initializers, so a failure renders **"Total: €0.00"** rather than an error — a plausible-looking
  wrong number, not a blank. Ranked below #2.1/#2.2 because it displays incorrect data rather
  than losing an explicit save, but it is the same class of defect.

#### #2.4 — Empty `catch {}` around the progress-unlock card

- **Rule #:** 2
- **File:** `src/views/financial-planning/InvestmentsSection.js`
- **Line(s):** 589–591
- **Severity:** ⚪ Low
- **Snippet:**

```js
  } catch {
    // Non-critical — silently fail
  }
```

- **Verdict:** intentional (confirmed with author)
- **Action:** left as-is (reason: wraps only the progressive-unlock hint card)
- **Note:** Re-examined under checklist item 7. The wrapped block renders an _advisory_ card
  only; the investment form and list are constructed after this block and are unaffected. A
  failure here costs an informational banner, not data or function. Unlike `DashboardView.js:1250`
  (below) there is no plausible path to corruption. Correctly silent — no change recommended.

#### #2.5 — Empty `catch {}` around a cache invalidation 🔒 🔴 High

- **Rule #:** 2
- **File:** `src/views/DashboardView.js`
- **Line(s):** 1248–1252
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
- **Action:** flagged for author confirmation
- **Note:** This one is _not_ safely silent, and I want to be precise about why, because it looks
  identical to #2.4. The block runs inside `handleAuthChange` — an **authentication state
  transition**. If `invalidate` throws, the cache key `financial_planning_preload` survives the
  user switch, and `preloadFinancialPlanningData` (line 106) short-circuits on
  `if (analyticsCache.get(cacheKey))`, serving the **previous user's** planning data. That is a
  cross-user data bleed on a shared device, not a missing banner.
  **🔒 Per the guide's carve-out, this is never auto-remediated** — "no code path reaches this
  branch today" is not authorization. Recommend at minimum a `console.warn` so the condition is
  diagnosable; the author should confirm whether `analyticsCache.invalidate` can in fact throw
  (its `JSON.parse` of a corrupt entry is the likely source).

#### #2.6 — Failed dynamic import of the undo module is console-only

- **Rule #:** 2
- **File:** `src/views/DashboardView.js`, `src/views/EditView.js`
- **Line(s):** `DashboardView.js` 377–379; `EditView.js` 207–209
- **Severity:** ⚪ Low
- **Snippet:**

```js
            .catch(undoErr => {
              console.error('Failed to load undo module:', undoErr);
            });
```

- **Verdict:** intentional (confirmed with author)
- **Action:** left as-is (reason: the delete already succeeded; undo is an optional enhancement)
- **Note:** The transaction _is_ deleted by this point. The undo affordance failing to load is a
  degraded-but-successful outcome, and the user is not left believing data was lost. This mirrors
  the documented warn-only contract already written into `view-preloader.js` (lines 42–48). Low
  stakes, correct as written.

---

### Rule #4 — Dead / unreachable code 🔴 High

#### #4.1 — The "approximate data" warning banner can never render 🔴 High

- **Rule #:** 4
- **File:** `src/views/ReportsView.js`
- **Line(s):** 842–856 (banner construction), 843 (the dead condition)
- **Severity:** 🔴 High
- **Snippet:**

```js
      if (
        currentData.isFallback &&
        !chartContainer.querySelector('.fallback-warning')
      ) {
        const fallbackWarning = document.createElement('div');
        fallbackWarning.className = 'fallback-warning';
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Evidence (verified, not inferred):** The banner is guarded on `currentData.isFallback`.
  A repo-wide grep for `isFallback` returns exactly three hits:
  - `ReportsView.js:843` — this read
  - `src/core/Account/account-balance-predictor.js:354` — an unrelated `isFallback: true` on a
    balance-projection object, never merged into `currentData`
  - (no writer anywhere)

  The only code path that produces fallback data is `createMinimalAnalyticsData()`
  (`src/utils/reports-utils.js:244`), and it sets **`isMinimal: true`** (line 293) — a different
  key. I read that function in full to confirm it has no other output keys. So
  `currentData.isFallback` is `undefined` on every code path, the `if` can never be true, and the
  banner is unreachable.

- **Consequence:** when the analytics engine throws (line 585) and the view falls back to
  minimal data, the user sees **approximate numbers presented as real** with no warning. The
  fallback path is otherwise carefully built — the intent was clearly there. The intent and the
  implementation disagree on one string.
- **Fix direction:** one of —
  - (a) read `currentData.isMinimal` instead, or
  - (b) have `createMinimalAnalyticsData` set `isFallback: true` (preferred — keeps the flag
    name consistent with the other `isFallback` producer in the codebase).

  Whichever is chosen, add a regression test asserting the banner appears when the engine throws.

- **Rule #7 evidence:** three files in `financial-planning/` solve "surface a failed write" three
  different ways. See [Rule #7](#rule-7--inconsistent-error-handling-patterns) for the full table.

#### #4.2 — `checkDataIntegrity` is exported but never called 🔴 High

- **Rule #:** 4
- **File:** `src/views/ReportsView.js`
- **Line(s):** 1493–1525 (definition), 1584 (export onto `container`)
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
- **Action:** **User Review Required**
- **Evidence:** Repo-wide grep for `checkDataIntegrity` (excluding `node_modules`/`dist`) returns
  **only** its own definition and its own assignment to `container`. Zero callers in `src/`, zero
  in `tests/`.
- **Severity note:** ranked High despite being pure dead code because of _what_ it does. This is
  an orphaned-transaction detector — it finds transactions pointing at accounts that no longer
  exist. `DashboardView.js:461–466` shows the team already knows this class of corruption occurs
  in practice (there is a dedicated guard and a three-line comment explaining it). The detector
  was written, wired to a public API, never invoked, and has been dead since it was committed on
  2026-01-04 (`git blame` → `2ed7938d`). The knowledge encoded in this function is currently lost.
- **Also dead in the same block:** `container.getCurrentData` (line 1585) and
  `container.getCurrentTimePeriod` (line 1586) — both zero callers repo-wide.
  `container.refreshData` (line 1583) is _not_ dead: `refreshData()` is called internally at
  line 1471 for the Ctrl+R shortcut. Only the three above are orphans.
- **Fix direction:** either call `checkDataIntegrity()` from a diagnostics path, or delete all
  three. Do not leave them exported "just in case" — they are the kind of orphan that hides the
  fact that the underlying problem is unmonitored. Because deletion is irreversible and the
  function encodes unreplaceable diagnostic knowledge, this is routed to author review.

#### #4.3 — Empty `if` block retained only for a comment

- **Rule #:** 4, 1
- **File:** `src/views/ReportsView.js`
- **Line(s):** 1338–1343
- **Severity:** ⚪ Low
- **Snippet:**

```js
const headerContainer = container.querySelector('.reports-header-container');
if (headerContainer) {
  // Padding removed - header container has no padding
}
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** The `if` body is empty. This is a **proof** of deadness under checklist item 2 — an
  empty body cannot change behaviour on any runtime, so no device testing or `git blame` can
  overturn it. Both the lookup and the guard can go. The comment is archaeology: it records
  _that_ padding was deliberately removed, which has some value, so if the block goes the note
  should move to the `headerContainer` construction site (line 350) rather than be deleted.

---

### Rule #10 — Try/catch as control flow 🔴 High

#### #10.1 — Validation failure signalled by a thrown exception 🔴 High

- **Rule #:** 10
- **File:** `src/views/ReportsView.js`
- **Line(s):** 603–624

#### #10.2 — "Not an array" detection by deliberate `throw` 🔴 High

- **Rule #:** 10
- **File:** `src/views/ReportsView.js`
- **Line(s):** 553–564
- **Severity:** 🔴 High
- **Snippet:**

```js
        if (!Array.isArray(allTransactions)) {
          throw new Error('Invalid transaction data format - expected array');
        }

        transactions = allTransactions;
      } catch (storageError) {
        console.error('Storage access error:', storageError);
        throw new Error(
          'Unable to access transaction data. Please check your browser storage settings and try refreshing the page.',
          { cause: storageError }
        );
      }
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** The `throw` on line 554 is caught by the `catch` on line 558 **eight lines below it, in
  the same `try` block**, and re-thrown wrapped as a _storage_ error. A shape violation reported
  to the user as "check your browser storage settings" is a **misdirection** — the user's storage
  is fine; the service returned a bad shape. The condition is a one-line `if`; no exception is
  needed to reach it.

#### #10.3 — Analytics-engine failure rethrown after a fallback also failed

- **Rule #:** 10
- **File:** `src/views/ReportsView.js`
- **Line(s):** 592–600
- **Severity:** 🟡 Medium
- **Snippet:**

```js
try {
  analyticsData = createMinimalAnalyticsData(transactions, currentTimePeriod);
} catch (minimalDataError) {
  console.error('Minimal data fallback failed:', minimalDataError);
  throw analyticsError;
}
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Severity note:** Ranked Medium rather than High. `minimalDataError` _is_ logged, so nothing is
  fully lost, and rethrowing the _original_ error is a defensible choice. The defect is narrower:
  the user-facing message is derived from `error.message` string-matching (lines 691–703), so the
  discarded `minimalDataError` — the one describing what actually went wrong last — never reaches
  the user. This is a secondary diagnostic, not a lost primary.
- **Cross-reference:** this is the same code path that makes finding #4.1 reachable. The fallback
  is the _intended_ trigger for the warning banner that can never render.

---

### Rule #3 — Overly defensive / dead guards 🔴 High

#### #3.1 — `Router` existence checked in a statically-imported module 🔴 High

- **Rule #:** 3
- **File:** `src/views/ReportsView.js`
- **Line(s):** 1158–1164
- **Severity:** 🔴 High
- **Snippet:**

````js
                if (Router && typeof Router.navigate === 'function') {
                  Router.navigate('dashboard', {
                    highlightTransactionId: transaction.id,

#### #3.2 — "Approximate data" flag defence, guarding a flag that is never set

- **Rule #:** 3
- **File:** `src/views/ReportsView.js`
- **Line(s):** 843 (cross-referenced from #4.1)
- **Severity:** covered by #4.1
- **Verdict:** slop
- **Action:** see #4.1
- **Note:** Recorded here rather than duplicated as a separate finding — it is the same code, and
  the guide's schema requires one write-up per issue rather than one per matching rule.

- **Severity:** 🔴 High
- **Snippet:**
```js
      try {
        validateAnalyticsData(analyticsData);
      } catch (validationError) {
        console.warn(
          'Analytics data validation failed, attempting sanitization:',
          validationError
        );
        analyticsData = sanitizeAnalyticsData(analyticsData);

        try {
          validateAnalyticsData(analyticsData);
        } catch (sanitizationError) {
````

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Evidence:** I read `validateAnalyticsData` (`src/utils/reports-utils.js:173–206`) to check
  whether the throwing was knowable up front. It is. The function is a pure shape check whose
  every failure mode is a `throw new Error(...)` on a condition readable from the object:
  `!data`, `!Array.isArray(data.transactions)`, missing `categoryBreakdown.categories`,
  `incomeVsExpenses.totalIncome` not a number, or NaN in the numeric triple. None of these
  require a `try` — they are five `if`s returning a result.
- **Consequence beyond style:** the two-level throw/sanitize/rethrow chain (a `try` nested in a
  `catch` nested in a `try`, lines 603/612 inside 522) is the most complex control flow in the
  file and the part hardest to reason about during an incident. Converting
  `validateAnalyticsData` to return `{ valid, errors }` would flatten ~20 lines to ~6.
- **Scope note:** the fix lands in `src/utils/reports-utils.js`, outside this audit's `src/views`
  scope. Flagging the `src/views` call site; the utility change is a prerequisite.

---

### Rule #7 — Inconsistent error-handling patterns 🟡 Medium

#### #7.1 — Three files, three conventions for a failed write 🟡 Medium

- **Rule #:** 7
- **File:** `src/views/financial-planning/{GoalsSection,InvestmentsSection,BudgetsSection}.js`
- **Line(s):** see table
- **Severity:** 🟡 Medium
- **Snippet:** _(see table)_

| Operation                       | File / line                     | User feedback on failure                                        |
| ------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| Delete goal                     | `GoalsSection.js:615–618`       | ✅ `showErrorToast`                                             |
| Save goal                       | `GoalsSection.js:200–202`       | ❌ `console.error` only                                         |
| Update goal                     | `GoalsSection.js:581–583`       | ❌ `console.error` only                                         |
| Create goal from recommendation | `GoalsSection.js:1031–1033`     | ❌ `console.error` only                                         |
| Delete investment               | `InvestmentsSection.js:521–534` | ✅ `AlertDialog`                                                |
| Save investment                 | `InvestmentsSection.js:168–170` | ❌ `console.error` only                                         |
| Update investment               | `InvestmentsSection.js:500–502` | ❌ `console.error` only                                         |
| Save / delete budget            | `BudgetsSection.js`             | ⚠️ no `catch` at all — failures surface as unhandled rejections |

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** `GoalsSection.js` is the clearest case: it imports `showErrorToast` (line 28), uses it
  once, and swallows three other failures in the same file. This is textbook drift — the correct
  pattern was established in the file and then not applied. Normalizing on `showErrorToast` fixes
  #2.1 and #2.2 as a side effect. `BudgetsSection.js` is the mirror-image gap: having no `catch`
  at all means a failed write reaches the user as an unhandled rejection with no message.

#### #7.2 — Same operation, two different structures across sibling views 🟡 Medium

- **Rule #:** 7
- **File:** `src/views/DashboardView.js`, `src/views/EditView.js`
- **Line(s):** `DashboardView.js:358–382`; `EditView.js:196–213`
- **Severity:** 🟡 Medium
- **Snippet:**

```js
    import('../components/ConfirmDialog.js').then(({ ConfirmDialog }) => {
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** Both views implement "confirm a delete, then offer undo," but with different import
  mechanics — `DashboardView` spreads an array of removed entries while `EditView` handles a
  single `removed` value, and neither wraps the outer `import()` in error handling at all (an
  unhandled chunk-load failure yields silence). Behaviourally equivalent today; they will drift
  the first time either needs a fix. Low urgency — flagged so it is a known divergence.

---

### Rule #5 — Hardcoded values 🟡 Medium / ⚪ Low

#### #5.1 — `var(--token, literal)` where the token does not exist 🟡 Medium

- **Rule #:** 5
- **File:** `src/views/ReportsView.js`, `src/views/financial-planning/GoalsSection.js`
- **Line(s):** `ReportsView.js:818–822`; `GoalsSection.js:317`
- **Severity:** 🟡 Medium
- **Snippet:**

#### #5.2 — Hardcoded rgba palette bypassing the token system ⚪ Low

- **Rule #:** 5
- **File:** `src/views/financial-planning/OverviewSection.js`
- **Line(s):** 419–426
- **Severity:** ⚪ Low
- **Snippet:**

```js
recommendation.style.background =
  assessment.riskLevel === 'low'
    ? 'rgba(34, 197, 94, 0.1)'
    : assessment.riskLevel === 'moderate'
      ? 'rgba(234, 179, 8, 0.1)'
      : assessment.riskLevel === 'critical'
        ? 'rgba(239, 68, 68, 0.1)'
        : 'rgba(156, 163, 175, 0.1)';
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** Immediately below, the _border_ of this same element uses `COLORS.SUCCESS`,
  `COLORS.WARNING`, `COLORS.ERROR`, `COLORS.TEXT_MUTED` (lines 428–436). So one element mixes
  hardcoded rgba fills with tokenized borders — and the rgba values are **not** the token values
  (e.g. `rgba(34,197,94,…)` vs `COLORS.SUCCESS` = `var(--color-success)`), so a theme change
  desynchronises fill from border. A 10%-alpha variant of each semantic colour would keep them
  locked together. The nested ternary also reads poorly; a lookup map would be clearer.

#### #5.3 — Hardcoded overlay colour and z-index in the password-reset modal ⚪ Low

- **Rule #:** 5
- **File:** `src/views/LoginView.js`
- **Line(s):** 23–24, 33, 37
- **Severity:** ⚪ Low
- **Snippet:**

```js
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: '1000',
    ...
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** Per rule 5b — **convert only when an existing token has the exact same value.**
  `maxWidth: '400px'` on line 33 **does** have an exact match (`--modal-max-width: 400px` at
  `tokens.css:154`) and is a true cleanup. The `zIndex: '1000'` does **not**: `--z-index-modal` is
  referenced by `AccountSection.js:55,423` but **defined in no stylesheet**, so there is no
  z-index scale to join. Per the guide, adding one is a design-system change with global stacking
  implications and is **not** a slop-pass cleanup — left as a raw literal deliberately, and flagged
  so a later pass does not "fix" it on the assumption that the token exists.

#### #5.4 — `escapeHtml` applied to a string literal ⚪ Low

- **Rule #:** 5 (dead defensive code, rule 3 family)
- **File:** `src/views/SettingsView.js`
- **Line(s):** 97–103, 308–312
- **Severity:** ⚪ Low
- **Snippet:**

````js
  // Security: Static strings, escaped for safety
  categoryManagementSection.innerHTML = `

---

### Rule #1 — Trivial / narrative comments ⚪ Low

#### #1.1 — Placeholder comments describing code that does not exist ⚪ Low

- **Rule #:** 1, 11
- **File:** `src/views/ReportsView.js`, `src/views/FinancialPlanningView.js`
- **Line(s):** `ReportsView.js:142`, `186`; `FinancialPlanningView.js:358`, `360`, `506`
- **Severity:** ⚪ Low
- **Snippet:**
```js
  // ... remaining state logic ...
  ...
  // ... (imports)
````

````js
  // createStatsCard is now imported from StatsCard.js component

#### #1.2 — Decorative section banner ⚪ Low

- **Rule #:** 1
- **File:** `src/views/ReportsView.js`
- **Line(s):** 956
- **Severity:** ⚪ Low
- **Snippet:**

```js
/******************* UI OF APP ***********************************/
````

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** ASCII-art section divider. The functions beneath it already carry JSDoc blocks that
  state what they do; the banner adds nothing a reader needs.

---

### Rule #6 — Indirection with zero added logic 🟡 Medium

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
- **Action:** **User Review Required**
- **Evidence:** The arrow function body is empty apart from a comment — the guide's **proof** of
  deadness (checklist item 2): it cannot do anything, so no device testing or `git blame` can
  overturn it. It is nonetheless registered on `resize` (line 510), called once at init (line 619),
  and removed at teardown (line 610). The `debounce` wrapper, the listener registration, the
  initial call, and the teardown line all exist to invoke an empty function on every resize.
- **Note:** Compare the sibling view — `ReportsView.js:1291` has a `updateResponsiveLayout` of the
  same name with a real 49-line body. The `FinancialPlanningView` one appears to be a stub that was
  never filled in, kept alive by a comment describing the work that was planned. **Confirm with the
  author whether responsive behaviour for this view is genuinely complete** — the empty body may
  itself be the bug, which makes this a candidate for a feature rather than a deletion.

    <div class="settings-section-header">
      <h3>${escapeHtml('🏷️ Category Management')}</h3>

````
- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** Three occurrences, all of the form `escapeHtml('<literal>')`. The input is a constant;
  escaping it is a no-op that costs a DOM parse per render and, worse, **models the wrong habit** —
  a reader scanning this file learns that `innerHTML` here requires `escapeHtml`, and may add it
  to the genuinely-dynamic neighbour (`CURRENT_VERSION`, line 325) out of caution rather than
  reasoning. That one *is* correct. Prefer `textContent` + `createElement` for the literals and
  keep `escapeHtml` where the value is actually dynamic.

```js
        fallbackWarning.style.background =
          'var(--color-warning-bg, rgba(251, 191, 36, 0.1))';
        fallbackWarning.style.border =
          '1px solid var(--color-warning-border, rgba(251, 191, 36, 0.3))';
        fallbackWarning.style.color = 'var(--color-warning-text, #92400e)';
````

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Evidence (rule 5a — grep the stylesheets before believing the site is compliant):**
  `rg -- "--color-warning-bg|--color-warning-border|--color-warning-text|--color-on-error"
src/styles` returns **exit code 1 — zero matches**. `tokens.css` defines `--color-warning`,
  `--color-warning-rgb`, `--color-warning-light`, `--color-warning-dark`, but **none** of the
  three tokens used above. The same applies to `GoalsSection.js:317`'s `var(--color-on-error, #fff)`.
  Every one of these literals is load-bearing: the fallback always wins.
- **Note:** This is the pattern the guide calls "a hardcoded value in costume" — the line looks
  tokenised and greps clean. The literals are load-bearing, so the fix is a **design decision, not
  a mechanical swap**: either add the tokens to `tokens.css` (preferred — they are genuinely
  reusable warning-surface tokens) or drop the `var()` wrapper and keep the literal honestly.
- **Interaction with #4.1:** this code is currently unreachable. Fixing #4.1 _activates_ this
  styling — so the two should be sequenced together, or the banner will render with a
  hardcoded palette that ignores the active theme.

                  });
                } else {
                  console.warn('Router.navigate not available');
                }

````
- **Verdict:** slop
- **Action:** flagged for follow-up
- **Evidence:** `Router` is a **static** import (line 16, `import { Router } from
  '../core/router.js'`), and `reports` is in the same statically-imported block of
  `src/router/routes.js` (line 15). A statically-imported binding is either present or the
  module graph failed to evaluate — in which case this line never runs. There is no runtime
  condition under which `Router` is falsy here.
- **Severity note:** ranked High not because a dead `if` is dangerous in itself, but because the
  `else` branch is the *only* thing standing between a user clicking an anomaly card and
  **silently nothing happening**. If the guard is provably dead, the fallback is provably
  unreachable, and the user-facing consequence of an unforeseen failure is silence.
- **Fix direction:** call `Router.navigate(...)` directly. Keep the safety net at the module
  boundary if it is genuinely wanted, not 20 call-sites deep.

---

### Rule #14 — File / module bloat 🟡 Medium

#### #14.1 — Eight of seventeen files exceed the 500-line convention 🟡 Medium

- **Rule #:** 14
- **File:** `src/views/` (directory-level)
- **Line(s):** n/a
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** flagged for follow-up
- **Snippet:**
```
   1592  src/views/ReportsView.js                     (3.2x the limit)
   1298  src/views/DashboardView.js                   (2.6x)
   1062  src/views/financial-planning/GoalsSection.js (2.1x)
    651  src/views/financial-planning/InvestmentsSection.js
    623  src/views/FinancialPlanningView.js
    601  src/views/LoginView.js
    590  src/views/financial-planning/ForecastsSection.js
    553  src/views/LandingView.js
    465  src/views/SettingsView.js
    457  src/views/financial-planning/OverviewSection.js
    354  src/views/financial-planning/BudgetsSection.js
    238  src/views/financial-planning/insights-movers-timeline.js
    219  src/views/EditView.js
    165  src/views/financial-planning/InsightsSection.js
    146  src/views/financial-planning/insights-recurring.js
    130  src/views/AddView.js
    108  src/views/financial-planning/insights-takeaways.js
```
- **Note:** The convention is `AGENTS.md`'s 500-line guideline. `ReportsView.js` at 1,592 lines is
  the outlier, and it is directly implicated in four of this audit's High findings (#4.1, #4.2,
  #10.1, #10.2) — a concrete illustration of the guide's claim that bloat correlates with
  accumulated dead code and complex control flow. The `financial-planning/` split already follows a
  pattern the codebase itself established: `insights-takeaways.js`, `insights-recurring.js`, and
  `insights-movers-timeline.js` are each under 240 lines and each carry a header comment
  explaining they were "extracted … to maintain file size constraints." **`GoalsSection.js` (1,062)
  and `InvestmentsSection.js` (651) sit in that same directory and were not split** — the
  extraction pattern exists one directory over and was simply not applied.
- **Per the guide:** this is called out as its **own follow-up**. Do *not* bundle a split-file
  refactor into an unrelated slop-cleanup change.

---

## Rules with no findings

Recorded so a future round knows these were checked, not skipped.

| Rule | Result |
| --- | --- |
| **#8** Side effects at module load | **Clean.** No `src/views` module touches the DOM or registers a listener at import time. `DashboardView.js`'s preload helpers (lines 36–131) and `FinancialPlanningView.js`'s cache wrappers (lines 72–82) are all function-scoped; the only module-scope state is four inert `let` flags (`DashboardView.js:30–33`). No `<style>` injection in any `const` initializer. |
| **#12** Type-safety theater | N/A — the project is plain `.js`; there is no TypeScript to audit. |
| **#13** Framework-specific slop | N/A — vanilla JS with functional components; no React hooks, keys, or `useState` anywhere in scope. |
| **#1** (partial) | Only 2 comment findings across ~9,252 lines. Most comments in this directory are genuinely informative — e.g. `DashboardView.js:461–465` (why the stale account filter is normalized), `insights-recurring.js:75–78` (why stale subscriptions are sorted last), `insights-takeaways.js:81–83` (why budget insights hide in history months). **This is not a comment-noise directory**, and a future round should not assume otherwise. |
| **#9** Duplicated logic | One candidate found and **deliberately not written up**: `createHeader()` is near-identical in `ReportsView.js:299–347`, `FinancialPlanningView.js:146–178`, and `SettingsView.js:32–82` (back button + title + `createNavigationButtons`). I am not filing it — the variants differ in which section is highlighted, `innerHTML` vs `textContent` for the arrow, and whether the time selector is nested in, and a shared helper would need parameters for all three. Filing it would be padding the report. Worth a design conversation, not a slop fix. |

  // createPlaceholder is now imported from financial-planning-helpers.js
  ...
  const updateResponsiveLayout = debounce(() => {
    // Shared title update etc
  }, TIMING.DEBOUNCE_RESIZE);
```

- **Verdict:** slop
- **Action:** flagged for follow-up
- **Note:** These are the worst of the comment findings because they are **misleading, not merely
  redundant** — they are the residue of an editing pass that moved code out and left the signposts
  behind. Two of them are actively wrong now:
  - `FinancialPlanningView.js:506`'s `// Shared title update etc` is the entire body of
    `updateResponsiveLayout`, a debounced function that **does nothing at all** — the comment
    describes an update that was never written. See #6.1.
  - Lines 358/360 claim functions "are now imported" but nothing in this file calls
    `createStatsCard` or `createPlaceholder` at all; they are notes to a reader about a refactor
    that finished long ago.

---

## Traceability

Every finding has a destination. Nothing is silently dropped.

| Finding | Severity | Destination |
| --- | --- | --- |
| #4.1 `isFallback` never set | 🔴 | **Phase 1** — highest value, real user-facing defect |
| #2.1 investment save/update swallowed | 🔴 | **Phase 1** |
| #2.2 goal save/update swallowed | 🔴 | **Phase 1** |
| #3.1 dead `Router` guard | 🔴 | **Phase 1** |
| #10.2 `throw` for a shape check | 🔴 | **Phase 1** — local to `ReportsView.js` |
| #7.1 error-handling drift | 🟡 | **Phase 1** — normalizing fixes #2.1 + #2.2 as a side effect |
| #4.2 `checkDataIntegrity` orphaned | 🔴 | **User Review Required** — orphaned-transaction detector; author decides wire-up vs delete |
| #2.5 `catch {}` in auth handler | 🔴 🔒 | **User Review Required** — 🔒 security-sensitive, never auto-remediated |
| #6.1 debounced empty function | 🟡 | **User Review Required** — may be a missing feature, not dead code |
| #10.1 validation-as-control-flow | 🔴 | **Phase 2** — depends on a `reports-utils.js` change, out of `src/views` scope |
| #10.3 rethrow drops the fallback error | 🟡 | **Phase 2** |
| #2.3 portfolio stats → misleading €0.00 | 🟡 | **Phase 2** |
| #5.1 non-existent CSS tokens | 🟡 | **Phase 2** — must be sequenced *with* #4.1 |
| #7.2 delete/undo structure divergence | 🟡 | Deferred — "currently equivalent; will drift on first fix" |
| #14.1 file bloat | 🟡 | **Own follow-up** — never bundled with cleanup |
| #2.4, #2.6, #3.2, #4.3, #5.2, #5.3, #5.4, #1.1, #1.2 | ⚪ | Cosmetic batch — low priority |

### Recommended phasing

- **Phase 1 — user-visible correctness.** #4.1, #2.1, #2.2, #3.1, #10.2, #7.1. Each has a
  concrete manual-QA action: *"force the analytics engine to throw on the Reports page and confirm
  the approximate-data warning appears"*; *"fill in an investment, force the save to fail, confirm a
  toast appears"*.
- **Phase 2 — pipeline cleanup.** #10.1, #10.3, #2.3, #5.1. **#5.1 must land with or after
  #4.1**, otherwise it styles a banner that is still unreachable.
- **User Review Required.** #2.5 (🔒), #4.2 (irreversible deletion of unreplaceable diagnostic
  logic), #6.1 (possible missing feature).
- **Own follow-up.** #14.1 file-size work.
- **Cosmetic batch.** The ⚪ findings.

### Testing notes for whoever implements this

Per the guide's testing traps:

1. **`tests/views/reports-view.test.js` has 12 file-level `vi.mock`s**, including
   `vi.mock('../../src/utils/reports-utils.js')`, which stubs `validateAnalyticsData` to
   `() => ({ isValid: true })` and `createMinimalAnalyticsData` to return
   `{ transactions: [], timePeriod: null }` (lines 108–111). **A regression test for #4.1 cannot
   live in that file as-is** — the mocks that let the suite render `ReportsView` also neuter the
   exact fallback path under test. It needs a new suite whose mocks return `isMinimal: true` from
   the real `createMinimalAnalyticsData`. This is testing trap #1 exactly: a file-scoped mock
   permanently removes the code path from that suite.
2. **Prove each regression test fails without its fix** (testing trap #2). For #4.1 the reverted
   run should fail with the `.fallback-warning` element absent — not with an unrelated assertion.
3. No test anywhere references `checkDataIntegrity`, `getCurrentData`, or `getCurrentTimePeriod`
   (verified: zero hits across `tests/`), so deleting them per #4.2 breaks no suite — but
   re-grep for newly orphaned imports afterward (rule #4, step 5). Note that `AccountService` is
   used elsewhere in `ReportsView.js` (line 1496), so that import survives.
4. Per rule 5d, no new `var(--token)` is added in JS, so
   `tests/system/design-tokens.test.js` (the production-purge guard) does not need re-running for
   #5.1 — but it *will* need to pass if the fix for #5.1 adds tokens to `tokens.css`.
5. Run lint/format/build once per phase rather than only at the end, and re-derive every line
   number above before editing — they are hints that decay the moment anything else in these files
   moves.

*End of report — 24 write-ups / 23 distinct findings across 9 rules; 2 downgraded to
intentional/left-as-is, 3 routed to User Review Required (one 🔒). No source files were modified.*
````
