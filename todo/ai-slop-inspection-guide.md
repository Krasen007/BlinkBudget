# AI Slop Inspection Guide

How to audit BlinkBudget source files for the lazy patterns AI coding tools leave behind.
Use this before and after any AI-assisted session that touches `src/`.

Save to [ai-slop-report.md](ai-slop-report.md) for the initial audit results.

---

## Quick triage: if you only have time for five

Run these first — they're the ones most likely to hide an actual bug rather than just look untidy:

1. **Swallowed errors**
2. **Dead / overly defensive guards**
3. **Try/catch as control flow**
4. **Async boundary bugs** (rule #15) — the highest-yield addition to this list
5. **Build-pipeline defects** (rule #16) — code that lints clean and ships broken

Everything else is worth doing but is lower stakes if a session runs short.

## Severity legend

- 🔴 **High** — can hide a real bug or cause silent failure in production
- 🟡 **Medium** — hurts maintainability, causes drift between files, or wastes reviewer time
- ⚪ **Low** — cosmetic; harmless but worth cleaning up

**Assign severity from the code you read, not from the report's framing.** Findings routinely
read more severe than they are. "The original error is lost" and "the user is never told what
went wrong" are both error-handling gaps, but only the first implies lost diagnosability — a
round that mis-ranks its own findings will either panic the author or hide the real one.
Rank by consequence: silent **data loss** > silent **feedback loss** > silent **console noise**.

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

⚠️ **A comment describing a past fix is evidence, not noise.** A line like `// Handle click to
show picker (fixes issues where appearance:none hides the trigger)` sitting above an _empty_
handler matches this rule's "restates the condition" signal exactly — and reading it is what
_proves_ the handler is dead, because the `appearance:none` approach it worked around was later
abandoned and the CSS now forces `appearance: auto`. Before deleting a comment that names a bug
or claims to fix one, check whether that fix is still in place. If the comment is the last
record of _why_ the code looks strange, it is archaeology: report it under #11 (stale), not #1
(trivial), because deleting it removes a pointer to where a regression would reappear.

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
4. **Can it run at all?** If the guarded expression is an un-awaited `async` call, the `catch` never
   fires — the error escapes as an unhandled rejection. This is the highest-value question in the
   list and it is easy to skip, because the code _looks_ handled. See [rule #15A](#15-async-boundary-bugs-high).

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

🔒 **Security carve-out:** if the guard concerns authentication, authorization, ownership, or access control, do not recommend removal on caller-analysis grounds alone. "No code path reaches this branch today" is not the same as "this branch can never matter" — these checks are frequently the last line of defense if an upstream filter changes, gets refactored, or gets bypassed elsewhere. Always downgrade to "flag for author confirmation," regardless of how dead the guard looks from a grep.

---

### 4. Dead / unreachable code 🔴 High

**Signals:**

- A function that is exported but never imported anywhere
- A method that is a zero-logic alias for another method (check with: grep for all callsites)
- `classList.remove('some-class')` where the class is never added
- `localStorage.removeItem(key)` immediately followed by `localStorage.setItem(key, ...)`
- A composite utility function that no caller uses
- **A `debounce`/`setTimeout`/listener wrapper whose body is empty apart from a comment** — check the
  body is actually empty before treating the wrapper as infrastructure. One real instance: a
  `debounce(() => { /* Shared title update etc */ }, TIMING.DEBOUNCE_RESIZE)` was registered as a
  `resize` listener, called once at init, and removed in `cleanup()` — four pieces of lifecycle
  plumbing, all of it invoking a function that could not do anything. The giveaway is the
  **scaffolding ratio**: real plumbing surrounding no real work.

**Check procedure:**

1. Pick an exported function or method.
2. `grep -r "functionName" src/` to find all callsites.
3. If zero callsites outside the file itself, it is dead.

⚠️ **"Grep found nothing" is a hypothesis about _text_, not about _behaviour_. Names are routinely
built at runtime, so the literal never appears in source and the code is very much alive.** This is
the single most dangerous step in rule #4, because the grep genuinely returns zero and that is easy
to mistake for proof. In this repo, `toast-${type}`, `btn-${opts.size}`, `skeleton-${sectionName}`
and `input-${type}` are all assembled by template literals at runtime — so `toast-success`,
`btn-small` and `skeleton-large` have **no literal reference anywhere**, and a naive dead-CSS
purge deletes the background colour behind every toast and the sizing behind every button variant.

**Before deleting anything a grep calls dead, answer three questions:**

1. **Is any name composed at runtime?** Search for interpolation, not the name:
   `rg -n '\$\{' src/` and look for it inside a class- or id-valued expression. Then enumerate the
   **actual value set** from the source of truth — `TOAST_TYPES`, `BUTTON_DEFAULTS` — rather than
   assuming. A prefix plus an unknown value set is _unbounded_; an enum is a closed set you can check.
2. **Does a third party create the node?** `.chartjs-tooltip` is emitted by Chart.js at runtime
   and appears nowhere in this repo. Check the library's own documented class names before calling
   a class unreferenced.
3. **Is the selector reachable at all?** For compound rules, check the _whole_ selector. A rule
   like `.a11y-widget button.active` is dead when `.a11y-widget` is never applied, even though
   `button` and `.active` are both live — the leading class gates the entire match. Same for
   `.live-parent .dead-child`: a live parent does not make the rule reachable.

The safe, durable form of this check is to **assert it in a test rather than trusting a one-off
grep** — see `tests/system/css-architecture.test.js`, which derives the runtime-constructed
prefixes from the JS and fails on any selector that is neither literally referenced nor
template-producible. That way the next person's purge hits the same wall you did.

⚠️ **Before writing up an orphan as "unreplaceable logic" or "lost knowledge", check whether an
equivalent implementation already exists elsewhere.** The rule above proves a function is
_uncalled_ — it says nothing about whether its job is done somewhere else, and "the detector was
written and never invoked" reads as a strong justification for keeping it. In this round a dead
`checkDataIntegrity()` in `ReportsView.js` was flagged 🔴 with the note that "the knowledge encoded
in it is currently lost." It was not lost: `data-integrity-service.js` implemented the same
orphaned-`accountId` detection, ran it across 7 checks, surfaced it behind a **🔍 Data Integrity
Check** button, and covered it with 5 test files. It was also **better** — it added a severity
field, iterated once instead of twice, and read through a different service layer. The orphan was a
duplicate, and the finding's central argument for keeping it was false.

The asymmetry is the lesson: "zero callers" is cheap to establish and easy to over-interpret, while
"an equivalent already exists" takes one extra grep. Spend the extra grep. Search by
**what the code does**, not by name — the two implementations here shared no identifiers:

```bash
rg -n "accountId" src/core/      # the concept, not the function name
rg -n "integrity" src/           # the domain
```

When the equivalent turns out to exist, the correct write-up is the reverse of the one you were
about to file: **a duplicate to delete, not unreplaceable logic to preserve.** Say so explicitly in
the report so the next session doesn't re-derive the same false justification.

**Deleting a whole orphan file is a bigger claim than deleting one dead function — verify accordingly before it goes in a plan:**

1. Grep the **filename** across `*.js` (the standard procedure above).
2. Grep the file's **exported symbol names** (class/service names, not just the filename) across the _whole_ repo, including non-`.js` files — `.html`, `.json`, `README`/`AGENTS.md`. A service can be referenced by name in a manifest or config without ever being imported by path.
3. Grep for **computed dynamic imports** — `import()` calls using a template literal or a variable instead of a string literal. A literal-filename grep misses a file loaded via a route-to-module map; check `router.js` and any lazy-loader-style registries specifically.
4. **Quarantine before you delete.** Move the file to a `_deprecated/` folder (or a scratch branch) instead of deleting it outright, then run the full test suite and the production build. If nothing breaks, delete for real in a follow-up commit. This costs one extra step and catches whatever steps 1–3 missed.
5. **Re-grep after the deletion — removals cascade, and the cascade is not local.** Deleting a function orphans its import; deleting its last consumer orphans whatever _that_ imported; and deleting that can orphan a CSS rule. One real chain from a single round: removing `PromptDialog` orphaned the `MobilePrompt` import → which revealed `MobilePrompt` itself had zero callers → removing it orphaned `.mobile-prompt-content` in `mobile.css`. Do not assume the cascade stopped at the call site you edited.

---

### 5. Hardcoded values that bypass the design system ⚪ Low

**Signals:**

- Raw hex colours: `#ef4444`, `rgba(0,0,0,0.15)` — should be `COLORS.*` or `var(--color-*)`
- Magic `z-index` numbers: `9999`, `10000` — should be a named constant
- Magic pixel values: `44px`, `8px`, `12px 16px` — should be `TOUCH_TARGETS.*`, `SPACING.*`, `var(--radius-md)`
- Fallback literals in `|| N` chains: `TIMING.NOTIFICATION_SUCCESS || 3000` — should resolve from constants only

**Check:** search for `px` in inline `.style.` assignments; check that anything numeric maps to a constant or CSS variable.

**In this codebase:** `COLORS`, `SPACING`, `TOUCH_TARGETS`, `FONT_SIZES`, `TIMING` in `src/utils/constants.js` are the design tokens. Any hardcoded value that duplicates one of these is slop.

Four refinements that this rule needs in practice:

**a) A `var(--token, fallback)` whose token does not exist is a hardcoded value in costume.**
This is the easiest miss in the whole rule, because the line _looks_ tokenised and greps clean.
`z-index: var(--z-index-modal, 1000)` was in `AccountSection.js` while `--z-index-modal` was
defined in **no CSS file at all** — the `1000` fallback always won. Any time you see a
`var(--x, <literal>)` fallback, grep the stylesheets for `--x:` before believing the site is
compliant. Report these separately from plain literals: the literal is load-bearing and the
author may well prefer to keep it (author declined this one, correctly — adding a z-index scale
is a design-system change with global stacking implications, not a cleanup).

**b) Convert only when an existing token has the _exact_ same value.** The signal above says
"duplicates one of these" — the operative test is stricter than "similar". `max-width: 500px`
had no matching token; "fixing" it would mean _inventing_ `--modal-max-width-lg`, which is design
work that does not belong in a slop pass. `max-width: 400px` did match `--modal-max-width`
(exactly 400px), so that one was a true cleanup. Report the no-match cases as _"no token exists"_,
separately from the convertible ones, and let the author decide whether a token should be designed.

**c) Not every raw value is slop — some are deliberate strategy.** `pwa.js` builds its
update-available dialog with a fallback on _every_ colour (`var(--color-surface, #1a1a1a)`)
because it can render before `tokens.css` is guaranteed to be applied. Swapping its
`max-width: 400px` for a bare `var(--modal-max-width)` would drop the declaration entirely when
the token is absent, and adding a fallback just re-creates the literal. Ask _why_ the raw value is
there before converting it.

