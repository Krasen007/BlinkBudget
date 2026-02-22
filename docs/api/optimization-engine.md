# ComparisonService API Reference

## Overview

The ComparisonService provides comprehensive spending comparison capabilities between different time periods. It analyzes behavioral changes, category differences, and generates actionable insights.

## Module Information

- Module: src/core/analytics/ComparisonService.js
- Requires: FilteringService, MetricsService, InsightsService

## Method Signatures

### comparePeriodsSpending

comparePeriodsSpending(transactions, currentPeriod, comparisonPeriod): PeriodComparison

### getHistoricalInsights

getHistoricalInsights(transactions, historicalPeriods): HistoricalInsights

---

## Methods

### comparePeriodsSpending

Compares spending patterns between two time periods.

#### Parameters

| Parameter        | Type          | Required | Description                        |
| ---------------- | ------------- | -------- | ---------------------------------- |
| transactions     | Transaction[] | Yes      | Array of all transactions          |
| currentPeriod    | Object        | Yes      | Current time period to analyze     |
| comparisonPeriod | Object        | Yes      | Previous period to compare against |

#### Return Value

Returns PeriodComparison object with overallComparison, categoryComparison, behaviorChanges, insights, and summary.

#### Example

const comparison = ComparisonService.comparePeriodsSpending(
transactions,
currentPeriod,
comparisonPeriod
);
console.log(comparison.summary.financialHealth);

---

### getHistoricalInsights

Analyzes spending patterns across multiple historical periods.

#### Parameters

| Parameter         | Type          | Required | Description                        |
| ----------------- | ------------- | -------- | ---------------------------------- |
| transactions      | Transaction[] | Yes      | All transaction data               |
| historicalPeriods | Object[]      | Yes      | Array of period objects to analyze |

#### Return Value

Returns HistoricalInsights with historicalInsights array, overallTrends, and preservedAt timestamp.

---

## Notes

- All methods are static and can be called without instantiation
- Period comparisons require at least one transaction in each period
- Insights are sorted by severity (high first)
- Historical trends require at least 2 periods

---

_Template Version: 1.0_
_Last Updated: February 22, 2026_
