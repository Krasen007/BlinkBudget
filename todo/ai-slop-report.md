# Components audit — 2026-09-16

**Baseline:** `37d1399`. Scope: `f:\AI\repos\BlinkBudget\src\components\`, recursively: 42 JavaScript files, 12,327 physical lines before the two-line fix below. Earlier audit history is preserved.

**Method:** rule-by-rule regex/AST sweeps, all 37 catch clauses plus five promise catches, named-export references across the repository, module initializers, comment inventory, token-member validation, sibling comparison, and focused source/test/blame inspection. Mechanical coverage includes every component; deeper manual reads/history checks concentrate on reported candidates, not an exhaustive semantic proof of every line. No TypeScript/React: rules 12/13 do not apply. No TODO/FIXME/HACK markers found. Local/remote-tracking branches were listed; live PRs and unpublished plans were not checked. Unused APIs are candidates, not deletion authorization.

**Summary (original audit):** error-feedback gaps, unused APIs, undefined tokens, duplicated UI logic, stale comments, and eight oversized modules. One account-edit field overwrite was reproduced and fixed with a red/green regression test. No security-sensitive findings were remediated during that audit. The pre-existing deletion of `f:\AI\repos\BlinkBudget\todo\.~lock.codebase-line-count.csv#` was left untouched.

**Implementation update — 2026-09-17:** Phase A is complete. Phase B's approved scope is complete: C07, C12 (including the author-approved global XS token), ordinary C16 diagnostics, C20 read-only details/copy, and a scoped C13 radius replacement. C13 remains partially open for other raw values. Phase C's C18 navigation refactor is complete in the working tree; C22 file splitting remains deferred. Destructive-flow safeguards and the other author-review gates remain unchanged.

**Latest follow-up — 2026-09-17:** C14 getter consolidation, C09 orphan-component retirement, C10 unused privacy-UI retirement, and C19 returned-failure handling are implemented in the working tree. The user's C08 getter bullet overlaps C14; the actual C08 unused-export candidates remain untouched. C10 retirement includes removing its README advertising while preserving the underlying privacy service. C11 remains unchanged: history shows the empty listener was left after removing debugging logs, but no iOS/native-picker QA was available. Earlier status entries below are historical and do not supersede this update.

Line references and finding snippets describe the baseline, not the updated source. The C17-only -2 line shift no longer locates all sites after subsequent edits.

## Rule 1 — Narrative comments

### C01 — Elementary DOM operations narrated

- **File:** `f:\AI\repos\BlinkBudget\src\components\TimePeriodSelector.js`; `f:\AI\repos\BlinkBudget\src\components\DateInput.js`; `f:\AI\repos\BlinkBudget\src\components\DataManagementSection.js`
- **Line(s):** 601–624; 63–85; 217–224 (representative sites)
- **Severity:** ⚪ Low
- **Snippet:** `// Update state` above `currentPeriod = newPeriod`; `// Connect label to input`; `// Add spacing`.
- **Verdict:** slop. Retain comments explaining timezones, accessibility, and lifecycle constraints.
- **Action:** completed in the cosmetic phase (2026-09-17, uncommitted). Removed elementary DOM/state narration across all three listed files, retaining accessibility, date/timestamp, lifecycle, and recovery context. C11's native-picker listener and its comments remain unchanged. Executable-code equivalence against HEAD was verified for all four cosmetic-phase components.

## Rule 2 — Silent failures

### C02 — Account-list rendering errors leave a blank/partial list

- **File:** `f:\AI\repos\BlinkBudget\src\components\AccountSection.js`
- **Line(s):** 328–335, 730–732 (current 728–730)
- **Severity:** 🔴 High
- **Snippet:** `catch (error) { console.error('Error loading accounts:', error); }`
- **Verdict:** slop. The list is cleared before rendering; callers cannot distinguish failed rendering from completion. Save handlers subsequently close their dialogs. No inline error, retry, or propagation.
- **Action:** completed in Phase A (`fc0165c`). Render failures replace blank/partial content with an inline `role="alert"` message and Retry button. Rendering returns a success/failure boolean; retry only reloads the list and never repeats a successful write. Regression coverage: initial failure, partial-render recovery, and successful save followed by failed refresh in `f:\AI\repos\BlinkBudget\tests\Account\account-section-errors.test.js`.

### C03 — Failed date-format save looks saved

