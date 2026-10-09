# Design Token Cleanup Guide

How to clear `local/no-raw-style-values` warnings safely.
Companion to [ai-slop-inspection-guide.md](ai-slop-inspection-guide.md) §5 (this guide is the
_operational_ playbook; that one is the philosophy).

**Status (2026-01-10):** 🎉 **ALL `local/no-raw-style-values` warnings resolved — 86 → 0.**
The queue in §6 is closed; §7 has the full session history. Run `yarn lint` to confirm the
count stays at zero as new code lands.

---

## 1. What the rule actually checks

`eslint.config.js` → `local/no-raw-style-values` (severity: `warn`). Two cases only:

| Assignment form                                                     | Checked? | Detail                                                                         |
| ------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `el.style.prop = '0px'` (string literal)                            | ✅ yes   | if the string matches the raw regex                                            |
| `el.style.cssText = \`...\``with **zero**`${}` expressions          | ✅ yes   | if the cooked text matches                                                     |
| `el.style.cssText = \`...${SPACING.XS}...\`` with **≥1** expression | ❌ no    | rule skips it — `expressions.length === 0` gate                                |
| `Object.assign(el.style, {...})`                                    | ❌ no    | not a plain assignment (known blind spot — don't exploit it to dodge the rule) |
| `el.style.setProperty('--x', '1px')`                                | ❌ no    | not covered by the rule                                                        |

The raw regex: `/(?:^|\s)(?:-?\d+(?:\.\d+)?px\b)|#[\da-fA-F]{3,8}\b/` — i.e. any **px** value
(whitespace/start-preceded) or any **hex color**. Not caught: `rem` values, `rgba()`, bare
unitless numbers (`0`, `50%`).

⚠️ **The one-expression escape hatch is a trap.** Adding a pointless `${x}` interpolation silences
the linter without fixing anything. Only put an expression in cssText when it's a _real_ token
reference — never as a dodge.

---

## 2. Token inventory (from `src/utils/constants.js`)

Import what you use: `import { SPACING, COLORS, FONT_SIZES } from '.../utils/constants.js'`.

### JS constants (safe — they're plain strings in JS, immune to the CSS purge)

| Token                                  | Value(s)                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `SPACING.XXS`                          | `2px`                                                                                                       |
| `SPACING.XS`                           | `4px`                                                                                                       |
| `SPACING.SM`                           | `8px`                                                                                                       |
| `SPACING.MD`                           | `12px`                                                                                                      |
| `SPACING.LG`                           | `16px`                                                                                                      |
| `SPACING.XL`                           | `24px`                                                                                                      |
| `SPACING.XXXL`                         | `48px`                                                                                                      |
| `FONT_SIZES.PREVENT_ZOOM`              | `16px` — exact match for the iOS anti-zoom case                                                             |
| `DIMENSIONS.MODAL_MAX_WIDTH`           | `400px` (also `CONTENT_MAX_WIDTH`, chart heights, …)                                                        |
| `TOUCH_TARGETS.MIN_HEIGHT / MIN_WIDTH` | `56px` / `44px`                                                                                             |
| `COLORS.*`                             | all `var(--color-*)` refs: `PRIMARY`, `ERROR`, `SUCCESS`, `BORDER`, `SURFACE`, `TEXT_MAIN`, `TEXT_MUTED`, … |

### CSS variables (via `var()` — fine inside `.style`)

- Spacing: `--spacing-xs` **0.25rem** · `-sm` **0.5rem** · `-md` **0.75rem** · `-lg` **1rem** ·
  `-xl` **1.5rem** · `-2xl`…`-8xl` (see `src/styles/tokens.css:120-134`)
- Radius: `--radius-sm` 0.375rem · `-md` 0.5rem · `-lg` 0.75rem · `-xl` 1.25rem · `-full` 9999px
- Colors: `--color-primary`, `--color-surface`, `--color-border`, `--color-text-main`,
  `--color-text-muted`, `--color-error`, `--color-success`, …

⚠️ **`critical.css` overrides some values** (`--spacing-md: 16px` vs tokens.css `0.75rem`/12px)
in the pre-load phase. Another reason JS constants (`SPACING.MD` = `12px`) are safer than
`var(--spacing-md)` when exactness matters.

---

## 3. Decision workflow (in order, stop at first match)

```
1. Exact-value token exists?      → use it. (guide §5b: EXACT match only)
2. px is a bare border width
   like `1px solid var(--x)`?     → repo pattern: `1px solid ${COLORS.BORDER}`
                                    (template gets an expression → rule skips; matches
                                    ForecastCard, LoginView, GoalsSection…)
3. Zero / unitless-able value?    → `'0px'` → `'0'` (min-height, opacity, flex…)
4. Renders before tokens.css?     → keep literal + one-line eslint-disable
                                    (pwa.js overlay/dialog pattern, guide §5c)
5. No token, but it's pure layout → one-line eslint-disable with a reason
                                    + report as "no token exists"; NEVER invent a token
                                    in a cleanup pass (guide §5b)
```

**Never** snap to a _nearby_ token (`6px`→`8px`). That's a design change; the author decides.

---

## 4. Mechanics that will bite you

### 4a. `eslint-disable-next-line` is single-line

One comment line **directly** above the offending line. Multi-line justification above it makes
"next line" point at another comment → warning still fires + unused-directive warning
(guide §4). Put the reason after `--` on the same line.

```js
// eslint-disable-next-line local/no-raw-style-values -- 6px horizontal padding has no exact token (scale 4/8); snapping would be a design change
budgetEl.style.padding = '2px 6px';
```

(Real live example from `CategoryCard.js` — the author has since ruled that the _GoalsSection
`6px` gap_ should snap to `4px` instead; see §7. Padding halves with mixed values still get
reported rather than snapped.)

### 4b. `tests/system/javascript-design-tokens.test.js` runs its own bare `Linter`

It lints every file in `src/` but (as of last session) registers only the `contract` plugin.
A `local/...` disable directive in any `src/` file makes it fail with
_"Definition for rule ... was not found."_ — the fix (already in place): register no-op stubs:

```js
local: {
  rules: {
    'no-raw-style-values': { create: () => ({}) },
    'no-empty-catch': { create: () => ({}) },
  },
},
```

If you add a **new** `local/` rule someday, add its stub there too. Always run this test after
adding directives:
`npx vitest run tests/system/javascript-design-tokens.test.js tests/system/design-tokens.test.js`

### 4c. The purge guard

`tests/system/design-tokens.test.js` → _"keeps every token used from JS alive through the
production CSS purge."_ JS constants don't risk purge; a `var(--brand-new-token)` added only from
JS **can** be stripped by purge. If you ever add a _new_ CSS var referenced only from JS, run
this test (guide §5d).

### 4d. Verification loop (run every batch)

```powershell
npx eslint <changed-files>            # must be clean
npx prettier --check <changed-files>  # import lines >80ch get re-wrapped by --write
npx vitest run tests/system/javascript-design-tokens.test.js tests/system/design-tokens.test.js
npx vitest run tests/financial-planning/GoalsSection.test.js   # or whichever view you touched
```

`prettier --write` on the import line is expected after adding `COLORS` to a long import.

---

## 5. Patterns by shape (copy these)

```js
// single px property → exact token
timeText.style.marginTop = SPACING.XXS;                 // was '2px'

// font size that is the iOS anti-zoom floor
inputElement.style.fontSize = FONT_SIZES.PREVENT_ZOOM;   // was '16px'

// border line → repo-standard template pattern
manualSection.style.borderTop = `1px solid ${COLORS.BORDER}`;

// cssText block → real token interpolations (also un-gates the rule, legitimately)
progressIndicator.style.cssText = `
  height: ${SPACING.XS};
  border-radius: ${SPACING.XXS};
`;

// unitless zero
noteField.style.minHeight = '0';                        // was '0px'

// color fallback removal (safe where tokens.css is guaranteed loaded)
color: var(--color-primary);        // was var(--color-primary, #00d084)  ← hex dead here

// early-render / no-token → justified disable (see §4a)
// eslint-disable-next-line local/no-raw-style-values -- <specific reason>
```

---

## 6. Remaining queue — ✅ CLOSED (0 warnings, final session)

All 12 files from the queue were cleared (§7 has the log). Two reusable patterns if
`yarn lint` ever surfaces new warnings of this type:

- **Repeated magic dimension with no token** → module-scope named constant
  (`MONTH_NAV_SIZE = '30px'` in `DashboardStatsCard.js`, used 4× so arrow width and content
  clearance can never drift apart). The ai-slop guide sanctions named constants for this case.
- **Cohesive block of deliberate fallbacks** → one
  `/* eslint-disable local/no-raw-style-values -- reason */` … `/* eslint-enable ... */` pair
  around the whole block instead of N inline directives (used once, in `config/app.config.js`).

---

## 7. Completed history (sessions before 2026-10-10)

- `TransactionForm.js` `0px`→`0` · `TransactionList.js`/`ForecastCard.js` → `SPACING.XXS` ·
  `ActionCard.js` cssText → `SPACING.XS`/`XXS` · `mobile-utils.js` → `FONT_SIZES.PREVENT_ZOOM`
  (+ import added) · `pwa.js` overlay+dialog → justified disables (early-render, §5c) ·
  `SettingsView.js` → `SPACING.MD` + dropped dead `#00d084` fallback
- `GoalsSection.js` → `SPACING.XS`/`XXS` + one justified disable (`6px` gap) ·
  `InsightCard.js` → `SPACING.SM` ×2 · `DateFormatSection.js` → `${COLORS.BORDER}` (+ `COLORS` import)
- Fixed the latent `javascript-design-tokens.test.js` plugin gap (§4b)
- **Final batch — 72 warnings across 12 files, cleared in one session:**
  - Exact-token conversions: `SPACING.*` for every `2/4/8/12px` gap, padding, margin;
    `COLORS.BORDER`/`COLORS.ERROR` template borders everywhere (`${}` also un-gates cssText
    blocks legitimately); `FONT_SIZES.BASE` for `16px` button fonts; `var(--radius-md)` for
    `8px` radii; `var(--touch-target-min)` for `44px`; `var(--focus-width)` for `2px`
    outlines; `var(--shadow-xl)` for the dialog's first shadow layer; `var(--radius-full)`
    for the pill badge (`20px` on a ~22px badge clamps to the same pill — render-identical);
    `0px` → `'0'` (`ChartRenderer`); composed shadows from `SPACING` tokens (`CategoryCard`).
  - `AccountSection`: dropped ~8 dead `#ef4444`/`--color-error` fallbacks (dialogs only
    render in a fully-loaded app) — literals, cssText, and the four unflagged ternary
    siblings for intra-file consistency.
  - `NetworkStatus`: `#fff` → `COLORS.TEXT_MAIN` (flagged line + its `Object.assign` sibling).
  - Justified disables (6 inline + the `config` block, each with one-line `--` reason): the two
    mixed `6px` paddings (`CategoryCard` `2px 6px`, `DashboardStatsCard` `6px 8px` — mixed
    values get reported, not snapped), `60px` preset width, `2000px` expand sentinel, and the
    `10/20px` glow blurs.
  - `config/app.config.js`: one block disable/enable pair — every `var(--x, fallback)` is
    load-bearing because this UI renders when the asset pipeline itself may be broken (§5c).
  - Verified: `yarn check` green · ESLint **0 messages** · full suite **654/654** ·
    purge-guard test green (all new `var()` refs survive).

**Open question for the author:** does `6px` gap (GoalsSection `createField`) deserve a designed
token (e.g. a half-step `SPACING.XS_SM`), or should it snap to `4px`?
→ **DECIDED (final session): snap to `4px`** — now `SPACING.XS`, disable removed.

**Blue focus-ring fossil (AccountSection):**
→ **DECIDED (final session): unified.** All four ring sites now use `var(--focus-shadow)`
(same `0 0 0 3px` geometry the CSS layer uses for `.input:focus` / `.mobile-form-select:focus`);
the error branch keeps its red glow but tokenized as
`color-mix(in srgb, var(--color-error) 10%, transparent)` (the `reports-ui.js` pattern).
Both `eslint-disable`s deleted as a result. Rendering shift is intentional per author:
blue 10% → purple 20% on focus.
