# BlinkBudget

Extremely fast personal expense tracker. Core promise: log a purchase in **3 clicks or fewer**.

**Design test for any new feature:** does it make the user more likely to log their next expense in 3 clicks? If yes, build it. If no, don't. If maybe, find a way to make it yes.

**Scope guard:** BlinkBudget is for individuals who want to understand their spending in seconds. Do not add collaboration, tax prep, multi-entity tracking, or brokerage-grade portfolio features. The existing savings goals and investments features stay; they are intentionally simple.

## Stack

- Vanilla JavaScript (ES6+ modules), Vite, PostCSS, Vitest
- Netlify (hosting), Firebase (auth + database)
- **Zero runtime frontend dependencies.** No React/Vue/other frameworks. Build/test tooling is fine.
- Local first: `localStorage` is the app's working store; signed-in users sync data with Firebase in the background, and the app remains usable offline.
- State: standard DOM events (`addEventListener` / `dispatchEvent`); custom window events include `amount-presets-changed`, `anomaly-dismissed`, `auth-state-changed`, `backup-operation`, `categories-updated`, `chartSegmentClick`, `connection-change`, `date-format-changed`, `forecast-invalidate`, `keyboardchange`, `mobile:orientationchange`, `storage-updated`, `sync-conflict`, `sync-conflict-resolution`, `sync-error`, `sync-state`, and `toast`.
- Routing: custom hash-based router in `src/router/`

## Layout

- `src/core/` services and utilities (StorageService, etc.)
- `src/components/` reusable UI, functional components returning DOM elements
- `src/views/` page-level components
- `src/styles/` CSS (PostCSS)
- `src/utils/` utility functions
- `src/router/` router
- `src/main.js` entry point; `src/pwa.js` PWA/service worker setup
- Product requirements: `docs/prd.md`. Read it before changing user-facing flows.

## Commands

Dev environment is Windows (PowerShell). Prefer your built-in file read/search/edit tools over shelling out. If you must use the shell, use PowerShell (`Get-Content`, `-replace`), not `cat`/`sed`.

- `yarn run dev` start Vite at http://localhost:3000
- `yarn run build` production build to `/dist`
- `yarn test <path>` run a targeted test, e.g. `yarn test src/core/StorageService.test.js`. Do not run the whole suite.
- `yarn run fix` auto-fix JS, CSS, and formatting
- `yarn run check` run before every commit (lint, CSS lint, formatting check, and docs validation)

## Code standards

Components are functions that return a DOM element, not classes:

```javascript
export const MyComponent = ({ label, onClick }) => {
  const el = document.createElement('button');
  el.className = 'btn';
  el.textContent = label;
  el.onclick = onClick;
  return el;
};
```

- Style with CSS classes and CSS variables. No inline styles for static values.
- Untrusted input goes in with `textContent`, never `innerHTML`. If `innerHTML` is unavoidable, escape first with an `escapeHtml` utility.
- Keep files under 500 lines.
- When removing or deprecating a feature, also delete its now-unused CSS classes and .js files.

## Performance

- Prefer CSS transitions over `requestAnimationFrame`.
- Animate with `transform` and `opacity` only.
- Throttle scroll handlers to 16ms.
- Batch DOM reads and writes to avoid layout thrashing.

## Data model

Persisted in localStorage. Authoritative documented shapes: [src/core/types.js](src/core/types.js)

- **Transaction:** `id`, `amount`, `category`, `type` (`expense` | `income` | `transfer` | `refund`), `accountId`, `toAccountId` (transfers only), `timestamp` (ISO), `note`, `tags` (optional, at most one expense flag name)
- **Category:** `id`, `name`, `type`, `color`, `showAsCheckbox` (flag categories; expense only)
- **Account:** `id`, `name`, `type`, `isDefault`
- **Settings:** `dateFormat` (`US` | `EU` | `ISO`), `theme`

## Boundaries

**Always:** functional components, vanilla CSS via PostCSS, sanitize user input, honor the 3-click principle.

**Ask first:** adding dependencies, changing Firebase configuration, changing the core router, significant data model changes.

**Never:** use React/Vue/heavy frameworks, hardcode secrets or API keys, render unsanitized input, edit `node_modules/` or `vendor/`.