- **File:** `f:\AI\repos\BlinkBudget\src\components\DateFormatSection.js`
- **Line(s):** 148–161
- **Severity:** 🔴 High
- **Snippet:** `SettingsService.saveSetting('dateFormat', newFormat)` followed by console-only catch.
- **Verdict:** slop. SettingsView enables manual selection. Storage writes can throw; selection is not reverted and no user feedback appears. Unlike initial auto-detection, this is an explicit save operation. Blame: `0aa8e7db`.
- **Action:** completed in Phase A (`8449709`). Failed manual saves revert the select to the last successfully saved format and show an error toast; failed saves do not dispatch a date-format change event. Initial auto-detection behavior is unchanged. Regression: `f:\AI\repos\BlinkBudget\tests\components\date-format-section.test.js`.

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
- **Action:** completed in Phase A (`181b9ff`). Adopted the author-selected rejection contract: pie/bar/line construction errors log and rethrow instead of fulfilling null. Callers were checked; NetBalanceChart and Top Movers now have visible fallbacks, and InflationTrends' existing rejection UI is exercised with a throwing constructor. Tests: `f:\AI\repos\BlinkBudget\tests\components\chart-renderer-contract.test.js`, `f:\AI\repos\BlinkBudget\tests\components\chart-construction-fallback.test.js`, and `f:\AI\repos\BlinkBudget\tests\components\inflation-trends-construction-failure.test.js`. Mocked-constructor coverage is not real-canvas browser QA.

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
- **Action:** completed in Phase B (`8449709`). Guaranteed imported spacing, font, and color tokens are accessed directly; optional guards for genuine input variability remain. Existing coverage: `f:\AI\repos\BlinkBudget\tests\components\ProgressiveEmptyState.test.js`.

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
- **Action:** retired in the author-requested follow-up (2026-09-17, uncommitted). Both modules were moved outside the repository to a temporary quarantine before verification. Removed the obsolete EmergencyFundCard mock and added coverage of Overview's active local emergency-fund renderer; Overview tests passed 2/2. Whole-repo reference checks found no production importers; production build passed with the modules absent. The active `createSectionContainer` utility and Overview renderer remain unchanged.

### C10 — Privacy UI has no production importer 🔒

- **File:** `f:\AI\repos\BlinkBudget\src\components\PrivacyControls.js`
- **Line(s):** 128, 475–619
- **Severity:** 🟡 Medium; security-sensitive privacy/retention UI
- **Snippet:** `createPrivacyControls()` / `initializePrivacyControls(container)`.
- **Verdict:** possibly intentional — confirm with author. Both exported names occur only here; README advertises the UI, and recent cleanup migrated its styles. This is stronger evidence of a wiring/product decision than permission to delete it. Its initialization promise also has no rejection handler; local confirmation/notification implementations duplicate shared facilities and hardcode z-index 10000 (lines 10–125).
- **Action:** author explicitly selected retirement of the unused UI and its advertised documentation while preserving the privacy service. Removed the module from the repository into temporary quarantine and removed the two README feature claims referencing it (2026-09-17, uncommitted). No production imports remain; build passed with it absent. `f:\AI\repos\BlinkBudget\src\core\privacy-service.js` is unchanged. No retention cleanup, settings reset, consent migration, or user-data deletion was performed. Module-specific C13/C22 work is superseded by retirement; no privacy-UI runtime tests or browser QA were available.

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
- **Action:** completed in Phase B (`8449709`). Replaced missing color members with `COLORS.TEXT_MAIN` / `COLORS.ERROR` and defined `FONT_SIZES.XS = 'var(--font-size-xs)'`. The author explicitly approved the global XS presentation fix, including AccountDeletionSection help text and an additional reference in `f:\AI\repos\BlinkBudget\src\views\LoginView.js` outside the original component scope. No deletion/auth behavior changed. Generic JavaScript-token contract coverage added at `f:\AI\repos\BlinkBudget\tests\system\javascript-design-tokens.test.js`.

### C13 — Raw values bypass existing dimensions, spacing, and layers

- **File:** `f:\AI\repos\BlinkBudget\src\components\BackupRestoreSection.js`; `f:\AI\repos\BlinkBudget\src\components\AccountSection.js`; `f:\AI\repos\BlinkBudget\src\components\PrivacyControls.js`
- **Line(s):** 43; 68/432; 17–24/64–72 (representative sites)
- **Severity:** ⚪ Low
- **Snippet:** `borderRadius: '8px'`; `max-width: 400px`; `zIndex: '10000'`.
- **Verdict:** slop for duplicate semantic values: shared radius/dimension/layer tokens exist. Scoped ESLint finds 71 warnings across components, but these are signals, not 71 confirmed bugs; it misses some Object.assign/config literals and flags harmless values such as 0px too. Canvas colors need resolved color strings, not direct CSS var substitutions.
- **Action:** partially completed in Phase B (`8449709`): BackupRestoreSection metadata radius now uses `var(--radius-md)` instead of `8px`. This scoped presentation change does not resolve all raw-value sites: account-dialog dimensions and other ordinary presentation cleanup remain open; privacy/deletion presentation remains review-gated. No blanket numeric replacement or canvas-color substitution was performed.

