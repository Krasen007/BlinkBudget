# Components audit — 2026-09-16

**Baseline:** `37d1399`. Scope: `f:\AI\repos\BlinkBudget\src\components\`, recursively: 42 JavaScript files, 12,327 physical lines before the two-line fix below. Earlier audit history is preserved.

**Method:** rule-by-rule regex/AST sweeps, all 37 catch clauses plus five promise catches, named-export references across the repository, module initializers, comment inventory, token-member validation, sibling comparison, and focused source/test/blame inspection. Mechanical coverage includes every component; deeper manual reads/history checks concentrate on reported candidates, not an exhaustive semantic proof of every line. No TypeScript/React: rules 12/13 do not apply. No TODO/FIXME/HACK markers found. Local/remote-tracking branches were listed; live PRs and unpublished plans were not checked. Unused APIs are candidates, not deletion authorization.

**Summary:** error-feedback gaps, unused APIs, undefined tokens, duplicated UI logic, stale comments, and eight oversized modules. One account-edit field overwrite was reproduced and fixed with a red/green regression test. No security-sensitive findings were remediated. The pre-existing deletion of `f:\AI\repos\BlinkBudget\todo\.~lock.codebase-line-count.csv#` was left untouched.

Line references use the baseline. Removing two lines from AccountSection shifts subsequent references by -2.

## Rule 1 — Narrative comments

### C01 — Elementary DOM operations narrated

- **File:** `f:\AI\repos\BlinkBudget\src\components\TimePeriodSelector.js`; `f:\AI\repos\BlinkBudget\src\components\DateInput.js`; `f:\AI\repos\BlinkBudget\src\components\DataManagementSection.js`
- **Line(s):** 601–624; 63–85; 217–224 (representative sites)
- **Severity:** ⚪ Low
- **Snippet:** `// Update state` above `currentPeriod = newPeriod`; `// Connect label to input`; `// Add spacing`.
- **Verdict:** slop. Retain comments explaining timezones, accessibility, and lifecycle constraints.
- **Action:** flagged for follow-up; cosmetic phase.

## Rule 2 — Silent failures

### C02 — Account-list rendering errors leave a blank/partial list

- **File:** `f:\AI\repos\BlinkBudget\src\components\AccountSection.js`
- **Line(s):** 328–335, 730–732 (current 728–730)
- **Severity:** 🔴 High
- **Snippet:** `catch (error) { console.error('Error loading accounts:', error); }`
- **Verdict:** slop. The list is cleared before rendering; callers cannot distinguish failed rendering from completion. Save handlers subsequently close their dialogs. No inline error, retry, or propagation.
- **Action:** flagged for follow-up; phase A. Report rendering failure without implying a successful write failed.

### C03 — Failed date-format save looks saved

- **File:** `f:\AI\repos\BlinkBudget\src\components\DateFormatSection.js`
- **Line(s):** 148–161
- **Severity:** 🔴 High
- **Snippet:** `SettingsService.saveSetting('dateFormat', newFormat)` followed by console-only catch.
- **Verdict:** slop. SettingsView enables manual selection. Storage writes can throw; selection is not reverted and no user feedback appears. Unlike initial auto-detection, this is an explicit save operation. Blame: `0aa8e7db`.
- **Action:** flagged for follow-up; phase A. Test throwing save, feedback, and selection rollback.

### C04 — Failed dialog loads silently stop restore/delete actions 🔒

- **Rule #:** 2, 7
- **File:** `f:\AI\repos\BlinkBudget\src\components\BackupRestoreSection.js`; `f:\AI\repos\BlinkBudget\src\components\AccountSection.js`; `f:\AI\repos\BlinkBudget\src\components\CustomCategoryManager.js`
- **Line(s):** 147–149; 718–720; 833–835
- **Severity:** 🔴 High; security-sensitive replacement/deletion UI
- **Snippet:** `.catch(error => { console.error('Error loading ConfirmDialog:', error); })`
- **Verdict:** slop. Stops safely but without an explanation. Contrast account-add/edit fallback text and category-save toasts. Backup handler history inspected (`e5404f5d`).
- **Action:** flagged for author confirmation. Never bypass confirmation as a fallback.

