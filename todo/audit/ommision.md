Apply the Omission test to each analytics feature. For every one of the ~20 "Advanced Analytics & Intelligence" features, ask: what core-polish work was not done because this was built? The Guide: "What are we choosing NOT to build by building this?"
Cut or consolidate features that produce outputs without decisions. "Personal Inflation Rate" and "Financial Health Score" are numbers without a next action. The Guide: "DON'T build features that don't serve the core problem." If a feature doesn't change a user's behavior, it's decoration.
Here is what we can do to improve them to serve better the user:

**7. Irregular Pattern Identification** → `detectTimingAnomalies()`

- Output: "Unusual spending pattern detected on weekends"
- Decision: "Why am I spending more on weekends?"
- Verdict: **KEEP** but weak — the insight is interesting but the action isn't clear. Needs to be paired with "here's what you can do."
  **9. Income/Expense Predictions** → `generatePredictions()`

- Output: "Next month spending: $2,400 (range: $2,100-$2,700)"
- Decision: "I should save more this month to prepare"
- Verdict: **KEEP** but needs to show the range/uncertainty, not a false-precision single number.

**13. Personal Inflation Rate** → `calculatePersonalInflation()` in InflationTrends

- Output: "Your personal inflation rate: 4.2%"
- Decision: None. What do you do with this number?
- **Fix**: Pair with specific category inflation. "Food prices went up 6% for you. Dining out is the main driver." Then: "Consider cooking at home 2 more times per week" — that's a decision.

**14. Financial Health Score** → `calculateIncomeVsExpenses()` (was `calculateFinancialHealthScore()`)

- Output: "Your financial health score: 72/100"
- Decision: None. Is 72 good? What do I do differently?
- **Fix**: Remove the composite score. Keep the individual metrics (savings rate, emergency fund ratio, debt-to-income). Each of those maps to a decision.

**15. Cost of Living Analysis** → `calculateCostOfLiving()`

- Output: "Daily spending: $45. Monthly: $1,350. Top category: Dining."
- Decision: Weak. "My daily spending is $45" → so what? What's a good number for someone like me?
  **Fix**: REMOVE.

**17. Spending Reduction Suggestions** → `getSeasonalAdjustments()`

- Output: "You spend more on utilities in winter. Budget $50 extra."
- Decision: Possible, but seasonal adjustments are too narrow.
- **Fix**: Generalize to "upcoming spending patterns" — "Last year you spent $200 on gifts in December. Set aside $50/month starting now."

-**18. Spending Pattern Recognition** → `detectSeasonalPatterns()`

- Output: "You spend more in summer on leisure."
- Decision: None. Interesting but not actionable.
- **Fix**: REMOVE.

**19. Scenario Planning (what-if)**

- Output: "If you save $200 more per month, you'll reach your goal 3 months earlier."
- Decision: Strong. But the UX is a full scenario planner.
- **Fix**: Reduce to a single inline slider on the Goals page. No separate "scenario" mode.

**20. Cash Flow Analysis** → `generateIncomeForecasts()`

- Output: "Predicted inflows: $3,000. Outflows: $2,500."
- Decision: Weak without context. "Your cash flow is positive" — OK, now what?
- **Fix**: Pair with the balance projection. "At this rate, you'll have $6,000 in 3 months. Your goal needs $5,000. You're on track."

**21. Portfolio Tracking** (Investments Section)

- Output: Asset allocation pie chart, sector breakdown, geographic breakdown, returns
- Decision: "My portfolio is 60% stocks" → should I rebalance?
- **Verdict**: This is a separate product. The anti-goal explicitly says "no brokerage-grade portfolio management." 631 lines of code, 8 asset classes, sector/region allocation.
- **Action**: Trim to a simple holdings list. Remove sector/geographic allocation, annualized returns, top-performer ranking.

**22. Asset Allocation** (Investments)

- Same as above. **TRIM**.

**23. Performance Metrics** (Investments)

- Same as above. **TRIM**.

**24. Investment Goals** (Investments)

- "Track progress toward investment targets"
- **Verdict**: Remove. Goals are for savings, not investments. Investment tracking is a reference list, not a planning tool.