**d) A `var(--token)` added in JS can be stripped by the production CSS purge.** The stylesheet
is purged against the build output, so a token referenced only from JavaScript can disappear from
the shipped CSS. This repo already guards it: `tests/system/design-tokens.test.js` contains
_"keeps every token used from JS alive through the production CSS purge"_. When you add a
`var(--token)` inside a `.style` assignment, run that suite and say in the commit that it covers
the purge — it turns "should be fine" into a verified claim.

---

### 6. Indirection with zero added logic 🟡 Medium

**Signals:**

- A function whose entire body is one call to another function
- A wrapper that only renames a function for "API consistency"
- A factory function with exactly one callsite that could be inlined

**Check:** count lines of logic (not counting JSDoc). If the body is a single expression and the wrapper adds no error handling, no transformation, and no caching, it is indirection for its own sake.

---

### 7. Inconsistent error-handling patterns 🟡 Medium

**Signals:**

- Two adjacent files solving the same problem differently (e.g. one uses try/catch, the other uses `.catch()` chain)
- One view `return`s after an error; another falls through
- Dynamic imports sometimes wrapped in try/catch, sometimes chained

**Check:** for any error pattern in a file you are editing, search for the same pattern in sibling files in the same directory. If they differ without reason, normalize them.

---

### 8. Side effects at module load time 🟡 Medium

