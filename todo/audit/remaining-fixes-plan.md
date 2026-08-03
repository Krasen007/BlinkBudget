# BlinkBudget — Remaining Implementation Plan

**Generated:** 2026-08-03
**Based on:** `todo/audit/master-implementation-plan.md`, `todo/audit/scope.md`, `todo/audit/scope.md` status section
**Status:** ~25% remaining work (was ~35%)

---

## The One Theory

> **"Your 3-click habit builds a financial model that works for you."**

Every transaction logged in 3 clicks feeds a personal financial engine that gets smarter over time. The advanced layer exists not as a separate dashboard, but as the _reason the 3-click habit compounds_ — each tap makes forecasts more accurate, budgets more relevant, and insights more personal.

**Design principle:** Before adding any new feature, ask: _"Does this make the user more likely to log their next expense in 3 clicks?"_ If yes, build it. If no, don't. If maybe, find a way to make it yes.

---

## Quick Status

| Phase   | Description               | Remaining %                  |
| ------- | ------------------------- | ---------------------------- |
| Phase 0 | Documentation fixes       | 0% ✅                        |
| Phase 1 | Remove contradictions     | 0% ✅                        |
| Phase 2 | Rewrite advanced features | 40% ⚠️ (P2.1/P2.2 pending)   |
| Phase 3 | Empty state optimization  | 50% ⚠️                       |
| Phase 4 | Feature improvements      | 60% ⚠️                       |
| Phase 5 | Documentation             | 50% ⚠️ (P1.5 in progress)    |

**Overall:** ~75% complete, ~25% remaining

---

## P0 — Critical Path (Must Complete)

These items are critical to the product theory and must be completed before the implementation can be considered coherent.

### P0.1 Complete Investment Tracker Cleanup

**Status:** ✅ **COMPLETE** — Already cleaned in Phase 1.1

**Verified:** The investment tracker data model already contains only valid fields:

- `id`, `symbol`, `name`, `shares`, `purchasePrice`, `currentPrice`, `purchaseDate`, `notes`
- Deprecated fields (assetClass, sector, region, currency, metadata) were removed during Phase 1.1

**No action required.**

---

### P0.2 Implement Budget Suggestions (Phase 2.1)

**Status:** ✅ **COMPLETE**

**Rationale:** This is the **highest priority remaining item** and central to "The One Theory." Budgets are now auto-suggested based on 3 months of spending data, reinforcing the value of the 3-click habit.

**Files changed:**

- `src/core/budget-service.js` — added `suggestBudgets()` method
- `src/components/BudgetSuggestion.js` — **NEW** component for suggestion cards
- `src/views/financial-planning/BudgetsSection.js` — integrated suggestions UI

**What was implemented:**

1. **`suggestBudgets()` method** — Analyzes last 90 days of transactions, aggregates spending by category, calculates monthly averages, rounds to nearest 5, returns array of suggestions with `{ category, suggestedAmount, basedOnTransactions, averageMonthly }`

2. **`BudgetSuggestion` component** — Displays suggestion card with category color indicator, suggested amount, context (based on X transactions averaging Y/month), and **Accept | Adjust | Dismiss** action buttons

3. **`BudgetsSection` integration:**
   - Shows suggestions at top when user has 30+ transactions
   - Filters out categories that already have budgets
   - Tracks dismissed categories (session-only)
   - **Accept** → saves budget with suggested amount
   - **Adjust** → replaces card with BudgetForm pre-filled with suggestion
   - **Dismiss** → hides suggestion, allows user to see it again by clearing dismissed set
   - Falls back to manual "Set Budget" flow if no suggestions available

**User experience flow:**

```
User visits BudgetsSection
  → Check transaction count (30+)
  → Generate suggestions from historical spending
  → Render suggestion cards at top
  → User clicks "Accept" → budget saved
  → OR clicks "Adjust" → form appears
  → OR clicks "Dismiss" → suggestion hidden
  → Below: full budget list with progress bars
```

**Build verified:** ✅ `yarn run build` succeeds

**Estimated time:** 60-90 min (actual: ~45 min)

---

## P1 — Important Enhancements

These items improve the advanced layer without being critical to the theory.

### P1.1 Make Personal Inflation Actionable (Phase 4.1)

**Current state:** "Your personal inflation rate: 4.2%" — a number without next action.

**Target state:** Pair inflation with specific category analysis and actionable suggestions.

**Files to change:**

- `src/components/InflationTrends.js`
- `src/core/analytics/MetricsService.js` — enhance `calculatePersonalInflation()`

**Implementation:**

