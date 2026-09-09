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

⚠️ Before flagging, see [Before you flag it](#before-you-flag-it-false-positive-checklist) — a guard that looks dead can be protecting against a caller that doesn't exist _yet_.

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

> **Note:** `getAllTransactions` also appears in #6 as a zero-logic wrapper around `getAll`. These aren't contradictory — it's both unused _and_ a passthrough — but if you're scanning quickly, don't mistake the repeat mention for a typo.

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

**Check:** for each `try` block, ask whether the condition triggering `catch` was knowable _before_ the call. If yes, it should be an `if`, not an exception.

---

### 11. Stale or misleading placeholder comments 🟡 Medium

Different from #1 — these comments aren't just redundant, they're actively wrong.

**Signals:**

- `// TODO: add validation` sitting above code that already validates
- `// temporary fix` or `// hack for now` with no ticket reference and no sign it was ever revisited
- A comment describing behavior the code no longer has, left over from a previous edit pass

**Check:** for every TODO/FIXME/HACK comment, verify the described gap still exists. If the code already does what the comment says is missing, delete the comment — don't just leave it as "documentation."

---

### 12. Type-safety theater 🔴 High _(TypeScript files only — skip if the file is plain `.js`)_

**Signals:**

- `any` used to make a type error go away rather than modeling the real shape
- Non-null assertions (`!`) on values that can genuinely be null/undefined
- `@ts-ignore` / `@ts-expect-error` with no comment explaining why it's safe

**Check:** for each occurrence, ask whether the underlying type problem was fixed or just hidden from the compiler.

---

### 13. Framework-specific slop (React) 🟡 Medium _(applies to `.jsx`/component files — skip if not using React)_

**Signals:**

- `useEffect` used to derive state that could just be computed inline during render
- Missing or incorrect dependency arrays (stale closures, or effects that refire unnecessarily)
- `key={index}` on a list that can reorder or filter
- State duplicated in `useState` that's already derivable from props

**Check:** for every `useEffect`, ask if it's syncing with something external (DOM, subscription, network) — if not, it's probably slop. For every `.map()` with a `key`, confirm the key is a stable identifier, not an index.

---

## Before you flag it: false-positive checklist

Not everything that looks like slop is slop. Before writing something up in the report, check:

1. **Confirm with grep, not memory.** "This looks unused" is a hypothesis, not a finding — actually run the search.
2. **Check git blame / PR context** for the surrounding lines. A guard added deliberately in a bug-fix commit is not the same as one an AI tool left behind reflexively.
3. **Check if it's covered by a test.** A "dead" branch that's exercised by a test suite is either not dead, or the test itself is stale — note which.
4. **Consider forward-looking code.** A guard or parameter that doesn't fire _yet_ may be there for an in-progress feature or an upcoming caller — check open branches/PRs before deleting.
5. **When in doubt, downgrade rather than delete.** Flag it in the report as "possibly intentional — confirm with author" instead of silently removing it.

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
