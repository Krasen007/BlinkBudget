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

//
Plan: Firebase sync + caching & UI integration for Investments and Goals
TL;DR — Add Investments and Goals to the existing SyncService and StorageService flow, implement per-item merge + cache invalidation, add small sync UI (status + conflict dialog) and inline form validation. This preserves offline-first behavior and provides deterministic LWW merging with a conflict hook for UX resolution.

Steps
Update src/core/sync-service.js: add INVESTMENTS and GOALS keys, implement mergeArraysById(localArray, cloudArray) and emit sync-conflict events for near-simultaneous edits.
Update src/core/storage.js: after investment/goal CRUD methods call SyncService.pushToCloud(STORAGE_KEYS.INVESTMENTS|GOALS, ...) and keep CacheService.del('portfolioSummary'|'goalsSummary').
Add invalidateCache() to src/core/forecast-engine.js and create src/core/cache-invalidator.js to centrally listen for storage-updated events and clear relevant cache keys. Import it in src/main.js.
Update src/views/FinancialPlanningView.js: load investments/goals in loadPlanningData, listen for storage updates for these keys, re-render charts, and surface a SyncStatus area. Add inline validation/error messages to investment and goal forms.
Add UI components: src/components/SyncStatus.js (sync indicator) and src/components/ConflictDialog.js (conflict resolution modal). Wire sync-conflict events from SyncService to open the dialog.
Tests & rollout: add tests/sync-service.test.js for merge behavior and update relevant cache/invalidation tests. Deploy behind a feature flag.
Further Considerations
Keep current single-document pattern
Unify timestamp fields (updatedAt vs updatedDate) across models to simplify merges.
Decide delete semantics: cloud-authoritative delete.
Pause for review — I will not start code changes until you confirm this plan or request edits.
