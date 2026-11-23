# Code Quality & Design-System Playbook

A project-agnostic guide for auditing code (especially AI-assisted code), keeping a design system
honest, and planning and shipping UI improvements without breaking a working app.

It merges three practices that belong together:

| Practice                     | Question it answers                                  | Where         |
| ---------------------------- | ---------------------------------------------------- | ------------- |
| **Slop audit**               | "What lazy or wrong patterns did the tooling leave?" | Parts 3, 4, 8 |
| **Design-token hygiene**     | "Does the UI actually use the design system?"        | Part 5        |
| **Design improvement plans** | "How do we change the UI safely and know it worked?" | Part 6        |

Parts 1, 7 and 9 are shared infrastructure: principles, verification traps, and a runbook.

> **How to adopt it:** fill in the [Project Profile](#project-profile) once, commit this file next to
> your agent/contributor instructions (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`), and run the
> audit **before and after** any AI-assisted session that touches production code.

## Contents

- [Part 0. Using this document](#part-0-using-this-document)
- [Part 1. Principles](#part-1-principles)
- [Part 2. Triage and severity](#part-2-triage-and-severity)
- [Part 3. Audit rule catalog (R1-R19)](#part-3-audit-rule-catalog)
- [Part 4. False-positive checklist](#part-4-false-positive-checklist)
- [Part 5. Design-token hygiene](#part-5-design-token-hygiene)
- [Part 6. Planning and shipping design improvements](#part-6-planning-and-shipping-design-improvements)
- [Part 7. Verification and testing traps](#part-7-verification-and-testing-traps)
- [Part 8. Findings → report → plan → implementation](#part-8-findings-to-implementation)
- [Part 9. Runbook](#part-9-runbook)
- [Appendices: templates and checklists](#appendices)

---

## Part 0. Using this document

### Three entry points

1. **Auditing code** (after an AI session, before a release, or on inherited code): Parts 2 → 3 → 4 →
   8 → 9.
2. **Cleaning design-token violations** (lint warnings about raw colors/pixels): Part 5.
3. **Planning a UI change** (new palette, typography, motion, empty states, CSS consolidation):
   Part 6, then Part 7 for how to verify it.

### Project Profile

Everything below is written with placeholders. Fill this table in once; every command and
threshold in the document refers back to it.

| Placeholder           | Your value (example)                                  |
| --------------------- | ----------------------------------------------------- |
| `<src>`               | `src/`                                                |
| `<tokens-css>`        | `src/styles/tokens.css` (CSS custom properties)       |
| `<tokens-js>`         | `src/utils/constants.js` (JS mirror of the tokens)    |
| `<critical-css>`      | inlined/pre-load stylesheet, if any                   |
| `<lint>`              | `yarn lint` / `npm run lint`                          |
| `<format-check>`      | `npx prettier --check`                                |
| `<test>`              | `npx vitest run` / `npm test`                         |
| `<build>`             | `yarn build`                                          |
| `<dist>`              | `dist/`                                               |
| `<file-size-limit>`   | 500 lines (from your contributor instructions)        |
| `<token-guard-tests>` | tests that assert token integrity and purge safety    |
| `<search>`            | `rg` (ripgrep) so results are reproducible everywhere |

> **Use ripgrep everywhere.** Mixed shells (`Select-String`, `grep`, IDE search) give different
> results on different machines. `rg` is the one tool every command in this document assumes.

### Instructing AI tools up front

Most slop is cheaper to prevent than to audit. Put these in your agent instructions:

- State the **file-size limit**, the **token policy** (no raw colors/pixels, no invented tokens), and
  the **error-handling convention** (what a catch block must do).
- Require: _"Do not refactor, reformat, rename, or bump dependencies outside the files the task
  names."_ (See R17.)
- Require: _"Every new import and dependency must resolve; say how you verified it."_ (See R8.)
- Require tests that **fail without the fix** (Part 7.2).
- Tell the tool where the sibling files are. Consistency (R12) is impossible without a neighbor to
  copy.

---

## Part 1. Principles

These are the ideas every later rule is an instance of. When a situation isn't covered by a
rule, fall back to these.

1. **A finding is a hypothesis until the mechanism is read in source.** "This catch swallows a
   cache error" is a claim about behavior; it is only true once you have read the implementation of
   every function the claim names. Reports routinely describe an _apparent_ mechanism that the code
   contradicts, and a fix derived from a wrong premise is often a silent no-op that closes the ticket
   and leaves the defect.
2. **"Grep found nothing" is a statement about text, not behavior.** Names get built at runtime,
   loaded by third parties, referenced from config, or reachable through dynamic imports.
3. **A successful tool run is not evidence the output is valid.** Builds, linters, formatters and
   tests can all be green while the shipped artifact is broken. Ask what the tool would have had to
   _notice_ in order to fail.
4. **A check that cannot fail is not a verification.** Prefer checks with a failure mode: revert the
   fix and watch the test go red; diff against a baseline build; assert in a test rather than in a
   one-off grep.
5. **Calibrate severity from the code you read, in both directions.** Inflated severity feels like
   diligence and is just as wrong as understated severity. Rank by consequence: silent **data loss**
   > silent **feedback loss** > silent **console noise**. A round with no mis-rated findings in
   > either direction means you did not re-derive hard enough.
6. **When in doubt, downgrade rather than delete.** "Possibly intentional, confirm with author"
   costs one message; a wrong deletion costs an incident.
7. **Strong prose is a reason to verify harder.** If every finding arrives with an airtight
   justification, spot-check the two most persuasive against the code. Equally, a 100% hit rate
   ("everything is slop") means you are pattern-matching, not evaluating.
8. **Cleanup passes never make design decisions.** Don't invent tokens, don't snap a value to the
   "nearby" token, don't add a z-index scale. Report "no token exists" and let the owner decide.
9. **Fix the contract, not the symptom, when a pattern repeats.** Thirteen identical call-site
   bugs is one finding about a contract, not thirteen line edits.
10. **Every finding gets a destination.** Scheduled, explicitly deferred (with a reason), or
    downgraded (with a reason). A finding that silently disappears between report and plan is the
    most common way a real bug ships.
11. **Security-sensitive code is never auto-remediated.** Authentication, authorization, ownership,
    and data deletion go to a human, however dead the grep says they are.
12. **One concern per commit.** Each change must be revertable alone. Bundling a file split, a
    token cleanup and a bug fix makes all three unreviewable.
13. **Record decisions.** "Author confirmed: delete, feature is cancelled" is worth more than the
    deletion. Without the record, the next session re-derives the same doubt.
14. **Line numbers are hints.** Re-locate code by searching at execution time; a plan that looks
    precise makes the executor stop looking.

---

## Part 2. Triage and severity

### If you only have time for five

These are the rules most likely to hide a real bug rather than untidy code:

1. **R1 Swallowed errors**
2. **R4 Dead / overly defensive guards**
3. **R6 Try/catch as control flow**
4. **R2 Async boundary bugs**: the highest-yield rule; it is invisible to a `catch` search
5. **R3 Build-pipeline defects**: code that lints clean and ships broken

### Severity legend

| Icon | Level                                     | Meaning                                                                 |
| ---- | ----------------------------------------- | ----------------------------------------------------------------------- |
| 🔴   | **High**                                  | Can hide a real bug or cause silent failure in production               |
| 🟡   | **Medium**                                | Hurts maintainability, causes drift between files, wastes reviewer time |
| ⚪   | **Low**                                   | Cosmetic; harmless but worth cleaning up                                |
| 🔒   | **Security-sensitive** (independent flag) | Touches auth, authorization, ownership, or deletion                     |

**Assign severity from the code you read, not from the report's framing.** "The original error is
lost" and "the user is never told what went wrong" are both error-handling gaps, but only the
first implies lost diagnosability.

**🔒 is an independent flag, not a severity.** A 🔒 finding is _never_ auto-remediated in the pass
that discovered it. Its Action is always "flagged for author confirmation" or "left as-is
(reason)". Anything of these kinds is 🔒:

- authentication, session handling, token storage, password/credential flows
- authorization, ownership checks, tenant/user isolation, access-control filters
- data deletion, data export, backup/restore
- input sanitization, output escaping (`innerHTML` with user data, string-built SQL/queries)
- secrets in source, disabled TLS/validation, permissive CORS, PII in logs

---

## Part 3. Audit rule catalog

Rules are grouped by severity. Each has **Signals** (what it looks like), a **Check** (how to
confirm), and the **Traps** that cause false positives or no-op fixes. Rules marked _(new)_ were
added beyond the original guides to cover patterns AI tooling commonly produces.

### 🔴 High severity

#### R1. Swallowed errors 🔴

**Signals**

- `.catch(() => {})`, or `catch { /* ignore */ }`: intentional silence without logging
- `catch (e) { console.error(e) }` with no re-throw, no fallback, no user signal
- Missing `return` after an error path, so execution falls through to the success path
- Re-wrapping that loses the original: `throw new Error('failed')` instead of
  `new Error('failed', { cause: e })`
- A promise chain or `async` call with no terminal handler

**Check every `catch`**

1. Does it log the error? (minimum bar)
2. Does the user get feedback?
3. Does execution stop, or fall through?
4. **Can it run at all?** If the guarded expression is an un-awaited `async` call, the `catch` never
   fires. The error escapes as an unhandled rejection. This is the most valuable question on the
   list and the easiest to skip because the code _looks_ handled. See R2-A.
5. **Can the handler itself fail?** A `catch` that does `await import('./dialog')` or calls a
   reporting service can throw _while handling the original error_. The user then gets no feedback and
   an unhandled rejection. Secondary work inside a `catch` needs its own guard.

**Where to look first:** the most user-visible flows (views, controllers, core services).

---

#### R2. Async boundary bugs 🔴

The one class the other rules structurally cannot see, because **the code in question has no
`catch` block to find**, so an error-handling sweep walks straight past it.

**A) A `try`/`catch` around an `async` call catches nothing.**

```js
// Looks handled. Catches nothing.
try {
  cache.invalidate('user-data'); // async; returns a promise
} catch {
  // ignore cache errors
}
```

An `async` function never throws synchronously; it returns a promise that _rejects_. The `try`
cannot observe that. This is **worse than no `try`/`catch`**: it reads as handled in review and
converts a real failure into an unhandled rejection. Remove-the-catch and add-a-log are both
no-op fixes. Correct shapes, in order of preference:

```js
// 1. Handle the rejection where the promise is created
cache.invalidate(key).catch(error => console.warn('invalidate failed', error));

// 2. Make the caller async and await it, when ordering matters
await cache.invalidate(key);
```

**B) Fire-and-forget calls that should be ordered.** An async function runs synchronously until its
first `await`. When it suspends there, control returns to the caller, which continues with its next
statement. Statements before that suspension point happen before the caller's next statement;
work after it may happen later. If that later async work was supposed to clear state the next line
reads, that is a race, not a style nit. Real instance: an auth-change handler reset flags, called an
async `invalidate()` (which awaits a mutex before deleting), then immediately re-rendered, so the
render saw the **previous user's cached data**. On a shared device that is a cross-user data bleed
(🔒).

_Check:_ for each un-awaited async call, ask what the next synchronous statement reads.

**C) A sync/async pair where calling one first silently disables the other.**

```js
// async variant derives its work from state the sync variant clears
const keysToDelete = capturedKeys || [...this.cache.keys()].filter(match);
```

`invalidateSync(p)` followed by `invalidate(p)` is a **no-op for the persistent layer**: the sync
call empties the map, so the async call re-derives an empty key list. The fix is to capture the keys
_first_ and pass them in. _Check:_ when a codebase has sync and async twins, read the async one's
body before chaining them, and copy the pattern from an existing correct call site.

**D) Grep for it** (heuristics, expect noise; read each hit):

```bash
rg -n -P "^\s*(?!await\b|return\b).*\b(invalidate|clear|reset|load|save|set|delete|hydrate|refresh)\w*\(" <src>
rg -n "Sync\b|invalidateSync|flushSync" <src>
```

If a helper is called in many places and awaited in none, that is a **contract** problem. Write it
up once with the call-site count and enforce the contract in one place. Better still, turn the lint
on: `@typescript-eslint/no-floating-promises` (needs type info) or `no-floating-promise` equivalents.

**E) Returning a promise that only the caller can resolve: a self-deadlock.**

```js
async _acquireLock() {
  while (this._lockPromise) await this._lockPromise;
  this._lockPromise = new Promise(resolve => { this._lockResolve = resolve; });
  return this._lockPromise;   // settles only in _releaseLock(), which runs after this await
}
```

`_releaseLock()` runs in the caller's `finally`, i.e. only _after_ the `await` that can never
complete. The lock is taken once and never released; every later caller queues forever. **A mutex
hands out ownership; it is not itself a thing to await.** _Tell:_ a promise the function creates
_and_ returns whose only resolver runs later. A three-line probe (acquire three times with a timeout)
proves it. Also check for a read-modify-write placed _above_ the acquire; that TOCTOU race survives
the deadlock fix. Re-run the probe rather than declaring victory.

---

#### R3. Build-pipeline defects 🔴

Structurally invisible to every other rule because **every tool you audit with reports the source
as valid**: linters, formatters and the full test suite stay green.

**A) A construct recognized in only one of its spellings.** Real instance: a custom-media plugin
resolved `@media (--md)` but passed `@media --md` through verbatim. It compiled, survived the build,
and reached browsers as an invalid media query that is **discarded**, so 22 blocks were live in
source and dead in production. Desktop headings never scaled, a grid never went multi-column.

The generalizable lesson is not "watch your parentheses." It is that **a build succeeding is not
evidence its output is valid.** For any custom at-rule, preprocessor feature, purge step, or codemod:

1. **Probe the tool in isolation** on a minimal input, both spellings, and diff the output.
2. **Read the built artifact**, not the source. Grep `<dist>` for constructs the tool should have
   consumed; anything still in source form is dead.
3. **Assert on the source form in a test.** Banning the bad spelling is cheaper and more durable than
   asserting on a minified, content-hashed filename.

**B) An optimizer's safelist can keep genuinely dead code alive.** A purge safelist pattern like
`/^(fade|slide|bounce|spin)/` matched a _keyframe name_ and transitively kept rules no code ever
applied. The code looked live in `<dist>` and would have been protected from cleanup. When a purge
drops something you expected, ask whether a safelist was carrying it; when auditing "live" code,
confirm liveness comes from a real consumer rather than an incidental name match.

**C) Verify a bulk edit with a parser, not brace counting.** Regex/brace scripts silently corrupt
CSS (unbalanced `}}`, orphaned at-rules, rules swallowed into a `@media` body). Use the project's
own parser (`postcss`, `@babel/parser`, `ts-morph`): parse → walk the AST → mutate → re-serialize →
**re-parse every touched file**. Regex is fine for _finding_ candidates, not for _rewriting_ them.

**D) Diff against a baseline build** before attributing any difference to yourself (Part 7.8).

---

#### R4. Overly defensive / dead guards 🔴

**Signals**

- Null check on a value validated two lines above
- `if (x && typeof x === 'string')` on a value that can only be a string or absent
- `else` branches after a condition the outer context guarantees can't be false
- Multiple `setTimeout` calls with escalating delays for the same operation ("try again in case")
- Optional chaining on every property of an object you just constructed

**Check:** trace the data from where it enters the function. If a guard can never fire given the
outer constraints, it is dead defensive code. Then run Part 4, because a guard that looks dead can
protect against a caller that doesn't exist _yet_.

🔒 **Security carve-out.** If the guard concerns authentication, authorization, ownership, or
access control, do not recommend removal on caller analysis alone. "No path reaches this branch
today" is not "this branch can never matter"; these are often the last line of defense when an
upstream filter changes. **Always downgrade to "flag for author confirmation."**

---

#### R5. Dead / unreachable code 🔴

**Signals**

- An exported function never imported; a zero-logic alias for another method
- `classList.remove('x')` where `x` is never added
- `removeItem(key)` immediately followed by `setItem(key, …)`
- A composite utility no caller uses
- **A `debounce`/`setTimeout`/listener wrapper whose body is empty apart from a comment.** Check the
  body is actually empty before treating the wrapper as infrastructure. The giveaway is the
  **scaffolding ratio**: registration, invocation and cleanup plumbing surrounding no real work.

**Procedure:** pick an export → `rg "name" <src>` → zero callsites outside its own file = candidate.

> ⚠️ **"Grep found nothing" is a hypothesis about _text_, not _behavior_.** This is the most
> dangerous step in the whole guide because the grep genuinely returns zero.

**Before deleting anything a grep calls dead, answer three questions**

1. **Is any name composed at runtime?** Class/ID/key names assembled by template literals
   (`` `toast-${type}` ``, `` `btn-${size}` ``) have no literal reference anywhere, and a naive dead-CSS
   purge deletes the background behind every toast. Search for interpolation, not the name:
   `rg -n '\$\{' <src>`, then enumerate the **actual value set** from its source of truth (the enum
   or defaults object). A prefix plus an unknown value set is unbounded; an enum is a closed set you
   can check.
2. **Does a third party create the node?** Chart/tooltip/editor libraries emit their own class
   names at runtime that appear nowhere in your repo. Check the library's documented names.
3. **Is the selector reachable at all?** Check the _whole_ compound selector. `.widget button.active`
   is dead if `.widget` is never applied, even though `button` and `.active` are live.

Make it durable by **asserting it in a test** that derives runtime-constructed prefixes from the
JS and fails on any selector that is neither literally referenced nor template-producible. The next
person's purge hits the same wall you did.

**Before calling an orphan "irreplaceable logic", check whether an equivalent exists elsewhere.**
"Zero callers" is cheap to prove and easy to over-interpret; "an equivalent already exists" takes
one more search. Search by **what the code does**, not by name; duplicates rarely share
identifiers:

```bash
rg -n "ownerId|orphan" <src>      # the concept, not the function name
rg -n "integrity" <src>           # the domain
```

Real instance: a dead integrity-checker was filed 🔴 with "the knowledge in it is currently lost."
A live, tested, _better_ service already did the same job. The correct write-up is the reverse of
the one about to be filed: **a duplicate to delete, not logic to preserve.** Say so explicitly.

**Deleting a whole file is a bigger claim than deleting a function**

1. Grep the **filename** across all `*.js`.
2. Grep the file's **exported symbol names** across the _whole repo_, including `.html`, `.json`,
   manifests, READMEs and agent instructions.
3. Grep for **computed dynamic imports** (`import()` with a template literal or variable); check
   routers and lazy-loader registries specifically.
4. **Quarantine before deleting.** Move it to `_deprecated/` (or a scratch branch), run the full test
   suite and the production build, then delete for real in a follow-up commit.
5. **Re-grep after deletion; removals cascade, and not locally.** Deleting a function orphans its
   import; deleting its last consumer orphans what _that_ imported; that can orphan a CSS rule. One
   real chain: removed `PromptDialog` → orphaned `MobilePrompt` import → `MobilePrompt` had zero
   callers → removing it orphaned `.mobile-prompt-content` in the stylesheet.

---

#### R6. Try/catch as control flow 🔴

Distinct from R1: the exception isn't swallowed, it's used to handle a state that should have been
checked up front.

**Signals**

- `try { x = obj.a.b.c } catch { x = fallback }` instead of optional chaining or a guard
- Throwing to signal "not found" instead of returning `null`/`undefined`
- A `catch` containing the actual expected-path logic rather than error recovery
- `JSON.parse` in a `try` used as an "is this JSON?" test where the origin of the string is knowable

**Check:** for each `try`, was the condition that triggers `catch` knowable _before_ the call? If
yes, it should be an `if`. (When both R1 and R6 apply to one block, write it up once with
`Rule #: 1, 6`.)

