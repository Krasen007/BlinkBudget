# BlinkBudget: Technical Design Document

## 1. Architecture Overview

BlinkBudget is a high-performance, local-first web application designed for extreme speed and simplicity. It avoids heavy frameworks in favor of "closer to the metal" web standards to ensure instant load times and zero-latency interactions.

### Core Stack

- **Runtime**: Browser (Vanilla JavaScript ES Modules)
- **Build Tool**: Vite (for fast HMR and optimized production builds)
- **Styling**: Vanilla CSS with CSS Variables (HSL theming)
- **State Management**: Custom Event-based Reactivity (Pub/Sub)
- **Routing**: Custom Hash-based Router
- **Persistence**: `localStorage` (via wrapper Service)

### Key Design Principles

1.  **Zero Dependencies**: Minimal external libraries. No React, Vue, or heavy UI kits.
2.  **Instant Interaction**: 3-click max workflow.
3.  **Local First**: All data lives in the user's browser for privacy and speed.

---

## 2. Project Structure

```text
src/
├── core/
│   ├── router.js       # Hash-based routing engine
│   ├── storage.js      # LocalStorage wrapper (CRUD wrapper)
│   └── events.js       # Simple Event Bus (optional)
├── components/         # Reusable functional components
│   ├── Button.js
│   ├── TransactionForm.js
│   └── ...
├── views/              # Page-level components
│   ├── DashboardView.js
│   ├── AddView.js
│   ├── EditView.js
│   └── SettingsView.js
├── styles/             # Global variables and utilities
│   ├── main.css
│   ├── tokens/         # Colors, spacing, typography variables
│   └── utilities/      # CSS utility classes
└── main.js             # Application entry point
```

## 3. Data Model (LocalStorage)

Data is stored as JSON strings in `localStorage`.

### `transactions` (Array)

List of all financial entries.

```javascript
[
  {
    id: 'uuid-v4',
    amount: 15.5,
    category: 'Food & Drink',
    type: 'expense', // 'expense' | 'income' | 'transfer'
    accountId: 'acc-1',
    toAccountId: null, // if transfer
    timestamp: '2025-12-13T10:00:00.000Z',
    note: 'Lunch',
  },
];
```

### `accounts` (Array)

User defined accounts.

```javascript
[
  {
    id: 'acc-1',
    name: 'Main Checking',
    type: 'checking',
    isDefault: true,
  },
];
```

### `settings` (Object)

App preferences.

```javascript
{
  "dateFormat": "US", // 'US' | 'EU' | 'ISO'
  "theme": "dark"
}
```

## 4. Component Pattern

We use a functional component pattern where functions return DOM elements.

```javascript
// Example Component
export const MyComponent = ({ label, onClick }) => {
  const el = document.createElement('button');
  el.className = 'btn';
  el.textContent = label;
  el.onclick = onClick;
  return el;
};
```

## 5. Deployment

- **Platform**: Static Web Host (Vercel/Netlify/GitHub Pages)
- **Build**: `npm run build` -> outputs to `dist/` folder.