**Signals:**

- A function that appends to `document.head` or `document.body` called at the top level of a module
- `addEventListener` or `setInterval` called outside any exported function
- A `<style>` tag injected in a `const` initializer

**Check:** look at the module scope (outside any function) of every file you audit. Nothing should touch the DOM or register listeners at import time unless it is `main.js` or a deliberate plugin.

**Standard remediation shape** (two real instances, both landed): strip the side effect, keep the
export, and move the trigger to an explicit init call in `main.js` _before_ the first read of the
global it publishes. Three details that matter:

1. **Wrap the init in `try`/`catch`** using the same convention as the other `init()` calls in
   `main.js`. The pre-existing `window.x?.` optional-chaining guards are what make the app survive
   a failed init — and they only help if the failure is caught rather than aborting module
   evaluation, which is what a top-level throw does today.
2. **Verify the order claim, don't assume it.** ES module imports all evaluate before any of the
   importing module's body, and `<script type="module">` is deferred, so `document.readyState` is
   already `interactive` when `main.js` runs. That means an init which defers on
   `readyState === 'loading'` still publishes synchronously — behaviour is preserved. Check this in
   the code rather than reasoning that moving the call "obviously" keeps the timing.
3. **Grep for other readers of the global before moving anything.** Every read must be inside a
   function and guarded; a read at module scope anywhere in the graph would have depended on the
   old import-time ordering.

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

### 14. File / module bloat 🟡 Medium _(project convention — thresholds come from `AGENTS.md` if present)_

Not a slop pattern by itself, but a strong correlate of it: files that outgrow what a reviewer can hold in their head tend to accumulate duplicated logic (#9), dead code (#4), and indirection (#6), simply because nobody re-reads the whole file before adding to it.

**Signals:**

- A file exceeds the project's own size convention (BlinkBudget's `AGENTS.md` sets a 500-line guideline — flag anything over)
- A file has visibly grown across several AI-assisted sessions without a matching refactor pass
- A single file mixes more than one clear responsibility (a view that also defines validation, formatting, and API calls inline)

**Check:** `wc -l` every file in the directory you're auditing; anything over the project's stated limit gets a note in the report even if no other numbered rule fires on it. Don't bundle a split-this-file refactor into an unrelated slop-cleanup change — call it out inline in the same report as a corrective action.

### 15. Async boundary bugs 🔴 High

_Found in the `src/views/` round of 2026-09-26 and added to the guide afterwards. This is the
one class the first fourteen rules structurally cannot see, because **the code in question has no
`catch` block to find** — the existing error-handling sweep greps for `catch` and walks straight
past it._

**A) A `try`/`catch` wrapped around an `async` call catches nothing.**

```js
// Looks handled. Catches nothing — see below.
try {
  analyticsCache.invalidate('financial_planning_preload');
} catch {
  // ignore cache errors
}
```

An `async` function never throws synchronously: it returns a promise that _rejects_. A `try`/`catch`
around the call site cannot observe that. This is **strictly worse than having no `try`/`catch`**,
because it reads as handled in review and converts a real failure into an **unhandled rejection** —
the failure still happens, it just escapes the error path the author believed was covering it.

**Check:** for every `try { ... } catch` in scope, is the guarded expression an `async` call with no
`await` on it? If so, the `catch` is dead. The tell is a `catch` whose body cannot possibly run.

**The correct shapes** are, in order of preference:

```js
// 1. Handle the rejection where the promise is created (this repo's house style)
analyticsCache.invalidate(key).catch(error => console.warn('…', error));

// 2. Make the caller async and await it, when ordering actually matters
await analyticsCache.invalidate(key);
```

**B) Fire-and-forget async calls that should be ordered.**

Calling an async function without `await` does not merely "lose" the result — it **yields before
its work happens**, and everything synchronous after the call line runs first. If the async work
guarded state that the synchronous code then reads, there is a real bug window.

The instance from this round: `handleAuthChange` reset its preload flags, then called the async
`invalidate()` and immediately called `renderDashboard()`. Because `invalidate()` awaits its mutex
before deleting anything, the cache still held the **previous user's** planning data for the whole
of the synchronous render. On a shared device that is a cross-user data bleed.

**Check:** for each unawaited async call, ask what the next synchronous statement reads. If it
reads state the async call was supposed to clear, that is a 🔴 race, not a style nit.

**C) A sync/async pair where calling one before the other silently disables it.**

This is the subtlest form, and it is the one the original finding missed. A cache API offered both
`invalidateSync(pattern)` and `async invalidate(pattern, capturedKeys)`, and the async one derived
its deletion set from the in-memory map:

```js
const keysToDelete = capturedKeys || [...this.cache.keys()].filter(…);
```