---

#### R7. Type-safety theater 🔴 _(TypeScript only; skip plain JS)_

- `any` used to make an error disappear rather than modeling the shape
- Non-null assertions (`!`) on values that can genuinely be null
- `as unknown as T` double-casts; `@ts-ignore` / `@ts-expect-error` with no explanation
- Return types or generics that lie (`Promise<T>` for something that can resolve `undefined`)

**Check:** for each occurrence, was the type problem _fixed_ or just _hidden from the compiler_?

---

#### R8. Hallucinated or unverified APIs and dependencies 🔴 _(new)_

Generated code can look right and call things that don't exist, or exist at a different version.

**Signals**

- An import of a package missing from the manifest/lockfile, or a symbol the package doesn't export
- A method that doesn't exist on the object, or exists only in a newer/older major version
- Invented config keys (bundler, linter, CI) that are silently ignored
- A new dependency added for a three-line job, or one with a near-miss name of a popular package
  (**typosquat / "slopsquatting"**: models invent plausible package names that attackers register)
- Deprecated APIs used because they dominate older training data

**Check**

1. Every new import resolves **and** the build/typecheck actually runs (an unused import never fails).
2. For every new dependency: does it exist on the registry under that exact name, who maintains it,
   how old/popular is it, what is its install-script footprint? Pin it.
