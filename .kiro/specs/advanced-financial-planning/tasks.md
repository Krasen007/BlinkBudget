# Task: Advanced Financial Planning Implementation

## Phase 1: Core Calculation Engines

- [x] 1. **Forecast Engine**: Implement `ForecastEngine` with Exponential Smoothing and seasonal patterns.
- [x] 2. **Balance Predictor**: Create `AccountBalancePredictor` for 6-month projections and risk alerting.
- [x] 3. **Risk Assessor**: Implement `RiskAssessor` for emergency fund and debt-to-income analysis.

## Phase 2: Feature Specific Logic

- [x] 4. **Investment Tracker**: Develop `InvestmentTracker` with manual entry, asset/sector allocation, and performance monitoring.
- [x] 5. **Goal Planner**: Create `GoalPlanner` for long-term target tracking and 30-year wealth projections.
- [x] 6. **Insights Generator**: Implement `InsightsGenerator` for Top Movers and Timeline comparisons.

## Phase 3: Infrastructure & Data

- [ ] 7. **Data Integration**: Extend `StorageService` for new data models (investments, goals, account limits).
- [ ] 8. **Caching**: Implement incremental caching for expensive calculations.

## Phase 4: UI & Integration

- [x] 9. **FinancialPlanningView**: Build the new main view with tabbed/scroll-spy navigation.
- [x] 10. **Visualizations**: Create charts for projected balances, portfolio composition, and goal progress.
- [x] 11. **Scenario Discovery**: Add "What-If" modeling UI for testing financial changes.


// 
Add validation/error messages for the forms.
Persist cache invalidation
Add unit tests for the UI behaviors
implement firebase to sync the investments and goals