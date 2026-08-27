# Product — The 3-Click Principle & The One Theory

Related: [../summary.md](../summary.md) · [../ui/summary.md](../ui/summary.md) · [../data/authentication.md](../data/authentication.md)

## The One Theory

> **"Your 3-click habit builds a financial model that works for you."**

Every transaction logged in 3 clicks feeds a personal financial engine that gets smarter over time. The advanced layer (budgets, forecasts, insights, investments) exists not as a separate dashboard but as the _reason the 3-click habit compounds_ — each tap makes forecasts more accurate, budgets more relevant, insights more personal.

## The feature filter (ask before building anything)

_"Does this make the user more likely to log their next expense in 3 clicks?"_

- **Yes** → build it.
- **No** → don't.
- **Maybe** → find a way to make it yes, or drop it.

## Anti-goals (never add these)

- Collaboration / multi-user features
- Brokerage-grade portfolio management (the simple investments tracker stays — it's intentionally simple)
- Tax preparation
- Complex multi-entity financial tracking

## The canonical journey (PRD "Coffee Run Chronicle")

Buy coffee → waiting for receipt → **Click 1:** launch (PWA instant) → **Click 2:** tap amount → **Click 3:** tap category chip → done, transaction saved. Month-end: Reports & Insights show where money went. Every flow above ships as implemented code (see the 3-click form diagram in [../ui/summary.md](../ui/summary.md)).

## Design by subtraction

Users never see technical failure modes. Example: the `toast` bridge in `main.js`:

```js
window.addEventListener('toast', e => {
  const message =
    e.detail?.message ||
    'Unable to sync — saved locally, will sync when online.';
  import('./utils/toast-notifications.js')
    .then(({ showWarningToast }) => showWarningToast(message))
    .catch(() => {});
});
```

Firestore/auth codes stay in console + `last_sync_error` / `last_auth_error` localStorage keys (mapping rules in [../data/authentication.md](../data/authentication.md)).

## Privacy as a feature

- `PrivacyService.sanitizeDataForStorage(t, 'transaction')` on every transaction add (data minimization).
- `PrivacyControls` component + `privacy-service.js` let users redact/hide data.
- Emergency Export (`backup-service.js`): CSV/JSON export with privacy controls, background processing; `getAllForExport()` strips internal fields (`internalId`, `metadata`).

## Invariants

- Any new feature must pass the 3-click filter **before** implementation (chat-mode design first, per Lode workflow).
- Speed work always wins ties: `yarn run check` + targeted tests, then verify interaction count ≤ 3.