3. For every non-obvious config key or API call: find it in the **official docs for the installed
   version**, not in the generated code's confidence.
4. 🔒 Any dependency touching auth, crypto, parsing of untrusted input, or install-time scripts goes
   to a human.

---

### 🟡 Medium severity

#### R9. Test theater 🟡 _(new; 🔴 when it "covers" a 🔒 or data-loss fix)_

Tests that produce confidence without producing evidence.

**Signals**

- Assertions on a mock's own return value; `expect(mock).toHaveBeenCalled()` as the _only_ check
- A test that passes with the fix reverted (Part 7.2)
- A file-scoped mock that removes the code under test from reach (Part 7.1)
- `expect(true).toBe(true)`, empty `it()` bodies, `it.skip`/`xit` left behind, `sleep()`-then-assert
- Snapshot tests regenerated wholesale to make a diff go green
- Tests that mirror the implementation line by line, so any refactor breaks them and any bug passes

**Check:** for each test attached to a fix, revert the fix and confirm the test fails _for the
right reason_.

---

#### R10. Indirection with zero added logic 🟡

**Signals**

- A function whose entire body is one call to another
- A wrapper that only renames a function "for API consistency"
- A factory with exactly one call site that could be inlined

**Check:** count lines of logic (not JSDoc). If the body is a single expression and the wrapper adds
no error handling, transformation or caching, it is indirection for its own sake. (Exception: a
seam that exists so tests or a platform boundary can swap the implementation. Confirm with the
author.)

---

#### R11. Duplicated logic instead of reuse 🟡

The mirror image of R10: instead of extending existing logic, the tool reimplements a
slightly-modified copy elsewhere.

**Signals**

- Two functions with near-identical bodies and only a constant or condition swapped
- A validation block re-checking a shape another function in the file already checks
- Copy-pasted markup blocks differing by one prop or class

**Check:** before treating a block as novel, grep for similar variable names or validation shapes in
the same directory. If two blocks are >80% identical they should probably be one parameterized
function.

---

#### R12. Inconsistent patterns across siblings 🟡

**Signals**

- Two adjacent files solving the same problem differently (try/catch vs `.catch()` chain)
- One view `return`s after an error; another falls through
- Dynamic imports sometimes wrapped in try/catch, sometimes chained

**Check:** for any pattern in a file you are editing, search sibling files for the same problem. If
they differ without a reason, normalize toward the better one. This rule _needs a neighbor to
compare against_: a post-remediation re-check must include siblings of the changed files.

---

#### R13. Side effects at module load time 🟡

**Signals**

- DOM mutation (`document.head.append…`) at module top level
- `addEventListener` / `setInterval` outside any exported function
- A `<style>` tag injected from a `const` initializer

**Check:** read module scope (outside any function) of every audited file. Only the entry point or a
deliberate plugin should touch the DOM or register listeners at import time.

**Standard remediation:** strip the side effect, keep the export, and move the trigger to an
explicit init call in the entry file _before_ the first read of the global it publishes.

1. **Wrap the init in `try`/`catch`** following the other init calls. Existing `window.x?.` guards
   only help if a failed init is caught rather than aborting module evaluation.
2. **Verify the ordering claim, don't assume it.** ES-module imports all evaluate before the
   importer's body, and `<script type="module">` is deferred, so `document.readyState` is already
   `interactive` when the entry runs, and an init that defers on `readyState === 'loading'` still
   publishes synchronously. Confirm in code.
3. **Grep for other readers of the global first.** Any module-scope read anywhere in the graph depended
   on the old import-time ordering.

---

#### R14. Stale or misleading comments 🟡

Different from R18: these aren't merely redundant, they are _wrong_.

**Signals**

- `// TODO: add validation` above code that already validates
- `// temporary fix` / `// hack for now` with no ticket and no sign of revisiting
- A comment describing behavior the code no longer has

**Check:** for every TODO/FIXME/HACK, verify the described gap still exists. If the code already
does what the comment says is missing, delete the comment.

> ⚠️ **A comment describing a past fix is evidence, not noise.** A line like
> `// Handle click to show picker (fixes issues where appearance:none hides the trigger)` above an
> _empty_ handler matches R18's "restates the code" signal, yet reading it is what _proves_ the handler
> is dead: the workaround it names was later abandoned. Before deleting a comment that names a bug,
> check whether the fix is still in place. If the comment is the last record of _why_ the code looks
> strange, it is archaeology: report it here (stale), not under R18 (trivial).

---

#### R15. File and module bloat 🟡

Not slop by itself, but a strong correlate: files that outgrow what a reviewer can hold in their
head accumulate duplication (R11), dead code (R5) and indirection (R10) because nobody re-reads the
whole file before adding to it.

**Signals**

- A file exceeds `<file-size-limit>`
- A file has grown across several AI sessions without a matching refactor
- One file mixes responsibilities (a view that also defines validation, formatting, API calls)

**Check:** line-count every file in scope; anything over the limit gets a note even if no other rule
fires. **Don't bundle a split-this-file refactor into an unrelated cleanup**; call it out as a
corrective action in the same report.

---

#### R16. Framework-specific slop 🟡 _(React shown; apply the idea to Vue/Svelte/Angular)_

**Signals**

- `useEffect` used to derive state that could be computed during render
- Missing/incorrect dependency arrays (stale closures, effects that refire)
- `key={index}` on a list that can reorder or filter
- State duplicated in `useState` that is derivable from props
- Fetching in an effect with no cancellation/ignore flag

**Check:** for every `useEffect`, is it syncing with something _external_ (DOM, subscription,
network)? If not, it's probably slop. For every `.map()` key, confirm a stable identifier.

---

#### R17. Scope creep and drive-by changes 🟡 _(new)_

AI tools are eager. A diff that touches more than the task needs is itself a finding.

**Signals**

- Reformatting, import reordering, or renames in files the task didn't name
- Unrelated dependency bumps, lockfile churn, config "improvements"
- Deleted or weakened tests, widened lint ignores, loosened types to get green
- Added abstractions (config options, feature flags, base classes) for one caller
- New files/folders that duplicate an existing convention

**Check:** read the **diff stat first**, before the code. For each file not named by the task, ask
why it changed. Prefer rejecting the stray hunks over reviewing them.

---

### ⚪ Low severity

#### R18. Trivial or narrative comments ⚪

**Signals**

- Comment is the name rephrased: `// Navigate to a new route` above `navigate()`
- Numbered scaffolding: `// 1. Form setup`, `// 2. Account selection`
- Comment restates a condition or a `createElement` call
- "Can be removed in production": it never was

**Check:** if deleting the comment loses zero information, it's slop. Apply the R14 archaeology
warning first. If more than ~30% of a file's comments add nothing, flag the file rather than every
line.

---

