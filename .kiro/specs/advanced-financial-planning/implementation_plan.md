# Implementation Plan - Advanced Financial Planning

This plan transforms BlinkBudget into a comprehensive financial planning platform by adding predictive analytics, investment tracking, and long-term goal modeling.

## User Review Required

> [!IMPORTANT]
> This update introduces new metadata for Accounts (credit limits, investment categories) and new storage entities for Goals and Investments.

> [!NOTE]
> Forecasting results use Exponential Smoothing and Moving Averages to provide estimates based on historical trends.

## Proposed Changes

### Core Planning Components (`src/core/`)

#### [NEW] [forecast-engine.js](file:///c:/Users/krase/repos/BlinkBudget/src/core/forecast-engine.js)
- Implement `exponentialSmoothing` (α = 0.3) for income/expense predictions.
- Add `detectSeasonalPatterns` using monthly multipliers.
- Implement `identifyRecurringTransactions` for high-confidence forecasting.

#### [NEW] [account-balance-predictor.js](file:///c:/Users/krase/repos/BlinkBudget/src/core/account-balance-predictor.js)
- Project balances for 6 months using `ForecastEngine` output.
- Support consolidated and per-account balance views.

#### [NEW] [risk-assessor.js](file:///c:/Users/krase/repos/BlinkBudget/src/core/risk-assessor.js)
- Detect low balance, overdraft, and credit limit risks.
- Evaluate emergency fund adequacy (3-6 months of expenses).

#### [NEW] [investment-tracker.js](file:///c:/Users/krase/repos/BlinkBudget/src/core/investment-tracker.js)
- CRUD operations for manual investment holdings.
- Allocation analysis (Asset Class, Sector, Geography).

#### [NEW] [goal-planner.js](file:///c:/Users/krase/repos/BlinkBudget/src/core/goal-planner.js)
- Long-term wealth projections (compound interest modeling).
- Required monthly savings calculations for specific goals (Retirement, House, etc.).

#### [NEW] [insights-generator.js](file:///c:/Users/krase/repos/BlinkBudget/src/core/insights-generator.js)
- Top Movers analysis (absolute and percentage changes).
- Timeline comparison with trend highlighting.

### Data Storage & Integration

#### [MODIFY] [storage.js](file:///c:/Users/krase/repos/BlinkBudget/src/core/storage.js)
- Extend `Account` object with `creditLimit`.
- Add storage management for `Investments` and `Goals`.
- Implement calculation caching to meet performance requirements.

### User Interface

#### [NEW] [FinancialPlanningView.js](file:///c:/Users/krase/repos/BlinkBudget/src/views/FinancialPlanningView.js)
- Dedicated section with navigation for Forecast, Investments, Goals, and Insights.
- Responsive charts using `ChartRenderer`.

## Verification Plan

### Automated Tests
- **Property-Based Testing**: Implement 20 correctness properties (e.g., "Balance Projection Mathematical Correctness") with 100+ iterations each.
- **Unit Tests**: Test specific algorithms (Exponential Smoothing) with known datasets.

### Manual Verification
- Verify risk alerts trigger correctly when projected balances hit thresholds.
- Validate allocation charts match manually entered investment data.
- Ensure 30-year wealth projections correctly model compound interest scenarios.
