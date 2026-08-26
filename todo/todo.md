# BlinkBudget To-Do List

[ ] when deleting a transaction show a quick `Undo` button

- Keeps `TransactionService.remove()` instant (hardware `transform/opacity` only)
- Show transient toast `Transaction deleted [Undo]` 4-5s `TIMING.ANIMATION_NORMAL`
- On `Undo` -> `StorageService` restore + `SyncService.pushToCloud(STORAGE_KEYS.TRANSACTIONS)` + `storage-updated` event
- Respects `prefers-reduced-motion`, no layout thrash

[ ] release TWA (Trusted Web Activity) as windows store app...
Lightweight distribution methods that leverage the existing web app without adding heavy framework dependencies.

[ ] Implement ability to disable the Currency sign in the app... src/utils/constants.js:14 — hardcoded €; make computed, should be tested if correctly detirmines, or perhaps location based?

[ ] src/core/custom-category-service.js:22-94 — manual reorder, it should be possible to use drag to reorder, not just the arrows.