#### R19. Hardcoded values that bypass the design system ⚪

Covered in depth in **[Part 5](#part-5-design-token-hygiene)**. Signals: raw hex/`rgba()`, magic
`z-index`, magic pixel values, fallback literals in `|| 3000` chains that should resolve from
constants. Severity is ⚪ _unless_ the value is a fallback behind a token that doesn't exist (the
literal silently wins) or a token reference that a purge can strip (🔴 R3-B).

---

## Part 4. False-positive checklist

Not everything that looks like slop is slop. Run this **as you go** (checking blame while the file
is open is cheaper than reopening thirty files at the end).

1. **Security- or ownership-related? Stop.** Don't run this checklist to decide whether to remove it.
   Flag for author confirmation (see R4 carve-out) and move on.
2. **Confirm with search, not memory**, then ask whether it is _unreferenced_ or _provably_ dead.
   They need different evidence. An empty function body is a **proof** (it cannot do anything; no
   device test or `git blame` can overturn that). Zero callsites is weaker (this repo doesn't call
   it). Don't gate a proof on a device test; that only manufactures delay.
3. **Check blame and PR context.** A guard added in a bug-fix commit is not the same as one left
   reflexively.
4. **Check test coverage.** A "dead" branch exercised by a test is either not dead or the test is
   stale. Note which.
5. **Consider forward-looking code.** A parameter that doesn't fire _yet_ may serve an in-progress
   feature; check open branches. **An empty body is different:** no future feature justifies keeping a
   body that is empty _now_. Whether to delete the scaffold or fill it in is the author's call, so
   keep it "User Review Required" and record the decision either way.
6. **When in doubt, downgrade rather than delete.**
7. **Be suspicious of a clean sweep.** Zero "false positive / intentional" verdicts across dozens of
   findings means you are pattern-matching. Do one more pass looking for reasons each item might be
   deliberate.
8. **Be equally suspicious of airtight justifications.** Spot-check the two most persuasive findings
   against the code before filing. "The knowledge encoded in it is currently lost" would have
   prevented a correct deletion.
9. **Calibrate in both directions, and record the correction.** Inflated severity is easier to live
   with than understated severity because it looks like diligence. The instance: a finding filed 🟡
   "consistency only" because _"the plugin accepts both spellings and the build compiles."_ The
   premise held; the inference didn't. Probing showed one spelling was shipped as an invalid media
   query. **"The build succeeded" was accepted as evidence about the build's _output_.** Record the
   re-rank in the report rather than silently correcting the number.
10. **Ask whether the check you ran could have failed.** "I grepped and found nothing" passes
    identically whether the code is dead or the grep is wrong. "I diffed the pre- and post-change
    builds" can fail, and when it did, it showed 14 of 15 "missing" selectors had been absent before
    the session began.

---

## Part 5. Design-token hygiene

The operational playbook for keeping raw colors, pixels and magic numbers out of UI code. Philosophy
lives in R19 and Part 1 #8; this part is what to do with a warning in front of you.

### 5.1 What counts as a violation

| Signal                                                        | Fix target                            |
| ------------------------------------------------------------- | ------------------------------------- |
| Raw hex / `rgb()` / `hsl()` / `rgba()` colors                 | color token                           |
| Magic pixel values: `44px`, `8px`, `12px 16px`                | spacing / size / radius token         |
| Magic `z-index`: `9999`, `10000`                              | named layer constant                  |
| Magic durations/easings: `300ms`, `ease-out` in many places   | motion token                          |
| `\|\| 3000` fallbacks behind a constant                       | resolve from the constant only        |
| `var(--x, <literal>)` where `--x` is **not defined anywhere** | see 5.4: a hardcoded value in costume |

### 5.2 Token architecture (design the system so cleanup is easy)

If you are _setting up_ tokens rather than cleaning them, these choices decide how painful cleanup
will be:

- **Three tiers.** _Primitive_ (`--blue-500`, raw scale) → _semantic_ (`--color-primary`,
  `--color-text-muted`, role-based) → _component_ (`--button-bg`). UI code consumes semantic and
  component tokens only. Dark mode and rebrands change the semantic mapping, not the call sites.
- **Name by role, not by value.** `--color-text-muted`, never `--gray-500` in components,
  never `--spacing-12px`.
- **One source of truth.** If tokens exist as both CSS variables and JS constants, generate one from
  the other or add a **parity test** asserting they agree. Two hand-maintained copies drift.
- **Same value in every load phase.** If a pre-load/critical stylesheet redefines a token, the
  value must match the main file or you have two truths. If it must differ, record why.
- **Units.** Use `rem` for type and spacing so browser font-size settings are respected; reserve
  `px` for hairlines. If you have no border-width token, add one in a _design_ pass so borders don't
  need the template-literal trick in 5.5.
- **Cover the categories you'll need:** color, spacing, radius, type scale, line-height, elevation
  (shadow), z-index layers, motion (duration + easing), breakpoints, touch-target minimums.
- **Pair-validate color.** Define foreground/background pairs and test contrast (WCAG AA: 4.5:1 body
  text, 3:1 large text and UI components) as part of the token tests, not by eye.

### 5.3 What your lint rule actually checks

Write down, once, exactly what your custom/stock rule covers. Most are narrower than their name.
A representative `no-raw-style-values` rule:

| Assignment form                                            | Checked? | Detail                                        |
| ---------------------------------------------------------- | -------- | --------------------------------------------- |
| `el.style.prop = '0px'` (string literal)                   | ✅       | if the string matches the raw regex           |
| `` el.style.cssText = `...` `` with **zero** `${}`         | ✅       | cooked text is matched                        |
| `` el.style.cssText = `...${TOKEN}...` `` (≥1 expression)  | ❌       | rule skips templates that contain expressions |
| `Object.assign(el.style, {...})`                           | ❌       | not a plain assignment: **known blind spot**  |
| `el.style.setProperty('--x', '1px')`                       | ❌       | not covered                                   |
| `rem` values, `rgba()`, bare unitless numbers (`0`, `50%`) | ❌       | regex only matches `px` and hex               |

A typical regex: `/(?:^|\s)(?:-?\d+(?:\.\d+)?px\b)|#[\da-fA-F]{3,8}\b/`.

> ⚠️ **The one-expression escape hatch is a trap.** A pointless `${x}` interpolation silences the
> rule without fixing anything. Only put an expression in `cssText` when it is a _real_ token
> reference. Likewise, never route a violation through a blind spot (`Object.assign`,
> `setProperty`) to dodge the rule. Close the blind spots in the rule instead.

Pair JS lint with **stylelint** for stylesheets (`color-no-hex`, `declaration-property-value-
disallowed-list` for raw `px` on spacing properties, a `custom-property-pattern`), so both surfaces
are policed.

### 5.4 Fallback literals: a token reference is not proof of compliance

A `var(--token, fallback)` _looks_ tokenized and greps clean. Before believing the site is
compliant, `rg -- '--token:' <css>` to confirm the token exists.

- **Token doesn't exist:** the fallback always wins. Report it separately from plain literals. Adding
  a token (e.g. a z-index scale) is a design-system change with global consequences, not a cleanup.
- **Token exists and is guaranteed loaded:** the fallback is dead. Remove it
  (`var(--color-primary, #00d084)` → `var(--color-primary)`).
- **Code renders _before_ tokens are guaranteed (update dialogs, error overlays, service-worker
  pages):** the raw fallback may be deliberate. Swapping in a bare `var()` would drop the
  declaration entirely when the token is absent, and adding a fallback just recreates the literal.
  Keep it, add a one-line justified disable (5.6), and ask _why_ it's raw before converting.

### 5.5 Decision workflow (stop at the first match)

```
1. Renders before tokens are loaded?      → keep the literal + one-line justified disable.
2. Exact-value token exists?              → use it.  EXACT match only.
3. Value is a bare border width, e.g.
   `1px solid var(--x)`?                  → use the project's border pattern
                                            (`1px solid ${COLORS.BORDER}`), or add a
                                            border-width token in a design pass.
4. Zero / unitless-able value?            → '0px' → '0'   (min-height, opacity, flex…)
5. No token exists, purely layout?        → one-line justified disable with the reason,
                                            and report it as "no token exists".
6. The same magic value keeps recurring?  → a named local constant in that module
                                            (e.g. NAV_SIZE used 4×, so related measurements
                                            can't drift apart). Propose a token to the author
                                            only after that.
```

**Never snap to a _nearby_ token (`6px` → `8px`).** That is a visual change the author decides.
**Never invent a token** in a cleanup pass. If the author _rules_ that a value should snap
(e.g. "that 6px gap should be the 4px token"), apply it and record the ruling.

### 5.6 Mechanics that will bite you

**a) `eslint-disable-next-line` is single-line.** It skips exactly one line. A multi-line
justification above it makes "next line" resolve to another _comment_, so the rule still fires and
you also get an `Unused eslint-disable directive` warning. Put the reason after `--` on the same
line, directly above the statement:

```js
// eslint-disable-next-line local/no-raw-style-values -- 6px horizontal padding has no exact token (scale is 4/8); snapping would be a design change
badge.style.padding = '2px 6px';
```

**b) A second, bare `Linter` can fail on your directives.** If any test lints source files with its
own `Linter` instance and registers only some plugins, a `local/...` disable directive makes it fail
with _"Definition for rule … was not found."_ Register no-op stubs for every custom rule that can
appear in a directive, and **add a stub whenever you add a new custom rule**:

