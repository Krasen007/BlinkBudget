# Roadmap — Open Items

Mirrors `todo/` at repo root (authoritative owner list lives there — `todo/todo.md`). Keep this file **current-state**: open work only, remove items when they ship.

## Open

1. **Undo button for deleted transactions** — keep `TransactionService.remove()` instant (transform/opacity only), transient toast `Transaction deleted [Undo]` 4–5 s, Undo restores via StorageService + `pushToCloud` + `storage-updated`. Design sketch in `todo/todo.md`.
2. **TWA → Windows Store** — package the existing web app as a Trusted Web Activity (`androidTWA/` exists for Android); no new framework deps.
3. **Configurable currency sign** — `CURRENCY_SYMBOL` hardcoded `'€'` at `src/utils/constants.js:14`; make it computed (locale/settings-based) with tests.
4. **Drag-to-reorder custom categories** — `src/core/custom-category-service.js` (reorder region ~lines 22–94) currently arrow-buttons only.

## Related context

- Data side of #4 and flag-category semantics: [../data/data-model.md](../data/data-model.md)
- Currency/theme plumbing: [../ui/styling.md](../ui/styling.md), [../terminology.md](../terminology.md)
- Distribution notes: [../terminology.md](../terminology.md) (TWA)

## Working agreements (standing, not tasks)

- `yarn run check` before commits; targeted vitest runs only.
- Chat-mode design → decision → implement → update lode (this repo) in the same session.
