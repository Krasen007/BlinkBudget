# AI Slop Inspection Guide

How to audit BlinkBudget source files for the lazy patterns AI coding tools leave behind.
Use this before and after any AI-assisted session that touches `src/`.

See [ai-slop-report.md](ai-slop-report.md) for the initial audit results (September 2026).

---

## Quick triage: if you only have time for three

Run these first — they're the ones most likely to hide an actual bug rather than just look untidy:

1. **Swallowed errors** (#2)
2. **Dead / overly defensive guards** (#3)
3. **Try/catch as control flow** (#10)

Everything else is worth doing but is lower stakes if a session runs short.

## Severity legend

- 🔴 **High** — can hide a real bug or cause silent failure in production
- 🟡 **Medium** — hurts maintainability, causes drift between files, or wastes reviewer time
- ⚪ **Low** — cosmetic; harmless but worth cleaning up

Independent of severity, a finding can also carry:

- 🔒 **Security-sensitive** — touches authentication, authorization, ownership, or data deletion. A "no other caller reaches this" grep result is never sufficient grounds to remove one of these — see the carve-out under rule #3, the false-positive checklist, and the implementation-plan gate near the end of this guide. A 🔒 finding is never auto-remediated in the same pass it was discovered in.

---

## What to look for

### 1. Trivial / narrative comments ⚪ Low
Comments that restate what the adjacent code already says.

**Signals:**
- Comment is the method name rephrased: `// Navigate to a new route` above `navigate()`
- Numbered section scaffolding: `// 1. Form setup`, `// 2. Account Selection`
- Comment restates a condition: `// Check if it's a full ISO timestamp` above `if (selectedDate.includes('T'))`
- Comment describes a createElement call: `// Create checkmark circle`
- "Can be removed in production" — it never was

**Check:** read each comment; if removing it loses zero information, it's slop.

---

### 2. Swallowed errors 🔴 High

**Signals:**
- `.catch(() => {})` — completely empty catch
- `catch { // ignore }` — intentional silence without logging
- `catch (e) { console.error(e) }` with no re-throw, no fallback, no user signal
- Missing `return` after an error path — execution falls through to the success path

**Check every `catch` block:**
1. Does it log the error? (minimum bar)
2. Does the user get any feedback?
3. Does execution stop, or does it fall through?

**In this codebase:** search `catch` in `src/views/` and `src/core/` first — those hold the most user-visible flows.

---

### 3. Overly defensive / dead guards 🔴 High

**Signals:**
- Null check on a value that was just validated two lines above
- `if (x && typeof x === 'string')` on a value that can only ever be a string or absent
- `else` branches after a condition that the outer context already guarantees cannot be false
- Multiple `setTimeout` calls with escalating delays for the same operation

**Check:** trace the data from where it enters the function. If a guard can never fire given the outer constraints, it is dead defensive code.

**In this codebase:** `submission.js` `preserveTimeFromExistingTimestamp` and `TransactionForm.js` triple-focus are the reference examples.

⚠️ Before flagging, see [Before you flag it](#before-you-flag-it-false-positive-checklist) — a guard that looks dead can be protecting against a caller that doesn't exist *yet*.

🔒 **Security carve-out:** if the guard concerns authentication, authorization, ownership, or access control, do not recommend removal on caller-analysis grounds alone. "No code path reaches this branch today" is not the same as "this branch can never matter" — these checks are frequently the last line of defense if an upstream filter changes, gets refactored, or gets bypassed elsewhere. Always downgrade to "flag for author confirmation," regardless of how dead the guard looks from a grep.

---

### 4. Dead / unreachable code 🔴 High

**Signals:**
- A function that is exported but never imported anywhere
- A method that is a zero-logic alias for another method (check with: grep for all callsites)
- `classList.remove('some-class')` where the class is never added
- `localStorage.removeItem(key)` immediately followed by `localStorage.setItem(key, ...)`
- A composite utility function that no caller uses

**Check procedure:**
1. Pick an exported function or method.
2. `grep -r "functionName" src/` to find all callsites.
3. If zero callsites outside the file itself, it is dead.

**In this codebase:** `getAllTransactions`, `validateTransactionForm`, `showSuccessCheckmark` are the reference examples.

> **Note:** `getAllTransactions` also appears in #6 as a zero-logic wrapper around `getAll`. These aren't contradictory — it's both unused *and* a passthrough — but if you're scanning quickly, don't mistake the repeat mention for a typo.

**Deleting a whole orphan file is a bigger claim than deleting one dead function — verify accordingly before it goes in a plan:**

1. Grep the **filename** across `*.js` (the standard procedure above).
2. Grep the file's **exported symbol names** (class/service names, not just the filename) across the *whole* repo, including non-`.js` files — `.html`, `.json`, `README`/`AGENTS.md`. A service can be referenced by name in a manifest or config without ever being imported by path.
3. Grep for **computed dynamic imports** — `import()` calls using a template literal or a variable instead of a string literal. A literal-filename grep misses a file loaded via a route-to-module map; check `router.js` and any lazy-loader-style registries specifically.
4. **Quarantine before you delete.** Move the file to a `_deprecated/` folder (or a scratch branch) instead of deleting it outright, then run the full test suite and the production build. If nothing breaks, delete for real in a follow-up commit. This costs one extra step and catches whatever steps 1–3 missed.

---

### 5. Hardcoded values that bypass the design system ⚪ Low

**Signals:**
- Raw hex colours: `#ef4444`, `rgba(0,0,0,0.15)` — should be `COLORS.*` or `var(--color-*)`
- Magic `z-index` numbers: `9999`, `10000` — should be a named constant
- Magic pixel values: `44px`, `8px`, `12px 16px` — should be `TOUCH_TARGETS.*`, `SPACING.*`, `var(--radius-md)`
- Fallback literals in `|| N` chains: `TIMING.NOTIFICATION_SUCCESS || 3000` — should resolve from constants only

**Check:** search for `px` in inline `.style.` assignments; check that anything numeric maps to a constant or CSS variable.

**In this codebase:** `COLORS`, `SPACING`, `TOUCH_TARGETS`, `FONT_SIZES`, `TIMING` in `src/utils/constants.js` are the design tokens. Any hardcoded value that duplicates one of these is slop.

---

### 6. Indirection with zero added logic 🟡 Medium

**Signals:**
- A function whose entire body is one call to another function
- A wrapper that only renames a function for "API consistency"
- A factory function with exactly one callsite that could be inlined

**Check:** count lines of logic (not counting JSDoc). If the body is a single expression and the wrapper adds no error handling, no transformation, and no caching, it is indirection for its own sake.

**In this codebase:** `removeToast → animateToastOut`, `removeToastById → removeToast`, `getAllTransactions → getAll` are the reference examples.

---

### 7. Inconsistent error-handling patterns 🟡 Medium

**Signals:**
- Two adjacent files solving the same problem differently (e.g. one uses try/catch, the other uses `.catch()` chain)
- One view `return`s after an error; another falls through
- Dynamic imports sometimes wrapped in try/catch, sometimes chained

**Check:** for any error pattern in a file you are editing, search for the same pattern in sibling files in the same directory. If they differ without reason, normalize them.

**In this codebase:** `AddView.js` vs `EditView.js` error handling is the reference example.

---

### 8. Side effects at module load time 🟡 Medium

**Signals:**
- A function that appends to `document.head` or `document.body` called at the top level of a module
- `addEventListener` or `setInterval` called outside any exported function
- A `<style>` tag injected in a `const` initializer

**Check:** look at the module scope (outside any function) of every file you audit. Nothing should touch the DOM or register listeners at import time unless it is `main.js` or a deliberate plugin.

**In this codebase:** `addSuccessStyles()` in `success-feedback.js` is the reference example (though it is called from `showSuccessCheckmark`, which is itself dead — so the side effect only fires if someone calls the dead export).

---

### 9. Duplicated logic instead of reuse 🟡 Medium

The mirror image of #6: instead of extending existing logic, the AI reimplements a slightly-modified copy of it elsewhere.

**Signals:**
- Two functions with near-identical bodies and only a constant or condition swapped
- A validation block that re-checks the same shape another function in the same file already checks
- Copy-pasted JSX/markup blocks that differ by one prop or class

**Check:** before treating a block as novel, grep for similar variable names or validation shapes elsewhere in the file's directory. If two blocks are >80% identical, they should probably be one function with a parameter.

---

### 10. Try/catch as control flow 🔴 High

Distinct from #2 (swallowed errors): here the exception isn't swallowed, it's being used to handle a state that should have been checked up front.

**Signals:**
- `try { const x = obj.a.b.c } catch { x = default }` instead of optional chaining / a guard
- Using a thrown error to signal "not found" instead of returning `null`/`undefined`
- A `catch` block that contains the actual expected-path logic, not error recovery

**Check:** for each `try` block, ask whether the condition triggering `catch` was knowable *before* the call. If yes, it should be an `if`, not an exception.

---

### 11. Stale or misleading placeholder comments 🟡 Medium

Different from #1 — these comments aren't just redundant, they're actively wrong.

**Signals:**
- `// TODO: add validation` sitting above code that already validates
- `// temporary fix` or `// hack for now` with no ticket reference and no sign it was ever revisited
- A comment describing behavior the code no longer has, left over from a previous edit pass

**Check:** for every TODO/FIXME/HACK comment, verify the described gap still exists. If the code already does what the comment says is missing, delete the comment — don't just leave it as "documentation."

---

### 12. Type-safety theater 🔴 High *(TypeScript files only — skip if the file is plain `.js`)*

**Signals:**
- `any` used to make a type error go away rather than modeling the real shape
- Non-null assertions (`!`) on values that can genuinely be null/undefined
- `@ts-ignore` / `@ts-expect-error` with no comment explaining why it's safe

**Check:** for each occurrence, ask whether the underlying type problem was fixed or just hidden from the compiler.

---

### 13. Framework-specific slop (React) 🟡 Medium *(applies to `.jsx`/component files — skip if not using React)*

**Signals:**
- `useEffect` used to derive state that could just be computed inline during render
- Missing or incorrect dependency arrays (stale closures, or effects that refire unnecessarily)
- `key={index}` on a list that can reorder or filter
- State duplicated in `useState` that's already derivable from props

**Check:** for every `useEffect`, ask if it's syncing with something external (DOM, subscription, network) — if not, it's probably slop. For every `.map()` with a `key`, confirm the key is a stable identifier, not an index.

---

### 14. File / module bloat 🟡 Medium *(project convention — thresholds come from `AGENTS.md` if present)*

Not a slop pattern by itself, but a strong correlate of it: files that outgrow what a reviewer can hold in their head tend to accumulate duplicated logic (#9), dead code (#4), and indirection (#6), simply because nobody re-reads the whole file before adding to it.

**Signals:**
- A file exceeds the project's own size convention (BlinkBudget's `AGENTS.md` sets a 500-line guideline — flag anything over)
- A file has visibly grown across several AI-assisted sessions without a matching refactor pass
- A single file mixes more than one clear responsibility (a view that also defines validation, formatting, and API calls inline)

**Check:** `wc -l` every file in the directory you're auditing; anything over the project's stated limit gets a note in the report even if no other numbered rule fires on it. Don't bundle a split-this-file refactor into an unrelated slop-cleanup change — call it out as its own follow-up.

---

## Before you flag it: false-positive checklist

Not everything that looks like slop is slop. Before writing something up in the report, check:

1. **Security- or ownership-related? Stop — don't run this checklist to decide whether to remove it.** See the 🔒 carve-out under rule #3. Flag for author confirmation and move on; no amount of grep confidence changes the answer.
2. **Confirm with grep, not memory.** "This looks unused" is a hypothesis, not a finding — actually run the search.
3. **Check git blame / PR context** for the surrounding lines. A guard added deliberately in a bug-fix commit is not the same as one an AI tool left behind reflexively.
4. **Check if it's covered by a test.** A "dead" branch that's exercised by a test suite is either not dead, or the test itself is stale — note which.
5. **Consider forward-looking code.** A guard or parameter that doesn't fire *yet* may be there for an in-progress feature or an upcoming caller — check open branches/PRs before deleting.
6. **When in doubt, downgrade rather than delete.** Flag it in the report as "possibly intentional — confirm with author" instead of silently removing it.
7. **Be suspicious of a clean sweep.** If a full audit produces zero findings marked "false positive" or "intentional," do one more pass looking specifically for reasons each item might be there on purpose before finalizing the report. A 100% slop hit rate across dozens of findings is itself a signal you're pattern-matching too fast rather than actually evaluating each one.

---

## What's automatable vs. what needs judgment

Some of this can be caught by tooling instead of a manual read every time:

| Rule | Automatable? | Tooling |
|---|---|---|
| #2 Swallowed errors | Partial | ESLint `no-empty`, custom rule for empty `.catch()` |
| #3 Dead/defensive guards | No | Requires tracing data flow — manual |
| #4 Dead/unreachable code | Yes | `knip`, `ts-prune`, or `eslint-plugin-unused-imports` for unused exports |
| #5 Hardcoded values | Yes | ESLint `no-magic-numbers`, a custom rule against raw hex/`px` in `.style.` |
| #6 Indirection | No | Judgment call on whether a wrapper "adds" anything |
| #7 Inconsistent patterns | No | Requires cross-file comparison — manual |
| #8 Load-time side effects | Partial | Custom lint rule flagging top-level DOM calls |
| #9 Duplicated logic | Partial | `jscpd` (copy-paste detector) flags candidates; still needs a human to confirm |
| #10 Try/catch as control flow | No | Manual — requires understanding intent |
| #11 Stale comments | No | Manual (an LLM pass diffing comment vs. code can help but isn't reliable enough to automate fully) |
| #12 Type-safety theater | Yes | ESLint `@typescript-eslint/no-explicit-any`, `no-non-null-assertion` |
| #13 React-specific | Partial | `eslint-plugin-react-hooks` catches dependency-array issues; `key={index}` needs manual review |

Wiring up the "Yes" rows as lint rules means future audits only need to manually cover #3, #6, #7, #9, #10, #11, and #13 — cutting the surface area roughly in half.

---

## `ai-slop-report.md` schema

To keep audits comparable across sessions, every finding in the report should follow this shape:

```
### [Rule #] — <short title>
- **File:** src/path/to/file.js
- **Line(s):** 42–48
- **Severity:** 🔴 High / 🟡 Medium / ⚪ Low
- **Snippet:** (short excerpt, not the whole function)
- **Verdict:** slop / false positive / intentional (confirmed with author)
- **Action:** fixed in this session / flagged for follow-up / left as-is (reason)
```

Group findings by rule number within the report so repeat offenders (e.g. every file that has the same #7 inconsistency) are easy to spot across sessions.

**One write-up per issue, not one per rule it matches.** If a single code block satisfies more than one rule — e.g. a `catch` that both swallows an error (#2) *and* uses the exception as control flow (#10) — write it up once with `**Rule #:** 2, 10` rather than duplicating the snippet under two headers. Otherwise the executive-summary counts overstate how many distinct problems exist.

**🔒 findings get a restricted Action field.** A security-sensitive finding's Action is always "flagged for author confirmation" or "left as-is (reason)" — never "fixed in this session." If you find yourself writing "fixed" next to a 🔒 tag, stop and re-route it through the [implementation-plan gate](#from-findings-to-implementation-plan) instead.

---

## Recommended audit procedure for a new file

1. **Read imports** — grep each import name in the file; flag any that are never used.
2. **Read every catch/try block** — apply rules #2 and #10.
3. **Read every comment** — apply rules #1 and #11. Delete trivial ones mentally; if more than ~30% of comments add no information (or are stale), flag the file.
4. **Search for hardcoded values** — `px`, `#`, `rgba`, `z-index`, plain number literals in style assignments (rule #5).
5. **Check exports** — for every exported name, grep for callsites outside the file (rule #4).
6. **Read every wrapper function** — if the body is one expression, check whether the wrapper adds anything (rule #6); check for near-duplicate blocks nearby (rule #9).
7. **Compare with sibling files** — open the closest related file and spot-check that the same pattern is used for the same problem (rule #7).
8. **If TypeScript or React is in play** — run rules #12 and #13.
9. **Before writing anything up** — run it through the [false-positive checklist](#before-you-flag-it-false-positive-checklist).
10. **Log findings** using the [report schema](#ai-slop-reportmd-schema) above.

---

## From findings to implementation plan

A report is a list of observations; a plan is a set of changes about to land in a working app. Some findings need a harder gate before they cross that line.

**Always call out as "User Review Required" — never bundled into a regular numbered phase:**
- Any 🔒 security-sensitive finding. Never schedule these for automatic deletion or modification — present the finding and let a human decide. ("The grep says it's unreachable" is not the same authorization as "a person looked at this and agreed.")
- Any destructive or irreversible operation — data wipes, whole-file deletions, migrations. Even at high confidence, the cost of asking is far lower than the cost of being wrong.
- Anything the false-positive checklist downgraded rather than confirmed.

**Traceability: every reported finding needs a destination.** Before finalizing a plan, cross-check it line by line against the full report. Each finding should land in exactly one bucket:
- Scheduled in a phase, with a file/line reference matching the report
- Explicitly deferred, with a one-line reason ("depends on X shipping first")
- Downgraded to false positive / intentional, with the reason noted

A finding that silently disappears between report and plan is the most common way a real issue — not just cosmetic slop — ends up unfixed. It's easy to schedule the dramatic findings in a file and quietly drop the smaller ones sitting right next to them.

**Verification plan, minimum bar:**
- Run the automated tests covering every file touched — not just the ones tied to the highest-severity fix.
- Run lint/format/build once per phase, not only at the very end, so a bad phase-1 change doesn't get buried under phase-2 and phase-3 diffs on top of it.
- For any UI-visible fix (error toasts, post-error navigation, focus behavior), write the manual QA step as a concrete user action ("click delete, confirm the undo toast appears and dismissing it does not re-delete") rather than "verify the flow works."

---

## Running a full audit against this repo (runbook)

Use this when kicking off a new audit round — including a re-check after a remediation pass has landed.

1. **Pick a scope.** A full `src/` sweep, a single phase's touched files, or just the directories a recent AI session modified. A post-remediation re-check only needs the files that actually changed, plus their sibling files (rule #7 needs a neighbor to compare against).
2. **Standardize the search tool.** The first audit round mixed PowerShell (`Select-String`, `Get-ChildItem`) with plain regex searches; if the team works across shells, prefer `ripgrep` (`rg`) so results are reproducible regardless of who runs the audit:
   - All catch blocks: `rg "catch\s*\{|\.catch\(" src/`
   - Callsites of a symbol (then re-run against the *whole repo*, not just `src/`, before calling it dead — rule #4): `rg "symbolName"`
   - Dynamic imports, to manually inspect for computed paths: `rg "import\(" src/`
   - Hardcoded design values: `rg "#[0-9a-fA-F]{3,6}|z-index:\s*[0-9]{3,}" src/`
   - File length against convention: `find src -name "*.js" | xargs wc -l | sort -rn`
3. **Work rule-by-rule across the scope, not file-by-file.** Sweeping for one rule (every `catch` block in scope) before moving to the next keeps the pattern fresh and surfaces cross-file inconsistencies (rule #7) that a single-file read-through misses.
4. **Apply the [false-positive checklist](#before-you-flag-it-false-positive-checklist) as you go**, not as a final pass over everything — checking git blame while the file is already open is cheaper than reopening thirty files at the end.
5. **Write the report** using the [schema](#ai-slop-reportmd-schema) above, grouped by rule number.
6. **Turn it into a plan** using the [gate above](#from-findings-to-implementation-plan) — phased by severity, 🔒 findings called out separately, every finding traced to a destination.
7. **After remediation lands, re-run steps 1–5 scoped to just the changed files** before closing out the round. This catches regressions the fix itself introduced (a `showErrorToast` swap-in missing an import) and confirms nothing was left half-migrated (a rule-#6 alias removed in one file but still called from another).