So the "obvious" fix — `invalidateSync(p)` followed by `invalidate(p)` — is a **no-op for the
persistent layer**: the sync call empties the map, so the async call re-derives an empty key list
and never touches persistent storage. The fix has to capture the keys _first_ and pass them in,
which is the pattern the codebase already uses correctly in `cache-invalidator.js:38-55`.

**Check:** when a codebase has both a sync and an async variant of the same operation, read the
async one's body before chaining them. If it derives its work from state the sync one clears, order
alone is not enough — look for a key-capture parameter, and copy the pattern from an existing
correct call site rather than inventing one.

**D) Grep for it.** Neither `catch` nor `.catch(` appears in the buggy form of (B), so the
standard error sweep finds nothing:

```bash
rg -n -P "^\s*(?!await ).*\.(invalidate|clear|reset|load|save|set|delete)\(" src/
rg -n "await " src/ | wc -l    # compare: async-looking calls vs awaited ones
```

If a helper is called in many places and awaited in none, that is a **contract** problem, not N
separate findings — write it up once and note the count. In this round 13 call sites shared the
unawaited pattern, and the right answer was "enforce the contract in one place," not 13 line edits.

**E) A `return` of a promise the function itself resolves — a self-deadlock.**

The most subtle variant found so far, and it is invisible to every other rule because it lives in
the _return value_ rather than in a missing `await`. A hand-rolled mutex looked like this:

```js
async _acquireLock() {
  while (this._lockPromise) await this._lockPromise;
  this._lockPromise = new Promise(resolve => { this._lockResolve = resolve; });
  return this._lockPromise;          // <-- awaits a promise only _releaseLock() settles
}
```

The returned promise settles in `_releaseLock()`, and `_releaseLock()` runs in the caller's
`finally` — i.e. only _after_ the `await this._acquireLock()` that can never complete. So the lock
is taken on the first call and never released, and **every subsequent caller queues behind it
forever**. A three-line probe confirms it instantly:

```
acquire #1: TIMED-OUT (never settled)   lockPromise held: true
acquire #2: TIMED-OUT (never settled)
acquire #3: TIMED-OUT (never settled)
```

**The tell:** a promise that the function creates _and_ returns, whose only resolver is a function
the caller runs later. A mutex hands out **ownership**; it is not itself a thing to await.

**Check:** for any `acquire`/`lock`/`reserve`/`next` helper, ask what its return value is awaited
_for_. If the answer is "so I know I hold the lock", the contract is wrong. Also read the paired
release path for a **read-modify-write outside the lock** — the same class had
`const cached = readFromDisk()` placed _above_ `await this._acquireLock()`, which is a TOCTOU race
even once the deadlock is fixed. Both defects shipped together and only the second one survives the
first fix, so re-run the probe rather than declaring victory.

---

### 16. Build-pipeline defects 🔴 High

_Found in the `src/styles/` round of 2026-09-26. Added after a finding filed as 🟡 "consistency
only" turned out to be shipping 22 blocks of dead CSS to production. This class is structurally
invisible to the other rules because **every tool you audit with reports the source as valid** —
ESLint, Stylelint, Prettier and the full test suite were green the whole time._

**A) A construct that is only recognised in one of its two spellings.**

`postcss-custom-media` resolves the parenthesised reference and silently passes the other through:

```
@media (--md) { … }   ->  @media (min-width: 768px) { … }   resolved
@media --md   { … }   ->  @media --md { … }                 verbatim, invalid, discarded
```

The paren-less form is not a recognised reference. It compiles without error, survives the build
untouched, and reaches the browser as an **invalid media query that is thrown away** — so 22
blocks were live in the repo and dead in production. Desktop `h1`/`h2` never scaled up, the
dashboard stat grid never went multi-column, and a mobile-only back button was never hidden on
desktop.

**The generalisable lesson is not "watch your parentheses." It is that a build succeeding is not
evidence that its output is valid.** Both round-2 🔴 findings (#4.1 and #7.1) were reachable only
by reading `dist/`; neither was visible in source. For anything involving a custom at-rule, a
preprocessor feature, a purge step, or a codemod:

1. **Probe the tool in isolation** on a minimal input, both spellings, and diff the output.
2. **Read the built artefact**, not the source. `Get-Content dist/assets/*.css` and grep for the
   construct you expect the tool to have resolved. Anything still in source form is dead.
3. **Assert on the source form in a test** — banning the spelling is cheaper and more durable than
   asserting on a minified, content-hashed `dist` filename that changes on every unrelated rebuild.

**B) An optimiser's safelist can keep genuinely dead code alive.**

PurgeCSS drops rules nothing references. Its `safelist.standard` includes `/^(fade|slide|bounce|pulse|spin)/`,
which matched the _keyframe name_ `loading-dot-bounce` and, transitively, kept the `.loading-dot`
rules that no JS or HTML ever applied. So the code looked live in `dist/` and would have been
protected from any cleanup — until the real consumer was established as absent, at which point the
keyframe legitimately disappeared too.

**Check:** when a purge drops something you expected to survive, ask whether a safelist was
carrying it. And when auditing "live" code, confirm the liveness comes from a real consumer rather
than an incidental name match — the two look identical in the artefact.

**C) Verify a bulk edit with a parser, not with brace counting.**

Regex- and brace-matching scripts silently corrupt CSS: unbalanced `}}`, orphaned at-rules, rules
swallowed inside a `@media` body. Three hand-rolled passes produced malformed output that
Stylelint caught only as cosmetic "empty block" noise, hiding the real damage. `postcss` is already
a dependency — parse, walk the AST, mutate, re-serialise, then re-parse every touched file to
confirm. Regex is fine for _finding_ candidates; it is not fine for _rewriting_ them.

---