### C05 — Chart construction failures bypass caller error UI

- **Rule #:** 2, 7
- **File:** `f:\AI\repos\BlinkBudget\src\components\ChartRenderer.js`; `f:\AI\repos\BlinkBudget\src\components\InflationTrends.js`
- **Line(s):** 130–133, 211–214, 322–325; 166–187
- **Severity:** 🔴 High
- **Snippet:** `console.error('Failed to create chart:', error.message); return null;`
- **Verdict:** slop. Loading errors reject; construction errors fulfill null. InflationTrends' error UI handles rejection, not null. An isolated Node reproduction using the actual class body and a throwing ChartJS constructor printed `CHART FAILURE fulfilled: null`. Not a real-canvas browser test.
- **Action:** flagged for follow-up; phase A. Choose one failure contract and check every caller.

### C06 — Recovery depends on another unguarded import 🔒

- **Rule #:** 2, 7
- **File:** `f:\AI\repos\BlinkBudget\src\components\AccountDeletionSection.js`; `f:\AI\repos\BlinkBudget\src\components\DataManagementSection.js`
- **Line(s):** 196–219; 188–200, 258–270, 327–339, 401–413, 485–497
- **Severity:** 🟡 Medium; security-sensitive deletion/recovery UI
- **Snippet:** catch executes `await import('./MobileModal.js')` before reporting failure.
- **Verdict:** slop. A second import failure replaces the original error. AccountDeletionSection resets its button after that import, so it can stay disabled; DataManagementSection correctly uses finally for resetting. Conditional failure-path analysis, not a demonstrated offline chunk failure.
- **Action:** flagged for author confirmation; preserve deletion/recovery semantics.

## Rule 3 — Defensive code

### C07 — Fallbacks for guaranteed imported design tokens

- **Rule #:** 3, 5
- **File:** `f:\AI\repos\BlinkBudget\src\components\ProgressiveEmptyState.js`
- **Line(s):** 78–92
- **Severity:** ⚪ Low
- **Snippet:** `SPACING?.MD || '16px'`; `COLORS?.PRIMARY || '#3b82f6'`.
- **Verdict:** slop. All referenced properties exist now; static ESM import failure cannot be recovered by optional chaining. The dead MD fallback also disagrees with the actual 12px token. Blame inspected (`657adc84`, `7d5f6ffc`); existing component tests pass.
- **Action:** flagged for follow-up; phase B. Use direct tokens; do not infer that every optional property guard is dead.

## Rule 4 — Unused code candidates

### C08 — Exported APIs with no application callers

- **File:** `f:\AI\repos\BlinkBudget\src\components\ExpandableSection.js`; `f:\AI\repos\BlinkBudget\src\components\ConfirmDialog.js`; `f:\AI\repos\BlinkBudget\src\components\ui\ActionCard.js`; `f:\AI\repos\BlinkBudget\src\components\ChartRenderer.js`
- **Line(s):** 210–218 (`createExpandableSection`); 161–245 (`PromptDialog`); 282–332 (`SavingsGoalCard`); 333–340, 415–419, 425 onward, 1059–1076 (`updateChart`, `resizeChart`, `addTouchOptimizations`, loading helpers)
- **Severity:** 🟡 Medium, downgraded from the guide's default High: unused APIs are not proven runtime defects
- **Snippet:** `export const createExpandableSection = ...`; `addTouchOptimizations(chartInstance)`.
- **Verdict:** possibly intentional — confirm with author. Whole-repo symbol searches found definitions, documentation, or mock-only references rather than application calls. `getActiveCharts` is deliberately excluded: integration tests exercise it. `MobileBackButton` has real tests and is also excluded from removal recommendations.
- **Action:** flagged for follow-up under User Review Required; possible future/public API intent remains unverified. The expandable factory also transforms arguments, so it is not a pure zero-logic alias.

