# BlinkBudget To-Do List

[ ] when deleting a transaction show a quick `Undo` button

- Keeps `TransactionService.remove()` instant (hardware `transform/opacity` only)
- Show transient toast `Transaction deleted [Undo]` 4-5s `TIMING.ANIMATION_NORMAL`
- On `Undo` -> `StorageService` restore + `SyncService.pushToCloud(STORAGE_KEYS.TRANSACTIONS)` + `storage-updated` event
- Respects `prefers-reduced-motion`, no layout thrash

[ ] Mask technical error messages from Firestore operations
Generic `Unable to sync right now, changes saved locally` is correct `Design by subtraction`. But don't swallow `console.error`. Wrap `sync-service.js:pushToCloud` / `auth-service.js` in `userMessage + logTechnicalError()` - you need the technical error to debug sync.

- `auth-service.js:291-317` ✅ Good: `console.warn('[AuthService]...', error.code)` + sanitized `message` + `last_auth_error` in localStorage for debug. Keep this.
- `sync-service.js:93-103` ❌ Leaks: `setDoc( sanitize() )` failure bubbles raw `FirebaseError: permission-denied / unavailable` to UI. Wrap it:
  // sync-service.js pushToCloud catch
  } catch(e){
  console.error('[Sync] pushToCloud failed', dataType, e.code, e) // keep for you
  window.dispatchEvent(new CustomEvent('toast', {detail:{message:'Unable to sync — saved locally, will sync when online.'}}))
  }
  `Design by subtraction` = user never sees `firestore/unavailable`. You still do via console.

[?] data integrity check adding labels - Already mitigated.\_\_ `data-integrity-service.js:8-13 SETTINGS_EXCLUDED_KEYS = ['custom_categories', 'category_usage'...]` + `getAllSettings:872 skip` already prevents mutation. No need to `investigate` for weeks. Add 1 test `data-integrity-categories.test.js` asserting `validateSetting` doesn't touch `label` and close it.
Add `tests/core/data-integrity-categories.test.js` -> `performIntegrityCheck()` must not mutate `category.label` / `CATEGORY_DEFINITIONS` (Bulgarian `Храна/Заведения`), then close issue. 30 min, not weeks.

[ ] release TWA (Trusted Web Activity) as windows store app...
Lightweight distribution methods that leverage the existing web app without adding heavy framework dependencies.

[ ] Implement ability to disable the Currency sign in the app... src/utils/constants.js:14 — hardcoded €; make computed, should be tested if correctly detirmines, or perhaps location based?

[ ] src/core/custom-category-service.js:22-94 — manual reorder, it should be possible to use drag to reorder, not just the arrows.
