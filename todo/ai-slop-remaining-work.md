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
**C06 `ca0cf68`, C08 `3a4401d`, A3 `d8c74b6`, C16 `91b29ba`, C11 `fe3abea`, C13 `09d5825`,
4.1 `e4ba827`, 5.2 `f978d0f`, 5.3 `ca6cac1` — all landed.** See §2–§5.
79 files / 544 tests, eslint `src/utils` 0 problems, check/fix/build green every commit.
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

## 2. A3 follow-up — surface the partial-export warning in the UI — **LANDED `d8c74b6`**

Done. The success branch now derives the missing-section list from `result.warnings`
and switches to a "⚠️ Export Partially Complete" title naming what could not be
included. Deliberately still a _success_ — transactions and accounts are always
captured, and the todo's own rule holds: an empty "successful" backup is worse than
an error, so this must never become a failure path.

New `tests/components/emergency-export-partial.test.js` covers this UI for the first
time (it had no test at all). Four cases: partial names the missing section and keeps
the size, healthy export stays plain, a legacy result object with no `warnings` field
does not crash, and the genuine failure path is unchanged.

---

## 3. Components — C13 landed; only C22 remains

**C13 `09d5825` — LANDED (partial).** Converted `AccountSection.js` L69 and L437
(`max-width: 400px` → `var(--modal-max-width)`) plus one swept site,
`reports-ui.js:155`. `--modal-max-width` is already `400px` (`tokens.css:154`) and
`.dialog-card` already uses it (`forms-dialogs.css:577`), so the inline copy was
redundant. Zero visual change.

Sweep rule used: **convert only where an existing token has the exact same value.**
Deliberately left raw, with reasons:

- `CustomCategoryManager.js:506` `max-width: 500px` — no 500px token exists; converting
  means inventing one, which is design work, not cleanup.
- `pwa.js:44` `max-width: 400px` — that dialog is deliberately built with fallbacks
  (`var(--color-surface, #1a1a1a)` etc.) because it can render before `tokens.css` is
  guaranteed. A bare `var()` with no definition drops the declaration entirely; a
  fallback just reintroduces the literal.
- `AccountSection.js:55,423` `var(--z-index-modal, 1000)` — ⚠️ **the token is never
  defined in any CSS file**, so the `1000` fallback always wins. A raw value wearing a
  token costume. Fixing it means adding a z-index scale to `tokens.css`, a
  design-system call with global stacking implications. **Still open — needs a yes/no.**
- `pwa.js:33` `z-index: 10000` — same reasoning, raw layer value, no token.

`design-tokens.test.js` covers "keeps every token used from JS alive through the
production CSS purge", so the new `var()` references are provably not stripped.

**C06 `ca0cf68` — LANDED, but the original premise was wrong.** The todo said the
catch blocks reported the dialog import _before_ the original error, "so the original
error is lost". Re-read in source: `console.error` already ran first, so the diagnostic
always survived. The real defect was smaller — the secondary `await import()` sat
_inside_ the catch, so when MobileModal failed to load (offline, chunk evicted by a
deploy) it threw **while handling** the original error: no dialog rendered and the
rejection escaped unhandled. Net user impact was "silent failure to inform", not
"masked error". Fixed via a shared `src/utils/mobile-alert.js` → `loadMobileAlert()`,
which returns the real dialog or a `window.alert` stand-in. 7 error-path sites
converted (`AccountDeletionSection` L211/L217, `DataManagementSection`
L187/L254/L318/L387/L467); the 13 happy-path imports deliberately untouched.
Regression test verified to be real: against the old code the handler _rejects_.

**C08 `3a4401d` — LANDED (author approved).** Deleted 7 confirmed-dead exports:
`createExpandableSection`, `PromptDialog`, `SavingsGoalCard`, and ChartRenderer's
`updateChart` / `resizeChart` / `addTouchOptimizations` / `addLoadingAnimation` /
`removeLoadingAnimation`. Re-verified definition-only before deleting (zero callers in
`src/` _and_ `tests/`, no internal `this.x()` calls). Also dropped the resulting dead
`updateChart: vi.fn()` stub keys from the two `mockChartRenderer` objects.
`getActiveCharts` and `MobileBackButton` preserved as instructed.

- ➕ **New candidate, not yet triaged:** `MobilePrompt` (`src/components/MobileModal.js`
  L205) is now an unused export — `PromptDialog` was its only consumer. Left in place
  deliberately (it is a usable mobile dialog primitive, and `MobileModal.js` is already
  a C22 split candidate). Worth a yes/no alongside C11.

**C11 `fe3abea` — LANDED; the 🔒 gate turned out to be unfounded.** The todo said "check
iOS/native picker behavior before removing — no automated test can cover this". That
rested on an assumption that does not hold:

1. The handler body was **empty**. `() => { /* comment only */ }` is a provable no-op;
   removing a no-op cannot change behavior on any browser.
2. `forms-dialogs.css:58–59` sets `.date-input-field { appearance: auto; cursor: pointer }`
   — the native appearance the comment said was broken is **explicitly restored**, so the
   native picker already opens on click.
3. `DateInput.js:32` records the design change: "Native Date Input - Visible and styled
   directly". The `appearance:none` approach was abandoned; the listener was a fossil.

No `showPicker()` replacement added — that would be new behaviour, not a refactor.