### C09 — Two orphan component modules

- **File:** `f:\AI\repos\BlinkBudget\src\components\financial-planning\SectionContainer.js`; `f:\AI\repos\BlinkBudget\src\components\financial-planning\EmergencyFundCard.js`
- **Line(s):** 1–45; 1–81
- **Severity:** 🟡 Medium
- **Snippet:** `export const SectionContainer`; `export const EmergencyFundCard`.
- **Verdict:** possibly intentional — confirm with author. Filename/symbol searches show no production importer. Overview uses its local `createEmergencyFundCard`; its test mocks the unused module. SectionContainer is distinct from the active utility `createSectionContainer`. Dynamic imports under src use literal paths, with no computed component registry found; documentation/count references remain.
- **Action:** flagged for follow-up under User Review Required. If retirement is approved, quarantine before deletion and perform the guide's dedicated verification gate. No files moved or deleted.

### C10 — Privacy UI has no production importer 🔒

- **File:** `f:\AI\repos\BlinkBudget\src\components\PrivacyControls.js`
- **Line(s):** 128, 475–619
- **Severity:** 🟡 Medium; security-sensitive privacy/retention UI
- **Snippet:** `createPrivacyControls()` / `initializePrivacyControls(container)`.
- **Verdict:** possibly intentional — confirm with author. Both exported names occur only here; README advertises the UI, and recent cleanup migrated its styles. This is stronger evidence of a wiring/product decision than permission to delete it. Its initialization promise also has no rejection handler; local confirmation/notification implementations duplicate shared facilities and hardcode z-index 10000 (lines 10–125).
- **Action:** flagged for author confirmation. Decide whether to wire up, retain, or retire the module before addressing its secondary maintenance issues; no security guard removal proposed.

### C11 — Empty date-input listener and misleading fix comment

- **Rule #:** 4, 11
- **File:** `f:\AI\repos\BlinkBudget\src\components\DateInput.js`
- **Line(s):** 73–76
- **Severity:** ⚪ Low
- **Snippet:** `realDate.addEventListener('click', () => { /* Let native behavior handle click */ });`
- **Verdict:** possibly intentional — confirm with author. Callback contains no executable behavior and cannot explicitly open a picker. Blame traces to date-input bug fixes (`347bfea1`, `e6cd3f0f`), so browser-specific intent deserves confirmation rather than automatic deletion.
- **Action:** flagged for follow-up under User Review Required; check iOS/native picker behavior before removing.

## Rule 5 — Design-system drift

### C12 — Seven undefined JavaScript token references

- **File:** `f:\AI\repos\BlinkBudget\src\components\AccountSection.js`; `f:\AI\repos\BlinkBudget\src\components\CategoryCard.js`; `f:\AI\repos\BlinkBudget\src\components\AccountDeletionSection.js`; `f:\AI\repos\BlinkBudget\src\components\DateInput.js`; `f:\AI\repos\BlinkBudget\src\components\TransactionList.js`; `f:\AI\repos\BlinkBudget\src\components\TransactionListItem.js`
- **Line(s):** 373/689; 150; 242; 22; 89; 413
- **Severity:** 🟡 Medium (invalid styling, not established financial-data corruption)
- **Snippet:** `COLORS.TEXT_PRIMARY`, `COLORS.DANGER`, `FONT_SIZES.XS`.
- **Verdict:** slop. AST member checks against the actual constants confirm two absent color keys and one absent font-size key at seven sites. CSS token tests pass because these are JS object-member errors, not undeclared `var(...)` references. `FONT_SIZES.MD` and `--color-text` DO exist now; older audit claims must not be repeated.
- **Action:** flagged for follow-up; phase B, except the AccountDeletionSection presentation site is explicitly deferred for review with deletion UI. Add generic JS-token contract coverage, not just CSS-token scans.

