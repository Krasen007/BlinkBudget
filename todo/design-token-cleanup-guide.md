# Design Token Cleanup Guide

How to clear `local/no-raw-style-values` warnings safely.
Companion to [ai-slop-inspection-guide.md](ai-slop-inspection-guide.md) §5 (this guide is the
_operational_ playbook; that one is the philosophy).

**Status (2026-10-17):** ✅ Queue closed — `src/` stays at **0 warnings**. This guide is kept as
the living playbook for when new warnings appear; run `yarn lint` to check the count as new code
lands. (The one-time 86 → 0 cleanup and its session history are in git —
`todo/design-token-cleanup-guide.md` @ `371c1df`.)

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
`6px` gap_ should snap to `4px` instead; that one is now `SPACING.XS` with no disable. Padding
halves with mixed values still get
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

## 6. Closing a new warning

Every warning falls into one of two buckets:

- **Exact token exists** → convert it (§5 patterns). Done.
- **No token exists** → one-line justified disable (§4a) + report it as "no token exists".
  Never invent a token in a cleanup pass; never snap to a _nearby_ token — both are design
  decisions the author makes.

Two named-constant precedents exist if the same magic dimension keeps recurring
(`MONTH_NAV_SIZE` in `DashboardStatsCard.js` — used 4× so arrow width and content clearance
can't drift apart). Reuse that approach before proposing a new token.

After any batch: run `yarn lint` (must stay at 0) and the two guard tests:

```powershell
npx vitest run tests/system/javascript-design-tokens.test.js tests/system/design-tokens.test.js
```
