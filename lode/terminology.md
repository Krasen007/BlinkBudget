# Terminology — BlinkBudget Domain Language

Short entries: **term** — meaning. Grouped by domain. Keep alphabetized inside groups.

## Product & philosophy

- **3-click principle** — any expense must be loggable in ≤3 interactions from purchase. Non-negotiable feature filter (see [product/three-clicks.md](product/three-clicks.md)).
- **The One Theory** — "Your 3-click habit builds a financial model that works for you." Advanced features exist to make the 3-click habit compound.
- **Design by subtraction** — hide technical complexity from users; e.g. the generic `toast` event bridge means UI never sees raw Firestore error codes.
- **Local-first** — `localStorage` is the source of truth; the cloud is a backup/multi-device channel. App is fully usable offline.
- **Flag category** — custom category with `showAsCheckbox: true` (expense-only). Rendered as a checkbox on the transaction form and stored as a **tag** on the transaction (at most one).
- **Ghost transaction** — placeholder transaction fields (`isGhost`, `ghostId`, `movedToDate`, `originalDate`) used by dashboard month/recurring logic; stripped when copying.
- **Bulgarian default categories** — built-in categories are in Bulgarian (e.g. `Храна` = food, `Заведения` = restaurants, `Заплата` = salary). Definitions/colors in `src/utils/constants.js`.
- **Undo toast** — transient 5 s toast after a transaction delete (single or bulk) with an **Undo** action; restores the exact removed object(s) at their original positions via `TransactionService.restore()` (see [data/data-model.md](data/data-model.md), [ui/summary.md](ui/summary.md)).

## Architecture

- **`config.localMode`** — true when no `VITE_FIREBASE_*` env vars exist (and not test mode): Firebase is never initialized, auth/sync disabled, all routes open.
- **`auth_hint`** — localStorage flag (`'true'`) meaning "user was authenticated recently". Lets mobile nav render before Firebase resolves and gives the route guard grace.
- **StorageService (Bridge)** — facade in `src/core/storage.js` that delegates to domain services for backward compatibility; retains `_pushToCloudSafe` as an alias for `SyncService.pushToCloudSafe`.
- **`pushToCloudSafe`** — `SyncService`'s canonical synced-write funnel: per-key serialization, 3 retries (500 ms ×2 backoff + ≤200 ms jitter), never throws, emits `sync-error` + `toast` on final failure. Used by all persisting domain services and the bridge.
- **Domain services** — `TransactionService`, `AccountService`, `SettingsService`, `BudgetService`, `GoalPlanner`, `InvestmentTracker`, `CustomCategoryService`. Each owns one `STORAGE_KEYS` slice.
- **STORAGE_KEYS** — canonical localStorage key constants (`blinkbudget_transactions`, `blinkbudget_accounts`, `custom_categories`, `blink_settings`, `blinkbudget_investments`, `blinkbudget_goals`, `blinkbudget_budgets`, dashboard filter keys, `blinkbudget_click_tracking`).
- **ViewManager** — singleton that owns `#app`; `setView(el)` is the only way a view gets mounted.
- **ViewPreloader / `loadCachedOrImport`** — preloads + caches lazily imported view modules so route changes are instant.
- **NavigationState** — tracks `lastActiveView` and navigation state; `setLastActiveView` is called by every route handler.
- **analyticsCache** — TTL cache (30 s) for computed summaries (portfolio, goals); invalidated on writes.
- **CacheInvalidator** — centralized cache invalidation on data changes.
- **PlanningDataManager** — shared data access layer for financial-planning sections (`src/core/financial-planning/`).

## Events (the state bus)

- **`storage-updated`** — `CustomEvent(detail: {key})` dispatched after every local write; UI re-renders on this.
- **`categories-updated`** — fired by category-manager route so selectors app-wide refresh.
- **`auth-state-changed`** — `detail: {user}` after `AuthService.init` callback resolves.
- **`sync-error`** — cloud push failed after retries (data is still saved locally). Dispatch-only today — no listener.
- **`sync-state`** — push lifecycle from `_executePush`: `{dataType, state: 'syncing'|'synced'|'error', isNetworkError?}`. Dispatch-only today — no listener.
- **`sync-conflict`** — near-simultaneous edit detected (≤2 s apart, differing payloads); cloud version applies until user resolves via ConflictDialog.
- **`toast`** — generic user-facing message bridge; consumed in `main.js` via dynamic import.
- **`connection-change`** — `detail: {isOnline}` from SyncService online/offline monitoring.
- **`sync-conflict-resolution`** — user picked local/cloud in `ConflictDialog`; SyncService applies it.

## Diagnostics keys (localStorage)

- **`last_sync_error`** / **`last_auth_error`** — JSON `{code, message, timestamp}` written when cloud/auth fails; full details for debugging, never shown raw to users.
- **`blinkbudget-version`** — last-seen app version; drives "just updated" confirmation.

## Distribution

- **TWA** — Trusted Web Activity (`androidTWA/`); planned Windows Store packaging (see [plans/roadmap.md](plans/roadmap.md)).
- **`__APP_VERSION__`** — build-time constant from `package.json` (Vite `define`).
