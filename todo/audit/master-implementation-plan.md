# BlinkBudget — Master Implementation Plan

**Generated:** 2026-07-30
**Source files:** `todo/audit/scope.md`, `todo/audit/advancedlayer.md`, `todo/audit/ommision.md`, `todo/audit/investment.md`
**Status:** Ready for implementation

---

## The One Theory

> **"Your 3-click habit builds a financial model that works for you."**

Every transaction logged in 3 clicks feeds a personal financial engine that gets smarter over time. The advanced layer exists not as a separate dashboard, but as the *reason the 3-click habit compounds* — each tap makes forecasts more accurate, budgets more relevant, and insights more personal.

**Design principle:** Before adding any new feature, ask: *"Does this make the user more likely to log their next expense in 3 clicks?"* If yes, build it. If no, don't. If maybe, find a way to make it yes.

---

## Phase 0 — Already Completed

- [x] **Remove fabricated "Fraud Prevention" claim from README** (P0 #1 from scope.md)
- [x] **Audit every README feature claim against code** (P0 #2 from scope.md) — 55 fabricated method references corrected
- [x] **Fix documentation validator** — `methodExists()` now actually checks method names in file contents

---

## Phase 1 — Remove What Contradicts the Theory (P0)

### 1.1 Strip the investment tracker to "intentionally simple"

**Files to change:**
- `src/core/investment-tracker.js` (631 → ~250 lines)
- `src/views/financial-planning/InvestmentsSection.js` (1537 → ~500 lines)
- `src/views/financial-planning/OverviewSection.js` (if it references removed investment features)
- `src/utils/financial-planning-charts.js` (remove `createPortfolioCompositionChart()` if only used by investments)
- `tests/services/investment-tracker.test.js` (update tests)

**What to remove from the data model:**
- `assetClass` field (and the 8-class taxonomy: stocks, bonds, ETF, real estate, crypto, cash, commodities, other)
- `sector` field
- `region` field
- `currency` field (assume local currency)
- `lastPriceUpdate` field
- `metadata` object (no longer needed)

**Simplified data model:**
```javascript
{
  id, symbol, name, shares, purchasePrice, currentPrice, purchaseDate,
  notes  // free text only
}
```

**What to remove from the class (6 methods, ~223 lines):**
| Method | Lines | Reason |
|---|---|---|
| `calculateReturns()` | 75 | Annualized return calculation is brokerage-grade |
| `analyzeAssetAllocation()` | 47 | 8 asset classes violate the anti-goal |
| `analyzeSectorAllocation()` | 35 | Sector analysis is brokerage-grade |
| `analyzeGeographicAllocation()` | 35 | Geographic analysis is brokerage-grade |
| `getTopPerformers()` | 12 | Ranking is brokerage-grade |
| `getPortfolioSummary()` | 19 | Aggregates removed methods |

**What to keep:**
- `addInvestment()` — simplified: accept only symbol, shares, purchasePrice, purchaseDate, notes
- `updateInvestmentValue()` — manual price update
- `removeInvestment()`, `updateInvestment()`, `getAllInvestments()`, `getInvestment()`
- `calculatePortfolioValue()` — total worth
- `calculateGainsLosses()` — simplified: current value vs purchase value per holding, no annualized returns
- `clearAllInvestments()`, `batchSetInvestments()`, `_loadInvestments()`, `_saveInvestments()`

**What the simplified UI looks like:**
```
My Investments
━━━━━━━━━━━━━━━━━━━━━━━━━
Total Portfolio Value: $12,450
Total Gain/Loss: +$1,230 (+11.0%)

AAPL  —  10 shares @ $150  →  $1,500  (+$200)
MSFT  —  5 shares @ $380   →  $1,900  (+$150)
VTI   —  20 shares @ $240  →  $4,800  (+$300)

[+ Add Investment]  [Edit]  [Delete]
```

No charts. No allocation breakdowns. No sector/region analysis. No annualized returns. No top/bottom performer ranking. No type-specific form fields.

**What to remove from the UI (InvestmentsSection.js):**
- Portfolio composition pie chart
- Asset allocation display
- Sector allocation display
- Geographic allocation display
- Type-specific form fields (crypto units, real estate sqm, etc.)
- Net balance chart (if investment-specific)
- Investment goal tracking (goals are for savings, not investments)

**What stays in the UI:**
- Investment list (symbol, name, shares, price, current value, gain/loss)
- Add/edit/delete form (symbol, shares, purchase price, current price, purchase date, notes)
- Total portfolio value display
- Total gain/loss display

---

### 1.2 Remove the Financial Health Score

**Files to change:**
- `src/core/analytics/MetricsService.js` — remove `calculateFinancialHealthScore()` method
- `src/views/financial-planning/OverviewSection.js` — remove health score display
- `src/core/analytics/InsightsService.js` — remove any caller of `calculateFinancialHealthScore()`
- `README.md` — remove "Financial Health Score" claim

**Rationale:** A single opaque number compresses many dimensions. It announces cleverness without enabling a decision. The individual metrics (savings rate, income/expense ratio) are more useful and each maps to a specific action.

**What to keep instead:** The individual metrics that already exist:
- `calculateIncomeVsExpenses()` — income vs expense ratio
- `calculateSingleGoalProgress()` — savings rate
- Emergency fund ratio (if it exists)

---

### 1.3 Simplify scenario planning

**Files to change:**
- `src/core/forecast-engine.js` — remove `scenarioAnalysis()` method
- `src/views/financial-planning/ForecastsSection.js` — remove what-if UI, replace with inline projection
- `README.md` — remove "Scenario Planning" claim

**What to replace with:** A single "what if I save $X more?" projection inline with the existing forecast, not a separate scenario mode. This answers the most common question without adding a full scenario planner.

**Implementation sketch:**
```javascript
// Instead of a full scenario mode, add one inline calculation:
// "If you save $200 more per month, you'll reach your goal 3 months earlier."
// This lives on the Goals page, not as a separate Forecasts tab feature.
```

---

## Phase 2 — Rewrite Advanced Features to Be Read-Only by Default (P1)

### 2.1 Budgets: from CRUD to suggestions

**Files to change:**
- `src/views/financial-planning/BudgetsSection.js`
- `src/core/budget-service.js` (may need a `suggestBudgets()` method)
- `src/core/analytics/RecommendationService.js` (already has `getBudgetRecommendations()`)

**Current state:** User creates budgets manually (CRUD workflow). Empty state shows "create a budget" form.

**Target state:** Budgets are auto-suggested based on 3 months of spending. User can accept, adjust, or dismiss. No empty "create a budget" state.

**Key changes:**
1. On first visit with ≥30 transactions, show suggested budget limits based on historical spending
2. Each suggestion has: "Accept" | "Adjust" | "Dismiss" buttons
3. Accepted budgets become active and appear in the budget list
4. The empty state (when <30 transactions) says: "Log 30+ transactions to get personalized budget suggestions."

**Data flow:**
```
Transactions → RecommendationService.getBudgetRecommendations() 
  → suggested limits per category → BudgetsSection renders suggestions
  → User clicks "Accept" → BudgetService.save() → budget is active
```

---

### 2.2 Goals: from CRUD to projections

**Files to change:**
- `src/views/financial-planning/GoalsSection.js`
- `src/core/goal-planner.js` (may need a `suggestGoal()` method)
- `src/core/savings-goals-service.js`

**Current state:** User creates goals manually from an empty form.

**Target state:** Goals are projected from savings patterns. "At your current rate, you could save $X in 12 months. Want to set that as a goal?" One-click acceptance.

**Key changes:**
1. Analyze income - expenses = potential monthly savings
2. Project: "You could save $2,400 in 12 months. Set this as a goal?"
3. User can adjust the amount or timeline
4. The empty state (when <30 transactions) says: "Log more transactions to see what goals are realistic for you."

---

### 2.3 Anomaly detection: connect to the transaction list

**Files to change:**
- `src/views/DashboardView.js` — add anomaly indicators to transaction list items
- `src/core/analytics/AnomalyService.js` — may need a `getAnomaliesForTransactions()` method
- `src/components/TransactionListItem.js` — add anomaly visual indicator
- `src/views/financial-planning/InsightsSection.js` — keep anomaly summary but remove as primary location

**Current state:** Anomalies appear only in the Insights section (buried 2 tabs deep).

**Target state:** Anomalous transactions are visually marked in the main transaction list with a subtle indicator. Tapping shows why it was flagged.

**Implementation sketch:**
```javascript
// In TransactionListItem, add a small indicator:
// ⚠ icon next to anomalous transactions
// On tap: tooltip "This $200 transaction is 3x larger than your usual grocery trips."
```

---

## Phase 3 — Empty State Optimization (P2)

### 3.1 Progressive unlock messages

Every advanced section's empty state should connect back to the core habit. Instead of "create a budget" or "add an investment," show what the user gets for logging more transactions.

**Files to change:**
- `src/views/financial-planning/BudgetsSection.js`
- `src/views/financial-planning/GoalsSection.js`
- `src/views/financial-planning/InsightsSection.js`
- `src/views/financial-planning/ForecastsSection.js`
- `src/views/financial-planning/InvestmentsSection.js`
- `src/views/financial-planning/OverviewSection.js`

**Message matrix:**

| Transaction count | Budgets | Goals | Insights | Forecasts | Investments |
|---|---|---|---|---|---|
| 0-4 | "Log 30+ transactions to unlock budget suggestions" | "Log 30+ transactions to see what goals are realistic" | "Log 30+ transactions for personalized insights" | "Log 90+ transactions for forecasts" | "Track your holdings here" |
| 5-29 | Same | Same | Same | Same | Same |
| 30-89 | "Suggested budgets ready →" | "Projected savings ready →" | "Insights unlocked →" | "Log 90+ for forecasts" | Same |
| 90-364 | Active | Active | Active | Active | Same |
| 365+ | Active | Active | Active + annual review | Active | Same |

### 3.2 Shared empty state component

Consider creating a shared `ProgressiveEmptyState` component that takes a `minTransactions` prop and renders the appropriate message. This avoids duplicating the logic across 6 sections.

---

## Phase 4 — Feature Improvements (from Omission Test)

### 4.1 Personal Inflation Rate → make actionable

**Files to change:**
- `src/components/InflationTrends.js`
- `src/utils/inflation-chart-utils.js`

**Current:** "Your personal inflation rate: 4.2%" — a number without a next action.

**Target:** Pair with specific category inflation. "Food prices went up 6% for you. Dining out is the main driver." Then: "Consider cooking at home 2 more times per week."

**Implementation:**
1. Break down inflation by category (already possible with existing data)
2. Identify the top contributor to personal inflation
3. Show a specific suggestion tied to that category
4. Link to the relevant budget or category filter

---

### 4.2 Income/Expense Predictions → show uncertainty

**Files to change:**
- `src/core/analytics/PredictionService.js`
- `src/views/financial-planning/ForecastsSection.js`

**Current:** "Next month spending: $2,400" — false precision.

**Target:** "Next month spending: $2,400 (range: $2,100-$2,700)" with a visual range indicator.

**Implementation:**
1. Calculate confidence intervals from historical variance
2. Display as a range, not a single number
3. Show a trend arrow (↑/↓/→) with the prediction

---

### 4.3 Spending Reduction Suggestions → generalize to patterns

**Files to change:**
- `src/core/analytics/RecommendationService.js` — `getSeasonalAdjustments()`

**Current:** "You spend more on utilities in winter. Budget $50 extra." — too narrow.

**Target:** "Last year you spent $200 on gifts in December. Set aside $50/month starting now."

**Implementation:**
1. Analyze year-over-year patterns for each category
2. Identify predictable future expenses based on history
3. Suggest preemptive budget adjustments
4. Connect to the budget suggestion flow (Phase 2.1)

---

### 4.4 Cash Flow Analysis → connect to goals

**Files to change:**
- `src/core/forecast-engine.js` — `generateIncomeForecasts()`
- `src/views/financial-planning/ForecastsSection.js`

**Current:** "Predicted inflows: $3,000. Outflows: $2,500." — weak without context.

**Target:** "At this rate, you'll have $6,000 in 3 months. Your goal needs $5,000. You're on track."

**Implementation:**
1. Compare projected balance to active goals
2. Show goal progress relative to forecast
3. If off-track, suggest adjustment

---

### 4.5 Irregular Pattern Identification → add action

**Files to change:**
- `src/core/analytics/AnomalyService.js` — `detectTimingAnomalies()`

**Current:** "Unusual spending pattern detected on weekends" — interesting but no action.

**Target:** "You spend 40% more on weekends, mostly on Dining. Consider meal prepping on Sundays."

**Implementation:**
1. Identify the category driving the pattern
2. Generate a specific, actionable suggestion
3. Link to the category filter or budget

---

### 4.6 Remove features that fail the test

| Feature | Action | Reason |
|---|---|---|
| Cost of Living Analysis (`calculateCostOfLiving()`) | **REMOVE** | "Daily spending: $45" → no decision. No benchmark available. |
| Spending Pattern Recognition (`detectSeasonalPatterns()`) | **REMOVE** | "You spend more in summer on leisure" → interesting but not actionable. 40KB of TrendService code produces insights without decisions. |
| Investment Goals (in InvestmentsSection) | **REMOVE** | Goals are for savings, not investments. Investment tracking is a reference list, not a planning tool. |

---

## Phase 5 — Documentation & README Alignment (P3)

### 5.1 Rewrite the README

**Files to change:**
- `README.md`

**Changes:**
1. Rename "Advanced Analytics & Intelligence" to "Insights From Your Data"
2. Every feature description should answer: "What does your 3-click data tell you?"
3. Remove "AI-powered" language — these are statistical heuristics, not AI
4. Remove claims for removed features (Financial Health Score, Cost of Living, Scenario Planning, Investment Goals)
5. Update investment section to reflect simplified holdings list

### 5.2 Update AGENTS.md

**Files to change:**
- `AGENTS.md`

**Changes:**
1. Add the One Theory
2. Update the anti-goal to reflect the simplified investment tracker
3. Add the design principle: "Does this make the user more likely to log their next expense in 3 clicks?"

### 5.3 Update the audit document

**Files to change:**
- `todo/audit/scope.md`

**Changes:**
1. Mark P0 items as resolved
2. Add reference to this master implementation plan

---

## Effort Estimate

| Phase | Task | Files | Complexity | Risk | Estimated time |
|---|---|---|---|---|---|
| 1.1 | Strip investment tracker | 4-5 | Medium | Low | 45-60 min |
| 1.2 | Remove Financial Health Score | 3-4 | Low | Low | 15-20 min |
| 1.3 | Simplify scenario planning | 2-3 | Low | Low | 15-20 min |
| 2.1 | Budgets as suggestions | 3-4 | High | Medium | 60-90 min |
| 2.2 | Goals as projections | 3-4 | High | Medium | 60-90 min |
| 2.3 | Anomalies in transaction list | 3-4 | Medium | Low | 30-45 min |
| 3.1 | Progressive unlock messages | 6-8 | Medium | Low | 30-45 min |
| 4.1 | Personal Inflation → actionable | 2 | Low | Low | 15-20 min |
| 4.2 | Predictions show uncertainty | 2 | Low | Low | 15-20 min |
| 4.3 | Spending suggestions generalize | 1 | Low | Low | 10-15 min |
| 4.4 | Cash flow → goal connection | 2 | Low | Low | 15-20 min |
| 4.5 | Irregular patterns → action | 1 | Low | Low | 10-15 min |
| 4.6 | Remove failing features | 3-4 | Low | Low | 15-20 min |
| 5.1-5.3 | Documentation | 3 | Low | None | 20-30 min |

**Total:** ~35-45 files, estimated 5-7 hours of implementation time

---

## Recommended Implementation Order

1. **Phase 1 first** (removals) — lowest risk, immediately improves coherence
2. **Phase 4.6** (remove failing features) — pairs naturally with Phase 1
3. **Phase 2** (rewrites) — medium risk, builds on the cleaned-up foundation
4. **Phase 3** (empty states) — low risk, visual polish
5. **Phase 4.1-4.5** (improvements) — low risk, incremental
6. **Phase 5** (documentation) — last, reflects all changes

---

## What We Should NOT Do

- Add onboarding tours or tutorials (adds friction)
- Add "connect your bank" or auto-import (scope creep, security risk)
- Add notifications or alerts (distracts from the 3-click flow)
- Gamify logging (undermines the "unconscious habit" promise)
- Add benchmarking against other users (privacy concern, scope creep)
- Add investment price auto-updates (brokerage-grade feature)