## Testing traps specific to this repo

These are not slop patterns, but they decide whether a fix is actually _covered_, and a change
that looks tested can be structurally untestable by the suite you reach for.

### 1. A file-scoped `vi.mock` permanently removes a code path from that suite

Mocks are hoisted and apply to the whole test file, not to one test. So a suite that mocks a
module to make _other_ behaviour testable can quietly make your change unreachable:

- `tests/components/integrity-report.test.js` mocks `data-integrity-service`, which makes it the
  **only** suite able to render `DataManagementSection` at all.
- `tests/components/backup-restore-section.test.js` mocks `ConfirmDialog` with a **throwing**
  factory. That is the right call for its own test (a dialog chunk that won't load), but it means
  the suite can never reach the `onConfirm` handler where the C16 restore-failure fix lives.

**Check before you extend an existing suite:** does any file-level `vi.mock` in it exclude the
code you changed? If so, a regression test belongs in a _new_ file whose mocks allow the path —
that is what `tests/components/backup-restore-failure-logging.test.js` exists for, loading the
dialog chunk normally and invoking `ConfirmDialog.mock.calls[0][0].onConfirm()` directly.

### 2. Prove the regression test actually regresses

A green test proves nothing until you have seen it fail. Revert the fix, run the test, confirm it
fails for the _right reason_, restore. This is cheap and it catches the two failure modes that
otherwise survive to review: a test that passes without the fix (asserting nothing), and a test
that fails for an incidental reason (wrong mechanism, so it would keep passing after a real
regression). For the C06 fix the reverted run produced:

```
AssertionError: promise rejected "Error: [vitest] There was an error when mocking a module"
  instead of resolving
```

which is precisely the user-facing symptom the fix addresses — "the user is told nothing" — rather
than an incidental mismatch.

### 3. A rejected import in a `vi.mock` factory arrives wrapped

Vitest replaces the error thrown by a failing mock factory with its own wrapper and preserves the
original on `cause`. Asserting on `error.message` alone will fail for the wrong reason. Unwrap
before asserting identity:

```js
const errorText = e =>
  [e?.message, e?.cause?.message].filter(Boolean).join(' | ');
```

### 4. ESLint directives are single-line

`eslint-disable-next-line` skips exactly **one** line. A three-line explanatory comment above it
makes "next line" resolve to _another comment_, so the suppressed rule still fires **and** you
pick up an `Unused eslint-disable directive` warning on top. Put the reason on one line directly
above the offending statement and let the fuller justification live in the file header.

### 5. `core.autocrlf` makes `prettier --check` fail on files you never touched

This repo has `core.autocrlf=true`, no `text=auto` in `.gitattributes`, and Prettier configured
`endOfLine: "lf"`. Any git operation that rewrites the working tree — `git stash` / `git stash pop`,
a fresh checkout, some merges — silently rewrites those files to **CRLF**, after which
`prettier --check` fails on every one of them.

It is worse than cosmetic noise because it produces **false confidence in both directions**: a
formatting failure appears on files whose content you never edited, which invites you to "fix" it
with a blanket `prettier --write` and bury a real diff; and a genuine formatting problem in a file
you _did_ edit gets attributed to the line-ending churn and waved through.

**Check before believing a format failure:**

1. `git --no-pager diff --numstat` — if a file you never edited is in the list, suspect CRLF.
2. Stash and re-run `prettier --check` on the file. **If the pristine version also fails, it is
   pre-existing, not yours** — that is the check that separates the two, and it is cheap.
3. Note that `git stash` is itself the thing that causes it here. If you need a baseline, prefer
   `git show HEAD:<path>` into a temp file (outside the repo) over stashing the working tree.
4. To normalise, `prettier --write` the affected files and confirm with `git diff --numstat` that
   the content delta is still only your intended edits.

Long-term fix, if this bites a third time: configure Git or Prettier to enforce LF in the working tree even when `core.autocrlf` is enabled, e.g. a `.gitattributes` entry such as `* text=auto eol=lf` plus a Prettier `endOfLine: "lf"` setting. The current `* text=auto` recommendation alone does not guarantee LF in a checkout where `core.autocrlf` is on, so the repo still needs an explicit LF rule in the working tree rather than relying on platform conversion alone.

### 6. A shared test double that is a stub can make a test unpassable for any code

`tests/setup.js` replaces `global.localStorage` with bare `vi.fn()` spies. `setItem` records the
call but stores nothing, and `getItem` returns `undefined` for **every** key, always. A test that
writes to storage and then reads it back can therefore never pass — no matter what the application
code does:

```
GET_AFTER_SET=undefined   GETITEM_IS_MOCK=true   SETITEM_CALLS=1
```

This is a different failure from a real regression, and it is easy to misdiagnose as one: the
suite is red, the assertion names a real cache key, and the instinct is to go change the source.
The suite's own siblings show the fix — `tests/core/data-integrity-categories.test.js` installs a
real in-memory `LocalStorageMock` in `beforeEach` for exactly this reason.

**Check:** when a test fails on a persistence or storage assertion, confirm the harness can express
the assertion before touching the code. `setItem` then `getItem` in the same test answers it in one
line. If the double is a stub, install a real implementation locally — don't modify the shared
`setup.js` mock, which would change the baseline for every other suite.

### 7. A pre-existing red test is a fact to establish, not a nuisance to route around

A suite can be red before you touch anything. Establishing that costs one stash-and-run and saves
a wrong attribution in the write-up. In this session `tests/views/dashboard-greeting.test.js` was
already failing on `master`; the fix for it turned out to be a 🔴 cross-user data bleed plus a
broken test double, and conflating that with the CSS work would have buried both.

**Check:** `git stash push -- <paths you changed>`, re-run the suite, and record whether it still
fails. Report it as pre-existing with the evidence. Note that `git stash` is what triggers the
CRLF churn in trap #5, so re-run `prettier --write` on any file it touched.

### 8. Diff the build against a baseline before blaming or trusting your own change

After any bulk edit, "this selector is missing from `dist/`" is ambiguous — it may be your change,
or it may have been purged before you started. Both readings look identical from inside the session.

**Check:** build the pre-change tree and compare the same tokens. In this session the same sweep
reported 15 selectors as "missing"; the baseline build showed 14 were **already** absent, and
exactly one was genuinely lost — then traced to a class with no consumer, whose keyframes had been
kept alive only by a safelist name-match. Without the baseline that would have been either a missed
regression or a false alarm, and both would have been reported confidently.

```bash
git stash push -- src/styles/ ; yarn run build ; <grep the tokens> ; git stash pop
```

Prefer `git show HEAD:<path>` into a temp file outside the repo where you can, so the working tree
is not disturbed (see trap #5).

---

## Before you flag it: false-positive checklist

Not everything that looks like slop is slop. Before writing something up in the report, check:

1. **Security- or ownership-related? Stop — don't run this checklist to decide whether to remove it.** See the 🔒 carve-out under rule #3. Flag for author confirmation and move on; no amount of grep confidence changes the answer.
2. **Confirm with grep, not memory.** "This looks unused" is a hypothesis, not a finding — actually run the search.
   - **Then ask whether it's _unreferenced_ or _provably_ dead** — they need different evidence. An empty function body (`() => { /* comment only */ }`) is a _proof_: it cannot do anything, so removing it cannot change behaviour on any runtime, and no device testing or `git blame` can overturn that. Grep-zero-callsites is weaker — it only means _this repo_ doesn't call it. A finding that says "check iOS behaviour before removing" has mis-filed a proof as a hypothesis, and gating it on a device test just manufactures a delay. Rule the two categories differently.
3. **Check git blame / PR context** for the surrounding lines. A guard added deliberately in a bug-fix commit is not the same as one an AI tool left behind reflexively.
4. **Check if it's covered by a test.** A "dead" branch that's exercised by a test suite is either not dead, or the test itself is stale — note which.
5. **Consider forward-looking code.** A guard or parameter that doesn't fire _yet_ may be there for an in-progress feature or an upcoming caller — check open branches/PRs before deleting. **An empty function body is different**: it is a proof (see #2 above), and no future feature justifies keeping a body that is empty _now_ — a feature that ships will bring its own implementation. The real question is whether to delete the scaffolding or fill it in, and that is the author's call, so it stays "User Review Required." In this round the author resolved it as "delete — we are not implementing this feature," which was the right resolution for a stub. Record the decision either way rather than leaving the code as a permanently open question.
6. **When in doubt, downgrade rather than delete.** Flag it in the report as "possibly intentional — confirm with author" instead of silently removing it.
7. **Be suspicious of a clean sweep.** If a full audit produces zero findings marked "false positive" or "intentional," do one more pass looking specifically for reasons each item might be there on purpose before finalizing the report. A 100% slop hit rate across dozens of findings is itself a signal you're pattern-matching too fast rather than actually evaluating each one.
8. **Be equally suspicious of a report whose justifications are all airtight.** The inverse failure mode: if every finding arrives with a confident, well-argued rationale, spot-check the two most rhetorically persuasive ones against the code before filing them. "The knowledge encoded in it is currently lost" reads as unanswerable and would have prevented a deletion that turned out to be correct. Strong prose is a reason to verify harder, not to skip verification.
9. **Apply the calibration in both directions, and record the correction.** A finding you _narrowed_ on re-derivation is the obvious case, and the one this guide already warns about. But the same discipline has to catch the opposite error, and there the pull is stronger, because an inflated severity is easier to live with than an understated one — it looks like diligence.

   The instance: a finding was filed 🟡 "consistency-only" on the reasoning that _"`postcss-custom-media` accepts both and the production build compiles."_ The premise held exactly. The inference did not. Probing the plugin showed only one spelling is resolved, and the build shipped 22 blocks as invalid media queries that browsers discard. **The severity was wrong in the same report that had been praised for its rigour one page earlier.**

   The failure mode is specific: **"the build succeeded" was accepted as evidence about the build's _output_.** A pipeline not erroring says nothing about whether what it emitted is valid. When a finding rests on a successful tool run, ask what the tool would have had to notice in order to fail — and if the answer is "the construct it was asked to transform," then a green run is not evidence.

   Record the re-rank in the report rather than silently correcting the number, and add a line to the false-positive list. A round with zero mis-rated findings in **either** direction is a signal you are not re-deriving hard enough.

10. **Ask whether the check you ran could have failed.** A verification that cannot fail is not a verification. "I grepped and found nothing" passes identically whether the code is dead or the grep is wrong; "I compared the pre-change build against the post-change build" can fail — and when it did, it revealed that 14 of the 15 apparently-missing selectors had been absent before the session started. Prefer checks that have a failure mode over checks that only ever confirm.

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

**Required for any 🔴 or any finding you propose to fix: `- **Mechanism verified against source:** …`**

A finding's stated mechanism is a hypothesis until someone has read the implementation of every
function it names. Two findings in the 2026-09-26 round stated a confidently-worded mechanism that
the code contradicted, and in both cases the prescribed fix was a **no-op** that would have closed
the ticket while leaving the defect intact:

- A `catch {}` described as "may silently swallow a cache error" turned out to wrap an `async`
  call, so the `catch` could never run (rule #15A). "Remove it" and "add a `console.warn` to it"
  were both no-ops.
- A dead detector described as holding "knowledge [that] is currently lost" turned out to be a
  duplicate of a live, tested service (rule #4).

Write this line **before** filing, naming the specific thing you read that makes the mechanism
true — e.g. "verified `invalidate` is declared `async` at `AnalyticsCache.js:394`, so it returns a
promise and cannot throw synchronously." If you cannot fill it in, the finding is not ready to
file, and the thing you could not verify is exactly what the fix will get wrong.

**Where a finding carries a recommended fix, treat the recommendation as untrusted.** Include it, but
say so, and state the mechanism you verified alongside it. The author needs both: what you believe
is wrong, and what you have actually confirmed.

Group findings by rule number within the report so repeat offenders (e.g. every file that has the same #7 inconsistency) are easy to spot across sessions.

⚠️ **Line numbers are a hint, not an instruction — re-derive them at execution time.** They decay
the moment anything else in the file moves, and they mislead in a specific, expensive way: the
plan _looks_ precise, so the executor stops searching. Every stale number this round was found by
re-grepping instead of reading:

- A Phase D comment listed once actually appeared **twice** in `view-preloader.js`, the second
  occurrence in a function the plan never mentioned.
- C06's "report sites" pointed at lines 258/327/401/485; the real catch blocks were 251/315/384/464.
- C22 listed `ChartRenderer.js` at 1268 lines; it was 1271.
- C11 cited `DateInput.js` L70–73; the listener was L71–73.

Budget a search step per finding. "The cited lines don't contain this" is a finding about the
report, and the right response is to re-locate the code — not to conclude the finding was closed.

**One write-up per issue, not one per rule it matches.** If a single code block satisfies more than one rule — e.g. a `catch` that both swallows an error (#2) _and_ uses the exception as control flow (#10) — write it up once with `**Rule #:** 2, 10` rather than duplicating the snippet under two headers. Otherwise the executive-summary counts overstate how many distinct problems exist.

**🔒 findings get a restricted Action field.** A security-sensitive finding's Action is always "flagged for author confirmation" or "left as-is (reason)" — never "fixed in this session." If you find yourself writing "fixed" next to a 🔒 tag, stop and re-route it through the [implementation-plan gate](#from-findings-to-implementation-plan) instead.

---

## Recommended audit procedure for a new file

1. **Read imports** — grep each import name in the file; flag any that are never used. Then re-grep the whole repo, not just this file: a symbol used only in a sibling view is not an orphan.
2. **Read every catch/try block** — apply rules #2 and #10, **then rule #15A**: for each `try`, check whether the guarded expression is an un-awaited `async` call, in which case the `catch` cannot fire.
3. **Read every comment** — apply rules #1 and #11. Delete trivial ones mentally; if more than ~30% of comments add no information (or are stale), flag the file.
4. **Search for hardcoded values** — `px`, `#`, `rgba`, `z-index`, plain number literals in style assignments (rule #5).
5. **Check exports** — for every exported name, grep for callsites outside the file (rule #4), **then grep the concept** to see whether an equivalent implementation already exists elsewhere before calling the orphan irreplaceable. Before deleting anything a grep calls dead, work through rule #4's three runtime-name questions.
6. **Read every wrapper function** — if the body is one expression, check whether the wrapper adds anything (rule #6); check for near-duplicate blocks nearby (rule #9). An empty-bodied wrapper with real listener/cleanup plumbing around it is a scaffold, not infrastructure (rule #4 signal).
7. **Audit the async boundary** — for every call to a function that is `async` in its own definition, check whether it is awaited and whether the next synchronous statement reads state it should have cleared (rule #15B). If the codebase has sync/async twins, read the async one before recommending an order (rule #15C). For any lock/acquire helper, check what its return value is awaited _for_ (rule #15E).
8. **Compare with sibling files** — open the closest related file and spot-check that the same pattern is used for the same problem (rule #7).
9. **If TypeScript or React is in play** — run rules #12 and #13.
10. **Before writing anything up** — run it through the [false-positive checklist](#before-you-flag-it-false-positive-checklist).
11. **Log findings** using the [report schema](#ai-slop-reportmd-schema) above.

**For a build-pipeline round (rule #16) — a different entry point entirely.** The procedure above
is source-first. If the scope is CSS, a config file, or anything that passes through a preprocessor
or purge step, add these before the rule-by-rule sweep:

1. `yarn run build`, then read `dist/assets/*.css` (or the JS bundle) directly.
2. Grep the artefact for every construct a tool claims to transform, and for constructs it should
   have consumed. Anything still in source form is dead in production.
3. Diff against a baseline build of the pre-change tree before attributing any difference to
   yourself.
4. Only then start the source sweep — and treat "the build compiled" as no evidence at all.

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
- **Re-read the code before implementing the prescribed fix, and re-rank the severity.** A report
  describes a defect's _apparent_ mechanism, and that description can be wrong in a way that turns
  the fix into a no-op. C06 was written as "the catch blocks import the dialog before reporting the
  failure, so the original error is lost" — reading the source showed `console.error` already ran
  first, so the diagnostic was never lost. The real defect was narrower: the secondary `await
import()` sat _inside_ the catch, so a failed dialog chunk threw while handling the original
  error, leaving the user with no feedback and an unhandled rejection. Implement that, not the
  description. If the mechanism in the report doesn't survive contact with the code, stop and
  re-scope the finding before writing any of it.
- **Ask what a fix derived from a wrong premise would leave behind.** The 2026-09-26 round produced
  the sharpest version of this: the finding said a `catch {}` could silently swallow a cache
  error, and prescribed "remove the `catch`, or replace it with a `console.warn`." Both were
  no-ops, because the guarded function was `async` and the `catch` could never run (rule #15A).
  Implementing the prescription exactly would have deleted four lines, changed no behaviour, and
  left the actual cross-user data bleed fully intact while the report showed the finding as
  resolved. **When a report's mechanism doesn't hold up, the fix must be re-derived from the
  mechanism you actually found — and the report's own recommendation is the least trustworthy part
  of it.** Re-deriving it here also surfaced a third defect the original had missed entirely (the
  sync/async ordering trap, rule #15C).
- **Fix the contract, not the symptom, when a pattern repeats.** If the same wrong pattern appears
  at many call sites, the finding is about the contract, not the lines. 13 call sites shared the
  unawaited-invalidate pattern; the right move is to enforce the ordering in one place and record
  the rest, not to hand-edit 13 sites inside a security fix.
- **Prove each regression test fails without its fix** — see [Testing traps](#testing-traps-specific-to-this-repo). Revert, run, confirm it fails for the right reason, restore.
- **Make the reverted failure message legible evidence.** A revert run that fails with
  `AssertionError: expected { goals: [ 'user-A-private-goal' ] } to be null` proves the security
  bug in one line, because the assertion data _is_ the leaked content. When fixing a security or
  data-correctness issue, seed the regression test with recognisable sentinel data so the failure
  output demonstrates the defect to a reviewer who wasn't present for the revert.
- Run lint/format/build once per phase, not only at the very end, so a bad phase-1 change doesn't get buried under phase-2 and phase-3 diffs on top of it.
- **Re-grep for newly orphaned code after every deletion** — see rule #4 step 5. Cascades are the norm, not the exception.
- For any UI-visible fix (error toasts, post-error navigation, focus behavior), write the manual QA step as a concrete user action ("click delete, confirm the undo toast appears and dismissing it does not re-delete") rather than "verify the flow works."

---

## Running a full audit against this repo (runbook)

Use this when kicking off a new audit round — including a re-check after a remediation pass has landed.

1. **Pick a scope.** A full `src/` sweep, a single phase's touched files, or just the directories a recent AI session modified. A post-remediation re-check only needs the files that actually changed, plus their sibling files (rule #7 needs a neighbor to compare against).
2. **Standardize the search tool.** The first audit round mixed PowerShell (`Select-String`, `Get-ChildItem`) with plain regex searches; if the team works across shells, prefer `ripgrep` (`rg`) so results are reproducible regardless of who runs the audit:
   - All catch blocks: `rg "catch\s*\{|\.catch\(" src/`
   - **Catches wrapped around async calls (rule #15A)** — the ones that can't fire: `rg -n -P "(?s)try\s*\{[^}]*?\b\w+\([^)]*\)\s*;?\s*\}\s*catch"` then read each for an un-awaited `async` call
   - **Un-awaited async calls (rule #15B)** — `rg -n -P "^\s*(?!await\b|return\b).*\b(invalidate|clear|reset|load|save|set|delete|hydrate|refresh)\w*\(" src/`
   - **Sync/async twins that can disable each other (rule #15C)** — `rg -n "Sync\b|invalidateSync|flushSync" src/`, then read the async counterpart's body for state it derives from what the sync call clears
   - Callsites of a symbol (then re-run against the _whole repo_, not just `src/`, before calling it dead — rule #4): `rg "symbolName"`
   - **Whether an orphan's job is already done elsewhere (rule #4)** — grep the _concept_, not the function name: `rg -n "accountId|orphan" src/`
   - Dynamic imports, to manually inspect for computed paths: `rg "import\(" src/`
   - Hardcoded design values: `rg "#[0-9a-fA-F]{3,6}|z-index:\s*[0-9]{3,}" src/`
   - File length against convention: `rg -l --glob "*.js" src | ForEach-Object { [int](Get-Content $_ | Measure-Object -Line).Lines } | Sort-Object -Descending`

   **For a CSS / build-pipeline scope (rule #16) — the source sweep is the wrong place to start.**
   Build and read the artefact first, then add these:

   - Constructs a tool should have consumed but didn't (still in source form = dead in production):
     `rg -n "@media\s+--" dist/assets/*.css`
   - Runtime-constructed class names, which is what makes a dead-CSS sweep unsafe:
     `rg -n '\$\{' src/` — then read the enums/defaults that bound each prefix
   - A safelist that may be propping up dead code: read `vite.config.js`'s `purgecss.safelist`
   - Parse-check every stylesheet after a bulk edit rather than trusting brace matching:
     `node -e "const p=require('postcss'),fs=require('fs');for(const f of process.argv.slice(1))p.parse(fs.readFileSync(f,'utf-8'),{from:f})" $(Get-ChildItem -Path src -Recurse -Filter '*.css' | ForEach-Object { $_.FullName })`

3. **Work rule-by-rule across the scope, not file-by-file.** Sweeping for one rule (every `catch` block in scope) before moving to the next keeps the pattern fresh and surfaces cross-file inconsistencies (rule #7) that a single-file read-through misses.
4. **Apply the [false-positive checklist](#before-you-flag-it-false-positive-checklist) as you go**, not as a final pass over everything — checking git blame while the file is already open is cheaper than reopening thirty files at the end.
5. **Write the report** using the [schema](#ai-slop-reportmd-schema) above, grouped by rule number.
6. **Turn it into a plan** using the [gate above](#from-findings-to-implementation-plan) — phased by severity, 🔒 findings called out separately, every finding traced to a destination.
7. **After remediation lands, re-run steps 1–5 scoped to just the changed files** before closing out the round. This catches regressions the fix itself introduced (a `showErrorToast` swap-in missing an import) and confirms nothing was left half-migrated (a rule-#6 alias removed in one file but still called from another).
