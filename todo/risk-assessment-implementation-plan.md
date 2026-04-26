# Risk Assessment Features Implementation Plan

## Overview

This plan outlines the implementation of 6 unused methods from `src/core/risk-assessor.js` into the BlinkBudget financial planning UI.

**Current Status:**

- Used methods (2/8): `assessEmergencyFundAdequacy`, `calculateOverallRiskScore`
- Unused methods (6/8): All other methods
- Target: Integrate all 6 unused methods into appropriate UI sections

## Features to Implement

### 1. Debt-to-Income Ratio Analysis

**Method:** `evaluateDebtToIncomeRatio(monthlyDebt, monthlyIncome)`

**Integration Point:** `OverviewSection.js`

- Add a new stat card for "Debt-to-Income Ratio"
- Display ratio percentage with color-coded risk level
- Show recommendation based on assessment
- Include in overall risk score calculation

**UI Components Needed:**

- Debt-to-Income stat card (similar to existing 4 cards)
- Risk level indicator (excellent/manageable/concerning/dangerous)
- Actionable recommendation text

**Data Requirements:**

- Monthly debt payments (from transactions with category 'Debt' or type 'debt')
- Monthly income (from income transactions)

**Priority:** High - Critical financial health metric

---

### 2. Spending Trend Analysis

**Method:** `analyzeSpendingTrends(expenseHistory)`

**Integration Point A:** `OverviewSection.js`

- Add spending trend indicator to existing "Risk Level" card
- Show trend icon (↑ stable ↓) with percentage change
- Include trend in risk score calculation

**Integration Point B:** `InsightsSection.js`

- Create dedicated "Spending Trends" subsection
- Display month-over-month changes
- Show volatility analysis
- Provide trend recommendations

**UI Components Needed:**

- Trend indicator widget (arrow + percentage)
- Mini sparkline chart for recent spending
- Volatility meter
- Recommendation card

**Data Requirements:**

- Historical expense data by month (last 6-12 months)
- Month-over-month change calculations

**Priority:** High - Important for financial awareness

---

### 3. Low Balance Warnings

**Method:** `generateLowBalanceWarnings(balanceProjections)`

**Integration Point:** `ForecastsSection.js`

- Add "Risk Warnings" section after projected balance chart
- Display overdraft warnings (critical severity)
- Display low balance warnings (high/moderate severity)
- Show month-by-month warning timeline

**UI Components Needed:**

- Warning alert cards (color-coded by severity)
- Warning timeline visualization
- Action buttons for each warning type
- Collapsible warning details

**Data Requirements:**

- Balance projections from `balancePredictor.projectBalances()`
- Already available in ForecastsSection

**Priority:** High - Critical for cash flow management

---

### 4. Debt Warnings

**Method:** `generateDebtWarnings(debtAnalysis)`

**Integration Point:** `InsightsSection.js`

- Create "Debt Analysis" subsection
- Display critical/high debt warnings
- Show debt ratio visualization
- Provide debt reduction recommendations

**UI Components Needed:**

- Debt warning cards (critical/high severity)
- Debt ratio gauge/meter
- Excess debt calculator
- Action plan suggestions

**Data Requirements:**

- Debt analysis from `evaluateDebtToIncomeRatio`
- Monthly debt and income data

**Priority:** Medium - Complements debt-to-income analysis

---

### 5. Investment Risk Warnings

**Method:** `generateInvestmentRiskWarnings(portfolioAnalysis)`

**Integration Point:** `InvestmentsSection.js`

- Add "Portfolio Risk Analysis" section
- Display concentration risk warnings (asset/sector)
- Show diversification recommendations
- Visualize portfolio allocation vs thresholds

**UI Components Needed:**

- Concentration risk cards
- Asset allocation heatmap
- Sector distribution chart
- Diversification score

**Data Requirements:**

- Portfolio analysis with asset/sector allocations
- Investment transaction data
- May need to add investment data tracking if not present

**Priority:** Low - Depends on investment feature usage

---

### 6. Risk Prioritization

**Method:** `prioritizeRisks(riskAssessments)`

**Integration Point A:** `OverviewSection.js`

- Use to order risk factors in overall risk score calculation
- Display prioritized risk list

**Integration Point B:** `InsightsSection.js`

- Create "Risk Prioritization" subsection
- Show ordered list of all risks by severity
- Display urgency indicators (immediate/urgent/important/monitor)
- Provide action items for each risk

**UI Components Needed:**

- Prioritized risk list (sorted by severity)
- Urgency badges
- Risk detail cards with action items
- Risk summary dashboard

**Data Requirements:**

- Array of all risk assessments from other methods
- Risk level data from all implemented features

**Priority:** Medium - Enhances overall risk visibility

---

## Implementation Order

### Phase 1: Core Financial Health (High Priority)

1. **Debt-to-Income Ratio** in OverviewSection
2. **Spending Trend Analysis** in OverviewSection (basic)
3. **Low Balance Warnings** in ForecastsSection

### Phase 2: Deep Analytics (Medium Priority)

4. **Spending Trend Analysis** in InsightsSection (detailed)
5. **Debt Warnings** in InsightsSection
6. **Risk Prioritization** in OverviewSection + InsightsSection

### Phase 3: Investment Features (Low Priority)

7. **Investment Risk Warnings** in InvestmentsSection

---

## Technical Implementation Details

### Data Preparation Helper Functions

Create utility functions in `src/utils/risk-data-helpers.js`:

```javascript
// Calculate monthly debt from transactions
export function calculateMonthlyDebt(transactions) {
  // Filter debt-related transactions
  // Sum monthly debt payments
}

// Calculate monthly income from transactions
export function calculateMonthlyIncome(transactions) {
  // Filter income transactions
  // Sum monthly income
}

// Generate expense history array
export function generateExpenseHistory(transactions, months = 12) {
  // Group expenses by month
  // Return array of { period, amount }
}
```

### Component Reusability

Create reusable warning components in `src/components/financial-planning/`:

- `RiskWarningCard.js` - Generic warning card with severity levels
- `TrendIndicator.js` - Arrow + percentage trend display
- `DebtAnalysisCard.js` - Debt-specific analysis display
- `SpendingTrendCard.js` - Spending trend visualization

### Styling Requirements

Add to `src/styles/components/financial-planning.css`:

- Warning severity colors (critical/high/moderate)
- Trend indicator styles
- Risk meter/gauge styles
- Priority list styles

---

## Testing Strategy

Skip for now.

---

## Dependencies

### Existing Components to Leverage

- `StatsCard.js` - Reuse for new stat cards
- `EmergencyFundCard.js` - Pattern for risk cards
- ChartRenderer - For trend visualizations
- COLORS constants - For severity color coding

### New Dependencies

- None required (uses existing utilities)

---

## Success Criteria

1. All 6 unused RiskAssessor methods are integrated into UI
2. Risk assessment data is accurately calculated and displayed
3. Users can see actionable recommendations for each risk
4. Risk prioritization helps users focus on most critical issues
5. All features follow existing BlinkBudget design patterns
6. No performance degradation from new calculations

---

## Notes

- Some features require additional data tracking (e.g., investment portfolio data)
- Consider adding data validation for edge cases (no income, no expenses, etc.)
- Risk thresholds in RiskAssessor constructor may need adjustment based on user feedback
- Consider adding user-configurable risk thresholds in settings

---

## Estimated Effort

- Phase 1: 4-6 hours
- Phase 2: 3-4 hours
- Phase 3: 2-3 hours
- Testing & Refinement: 2-3 hours

**Total Estimated: 11-16 hours**