## Rule 6 — Redundant API indirection

### C14 — Duplicate expanded-state getters

- **File:** `f:\AI\repos\BlinkBudget\src\components\ExpandableSection.js`
- **Line(s):** 201, 206
- **Severity:** 🟡 Medium
- **Snippet:** `isExpanded: () => expanded` and `getExpandedState: () => expanded`.
- **Verdict:** possibly intentional — confirm with author. Both return exactly the same value, but tests explicitly exercise both APIs; neither may be called dead solely from application grep. Introduced together in `286672c1`.
- **Action:** completed in the 2026-09-17 getter-consolidation follow-up (uncommitted). Retained `isExpanded` and removed `getExpandedState`; the contract test now verifies the removed alias is absent and `isExpanded` tracks collapse/expand. No production callers were found. Storage fallback, persistence, keyboard handling, and the argument-adapting factory are unchanged. Targeted tests passed 17/17 twice (including a verbose rerun, exit 0); scoped ESLint passed with four existing style warnings, Prettier and diff checks passed, and production build including PWA generation passed. No browser QA or full-suite run was performed. Repository-wide `yarn run check` failed at ESLint with two pre-existing `AlertDialog` no-undef errors in untouched `f:\AI\repos\BlinkBudget\src\components\AccountSection.js:719` and `f:\AI\repos\BlinkBudget\src\components\BackupRestoreSection.js:149` (107 warnings); subsequent check stages did not run.

## Rule 7 — Inconsistent failure reporting

C04–C06 already cover shared rule-2/rule-7 issues; they are not duplicated here.

### C15 — Install instructions use an unobserved promise

- **File:** `f:\AI\repos\BlinkBudget\src\components\GeneralSection.js`
- **Line(s):** 51–62
- **Severity:** 🟡 Medium
- **Snippet:** `import('./ConfirmDialog.js').then(({ PWAInstructionsDialog }) => ...)`.
- **Verdict:** slop. Neither awaited/returned nor caught: a rejected import leaves the install click with no feedback. Adjacent settings components at least log their failed imports.
- **Action:** completed in Phase A (`8449709`). Failed instructions imports and dialog construction now log diagnostics and show an error toast without claiming installation succeeded. Tests: `f:\AI\repos\BlinkBudget\tests\components\general-section.test.js` and `f:\AI\repos\BlinkBudget\tests\components\general-section-import-failure.test.js`; the latter rejects the module factory during dynamic import.

### C16 — Visible errors without consistent diagnostic logging

- **File:** `f:\AI\repos\BlinkBudget\src\components\AccountSection.js`; `f:\AI\repos\BlinkBudget\src\components\TransactionListItem.js`; `f:\AI\repos\BlinkBudget\src\components\BackupRestoreSection.js`
- **Line(s):** 258–262 versus 622–630; 111–114/146–149; 141–143
- **Severity:** ⚪ Low
- **Snippet:** `.catch(() => { errorText.textContent = ...; })`; `showErrorToast(...)` without logging.
- **Verdict:** slop only for diagnostic inconsistency. These are NOT empty catches: users receive errors and execution stops appropriately. The add-account outer catch already logs the original save failure; only its secondary import failure lacks diagnostics.
- **Action:** ordinary add/copy/split diagnostics completed in Phase B (`8449709`). Added logging for the secondary account-error-dialog import failure and thrown transaction copy/split errors, preserving existing user feedback. Backup-restore diagnostic changes remain deferred to C04 review; C16 is not closed for that restricted site.

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
- **Action:** completed in Phase C in the working tree (not yet committed). One parameterized `handleNavigation` serves all six month/quarter/year arrow call sites. Errors use a sibling `role="alert"` element outside the hidden custom-range panel, and activating a period clears stale errors. Date calculations, offsets, and the navigation callback flag are unchanged. Six regression cases in `f:\AI\repos\BlinkBudget\tests\components\time-period-selector.test.js` cover navigation plus callback-failure visibility and recovery across all three period types. No file splitting was performed.

## Rule 10 — Exceptions as control flow

### C19 — Expected deletion-result failure converted into exception 🔒

