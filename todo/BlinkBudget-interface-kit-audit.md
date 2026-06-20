# BlinkBudget — Interface Kit Audit

Audit of BlinkBudget's styles & visuals against the **interface-kit** SKILL
(https://github.com/JuliusBrussee/skills/blob/main/skills/interface-kit/SKILL.md).

Scope: visual / CSS review only. **No code was changed.** A dummy `.env` was used
locally only to render the UI for screenshots (not committed).

There is **no `DESIGN.md`** at the project root, so the skill's defaults and "Ban
List" apply. Note the repo carries its own `todo/tasteful-software-guide.md`
("weniger, aber besser" / refined-minimal, dark) — a coherent, committed aesthetic
direction, which the interface-kit explicitly values.

---

## Verdict at a glance

| Priority (skill)         | Grade | One-line summary                                                                                                                                                   |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accessibility (CRITICAL) | B+    | Strong focus handling, semantic HTML, skip link, reduced-motion. Gaps: a few `:focus`-only rings, icon-only nav, contrast of muted-on-surface.                     |
| Performance (HIGH)       | A-    | Critical CSS, font-display swap, preconnects, transform/opacity animations, `will-change`.                                                                         |
| Typography (HIGH)        | C     | **No `tabular-nums` anywhere** (notable for a money app), **no `text-wrap: balance/pretty`**, body font is `Inter` (on the skill ban list).                        |
| Layout & Spatial (HIGH)  | B     | Clean 4/8px scale & tokens. Missing concentric-radius discipline; layered shadows defined but single-layer shadows used in practice.                               |
| Color & Theme (MEDIUM)   | B     | HSL token system, semantic tokens, confident single-accent dark palette. Some hardcoded hex / `color: white` leak into components.                                 |
| Motion (MEDIUM)          | B-    | Good tokens, reduced-motion respected. Issues: `transition: all` (29x), `ease-in` used for exits, no `@media (hover:hover)` gate, modal uses translateY not scale. |
| Polish & Details (LOW)   | B     | Press feedback, spinners, shimmer, staggered report rows. Hover scales _down_ (unusual); few layered shadows.                                                      |

Overall: a well-structured, token-driven, genuinely cared-for dark UI that already
follows many of the skill's HIGH/CRITICAL items. The highest-value, lowest-risk
wins are in **typography** (tabular numerals + text-wrap) and a handful of
**motion** hygiene fixes.

---

## 1. Accessibility (CRITICAL)

**Good**

- Skip link present and correctly visually-hidden until focused (`index.html`, `critical.css` `.skip-link`).
- Semantic structure: `<main id="app">`, `<header>`, `<form>`, `<fieldset><legend>Transaction Type</legend>` on the entry screen, `<label>`s for amount/account/category.
- Focus rings are replaced, not removed: every `outline: none` I checked is paired with a `box-shadow` ring and a `:focus-visible { outline … }` (e.g. `critical.css:136-178`, `enhanced-button.css:29-33`). This is the right pattern.
- `prefers-reduced-motion` honored globally (`base.css:63`) and per-component (`enhanced-button.css:232`).
- `prefers-contrast: high` block exists (`enhanced-button.css:252`, `performance-accessibility.css`).
- Touch targets: `--touch-target-min: 44px` enforced on buttons, nav items, inputs — meets the 44×44 rule.
- Icon-only buttons carry `aria-label`/`title` (e.g. month nav, add transaction).

**Gaps / recommendations**

- **`:focus` (not `:focus-visible`) rings in places** — e.g. `forms-dialogs.css:651-657` (`.quick-amount-preset-btn:focus`) and `critical.css:136` (`.btn:focus`). These show the ring on _mouse_ click too. The skill prefers `:focus-visible` so rings only appear for keyboard users. Low severity (extra ring is safe) but inconsistent with the cleaner `enhanced-button.css` pattern.
- **Icon-only primary navigation** (🏠 🎯 📊 ⚙️ emoji buttons on the dashboard). They have `title`s, but emoji glyphs render inconsistently across platforms and convey meaning by icon alone. Consider visible text labels or verified `aria-label`s + non-emoji icons.
- **Amount input is placeholder-only visually.** The `<label>Amount</label>` exists in the DOM (good for SR), but it is visually hidden so sighted users see only the `0.00` placeholder. The skill's Form rule is "visible labels always — never placeholder-only inputs."
- **Contrast worth re-checking in dark mode:** `--color-text-surface: hsl(240 10% 65%)` on `--color-surface: hsl(240 10% 10%)`, and muted text at `opacity: 0.7` (e.g. `.quick-amount-presets-hint`) can dip under 4.5:1. The skill says test dark mode contrast separately. (Primary body text `#fff`-ish on near-black is fine.)
- Login form inputs are **placeholder-only** (`Email` / `Password`, no visible labels) — same Form-rule miss, and visible on the login screen.

## 2. Performance (HIGH)

**Good** — this is a strength.

- Split critical CSS inlined-style path (`critical.css`) + deferred `main.css` preload swap (`index.html:36-46`).
- `preconnect` to fonts + Firebase; Google Fonts loaded with `display=swap`.
- Animations use compositor-friendly `transform`/`opacity`; `will-change`, `backface-visibility`, `translateZ(0)` on `.btn`.
- `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`.

**Recommendations**

- The skill calls for WebP/AVIF + image outlines (`img,video { outline: 1px solid rgba(0,0,0,.06); outline-offset:-1px }`). The app is icon/chart-driven so low impact, but the `store_icon.png` (150KB) and any raster assets could be WebP.
- Watch `will-change: transform, box-shadow` left on `.btn:hover` — keep it scoped (it is) so it doesn't pin layers permanently.

## 3. Typography (HIGH) — biggest opportunity

- **No `font-variant-numeric: tabular-nums` anywhere** (grep: 0 matches). For a money tracker with balances, "June Spent", per-row amounts and counters, this causes digit-width jitter as values change. The skill flags this as a HIGH item specifically for "prices, counters, table columns." Recommend a `[data-numeric], .amount, .price { font-variant-numeric: tabular-nums }` (or apply on the amount inputs and totals).
- **No `text-wrap: balance` on headings / `text-wrap: pretty` on body** (only a single unrelated `.view-text-wrap` utility). Cheap, global readability win.
- **Body font is `Inter`** (`tokens.css:313`), which is explicitly on the skill's Ban List ("signals AI-generated") when no DESIGN.md exists. Heading font `Outfit` is more distinctive. This is a soft, aesthetic call — but if you want to follow the skill's "pick a distinctive pairing" guidance, swap the body to something less defaulted.
- **Good:** font smoothing applied at root (`base.css:26`, `critical.css:59`); sensible 12/14/16/18/20/24/30/36 scale; line-heights 1.25/1.5/1.75; `p { max-width: 65ch }` at `--md` (`base.css:158`); fluid `clamp()` scale defined.
- Minor: base body type scale is good, but `.btn` / many controls use `0.875rem` (14px) — fine per the "never below 14px" floor, just at the floor.

## 4. Layout & Spatial (HIGH)

- **Spacing:** clean 4/8px system (`--spacing-xs…8xl`), used consistently via tokens. Matches the skill.
- **Radius:** tokenized (`--radius-sm/md/lg/full`) but applied as fixed values to both outer cards and inner controls. The skill's concentric rule (`outer = inner + padding`) isn't followed, so some nested elements (card → inner button/field) can look slightly "bloated." Low severity, easy polish.
- **Shadows over borders:** the system _defines_ layered shadows (`--shadow-sm…xl`, colored shadows) but most are single-layer (`0 4px 6px …`), and many surfaces use `1px solid var(--color-border)` borders rather than the skill's multi-layer shadow depth. Consider the 3-stop layered shadow recipe for elevated cards/modals.
- **Z-index:** uses ad-hoc values (`z-index: 1000` on dialog overlay/`mobile.css`) rather than a named scale (`--z-modal`, `--z-toast`…). Skill recommends a token scale.
- Container discipline is good: `--container-max-width: 600px`, safe-area insets, landscape/`@media` tuning.

## 5. Color & Theme (MEDIUM)

- **Good:** full HSL custom-property system, 9-step primary ramp, semantic tokens (`success/warning/error/info`, surface/elevated, text hierarchy), confident single hero accent (violet `hsl(250 84% 60%)`) on near-black — exactly the "dominant color + sharp accent" the skill praises. Committed dark theme (`color-scheme: dark`).
- **Hardcoded values leaking into components** (skill: "no hardcoded hex in components"): `#ef4444` in `ui.css:135-158`, and many `color: white` (≈25 across `ui.css`, `view-styles.css`, `enhanced-button.css`, `critical.css`). Prefer `--color-error` / `--color-text-on-primary`. (The hex inside the `prefers-contrast: high` block in `performance-accessibility.css` is acceptable — those are intentional overrides.)
- **Don't convey by color alone:** transaction type / expense vs income lean on color; verify each is also backed by a label/icon (the type toggle text helps).
- Gradients exist (`--gradient-*`) but are used tastefully on dark surfaces — not the banned "purple→blue gradient on white."

## 6. Motion & Interaction (MEDIUM)

- **`transition: all` used ~29 times** (e.g. `critical.css:122 .btn`, `forms-dialogs.css:642`). Skill rule: "No `transition: all` anywhere — specific properties only." Animating `all` risks janky/over-broad transitions. Also `--transition-hover: var(--duration-fast) var(--ease-out)` has no property → resolves to `all`.
- **`ease-in` used for exits/active** (`--animation-exit`, `--transition-active` → `var(--ease-in)`; `base.css:183`, `view-styles.css:877`). Skill: "Never use `ease-in` for UI animations — it front-loads the pause and feels sluggish." Prefer `ease-out` (enter) and a soft ease-out for exit.
- **No `@media (hover: hover) and (pointer: fine)` gate** (0 matches) around hover transforms — on touch devices these can cause stuck hover states. Skill recommends gating hover effects.
- **Modal/dialog enter** is `fadeIn` = opacity + `translateY(10px)` (`forms-dialogs.css:583`). Skill says modals should `fade + scale` from `transform-origin: center` (start `scale(0.95)`), not translate. Mobile drawer slide-up is correct for a sheet.
- **Custom easing curves** are decent (`cubic-bezier(0,0,0.2,1)` etc.) but milder than the skill's recommended expressive curves; fine for a "quiet" app.
- **Durations** are well within the 150–300ms budget (`--duration-fast 150 / normal 250 / slow 350`). Good.
- **Good:** reduced-motion respected; staggered enter on report rows (`reports.css:524-532`); `transform-origin: center bottom` on a chart element.

## 7. Polish & Details (LOW)

- **Press feedback present:** `.btn:active { transform: scale(0.96) }` ✓ (skill wants ~0.97).
- **Hover scales _down_** (`--hover-scale: scale(0.98)` on `.btn:hover`). Unusual — the skill's card/button hover convention is a slight _lift_ (`translateY(-1/-2px)` + shadow). Scaling down on hover (then further down on active) reads oddly; consider lift-on-hover, shrink-on-press.
- Loading spinner maintains button dimensions; shimmer skeleton tokens defined.
- Disabled state uses `opacity: 0.6` (skill suggests ~0.5 + `pointer-events:none`) — close enough.
- Few layered shadows / no image inset outline (see §4).

---

## Pre-Delivery Checklist (skill §10) — mapped to BlinkBudget

Typography

- [x] Font smoothing applied
- [ ] Headings use `text-wrap: balance` ← missing
- [ ] Dynamic numbers use `tabular-nums` ← missing (highest-value fix)

Color

- [~] Semantic tokens used — mostly, but hardcoded hex / `color:white` leak into components
- [~] WCAG AA contrast — re-verify muted-on-surface & `opacity:0.7` text in dark mode
- [x] Dark mode is the committed theme (test the few low-contrast cases above)

Spatial

- [ ] Concentric border radius ← not applied
- [x] 4/8px spacing scale
- [x] 44×44 hit areas
- [~] Shadows over borders — defined but underused; single-layer shadows

Motion

- [ ] No animation on high-frequency actions — tab/nav switches animate via `.btn`/`transition:all`
- [ ] No `transition: all` ← 29 occurrences
- [x] Staggered enter where multiple elements appear (reports)
- [x] `prefers-reduced-motion` respected

Accessibility

- [x] Keyboard accessible / semantic HTML / skip link
- [~] Focus rings — good overall; a few `:focus` (not `:focus-visible`) cases
- [ ] Visible labels — login + amount are placeholder-only visually
- [~] `aria-live` on dynamic updates — verify toasts/balances announce changes

---

## Top 7 recommended changes (highest value, lowest risk first)

1. **Add `tabular-nums`** to all money/number displays (totals, "June Spent", row amounts, counters, amount input).
2. **Add `text-wrap: balance`** to `h1–h6` and `text-wrap: pretty` to `p, li`.
3. **Replace `transition: all`** with explicit property lists; give `--transition-hover` a property.
4. **Stop using `ease-in`** for exits/active; switch to ease-out curves.
5. **Make the amount & login labels visible** (or pair input with a persistent floating label).
6. **Gate hover transforms** behind `@media (hover: hover) and (pointer: fine)`; flip button hover to lift-on-hover, shrink-on-press.
7. **Replace hardcoded `#ef4444` / `color: white`** in components with semantic tokens; re-check dark-mode contrast on muted text.
