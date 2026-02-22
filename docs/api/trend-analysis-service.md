# PatternAnalyzer API Reference

## Overview

The PatternAnalyzer provides comprehensive spending pattern analysis capabilities, including weekday vs weekend analysis, time-of-day patterns, frequency analysis, and trend alerts.

## Module Information

- Module: src/core/analytics/pattern-analyzer.js
- Requires: FilteringService, TRANSACTION_TYPES

## Method Signatures

### analyzeWeekdayVsWeekend

analyzeWeekdayVsWeekend(transactions, timePeriod): WeekdayWeekendAnalysis

### analyzeTimeOfDayPatterns

analyzeTimeOfDayPatterns(transactions, timePeriod): TimeOfDayAnalysis

### analyzeFrequencyPatterns

analyzeFrequencyPatterns(transactions, timePeriod, targetCategories): FrequencyAnalysis

### generateTrendAlerts

generateTrendAlerts(transactions, timePeriod, previousPeriod): TrendAlerts

---

## Methods

### analyzeWeekdayVsWeekend

Analyzes spending patterns comparing weekdays to weekends.

#### Parameters

| Parameter    | Type          | Required | Description                            |
| ------------ | ------------- | -------- | -------------------------------------- |
| transactions | Transaction[] | Yes      | Array of transaction objects           |
| timePeriod   | Object        | Yes      | Time period with startDate and endDate |

#### Return Value

Returns WeekdayWeekendAnalysis object with weekday, weekend, and comparison data.

#### Example

const analysis = PatternAnalyzer.analyzeWeekdayVsWeekend(transactions, timePeriod);
console.log(analysis.comparison.weekendPremiumPercentage);

---

### analyzeTimeOfDayPatterns

Analyzes spending patterns by time of day.

#### Parameters

| Parameter    | Type          | Required | Description                  |
| ------------ | ------------- | -------- | ---------------------------- |
| transactions | Transaction[] | Yes      | Array of transaction objects |
| timePeriod   | Object        | Yes      | Time period configuration    |

#### Return Value

Returns TimeOfDayAnalysis with periods: earlyMorning, morning, afternoon, evening, night.

---

### analyzeFrequencyPatterns

Analyzes how frequently specific categories are used.

#### Parameters

| Parameter        | Type          | Required | Description                    |
| ---------------- | ------------- | -------- | ------------------------------ |
| transactions     | Transaction[] | Yes      | Array of transactions          |
| timePeriod       | Object        | Yes      | Time period configuration      |
| targetCategories | string[]      | No       | Specific categories to analyze |

---

### generateTrendAlerts

Generates spending alerts and warnings based on detected patterns.

#### Parameters

| Parameter      | Type          | Required | Description                    |
| -------------- | ------------- | -------- | ------------------------------ |
| transactions   | Transaction[] | Yes      | Transaction data               |
| timePeriod     | Object        | Yes      | Current time period            |
| previousPeriod | Object        | No       | Previous period for comparison |

---

## Notes

- All analysis methods are static
- Filtering excludes ghost transactions and non-expenses
- Time periods use local timezone

---

_Template Version: 1.0_
_Last Updated: February 22, 2026_