```js
local: {
  rules: {
    'no-raw-style-values': { create: () => ({}) },
    'no-empty-catch': { create: () => ({}) },
  },
},
```

**c) The purge guard.** CSS purge tools strip custom properties that nothing in the scanned content
references. JS **constants** are plain strings and immune; a **`var(--new-token)` referenced only
from JS** can be stripped from the shipped CSS. Keep a test along the lines of _"every token used
from JS survives the production purge"_, and run it whenever you add a CSS variable referenced only
from JS. This turns "should be fine" into a verified claim.

**d) Same token, different value per phase.** If a critical stylesheet overrides a token
(`--spacing-md: 16px` vs the main file's `0.75rem`), then `var(--spacing-md)` and a JS constant for
the same name can disagree. Prefer the JS constant where exactness matters, and fix the drift
properly in a design pass.

### 5.7 Patterns by shape

```js
// single px property → exact token
timeText.style.marginTop = SPACING.XXS; // was '2px'

// a font size that is the platform's anti-zoom floor
input.style.fontSize = FONT_SIZES.PREVENT_ZOOM; // was '16px'

// border line → the project's template pattern (real expression)
section.style.borderTop = `1px solid ${COLORS.BORDER}`;

// cssText block → real token interpolations (which legitimately un-gates the rule)
bar.style.cssText = `
  height: ${SPACING.XS};
  border-radius: ${SPACING.XXS};
`;

// unitless zero
field.style.minHeight = '0'; // was '0px'

// color fallback removal, where tokens are guaranteed loaded
// color: var(--color-primary, #00d084)  →  color: var(--color-primary)

// early-render / no token → justified single-line disable (5.6a)
// eslint-disable-next-line local/no-raw-style-values -- <specific reason>
```

### 5.8 Closing a new warning

Every warning lands in exactly one bucket:

- **Exact token exists** → convert it (5.7). Done.
- **No token exists** → first convert unitless-able values (`'0px'` → `'0'`), then add a one-line
  justified disable and **report "no token exists"** to the author. Do not invent, do not snap.

### 5.9 Keep it at zero: ratchet, don't rely on discipline

Once a one-time cleanup reaches **0 warnings**, make it stay there:

- Run lint in CI with `--max-warnings 0` for the scoped directory (or fail on _new_ warnings against a
  baseline if you can't reach zero yet).
- Keep the token-guard tests in the default test run.
- Mention the policy in `AGENTS.md`/`CONTRIBUTING.md` so AI tools get it before writing code.
- Treat a growing count of `eslint-disable local/…` directives as a smell worth a quarterly audit:
  each is either a missing token (design decision) or a deliberate early-render exception.

### 5.10 Verification loop (every batch)

```bash
npx eslint <changed-files>                 # must be clean
npx prettier --check <changed-files>       # long import lines get re-wrapped by --write
<test> <token-guard-tests>                 # token integrity + purge guard
<test> <tests-for-the-view-you-touched>
<lint>                                     # whole-scope count must not rise
```

`prettier --write` on an import line is expected after adding a name to a long import.

---

## Part 6. Planning and shipping design improvements

How to turn "the UI feels generic / broken / inconsistent" into a sequence of safe, verifiable
changes. This applies to a UX audit's output, a redesign, or a themed refresh.

### 6.1 Prioritize by impact, risk and who has to decide

For every candidate, score three things and then order the list:

| Axis              | Question                                                           |
| ----------------- | ------------------------------------------------------------------ |
| **Impact**        | Who is affected, how often, and is something currently _broken_?   |
| **Risk**          | How much of the app does it touch? Can it be reverted alone?       |
| **Decision gate** | Does it need a human design decision _before_ any code is written? |

Rules of thumb:

- **Fix broken things before decorating.** A first-run experience that shows "Welcome back!" to a new
  user, or a micro-interaction that never fires, outranks a nicer palette.
- **Decision-gated items start with the decision, not the code.** Palette and typography need an
  owner's choice among options _first_. Don't implement a "recommended" option no one approved.
- **Plumbing before the global flip.** Ship the infrastructure (tokens, classes, animation hooks)
  that a high-risk change will rely on _before_ that change.
- **Global changes ship alone.** A change to design tokens affects everything; it gets its own commit,
  its own QA pass, and its own rollback path.
- **Ongoing cleanup runs in parallel** only when it touches disjoint files; otherwise it conflicts
  with the feature work it is supposed to support.

### 6.2 Per-item template

Every item in a plan carries the same six fields. If one is missing, the item isn't ready.

```
### N. <Title>   (Priority: HIGH/MED/LOW · Risk: Low/Med/High · Decision needed: yes/no)

Problem        What is wrong, observed (not assumed). Include evidence or a repro.
Solution       The approach, and the alternative considered. Snippets are illustrative,
               not final: re-read the code before applying them.
Files          Exact files to change; new files marked NEW. Re-derive paths at execution time.
Verification   Concrete user actions + automated tests ("clear storage, log in fresh → see X").
Success        Observable acceptance criteria (see 6.7).
Rollback       How to undo it alone (revert commit, flag, token flip).
```

### 6.3 Workstream playbooks

#### A. Empty states and first-run experience

- **Detect first-run from data, not from assumptions.** "No items yet" is a data condition; copy like
  "Welcome back!" is factually wrong for a new user. Derive the greeting from state
  (`hasItems`), not from being logged in.
- **Beware the loading flash.** `items.length === 0` is also true _before data hydrates_. Distinguish
  _loading_ from _empty_ from _error_, or new-user copy will flash at returning users.
- **Make the empty state a call to action.** One headline that names the benefit, one sentence that
  says how little effort it takes, and **one primary button visible without scrolling**.
- **Be truthful in microcopy.** "It only takes 3 clicks" must remain true; copy that can rot
  belongs in a constant or a test, not a hunch.
- **Extract inline styles to classes** while you're there (see F); empty states are a classic home
  for 30+ inline style assignments.
- **Accessibility:** a real heading, a button that is a `<button>`, focus management when the empty
  state replaces content, and `role="status"` only for content that appears dynamically.
- **Verify three states:** fresh storage → empty state; add one item → normal state; returning user
  → normal state, unchanged greeting.

#### B. Motion and micro-interactions

- **Animate changes, don't rebuild the world.** If a full re-render replaces DOM nodes, entry/exit
  animations can't run reliably because the node being animated is destroyed. Prefer **keyed
  reconciliation**: keep the container, diff old vs new IDs, _prepend/insert_ new nodes (animate
  in), _animate out then remove_ deleted nodes, leave the rest alone. A "re-trigger after
  re-render" hack (remove class, force reflow, re-add) is an acceptable fallback, not the design.
- **Never gate a data mutation on `animationend`/`transitionend` without a fallback.** Those events
  don't fire if the element is hidden, the animation is disabled (`animation: none`, reduced-motion
  overrides), or the tab is backgrounded, so "delete it when the animation ends" can mean _never
  deleted_. Mutate the data immediately and animate the DOM exit, or use a timeout fallback, or
  `element.animate(...).finished` with a catch.
- **Prefer `transform` and `opacity`.** Animating `max-height`, `padding` and `margin` triggers
  layout every frame. For collapse-on-delete, animate `transform/opacity` first, then collapse the
  height in one step (or use `grid-template-rows: 1fr → 0fr`).
- **Stagger with CSS, not chained timeouts.** `animation-delay: calc(var(--i) * 80ms)` survives
  re-renders; `setTimeout(…, delay + 400)` guesses at how long the animation takes and drifts when
  someone changes the duration.
- **Put durations and easings in tokens** (`--motion-fast`, `--ease-out`) so timing is one decision.
- **Respect `prefers-reduced-motion: reduce`.** Replace motion with an instant or fade-only
  equivalent; do not remove the _state change_. Test it explicitly.
- **Keep frequent actions fast** (≈150–300 ms). A 400 ms flourish on something done fifty times a day
  becomes friction.

#### C. Color palette changes

- **It is a design decision; present 2–3 options with rationale** and get a choice. Record it.
- **Generate ramps in a perceptual space** (OKLCH/LCH) or hand-tune. Fixed-hue HSL ramps have uneven
  perceived lightness, so "500" of one hue can look far brighter than "500" of another. Verify each
  step visually and by contrast ratio.
- **Contrast decides foreground color, not taste.** A saturated amber/yellow primary usually needs
  _dark_ text; white-on-amber fails AA. Check every foreground/background pair the new brand color
  touches: buttons, links, badges, selected rows, focus rings, disabled states.
- **Keep semantic colors semantic.** Success/error/warning don't change with the brand; check the new
  primary isn't confusable with them (an amber primary beside a warning amber).
- **Hunt the hardcoded survivors.** Token changes don't reach: raw `rgba(...)` highlights, chart
  library palettes, canvas drawing code, SVG fills, inline styles, `<meta name="theme-color">`, PWA
  manifest `theme_color`/`background_color`, favicons/icons, splash screens, email templates, OG
  images, screenshots in docs.
- **Charts need their own palette** that is distinguishable in grayscale and for common color-vision
  deficiencies, not just "brand color plus tints."
- **Flip it in one commit**, with before/after screenshots of every major view and state (empty, error,
  hover, focus, disabled, dark). Risk is High; treat it so.

#### D. Typography changes

- **Load fonts deliberately.** `preconnect` to the font host; request only the weights/styles you
  use; set `font-display` (`swap` for body, consider `optional` for decorative display faces);
  consider self-hosting and subsetting; define a **metric-adjusted fallback** (`size-adjust`,
  `ascent-override`) to limit layout shift when the web font arrives.
- **Verify what the font actually does** before writing it into a rationale. Claims like "has old-style
  figures" are checkable in the font's specimen. Numerals matter for financial/tabular content:
  you want **lining, tabular** figures there (`font-variant-numeric: tabular-nums lining-nums`),
  and many display serifs don't provide them.
- **Monospace for numbers is optional.** `tabular-nums` on the UI font often gives column alignment
  without the personality shift. Apply any mono/numeric rule through an opt-in hook
  (`[data-numeric]`), not a blanket selector list that must be kept in sync.
- **Adjust the type scale together with line-height and wrapping.** A larger heading size changes
  line breaks on narrow screens; check the smallest supported width.
- **Check licensing** and provide a robust system fallback stack.

#### E. A signature visual element

A distinctive moment tied to the product's _core action_ (e.g. a receipt-style confirmation when a
transaction is saved). Good ones are:

- **Purposeful:** they confirm the thing the user just did, and they reinforce the product's identity.
- **Brief and skippable:** well under a second; never blocks the next input.
- **Accessible:** the information is also announced (`aria-live="polite"`), and there is a static
  variant under reduced motion.
- **Cheap:** no layout thrash, no new heavy dependency.
- **Built on the plumbing already shipped** (motion tokens, keyed list updates), so it should be
  scheduled _after_ them.

#### F. CSS consolidation

- **Measure before you cut:** bytes, rule count, duplicate selector definitions, inline-style
  assignments per file. You need a baseline to prove improvement (and Part 7.8's baseline build).
- **Phase 1: move _static_ inline styles into classes.** Find the 3–5 most common patterns per
  component and give them classes. Be disciplined: dynamic values (computed widths, per-item CSS
  variables) legitimately stay in JS. Prefer component classes; a small, deliberate utility set
  (`.flex-between`, `.w-full`) is fine, but don't grow an ad-hoc, worse Tailwind.
- **Phase 2: deduplicate.** Collapse repeated definitions of the same pattern into one base class
  plus media-query overrides. Remove `-mobile-*` clones in favor of responsive base classes.
- **Phase 3: remove unused CSS: with R5's three questions.** "Never used" claims must survive the
  runtime-name, third-party and compound-selector checks.
- **DevTools Coverage is evidence, not proof.** It only shows what executed _in that session_; it
  misses error states, empty states, modals, hover/focus, print, and rarely visited routes. Combine it
  with static analysis and the dead-CSS test from R5.
- **Edit with an AST, verify with a parser** (R3-C); never regex-rewrite CSS.
- **One file at a time**, with a visual comparison after each.
- **Don't make a line-count percentage the acceptance test.** "Reduce by 40%" invites deleting live
  code to hit a number. Use outcome criteria (6.7).

### 6.4 Sequencing

Express order as dependencies, not calendar promises:

```
Phase 1 (independent, low risk)       fix broken behavior: first-run states, exit/entry motion
Phase 2 (plumbing + decisions)        motion tokens, utility classes; palette decision made
Phase 3 (global flips, each alone)    palette tokens → typography
Phase 4 (builds on phases 1-3)        signature element
Ongoing (disjoint files only)         CSS consolidation, inline-style extraction
```

### 6.5 Change-summary table

Keep one table so risk is visible at a glance and nothing is forgotten.

| #   | File              | Change type                    | Risk                   |
| --- | ----------------- | ------------------------------ | ---------------------- |
| 1   | `<view>`          | Modify greeting / re-trigger   | Medium                 |
| 2   | `<tokens-css>`    | Palette + font tokens          | **High** (affects all) |
| 3   | `<tokens-js>`     | Mirror constants if duplicated | **High**               |
| 4   | `<utilities-css>` | Consolidate and deduplicate    | **High** (layout risk) |
| 5   | `<new component>` | NEW file                       | Low                    |

Every **High** row gets its own commit and its own rollback line.

### 6.6 Rollback strategy

- Each change is a standalone commit that can be reverted alone.
- The palette/token commit is the highest risk: test thoroughly before merging.
- Consolidation proceeds file by file with a visual diff after each.
- Every animation change is verified with `prefers-reduced-motion: reduce`.
- For risky behavior changes, ship behind a flag where the cost is low.

### 6.7 Acceptance criteria: observable, testable, one per item

Write criteria a stranger could check in two minutes, and prefer outcomes over implementation:

| Weak                             | Strong                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Empty state looks better"       | First-run login shows the welcome heading and a visible primary button; adding an item switches to the normal greeting                                   |
| "Delete is animated"             | Deleted items slide out; the data is removed even with reduced motion on                                                                                 |
| "Color updated"                  | No purple remains in buttons, links, active states, charts, badges or the theme-color meta; all text pairs meet AA                                       |
| "view-styles.css reduced by 40%" | No duplicate definitions of the base view classes; no static inline layout styles in the targeted files; build CSS size not increased; visual diff clean |
| "Fonts changed"                  | Headings render in the new face; no layout shift above threshold; numerals in tables are tabular                                                         |

### 6.8 Plan hygiene: lint the plan itself

Run the traceability rule from Part 1 #10 on the plan _before_ executing it:

- Every item in the **priority list** has a **section**. (A plan that lists six priorities and has
  sections numbered 1-4 and 6 has silently dropped one, and the executor will never notice.)
- Every section has **files**, a **risk**, a **verification** and an **acceptance criterion**.
- Every file in the change-summary table appears in some section, and vice versa.
- Every acceptance criterion maps to an item (and nothing is un-testable).
- Snippets are labeled _illustrative_; line numbers are labeled _hints_ (Part 1 #14).

---

## Part 7. Verification and testing traps

These aren't slop patterns. They decide whether a fix is actually _covered_, and a change that looks
tested can be structurally untestable by the suite you reach for.

### 7.1 A file-scoped module mock permanently removes a code path from that suite

Module mocks (`vi.mock`, `jest.mock`) are hoisted and apply to the whole test file, not one test.
A suite that mocks a module to make _other_ behavior testable can quietly make your change
unreachable. Examples: a suite that mocks a service becomes the _only_ one able to render a
component that imports it; a suite that mocks a dialog with a **throwing** factory (correct for its
own purpose) can never reach the `onConfirm` handler where your fix lives.

**Check before extending an existing suite:** does any file-level mock exclude the code you
changed? If so, put the regression test in a **new file** whose mocks allow the path, and invoke
the handler directly (e.g. `Dialog.mock.calls[0][0].onConfirm()`).

### 7.2 Prove the regression test actually regresses

A green test proves nothing until you have seen it fail. **Revert the fix, run the test, confirm it
fails for the right reason, restore.** This catches the two failure modes that survive to review:
a test that passes without the fix (asserts nothing), and a test that fails for an incidental reason
(so it would keep passing after a real regression). A good reverted failure reads like the
user-facing symptom, e.g. _"promise rejected … instead of resolving"_ for a fix about
"the user is told nothing."

### 7.3 Make the reverted failure legible: sentinel data

For security and data-correctness fixes, seed the test with **recognizable sentinel data** so the
failing assertion _is_ the demonstration of the defect:

```
AssertionError: expected { goals: [ 'user-A-private-goal' ] } to be null
```

A reviewer who wasn't present for the revert sees the leak in one line.

### 7.4 A rejected import in a mock factory arrives wrapped

Test runners replace an error thrown by a failing mock factory with their own wrapper and keep the
original on `cause`. Asserting on `error.message` alone fails for the wrong reason. Unwrap first:

```js
const errorText = e =>
  [e?.message, e?.cause?.message].filter(Boolean).join(' | ');
```

### 7.5 Line endings: `core.autocrlf` makes `prettier --check` fail on files you never touched

With `core.autocrlf=true`, no `text=auto`/`eol` rule in `.gitattributes`, and Prettier set to
`endOfLine: "lf"`, any operation that rewrites the working tree (`git stash`/`pop`, fresh checkout,
some merges) rewrites files to CRLF, after which `prettier --check` fails on all of them. It is worse
than noise because it produces **false confidence in both directions**: failures appear on files
you didn't edit (inviting a blanket `prettier --write` that buries your real diff), and a genuine
formatting problem in a file you _did_ edit gets blamed on line endings and waved through.

**Check before believing a format failure**

1. `git --no-pager diff --numstat`: a file you never edited in the list means suspect CRLF.
2. Run `prettier --check` on the **pristine** version. If it also fails, it's pre-existing, not yours.
3. Don't use `git stash` to get a baseline (it is the thing that causes this). Use
   `git show HEAD:<path>` into a temp file **outside** the repo.
4. To normalize: `prettier --write` the affected files and confirm with `--numstat` that the content
   delta is still only your intended edits.

**Permanent fix:** commit a `.gitattributes` with `* text=auto eol=lf` _and_ keep
`endOfLine: "lf"` in the Prettier config. `text=auto` alone does not guarantee LF in a checkout
where `core.autocrlf` is on.

### 7.6 A shared test double that is a stub can make a test unpassable for any code

If the global test setup replaces `localStorage` with bare `vi.fn()` spies, `setItem` records the
call but stores nothing and `getItem` returns `undefined` for every key. A test that writes then reads
can **never** pass, whatever the application does:

```
GET_AFTER_SET=undefined   GETITEM_IS_MOCK=true   SETITEM_CALLS=1
```

This is easy to misdiagnose as a real regression: the suite is red, the assertion names a real key,
and the instinct is to edit the source.

**Check:** when a test fails on a persistence/storage assertion, first confirm the harness can
express it. `setItem` then `getItem` in one test answers that in one line. If the double is a stub,
install a real in-memory implementation **locally** (in that file's `beforeEach`); don't change the
shared setup, which shifts the baseline for every other suite.

### 7.7 A pre-existing red test is a fact to establish, not a nuisance to route around

A suite can be red before you touch anything. Establishing that costs one baseline run and saves a
wrong attribution in the write-up. Conflating a pre-existing failure with your work can bury both:
in one round the "pre-existing" failure turned out to be a cross-user data bleed plus a broken test
double.

**Check:** run the suite on the untouched baseline (use a clean checkout or worktree rather than
`git stash`, see 7.5), record whether it fails, and report it as pre-existing _with the evidence_.

### 7.8 Diff the build against a baseline before blaming or trusting your own change

After a bulk edit, "this selector is missing from `<dist>`" is ambiguous. It may be your change, or it
may have been purged before you started. Both readings look identical from inside the session.

**Check:** build the pre-change tree and compare the same tokens. In one sweep, 15 selectors looked
missing; the baseline showed 14 were _already_ absent and one was genuinely lost, traced to a class
with no consumer whose keyframes a safelist name-match had been keeping alive. Without the baseline
that is either a missed regression or a false alarm, reported with equal confidence.

```bash
# Before editing; keep this shell open or save BASE for the comparison.
BASE=$(git rev-parse HEAD)
# After editing, use the saved pre-change reference:
git worktree add ../baseline "$BASE" && (cd ../baseline && <build>)   # baseline artifact
<build>                                                            # your artifact
diff <(rg -o 'your-pattern' ../baseline/<dist>) <(rg -o 'your-pattern' <dist>)
```

### 7.9 Custom lint rules need a stub in every harness that lints source

If any test spins up its own linter instance over source files, it must know every custom rule that
can appear in a disable directive (see 5.6b). Add the stub _when you add the rule_, and run that test
after adding any directive.

### 7.10 Know what your test environment can't do

DOM simulators (jsdom/happy-dom) have no layout and often no real animation events. Tests that
"prove" an animation ran, an element is visible, or a media query applied are usually proving the
mock. Cover those with a real-browser test or a documented manual step (6.7), and be explicit about
which one you did.

---

## Part 8. Findings to implementation

A report is a list of observations; a plan is a set of changes about to land in a working app. Some
findings need a harder gate before they cross that line.

### 8.1 Report schema

Every finding follows one shape so audits stay comparable across sessions:

```
### [R#] <short title>
- **File:** path/to/file
- **Line(s):** 42-48                     (a hint: re-locate by search before editing)
- **Severity:** 🔴 High / 🟡 Medium / ⚪ Low        [+ 🔒 if security-sensitive]
- **Snippet:** (short excerpt, not the whole function)
- **Verdict:** slop / false positive / intentional (confirmed with author)
- **Action:** fixed in this session / flagged for follow-up / left as-is (reason)
- **Mechanism verified against source:** <the specific thing you read that makes it true>
- **Recommended fix:** <untrusted: see below>
```

**`Mechanism verified against source` is required** for any 🔴 and for any finding you propose to
fix. A stated mechanism is a hypothesis until someone has read the implementation of every function it
names. Write the line _before_ filing, naming exactly what you read, for example _"verified
`invalidate` is declared `async` at `Cache.js:394`, so it returns a promise and cannot throw
synchronously."_ If you can't fill it in, the finding isn't ready, and the thing you couldn't verify is
exactly what the fix will get wrong.

**Treat the recommended fix as untrusted.** Include it, say so, and state the mechanism you verified
next to it. The author needs both what you believe is wrong and what you have confirmed.

### 8.2 Report hygiene

- **Group by rule number** so repeat offenders show up across files and sessions.
- **One write-up per issue, not one per rule it matches.** A `catch` that both swallows an error (R1)
  and is used as control flow (R6) is one entry with `Rule: 1, 6`. Otherwise summary counts overstate
  how many distinct problems exist.
- **Line numbers decay.** They are hints; a plan that looks precise makes the executor stop searching.
  Real examples: a comment listed once actually appeared twice (the second in a function the plan never
  mentioned); "catch blocks at 258/327/401/485" were really at 251/315/384/464; a "1268-line file" was 1271. _"The cited lines don't contain this"_ is a finding about the **report**, and the response
  is to re-locate the code, not to conclude the finding was closed. Budget a search step per finding.
- **🔒 findings get a restricted Action.** Always "flagged for author confirmation" or "left as-is
  (reason)", never "fixed in this session". If you catch yourself writing "fixed" next to 🔒, stop and
  route it through the gate below.
- **Record re-ranks.** If severity changes on re-derivation, say so in the report and add a line to the
  false-positive list (Part 4 #9).

### 8.3 The implementation-plan gate

**Always call out as "User Review Required"; never bundle into a regular numbered phase:**

- Any 🔒 security-sensitive finding. "The grep says it's unreachable" is not the same authorization as
  "a person looked at this and agreed."
- Any destructive or irreversible operation: data wipes, whole-file deletions, migrations. The cost of
  asking is far below the cost of being wrong.
- Anything the false-positive checklist _downgraded_ rather than confirmed.

**Traceability.** Before finalizing, cross-check the plan line by line against the report. Each
finding lands in exactly one bucket:

- **Scheduled** in a phase, with a file reference matching the report
- **Deferred**, with a one-line reason ("depends on X shipping first")
- **Downgraded** to false positive / intentional, with the reason noted

It is easy to schedule the dramatic findings and quietly drop the smaller ones sitting next to them.

### 8.4 Before implementing: re-read, re-derive, re-rank

**Re-read the code before applying the prescribed fix, and re-rank the severity.** A report describes
the defect's _apparent_ mechanism, and that description can be wrong in a way that turns the fix into
a no-op.

- _Case 1._ "The catch blocks import the dialog before reporting the failure, so the original error is
  lost." Reading the source showed `console.error` already ran first; the diagnostic was never lost.
  The real defect was narrower: the secondary `await import()` sat _inside_ the catch, so a failed
  chunk threw while handling the original error, leaving the user with no feedback and an unhandled
  rejection. Implement _that_, not the description.
- _Case 2._ "A `catch {}` may silently swallow a cache error; remove it or add a `console.warn`." Both
  were no-ops: the guarded function was `async`, so the `catch` could never run (R2-A). Implementing
  the prescription exactly would have deleted four lines, changed no behavior, and left a cross-user
  data bleed fully intact while the report showed the finding resolved. Re-deriving the fix from the
  mechanism actually found also surfaced a third defect the report missed (the sync/async trap, R2-C).

**Ask what a fix derived from a wrong premise would leave behind.** When the mechanism doesn't survive
contact with the code, stop and re-scope before writing any of it.

### 8.5 Verification plan: minimum bar

- Run the automated tests covering **every file touched**, not just those tied to the highest-severity
  fix.
- **Prove each regression test fails without its fix** (7.2), and make the failure legible (7.3).
- **Fix the contract, not the symptom, when a pattern repeats.** Don't hand-edit 13 call sites inside a
  security fix; enforce the ordering in one place and record the rest.
- **Run lint, format and build once per phase**, not only at the end, so a bad phase-1 change isn't
  buried under phase-2 and phase-3 diffs.
- **Re-grep for newly orphaned code after every deletion** (R5, step 5). Cascades are the norm.
- **Write UI-visible QA as a concrete user action**: "click delete, confirm the undo toast appears
  and dismissing it does not re-delete", not "verify the flow works."
- **Re-run the audit on the changed files plus their siblings** before closing the round. It catches
  regressions the fix introduced (a swapped-in helper missing an import) and half-finished migrations
  (an alias removed in one file but still called from another).

---

## Part 9. Runbook

Use this to kick off a new audit round, including a re-check after a remediation pass.

### 9.1 Steps

1. **Pick a scope.** A full `<src>` sweep, one phase's touched files, or the directories a recent AI
   session modified. A post-remediation re-check needs only the changed files **plus their siblings**
   (R12 needs a neighbor to compare against).
2. **Read the diff stat first** when auditing an AI session (R17). Unrequested files are findings.
3. **Work rule by rule across the scope, not file by file.** Sweeping every `catch` before moving on
   keeps the pattern fresh and surfaces cross-file inconsistencies a single-file read misses.
4. **Apply the [false-positive checklist](#part-4-false-positive-checklist) as you go**, not as a
   final pass.
5. **Write the report** using the [schema](#81-report-schema), grouped by rule.
6. **Turn it into a plan** through the [gate](#83-the-implementation-plan-gate): phased by severity,
   🔒 items separate, every finding traced to a destination.
7. **After remediation, re-run steps 1-5 on the changed files** and close the round.

### 9.2 Search commands (ripgrep, POSIX shell)

| Goal                                                     | Command                                                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| All catch blocks / promise catches                       | `rg -n "catch\s*\{\|catch\s*\(\|\.catch\(" <src>`                                                                          |
| Empty catches                                            | `rg -n -U "catch\s*(\([^)]*\))?\s*\{\s*(//[^\n]*)?\s*\}" <src>`                                                            |
| `try` around calls that may be `async` (R2-A), read each | `rg -n -U -P "(?s)try\s*\{[^}]*?\b\w+\([^)]*\)\s*;?\s*\}\s*catch" <src>`                                                   |
| Un-awaited async-looking calls (R2-B), heuristic         | `rg -n -P "^\s*(?!await\b\|return\b).*\b(invalidate\|clear\|reset\|load\|save\|set\|delete\|hydrate\|refresh)\w*\(" <src>` |
| Sync/async twins (R2-C)                                  | `rg -n "Sync\b" <src>`                                                                                                     |
| Callsites of a symbol (run on the **whole repo**, R5)    | `rg "symbolName"`                                                                                                          |
| Whether an orphan's job is done elsewhere (R5)           | `rg -n "<concept>\|<domain-word>" <src>`                                                                                   |
| Runtime-composed names (R5)                              | `rg -n '\$\{' <src>`                                                                                                       |
| Dynamic imports to inspect for computed paths (R5)       | `rg "import\(" <src>`                                                                                                      |
| Hardcoded design values (R19)                            | `rg "#[0-9a-fA-F]{3,8}\b\|rgba?\(\|z-index:\s*[0-9]{3,}\|\b[0-9.]+px\b" <src>`                                             |
| Fallback tokens that may not exist (5.4)                 | `rg -n "var\(--[\w-]+,\s*[^)]+\)" <src>` then `rg -- "--token-name:" <css>`                                                |
| Module-load side effects (R13)                           | `rg -n "^(document\.\|window\.\|addEventListener\|setInterval)" <src>`                                                     |
| Longest files (R15)                                      | `git ls-files '<src>/**/*.js' \| xargs wc -l \| sort -rn \| head -20`                                                      |
| Stale markers (R14)                                      | `rg -n "TODO\|FIXME\|HACK\|temporary" <src>`                                                                               |
| Skipped/empty tests (R9)                                 | `rg -n "\b(xit\|xdescribe\|it\.skip\|describe\.skip\|test\.skip)\b" tests/`                                                |
| New dependencies in a diff (R8)                          | `git diff <base> -- package.json` then verify each on the registry                                                         |
| Diff scope of an AI session (R17)                        | `git diff --stat <base>...HEAD`                                                                                            |

Treat every regex here as a **candidate finder**. It will have false positives and false negatives;
reading the hit is the audit.

### 9.3 Per-file procedure

1. **Imports:** grep each imported name for use; then re-grep the whole repo for exports you're about
   to call orphaned.
2. **Every `try`/`catch`:** apply R1 and R6, then R2-A (is the guarded call un-awaited `async`?).
3. **Every comment:** apply R14 and R18; flag the file if >~30% add nothing.
4. **Hardcoded values:** `px`, `#`, `rgba`, `z-index`, number literals in style assignments (R19/Part 5).
5. **Exports:** callsites (R5), then the _concept_ search, then the three runtime-name questions.
6. **Wrappers:** one-expression bodies (R10); near-duplicate blocks (R11); empty bodies with lifecycle
   plumbing (R5 scaffold).
7. **Async boundary:** for every call to a function that is `async` in its own definition, is it
   awaited? what does the next synchronous line read? (R2-B); read sync/async twins (R2-C); read any
   `acquire/lock` helper's return value (R2-E).
8. **Siblings:** open the closest related file and compare (R12).
9. **TypeScript/React in play:** R7 and R16.
10. **New dependencies or APIs:** R8.
11. **Tests attached to the change:** R9 and Part 7.
12. **Before writing anything up:** the false-positive checklist; then log with the schema.

### 9.4 A different entry point for build-pipeline scopes (CSS, config, preprocessor, purge)

The source sweep is the wrong place to start. **Build and read the artifact first** (R3):

1. `<build>`, then read `<dist>` CSS/JS directly.
2. Grep the artifact for every construct a tool claims to transform _and_ for constructs it should
   have consumed. Anything still in source form is dead in production:
   `rg -n "@media\s+--" <dist>/assets/*.css`
3. Diff against a baseline build of the pre-change tree (7.8).
4. Read the purge safelist: is it propping up dead code?
5. After a bulk edit, parse-check every stylesheet rather than counting braces:
   ```bash
   node -e "const p=require('postcss'),fs=require('fs');for(const f of process.argv.slice(1))p.parse(fs.readFileSync(f,'utf-8'),{from:f})" $(git ls-files '*.css')
   ```
6. Only then start the source sweep, and treat "the build compiled" as **no evidence at all**.

### 9.5 The AI-session ritual

| When       | Do                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Before** | Create a branch. State scope and forbidden areas in the prompt. Record baseline: lint count, test status, build size.                                            |
| **During** | Commit one concern at a time. Don't let the tool "fix" lint by loosening config or deleting tests.                                                               |
| **After**  | Read `git diff --stat` first. Run the audit (Parts 3-4) on changed files plus siblings. Run lint, format, tests, build. Compare to baseline. Fill in the report. |

### 9.6 Make the machines enforce what you audit

Anything you check by hand more than twice should become a rule or a test:

| Audit item                      | Enforce with                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| Empty catches (R1)              | ESLint `no-empty` (`allowEmptyCatch: false`), custom `no-empty-catch`                            |
| Floating promises (R2)          | `@typescript-eslint/no-floating-promises`; `require-atomic-updates`; `no-async-promise-executor` |
| Unused imports/exports (R5)     | `no-unused-vars`, `knip` / `ts-prune` / `depcheck`                                               |
| Runtime-name-safe dead CSS (R5) | a test deriving template-literal prefixes from JS (see R5)                                       |
| Invalid at-rules in output (R3) | a test that greps `<dist>` for unresolved constructs; ban the bad spelling in stylelint          |
| File size (R15)                 | ESLint `max-lines` with `<file-size-limit>`                                                      |
| Raw colors/pixels (R19/Part 5)  | custom `no-raw-style-values` + stylelint `color-no-hex`; `--max-warnings 0` in CI                |
| Token drift (5.2)               | token parity test; purge-survival test                                                           |
| Contrast (6.3-C)                | contrast test on token pairs                                                                     |
| New dependencies (R8)           | `npm audit`/OSV scanning, Dependabot/Renovate review, lockfile-diff review in PRs                |
| Line endings (7.5)              | `.gitattributes` `* text=auto eol=lf` + Prettier `endOfLine: "lf"`                               |

---

## Appendices

### A. Finding template

````md
### [R#] <short title>

- **File:** path/to/file
- **Line(s):** 42-48
- **Severity:** 🔴 / 🟡 / ⚪ (+ 🔒)
- **Snippet:**
  ```js
  // short excerpt
  ```
- **Verdict:** slop / false positive / intentional (confirmed with author)
- **Action:** fixed in this session / flagged for follow-up / left as-is (reason)
- **Mechanism verified against source:** …
- **Recommended fix (untrusted):** …
````

### B. Report skeleton

```md
# Audit report: <scope> (<date>)

## Summary

- Scope, files read, rules applied
- Counts: distinct findings by severity (one entry per issue, not per rule)
- Re-ranks made during re-derivation (and why)
- Pre-existing failures found (with baseline evidence)

## 🔒 User Review Required

## 🔴 High

## 🟡 Medium

## ⚪ Low

## False positives / intentional (with reasons)

## Traceability: every finding → scheduled / deferred / downgraded
```

### C. Pull-request checklist

- [ ] Diff stat read first; every changed file is named by the task (R17)
- [ ] No new `catch` that logs and falls through without a reason (R1)
- [ ] No `try`/`catch` around an un-awaited async call; no floating promises (R2)
- [ ] Every new import/dependency/API verified to exist at the installed version (R8)
- [ ] No raw hex/px introduced; any disable is single-line with a specific reason (Part 5)
- [ ] No dead code left behind; removals re-grepped for cascades (R5)
- [ ] Tests fail without the fix, for the right reason; mocks don't exclude the path (Part 7)
- [ ] Lint count not higher than baseline; format, tests and build green
- [ ] Built artifact inspected where a preprocessor/purge is involved (R3)
- [ ] 🔒 items left for human review, not "fixed" (Part 8)
- [ ] UI changes: reduced-motion checked, contrast checked, before/after screenshots attached (Part 6)
- [ ] One concern per commit; High-risk changes isolated with a rollback note

### D. One-page cheat sheet

1. A finding is a **hypothesis** until you've read the mechanism.
2. **Grep-zero ≠ dead.** Check runtime names, third parties, compound selectors, and "does an
   equivalent exist?"
3. **A `catch` around an un-awaited async call never fires.**
4. **Green build ≠ valid output.** Read the artifact; diff a baseline.
5. **No token? Report it.** Don't invent it, don't snap to a neighbor, don't dodge the linter.
6. **Security code goes to a human.** 🔒 is never auto-fixed.
7. **Prove the test fails without the fix.**
8. **When in doubt, downgrade rather than delete.**
9. **One concern per commit; every finding gets a destination.**
10. **Make the machines enforce it** once you've checked it by hand twice.