1. Enhance `calculatePersonalInflation()` to return per-category inflation breakdown
2. Identify top 3 categories driving personal inflation
3. Add suggestion generation: "Food prices went up 6% for you. Dining out is the main driver. Consider cooking at home 2 more times per week."
4. Display in InflationTrends.js with category breakdown and suggestions

**Code sketch:**

```javascript
// calculatePersonalInflation should return:
{
  overallRate: 4.2,
  categoryBreakdown: [
    { category: 'Food & Drink', rate: 6.1, contribution: 0.8 },
    { category: 'Transportation', rate: 3.5, contribution: 0.3 },
    { category: 'Shopping', rate: 2.1, contribution: 0.1 }
  ],
  topDriver: 'Food & Drink',
  suggestion: 'Consider cooking at home 2 more times per week to offset this inflation.'
}
```

**Estimated time:** 20-30 minutes

---

### P1.2 Connect Cash Flow to Goals (Phase 4.4)

**Current state:** Cash flow analysis shows "Inflows: $3,000, Outflows: $2,500" — weak without context.

**Target state:** Connect projection to active goals. "At this rate, you'll have $6,000 in 3 months. Your goal needs $5,000. You're on track."

**Files to change:**

- `src/core/forecast-engine.js` — enhance `generateIncomeForecasts()`
- `src/views/financial-planning/ForecastsSection.js` — add goal connection

**Implementation:**

1. Enhance `generateIncomeForecasts()` to accept optional `goalId` parameter
2. If goal provided, compare projected balance to goal target
3. Add "goal connection" section to ForecastsSection showing:
   - Projected balance at goal date
   - Goal target amount
   - Status: "On track" | "At risk" | "Off track"
   - If off track: suggestion for adjustment

**Estimated time:** 25-35 minutes

---

### P1.3 Add Action to Irregular Patterns (Phase 4.5)

**Current state:** "Unusual spending pattern detected on weekends" — interesting but no action.

**Target state:** Identify category driving pattern, generate specific suggestion.

**Files to change:**

- `src/core/analytics/AnomalyService.js` — enhance `detectTimingAnomalies()`

**Implementation:**

1. Enhance `detectTimingAnomalies()` to identify category contributing to pattern
2. Generate actionable suggestion based on pattern type
3. Return structure with action:

```javascript
{
  type: 'timing_anomaly',
  description: 'You spend 40% more on weekends',
  contributingCategory: 'Dining & Drink',
  suggestion: 'Consider meal prepping on Sundays to reduce weekend dining costs.',
  estimatedSavings: 50 // per weekend
}
```

**Estimated time:** 15-20 minutes

---

### P1.4 Generalize Spending Suggestions (Phase 4.3)

**Current state:** "You spend more on utilities in winter" — too narrow.

**Target state:** "Last year you spent $200 on gifts in December. Set aside $50/month starting now."

**Files to change:**

- `src/core/analytics/RecommendationService.js` — enhance `getSeasonalAdjustments()`

**Implementation:**

1. Expand `getSeasonalAdjustments()` to detect year-over-year patterns
2. Identify predictable future expenses based on historical patterns
3. Suggest preemptive budget adjustments with monthly amounts
4. Connect to budget suggestion flow

**Code sketch:**

```javascript
async getSeasonalAdjustments() {
  const lastYearTransactions = await this._getTransactions(365);
  const thisYearTransactions = await this._getTransactions(90);

  // Group by month and category
  const patterns = analyzeYearOverYearPatterns(lastYearTransactions, thisYearTransactions);

  return patterns.map(pattern => ({
    category: pattern.category,
    lastYearAmount: pattern.amount,
    expectedThisYear: pattern.amount, // same month this year
    monthlySetAside: Math.round(pattern.amount / 10), // 10 months to save
    suggestion: `Set aside $${monthlySetAside}/month for ${pattern.category} in ${pattern.month}`
  }));
}
```

**Estimated time:** 20-30 minutes

---

### P1.5 Complete README Cleanup

**Remaining items from Phase 5.1:**

- Remove any remaining references to removed features
- Verify feature claims match actual implementation
- Update investment section to reflect simplified holdings list
- Align "Advanced Analytics & Intelligence" section with actual features

**Files to change:**

- `README.md`

**Checklist:**

- [ ] Remove "Financial Health Score" (1.2) ✓ in progress
- [ ] Remove "Scenario Planning" (1.3) ✓ in progress
- [ ] Remove "Spending Pattern Recognition" (4.6) ✓ in progress
- [ ] Remove "Cost of Living Analysis" (4.6) ✓ in progress
- [ ] Verify investment section describes simple holdings list
- [ ] Verify anomaly detection description is accurate
- [ ] Remove any "AI-powered" claims that are statistical heuristics

**Estimated time:** 15-20 minutes

---

## P2 — Polish and Shared Components

