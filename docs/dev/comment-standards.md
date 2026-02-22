# Inline Comment Standards

## Overview

This document defines the inline comment standards for all new code in BlinkBudget. Consistent commenting improves code readability, maintainability, and helps future developers understand the codebase.

---

## General Principles

1. **Write self-documenting code first** - Use clear variable and function names
2. **Comment the why, not the what** - Explain reasoning, not implementation
3. **Keep comments updated** - Outdated comments are worse than no comments
4. **Be concise** - Short, meaningful comments preferred

---

## Service Class Comments

### Module Header

Every service class file should include a module header comment:

```javascript
/**
 * [Service Name] - [Brief one-line description]
 *
 * [Detailed description of service purpose and functionality]
 *
 * @module [module-name]
 * @requires [dependency1]
 * @requires [dependency2]
 *
 * @example
 * const service = new ServiceName();
 * const result = await service.getData();
 */
```

### Method Comments

```javascript
/**
 * [Method Name] - [What this method does]
 *
 * [Detailed description if needed]
 *
 * @param {[type]} paramName - Description
 * @returns {[type]} Description of return value
 * @throws {ErrorType} When this error occurs
 */
```

### Example: Complete Service Class

```javascript
/**
 * AmountPresetService - Manages quick amount preset calculations
 *
 * This service analyzes transaction history to determine the most
 * frequently used expense amounts. These presets are displayed on
 * the main dashboard for faster transaction entry.
 *
 * @module services/amount-preset-service
 * @requires TransactionService
 * @requires StorageService
 *
 * @example
 * const presetService = new AmountPresetService();
 * const presets = presetService.calculatePresets(transactions);
 */
class AmountPresetService {
  /**
   * Calculates the most frequently used expense amounts
   *
   * Analyzes transaction history and returns the top amounts
   * sorted by frequency of use.
   *
   * @param {Transaction[]} transactions - Array of transactions to analyze
   * @returns {AmountPreset[]} Array of preset objects sorted by frequency
   * @throws {InsufficientDataError} When fewer than 4 transactions exist
   */
  calculatePresets(transactions) {
    // Implementation here
  }
}
```

---

## Component Comments

### Component Header

```javascript
/**
 * [Component Name] - [Purpose]
 *
 * [Description of component functionality and usage]
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Card title text
 * @param {string} props.subtitle - Optional subtitle
 * @param {Function} props.onClick - Click handler
 * @returns {HTMLElement} Rendered component
 */
```

### Event Handler Comments

```javascript
/**
 * Handles button click event
 *
 * @param {MouseEvent} event - Click event
 * @param {Object} event.target - Button element
 */
function handleButtonClick(event) {
  // Implementation
}
```

---

## Algorithm Comments

For complex algorithms, pattern recognition, or calculation logic:

```javascript
/**
 * [Algorithm Name] Algorithm
 *
 * @algorithm
 * @description [What the algorithm does]
 * @complexity Time: O(n), Space: O(n)
 * @references [Academic or industry references if applicable]
 *
 * Step 1: [Description]
 * Step 2: [Description]
 * Step 3: [Description]
 */
```

### Example: Preset Calculation Algorithm

```javascript
/**
 * Frequency-Based Preset Calculation Algorithm
 *
 * @algorithm
 * @description Calculates the most common expense amounts from
 *              transaction history using frequency analysis
 * @complexity Time: O(n log n), Space: O(n)
 *
 * Algorithm Steps:
 * 1. Filter transactions to only include expenses
 * 2. Group transactions by amount
 * 3. Sort groups by count (descending)
 * 4. Return top N amounts
 */
function calculateFrequencyPresets(transactions) {
  // Step 1: Filter expenses
  const expenses = transactions.filter(t => t.type === 'expense');

  // Step 2: Group by amount
  const groups = {};
  expenses.forEach(t => {
    groups[t.amount] = (groups[t.amount] || 0) + 1;
  });

  // Step 3: Sort by frequency
  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);

  // Step 4: Return top amounts
  return sorted.slice(0, 4).map(([amount]) => Number(amount));
}
```

---

## Configuration Comments

```javascript
/**
 * Configuration for [feature]
 *
 * @config
 * @property {number} MAX_PRESETS - Maximum number of presets to display
 * @property {number} MIN_TRANSACTIONS - Required transactions for calculation
 * @property {string} CACHE_KEY - LocalStorage key for caching results
 */
const CONFIG = {
  MAX_PRESETS: 4, // Cannot exceed 4 for UI layout
  MIN_TRANSACTIONS: 4, // Minimum data needed
  CACHE_KEY: 'presets', // LocalStorage namespace
};
```

---

## Required Comment Checklist

| Component Type     | Required Comments                                       |
| ------------------ | ------------------------------------------------------- |
| Service classes    | Module header, method descriptions, @returns, @example  |
| Utility functions  | Function purpose, parameter descriptions, return format |
| Components         | Prop types, default values, event handlers              |
| Complex algorithms | Algorithm explanation, complexity analysis, edge cases  |
| Configuration      | Value purpose, valid ranges, default behavior           |
| Constants          | Purpose and usage context                               |

---

## JSDoc Tags Reference

| Tag         | Usage                                        |
| ----------- | -------------------------------------------- |
| @module     | Identifies the module name                   |
| @requires   | Lists dependencies                           |
| @param      | Function parameter with type and description |
| @returns    | Return value description                     |
| @throws     | Error types that may be thrown               |
| @example    | Usage example                                |
| @algorithm  | Marks algorithm documentation                |
| @complexity | Time and space complexity                    |
| @references | External references                          |
| @config     | Configuration object                         |
| @property   | Object property                              |

---

_Standards Version: 1.0_
_Last Updated: February 22, 2026_