### C13 — Raw values bypass existing dimensions, spacing, and layers

- **File:** `f:\AI\repos\BlinkBudget\src\components\BackupRestoreSection.js`; `f:\AI\repos\BlinkBudget\src\components\AccountSection.js`; `f:\AI\repos\BlinkBudget\src\components\PrivacyControls.js`
- **Line(s):** 43; 68/432; 17–24/64–72 (representative sites)
- **Severity:** ⚪ Low
- **Snippet:** `borderRadius: '8px'`; `max-width: 400px`; `zIndex: '10000'`.
- **Verdict:** slop for duplicate semantic values: shared radius/dimension/layer tokens exist. Scoped ESLint finds 71 warnings across components, but these are signals, not 71 confirmed bugs; it misses some Object.assign/config literals and flags harmless values such as 0px too. Canvas colors need resolved color strings, not direct CSS var substitutions.
- **Action:** flagged for follow-up; phase B for ordinary presentation. Privacy/deletion surfaces deferred to their review gate. Do not bulk-replace every numeric literal.

## Rule 6 — Redundant API indirection

### C14 — Duplicate expanded-state getters

- **File:** `f:\AI\repos\BlinkBudget\src\components\ExpandableSection.js`
- **Line(s):** 201, 206
- **Severity:** 🟡 Medium
- **Snippet:** `isExpanded: () => expanded` and `getExpandedState: () => expanded`.
- **Verdict:** possibly intentional — confirm with author. Both return exactly the same value, but tests explicitly exercise both APIs; neither may be called dead solely from application grep. Introduced together in `286672c1`.
- **Action:** flagged for follow-up under User Review Required; consolidation would be an API/test change.

## Rule 7 — Inconsistent failure reporting

C04–C06 already cover shared rule-2/rule-7 issues; they are not duplicated here.

### C15 — Install instructions use an unobserved promise

- **File:** `f:\AI\repos\BlinkBudget\src\components\GeneralSection.js`
- **Line(s):** 51–62
- **Severity:** 🟡 Medium
- **Snippet:** `import('./ConfirmDialog.js').then(({ PWAInstructionsDialog }) => ...)`.
- **Verdict:** slop. Neither awaited/returned nor caught: a rejected import leaves the install click with no feedback. Adjacent settings components at least log their failed imports.
- **Action:** flagged for follow-up; phase A. Report failure without claiming installation succeeded.

### C16 — Visible errors without consistent diagnostic logging

- **File:** `f:\AI\repos\BlinkBudget\src\components\AccountSection.js`; `f:\AI\repos\BlinkBudget\src\components\TransactionListItem.js`; `f:\AI\repos\BlinkBudget\src\components\BackupRestoreSection.js`
- **Line(s):** 258–262 versus 622–630; 111–114/146–149; 141–143
- **Severity:** ⚪ Low
- **Snippet:** `.catch(() => { errorText.textContent = ...; })`; `showErrorToast(...)` without logging.
- **Verdict:** slop only for diagnostic inconsistency. These are NOT empty catches: users receive errors and execution stops appropriately. The add-account outer catch already logs the original save failure; only its secondary import failure lacks diagnostics.
- **Action:** flagged for follow-up; phase B for add/copy/split diagnostics; backup-restore diagnostic changes deferred to C04 review.

## Rule 8 — Module-load side effects

No direct DOM/listener/timer side effects found at component module scope. The sole call/new variable initializer is `chartRenderer = new ChartRenderer()` at line 1124; its constructor only creates a Map and scalar state. PrivacyControls injects styles during factory execution, not import. Imported services may have their own initialization behavior, outside this direct component-scope conclusion.

## Rule 9 — Duplicated logic

### C17 — Account editing reuses creation-only defaults (fixed)