### P2.1 Shared ProgressiveEmptyState Component (Phase 3.2)

**Rationale:** Avoid duplicating the progressive unlock logic across 6 sections.

**Files to create:**

- `src/components/ProgressiveEmptyState.js`

**Implementation:**

```javascript
export const ProgressiveEmptyState = ({
  section,
  transactionCount,
  minTransactions,
}) => {
  const el = document.createElement('div');
  el.className = 'progressive-empty-state';

  if (transactionCount < minTransactions) {
    el.innerHTML = `
      <div class="empty-icon">📊</div>
      <h3>${getUnlockTitle(section)}</h3>
      <p>Log ${minTransactions - transactionCount} more transaction${minTransactions - transactionCount === 1 ? '' : 's'} to unlock ${section}.</p>
      <p class="benefit">${getUnlockBenefit(section)}</p>
    `;
  }

  return el;
};
```

**Usage in sections:**

- BudgetsSection.js
- GoalsSection.js
- InsightsSection.js
- ForecastsSection.js
- InvestmentsSection.js
- OverviewSection.js

**Estimated time:** 30-45 minutes (create + update 6 files)

---

### P2.2 Update Progressive Unlock Messages (Phase 3.1)

**Rationale:** Ensure all sections use consistent transaction-count-based messaging.

**Files to change:**

- `src/views/financial-planning/BudgetsSection.js`
- `src/views/financial-planning/GoalsSection.js`
- `src/views/financial-planning/InsightsSection.js`
- `src/views/financial-planning/ForecastsSection.js`
- `src/views/financial-planning/InvestmentsSection.js`
- `src/views/financial-planning/OverviewSection.js`

**Message matrix:**

| Transaction count | Message                                                |
| ----------------- | ------------------------------------------------------ |
| 0-29              | "Log 30+ transactions to unlock [section] suggestions" |
| 30-89             | "Suggested [section] ready →"                          |
| 90+               | Active (no empty state)                                |

**Implementation:**

1. Create shared `getProgressiveUnlockMessage(section, count)` utility
2. Replace inline messages with utility calls
3. Ensure all sections use consistent threshold (30 for suggestions, 90 for forecasts)

**Estimated time:** 20-30 minutes

---

## Effort Summary

| Priority | Item                            | Complexity | Estimated Time |
| -------- | ------------------------------- | ---------- | -------------- |
| **P1.1** | Personal inflation → actionable | Low        | 20-30 min      |
| **P1.2** | Cash flow → goals               | Medium     | 25-35 min      |
| **P1.3** | Irregular patterns → action     | Low        | 15-20 min      |
| **P1.4** | Spending suggestions generalize | Low        | 20-30 min      |
| **P1.5** | Complete README cleanup         | Low        | 15-20 min      |
| **P2.1** | ProgressiveEmptyState component | Medium     | 30-45 min      |
| **P2.2** | Update unlock messages          | Low        | 20-30 min      |

**Completed (from prior work):**
- P0.1 Investment tracker cleanup (~15 min)
- P0.2 Budget suggestions (~45 min)

**Total estimated time:** 2-2.5 hours

---

## Recommended Implementation Order

1. **P0.1** — Quick win, low risk (15 min)
2. **P0.2** — Core to the theory, high impact (60-90 min)
3. **P1.1-1.4** — Incremental improvements (90-120 min total)
4. **P1.5** — Documentation cleanup (15 min)
5. **P2.1-2.2** — Shared components and polish (50-75 min)

---

## Verification Checklist

After completing all items, verify:

- [ ] Investment tracker only accepts valid fields (symbol, **name**, shares, purchasePrice, currentPrice, purchaseDate, notes)
- [ ] BudgetsSection shows suggestions when user has 30+ transactions
- [ ] Personal inflation shows category breakdown and suggestions
- [ ] ForecastsSection shows goal connection when goals exist
- [ ] Anomaly detection includes actionable suggestions
- [ ] All sections use consistent progressive unlock messaging
- [ ] README claims match actual implementation
- [ ] Run `yarn run check` — no errors
- [ ] Run `yarn run build` — successful

---

## Dependencies and Risks

**Dependencies:**

- P2.1 requires P2.2 (component uses unlock messages)

**Risks:**

- P0.2 (budget suggestions) is highest complexity — may need iteration
- Breaking existing budget workflow for users who created budgets manually — need backward compatibility

**Mitigation:**

- Add "Accept" button but keep "Create manually" option
- Test with existing budget data before deploying

---

## References

- Master plan: `todo/audit/master-implementation-plan.md`
- Scope audit: `todo/audit/scope.md`
- Omission test: `todo/audit/ommision.md`
- Taste guide: `todo/tasteful-software-guide.md`