- **File:** `f:\AI\repos\BlinkBudget\src\components\AccountDeletionSection.js`
- **Line(s):** 171–207
- **Severity:** 🟡 Medium (downgraded)
- **Snippet:** `else { throw new Error('Deletion failed: ...'); }` after checking success/requiresReauth.
- **Verdict:** possibly intentional — confirm with author. Failure is known before throwing, but catch centralizes feedback/reset for a destructive workflow. Not swallowed and not justification to weaken reauthentication.
- **Action:** implemented after the author's follow-up request (2026-09-17, uncommitted). Returned ordinary failures log a message and call shared failure feedback/reset directly; genuine exceptions still use catch with the original error diagnostic. Success, cancellation, reauthentication/logout, redirects, and all service-side safeguards are unchanged. Six mocked-service regressions at `f:\AI\repos\BlinkBudget\tests\components\account-deletion-section.test.js` pass. Tests isolate the installed final-confirmation handler from ButtonComponent's separate summary listener; they are not end-to-end click-flow QA. C06's secondary error-dialog import failure remains unresolved and unchanged.

Ordinary JSON parsing, browser storage, chart constructors, and persistence catches are legitimate exceptional failure handling, not automatically rule-10 violations.

## Rule 11 — Stale descriptions

### C20 — Integrity details promised but only logged

- **File:** `f:\AI\repos\BlinkBudget\src\components\DataManagementSection.js`
- **Line(s):** 236–249
- **Severity:** 🟡 Medium
- **Snippet:** `buttonText: 'View Details'` plus `// Show detailed report in console for now`.
- **Verdict:** slop. MobileAlert's button dismisses the dialog; no details view opens. Comment accurately describes the workaround, but the user-facing promise is incomplete rather than a TODO already implemented.
- **Action:** completed in Phase B (`8449709`). View Details now inserts and focuses a local, read-only `IntegrityReport` with summary, issues, and recommendations rendered through `textContent`. Copy Report requires an explicit click, warns about personal financial information, and provides visible clipboard-failure feedback. No data repair or recovery behavior changed. Implementation: `f:\AI\repos\BlinkBudget\src\components\IntegrityReport.js`; tests: `f:\AI\repos\BlinkBudget\tests\components\integrity-report.test.js`.

### C21 — “Silently ignore” above warning log

- **File:** `f:\AI\repos\BlinkBudget\src\components\ExpandableSection.js`
- **Line(s):** 22–27
- **Severity:** ⚪ Low
- **Snippet:** `// Silently ignore localStorage read errors` followed by `console.warn(...)`.
- **Verdict:** slop only in wording. Runtime fallback is useful and must remain.
- **Action:** completed in the cosmetic phase (2026-09-17, uncommitted). The comment now explains retaining the default expanded state when storage is unavailable; the warning log and runtime fallback are unchanged.

## Rule 14 — File-size convention

### C22 — Eight files exceed 500 physical lines

