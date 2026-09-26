# AI Slop Report

**Round 2 (OPEN):** [`src/styles/`](#round-2--srcstyles-open) — 19 CSS files · audited 2026-09-26
**Guide:** [`ai-slop-inspection-guide.md`](ai-slop-inspection-guide.md)

> Round 1 was scoped to `src/views/` and **never covered CSS**. Round 1's "no open defects remain"
> therefore says nothing about `src/styles/` — which is how Round 2 found a real defect in a tree
> the previous report called clean.

---

# Round 2 — `src/styles/` (OPEN)

**Audit date:** 2026-09-26 · **Guide:** [`ai-slop-inspection-guide.md`](ai-slop-inspection-guide.md)
**Scope:** `src/styles/` — 19 `.css` files, ~5,600 lines (`main.css`, `base.css`, `critical.css`,
`hero.css`, `mobile.css`, `tokens.css`, `components/` ×10, `utilities/` ×2)
**Method:** Rule-by-rule sweep with `rg`, then per-finding line re-derivation, a repo-wide grep for
every "dead" claim, and — for the headline finding — a **production build** (`yarn run build`) to read
the actual shipped CSS rather than inferring cascade order from source.

---

## Executive summary

The round found **one real, user-visible defect** that the source code does not reveal and that only
a production build exposes, plus a large tail of duplication and design-token bypass.

The headline finding is a **CSS `@keyframes` name collision** that silently kills the "close"
animation on the Settings → Advanced Settings panel. It survives every static check: ESLint,
Stylelint, Prettier and the whole Vitest suite are green, because every individual file is valid
CSS. The defect only exists in the _combination_ of two files, and is invisible until you read the
concatenated production stylesheet.

| Bucket                      | Count | Notes                                                                |
| --------------------------- | ----- | -------------------------------------------------------------------- |
| 🔴 High (real defect)       | 1     | #4.1 — `@keyframes slideUp` collision, proven in production build    |
| 🟡 Medium                   | 6     | #4 duplicate keyframes, #9 duplicated rules, #14 bloat, #7 drift     |
| ⚪ Low                      | 5     | #1/#11 tombstone comments, #5a phantom-token fallbacks               |
| **User Review Required**    | 1     | #4.2 — the 233-selector dead-CSS purge (destructive; needs sign-off) |
| False positives (corrected) | 3     | Recorded below; each downgraded _after_ verification, not assumed    |

### The one thing that matters

**`@keyframes slideUp` is defined twice with opposite meanings, and the wrong one wins.**

`mobile.css:45` and `ui.css:711` both define `slideUp`. They are not variants — they are inverses:

| Definition      | `from`                         | `to`                            | Meaning               |
| --------------- | ------------------------------ | ------------------------------- | --------------------- |
| `ui.css:711`    | `opacity: 1; translateY(0)`    | `opacity: 0; translateY(-10px)` | **slide out / close** |
| `mobile.css:45` | `opacity: 0; translateY(20px)` | `opacity: 1; translateY(0)`     | **slide in / open**   |

`main.css` imports `components/ui.css` at line 10 and `mobile.css` at line 22. For two `@keyframes`
with the same name, **the last one in source order wins** — so `mobile.css`'s _entrance_ animation
overrides `ui.css`'s _exit_ animation globally. `.advanced-settings-section--closing` asks for a
close animation and silently receives an open one.

I verified this in the shipped CSS rather than assuming it. From `dist/assets/index.DTRyOLIz.css`:

```css
.advanced-settings-section--closing {
  animation: 0.3s forwards slideUp;
}
@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

The `ui.css` exit variant is **absent from production entirely** — PurgeCSS dropped it, because the
only consumer of the _name_ `slideUp` is the rule it was supposed to animate, and the mobile modal
also claims that name. The exit animation does not merely look wrong; the keyframes written for it
no longer exist in the build.

Note the _second_ `@keyframes slideUp` hit at offset 76345 in the build is `slideUpSheet`, a
different, correctly-named animation — my first sweep's regex matched it as a prefix. Line numbers
and naive greps decay; this is the guide's "re-derive, don't trust" rule applying to my own tooling.

### Severity calibration (guide: "assign severity from the code you read")

The impact is **feedback loss, not data loss**, so this is 🔴 but not the highest tier:

- `SettingsView.js:152-158` adds `--closing` and removes `--visible` in the same tick.
- `--visible` is the rule carrying `display: block`. The moment it is removed, the element reverts
  to `.advanced-settings-section { display: none }` and the section disappears instantly.
- The `setTimeout(..., 300)` that removes `--closing` then fires against an already-hidden element.

So the user sees the panel **vanish with no animation at all** — the "close" motion is silently
dead. The wrong-direction animation never actually plays, because the element is already
`display: none` by the time it could. Reporting this as "the wrong animation plays" would overstate
it; the accurate statement is **"the close animation never plays."**

The `@keyframes` collision is the **root cause** and the thing worth fixing, because the day
someone adds `display: block` to `--closing` (the obvious way to make the animation work), the panel
will animate _inward_ on close while appearing to work. Fixing the name collision first is what makes
that future fix safe.

---

## Findings

### Rule #4 — Dead / unreachable code

#### #4.1 — `@keyframes slideUp` collision: the close animation is dead 🔴 High

- **File:** `src/styles/components/ui.css:711-721` and `src/styles/mobile.css:45-55`
- **Line(s):** `ui.css:711`, `mobile.css:45`; consumer `ui.css:696`; JS `SettingsView.js:150-165`
- **Severity:** 🔴 High
- **Snippet:**
  ```css
  /* ui.css:711 — intended: CLOSE */
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
  /* mobile.css:45 — intended: OPEN, and it WINS */
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  ```
- **Mechanism verified against source:** `main.css:10` imports `components/ui.css`, `main.css:22`
  imports `mobile.css` — ui.css first, mobile.css later. Confirmed by reading `main.css` in full.
  Confirmed in the built artifact: `dist/assets/index.DTRyOLIz.css` contains exactly **one**
  `@keyframes slideUp`, and it is the `mobile.css` body (`translateY(20px)`), at offset 73948. The
  `ui.css` body (`translateY(-10px)`) is not present anywhere in the production stylesheet. The
  consuming rule is present at offset 24693:
  `.advanced-settings-section--closing{animation:.3s forwards slideUp}`.
  Also read `SettingsView.js:140-171` to confirm `--visible` (which carries `display: block`) is
  removed in the same tick that `--closing` is added — so the section is `display: none` before any
  animation could be observed.
- **Verdict:** slop
- **Action:** **fixed in Phase 1 (2026-09-26)** — both halves, together:
  1. `ui.css` — `@keyframes slideUp` renamed to `slideUpOut` (collides with `mobile.css`'s
     entrance animation, so a shared name is what broke it).
  2. `ui.css` — `.advanced-settings-section--closing` now declares `display: block`, so the
     panel stays rendered while the exit animation plays. Without this the rename alone would
     have been a no-op.
  3. `SettingsView.js` — the close timer is tracked and cleared on re-open. This was not in the
     original finding: adding `display: block` makes the previously-invisible race observable (a
     stale timer could cut a later close animation short), so it had to land in the same change.
  4. Magic `300` replaced with `TIMING.ANIMATION_NORMAL`, matching the existing `setTimeout`
     house pattern.
- **Verified:** production build now ships
  `.advanced-settings-section--closing{animation:.3s forwards slideUpOut;display:block}` with
  `@keyframes slideUpOut` present — previously the exit keyframes were absent from the bundle
  entirely. Revert-tested: each of the three guards fails for its own reason without its fix.
- **Guards added:** `tests/system/css-architecture.test.js` (conflicting-`@keyframes` names;
  `--closing` must declare a display) and `tests/views/settings-advanced-toggle.test.js`
  (deferred hide, timer cancellation, keyboard path).
- **Note on the recommendation (guide: "treat the recommendation as untrusted"):** the obvious fix
  — rename `ui.css`'s keyframes to `slideUpOut` — is _necessary but not sufficient_. It removes the
  collision but does **not** make the animation visible, because the `display: none` reversion in
  `SettingsView.js` is a second, independent defect. Fixing only the rename would close this ticket
  and leave the panel still snapping shut with no motion — exactly the "no-op fix" failure the guide
  warns about. Both must land together, and the JS half is a behaviour change that wants a human
  decision (see User Review Required).

#### #4.2 — 233 class selectors with no consumer anywhere 🟡 Medium

- **File:** all of `src/styles/`
- **Line(s):** throughout
- **Severity:** 🟡 Medium
- **Method:** extracted all 552 distinct class selectors from the 19 stylesheets, then searched every
  one against `src/**/*.js`, **all** `*.html` in the repo (including root `index.html`), and
  `tests/**/*.js`. 233 matched nothing.
- **Correction applied (guide false-positive checklist #2):** my first sweep searched only `src/` and
  `tests/`, which produced **236** and wrongly flagged `skip-link` and `visually-hidden` as dead.
  Both are used in root `index.html:57-58`. The corrected count is 233. Recorded because it is the
  exact failure mode the guide describes — grep-zero-callsites is a hypothesis, and my first sweep's
  number was wrong.
- **Notable clusters:** `input-*` (31 selectors in `enhanced-input.css`), `view-*` (22 in
  `view-styles.css`), `budget-recommendations-*` (7), `text-fluid-*` (8), `mobile-account-*` (6),
  `a11y-*` (4), `lazy-*-placeholder` (3).
- **Verdict:** slop (unused design-system surface), **but the remedy is destructive**
- **Action:** **User Review Required** — flagged, not fixed. Deleting 233 selectors is a whole-tree
  removal that cannot be proven safe by grep alone. This needs an author decision, not
  auto-remediation.

#### #4.3 — `integrity-report.css` is not in `main.css` — **FALSE POSITIVE**

- **File:** `src/styles/components/integrity-report.css`
- **Why it looked dead:** the only file in `src/styles/` absent from `main.css`'s import list, and
  grepping the filename across `*.js` found only `IntegrityReport.js:1`, which imports it by path.
- **Verdict:** **false positive.** `src/components/IntegrityReport.js:1` does
  `import '../styles/components/integrity-report.css';`, so it loads on demand. Not dead, and
  correctly excluded from the global bundle.
- **Action:** left as-is (no change). Recorded so a future round does not re-flag it.

#### #4.4 — `critical.css` is not imported by `main.css` — **FALSE POSITIVE**

- **File:** `src/styles/critical.css`
- **Verdict:** **false positive.** `index.html:29` loads it via
  `<link rel="stylesheet" href="/src/styles/critical.css" />`, deliberately, before `main.css`.
  That is the entire purpose of a critical-CSS file.
- **Action:** left as-is. Recorded to prevent re-flagging.

#### #4.5 — 4× duplicate `@keyframes spin` 🟡 Medium

- **File:** `loading-indicators.css:6`, `webapp-components.css:123`, `inflation-trends.css:93`,
  `enhanced-button.css:297`
- **Severity:** 🟡 Medium
- **Snippet:** all four are byte-identical — `0% { transform: rotate(0deg) }` /
  `100% { transform: rotate(360deg) }`
- **Verdict:** slop
- **Action:** flagged for follow-up. Safe to delete three of the four — **with the caveat below.**
- **Caveat (guide rule #4 steps 2-3):** `vite.config.js` purges the build with
  `safelist: { keyframes: [/^(spin|float)$/] }`, and `src/utils/progress-indicators.js:58` and
  `src/components/LoadingView.js:22` apply `animation: spin` from **JS**. A keyframe referenced only
  from JS has no surviving CSS rule for PurgeCSS to trace, which is precisely why that safelist entry
  exists — the comment in `vite.config.js` records that `float` was missing from production until it
  was added. Removing the redundant copies is safe _because the safelist pins the name_, but the
  equivalent implementation must be confirmed present first. Verified all four are identical, so the
  copy in `loading-indicators.css` is a correct survivor.

#### #4.6 — `@keyframes fadeIn` defined twice 🟡 Medium

- **File:** `hero.css:538` and `forms-dialogs.css:589`
- **Verdict:** slop (harmless duplicate — bodies are identical, so unlike #4.1 there is no behavioural
  difference, but it is still two owners for one name)
- **Action:** flagged for follow-up. Note `hero.css` is conditionally loaded (`LandingView.js:8`
  imports it), so the two definitions do not always coexist; keeping both means the effective
  definition depends on whether the landing page was ever visited.

#### #4.7 — `.sr-only` defined 3× with a behavioural difference 🟡 Medium

- **File:** `webapp-patterns.css:254`, `performance-accessibility.css:26`, `reports.css:805`
- **Severity:** 🟡 Medium
- **Snippet:** the first two use `clip: rect(0, 0, 0, 0)`; `reports.css:812` uses
  `clip-path: inset(0)` and **omits** `clip`.
- **Verdict:** slop
- **Action:** flagged for follow-up. `.sr-only` is live — used at `ReportsView.js:562`,
  `ChartRenderer.js:742` and `:1037`, `chart-config.js:706` — and `reports.css` is imported _after_
  `webapp-patterns.css` in `main.css`, so its variant wins for every consumer. Not currently broken
  (`clip-path: inset(0)` is the modern equivalent), but three owners for one accessibility primitive
  is a maintenance hazard, and a `clip`/`clip-path` divergence is exactly the kind of thing that
  silently regresses screen-reader behaviour later.

### Rule #9 — Duplicated logic instead of reuse

#### #9.1 — `.card` defined twice with conflicting values 🟡 Medium

- **File:** `ui.css:191-203` and `webapp-patterns.css:58-65`
- **Severity:** 🟡 Medium
- **Snippet:**
  ```css
  /* ui.css:191 */
  .card {
    padding: var(--spacing-xl);
    transition: var(--animation-interactive);
    box-shadow: var(--shadow-md);
  }
  /* webapp-patterns */
  .card {
    padding: var(--card-padding-mobile);
    transition: var(--transition-normal);
    box-shadow: var(--shadow-card);
  }
  ```
- **Verdict:** slop
- **Action:** flagged for follow-up. `webapp-patterns.css` is imported at `main.css:26`, after
  `ui.css` at line 10, so it wins. Both also set `border-radius`, `border` and background, and
  `ui.css:200` adds a `.card:hover` that `webapp-patterns.css` does not. Confirmed both survive into
  production (three `.card{` matches in the built CSS). Whichever author is "right", the other
  definition is misleading dead weight.

#### #9.2 — `.visually-hidden` defined twice 🟡 Medium

- **File:** `critical.css:222` and `base.css:192`
- **Verdict:** intentional-ish, but undocumented — `critical.css` must stand alone before
  `main.css` loads, so restating the base rule there is defensible. It is not byte-identical though:
  `base.css:200` adds `clip-path: inset(50%)` which `critical.css` lacks.
- **Action:** flagged for follow-up as a documented-duplication candidate rather than a deletion.
  Both files should carry a one-line note saying the duplication is load-order-required, so a future
  round does not "clean it up" and break first paint.

#### #9.3 — `.btn` base rule split across 3 files 🟡 Medium

- **File:** `ui.css:40`, `enhanced-button.css:3`, `critical.css:110`
- **Verdict:** slop-by-accumulation. Eight `.btn{` matches survive into production CSS. Same shape as
  #9.1 and #4.1: several files each assert ownership of a global class.
- **Action:** flagged for follow-up. This is the structural theme of the round — see "Theme" below.

### Rule #5 — Hardcoded values that bypass the design system

#### #5.1 — Phantom tokens: `var(--x, fallback)` where `--x` is defined nowhere ⚪ Low

- **File:** `ui.css:227`, `ui.css:354` (`--z-index-toast`); `reports.css:108`, `reports.css:149`
  (`--z-index-tooltip`)
- **Severity:** ⚪ Low
- **Snippet:**
  ```css
  z-index: var(--z-index-toast, 10000); /* ui.css:227, ui.css:354 */
  z-index: var(--z-index-tooltip, 100) !important; /* reports.css:108 */
  z-index: var(--z-index-tooltip, 1000) !important; /* reports.css:149 */
  ```
- **Mechanism verified against source:** searched every stylesheet and `index.html` for
  `--z-index-toast` and `--z-index-tooltip` **definitions**. The only matches are these four
  _usages_; no `--z-index-toast:` or `--z-index-tooltip:` declaration exists anywhere in the repo.
  The fallback literal therefore always wins — the classic "tokenised but load-bearing literal"
  from guide rule #5a.
- **Verdict:** slop, but **per guide #5b/#5c this is a design decision, not a cleanup.** The author
  previously declined an equivalent z-index finding for exactly this reason: introducing a z-index
  scale has global stacking implications and is design work, not slop removal.
- **Action:** left as-is (documented reason: a z-index scale must be designed, not retrofitted).
  Worth noting `--overlay-z-index` / `--overlay-top-z-index` _do_ exist in `mobile.css:5-6`, so there
  is already a partial scale — a future decision could unify, but that is a design task.
- **Also note:** `reports.css:108` and `reports.css:149` use the **same token name with different
  fallbacks** (100 vs 1000). Since the token is undefined, these two declarations disagree by 10×.
  Whichever selector wins the cascade, the other is silently doing something different. That part is
  a genuine inconsistency rather than a design choice.

#### #5.2 — Magic z-index literals across 8 files ⚪ Low

- **File:** `webapp-patterns.css:179,229`; `performance-accessibility.css:13,206,239,316`;
  `reports.css:791,799`; `webapp-components.css:76`; `forms-dialogs.css:568`; `mobile.css:225`;
  `critical.css:243`
- **Severity:** ⚪ Low
- **Values seen:** `9999`, `1001`, `1000`, `999`, `100`
- **Verdict:** slop per the letter of rule #5, **but** the guide's own refinement #5b applies: most of
  these have **no matching token**, so "converting" them would mean _inventing_ a scale. Reported as
  _no token exists_ rather than as convertible cleanup, per #5b.
- **Action:** flagged as a single design-system follow-up (define or explicitly reject a z-index
  scale), not a slop fix.

#### #5.3 — Undefined tokens used inside `critical.css` ⚪ Low

- **File:** `critical.css:123-124` (`--ease-out`), `critical.css:93` (`--spacing-xs`)
- **Severity:** ⚪ Low
- **Mechanism verified against source:** parsed every `var(--x)` **used** in `critical.css` and
  compared against every `--x:` **declared** in that same file. `--ease-out` and `--spacing-xs` are
  used but not declared there. Both _are_ declared in `tokens.css` (lines 221 and 122), which
  `main.css` loads — so they resolve in a normal page load and the declarations are not broken.
- **Verdict:** **false positive on impact, real observation on intent.** The `var(--ease-out, …)`
  and the bare `var(--spacing-xs)` are deliberate critical-CSS self-containment choices (the file
  must render before `tokens.css` arrives). The bare `var(--spacing-xs)` at line 93 is the one that
  would genuinely fail during the critical window, since it has no fallback.
- **Action:** flagged for author confirmation — add a fallback to `critical.css:93` or declare the
  token locally. Low stakes; no user-visible symptom observed.

#### #5.4 — Raw hex colours in the high-contrast block ⚪ Low

- **File:** `performance-accessibility.css:77-87`
- **Severity:** ⚪ Low
- **Snippet:** `--color-background: #fff; --color-primary: #00f; --focus-color: #f00; …`
- **Verdict:** intentional — a forced high-contrast palette that must bypass the HSL token system by
  design. Same reasoning as guide #5c (some raw values are deliberate strategy).
- **Action:** left as-is (reason recorded).

### Rule #7 — Inconsistent patterns

#### #7.1 — Two spellings of the same custom media query 🟡 Medium

- **File:** `@media --md` (no parens) in `base.css:100,165`, `forms-dialogs.css:236,473,486,551,689`,
  `mobile.css:305`, ~14 sites in `ui.css` — vs `@media (--md)` (parens) in
  `enhanced-button.css:219`, `enhanced-input.css:237`, `performance-accessibility.css:352`,
  `webapp-components.css:341`, `hero.css:571,636,700`, `view-styles.css`, `webapp-patterns.css`
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** flagged for follow-up. `postcss-custom-media` accepts both and the production build
  compiles, so this is consistency-only — but a 50/50 spelling split across ~40 call sites is
  exactly the drift the rule targets, and it makes grepping breakpoint usage unreliable.

#### #7.2 — Hand-written breakpoint literals that disagree by 1px ⚪ Low

- **File:** `mobile.css:230` and `view-styles.css:477` use `(width <= 767px)`;
  `inflation-trends.css:115`, `loading-indicators.css:39`, `reports.css:155,345,632` use
  `(width <= 768px)`; `reports.css:377` uses `(width >= 769px)`; `hero.css:282` uses
  `(width >= 768px)`
- **Severity:** ⚪ Low
- **Note:** `tokens.css:14` defines `--md (min-width: 768px)`. So a 768px-wide viewport matches
  _both_ `width <= 768px` and the `--md` custom media, and matches neither `width <= 767px` nor the
  `width >= 769px` guards. At exactly 768px the stylesheets disagree with themselves.
- **Verdict:** slop (hardcoded values that bypass the design system, rule #5)
- **Action:** flagged for follow-up — replace with the custom media, or adopt one documented
  literal. No user-visible defect confirmed at this width; medium-low stakes.

### Rule #14 — File / module bloat

#### #14.1 — 5 of 19 stylesheets exceed the project's 500-line convention 🟡 Medium

- **File / lines:** `components/ui.css` **860**, `components/reports.css` **729**,
  `utilities/view-styles.css` **680**, `hero.css` **653**, `components/forms-dialogs.css` **619**
- **Severity:** 🟡 Medium
- **Convention:** `AGENTS.md:141` — "keep files under 500 lines"
- **Verdict:** slop by project convention
- **Action:** flagged as its own follow-up, **explicitly not bundled** into any cleanup, per the
  guide's instruction not to mix a split-file refactor into unrelated slop work. `ui.css` at 860
  lines is 172% of the limit and is the file implicated in three separate findings (#4.1, #9.1,
  #9.3) — that correlation is the rule's point: bloat is a strong correlate of the duplication this
  round actually found.

### Rule #1 / #11 — Trivial and stale comments

#### #11.1 — 12 "moved to …" tombstone comments ⚪ Low

- **File:** `ui.css:119,130,144`; `webapp-patterns.css:67,75,77,414`; `base.css:2,189`;
  `critical.css:148`; `reports.css:225,227,229`
- **Snippet:** `/* Button hover styles moved to enhanced-button.css to avoid duplication */`
- **Verdict:** slop. Each sits above a blank line where code used to be, describing a removal
  rather than documenting anything. They will never again explain the current code.
- **Action:** flagged for follow-up (bulk cosmetic delete, safe).

#### #11.2 — `loading-indicators.css` header claims to be the single source; it is not 🟡 Medium

- **File:** `loading-indicators.css:1-4`
- **Snippet:** `* Single source for @keyframes spin / float.`
- **Verdict:** slop — and **actively misleading**, which is the #11 test rather than the #1 test.
- **Mechanism verified against source:** the same `@keyframes spin` is defined in three other files
  (#4.5). The header is the _last_ record of an intent the code no longer honours, so a future
  session would reasonably trust it and be misled about where `spin` comes from.
- **Action:** flagged for follow-up — either delete the three duplicates (#4.5) so the claim becomes
  true, or correct the comment. Deleting the duplicates is the better fix.

#### #11.3 — `inflation-trends.css` documents controls that no longer render 🟡 Medium

- **File:** `inflation-trends.css:7`
- **Snippet:** `- .segmented-control: For chart toggles and periods (controls are no longer rendered — kept for reuse)`
- **Verdict:** stale, but **honest about being stale** — the parenthetical is doing real work.
- **Action:** flagged for follow-up. The `.inflation-controls` / `.selector-group` /
  `.segmented-control` rules this header refers to (lines 40-57, 121-134) are among the 233
  unreferenced selectors from #4.2 — so "kept for reuse" describes rules nothing uses. Either the
  comment or the rules should go; this is one decision, not two.

### Rules not applicable

- **#2, #10, #15 (swallowed errors, try/catch, async boundaries):** CSS contains no JS control flow —
  no `catch`, no `async`, no promise. **Not applicable — not skipped.** The closest CSS analogue is
  the silent-failure class, and it is exactly what #4.1 is: a construct that fails quietly and reads
  as handled.
- **#3 (dead guards):** no runtime guards in CSS. Nearest analogue — `.advanced-settings-section` is
  guarded by a class toggle whose `display: none` default is arguably the guard; covered in #4.1.
- **#6, #12, #13, #8:** indirection, TypeScript, React, and module-load side effects have no CSS
  equivalent in this codebase. Skipped with reason, per the guide's instruction to state skips.

---

## False positives — the calibration the guide demands

Guide checklist #7 warns that a report with zero false positives is itself a warning sign, and #8
warns against findings arriving with confident, airtight prose. Three items initially looked like
findings and did not survive verification. All three are recorded so the next round does not
re-derive them:

1. **`integrity-report.css` "orphan"** — looks orphaned (absent from `main.css`), but
   `IntegrityReport.js:1` imports it by path. **False positive.**
2. **`critical.css` "orphan"** — looks orphaned, but `index.html:29` loads it as a blocking
   stylesheet. That is the file's entire purpose. **False positive.**
3. **`skip-link` / `visually-hidden` "dead selectors"** — appeared in my first sweep, which searched
   only `src/` and `tests/`. Root `index.html:57-58` uses both. Corrected the count 236 → 233 and
   removed these from the dead list. **False positive caused by incomplete search scope.**

The `@keyframes slideUp` finding also required a downgrade pass. My first framing was "the wrong
animation plays on close." Reading `SettingsView.js` showed the element is `display: none` before the
animation could be observed, so the accurate claim is narrower: **the close animation never plays at
all.** The severity stayed 🔴 and the root cause is unchanged, but the user-visible symptom is
feedback loss (a missing animation), not a visibly-wrong animation.

---

## Theme: the round's single structural cause

Four separate findings (#4.1, #9.1, #9.3, #14.1) reduce to one pattern: **several stylesheets each
assert ownership of the same global class or name, and import order silently decides the winner.**

- `slideUp` — `ui.css` vs `mobile.css` → wrong winner, real bug (#4.1)
- `.card` — `ui.css` vs `webapp-patterns.css` → last one silently wins (#9.1)
- `.btn` — 3 files, 8 production rules (#9.3)
- `.sr-only` — 3 files, 3 variants (#4.7)

`main.css` is an ordered `@import` list with no layering discipline, so "which file owns `.btn`" has
no answer other than "whichever line of `main.css` is last." The audit's most useful output is
therefore not any single finding but this: **the fix for #4.1 is a rename, but the durable fix is
establishing one owner per global class.** That refactor is not proposed here — per the guide it
belongs in its own plan, not in a slop cleanup.

---

## Traceability — every finding has a destination

| Finding                                  | Rule  | Severity | Destination                                                                           |
| ---------------------------------------- | ----- | -------- | ------------------------------------------------------------------------------------- |
| `@keyframes slideUp` collision           | #4.1  | 🔴       | **DONE (Phase 1, 2026-09-26)** — rename + `display` + timer lifecycle; 3 guards added |
| 233 unreferenced selectors               | #4.2  | 🟡       | **User Review Required** — destructive, needs sign-off                                |
| 4× `spin` keyframes                      | #4.5  | 🟡       | Phase 2 — keep `loading-indicators.css` copy; verify purge safelist                   |
| `fadeIn` ×2                              | #4.6  | 🟡       | Phase 2                                                                               |
| `.sr-only` ×3                            | #4.7  | 🟡       | Phase 2 — keep one, preserve `clip-path`                                              |
| `.card` ×2                               | #9.1  | 🟡       | Phase 2 — author picks the surviving definition                                       |
| `.visually-hidden` ×2                    | #9.2  | 🟡       | Deferred — document as load-order-required                                            |
| `.btn` split ×3                          | #9.3  | 🟡       | Phase 3 — single owner (bundled with the layering work)                               |
| Phantom z-index tokens                   | #5.1  | ⚪       | Deferred — design decision, explicitly out of scope                                   |
| Magic z-index literals                   | #5.2  | ⚪       | Deferred — same design task as #5.1                                                   |
| `critical.css` undefined tokens          | #5.3  | ⚪       | Phase 2 — add fallback at `critical.css:93`                                           |
| High-contrast raw hex                    | #5.4  | ⚪       | Left as-is (intentional)                                                              |
| Custom-media spelling split              | #7.1  | 🟡       | Phase 2 — mechanical                                                                  |
| 1px breakpoint disagreements             | #7.2  | ⚪       | Phase 2 — unify on one literal                                                        |
| 5 files over 500 lines                   | #14.1 | 🟡       | **Own follow-up** — explicitly not bundled                                            |
| 12 tombstone comments                    | #11.1 | ⚪       | Phase 2 — bulk delete                                                                 |
| Misleading "single source" header        | #11.2 | 🟡       | Phase 2 — resolved by #4.5                                                            |
| Stale "kept for reuse" header            | #11.3 | 🟡       | **User Review Required** — delete rules or fix comment                                |
| `integrity-report.css`                   | #4.3  | —        | False positive, closed                                                                |
| `critical.css` orphan claim              | #4.4  | —        | False positive, closed                                                                |
| `skip-link`/`visually-hidden` dead claim | —     | —        | False positive (search-scope error), closed                                           |

**User Review Required — never auto-remediated:**

1. **#4.1** — the JS half of the fix changes user-visible behaviour (the advanced-settings panel will
   start animating on close). Not a security finding, so no 🔒 restriction applies, but it is a
   behaviour change a human should approve.
2. **#4.2** — deleting 233 selectors. Destructive and effectively irreversible (a selector that looks
   dead may be built dynamically via template literals my grep would miss), and it is exactly the
   "quarantine before you delete" case from rule #4 step 4. Recommend: move to a scratch branch, run
   the full suite **and** the production build, then confirm no visual regression by hand.
3. **#11.3** — delete CSS rules or correct a comment; the author decides which is the truth.

**No 🔒 security-sensitive findings in this round.** Accessibility-related items (#4.7 `.sr-only`,
#5.4 high-contrast) touch assistive technology but are not authentication, authorization, ownership,
or data-deletion concerns, so the 🔒 carve-out does not apply. They are filed as ordinary findings.

---

## Verification plan

Per the guide's "From findings to implementation plan" gate, for anything that lands:

- **Prove each regression test fails without its fix** (revert → run → confirm the _right_ failure →
  restore). For #4.1 the revert must reproduce the missing animation, not a selector mismatch.
- **A CSS assertion cannot see a `@keyframes` collision** — every file is individually valid, which is
  why the suite is green today. A guard has to read the **concatenated** stylesheet. The existing
  `tests/system/css-architecture.test.js` already reads files as strings and checks `main.css` import
  order, so it is the natural home for a duplicate-`@keyframes`-name test.
- **Recommended guard:** assert that no `@keyframes` name is defined in more than one file across
  `src/styles/`. That single test would have caught #4.1, #4.5 and #4.6 at CI time, and prevents the
  whole class from recurring.
- **Note the purge interaction (guide rule #5d):** any fix touching `vite.config.js`'s
  `safelist.keyframes` must be validated with a production build, because `spin` and `float` are
  referenced from JS and have no surviving CSS rule for PurgeCSS to trace.
- Run `yarn run lint:css` and `yarn run format:check` **per phase**, not once at the end.
- Per the guide's testing traps, check `git --no-pager diff --numstat` before believing any
  `prettier --check` failure — this repo has `core.autocrlf=true` and no `.gitattributes`, so CRLF
  churn can make untouched files fail formatting.

---

# Round 1 — `src/views/` (CLOSED)

> **Historical reference only.** Everything below records the closed `src/views/` audit
> (2026-09-25 → 2026-09-26, 20 findings, Phases 1–4). It is kept because several tests referenced
> by the guide were created in that round. **Its scope was `src/views/` — it never covered CSS.**

**Original audit date:** 2026-09-25 · **Phases 1–4 completed:** 2026-09-26
**Guide:** [`ai-slop-inspection-guide.md`](ai-slop-inspection-guide.md)
**Original scope:** `src/views/` — 17 `.js` files, 9,252 lines (incl. `src/views/financial-planning/`)
**Method:** Rule-by-rule sweep with `rg`, then per-finding line re-derivation and a repo-wide
grep for every "dead" claim.

> **This file records a closed audit.** All 20 findings were fixed across Phases 1–4. What follows
> is what is still outstanding by design, the resolutions, and testing notes for whoever touches
> this code next.
> **Line numbers were re-derived against the post-Phase-4 tree** — they are current.

## Executive summary

**No open defects remain.** The report's single headline bug (the unreachable "approximate data"
banner) is **fixed and covered by a regression test**, and the one 🔒 cross-user data bleed found
during the audit is **closed and proven by a revert test**.

| Bucket                    | Count | Status                                                               |
| ------------------------- | ----- | -------------------------------------------------------------------- |
| **User Review Required**  | 0     | #2.5 (🔒), #4.2, #6.1 — all resolved in Phase 4 with author sign-off |
| **Own follow-up**         | 1     | #14.1 file bloat — deliberately not bundled with a cleanup           |
| **Deferred**              | 1     | #7.2 — currently equivalent; will drift on first fix                 |
| **Confirmed intentional** | 2     | #2.4, #2.6 — re-confirmed correct as written, no change recommended  |
| ~~Done~~                  | 20    | Phases 1–2 (11) + cosmetic (6) + author-reviewed (3)                 |

### Severity of what remains

Nothing user-facing is outstanding. What is left is one structural follow-up (#14.1 file bloat),
one deliberate deferral (#7.2), and two findings re-confirmed as correct as written (#2.4, #2.6).

**Two findings were resolved differently than their write-ups proposed**, because the code
contradicted the stated reasoning — see
[Findings whose stated reasoning was wrong](#findings-whose-stated-reasoning-was-wrong). In short:
#2.5's `catch` was inert while the real bug was a fire-and-forget async call, and #4.2's "lost"
diagnostic already existed as a tested, user-reachable service.

### Suggested next step

The audit is closed. The one substantive item left is **#14.1** — eight of seventeen view files
exceed the 500-line convention, `ReportsView.js` (1,598) being the outlier. Per the guide it must
not be bundled with a cleanup, and the extraction pattern already exists one directory over
(`insights-takeaways.js` and friends), so `GoalsSection.js` (1,069) is the cheapest place to start.

---

## Resolved — Phases 1–4

All findings from this report are now closed. #2.5, #4.2 and #6.1 — the three that were held
back for author review — were resolved in **Phase 4**; #2.5 carried a 🔒 and was changed only
after the author confirmed the approach. Their resolutions are in
[Completed work](#completed-work--phases-14) below, including two places where the original
findings' stated reasoning turned out to be wrong.

---

## Own follow-up — never bundle with a cleanup

#### #14.1 — Eight of seventeen files exceed the 500-line convention 🟡 Medium

- **Rule #:** 14
- **File:** `src/views/` (directory-level)
- **Line(s):** n/a
- **Severity:** 🟡 Medium
- **Verdict:** slop
- **Action:** own follow-up — per the guide, do **not** bundle a split-file refactor into an
  unrelated slop-cleanup change
- **Line counts re-measured 2026-09-26** (post-Phase-3; Phases 1–3 made some files slightly
  _longer_, because each fix carries an explanatory comment, while the cosmetic batch trimmed a few):

```
   1598  src/views/ReportsView.js                     (3.2x the limit)
   1317  src/views/DashboardView.js                   (2.6x)
   1069  src/views/financial-planning/GoalsSection.js (2.1x)
    670  src/views/financial-planning/InvestmentsSection.js
    610  src/views/FinancialPlanningView.js
    603  src/views/LoginView.js
    590  src/views/financial-planning/ForecastsSection.js
    553  src/views/LandingView.js
    470  src/views/SettingsView.js
    466  src/views/financial-planning/OverviewSection.js
    404  src/views/financial-planning/BudgetsSection.js
    238  src/views/financial-planning/insights-movers-timeline.js
    219  src/views/EditView.js
    172  src/views/financial-planning/InsightsSection.js
    146  src/views/financial-planning/insights-recurring.js
    130  src/views/AddView.js
    108  src/views/financial-planning/insights-takeaways.js
```

- **Note:** the convention is `AGENTS.md`'s 500-line guideline. `ReportsView.js` at 1,598 lines is
  the outlier and was implicated in four of the original audit's High findings (#4.1, #4.2, #10.1,
  #10.2) — a concrete illustration of the guide's claim that bloat correlates with accumulated
  dead code and complex control flow. **Phases 1–4 have now cut it from 1,651 to 1,598** — the
  validate → sanitize → re-validate chain was flattened, the cosmetic batch trimmed comments, and
  #4.2 removed ~40 lines of dead code. That is a 3% reduction: **still a split, not a trim.**
  `DashboardView.js` moved the other way (1,298 → 1,317) because the #2.5 fix carries an
  explanatory comment and a `console.warn`.
- **The pattern already exists:** `insights-takeaways.js`, `insights-recurring.js` and
  `insights-movers-timeline.js` are each under 240 lines and each carry a header comment explaining
  they were "extracted … to maintain file size constraints." **`GoalsSection.js` (1,069) and
  `InvestmentsSection.js` (670) sit in that same directory and were not split** — the extraction
  pattern exists one directory over and was simply not applied. That is the cheapest place to
  start.

---

## Deferred

#### #7.2 — Same operation, two different structures across sibling views 🟡 Medium

- **Rule #:** 7
- **File:** `src/views/DashboardView.js` (lines 358–382); `src/views/EditView.js` (lines 196–213)
- **Severity:** 🟡 Medium
- **Snippet:**

```js
    import('../components/ConfirmDialog.js').then(({ ConfirmDialog }) => {
```

- **Verdict:** slop
- **Action:** **deferred** — "currently equivalent; will drift on first fix"
- **Note:** both views implement "confirm a delete, then offer undo" with different import
  mechanics — `DashboardView` spreads an array of removed entries, `EditView` handles a single
  `removed` value — and **neither wraps the outer `import()` in error handling at all**. An
  unhandled chunk-load failure yields silence. Behaviourally equivalent today. Low urgency;
  flagged so it is a _known_ divergence rather than a surprise. Fix when either is next touched.

#### #2.6 — Failed dynamic import of the undo module is console-only ⚪ Low

- **Rule #:** 2
- **File:** `src/views/DashboardView.js` (lines 377–379); `src/views/EditView.js` (lines 207–209)
- **Severity:** ⚪ Low
- **Verdict:** **intentional (confirmed with author)**
- **Action:** left as-is (reason: the delete already succeeded; undo is an optional enhancement)
- **Note:** the transaction _is_ deleted by this point. The undo affordance failing to load is a
  degraded-but-successful outcome, and the user is not left believing data was lost. Mirrors the
  documented warn-only contract in `view-preloader.js` (lines 42–48). **No change recommended.**

---

## Confirmed intentional — no action

#### #2.4 — Empty `catch {}` around the progress-unlock card ⚪ Low

- **Rule #:** 2
- **File:** `src/views/financial-planning/InvestmentsSection.js`
- **Line(s):** ~592–594
- **Severity:** ⚪ Low
- **Snippet:**

```js
  } catch {
    // Non-critical — silently fail
  }
```

- **Verdict:** **intentional (confirmed with author)**
- **Action:** left as-is (reason: wraps only the progressive-unlock hint card)
- **Note:** re-examined under checklist item 7. The wrapped block renders an _advisory_ card only;
  the investment form and list are constructed after it and are unaffected. A failure here costs an
  informational banner, not data or function. Unlike `DashboardView.js:1248` (#2.5) there is no
  plausible path to corruption. **Correctly silent — no change recommended.**

---

## Rules with no findings (original round)

Recorded so a future round knows these were checked, not skipped. A post-remediation re-check
found no regressions in any of them.

| Rule                               | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#8** Side effects at module load | **Clean.** No `src/views` module touches the DOM or registers a listener at import time. `DashboardView.js`'s preload helpers and `FinancialPlanningView.js`'s cache wrappers are all function-scoped; the only module-scope state is four inert `let` flags. No `<style>` injection in any `const` initializer.                                                                                                                                                                                              |
| **#12** Type-safety theater        | N/A — the project is plain `.js`; there is no TypeScript to audit.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **#13** Framework-specific slop    | N/A — vanilla JS with functional components; no React hooks, keys, or `useState` anywhere in scope.                                                                                                                                                                                                                                                                                                                                                                                                           |
| **#1** (partial)                   | Only 2 comment findings across ~9,252 lines. Most comments in this directory are genuinely informative — e.g. `DashboardView.js:461–465` (why the stale account filter is normalized), `insights-recurring.js:75–78`, `insights-takeaways.js:81–83`. **This is not a comment-noise directory**, and a future round should not assume otherwise.                                                                                                                                                               |
| **#9** Duplicated logic            | One candidate found and **deliberately not written up**: `createHeader()` is near-identical in `ReportsView.js`, `FinancialPlanningView.js` and `SettingsView.js` (back button + title + `createNavigationButtons`). The variants differ in which section is highlighted, `innerHTML` vs `textContent` for the arrow, and whether the time selector is nested in, so a shared helper would need parameters for all three. Filing it would be padding the report. Worth a design conversation, not a slop fix. |

---

## Completed work — Phases 1–4

Removed from the active backlog. **Do not re-file these.**

### Phase 1 — user-visible correctness

| #                | Finding                                               | Resolution                                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4.1             | `isFallback` never set → banner unreachable           | `createMinimalAnalyticsData` now sets `isFallback: true` (`src/utils/reports-utils.js`). Regression test in a **new** suite.                                                                            |
| #5.1             | `var(--token, literal)` where the token doesn't exist | Reused `reports-ui.js`'s existing `WARNING_TINT`/`WARNING_BORDER` (`color-mix` over real `--color-warning`) — **no new tokens added**. `GoalsSection`'s `var(--color-on-error, #fff)` → honest literal. |
| #10.2            | `throw` for a shape check                             | Split the `Array.isArray` check out of the `try`; a bad shape is no longer reported to the user as a storage error.                                                                                     |
| #3.1             | Dead `Router` guard                                   | Direct call, matching 4 other sites in the same file.                                                                                                                                                   |
| #2.1, #2.2, #7.1 | Swallowed / drifted write failures                    | Normalized on `console.error` + `showErrorToast(...)` across `GoalsSection`, `InvestmentsSection`, and `BudgetsSection` (new `attemptWrite` helper — it previously had no `catch` at all).              |
| #3.2             | (cross-ref of #4.1)                                   | Resolved with #4.1.                                                                                                                                                                                     |

### Phase 2 — pipeline cleanup

| #     | Finding                              | Resolution                                                                                                             |
| ----- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| #10.1 | Validation-as-control-flow           | `validateAnalyticsData` returns `{ valid, errors }`; the try-nested-in-catch-nested-in-try is now straight-line `if`s. |
| #10.3 | Rethrow discarded `minimalDataError` | Chained onto the original error so both survive for diagnosis.                                                         |
| #2.3  | Portfolio failure → misleading €0.00 | Renders an explicit "totals unavailable" notice instead of a plausible-looking wrong number.                           |

### Defects found during remediation that were **not** in the original report

Recorded because they were real, and because the same class may exist elsewhere:

1. **`sanitizeAnalyticsData` threw on exactly the inputs it existed to repair.** It dereferenced
   `sanitized.incomeVsExpenses.totalIncome` unguarded, so the validate → sanitize → re-validate
   recovery could not work for the two most likely failure modes. Now total. _Proven by revert:_
   restoring the blind read fails with `TypeError: Cannot read properties of undefined`.
2. **`validateAnalyticsData` had a latent throw of its own** — the NaN probe read through an
   `incomeVsExpenses` block an earlier check could have bypassed. Now guarded with `else if`.
3. **`showErrorToast(message, options)` was being called as `showErrorToast(msg, err)`** in at
   least one place the original report cited as the _correct_ reference (`GoalsSection.js:617`), so
   the error was passed as `options` and **never logged** despite a comment claiming it was.
   Fixed, and the pattern normalized on the genuinely-clean example (`AddView.js:89-90`) instead.
4. **A test mock would have silently broken under the #10.1 contract change** —
   `reports-view.test.js` mocked `validateAnalyticsData: () => ({ isValid: true })`, a key that
   never existed in the real contract. Under the new call site `valid` reads as `undefined` →
   falsy → every render would have gone down the sanitize path. Updated to
   `{ valid: true, errors: [] }`.

### Tests added

- `tests/views/reports-view-fallback.test.js` — 3 tests. Lives in its **own** file because
  `reports-view.test.js` mocks away the very producer under test (testing trap #1). Covers the
  reachable banner, the no-warning path, and recovery from a malformed payload.
- `tests/utilities/reports-utils-validation.test.js` — 9 tests covering the new
  `{ valid, errors }` contract and the repaired sanitizer.

**Baseline at the end of Phase 2:** 60 tests across the reports/financial-planning views pass;
`tests/system/design-tokens.test.js` passes 12/12 (the production-purge guard still holds);
`yarn run check` is green (0 lint errors — the remaining 86 warnings are pre-existing and sit in
files untouched by the remediation); `yarn run build` succeeds.

### Phase 4 — author-reviewed items (#2.5, #4.2, #6.1)

| #    | Finding                              | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #2.5 | `catch {}` around a cache invalidate | **The `try/catch` was provably dead, and the real bug was elsewhere.** `AnalyticsCache.invalidate()` is declared `async`, so it never throws synchronously — a `try/catch` around the call catches nothing, and a real failure became an _unhandled rejection_ (worse than the silent swallow it appeared to be). Removed it, and fixed the actual cross-user window: capture keys with `getMatchingKeys()`, clear in-memory **synchronously** with `invalidateSync()`, then pass the captured keys to the async `invalidate()` so the persistent layer is still cleared. `.catch(console.warn)` keeps it diagnosable. The hardcoded key string was hoisted to a module-level `FINANCIAL_PLANNING_CACHE_KEY` so the preload and the invalidation cannot drift. Pattern copied from `cache-invalidator.js:38-55`.                                                                   |
| #4.2 | `checkDataIntegrity` never called    | **Deleted — but the finding's justification was wrong.** It claimed the diagnostic logic was "lost." It was not: `src/core/data-integrity-service.js` `checkDataConsistency()` already does the same orphaned-`accountId` detection, and does it better (adds a `severity`, iterates transactions once, and goes through `StorageService` rather than the parallel `TransactionService`/`AccountService` path). It is live — run by `performIntegrityCheck()` across 7 checks, surfaced by the "🔍 Data Integrity Check" button in `DataManagementSection.js`, and covered by 5 test files. The orphan was a duplicate. Also deleted `getCurrentData` / `getCurrentTimePeriod`; kept `refreshData` (called internally at line 1518). **Cascade:** removing it orphaned the `AccountService` import, which was removed too (`TransactionService` survives, still used at line 605). |
| #6.1 | Debounced empty resize listener      | **Deleted in full** at author direction (feature will not be implemented). Removed the `debounce` wrapper, the `resize` registration, the teardown line, and the initial call. **Cascade:** this orphaned _both_ the `debounce` and `TIMING` imports, which were removed — `FinancialPlanningView.js` no longer references either.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Findings whose stated reasoning was wrong

Recorded because the code contradicts the original write-ups, and the same class of error may
exist elsewhere:

1. **#2.5 blamed the `catch` for the data bleed.** The `catch` was inert, but the bleed came from
   `invalidate()` being fire-and-forget: it yields at `_acquireLock()`, so a same-tick read could
   still observe the previous user's data. Fixing only the `catch` — as the finding suggested —
   would have left the security issue fully intact while looking resolved.
2. **#4.2 claimed the logic was "currently lost."** It exists, is tested, and is user-reachable via
   the Data Integrity Check button. The orphan was a duplicate, not the last copy.

### Tests added

- `tests/views/dashboard-greeting.test.js` — 3 tests for the #2.5 auth-switch invalidation:
  synchronous in-memory clearing, pre-captured keys reaching the async `invalidate()` (and the
  persistent entry actually disappearing), and no unhandled rejection when invalidation fails.
  **Proven by revert** — restoring the single-line pre-fix call fails 2 of the 3 with
  `AssertionError: expected { goals: [ 'user-A-private-goal' ] } to be null`, i.e. the previous
  user's data surviving the switch.

**Baseline at the end of Phase 4:** 54 tests pass across `tests/views`, `tests/financial-planning`
and `tests/system/design-tokens.test.js`; ESLint reports **0 errors and 0 warnings** on all four
touched files; `prettier --check` is clean; `yarn run build` succeeds.

### Phase 3 — cosmetic batch

| #    | Finding                              | Resolution                                                                                                                                                                                                                                                                                                                      |
| ---- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1.1 | Placeholder comments for absent code | Deleted `// ... remaining state logic ...` and `// ... (imports)` (`ReportsView.js`), and the two false "is now imported" signposts in `FinancialPlanningView.js` — nothing in that file calls either function.                                                                                                                 |
| #1.2 | ASCII-art `UI OF APP` banner         | Deleted. The `* Render beautiful charts with progressive loading` fragment directly beneath it was **orphaned markup**, not a valid comment, and was removed with it.                                                                                                                                                           |
| #4.3 | Empty `if` kept only for a comment   | Removed the `.reports-header-container` lookup and guard. Per the finding's instruction, the archaeology note was **moved** to the `headerContainer` construction site in `createHeader()` rather than deleted.                                                                                                                 |
| #5.2 | Hardcoded rgba risk-level palette    | Replaced the nested ternary with a `RISK_LEVEL_STYLES` lookup map. Each entry pairs a `color-mix()` tint with the **same** token used for the border, so fill and border cannot desynchronise. Follows `reports-ui.js`'s established pattern.                                                                                   |
| #5.3 | Hardcoded modal overlay/size/shadow  | **Partial fix, as specified.** `maxWidth: '400px'` → `var(--modal-max-width)` and `boxShadow` → `var(--shadow-xl)` (both exact-value matches). **`zIndex: '1000'` deliberately left** — `--z-index-modal` is defined in no stylesheet — now with a comment recording why, so a later pass does not "fix" it on a false premise. |
| #5.4 | `escapeHtml` on string literals      | The three static occurrences became `createElement` + `textContent`. **`escapeHtml(CURRENT_VERSION)` was kept** — that one interpolates a real variable, and `AGENTS.md` forbids unescaped `innerHTML`. The import survives on that use.                                                                                        |

**Line 506 (`FinancialPlanningView.js`) was deliberately left alone.** It is the entire body of the
empty `updateResponsiveLayout` — the evidence #6.1 needs — so it was not deleted as part of #1.1.

**Baseline at the end of Phase 3:** 51 tests pass across `tests/views`, `tests/financial-planning`
and `tests/system/design-tokens.test.js` (the production-purge guard still holds at 12/12);
ESLint reports **0 errors** on all five touched files (5 `no-raw-style-values` warnings, all
pre-existing — confirmed identical by stashing); `yarn run build` succeeds.

---

## Traceability

Every finding has a destination. Nothing is silently dropped.

| Finding                            | Severity | Status                                                                  |
| ---------------------------------- | -------- | ----------------------------------------------------------------------- |
| #2.5 `catch {}` in auth handler    | 🔴 🔒    | **Resolved in Phase 4** — 🔒, changed only after author confirmation    |
| #4.2 `checkDataIntegrity` orphaned | 🔴       | **Resolved in Phase 4** — deleted; logic already existed in a service   |
| #6.1 debounced empty function      | 🟡       | **Resolved in Phase 4** — deleted at author direction; not implementing |
| #14.1 file bloat                   | 🟡       | **Own follow-up** — never bundled with cleanup                          |
| #7.2 delete/undo divergence        | 🟡       | **Deferred** — currently equivalent; will drift on first fix            |
| #2.4, #2.6                         | ⚪       | **Confirmed intentional** — no change recommended                       |
| #1.1, #1.2, #4.3, #5.2, #5.3, #5.4 | ⚪       | ~~Cosmetic batch~~ — **done in Phase 3**                                |

### Testing notes for whoever picks this up

1. **Re-derive every line number before editing.** The ones above were re-measured after Phase 3,
   but they are hints that decay the moment anything else in these files moves.
2. **Run lint/format/build once per commit, not only at the end**, so a bad cosmetic change doesn't
   get buried under a #14.1 refactor on top of it.
3. **Re-grep for newly orphaned code after every deletion** (rule #4, step 5). Removals cascade.
4. `tests/views/reports-view.test.js` has 12 file-level `vi.mock`s. If a future change needs to
   test a path those mocks intercept, it needs a new suite — do not delete a mock to make a test
   pass, or you permanently remove the code path from that suite.
5. **Prove each regression test fails without its fix** before trusting it. Phases 1, 2 and 4 were
   all verified this way.
6. If a #5.1-style fix ever adds tokens to `tokens.css`, re-run
   `tests/system/design-tokens.test.js` — it is the production-purge guard for exactly that class
   of change.
7. **`core.autocrlf=true` with no `text=auto` in `.gitattributes` is a live trap.** Prettier is
   configured `endOfLine: "lf"`, so any `git stash` / checkout round-trip silently rewrites working
   files to CRLF and `prettier --check` then fails on files nobody touched. Re-run
   `prettier --write` after any git operation that rewrites the working tree.

_Original report: 24 write-ups / 23 distinct findings across 9 rules. **Remaining: 0 open**
(2 own follow-up / deferred / intentional, no defects). 20 findings were fixed across Phases 1–4,
plus 3 further defects discovered during remediation._
