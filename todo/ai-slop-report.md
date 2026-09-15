# AI Slop Report — `src/utils`

**Audit round:** initial (round 1)
**Scope:** `src/utils/**` — 30 files, ~7,010 lines (includes `form-utils/`, which the task's file listing omitted)
**Method:** rule-by-rule sweep per `todo/ai-slop-inspection-guide.md` runbook (steps 1–5), verified against the filesystem with `ripgrep`, a multi-line-aware import-graph script, ESLint, Prettier, Vitest, and a jsdom reproduction for the runtime bug.
**Baseline commit:** `e867352` (`minor fixes`); working tree had only the guide modified.

## Verdict

**Slop IS present under `src/utils`.** This is not a clean sweep: 47 findings across 12 of the 14 rules, including

- **1 🔴 High true defect that is invisible to `yarn run check` and to the test suite** — a botched edit in `chart-utils.js` that silently deleted a function from the module's public API (Rule 4/11).
- **1 🔴 High production bug** — `TIMING.NOTIFICATION_*` tokens do not exist, so _every_ toast auto-dismisses in ~230 ms instead of 3 s (Rule 5, reproduced below).
- **1 🔴 High design-token bug** — `SPACING.XXXL`, `FONT_SIZES.MD`, `COLORS.PRIMARY_DARK` and the CSS variables `--color-text` / `--font-size-md` are referenced but undefined.

**9 findings were downgraded to false positive / intentional** by the false-positive checklist and are documented in §"False positives" — a 100 % hit rate would itself have signalled pattern-matching.

> **Phase 1 status:** landed — see §"Phase 1 remediation" at the end of this document, which also adds a **Round-1 addendum** of new findings the Phase 1 verification sweep uncovered. The `chart-utils.js` corruption (Rule 4/11) is still **User Review Required** and was deliberately left untouched.
>
> **Phase 2 status:** landed as `a9fea22` ("phase 2", on top of `7439757`) — see §"Phase 2 remediation" appended below. The corruption decision was taken in-session (**delete**) and executed; every Phase 2 traceability row is closed except the two explicitly deferred structural items (Rule 14 splits, barrel quarantine). One 19-line follow-up (`type-toggle.js` `updateButtonState` removal) and this report update itself are uncommitted working-tree changes.

### Counts by rule

| Rule                                       | Findings                                   | Highest severity     |
| ------------------------------------------ | ------------------------------------------ | -------------------- |
| 1 Trivial comments                         | 1 (grouped, 30+ sites)                     | ⚪                   |
| 2 Swallowed errors                         | 3                                          | 🟡                   |
| 3 Dead / over-defensive guards             | 5                                          | 🟡                   |
| 4 Dead / unreachable code                  | 7 (grouped: ~30 symbols + 1 dead file)     | 🔴                   |
| 5 Hardcoded values bypassing design system | 6                                          | 🔴                   |
| 6 Indirection with zero added logic        | 3                                          | 🟡                   |
| 7 Inconsistent error handling              | 3                                          | 🟡                   |
| 8 Side effects at module load              | 2                                          | 🟡                   |
| 9 Duplicated logic                         | 8                                          | 🟡                   |
| 10 try/catch as control flow               | 2                                          | 🟡 (both downgraded) |
| 11 Stale / misleading comments             | 4                                          | 🔴                   |
| 14 File / module bloat                     | 3                                          | 🟡                   |
| 12 / 13 (TS / React)                       | 0 — not applicable (plain `.js`, no React) | —                    |

### Reproduction of the headline runtime bug (Rule 5)

```
$ node bb-toast-check.mjs          # jsdom harness in %TEMP%, repo untouched
TIMING keys: DEBOUNCE_RESIZE, DEBOUNCE_ORIENTATION, ANIMATION_FAST, ANIMATION_NORMAL,
             KEYBOARD_DELAY, FOCUS_DELAY, INITIAL_LOAD_DELAY, UNDO_TOAST, RECENT_TRANSACTION_LIMIT
TIMING.NOTIFICATION_SUCCESS = undefined
toasts right after show()  : 1
toasts after 30ms          : 1 | class: toast toast-success
toasts after ~430ms        : 0   (expected 1 for a ~3000ms toast)
```

_Lint has a rule for Rule 5 (`local/no-raw-style-values`) and it produced 0 errors / 35 warnings — but nothing in the toolchain catches the two undefined-token bugs above._

---

## Rule 1 — Trivial / narrative comments ⚪ Low

### [Rule 1] — Comments that restate the adjacent code

- **File:** `src/utils/reports-charts.js`, `financial-planning-charts.js`, `toast-notifications.js`, `progress-indicators.js`, `enhanced-empty-states.js`, `form-utils/category-chips.js`
- **Line(s):** `reports-charts.js:138,159,211,264,369,522,577,630` · `financial-planning-charts.js:34,51,64,200,217,351,368,381` · `toast-notifications.js:135,140,146,170` · `progress-indicators.js:50,65,100` · `enhanced-empty-states.js` (`// Container styles`, `// Icon container`, `// Title`, `// Primary action button`, `// Animate in …`) · `category-chips.js:274` **and** `:399` (identical `// Validate amount` twice)
- **Snippet:**
  ```js
  // Section header        <- above the header div
  // Chart container       <- above the chartDiv
  // Add hover effect      <- above addEventListener('mouseenter')
  // Create spinner        <- above createElement('div', spinner)
  ```
- **Severity:** ⚪ Low
- **Verdict:** slop
- **Action:** flagged for follow-up (cosmetic; delete the ~30 comments that lose zero information). The `category-chips.js:274`/`:399` pair disappears with the Rule 9 dedupe.

## Rule 2 — Swallowed errors 🟡 Medium

### [Rule 2] — Bare `catch { return null }` in the chart colour resolver

- **File:** `src/utils/reports-charts.js`
- **Line(s):** 39–55 (catch at 41)
- **Snippet:** `} catch { return null; }`
- **Severity:** 🟡 Medium
- **Verdict:** **false positive on "silent failure"** — every call site falls back (`resolveCssVarColor('--color-success-rgb', 0.8) || 'rgba(0,179,89,0.8)'`), so the user-visible path is safe. Kept in the report only because a bare catch also hides typos (a misspelled token resolves to `null` and silently uses the fallback colour forever).
- **Action:** left as-is (reason: real fallback exists and the chart still renders). Optional: `console.warn` the unresolvable token name.

### [Rule 2, 7] — Dynamic toast import failure leaves the user with no feedback

- **File:** `src/utils/form-utils/category-chips.js` 458–463; `src/utils/form-utils/submission.js` 148–151
- **Snippet:**
  ```js
  .catch(importErr => {
    console.error('Failed to load toast notifications:', importErr);
  });
  ```
- **Severity:** 🟡 Medium
- **Verdict:** slop — the submit failure is console-only, and if the toast chunk itself fails to load the user gets nothing at all.
- **Action:** flagged for follow-up (inline error node / `alert` fallback when the toast module cannot load).

### [Rule 2, 4] — Error capture inside dead code

- **File:** `src/utils/reports-utils.js`
- **Line(s):** 363–420 (`catch (error)` at 405)
- **Snippet:** `} catch (error) { errors.push(\`Transaction ${index}: ${error.message}\`); }`
- **Severity:** ⚪ Low
- **Verdict:** slop — unreachable for every validation failure in the same block (they all `return` early), i.e. control-flow decoration inside a function with zero callers.
- **Action:** flagged for follow-up (removed together with the Rule 4 dead function).

## Rule 3 — Overly defensive / dead guards 🟡 Medium

### [Rule 3, 8] — `typeof document !== 'undefined'` guard is dead

- **File:** `src/utils/enhanced-empty-states.js:463-466`, `src/utils/progress-indicators.js:174-177`
- **Snippet:**
  ```js
  // Initialize styles when module is imported (browser only)
  if (typeof document !== 'undefined') {
    addEmptyStateStyles();
  }
  ```
- **Severity:** 🟡 Medium
- **Verdict:** slop — BlinkBudget is a browser-only Vite app and `vite.config.js:244` sets `test.environment: 'jsdom'` for the whole suite, so `document` always exists; the guard can never be false.
- **Action:** flagged for follow-up (replace with a plain call; the real problem is the Rule 8 load-time side effect).

### [Rule 3] — Triple guard around `window`

- **File:** `src/utils/form-utils/category-chips.js`
- **Line(s):** 529–534 (and the mirror at 552–559)
- **Snippet:**
  ```js
  if (
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function'
  ) {
    window.addEventListener('categories-updated', _onCategoriesUpdated);
  }
  ```
- **Severity:** 🟡 Medium
- **Verdict:** slop — two of the three conditions are dead in every environment the app runs in.
- **Action:** flagged for follow-up.

### [Rule 3] — Unreachable re-check of `options`

- **File:** `src/utils/progress-indicators.js`
- **Line(s):** 72 and 82 (options defaults to `{}` at line 62)
- **Snippet:** `if (options && options.onCancel !== undefined) { … }` then inside the handler `if (options && options.onCancel) { … }`
- **Severity:** ⚪ Low
- **Verdict:** slop — `options &&` is dead, and the inner check can never be false because the button only exists when `onCancel` was supplied.
- **Action:** flagged for follow-up.

### [Rule 3] — Defaulted-then-rechecked values

- **File:** `src/utils/dom-factory.js:84`, `src/utils/form-utils/amount-input.js:27,199`
- **Snippet:** `value: value || ''` (parameter default is already `''`) · `input.value = initialValue || ''` · `input.value = value || ''`
- **Severity:** ⚪ Low
- **Verdict:** slop (harmless)
- **Action:** flagged for follow-up.

### [Rule 3] — Duck-typing on chips the same file just created

- **File:** `src/utils/form-utils/category-chips.js`
- **Line(s):** 410–413
- **Snippet:** `if (c.updateState) c.updateState(false);`
- **Severity:** ⚪ Low
- **Verdict:** slop — `createCategoryChip` (line 135) always assigns `updateState`; the guard only exists to skip transfer-account chips. Cheaper to check the class explicitly.
- **Action:** flagged for follow-up.

## Rule 4 — Dead / unreachable code 🔴 High

### [Rule 4, 11] — 🔴 Botched edit removed `groupSmallCategories` from the module API

- **File:** `src/utils/chart-utils.js`
- **Line(s):** 199–256 (JSDoc opened at 199 and never closed before code; stray duplicate `return topCategories; }` at 249)
- **Snippet:**
  ```js
   * @param {number} maxCategories - Maximum number of categories to show (default: 8)
  export function groupSmallCategories(categoryData, threshold = 0.05, maxCategories = 8) {
    …
    return topCategories;
  }  return topCategories;      // <- line 249, leftover from a bad merge/edit
  }                            // <- line 250
  ```
- **Evidence:** the unterminated `/**` on line 199 swallows lines 204–255, and is only "closed" by the `*/` on line 256 that belongs to the _next_ function. Proof:
  ```
  $ node --input-type=module -e "import('./src/utils/chart-utils.js').then(m => console.log(Object.keys(m)))"
  PARSED OK: [ 'calculatePercentages', 'createEmptyStateData', 'formatCurrency', 'formatPercentage',
               'prepareBarChartData', 'prepareLineChartData', 'preparePieChartData', 'sortByAmount',
               'validateChartData' ]                    # <-- groupSmallCategories is missing
  ```
  `git blame -L 199,206` → introduced in `ef36ae51 (2025-12-28)`, untouched by the later `2ed7938 "Fixed all ESLint errors and warnings"`. Toolchain blind spots, all verified this session: `prettier --check "src/utils/**/*.js"` → _"All matched files use Prettier code style!"_; `eslint src/utils` → 0 errors; `vitest run tests/integration/chart-integration.test.js` → 12/12 passed.
- **Severity:** 🔴 High
- **Verdict:** slop (a swallowed function plus a duplicated `return` is an unambiguous artefact, not a style choice)
- **Action:** flagged for follow-up — **User Review Required**. Either restore the body (dedupe to a single `return topCategories;`) or delete it deliberately; the `*/` and the stray line have to go either way. Code was _not_ modified in this audit round.

### [Rule 4] — `chart-utils.js` is a test-only module with 5 of 9 exports unused even there

- **File:** `src/utils/chart-utils.js` (293 lines)
- **Line(s):** `prepareLineChartData:119`, `calculatePercentages:161`, `sortByAmount:189`, `groupSmallCategories:204`, `createEmptyStateData:257`
- **Evidence:** import-graph sweep — the only importer of the file is `tests/integration/chart-integration.test.js:9-15`, which imports just `formatCurrency, formatPercentage, preparePieChartData, prepareBarChartData, validateChartData`. No production module imports it (the `formatCurrency` / `validateChartData` used across `src/` come from `financial-planning-helpers.js` and `inflation-chart-utils.js`). The five names above have **zero references anywhere** in `src/`, `tests/`, `index.html`.
- **Severity:** 🔴 High
- **Verdict:** slop
- **Action:** flagged for follow-up — do not delete the file outright (a test still exercises it): remove the 5 orphans first, then decide whether the remaining 4 functions earn a 293-line module or fold into `inflation-chart-utils.js`.

### [Rule 4] — Dead exported helpers with zero callers

- **Files / lines:** `chart-refresh-helper.js:55` `refreshCharts` · `touch-utils.js:30` `throttle` · `dom-factory.js:133` `createFlexContainer` · `enhanced-empty-states.js:413` `updateEmptyState` · `copy-strings.js:77` `getCopySection` · `toast-notifications.js:338` `getActiveToastCount` · `reports-ui.js:115` `updateLoadingProgress` · `reports-utils.js:13,61,113` `getCurrentWeekPeriod` / `getLastMonthPeriod` / `getCurrentYearPeriod` · `financial-planning-helpers.js:115,132,162,188` `calculateCurrentBalance` / `calculateMonthlyExpenses` / `calculateSavingsRate` / `formatDate` · `inflation-chart-utils.js:111,152,176` `calculateMonthlySpending` / `createTrendIndicator` / `formatChartLabels` · `constants.js:191,237` `Z_INDEX` / `ACCOUNT_TYPES` (no external caller)
- **Evidence:** every name greps to 0 references outside its own file (multi-line-aware import graph + `rg` across `src/`, `tests/`, `index.html`). Names that merely _look_ dead (`showToast`, `removeToastById`, `createElement`, `COPY_STRINGS`, `addProgressStyles`) are used **inside** their own module and were excluded from this list.
- **Severity:** 🔴 High
- **Verdict:** slop
- **Action:** flagged for follow-up. Two are paired with other rules: `Z_INDEX` is dead while `progress-indicators.js:42` hardcodes `z-index: 9999` (Rule 5), and `financial-planning-helpers.formatDate:188` duplicates the live `date-utils.js formatDate` (Rule 9).

### [Rule 4] — ~200 lines of unreachable chart code

- **File:** `src/utils/reports-charts.js`
- **Line(s):** 716–855 `createCategoryTrendsChart` (0 callers), commented-out `createToggleButton` at 858–875, orphan note `// Migrated import to top` at 877
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** flagged for follow-up (it carries the only `TransactionService` / `generateMonthlyTrendData` import chain in this file — after deletion, re-check `reports-utils.generateMonthlyTrendData`).

### [Rule 4, 9] — `type-toggle.js`: duplicated state logic, one copy dead

- **File:** `src/utils/form-utils/type-toggle.js`
- **Line(s):** `updateButtonState` 45–56, assigned to `btn.updateState` at 112; the live implementation is `updateAllButtons` 163–174
- **Evidence:** `rg "updateState" src tests` → the only calls are on _category chips_ (`category-chips.js:412,419`); nothing calls `updateState` on a type-toggle button.
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** flagged for follow-up (delete `updateButtonState` + the `btn.updateState` assignment, keep `updateAllButtons`).

### [Rule 4] — Dead barrel file

- **File:** `src/utils/form-utils/index.js` (17 lines)
- **Evidence:** "MODULES WITH NO IMPORTER AT ALL" in the import-graph sweep; every consumer imports the deep path. It is also an _incomplete_ barrel — its doc claims "exports for all form-related utilities" but it never re-exports `transaction-tags.js`.
- **Severity:** ⚪ Low
- **Verdict:** slop
- **Action:** flagged for follow-up. Whole-file deletion is the bigger claim — quarantine to `_deprecated/`, run the suite + build, then delete in a follow-up commit.

### [Rule 4, 9, 11] — Smaller dead-code artefacts

- **File / line:** `form-utils/amount-input.js:29` commented-out `input.step = '0.01'` · `form-utils/category-chips.js:56` duplicate `chip.style.overflow = 'hidden';` (line 55 repeats it) · `chart-utils.js:249` duplicated `return topCategories;`
- **Severity:** ⚪ Low
- **Verdict:** slop
- **Action:** flagged for follow-up.

## Rule 5 — Hardcoded values that bypass the design system 🔴 High

### [Rule 5] — 🔴 `TIMING.NOTIFICATION_*` do not exist → every toast auto-dismisses in ~230 ms

- **File:** `src/utils/toast-notifications.js`
- **Line(s):** 79, 84, 89, 94, 100 (`duration: TIMING.NOTIFICATION_SUCCESS` etc.), resolver at 225–231
- **Snippet:**
  ```js
  [TOAST_TYPES.SUCCESS]: { background: COLORS.SUCCESS, icon: '✅', duration: TIMING.NOTIFICATION_SUCCESS },
  …
  const finalDuration = duration !== undefined ? duration : config.duration;
  ```
- **Evidence:** `constants.js` `TIMING` has no `NOTIFICATION_*` key (the only 5 references in the whole repo are these 5 lines), so `config.duration` is `undefined`, `setTimeout(fn, undefined)` fires immediately, and the toast is gone after `TIMING.ANIMATION_FAST` (200 ms). Reproduced in jsdom: present at 30 ms, **gone at 430 ms** although a 3000 ms toast was intended. Affects `showSuccessToast` / `showErrorToast` / `showWarningToast` / `showInfoToast` across 9 modules.
- **Severity:** 🔴 High
- **Verdict:** slop (the guide's exact anti-pattern — a value that should resolve from constants only)
- **Action:** flagged for follow-up — add `NOTIFICATION_*: 3000` entries to `TIMING`; a single-source fix with no call-site edits.
- **Same-class companions:** `transaction-undo.js:17` `TIMING.UNDO_TOAST || 5000` (the guide's `|| N` fallback literal) and the hardcoded `{ duration: 5000, persistent: false }` in `submission.js:146` + `category-chips.js:453`.

### [Rule 5] — Undefined design tokens (`SPACING.XXXL`, `FONT_SIZES.MD`, `COLORS.PRIMARY_DARK`)

- **File:** `src/utils/enhanced-empty-states.js`
- **Line(s):** 185, 221, 310, 323
- **Snippet:**
  ```js
  padding: compact ? SPACING.XL : SPACING.XXXL,        // 185 -> padding: undefined
  fontSize: FONT_SIZES.MD,                             // 221, 310 -> fontSize: undefined
  button.style.backgroundColor = COLORS.PRIMARY_DARK;  // 323 -> hover bg: undefined
  ```
- **Evidence:** `constants.js` defines only `SPACING.{XS,SM,MD,LG,XL}` and `FONT_SIZES.{PREVENT_ZOOM,AMOUNT_INPUT,STAT_*,TITLE_*,BASE,SM,LG,XL,BUTTON_LARGE}`; runtime check printed `undefined` for all three names.
- **Severity:** 🔴 High (empty-state container loses its padding; the primary CTA loses its hover state)
- **Verdict:** slop
- **Action:** flagged for follow-up. `FONT_SIZES.MD` is also referenced from **10+ files outside this directory** (`SettingsView.js:69,414`, `DataManagementSection.js:156`, `BudgetSummaryCard.js:125`, `BudgetForm.js:42,74`, `BudgetSuggestion.js:46,141`, `GeneralSection.js:41,86,124`, …) — cross-cutting, schedule it as its own step, not as part of a `src/utils`-only cleanup.

### [Rule 5] — CSS variables referenced from `src/utils` that no stylesheet defines

- **File:** `src/utils/progress-indicators.js:70,83,84` · `src/utils/reports-ui.js:206,222`
- **Snippet:** `color: var(--color-text);` · `retryButton.style.fontSize = 'var(--font-size-md)';`
- **Evidence:** every `var(--…)` used under `src/utils` was enumerated and checked against `src/styles`: `--color-text` and `--font-size-md` are **never defined** anywhere (also used from `reports.css:100,404,424`, `BackupRestoreSection.js:54`, `FeedbackLink.js:79`). The other 30 tokens all resolve.
- **Severity:** 🟡 Medium (silent fallback to inherited colour / font size)
- **Verdict:** slop
- **Action:** flagged for follow-up (alias to `--color-text-main` / `--font-size-base`, or define the tokens).

### [Rule 5] — `progress-indicators.js` hardcodes what `Z_INDEX` / `SPACING` already own

- **File:** `src/utils/progress-indicators.js`
- **Line(s):** 42 `z-index: 9999`, 44 `border-radius: 8px`, 46 `min-width: 300px`, 57 `box-shadow: 0 4px 12px rgba(0,0,0,0.15)`
- **Severity:** 🟡 Medium
- **Verdict:** slop — `constants.Z_INDEX` exists and is unused (Rule 4).
- **Action:** flagged for follow-up.

### [Rule 5, 9] — All four spinner borders share one colour → the spinner cannot visibly rotate

- **File:** `src/utils/progress-indicators.js`
- **Line(s):** 51–58 (indicator) and 157–163 (`addProgressStyles()` — same CSS twice)
- **Snippet:**
  ```js
  border: 3px solid var(--color-primary);
  border-top-color: var(--color-primary);
  border-right-color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  animation: spin 1s linear infinite;
  ```
- **Severity:** 🟡 Medium — a _loading_ indicator that reads as a static circle. Compare `reports-ui.js:78-96`, which colours only `borderTop`.
- **Verdict:** slop (three of the four declarations are no-ops)
- **Action:** flagged for follow-up — `border: 3px solid var(--color-border); border-top-color: var(--color-primary);`, declared once.

### [Rule 5] — 35 raw style values already flagged by the project's own lint rule

- **File:** `financial-planning-charts.js` (7) · `reports-charts.js` (12) · `form-utils/category-chips.js` (6) · `form-utils/type-toggle.js` (4) · `financial-planning-helpers.js` (2) · `form-utils/validation.js` (2) · `reports-ui.js` (1) · `transaction-selection.js` (1)
- **Evidence:** `npx eslint src/utils` → `✖ 35 problems (0 errors, 35 warnings)`, all `local/no-raw-style-values`.
- **Severity:** 🟡 Medium
- **Verdict:** slop (the repo already agrees — pre-existing lint debt, not a new opinion)
- **Action:** flagged for follow-up. Values the lint rule misses: `transaction-selection.js:15` `rgba(59, 130, 246, 0.12)` (→ `color-mix(in srgb, var(--color-primary) 12%, transparent)`), `reports-charts.js` `rgba(255, 255, 255, 0.05)` / `padding: '6px 14px'` / `fontSize: '0.8125rem'`, `chart-utils.js` hex palette `#e0e0e0`, `#ffffff`, `#f0f0f0`, `#d0d0d0`.

## Rule 6 — Indirection with zero added logic 🟡 Medium

### [Rule 6, 4] — `refreshCharts` only loops over `refreshChart`, and nothing calls it

- **File:** `src/utils/chart-refresh-helper.js`
- **Line(s):** 55–59
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** flagged for follow-up (delete; also in the Rule 4 list — listed once per the guide's "one write-up per issue", cross-referenced here because the shape is indirection).

### [Rule 6, 9] — Two implementations of "remove this indicator" in one file

- **File:** `src/utils/progress-indicators.js`
- **Line(s):** private `hideIndicator` closure 128–134 vs exported `hideProgressIndicator` 146–155 — byte-identical removal logic
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** flagged for follow-up (keep one; `showProgressIndicator` should hand back the shared `hide`).

### [Rule 6, 4] — One-expression wrapper with zero callers

- **File:** `src/utils/copy-strings.js:77-84` (`getCopySection`)
- **Severity:** ⚪ Low
- **Verdict:** slop — the sibling `getCopyString` adds real lookup + `{placeholder}` interpolation and is used by 3 components; this one adds nothing.
- **Action:** flagged for follow-up.

## Rule 7 — Inconsistent error-handling patterns 🟡 Medium

### [Rule 7] — Same file, same problem, two strategies

- **File:** `src/utils/security-utils.js`
- **Line(s):** `catch {` at 26 (silent, no log) vs `catch (error)` at 97 (`console.error('[Security] Failed to parse JSON:', error)`)
- **Severity:** 🟡 Medium
- **Verdict:** slop (the silent one is the _untrusted-input sanitizer_ — the one place you'd most want a breadcrumb)
- **Action:** flagged for follow-up (log the fallback path or explain the silence in a comment).

### [Rule 7, 9] — `submission.js` vs `category-chips.js`: the same submit/error path written twice

- **File:** `src/utils/form-utils/submission.js:134-154` vs `src/utils/form-utils/category-chips.js:422-464`
- **Severity:** 🟡 Medium
- **Verdict:** slop — `try { onSubmit() } catch { console.error; dynamic-import toast; .catch(log) }` twice; `submission.js` additionally logs `'Original error:'` in the import-failure branch, `category-chips.js` does not. Two adjacent files, one directory, same job, two behaviours.
- **Action:** flagged for follow-up (one shared `handleFormSubmit`, and reuse the already-imported toast helpers instead of a second dynamic import).

### [Rule 7] — Mixed strategy for loading the toast module

- **File:** dynamic imports of `toast-notifications.js` across the app: `main.js:78`, `EditView.js:190`, `AddView.js:89`, `TransactionListItem.js:107,119,158,170`, `submission.js:144`, `category-chips.js:448`
- **Severity:** 🟡 Medium
- **Verdict:** slop — 5 call sites do bare `.then()`, 2 do `.then().catch()`, and `main.js` does something else again (`rg "import\\('.*toast-notifications"`).
- **Action:** flagged for follow-up (normalize on imported-at-top or a single `notify()` facade). Scope note: 7 of the 9 call sites are outside `src/utils` — this is the cross-file half of the Rule 7 check, flagged rather than fixed here.

## Rule 8 — Side effects at module load time 🟡 Medium

### [Rule 8] — `<style>` injected into `document.head` on import

- **File:** `src/utils/enhanced-empty-states.js:463-466`, `src/utils/progress-indicators.js:174-177`
- **Snippet:**
  ```js
  // Initialize styles when module is imported (browser only)
  if (typeof document !== 'undefined') {
    addEmptyStateStyles();
  }
  ```
- **Severity:** 🟡 Medium
- **Verdict:** slop — the guide names this exact pattern; nothing in `src/utils` should touch the DOM at import time (only `main.js` or a deliberate plugin may).
- **Action:** flagged for follow-up (move both blocks into `src/styles/` — see the Rule 9 duplicate-`@keyframes` finding).

### [Rule 8] — A third `@keyframes spin` injected at call time

- **File:** `src/utils/reports-ui.js:97-112` (inside `createLoadingState()`)
- **Severity:** 🟡 Medium
- **Verdict:** slop (call-time rather than import-time, so less severe, but it is a style-system bypass that re-declares a global keyframe name).
- **Action:** flagged for follow-up (see Rule 9).

## Rule 9 — Duplicated logic instead of reuse 🟡 Medium

### [Rule 9] — Four near-identical "clickable stat card" blocks (~200 lines)

- **File:** `src/utils/reports-charts.js`
- **Line(s):** Total Income 162–215 · Total Spent 217–270 · Income 470–530 · Expenses 532–590 (same `role="button"`, `tabindex`, `aria-label`, `mouseenter/mouseleave` opacity, `keydown` Enter/Space → `.click()`, `click` → `NavigationState.saveDashboard*` + `Router.navigate('dashboard')`, plus a fresh `Intl.NumberFormat`)
- **Snippet:**
  ```js
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  el.addEventListener('mouseenter', () => { el.style.opacity = '0.7'; });
  el.addEventListener('mouseleave', () => { el.style.opacity = '1'; });
  el.addEventListener('click', () => { NavigationState.saveDashboardTypeFilter('income'); … Router.navigate('dashboard'); });
  ```
  (the same five-line block appears at 185, 273, 531, 586)
- **Severity:** 🟡 Medium — this single duplication is the main reason the file is 923 lines (Rule 14) and why the `// Add hover effect` comments (Rule 1) exist four times.
- **Verdict:** slop
- **Action:** flagged for follow-up → `createClickableStat({ label, value, color, onClick, ariaLabel })`.

### [Rule 9] — Five different currency formatters for the same job in one directory

- **File:** `src/utils/chart-utils.js:15` (`formatCurrency`, USD, en-US) · `financial-planning-helpers.js:203` (`formatCurrency`, EUR, `en-EU`) · `inflation-chart-utils.js` + `financial-planning-charts.js` + `reports-charts.js` (18 inline `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' })` constructions — `reports-charts.js:82,110,200,253,481`, `financial-planning-charts.js` ×11)
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** flagged for follow-up (one shared formatter, locale derived from settings).

### [Rule 9] — Chart-section scaffold copy-pasted three times

- **File:** `src/utils/financial-planning-charts.js`
- **Line(s):** `createProjectedBalanceChart` 21–62 · `createGoalProgressChart` 186–227 · `createForecastComparisonChart` 337–379 — identical background/radius/border/padding/marginBottom + header + `chartDiv` + canvas + height `350px`
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** flagged for follow-up (extract `createChartSection(title, chartType, canvasId)`).

### [Rule 9] — `showFieldError` vs `showContainerError`

- **File:** `src/utils/form-utils/validation.js:99-112` and `118-124`
- **Severity:** ⚪ Low
- **Verdict:** slop (same body; only the restore-selector comment differs)
- **Action:** flagged for follow-up.

### [Rule 9] — Duplicated tag-option construction in one function

- **File:** `src/utils/form-utils/transaction-tags.js` — fallback branch 83–112 vs normal branch 122–161
- **Severity:** 🟡 Medium
- **Verdict:** slop (identical `label/input/mark/text` assembly with different values)
- **Action:** flagged for follow-up (`buildTagOption(name, color, selected)`).

### [Rule 9] — Two date formatters for the same job

- **File:** `src/utils/date-utils.js:15,43` vs `src/utils/financial-planning-helpers.js:188` (the latter has **zero callers**)
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** flagged for follow-up (delete the helpers copy).

### [Rule 9] — `@keyframes spin` declared six times app-wide

- **File:** `src/styles/components/webapp-components.css:123`, `inflation-trends.css:83`, `enhanced-button.css:297`, `src/utils/reports-ui.js:101`, `src/utils/progress-indicators.js:157`, `src/components/LoadingView.js:24`
- **Severity:** 🟡 Medium
- **Verdict:** slop — duplicate global keyframe names mean the last-loaded definition wins for four different spinners; this is where the Rule 8 findings should land.
- **Action:** flagged for follow-up (one declaration in `src/styles/base.css`).

### [Rule 9] — Duplicated amount-validation block

- **File:** `src/utils/form-utils/category-chips.js:272-282` and `397-407` (identical `validateAmount` + `showFieldError` + `return`, including the duplicate `// Validate amount` comment)
- **Severity:** ⚪ Low
- **Verdict:** slop
- **Action:** flagged for follow-up.

## Rule 10 — Try/catch as control flow 🟡 Medium

### [Rule 10] — `try/catch` wrapped around synchronous render in a window event handler

- **File:** `src/utils/form-utils/category-chips.js`
- **Line(s):** 513–527
- **Snippet:**
  ```js
  const _onCategoriesUpdated = () => {
    try { …reconcile…; render(); } catch (e) { console.error('Failed to re-render category selector:', e); }
  };
  ```
- **Severity:** 🟡 Medium (downgraded from High)
- **Verdict:** **intentional-adjacent** — the `catch` does not contain expected-path logic, and a throwing `render()` in an event handler would otherwise break other listeners. Still flagged: the state it protects (`selectedCategory` no longer existing) is knowable up front and is already checked inside the `try` at 518.
- **Action:** flagged for follow-up (low priority — restructure the reconciliation as plain guards).

### [Rule 10, 2] — Dead `validateAndCleanTransactions` is try/catch-as-control-flow throughout

- **File:** `src/utils/reports-utils.js:363-420`
- **Severity:** ⚪ Low
- **Verdict:** **false positive as a Rule 10 case** — every "reject this row" path is a `return` + `errors.push`, so the `try` is not being used to signal not-found/invalid. The function is simply dead (Rule 4).
- **Action:** flagged for deletion with the Rule 4 group; no separate remediation.

## Rule 11 — Stale or misleading placeholder comments 🔴 High

### [Rule 11, 4] — Unterminated JSDoc that silently disabled a function (see Rule 4, 🔴)

- **File:** `src/utils/chart-utils.js:199-256`
- **Severity:** 🔴 High
- **Verdict:** slop
- **Action:** flagged for follow-up — **User Review Required** (restore vs delete is an author call). Written up in full under Rule 4; not duplicated here.

### [Rule 11] — Comment describing a structure that does not exist below it

- **File:** `src/utils/financial-planning-charts.js`
- **Line(s):** 1
- **Snippet:** `// Detailed chart implementations follow below.`
- **Severity:** 🟡 Medium
- **Verdict:** slop — it sits _above_ the file's JSDoc header and is a leftover from a file split; it reads as a header for the wrong thing.
- **Action:** flagged for follow-up (delete).

### [Rule 11] — Stale note about a function that no longer exists

- **File:** `src/utils/inflation-chart-utils.js`
- **Line(s):** 144
- **Snippet:** `// createTrendIndicator uses CSS classes for trend coloring, so getTrendColor is no longer needed here.`
- **Severity:** 🟡 Medium
- **Verdict:** slop — `getTrendColor` was removed; the tombstone survives directly above `createTrendIndicator`, which is itself dead code (Rule 4).
- **Action:** flagged for follow-up (delete together with the dead function).

### [Rule 11, 4] — `// Migrated import to top` + commented-out function

- **File:** `src/utils/reports-charts.js:857-877`
- **Severity:** 🟡 Medium
- **Verdict:** slop — a note describing an edit that already happened, next to 18 lines of commented-out code.
- **Action:** flagged for follow-up.

## Rule 14 — File / module bloat 🟡 Medium

### [Rule 14] — `reports-charts.js` is 923 lines (project guideline: 500)

- **File:** `src/utils/reports-charts.js`
- **Severity:** 🟡 Medium
- **Verdict:** slop-adjacent (bloat is a correlate, not a rule) — confirmed: this file alone holds 3 of the 8 Rule 9 duplications and 12 of the 35 lint warnings.
- **Action:** flagged for follow-up as **its own commit** (the guide says not to bundle a split-this-file refactor into a slop cleanup): split into chart builders + `chart-legend` + `clickable-stat`.

### [Rule 14] — `financial-planning-charts.js` is 642 lines

- **Severity:** 🟡 Medium
- **Verdict:** slop-adjacent — three chart builders sharing one scaffold (Rule 9) + two summary builders.
- **Action:** flagged for follow-up (own commit).

### [Rule 14] — `form-utils/category-chips.js` is 561 lines

- **Severity:** 🟡 Medium
- **Verdict:** slop-adjacent — one file renders category chips, transfer chips, validates, auto-submits, and owns selection state.
- **Action:** flagged for follow-up (own commit: split selector vs chip factory).

_Near-threshold files checked and cleared: `enhanced-empty-states.js` (466), `reports-utils.js` (469), `reports-ui.js` (421) — worth watching, no action._

---

## Traceability — every finding has a destination

| Finding                                                                                                                                                                                                                                                                             | Destination                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Rule 4 `chart-utils.js` corruption 🔴                                                                                                                                                                                                                                               | **User Review Required** (restore vs delete)                                          |
| Rule 5 `TIMING.NOTIFICATION_*` 🔴                                                                                                                                                                                                                                                   | Phase 1 (constants-only fix)                                                          |
| Rule 5 token set: `SPACING.XXXL`, `FONT_SIZES.MD`, `COLORS.PRIMARY_DARK`, `--color-text`, `--font-size-md` 🔴                                                                                                                                                                       | Phase 1 — **cross-cutting** (`FONT_SIZES.MD` also hits 10+ files outside `src/utils`) |
| Rule 5 spinner borders 🟡                                                                                                                                                                                                                                                           | Phase 1 (same file as the progress-indicator cleanups)                                |
| Rule 5 hardcoded `z-index`/px/hex + 35 lint warnings                                                                                                                                                                                                                                | Phase 2                                                                               |
| Rule 4 dead exports (`refreshCharts`, `throttle`, `createFlexContainer`, `updateEmptyState`, `getCopySection`, `getActiveToastCount`, `updateLoadingProgress`, 4× `reports-utils` periods, 4× `financial-planning-helpers`, 3× `inflation-chart-utils`, `Z_INDEX`, `ACCOUNT_TYPES`) | Phase 2                                                                               |
| Rule 4 `createCategoryTrendsChart` + commented block + `// Migrated import to top`                                                                                                                                                                                                  | Phase 2 (re-check `generateMonthlyTrendData` afterwards)                              |
| Rule 4 `type-toggle.js` `updateButtonState`                                                                                                                                                                                                                                         | Phase 2                                                                               |
| Rule 3 guards (`document`, `window` triple, `options` re-check, value-or-empty-string, chip duck-typing)                                                                                                                                                                            | Phase 2                                                                               |
| Rule 1 comments (30+ sites)                                                                                                                                                                                                                                                         | Phase 2 (same pass as the guards)                                                     |
| Rule 11 stale comments (3 besides the 🔴)                                                                                                                                                                                                                                           | Phase 2                                                                               |
| Rule 6 indirection pair                                                                                                                                                                                                                                                             | Phase 2                                                                               |
| Rule 7 inconsistencies                                                                                                                                                                                                                                                              | Phase 3 (needs the shared submit helper)                                              |
| Rule 8 load-time style injection + Rule 9 `@keyframes spin` ×6                                                                                                                                                                                                                      | Phase 3 (move into `src/styles/`)                                                     |
| Rule 9 duplications (stat cards, currency formatters, chart scaffold, tag options, validation pair, date formatters, validation blocks)                                                                                                                                             | Phase 3                                                                               |
| Rule 2 toast-import fallback                                                                                                                                                                                                                                                        | Phase 3                                                                               |
| Rule 10 `_onCategoriesUpdated` try/catch                                                                                                                                                                                                                                            | Phase 3 (low priority)                                                                |
| Rule 14 (three oversized files)                                                                                                                                                                                                                                                     | **Deferred** — explicit follow-up commits (guide: do not bundle)                      |
| Rule 4 `form-utils/index.js` barrel deletion                                                                                                                                                                                                                                        | **Deferred** — quarantine → suite + build → delete in a follow-up commit              |
| False positives ×9 (§above)                                                                                                                                                                                                                                                         | Closed, no action, reason recorded                                                    |

## Suggested next steps

1. **Phase 1 (smallest diff, highest value):** the 🔴 token bugs. `TIMING.NOTIFICATION_*` and the `enhanced-empty-states` tokens are constants-only edits; then re-run the jsdom harness to confirm the toast now survives ~3 s instead of ~230 ms.
2. **User Review Required:** the `chart-utils.js` corruption — decide restore vs delete _before_ Phase 2 touches that file.
3. **Phase 2:** dead exports + guards + trivial/stale comments (one mechanical pass, `yarn run fix` afterwards).
4. **Phase 3:** error-handling normalization, load-time style injection (with the `@keyframes` consolidation), duplicated-logic extraction.
5. **Separate commits:** the three Rule 14 splits, and the barrel quarantine.

### Verification plan (minimum bar)

- **Every phase:** `yarn run lint`, `yarn run format:check`, then `yarn run build`. The `chart-utils.js` case proved lint/format are not sufficient, so the build is not optional.
- **Targeted tests per phase** (not the whole suite): `npx vitest run tests/integration/chart-integration.test.js tests/form-utils/ tests/core/transaction-undo.test.js tests/views/reports-view.test.js`. Baseline measured this session for the first three: 49 passed.
- **Manual QA (concrete user actions, not "verify the flow works"):**
  - _Toasts:_ add a transaction → the green "Transaction saved!" toast must stay ~3 s; delete a transaction → the undo hint stays ~1 s (`TIMING.UNDO_TOAST`) and clicking **Undo** restores the row with its green highlight.
  - _Empty states:_ open Financial Planning → Goals with zero goals → the container must have padding and the primary CTA must darken on hover (`SPACING.XXXL` / `COLORS.PRIMARY_DARK`).
  - _Progress indicator:_ trigger a backup/restore → the spinner must visibly rotate (all four borders were the same colour before).
  - _Reports error state:_ force an analytics failure → "Try Again" and "Back to Dashboard" must render at the previous size (`--font-size-md`).
- **After each phase, re-run runbook steps 1–5 scoped to the touched files** — the guide's named regression risk is exactly this cleanup's pattern: a `showErrorToast` swap-in missing its import.

## Audit hygiene notes

- No repository files were modified by this audit other than this report; all harnesses live in `%TEMP%` (`bb-audit.ps1`, `bb-import-map.txt`, `bb-export-usage.txt`, `bb-toast-check.mjs`).
- The false-positive checklist was applied per finding, not at the end: `git blame` was consulted for the corruption; every "dead" verdict came from a multi-line-aware import-graph sweep plus repo-wide name greps (never from memory); the one guard that _looked_ dead but is reached by a caller (`chart-refresh-helper` rethrow → 4 `try/catch`-wrapped call sites) was downgraded to false positive.
- No finding in `src/utils` is 🔒 security-sensitive: the only security-touching utilities in scope (`escapeHtml`, `sanitizeInput`, `safeJsonParse`) are live and used. The dead code found here is chart/report/formatting code, so nothing required the security carve-out.

---

## Phase 1 remediation (landed 2026-09-15, on top of `e867352`)

Scope was taken from the traceability table: the three Phase 1 rows only (`TIMING.NOTIFICATION_*`, the undefined token set, the spinner borders). The `chart-utils.js` corruption was **not** touched — it is still User Review Required. `yarn run lint` / `format:check` / `build` and the targeted suites were run for this phase alone, per the guide.

### Landed fixes

| #   | Finding (report ref)                                                                                                    | Change                                                                                                                              | Files                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Rule 5 🔴 `TIMING.NOTIFICATION_*` undefined → every toast died in ~230 ms                                               | Added `NOTIFICATION_SUCCESS: 3000`, `NOTIFICATION_ERROR: 5000`, `NOTIFICATION_WARNING: 4000`, `NOTIFICATION_INFO: 3000` to `TIMING` | `src/utils/constants.js:190-194`                        |
| 2   | Rule 5 🔴 `COLORS.PRIMARY_DARK` undefined                                                                               | `PRIMARY_DARK: 'var(--color-primary-dark)'` — that token is declared **and** used by kept CSS rules, so it survives the build       | `src/utils/constants.js:28`                             |
| 3   | Rule 5 🔴 `SPACING.XXXL` undefined                                                                                      | `XXXL: '48px'` (matches `--spacing-3xl`)                                                                                            | `src/utils/constants.js:176`                            |
| 4   | Rule 5 🔴 `FONT_SIZES.MD` undefined (14 call sites, 10+ outside `src/utils`)                                            | `MD: 'var(--font-size-base)'` — see the deviation note below                                                                        | `src/utils/constants.js:230`                            |
| 5   | Rule 5 🟡 `--color-text` never declared                                                                                 | Alias `--color-text: var(--color-text-main)` added to the existing "alias for compatibility with JS references" block               | `src/styles/tokens.css:66`                              |
| 6   | Rule 5 🟡 spinner's four borders shared one colour (three no-op declarations)                                           | `border: 3px solid var(--color-border); border-top-color: var(--color-primary);` in **both** declarations                           | `src/utils/progress-indicators.js:56-58` and `:161-163` |
| 7   | Rule 4-class, pulled forward: `COLORS.INCOME_COLOR_RGB` had **zero call sites** and its token is purged from production | Constant deleted (see the addendum)                                                                                                 | `src/utils/constants.js` (was `:23`)                    |

### Deviation from the report's suggestion: `--font-size-md` was **not** declared as an alias

The report offered "alias to `--color-text-main` / `--font-size-base`, or define the tokens". Declaring `--font-size-md` turned out **not** to work in production, and finding that out changed the fix:

- `vite.config.js:200-219` runs `@fullhuman/postcss-purgecss` with `variables: true` in production builds.
- Empirically, a custom property declared in `tokens.css` survives the build **only while a CSS rule that itself survives purging references it**. A JS-only reference (a constant such as `COLORS.PRIMARY_DARK`, or an inline style string such as `'var(--font-size-md)'`) does **not** keep it alive.
- `--font-size-md`'s only CSS references were inside `.time-period-btn` rules in `reports.css`, and that selector appears in no JS/HTML → purgecss drops those rules → the declaration goes with them. Bundle proof taken before the fix:
  ```
  KEPT    --color-text:            KEPT  --color-primary-dark:
  DROPPED --font-size-md:          DROPPED --color-warning-light:   DROPPED --color-info-light:
  ```
- The fix therefore routes the call sites to the already-declared, purge-safe `--font-size-base` (identical resolution: 1rem) instead of inventing a token that production deletes:
  - `FONT_SIZES.MD: 'var(--font-size-base)'` — `src/utils/constants.js:230`
  - `src/utils/reports-ui.js:206,222` → `'var(--font-size-base)'`
  - `src/styles/components/reports.css:404,424` → `var(--font-size-base)`
- The `--font-size-md` alias itself was removed again: a declaration production purges is a trap, not a fix.

### New guard: `tests/system/design-tokens.test.js` (12 tests)

The `chart-utils.js` case proved the toolchain is blind to this defect class — lint, Prettier and the whole suite stayed green while every toast died in 230 ms — so Phase 1 adds a contract test:

1. **Notification timing** — every `TIMING.NOTIFICATION_*` key is a positive number greater than `ANIMATION_FAST`.
2. **Toast auto-dismiss** — for each of the four toast types the toast is still mounted after 5×`ANIMATION_FAST` and gone after its own duration plus the exit animation (fake timers). This is the regression test for the headline bug.
3. **Declared** — every `var(--token)` without a fallback referenced from any `src/**/*.js` is declared by a stylesheet or injected from JS.
4. **Purge-safe** — the same set must additionally be referenced by a stylesheet rule, i.e. it must survive `purgecss`'s `variables: true` in production.
5. Explicit assertions for the tokens this phase fixed (`--color-text`, `--color-text-main`, `--color-primary-dark`, `--font-size-base`, `--spacing-3xl`).

## Files with pre-existing foreign-token debt are listed in an explicit `KNOWN_TOKEN_DEBT` array (currently only `PrivacyControls.js`) so the guard stays green while that migration is scheduled — and so the list cannot grow silently. Verified non-vacuous: with `TIMING.NOTIFICATION_SUCCESS` forced back to `undefined` the toast is gone at 430 ms and the auto-dismiss test fails.

## Round-1 addendum — production-purge reachability (found during Phase 1 verification)

Rules 1–14 never asked "does this token exist _in the shipped bundle_", so this class of silent failure was invisible to the original audit. It surfaced by running the new purge-safety check across all of `src/` and diffing the result against the built CSS.

**The rule:** a token declared in `tokens.css` is purged from production unless a surviving CSS rule references it (see the deviation note above). JS-only consumers therefore get an invalid value at runtime: `color: var(--x)` is dropped and `borderRadius = 'var(--radius-xs)'` is ignored.

**43 declared tokens are dropped from the production bundle.** Three of them had JS consumers and are fixed below; the other 40 are unused today (breakpoints, unused primary-ramp steps, `*-rgb` helpers, gradients, focus/viewport/transition helpers):
`--secondary`, `--breakpoint-{sm,md,lg,xl}`, `--color-primary-{50,100,300,800,900}`, `--color-warning-rgb`, `--color-error-rgb`, `--color-info-rgb`, `--focus-color-light`, `--focus-shadow-subtle`, `--focus-transition`, `--focus-transition-fast`, `--spacing-{6xl,8xl}`, `--thumb-reach-zone`, `--viewport-height`, `--viewport-width`, `--visual-viewport-height`, `--modal-max-width-small`, `--gradient-{success,warning,error,info,subtle,hero}`, `--transition-slow`, `--ease-in`, `--animation-{entrance,exit}`, `--card-padding-desktop`, `--page-transition-fade`, `--motion-safe`, `--shadow-{button,tooltip}`, `--color-accent-dark`.

### Fixed in this pass (same defect class as Phase 1 — silently invalid at runtime)

| Token                                                    | Kind                                  | Replacement (declared **and** purge-safe)                 | Call sites                                                                                                                            |
| -------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--radius-xs`                                            | never declared                        | `--radius-sm`                                             | `src/views/ReportsView.js:810`                                                                                                        |
| `--color-danger`                                         | never declared                        | `--color-error`                                           | `AccountDeletionSection.js:25,42,50,230`, `DataManagementSection.js:423`, `AccountSection.js` ×8 (`:115,127,139,228,479,491,503,595`) |
| `--color-danger-light`                                   | never declared                        | `--color-error-light`                                     | `AccountDeletionSection.js:231`, `DataManagementSection.js:424`                                                                       |
| `--color-background-secondary`                           | never declared                        | `--color-surface-hover`                                   | `AccountDeletionSection.js:69`                                                                                                        |
| `--color-text-tertiary`                                  | never declared                        | `--color-text-muted` (matches the file's other help text) | `AccountDeletionSection.js:242`                                                                                                       |
| `--border`                                               | never declared                        | `--color-border`                                          | `src/components/DateFormatSection.js:111`                                                                                             |
| `--color-warning-light`, `--color-info-light`            | declared but **purged** (no CSS rule) | `--color-warning`, `--color-info`                         | `src/components/DataManagementSection.js:350,508`                                                                                     |
| `COLORS.INCOME_COLOR_RGB` (= `var(--color-success-rgb)`) | dead constant + purged token          | deleted (zero call sites repo-wide)                       | `src/utils/constants.js`                                                                                                              |

Visual note on the two `*-light` swaps: each site already used the **base** token for `borderColor` (`var(--color-warning)` / `var(--color-info)`), so the label now matches its own border tint instead of resolving to nothing (which silently fell back to the inherited text colour). Before the fix these values were invalid **in production**, so the swap cannot regress shipped behaviour — it restores dev/prod parity.

### Deferred — needs a decision, not a mechanical fix

1. **`--color-success-rgb` is purged, and `reports-charts.js:650,655` still resolves it.** `resolveCssVarColor('--color-success-rgb', …)` returns `null` in production and the literal fallback `rgba(0,179,89,…)` renders the chart. The chart is correct today _only_ because of those literals — which is also why the audit's Rule 2 call on that `catch { return null }` stayed a false positive. Do it in Phase 2 with the rest of the Rule 5 hex/px cleanup: either keep the literals and drop the purged token, or move the RGB triple into a JS constant.
2. **`src/components/PrivacyControls.js` uses a foreign token vocabulary** — 17 distinct names (`--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-hover`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--border-color`, `--primary-color`, `--primary-hover`, `--warning-color`, `--warning-hover`, …), none declared anywhere, so **every** `var()` in that component is invalid in dev _and_ production. Recorded as `KNOWN_TOKEN_DEBT` in the new guard test; migrating it is its own task with visual review.
3. **`.time-period-buttons` / `.time-period-btn` are dead selectors** (`reports.css:376-407,417-427`): `rg "time-period-btn" src` matches only the stylesheet, while `TimePeriodSelector.js` renders `time-period-selector`. Those three rules — and with them the only CSS consumers of `--font-size-md` — never rendered. Decide: rename the classes in `TimePeriodSelector.js` to match, or delete the rules.
4. **Systemic option worth considering:** 40 of the 189 declared tokens are purged today. If JS-side tokens become common, one `safelist` entry for the semantic families in `vite.config.js:204` (e.g. `/^--(color|font|spacing|radius|shadow)/`) would end this bug class for roughly 1 KB of CSS. Ask first — it is a build-config change.

### Phase 1 verification evidence

- **Headline bug:** jsdom harness (`%TEMP%\bb-toast-check.mjs`) — before: 0 toasts at ~430 ms (a 3000 ms toast was intended); after: 1 toast at 430 ms **and** at 730 ms, with `TIMING.NOTIFICATION_SUCCESS = 3000`.
- **Non-vacuous guard:** with `TIMING.NOTIFICATION_SUCCESS` forced back to `undefined`, the toast is gone at 430 ms and the new auto-dismiss test fails; restored, it passes.
- **Tests:** `npx vitest run tests/system tests/form-utils tests/core tests/views tests/components tests/Account tests/integration/chart-integration.test.js` → **34 files, 354 tests passed** (covers every file touched here plus the 12 new design-token tests).
- **Lint:** `npx eslint src/utils` → **35 warnings, 0 errors** — identical to the audit baseline, i.e. no new lint debt. ESLint over every touched file → 0 errors.
- **Format:** `npx prettier --check` over every touched file → "All matched files use Prettier code style!".
- **Build:** `yarn run build` → ✓ built. Bundle spot-checks: all 10 tokens the JS now relies on are **KEPT** (`--color-text`, `--color-text-muted`, `--color-text-main`, `--font-size-base`, `--color-error`, `--color-error-light`, `--color-warning`, `--color-info`, `--color-surface-hover`, `--radius-sm`); all 8 broken tokens are **gone**; `NOTIFICATION_SUCCESS:3e3` is in the constants chunk; the spinner rule in `backup-service.*.js` reads `border: 3px solid var(--color-border); border-top-color: var(--color-primary);`.
- **Pre-existing repo failures, NOT caused by this phase** (all three files untouched here, verified with `git status` / `git diff`): `npx eslint .` → 1 error at `src/views/AddView.js:82` (`'metrics' is assigned a value but never used`); `yarn run format:check` → `src/components/TransactionForm.js`, `src/views/AddView.js`, `todo/ai-slop-inspection-guide.md`. Phase 1 therefore reports a clean _delta_ rather than a clean repo.

### Phase 1 rows now closed in the traceability table

- Rule 5 `TIMING.NOTIFICATION_*` 🔴 → **landed** (`constants.js` only, exactly as planned).
- Rule 5 token set (`SPACING.XXXL`, `FONT_SIZES.MD`, `COLORS.PRIMARY_DARK`, `--color-text`, `--font-size-md`) 🔴 → **landed**; `--font-size-md` closed by routing to `--font-size-base` rather than declaring an alias that production purges.
- Rule 5 spinner borders 🟡 → **landed**.
- Deliberately still open from that same finding, moved to Phase 2 because the report scoped Phase 1 as a "constants-only fix": `transaction-undo.js:17` `TIMING.UNDO_TOAST || 5000` (a dead `|| N` fallback) and the hardcoded `{ duration: 5000, persistent: false }` at `submission.js:146` / `category-chips.js:453`.
- Every other row — Rule 5's hardcoded z-index/px/hex and 35 lint warnings, plus all Rule 1/2/3/4/6/7/8/9/10/11/14 rows — is unchanged and still queued for Phases 2–3.

### Next steps (updated)

1. **User Review Required:** the `chart-utils.js` corruption — restore `groupSmallCategories` or delete it deliberately. Must be decided before Phase 2 touches that file.
2. **Phase 2:** dead exports + guards + trivial/stale comments (one mechanical pass, `yarn run fix` afterwards), plus the deferred Rule 5 companions and the `--color-success-rgb` decision.
3. **Decisions needed for the addendum:** `PrivacyControls.js` token migration, the dead `.time-period-btn` rules, and whether to safelist semantic token families in `vite.config.js`.
4. **Phase 3:** error-handling normalization, load-time style injection (with the `@keyframes` consolidation), duplicated-logic extraction.
5. **Separate commits:** the three Rule 14 splits, and the barrel quarantine.

---

## Phase 2 remediation (landed 2026-09-15 as `a9fea22`, on top of `7439757`)

Scope was taken from the traceability table: every Phase 2 row (Rule 5 hardcoded values + 35 lint warnings, all Rule 4 dead code, Rule 3 guards, Rule 1 comments, Rule 11 stale comments, Rule 6 indirection) **plus** the items Phase 1 explicitly deferred here (the `TIMING` companions, the `--color-success-rgb` decision) **plus** the User Review Required `chart-utils.js` decision, which was taken in-session (**delete**) before the pass began.

Net diff (committed): 25 files, +129 / −888. Uncommitted on top: `type-toggle.js` `updateButtonState` removal (−19, row #4 below) and this report update.

### Landed fixes

| #   | Finding (report ref)                                                                                                                                                                                                                                   | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Files                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rule 4/11 🔴 corruption — unterminated JSDoc + stray duplicate `return` (delete decided)                                                                                                                                                               | Removed `prepareLineChartData`, `sortByAmount`, `groupSmallCategories` (taking the corruption with it), `createEmptyStateData`. `chart-utils.js` is a valid module again: 6 exports, all exercised by `chart-integration.test.js`                                                                                                                                                                                                                                                                   | `src/utils/chart-utils.js` (−131)                                                                                                                                                                                                                     |
| 2   | Rule 4 dead exports: `refreshCharts`, `throttle`, `createFlexContainer`, `updateEmptyState`, `getCopySection`, `getActiveToastCount`, `updateLoadingProgress`, 3× `reports-utils` periods, 4× `financial-planning-helpers`, 3× `inflation-chart-utils` | All deleted, plus `validateAndCleanTransactions` and `generateMonthlyTrendData` (which closes Rule 10 [10,2] and Rule 2 [2,4] — both were written up as "delete with the Rule 4 group"). `Z_INDEX` is **revived**, not deleted: `progress-indicators.js` now consumes it. `ACCOUNT_TYPES` is downgraded to intentional (see §decisions)                                                                                                                                                             | `chart-refresh-helper.js`, `touch-utils.js`, `dom-factory.js`, `enhanced-empty-states.js`, `copy-strings.js`, `toast-notifications.js`, `reports-ui.js`, `reports-utils.js` (−174), `financial-planning-helpers.js`, `inflation-chart-utils.js` (−83) |
| 3   | Rule 4 ~200 lines unreachable chart code + Rule 11 `// Migrated import to top`                                                                                                                                                                         | Deleted `createCategoryTrendsChart`, the commented-out `createToggleButton`, and the orphan note (~165 lines). Dead `TransactionService` / `generateMonthlyTrendData` imports dropped with it — and `generateMonthlyTrendData` itself is deleted in #2, so the report's re-check comes back clean                                                                                                                                                                                                   | `src/utils/reports-charts.js` (−219)                                                                                                                                                                                                                  |
| 4   | Rule 4/9 `type-toggle.js` `updateButtonState` (uncommitted follow-up, verified)                                                                                                                                                                        | Deleted the dead `updateButtonState` closure, the `btn.updateState` assignment, the ignored `updateState` option, and its JSDoc line. `rg "updateState" src tests` proves nothing ever called it on a type-toggle button (only category chips call `updateState`, on their own objects). Live path `updateAllButtons` untouched                                                                                                                                                                     | `src/utils/form-utils/type-toggle.js` (−19, working tree)                                                                                                                                                                                             |
| 5   | Rule 4/9/11 small artefacts                                                                                                                                                                                                                            | Deleted the commented-out `input.step`, the duplicated `chip.style.overflow`, and (with #1) the duplicated `return topCategories;`                                                                                                                                                                                                                                                                                                                                                                  | `form-utils/amount-input.js`, `form-utils/category-chips.js`                                                                                                                                                                                          |
| 6   | Rule 3 guards                                                                                                                                                                                                                                          | `typeof document` guards → plain calls (both style-injectors); `window` triple-guards → plain add/removeEventListener; `options &&` re-checks dropped; `value \|\| ''` → `value ?? ''` (3 sites); chip duck-typing `if (c.updateState)` dropped (same file creates the chips)                                                                                                                                                                                                                       | `enhanced-empty-states.js`, `progress-indicators.js`, `form-utils/category-chips.js`, `dom-factory.js`, `form-utils/amount-input.js`                                                                                                                  |
| 7   | Rule 1 trivial comments (~30 sites)                                                                                                                                                                                                                    | All deleted: 11 in `reports-charts.js` (headers, hovers, clicks, legend, chart container), 8 in `financial-planning-charts.js`, 4 in `toast-notifications.js`, 3 in `progress-indicators.js`, 5 in `enhanced-empty-states.js`; the `// Validate amount` pairs collapsed to one copy per site                                                                                                                                                                                                        | 6 files (same pass as #6)                                                                                                                                                                                                                             |
| 8   | Rule 11 stale comments                                                                                                                                                                                                                                 | Deleted the file-split header (`financial-planning-charts.js:1`), the `getTrendColor` tombstone (with its dead function), and `// Migrated import to top` (with #3)                                                                                                                                                                                                                                                                                                                                 | `financial-planning-charts.js`, `inflation-chart-utils.js`                                                                                                                                                                                            |
| 9   | Rule 6 indirection                                                                                                                                                                                                                                     | `refreshCharts` deleted (with #2); private `hideIndicator` closure folded into the shared exported `hideProgressIndicator`; `getCopySection` deleted (with #2)                                                                                                                                                                                                                                                                                                                                      | `chart-refresh-helper.js`, `progress-indicators.js`, `copy-strings.js`                                                                                                                                                                                |
| 10  | Rule 5 hardcoded z-index/px/hex + 35 lint warnings                                                                                                                                                                                                     | New constants `SPACING.XXS`, 8× `DIMENSIONS` (pie/line/bar heights, legend padding+swatch, placeholder height, content width, indicator width), `Z_INDEX.PROGRESS_INDICATOR`, `COLORS.SUCCESS_RGB`/`ERROR_RGB`; every call site swapped (borders via substitution templates, warning/error tints via `color-mix()` module consts, canvas colours via the RGB triples — which also resolves the deferred `--color-success-rgb` decision: purged token dropped, literals replaced by the JS constant) | `constants.js` (+16), `progress-indicators.js`, `enhanced-empty-states.js`, `reports-ui.js`, `reports-charts.js`, `financial-planning-charts.js`, `financial-planning-helpers.js`, `form-utils/*`, `transaction-selection.js`                         |
| 11  | Phase-1-deferred `TIMING` companions                                                                                                                                                                                                                   | `TIMING.UNDO_TOAST \|\| 5000` → `TIMING.UNDO_TOAST`; both hardcoded `{ duration: 5000, persistent: false }` → `{ duration: TIMING.NOTIFICATION_ERROR }` (`persistent` dropped — it defaults `false`)                                                                                                                                                                                                                                                                                                | `transaction-undo.js`, `form-utils/submission.js`, `form-utils/category-chips.js`                                                                                                                                                                     |
| 12  | Incidental, same commits                                                                                                                                                                                                                               | The repo's only ESLint error (`AddView.js:82` unused `metrics`) fixed by dropping the assignment; `category-chips.test.js` fake `window` completed with `addEventListener`/`removeEventListener` mocks (the removed triple-guard was load-bearing only for that mock — real `window` always has them); two blank lines removed from the inspection guide                                                                                                                                            | `src/views/AddView.js`, `tests/form-utils/category-chips.test.js`, `todo/ai-slop-inspection-guide.md`                                                                                                                                                 |

### Decisions / deviations from the report

- **`chart-utils.js`: delete** (user decision in-session, before the pass). The corruption fix and the orphan removal are the same edit — restoring `groupSmallCategories` would have resurrected a function with zero callers.
- **`ACCOUNT_TYPES`: downgraded to intentional.** Its sole in-module consumer is the live `DEFAULTS.ACCOUNT_TYPE` (`account-service.js` reads it), and it sits in a coherent family with the live, tested `ACCOUNT_TYPE_LABELS` / `getAccountTypeLabel`. Deleting it would inline the magic string `'checking'` into `DEFAULTS` — against `constants.js`'s own purpose. Recorded here so the row is closed deliberately, not overlooked.
- **`--color-text` → `--color-text-main` in `progress-indicators.js`** (3 spots: message + cancel border/color). The report's own suggested alias; `--color-text` is now declared-and-kept per Phase 1, but the plain token reads clearer at these sites and matches the file's other references.
- **`2px` → `SPACING.XXS` on two `reports-charts.js` labels** — same defect class as the `financial-planning-charts.js` items; leaving them would have kept the lint rule firing.
- **`type-toggle.js` ternaries left alone** (`'1px solid transparent'` / `'1px solid var(--color-border)'` inside conditional expressions). The lint rule only flags direct-assignment literals, so rewording them buys zero signal at the cost of churn.
- **`// Validate amount` kept as a single copy per site** — the report says the pair "disappears with the Rule 9 dedupe"; the duplication (not the comment) is gone.
- **CRLF normalisation.** The file editor normalised all 22 touched files to CRLF mid-pass (repo standard is LF, `endOfLine: 'lf'`); converted back with a byte-exact script — no content change, `prettier --check` clean afterwards.

### Phase 2 verification evidence

- **Lint:** `npx eslint src/utils` → **0 problems** (audit baseline was 35 warnings). `npx eslint src` → **0 errors**, 106 warnings, all in files untouched by either phase (components/views outside `src/utils`).
- **Format:** `npx prettier --check src/utils` → "All matched files use Prettier code style!".
- **Tests (targeted, per the guide):** `tests/form-utils/` + `tests/utilities/transaction-form.test.js` → 192/192 (includes the `category-chips` mock fix); `reports-view` + `InflationTrends` + `ProgressiveEmptyState` + `category-selector` + `financial-planning/` → 23/23; `type-toggle` + `tests/Account/` after the #4 follow-up → 48/48.
- **Build:** `yarn run build` → ✓ built (the `INEFFECTIVE_DYNAMIC_IMPORT` warning for the toast module is pre-existing).
- **Dead-code sweep:** every deleted export greps to 0 references across `src/`, `tests/`, `index.html`, `public/`. `updateButtonState` re-verified dead post-pass (`rg "updateState"` → only category-chip call sites).
- **Pre-existing failures, NOT caused by this phase:** none remaining from Phase 1's list — the `AddView.js` error and the guide blank lines were fixed inside the phase-2 commit (#12). `yarn run format:check` repo-wide still reports `src/components/TransactionForm.js` and `todo/ai-slop-inspection-guide.md` (both untouched here).

### Phase 2 rows now closed in the traceability table

- Rule 5 hardcoded `z-index`/px/hex + 35 lint warnings → **landed** (`eslint src/utils` is 0; `--color-success-rgb` resolved via JS constants).
- Rule 4 dead exports → **landed**, except `Z_INDEX` (revived — now consumed) and `ACCOUNT_TYPES` (downgraded, see above).
- Rule 4 `createCategoryTrendsChart` + commented block + `// Migrated import to top` → **landed**; `generateMonthlyTrendData` re-check clean (deleted, zero callers).
- Rule 4 `type-toggle.js` `updateButtonState` → **landed** (uncommitted follow-up, evidence above).
- Rule 3 guards → **landed** (all five items).
- Rule 1 comments → **landed** (all ~30 sites).
- Rule 11 stale comments → **landed** (all 3 besides the 🔴, plus the 🔴 itself via the delete decision).
- Rule 6 indirection → **landed** (all three).
- Phase-1-deferred companions (`UNDO_TOAST`, both `duration: 5000`) → **landed**.
- Rule 4 `chart-utils.js` corruption → **closed** (delete decided + executed).
- Deliberately still open: Rule 14 splits, barrel quarantine (both marked **Deferred** — unchanged), and everything already assigned to Phase 3.

### Next steps (updated)

1. **Commit the tail:** the `updateButtonState` follow-up (−19, verified above) — amend into `a9fea22` or a separate commit, then this report update with it.
2. **Phase 3:** Rule 7 (shared submit helper first — it unblocks the toast-import normalisation), Rule 8 + `@keyframes spin` ×6 consolidation into `src/styles/`, Rule 9 duplications (stat cards, currency formatters, chart scaffold, tag options, validation pair, date formatters, validation blocks), Rule 2 toast-import fallback, Rule 10 `_onCategoriesUpdated` (low).
3. **Deferred structural (unchanged):** three Rule 14 file splits and the barrel quarantine — explicit follow-up commits, never bundled.
4. **Carried-over decisions:** `PrivacyControls.js` token migration, dead `.time-period-btn` rules, `vite.config.js` token safelist option.

---

## Phase 3 remediation (landed 2026-09-15, on top of `7ab40b0`)

Scope was taken from the traceability table: every Phase 3 row (Rule 7 shared helper + toast normalisation, Rule 8 style injection + `@keyframes spin`, all Rule 9 duplications, Rule 2 toast fallback, Rule 10 try/catch). The `7ab40b0` head had already normalised the toast dynamic imports to static imports, so that half of Rule 7 is closed by verification rather than new edits.

### Landed fixes

| #   | Finding (report ref)                                                          | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Files                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rule 7 silent `catch {` in sanitizer                                          | Intentional-fallback comment added; no log (hot path, callers already get a sanitized string).                                                                                                                                                                                                                                                                                                                                                                                          | `src/utils/security-utils.js`                                                                                                                                           |
| 2   | Rule 7 `submission.js` vs `category-chips.js` duplicated submit/error path    | New `resolveSubmitDateValue()` + `validateAmountField()` shared helpers; both transfer and category auto-submit paths now call `handleFormSubmit(payload, onSubmit)`. Transfer path gains error handling it lacked; category path drops its bespoke try/catch.                                                                                                                                                                                                                          | `submission.js`, `form-utils/validation.js`, `form-utils/category-chips.js`                                                                                             |
| 3   | Rule 7 mixed toast-import strategy                                            | Closed by `7ab40b0`: repo-wide `rg toast-notifications` shows 12 static imports, 0 dynamic `import()`. No new edits.                                                                                                                                                                                                                                                                                                                                                                    | `main.js`, `TransactionListItem.js`, `AddView.js`, `EditView.js`, etc. (prior commit)                                                                                   |
| 4   | Rule 8 load-time `<style>` injection + Rule 9 `@keyframes spin` ×6            | New `src/styles/components/loading-indicators.css` (canonical `@keyframes spin`, `@keyframes float`, `.progress-spinner`, empty-state focus + responsive) imported from `main.css`. `addEmptyStateStyles()` / `addProgressStyles()` are backward-compat no-ops; `reports-ui.js` per-call injection and `LoadingView.js` inline `<style>` removed. Component-CSS duplicates (`webapp-components`, `inflation-trends`, `enhanced-button`) left — identical definitions, no visual effect. | `styles/components/loading-indicators.css` (new), `styles/main.css`, `enhanced-empty-states.js`, `progress-indicators.js`, `reports-ui.js`, `components/LoadingView.js` |
| 5   | Rule 9 clickable stat cards ×4 (~200 lines)                                   | New `createClickableStat({ label, formattedValue, color, align, labelMargin, valueSize, ariaLabel, title, onClick })`; 4 blocks collapsed, shared `savePeriodAndGo` handlers preserve navigation (income saves type filter + period; spent/expenses save period only).                                                                                                                                                                                                                  | `src/utils/reports-charts.js` (−~150)                                                                                                                                   |
| 6   | Rule 9 currency formatters ×5 + 18 inline                                     | `financial-planning-helpers.formatCurrency` locale fixed `en-EU` → `en-US` (matches the 18 inline sites; `en-EU` is not a valid BCP47 tag). `reports-charts.js`, `financial-planning-charts.js`, `inflation-chart-utils.js` import and reuse it for all default 2-decimal sites; axis-tick callbacks with `minimumFractionDigits: 0` kept inline (intentional different formatting). Local `formatCurrency` shadow in `reports-charts.js` deleted.                                      | `financial-planning-helpers.js`, `reports-charts.js`, `financial-planning-charts.js`, `inflation-chart-utils.js`                                                        |
| 7   | Rule 9 chart scaffold ×3                                                      | New `createChartSection({ className, chartType, title, canvasId })`; all three builders delegate.                                                                                                                                                                                                                                                                                                                                                                                       | `src/utils/financial-planning-charts.js`                                                                                                                                |
| 8   | Rule 9 `showFieldError` vs `showContainerError` + amount-validation blocks ×2 | Internal `flashErrorBorder()` shared by both exports (behaviour identical, tests unchanged); new `validateAmountField(amountInput)` collapses the two `validateAmount + showFieldError + return` blocks.                                                                                                                                                                                                                                                                                | `form-utils/validation.js`, `form-utils/category-chips.js`                                                                                                              |
| 9   | Rule 9 tag-option construction ×2                                             | New `buildTagOption({ name, color, selected, onToggle })`; fallback and normal branches delegate (offline placeholder preserves selected value).                                                                                                                                                                                                                                                                                                                                        | `form-utils/transaction-tags.js`                                                                                                                                        |
| 10  | Rule 9 two date formatters                                                    | Already closed by Phase 2: `financial-planning-helpers.formatDate` is gone (file now exports only `createUsageNote`, `createPlaceholder`, `createSectionContainer`, `formatCurrency`, `safeParseDate`); `date-utils.js` is the single owner. No new edits.                                                                                                                                                                                                                              | —                                                                                                                                                                       |
| 11  | Rule 2 toast-import fallback                                                  | `handleFormSubmit` keeps `console.error` + `showErrorToast`, now wrapped so a throwing toast falls back to `alert()` (with `no-alert` disable). Static imports make chunk-failure impossible; the `alert` covers the residual toast-UI-throws case. Non-`Error` throws use `e?.message ?? String(e)` instead of `undefined`.                                                                                                                                                            | `form-utils/submission.js`                                                                                                                                              |
| 12  | Rule 10 `_onCategoriesUpdated` try/catch                                      | Guards hoisted out of `try`; only `render()` stays guarded with a comment (event-handler safety for other listeners).                                                                                                                                                                                                                                                                                                                                                                   | `form-utils/category-chips.js`                                                                                                                                          |

### Phase 3 verification evidence

- **Lint:** `npx eslint src/utils src/components/LoadingView.js` → **0 problems** (one interim `no-alert` warning silenced with an inline disable; the fallback is the report's requested `alert`). `npx eslint src` → **0 errors**, 106 warnings, all in files untouched by any phase (components/views outside `src/utils`).
- **Format:** `npx prettier --check` over every touched file → clean (one `category-chips.js` reformat via `--write`, no logic change).
- **Tests:** `tests/form-utils` + `design-tokens` + `chart-integration` → **213/213**; `reports-view` + `transaction-form` + `transaction-undo` → **13/13**.
- **Build:** `yarn run build` → ✓ built.
- **Dead-code sweep:** `rg toast-notifications` → 12 static imports, 0 dynamic; `rg "new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' })"` under `src/utils` → only the intentional 0-decimal axis ticks + `chart-utils.js` USD + the single canonical `financial-planning-helpers.js` definition.

### Phase 3 rows now closed in the traceability table

- Rule 7 inconsistencies → **landed** (shared helper first, then toast normalisation verified).
- Rule 8 load-time injection + Rule 9 `@keyframes spin` ×6 → **landed** (JS injections removed; canonical CSS added; pre-existing component-CSS duplicates left as harmless identicals).
- Rule 9 duplications (stat cards, currency, scaffold, tag options, validation pair, validation blocks) → **landed**; date formatters → **already closed by Phase 2**.
- Rule 2 toast-import fallback → **landed** (static imports + alert fallback).
- Rule 10 `_onCategoriesUpdated` → **landed** (low priority, guards hoisted).
- Deliberately still open (unchanged): Rule 14 splits, barrel quarantine (see quarantine note below), and the carried-over decisions (`PrivacyControls.js` tokens, dead `.time-period-btn` rules, `vite.config.js` safelist).

### Carried-over decisions — resolved (2026-09-15)

1. **`PrivacyControls.js` token migration → landed.** All 12 foreign tokens in the injected `<style>` block mapped to the app vocabulary: `bg-primary→color-surface`, `bg-secondary→color-background`, `bg-tertiary→transparent` (matches the secondary-button pattern), `bg-hover→color-surface-hover`, `border-color→color-border`, `text-primary→color-text-main`, `text-secondary→color-text-muted`, `primary-color→color-primary`, `primary-hover→color-primary-dark`, `warning-color→color-warning`, `warning-hover→color-warning-dark`. Visual note: these were invalid in dev _and_ prod (fell back to inherited/transparent), so the component now renders with real backgrounds for the first time — worth one glance. Removed from `KNOWN_TOKEN_DEBT` (list is now empty).
2. **Dead `.time-period-btn` rules → deleted.** The three media-query blocks in `reports.css` (mobile/tablet/desktop) targeted `.time-period-buttons` / `.time-period-btn`, which nothing renders — `TimePeriodSelector.js` renders `time-period-selector` with its own inline layout. Deletion (−40 lines) chosen over renaming: renaming would restyle a working component to match dead CSS. Zero references remain.
3. **`vite.config.js` token safelist → landed.** Purgecss `safelist` converted to object form: existing patterns preserved under `standard`, plus `variables: [/^--(color|font|spacing|radius|shadow)/]` (~1 KB: index.css 81,911 bytes). Two things found while verifying:
   - `--color-warning-dark` was **purged** despite 4 JS references in `reports-ui.js` — same silent bug class as Phase 1, now kept (bundle-confirmed). This also makes the `PrivacyControls` `warning-hover` mapping above prod-safe.
   - `@keyframes float` was **purged** (applied only from a JS inline style, so no CSS rule kept it alive) — empty-state icons never floated in production. Now pinned via `safelist.keyframes: [/^(spin|float)$/]` (`standard` does not cover keyframe names — verified empirically: adding `float` there kept it purged).
   - The purge-safe guard test itself was **vacuous**: it statically imported `vite.config.js` under the test runner's `NODE_ENV`, so the build under test never included purgecss and always passed. It now re-imports the config under `NODE_ENV=production` (`vi.resetModules` + dynamic import). Negative control: with the safelist stashed, the test fails (1 failed / 11 passed); with it, 12/12 — so the guard is now real.

### Barrel quarantine (2026-09-15)

`src/utils/form-utils/index.js` (17-line barrel, zero importers repo-wide, incomplete — never re-exported `transaction-tags.js`) moved via `git mv` to `src/utils/form-utils/_deprecated/index.js`. Verification at quarantine time: `npx eslint src/utils` → 0 problems; `tests/form-utils` + `design-tokens` + `chart-integration` + `tests/financial-planning/` → 221/221; `yarn run build` → ✓ built. Deletion is the follow-up commit — if the next full-suite run stays green, delete `_deprecated/` outright.

---

## Round 2 — 18-file sweep (2026-09-15)

**Scope:** `src/views/ReportsView.js` (1581), `src/views/DashboardView.js` (1295), `src/components/ChartRenderer.js` (971→1124 with instance), `src/components/TimePeriodSelector.js` (1107), `src/views/financial-planning/GoalsSection.js` (1062), `src/styles/components/ui.css` (983), `src/core/data-integrity-service.js` (962), `src/components/CustomCategoryManager.js` (912), `src/core/custom-category-service.js` (899), `src/styles/components/reports.css` (839), `src/core/analytics/TrendService.js` (822), `src/styles/utilities/view-styles.css` (680), `src/core/forecast-engine.js` (770), `src/components/AccountSection.js` (738), `src/core/chart-config.js` (715), `src/styles/hero.css` (653), `src/core/Account/account-deletion-service.js` (628), `src/core/sync-service.js` (695) — all over the 500-line AGENTS.md guideline (Rule 14).

**Method:** rule-by-rule sweep per guide runbook with `rg`, `ast-grep` (`try { $$$ } catch ($E) { $$$ }` → 220 hits repo-wide, triaged to scope), targeted `Read` of every catch in scope, import/export grep per file, hardcoded-value grep (`#[0-9a-fA-F]{3,6}|z-index|9999`), comment scan. Background `explore`/`librarian` agents failed (model/billing) — audit completed with direct tools only.

### Rule 1 — Trivial comments ⚪ Low

### [Rule 1] — Narrative restatements removed

- **File:** src/views/ReportsView.js, src/views/DashboardView.js
- **Line(s):** ReportsView ~193 (`// Preload Chart.js`), ~198 (`// State management`), ~225 (`// Create header Container`), ~229 (`// Main content area`), ~742 (`// Create skeleton for each section`); DashboardView ~291 (`// Update each transaction item's selected style`)
- **Severity:** ⚪ Low
- **Snippet:** `// Create header Container` above `createHeader()`; `// Preload Chart.js` above `preloadChartJS()`
- **Verdict:** slop
- **Action:** fixed in this session (4 deletions: preload/state-management/header-container/main-content/skeleton + selection-style; remainder e.g. `// Check if container exists, create if not` ×5, `// Get budget status` left — useful section anchors in 1500-line files)

### Rule 2 — Swallowed errors 🔴 High

### [Rule 2] — Silent catches now log (non-critical fallbacks preserved)

- **File:** src/core/analytics/TrendService.js; src/views/DashboardView.js; src/views/financial-planning/GoalsSection.js; src/core/sync-service.js
- **Line(s):** TrendService 26–28; DashboardView 256–258; GoalsSection 740–742; sync-service 148–150
- **Severity:** 🔴 High
- **Snippet:** `} catch { this.persistedData = { lastAnalysisDate: null }; }` / `} catch { return new Set(); }` / `} catch { // Non-critical — silently fail }` / `} catch { /* ignore storage errors */ }`
- **Verdict:** slop
- **Action:** fixed in this session — each gains `console.warn` with context + error param; fallback behaviour unchanged (defaults returned, toast still dispatched in sync-service)

### [Rule 2, 7] — Inconsistent ConfirmDialog loader catch

- **File:** src/components/AccountSection.js
- **Line(s):** 622–624 (vs 258–262 which already falls back to `errorText`)
- **Severity:** 🟡 Medium
- **Snippet:** `.catch(() => { console.error('Failed to load ConfirmDialog'); })`
- **Verdict:** slop
- **Action:** fixed in this session — now `.catch(dialogError => { console.error(..., dialogError); errorText.textContent = ...; errorText.style.opacity = '1'; })`, matching the add-account path

### Rule 5 — Hardcoded values ⚪ Low

### [Rule 5] — JS inline styles mapped to tokens/vars (fallbacks preserve rendering)

- **File:** src/views/financial-planning/GoalsSection.js; src/views/ReportsView.js; src/components/AccountSection.js
- **Line(s):** GoalsSection ~317 (badge), ~428–430 (progBg); ReportsView ~807–812 (fallbackWarning); AccountSection 50/54/397/399/402 + 414/418/687 (overlays + buttons)
- **Severity:** ⚪ Low
- **Snippet:** `style.color = '#fff'` / `style.background = '#eee'` / `style.color = '#92400e'` / `background: rgba(0,0,0,0.5)` / `color: white`
- **Verdict:** slop
- **Action:** fixed in this session — badge `color → var(--color-on-error, #fff)`, `padding 2px 6px → SPACING.XXS/XS`, `radius 4px → var(--radius-sm)`; progBg `8px → SPACING.SM`, `#eee → var(--color-border)`; fallbackWarning `rgba/#92400e/0.875rem → var(--color-warning-*, …)` + `var(--font-size-sm)`; AccountSection overlays/buttons `rgba → var(--color-overlay, …)`, `z-index 1000 → var(--z-index-modal, 1000)`, `white → var(--color-on-primary, #fff)`, `4px → var(--radius-sm)`. Canvas colours in `chart-config.js` (`#fff/#ffffff/rgba(0,0,0,0.95)`) deliberately untouched — Chart.js canvas cannot read CSS vars; flagged intentional.

### [Rule 5] — Magic z-index in CSS mapped to vars with identical fallbacks

- **File:** src/styles/components/ui.css; src/styles/components/reports.css
- **Line(s):** ui.css 227/354 (`z-index: 10000` ×2); reports.css 108 (`100`), 149 (`1000`)
- **Severity:** ⚪ Low
- **Snippet:** `z-index: 10000;` / `z-index: 100 !important;`
- **Verdict:** slop
- **Action:** fixed in this session — `var(--z-index-toast, 10000)`, `var(--z-index-tooltip, 100/1000)`; rendered values unchanged. `reports.css:799 z-index: 999` + `webapp-patterns 9999`/`-10000px` left for follow-up (outside scope).

### Rules 3, 4, 6, 9, 10 — Flagged, not auto-remediated

### [Rule 3] — 🔒 Security carve-out

- **File:** src/core/Account/account-deletion-service.js (628 lines)
- **Line(s):** ownership/authorization guards (full-file scope)
- **Severity:** 🔴 High + 🔒
- **Snippet:** auth/ownership/deletion guards
- **Verdict:** intentional (confirmation required)
- **Action:** flagged for author confirmation — never auto-remediated per guide; no caller-analysis deletion attempted

### [Rule 4] — Dead-code sweep, no deletions

- **File:** all 14 JS files in scope
- **Line(s):** export/callsite grep (`rg symbolName` whole-repo); `custom-category-service.js:859 TODO: Implement usage tracking` verified still-missing (kept)
- **Severity:** 🟡 Medium
- **Snippet:** `mostUsedCategories: [], // TODO: Implement usage tracking`
- **Verdict:** false positive / intentional (pending feature, not stale)
- **Action:** left as-is; whole-file quarantine procedure (steps 1–4) not triggered — no orphan file claimed

### [Rule 9] — Duplicated overlay builders (AccountSection add vs edit, ~150 lines each)

- **File:** src/components/AccountSection.js
- **Line(s):** ~42–120 vs ~406–480
- **Severity:** 🟡 Medium
- **Snippet:** two identical `dialog-overlay`/`dialog-card` cssText blocks + focus/Escape/cleanup trios
- **Verdict:** slop
- **Action:** flagged for follow-up (extract `showAccountDialog({title, initial, onSave})` during the Rule 14 split — not bundled into this token/logging pass)

### [Rule 10] — JSON.parse-in-try is validation, not control flow

- **File:** src/core/data-integrity-service.js:821–826, 876–881; src/views/DashboardView.js:215
- **Severity:** 🟡 (downgraded)
- **Snippet:** `try { JSON.parse(value); } catch { malformedKeys.push(key); }`
- **Verdict:** false positive / intentional — no `if`-expressible pre-check exists for malformed JSON
- **Action:** left as-is

### Rule 14 — Bloat (all 18 files over 500)

- **File:** all 18 (1392 → 628 lines)
- **Severity:** 🟡 Medium
- **Verdict:** slop correlate
- **Action:** flagged for follow-up — no split bundled per guide ("Don't bundle a split-this-file refactor into an unrelated slop-cleanup change"). Proposed splits deferred to user decision: ReportsView (header/skeleton/sections), DashboardView (selection/bulk/preload), ChartRenderer (line/bar/pie builders), TimePeriodSelector (month/quarter/custom), GoalsSection (list/edit/progress).

### Traceability (Round 2)

- Scheduled + landed: Rule 1 (4 comment deletions), Rule 2 (4 silent catches + 1 inconsistent catch), Rule 5 (JS tokens + CSS z-index vars)
- Deferred with reason: Rule 9 AccountSection dialog dedupe (depends on Rule 14 split shipping first); Rule 14 splits (user decision pending); reports.css:799 + webapp-patterns z-indexes (outside scope)
- Downgraded: Rule 3 🔒 deletion guards; Rule 4 TODO usage-tracking; Rule 10 JSON-parse catches; chart-config canvas literals
- User Review Required: 🔒 account-deletion guards; Rule 14 split plan

### Verification (Round 2)

- **Lint:** `yarn run check` → 0 errors, 107 warnings (residual `local/no-raw-style-values` are var-fallback literals, e.g. `var(--color-on-error, #fff)` — themable, rendered value unchanged)
- **Format:** `yarn prettier --write` over all 8 touched files → clean
- **Tests:** `yarn test --run` → 54 files, 443 tests passed
- **Build:** `yarn run build` → ✓ built in 825ms
