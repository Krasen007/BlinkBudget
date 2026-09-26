# AI Slop Report

**Round 2 (OPEN):** [`src/styles/`](#round-2--srcstyles-open) — 19 CSS files · audited 2026-09-26
**Guide:** [`ai-slop-inspection-guide.md`](ai-slop-inspection-guide.md)

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

| Bucket                      | Count | Notes                                                                 |
| --------------------------- | ----- | --------------------------------------------------------------------- |
| 🔴 High (real defect)       | 2     | #4.1 `@keyframes slideUp` collision; **#7.1 dead `@media --` blocks** |
| 🟡 Medium                   | 6     | #4 duplicate keyframes, #9 duplicated rules, #14 bloat, #7 drift      |
| ⚪ Low                      | 5     | #1/#11 tombstone comments, #5a phantom-token fallbacks                |
| **User Review Required**    | 1     | #4.2 — the 233-selector dead-CSS purge (destructive; needs sign-off)  |
| False positives (corrected) | 3     | Recorded below; each downgraded _after_ verification, not assumed     |

> **Phase 2 update (2026-09-26).** #7.1 has been **re-scoped 🟡 → 🔴** and **fixed**. It was filed as
> "consistency-only" on the reasoning that the build compiles; that premise was true but the inference
> was not. `postcss-custom-media` only resolves the _parenthesised_ form, so all 22 paren-less
> `@media --sm` / `@media --md` blocks were shipping into `dist/` as invalid media queries that
> browsers discard — desktop `h1`/`h2` never scaled up, the dashboard stat grid never went
> multi-column, and `.mobile-back-btn` was never hidden on desktop. All 22 were **deleted** (author
> decision), and a source-level guard now bans the form. See [#7.1](#71--two-spellings-of-the-custom-media-query-the-paren-less-form-is-dead-code-).

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

#### #7.1 — Two spellings of the custom media query: the paren-less form is dead code 🔴 High

- **File:** `@media --md` (no parens) in `base.css:100,165`, `forms-dialogs.css:236,473,486,551,689`,
  `mobile.css:305`, and 14 sites in `ui.css` — vs `@media (--md)` (parens) in
  `enhanced-button.css:219`, `enhanced-input.css:237`, `performance-accessibility.css:352`,
  `webapp-components.css:341`, `hero.css:571,636,700`, `view-styles.css`, `webapp-patterns.css`
- **Severity:** 🔴 High — **re-scoped from 🟡 Medium; see the correction below**
- **Verdict:** slop, and the slop was load-bearing dead code
- **Correction to my own finding (guide rule #8 — do not trust the recommendation, or the
  severity, that arrives with the report):** this was filed as "consistency-only" on the reasoning
  that "`postcss-custom-media` accepts both and the production build compiles". **The premise held;
  the inference did not.** I tested the plugin directly:

  ```
  @media --md   { .b { … } }  ->  @media --md   { .b { … } }            UNCHANGED
  @media (--md) { .c { … } }  ->  @media (min-width: 768px) { .c { … } }   resolved
  ```

  The paren-less form is **not a recognised custom-media reference**. It is emitted verbatim, and
  `@media --md` is an _invalid_ media query that browsers discard outright. Confirmed in the shipped
  artefact before the fix — `dist/assets/index.LajpuDoe.css` contained **15 × `@media --sm`** and
  **5 × `@media --md`**, against 8 correctly-resolved `(width>=768px)`. So "the build compiles" was
  true and completely beside the point: the build compiled 22 blocks that render nothing.

- **User-visible symptom (feedback/layout loss, not data loss):** `h1`/`h2` never scale up above
  768px (`base.css:165`); the dashboard stat grid never goes multi-column (`ui.css:561`);
  `.mobile-back-btn` is never hidden on desktop (`mobile.css:305`); the date-range form never goes
  two-column (`forms-dialogs.css:473`).
- **Why every static check stayed green:** each file is individually valid CSS, and Stylelint accepts
  the paren-less at-rule. The defect exists only in the _interaction_ between the source spelling and
  the PostCSS plugin — the same blindness as #4.1, one layer up.
- **Action:** **fixed in Phase 2 (2026-09-26)** — all 22 dead blocks **deleted** (author decision,
  2026-09-26: "remove it, because it was wrong and not working"). Deleting rather than repairing was
  chosen deliberately: these were mobile-first _progressive-enhancement_ blocks, and re-adding them
  via the paren form would have activated a design nobody has ever seen, on a layout that has been
  shipping without them. Removal restores the site to the behaviour it has actually been serving.
- **Verified:** production build now ships **0** occurrences of `@media --` (was 20); source grep is
  0 (was 22). `yarn run lint:css`, `prettier --check` and the full Vitest suite are clean.
- **Guards added:** `tests/system/css-architecture.test.js` — "never uses the paren-less custom media
  reference form". Revert-tested: reintroducing one `@media --sm` block fails with
  `ui.css:496 -> @media --sm {`, naming file, line and construct. Deliberately asserted against
  **source** rather than the `dist/` artefact, since dist filenames are content-hashed and would
  break the test on every unrelated rebuild.
- **Note for the next round:** this is the second finding in this report (#4.1) whose _severity came
  from reading the built artefact_ rather than the source. Neither is reachable by a per-file linter.
  Any future CSS round should read `dist/assets/*.css` before assigning severity to anything
  involving the cascade or the build.

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

**#7.1 is the inverse calibration, and the more useful one: a finding I had _under_-rated.** I filed it
as 🟡 "consistency-only" because "`postcss-custom-media` accepts both and the production build
compiles". Verifying that sentence against the plugin showed the premise was true and the conclusion
false — only the parenthesised form is resolved, so 22 blocks were shipping as invalid media queries
that browsers discard. It is now 🔴 and fixed. Two lessons, both worth more than the finding:

- **A build that succeeds is not a build that works.** "The pipeline didn't error" was the whole basis
  for the original severity, and it says nothing about whether the emitted CSS is _valid_. Only
  reading the artefact answered the question.
- **A finding's severity is a claim like any other.** #4.1 had to be narrowed on re-derivation; #7.1
  had to be widened. Neither direction is privileged — the guide's rule is to re-derive both, and to
  record the correction in the report rather than silently fixing the number.

Per checklist #7, a round with zero mis-rated findings should be treated as a warning sign, not a
clean bill of health.

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
| Custom-media spelling split              | #7.1  | 🔴       | **DONE (Phase 2, 2026-09-26)** — re-scoped 🟡→🔴; 22 dead blocks deleted; guard added |
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
4. **#7.1** — the fix _reduces_ rendered output (22 blocks deleted rather than repaired). Reached the
   author as an explicit choice between "remove the dead code" and "activate the blocks via the
   working paren form", and the answer was removal. Recorded here because it is a deliberate
   behaviour decision, not an automatic cleanup — see the Phase 2 note in the executive summary.

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