- **File:** `f:\AI\repos\BlinkBudget\src\components\`
- **Line(s):** entire modules listed below
- **Severity:** 🟡 Medium
- **Snippet:** physical line-count inventory (blank lines included).
- **Verdict:** slop against size convention; size alone is not evidence of a runtime bug.
- **Action:** deferred. Phase C implemented C18 only; none of the eight oversized modules has been split as part of this follow-up. Keep structural work separate from behavior fixes. PrivacyControls remains gated by C10. The table below is the historical baseline inventory, not current line counts.

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

Status as of 2026-09-17. References C01–C22 retain the original audit locations above. Remaining proposals are not authorization for further edits.

- **Original fix completed:** C17 (`c620e73`, two-line fix plus regression).
- **Phase A — complete:** C02 (`fc0165c`), C05 (`181b9ff`), C03 and C15 (`8449709`). Visible failure feedback and targeted regressions are implemented.
- **Phase B — approved scope complete (`8449709`):** C07 direct tokens; C12 missing-token fixes, including the author-approved global `FONT_SIZES.XS` definition affecting AccountDeletionSection help text and the additional LoginView reference; C16 add/copy/split diagnostics; C20 read-only details and explicit copy. C13 received a scoped radius replacement but remains open for other raw values; this is not completion of all presentation cleanup.
- **Phase C — partially complete:** C18 shared navigation handler and visible error/recovery feedback are implemented and tested in the working tree, not yet committed. C22 file splitting remains deferred, including PrivacyControls pending C10.
- **Cosmetic phase — complete (uncommitted):** C01 comment cleanup across TimePeriodSelector, DateInput, and DataManagementSection; C21 fallback-comment correction in ExpandableSection. Executable code is unchanged; all author-review gates below remain in place.
- **User Review Required — unchanged except C12 approval:** C04, C06, C08, C09, C10, C11, C14, C19; C13 privacy/deletion presentation, C16 backup logging, and C22 PrivacyControls splitting remain gated. The approved C12 font token is presentation-only; no confirmation, reauthentication, ownership, deletion, or recovery safeguards were changed. No whole-file deletion, data wipe, migration, or destructive-flow change is authorized by this status update.

For each future phase: targeted tests covering every touched file, lint, format, and production build. Concrete UI QA: simulate failed date-format save and confirm rollback/error text; simulate chart construction failure and confirm visible fallback; navigate month/quarter/year and check labels/errors; click integrity details and check its actual behavior. For C17, edit an account with nonzero balance and old createdAt, save, and check preservation after reload. Browser/storage QA remains unperformed; regression checks component-to-service payload with mocked service.

## Verification performed

### Original audit and C17 (historical)

The counts and warnings below describe the original audit, not a fresh run of the current tree.

- Baseline: 104 tests passed across 14 targeted files.
- New account regression: failed before fix (18 passed / one failed), then passed after fix (19/19), including a separate verbose rerun confirming the exact regression.
- After fix: 105 tests passed across the same 14 files using component, account-section, transaction-form, and chart-integration targets.
- Design-token suite: 12/12 passed, including production CSS-purge build. At that point, the seven JS-token references in C12 were outside its coverage; the Phase B update below supersedes that limitation.
- Scoped ESLint over components and the edited test: zero errors, 71 existing warnings.
- Prettier check over edited JavaScript/test: passed.
- Production build: passed, including PWA generation.
- Canvas integration limitation: jsdom reports no canvas context; the chart cleanup test returns early. Green tests do not establish real-canvas rendering/cleanup correctness.
- No full test suite or manual browser run was performed during the original audit; no commit was created in that audit session. C17 was subsequently committed as `c620e73`.

### Phase A/B implementation

- Implementation is committed in `fc0165c`, `181b9ff`, and `8449709`.
- C02/C03/C15 checkpoint: 25 tests passed across five targeted files, including the original account tests and new failure-path regressions. C02 account targets alone passed 22/22.
- Chart follow-up checkpoint: 46 targeted tests passed; repository `yarn run check` and production build including PWA generation passed after formatting the chart fallback test.
- Phase B adds JavaScript-token contract coverage as well as tests for read-only integrity details/copy and ordinary diagnostics. C12 is no longer only covered by CSS-token scans.
- These are implementation-session verification results, not a claim that the full suite or browser QA was run. Chart constructor failures are tested with mocks; real-canvas rendering/cleanup remains unverified.

### Phase C — C18

- `f:\AI\repos\BlinkBudget\tests\components\time-period-selector.test.js`: 6/6 tests passed, covering month/quarter/year navigation and visible callback-error feedback followed by successful recovery. The targeted suite was rerun while preparing this report and again passed 6/6.
- Scoped ESLint, Prettier, diff checks, and production build including PWA generation passed for the C18 implementation.
- Repository-wide `yarn run check` was blocked by formatting issues in five untouched files. Those files were left unchanged; the earlier Phase A/B check success must not be read as a clean current-tree check.
- C18 source and regression test remain uncommitted. C22 was not implemented. No manual browser/storage QA or full-suite run was performed.

### Cosmetic phase — C01/C21 (2026-09-17)

- Removed elementary DOM/state narration in the three C01 components and corrected C21 wording. This phase changes source comments/whitespace and this report only; no commit was created.
- All four edited components passed individual `node --check` syntax checks. Terser output with compression, mangling, and comments disabled was identical before/after against HEAD for each component, confirming executable-code equivalence.
- Targeted tests passed 31/31 across `f:\AI\repos\BlinkBudget\tests\components\time-period-selector.test.js` (6), `f:\AI\repos\BlinkBudget\tests\components\date-input.test.js` (7), `f:\AI\repos\BlinkBudget\tests\components\expandable-section.test.js` (17), and `f:\AI\repos\BlinkBudget\tests\components\integrity-report.test.js` (1, exercises DataManagementSection).
- The initial Yarn invocation failed during Vitest collection (undefined runner config/current suite; no tests executed). Running the same targets directly with Node and the installed Vitest CLI from the canonical `F:\AI\repos\BlinkBudget` path passed. No test/configuration changes were needed.
- Scoped ESLint passed with zero errors and four existing raw-style warnings in ExpandableSection. Source Prettier checks, diff checks, and production build including PWA generation passed.
- No full-suite run, repository-wide check, or manual browser/storage QA was performed for this comment-only phase. C11's native-picker listener and comments, storage fallback/logging, and all confirmation, reauthentication, ownership, deletion, and recovery behavior remain unchanged. C22 splitting remains deferred.
