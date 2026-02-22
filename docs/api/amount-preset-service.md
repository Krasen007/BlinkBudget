# AmountPresetService API Reference

## Overview

The AmountPresetService is responsible for calculating and managing quick amount presets displayed on the main dashboard. These presets show the four most commonly used expense amounts for faster transaction entry.

## Module Information

- **Module:** `src/core/amount-preset-service.js`
- **Requires:** `TransactionService`, `StorageService`

---

## Method Signatures

### calculatePresets

```javascript
calculatePresets(transactions: Transaction[]): AmountPreset[]
```

### getTopAmounts

```javascript
getTopAmounts(limit?: number): number[]
```

### refreshPresets

```javascript
refreshPresets(): void
```

---

## Methods

### calculatePresets

Calculates the most frequently used expense amounts from transaction history.

#### Parameters

| Parameter    | Type          | Required | Description                             |
| ------------ | ------------- | -------- | --------------------------------------- |
| transactions | Transaction[] | Yes      | Array of transaction objects to analyze |

#### Return Value

Returns an array of `AmountPreset` objects sorted by frequency.

```javascript
{
  amount: number,      // The preset amount (e.g., 5, 10, 20, 50)
  count: number,        // Number of times this amount was used
  percentage: number,   // Percentage of total transactions
  category: string      // Most common category for this amount
}
```

#### Example Usage

```javascript
import { AmountPresetService } from './services/amount-preset-service.js';

const presetService = new AmountPresetService();
const transactions = transactionService.getAllTransactions();
const presets = presetService.calculatePresets(transactions);

// Output:
[
  { amount: 10, count: 25, percentage: 15.2, category: 'Food & Drink' },
  { amount: 5, count: 20, percentage: 12.1, category: 'Coffee' },
  { amount: 20, count: 15, percentage: 9.1, category: 'Transport' },
  { amount: 50, count: 10, percentage: 6.1, category: 'Groceries' },
];
```

---

### getTopAmounts

Returns the top N most frequently used amounts as simple numbers.

#### Parameters

| Parameter | Type   | Required | Default | Description                         |
| --------- | ------ | -------- | ------- | ----------------------------------- |
| limit     | number | No       | 4       | Maximum number of amounts to return |

#### Return Value

Returns an array of numbers representing the top amounts.

#### Example Usage

```javascript
const topAmounts = presetService.getTopAmounts(4);
// Output: [10, 5, 20, 50]

const top2 = presetService.getTopAmounts(2);
// Output: [10, 5]
```

---

### refreshPresets

Forces a recalculation of presets from current transaction data.

#### Parameters

None

#### Return Value

Void - updates internal preset cache

#### Example Usage

```javascript
// After adding a new transaction
presetService.refreshPresets();
const newPresets = presetService.getTopAmounts();
```

---

## Data Structures

### AmountPreset

```javascript
{
  amount: number,       // The preset dollar amount
  count: number,         // Frequency count from history
  percentage: number,    // Percentage of all transactions
  category: string      // Associated category
}
```

### Transaction

```javascript
{
  id: string,
  amount: number,
  type: 'expense' | 'income',
  category: string,
  date: Date,
  description: string
}
```

---

## Error Handling

| Error Type              | Description                               |
| ----------------------- | ----------------------------------------- |
| InvalidTransactionError | Thrown if transaction data is invalid     |
| InsufficientDataError   | Thrown if fewer than 4 transactions exist |

---

## Notes

- Presets are calculated from expense transactions only (income excluded)
- Minimum of 4 transactions required to generate presets
- Presets automatically update when new transactions are added
- The service caches results for performance

---

_Template Version: 1.0_
_Last Updated: February 22, 2026_
