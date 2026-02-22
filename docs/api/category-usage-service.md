# CategoryUsageService API Reference

## Overview

The CategoryUsageService provides statistics and analytics about how users interact with expense categories. This service tracks category frequency, usage patterns, and trends to power smart suggestions and analytics features.

## Module Information

- **Module:** `src/core/analytics/CategoryUsageService.js`
- **Requires:** `TransactionService`, `StorageService`

---

## Method Signatures

### getCategoryUsageStats

```javascript
getCategoryUsageStats(): CategoryUsageStats[]
```

### getMostFrequentCategories

```javascript
getMostFrequentCategories(limit?: number): CategoryUsageStats[]
```

### getCategoryTrends

```javascript
getCategoryTrends(categoryId: string): TrendData
```

---

## Methods

### getCategoryUsageStats

Returns comprehensive usage statistics for all categories.

#### Parameters

None

#### Return Value

Returns an array of `CategoryUsageStats` objects.

```javascript
{
  categoryId: string,    // Unique category identifier
  categoryName: string,  // Display name of the category
  totalAmount: number,   // Total spending in this category
  transactionCount: number,  // Number of transactions
  averageAmount: number, // Average transaction amount
  lastUsed: Date,        // Last time category was used
  percentage: number    // Percentage of total spending
}
```

#### Example Usage

```javascript
import { CategoryUsageService } from 'src/core/analytics/CategoryUsageService.js';

const categoryService = new CategoryUsageService();
const stats = categoryService.getCategoryUsageStats();

// Output:
[
  {
    categoryId: 'food',
    categoryName: 'Food & Drink',
    totalAmount: 450,
    transactionCount: 30,
    averageAmount: 15,
    lastUsed: new Date('2026-02-20'),
    percentage: 25,
  },
  {
    categoryId: 'transport',
    categoryName: 'Transport',
    totalAmount: 200,
    transactionCount: 20,
    averageAmount: 10,
    lastUsed: new Date('2026-02-19'),
    percentage: 11,
  },
];
```

---

### getMostFrequentCategories

Returns the most frequently used categories sorted by transaction count.

#### Parameters

| Parameter | Type   | Required | Default | Description                            |
| --------- | ------ | -------- | ------- | -------------------------------------- |
| limit     | number | No       | 10      | Maximum number of categories to return |

#### Return Value

Returns an array of `CategoryUsageStats` sorted by frequency.

#### Example Usage

```javascript
const topCategories = categoryService.getMostFrequentCategories(5);

// Output: Top 5 categories by transaction count
```

---

### getCategoryTrends

Returns trend data for a specific category over time.

#### Parameters

| Parameter  | Type   | Required | Description                       |
| ---------- | ------ | -------- | --------------------------------- |
| categoryId | string | Yes      | Unique identifier of the category |

#### Return Value

```javascript
{
  categoryId: string,
  monthlyData: [
    { month: '2026-01', amount: 150, count: 10 },
    { month: '2026-02', amount: 200, count: 15 }
  ],
  trend: 'increasing' | 'decreasing' | 'stable',
  changePercentage: number
}
```

#### Example Usage

```javascript
const trends = categoryService.getCategoryTrends('food');

// Output:
{
  categoryId: 'food',
  monthlyData: [...],
  trend: 'increasing',
  changePercentage: 33.3
}
```

---

## Data Structures

### CategoryUsageStats

```javascript
{
  categoryId: string,          // Unique category identifier
  categoryName: string,        // Display name
  totalAmount: number,         // Total spending amount
  transactionCount: number,    // Number of transactions
  averageAmount: number,       // Average transaction
  lastUsed: Date,             // Last usage timestamp
  percentage: number          // Share of total spending
}
```

### TrendData

```javascript
{
  categoryId: string,
  monthlyData: MonthlyData[],
  trend: 'increasing' | 'decreasing' | 'stable',
  changePercentage: number
}
```

---

## Error Handling

| Error Type            | Description                             |
| --------------------- | --------------------------------------- |
| CategoryNotFoundError | Thrown if category does not exist       |
| InsufficientDataError | Thrown if no transaction data available |

---

## Notes

- Statistics are calculated from expense transactions only
- Monthly data is limited to the last 12 months
- Trends compare current month to previous month
- The service caches results for performance

---

_Template Version: 1.0_
_Last Updated: February 22, 2026_
