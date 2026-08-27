# BlinkBudget — Living Summary

> One-paragraph snapshot of the system as it exists **now**. Update this whenever the code changes shape.

BlinkBudget is a zero-runtime-dependency (except `chart.js` + `firebase`) expense-tracking PWA whose entire product promise is logging any purchase in **3 clicks max**. It is vanilla JavaScript (ES modules) built with Vite, styled through an 11-plugin PostCSS pipeline, and deployed to Netlify. Data lives **local-first** in `localStorage` behind domain services in `src/core/`, with optional Firebase Auth + Firestore sync that is fully bypassed in `localMode` (no Firebase env vars → local-only). There is no framework: state flows through DOM `CustomEvent`s (`storage-updated`, `categories-updated`, `auth-state-changed`), routing is a custom hash router (`src/core/router.js`) with a route guard, and views are swapped into `#app` by `ViewManager`. UI is built from functional components that return DOM elements.

## Quick facts

- **Entry:** `index.html` → `src/main.js` (bootstrap) + `src/pwa.js` (service worker via `vite-plugin-pwa`)
- **Commands:** `yarn run dev` (:3000) · `yarn run build` · `yarn test` (Vitest, jsdom) · `yarn run check` · `yarn run fix`
- **Toolchain:** Node ≥26, Yarn 4 (`packageManager: yarn@4.17.1`), Vite 8 (rolldown-vite override, `minify: 'oxc'`)
- **Deploy:** Netlify (`netlify.toml`) + Firebase (Auth/Firestore) · TWA/Android wrapper in `androidTWA/`
- **Version:** `package.json` version is injected as `__APP_VERSION__` at build time (used by PWA update flow)
- **Product spec:** [../docs/prd.md](../docs/prd.md) · agent rules: [../AGENTS.md](../AGENTS.md)

## Where to look next

| I need to understand…         | Read                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| How the app boots             | [architecture/summary.md](architecture/summary.md)                     |
| Routing, views, lazy loading  | [architecture/routing-and-views.md](architecture/routing-and-views.md) |
| Data model & services         | [data/data-model.md](data/data-model.md)                               |
| Cloud sync & offline          | [data/sync.md](data/sync.md)                                           |
| Auth & local mode             | [data/authentication.md](data/authentication.md)                       |
| Component/UI conventions      | [ui/summary.md](ui/summary.md)                                         |
| CSS pipeline & theming        | [ui/styling.md](ui/styling.md)                                         |
| Product principles (3 clicks) | [product/three-clicks.md](product/three-clicks.md)                     |
| Active TODOs                  | [plans/roadmap.md](plans/roadmap.md)                                   |

Full index: [lode-map.md](lode-map.md)