- **File:** `f:\AI\repos\BlinkBudget\src\components\AccountSection.js`
- **Line(s):** baseline 602–610; current 602–608
- **Severity:** 🔴 High
- **Snippet:** `{ ...account, name: ..., type: ..., balance: 0, createdAt: new Date().toISOString() }`.
- **Verdict:** slop. Editing overwrote existing balance/creation metadata. AccountService merges this payload over stored fields. Blame dates the overrides to `8c39b87e`. Existing tests only checked account display, not editing. This does not establish an effect on transaction-derived dashboard totals.
- **Action:** fixed in this session: removed only the two edit-time overrides; creation defaults unchanged. Added regression at `f:\AI\repos\BlinkBudget\tests\Account\account-section.test.js:176–219`. Before fix: 18 passed, one failed showing 125.5 → 0 and creation date replaced; after fix: all 19 passed. No ownership/auth/deletion checks changed.

### C18 — Three near-identical period navigation handlers

- **File:** `f:\AI\repos\BlinkBudget\src\components\TimePeriodSelector.js`
- **Line(s):** 599–699
- **Severity:** 🟡 Medium
- **Snippet:** validate → assign currentPeriod → set active button → hide range → update label → onChange.
- **Verdict:** slop. Month/quarter/year bodies differ mainly in button key and message. Blame shows month handler introduced in `bb795fa3`; sibling bodies retain the same structure. Their error message is inside the range container they just hid, so caught callback errors may not be visible.
- **Action:** flagged for follow-up; phase C. Extract a parameterized handler, keep errors outside hidden range controls, and test all three navigation types.

## Rule 10 — Exceptions as control flow

### C19 — Expected deletion-result failure converted into exception 🔒

- **File:** `f:\AI\repos\BlinkBudget\src\components\AccountDeletionSection.js`
- **Line(s):** 171–207
- **Severity:** 🟡 Medium (downgraded)
- **Snippet:** `else { throw new Error('Deletion failed: ...'); }` after checking success/requiresReauth.
- **Verdict:** possibly intentional — confirm with author. Failure is known before throwing, but catch centralizes feedback/reset for a destructive workflow. Not swallowed and not justification to weaken reauthentication.
- **Action:** flagged for author confirmation. Keep existing safeguards.

Ordinary JSON parsing, browser storage, chart constructors, and persistence catches are legitimate exceptional failure handling, not automatically rule-10 violations.

## Rule 11 — Stale descriptions

### C20 — Integrity details promised but only logged

- **File:** `f:\AI\repos\BlinkBudget\src\components\DataManagementSection.js`
- **Line(s):** 236–249
- **Severity:** 🟡 Medium
- **Snippet:** `buttonText: 'View Details'` plus `// Show detailed report in console for now`.
- **Verdict:** slop. MobileAlert's button dismisses the dialog; no details view opens. Comment accurately describes the workaround, but the user-facing promise is incomplete rather than a TODO already implemented.
- **Action:** flagged for follow-up; phase B, read-only diagnostic display/copy only. Data modification requires separate review.

### C21 — “Silently ignore” above warning log

- **File:** `f:\AI\repos\BlinkBudget\src\components\ExpandableSection.js`
- **Line(s):** 22–27
- **Severity:** ⚪ Low
- **Snippet:** `// Silently ignore localStorage read errors` followed by `console.warn(...)`.
- **Verdict:** slop only in wording. Runtime fallback is useful and must remain.
- **Action:** flagged for follow-up; cosmetic phase.

## Rule 14 — File-size convention

### C22 — Eight files exceed 500 physical lines