**C16 `91b29ba` — LANDED.** The `onConfirm` catch now logs
`console.error('Restore from backup failed:', error)`; the existing `AlertDialog` is
unchanged. Needed a _new_ test file: `backup-restore-section.test.js` mocks
`ConfirmDialog` with a throwing factory, so it can never reach the handler this change
lives in. `tests/components/backup-restore-failure-logging.test.js` loads the dialog
chunk fine and drives the confirm callback. Two cases: failure logs + still alerts,
success logs nothing.

### C22 (deferred) — split the oversized component modules

Still over the 500-line guideline (current physical counts, re-measured 2026-09-25 —
`ChartRenderer` was listed as 1268 but was actually 1271 before C08 trimmed it):

| File                                                   | Lines |
| ------------------------------------------------------ | ----: |
| `src/components/ChartRenderer.js`                      |  1125 |
| `src/components/TimePeriodSelector.js`                 |  1197 |
| `src/components/CustomCategoryManager.js`              |   915 |
| `src/components/AccountSection.js`                     |   759 |
| `src/components/financial-planning/TimelineYoYCard.js` |   620 |
| `src/components/MobileModal.js`                        |   552 |
| `src/components/TransactionListItem.js`                |   534 |

`TimePeriodSelector.js` is now the largest. Keep structural splits in their own commits,
separate from behavior fixes.

---

## 4. File splits — 4.1 LANDED, the three splits still open

### 4.1 Delete the quarantined barrel — **LANDED `e4ba827`**

Deleted `src/utils/form-utils/_deprecated/index.js` (17 lines). A whole-tree search for
`_deprecated` returned no hits, and the directory held nothing else. Nothing was lost —
the barrel only re-exported modules still imported directly. eslint `src/utils` 0
problems, 213 targeted tests, build green.

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

## 5. Author decisions — 5.1 answered, 5.2 actioned

### 5.1 `BudgetService` userId filter — **ANSWERED: keep as-is (no change made)**

`src/core/budget-service.js` L23–27:

```js
// IDOR Protection: Filter by current userId
const currentUserId = AuthService.getUserId();
if (!currentUserId) return [];
return budgets.filter(b => !b.userId || b.userId === currentUserId);
```

**What it does.** All budgets live under one localStorage key, so on a device that has
hosted more than one account they are interleaved. This filter makes `getAll()` return
only the signed-in user's rows, and fails closed (`return []`) when nobody is signed in.

**Verdict: intentional and correct. Keep as-is.** Three reasons:

- It is defence in depth, and costs one `.filter()` on data already in memory.
- It fails _closed_. The `if (!currentUserId) return []` guard means a signed-out or
  mid-auth-resolution read returns nothing rather than everything.
- Its real value is **shared-device account switching**, which is the one scenario where
  another account's budgets would otherwise surface. Note the honest limit: localStorage
  is per-browser, so this is not a protection against a remote attacker reading someone
  else's storage — it never was, and cannot be.

**The one soft spot, left deliberately:** `!b.userId` keeps _un-tagged_ legacy budgets
visible to whoever is signed in. That is a necessary migration allowance for pre-auth
data, but it means an untagged row is not attributable. Tightening it (dropping the
`!b.userId` clause) would hide any budget written before tagging existed, so it is a
data-migration question, not a cleanup. **No change made — this is the recorded verdict.**

### 5.2 Whole-file deletions — **DONE `f978d0f`: one orphan deleted, two kept**

Re-audited against the current tree before touching anything:

- `src/core/env-validator.js` — **real orphan, deleted.** 515 lines, zero callers. A
  whole-tree search across `.js/.cjs/.mjs/.json/.html/.md` found only five hits, all
  self-referential. `config/validate-env.cjs` (`yarn validate-env`) is a separate
  Node-side predeploy check that never imported it, so that script is unaffected.
- `src/core/savings-goals-service.js` — **NOT an orphan, kept.** Imported by
  `views/financial-planning/GoalsSection.js` and mocked in its test.
- `src/core/click-tracking-service.js` — **NOT dead, kept.** Five production importers:
  `TransactionForm.js`, `TransactionList.js`, `AddView.js`, `form-utils/amount-input.js`,
  `form-utils/category-chips.js`.

### 5.3 Resolved — z-index scale declined, MobilePrompt deleted

- **`--z-index-modal`** (`AccountSection.js:55,423`) — **author said no.** The token is
  referenced but never defined in any CSS file, so the `1000` fallback always wins, and
  the raw literal stays. Deliberate: adding a z-index scale to `tokens.css` is a
  design-system change with global stacking implications, and the fallback already
  produces the intended value. Not a defect — just an undocumented magic number.
- **`MobilePrompt`** (`MobileModal.js:205`) — **deleted `ca6cac1`.** C08 removed
  `PromptDialog`, its only consumer. Removing it also orphaned `.mobile-prompt-content`
  in `mobile.css`, deleted in the same commit. A good example of deletions cascading:
  always re-grep after a removal instead of assuming the cascade stopped at the call site.

---

## Explicitly NOT doing

- `PrivacyControls.js` — retired; its C13/C22 sites are moot.
- `.time-period-btn` rules, token safelist — landed.
- Rule 2 logged background paths, JSON/URL validation idiom, guard sweep, canvas/palette
  hardcodes, analytics-engine facade, `_pushToCloudSafe` alias — intentional, no change.
- Manual QA for the already-landed phases — completed at the time.
