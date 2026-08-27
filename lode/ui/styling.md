# Styling — PostCSS Pipeline & Theming

Related: [summary.md](summary.md) · [../practices.md](../practices.md)

## Pipeline (vite.config.js → css.postcss.plugins, in order)

1. `postcss-import` — inline `@import`s
2. `postcss-nested` — CSS nesting
3. `postcss-custom-media` — named media queries
4. `postcss-preset-env` (stage 3; nesting-rules & custom-media-queries **off** — plugins 2–3 already handle them)
5. `postcss-calc` (`preserve: false`)
6. `postcss-color-functional-notation`
7. `postcss-sorting` — **dev only**, fixed property order (position → display → box → flex → … → other)
8. `autoprefixer` (`> 1%`, last 2 versions, not dead, not ie 11)
9. **prod only:** `@fullhuman/postcss-purgecss` → `cssnano` (preset with `cssDeclarationSorter/zindex/mergeRules` off)
10. CSS minify: `lightningcss`; dev gets inline sourcemaps, prod none

## Purgecss safelist — why it exists

Purgecss scans `index.html` + `src/**/*.{js,html}` for class names. Because components build classes in JS (`el.className = 'btn btn-primary'`), dynamic/prefixed names are safelisted by regex: state prefixes (`active|disabled|loading|error|success|warning|info`), `mobile-`, animations (`fade|slide|bounce|pulse|spin`), pseudo/hover states, responsive prefixes, form states.

**Invariant:** if you construct class names dynamically in JS, either match a safelist pattern or extend the safelist — otherwise prod silently drops the CSS.

## Theming

- Dark theme default; all semantic colors are CSS custom properties (`--color-primary`, `--color-surface`, `--color-error`, …).
- JS references colors **only via variables** (`src/utils/constants.js`):

```js
export const COLORS = {
  PRIMARY: 'var(--color-primary)',
  ERROR: 'var(--color-error)',
  BACKGROUND: 'var(--color-background)',
  // ...
};
```

- Spacing (`XS 4px → XL 24px`), timing (`ANIMATION_FAST 200ms`, `ANIMATION_NORMAL 300ms`), z-index layers, breakpoints (`MOBILE 768`, `TABLET/DESKTOP 1024`) all live in `constants.js` — never hardcode magic numbers.
- Stylelint: `src/styles/**/*.css`, standard config; `.stylelintrc.json` + `.postcsssortrc.json`.

## Performance rules (from AGENTS.md)

- CSS transitions over rAF; transform/opacity for hardware acceleration; throttle scroll to 16 ms; batch DOM writes/reads (no layout thrashing); respect `prefers-reduced-motion`.
- Charts render via ChartRenderer with lazy Chart.js load (`chart-loader.js`, `charts` chunk).

## Lessons

- Legacy files (`src/pwa.js` dialogs) use inline `style.cssText` — tolerated, never imitate; use classes + variables.
- `purgecss variables: true, keyframes: true` — still verify visual regressions in a real build (`yarn run build`), dev mode skips purge entirely.