- **File:** `f:\AI\repos\BlinkBudget\src\components\`
- **Line(s):** entire modules listed below
- **Severity:** 🟡 Medium
- **Snippet:** physical line-count inventory (blank lines included).
- **Verdict:** slop against size convention; size alone is not evidence of a runtime bug.
- **Action:** flagged for follow-up; separate structural phase, not bundled into behavior fixes. PrivacyControls deferred pending C10 review.

| File (under the absolute directory above) |      Baseline lines |
| ----------------------------------------- | ------------------: |
| AccountSection.js                         | 741 (739 after fix) |
| ChartRenderer.js                          |                1124 |
| CustomCategoryManager.js                  |                 912 |
| DataManagementSection.js                  |                 515 |
| MobileModal.js                            |                 552 |
| PrivacyControls.js                        |                 619 |
| TimePeriodSelector.js                     |                1107 |
| TransactionListItem.js                    |                 532 |

Initial PowerShell Measure-Object counts omitted empty lines; this table uses physical counts instead.

## False positives / retained behavior

- **Rule 2:** ExpandableSection 17–28/144–153 logs storage failures while retaining a working UI. DateFormatSection 57–65 deliberately retains detected format on initial persistence failure, unlike C03.
- **Rule 3:** TransactionForm has one delayed initial focus (390), not the guide's obsolete triple-focus example; other focus calls respond to different interactions.
- **Rule 3:** ChartRenderer focusSegment checks bounds and stops announcements after update failures (838–866); legitimate lifecycle/accessibility behavior.
- **Rule 6:** Button.createButton 153–158 adapts legacy argument shapes; modal wrappers adapt presentation/promises. Not zero-logic aliases just because they call another component.
- **Rules 4/6:** MobileBackButton/getActiveCharts have tests; duplicate expanded getters are review-gated in C14. No automated API deletions.
- **Rule 5:** FONT_SIZES.MD and CSS --color-text exist now. CSS-token tests pass. Canvas colors need resolved values, not indiscriminate CSS var substitution.
- **Rule 8:** Map-only ChartRenderer singleton is not an import-time DOM effect.
- **Rule 10:** EmergencyFundCard's invalid-assessment throw enforces its input contract, rather than expected-path catch logic. Its orphan status is separately review-gated in C09.

## Traceable follow-up plan

Proposal only, not authorization for further edits. References C01–C22 resolve to the exact file/line entries above; grouped entries explicitly defer restricted sites.

- **Completed:** C17 (two-line fix plus regression).
- **Phase A — visible failures:** C02, C03, C05, C15. Add failing-path tests first.
- **Phase B — tokens/diagnostics:** C07, C12 ordinary UI, C13 ordinary presentation, C16 add/copy/split diagnostics, C20 read-only diagnostic copy.
- **Phase C — reuse/structure:** C18 and C22 ordinary modules, separate from behavior fixes. C22 PrivacyControls deferred to C10.
- **Cosmetic phase:** C01, C21.
- **User Review Required:** C04, C06, C08, C09, C10, C11, C14, C19. Also defer C12 AccountDeletionSection styling, C13 privacy/deletion presentation, C16 backup logging, and C22 PrivacyControls splitting to corresponding review decisions. No whole-file deletion, data wipe, migration, or auth/ownership/destructive-flow change scheduled automatically.

For each future phase: targeted tests covering every touched file, lint, format, and production build. Concrete UI QA: simulate failed date-format save and confirm rollback/error text; simulate chart construction failure and confirm visible fallback; navigate month/quarter/year and check labels/errors; click integrity details and check its actual behavior. For C17, edit an account with nonzero balance and old createdAt, save, and check preservation after reload. Browser/storage QA remains unperformed; regression checks component-to-service payload with mocked service.

## Verification performed

- Baseline: 104 tests passed across 14 targeted files.
- New account regression: failed before fix (18 passed / one failed), then passed after fix (19/19), including a separate verbose rerun confirming the exact regression.
- After fix: 105 tests passed across the same 14 files using component, account-section, transaction-form, and chart-integration targets.
- Design-token suite: 12/12 passed, including production CSS-purge build. Seven JS-token references in C12 remain outside its present coverage.
- Scoped ESLint over components and the edited test: zero errors, 71 existing warnings.
- Prettier check over edited JavaScript/test: passed.
- Production build: passed, including PWA generation.
- Canvas integration limitation: jsdom reports no canvas context; the chart cleanup test returns early. Green tests do not establish real-canvas rendering/cleanup correctness.
- No full test suite or manual browser run performed. No commit created.
