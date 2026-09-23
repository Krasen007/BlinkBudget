Analysis: #financial-planning?section=insights

1. What the section currently renders
   src/views/financial-planning/InsightsSection.js builds this stack, in order:

# Element Purpose Month-synced?

0 Usage note + ProgressiveEmptyState (unlocks at 30 tx) Progressive gating —
1 TrendBarChartCard — diverging income/expense bars + Net line, grain select Flow over time ❌ (own grain)
2 TimelineYoYCard — cumulative spending: month vs prior month (day-by-day) or year vs prior year Pace comparison ✅ (owns shared nav in MONTH grain)
3 Top Movers (insights-movers-timeline.js) — top 6 categories by spend for selected month Composition ✅ (own prev/next)
4 InflationTrends — median price/unit trends for the Top Movers' categories, 6 months, with suggestions Why prices change ✅
5 NetBalanceChart — end-of-month net balance + net worth, last 6 months Outcome ❌ (fixed 6M window)
Deliberately excluded (asserted by tests/financial-planning/InsightsSection.test.js:77-96): InsightsSummaryBar (Net Worth/Income/Expense KPIs) and ExpenseDonutCard — both exist, are tested, but are now orphaned components rendered nowhere.

Crucially: the app has a second, entirely separate insights system — InsightsGenerator.generateSpendingInsights (balance ±, top category, income/expense change, category deltas, anomalies, spending frequency/timing/size, budget warnings) rendered via BudgetInsightsSection + InsightCard, but only in Reports (and preloaded by Dashboard).

2. Is the set optimal? — No, but the bones are right
   The narrative arc is actually good: Flow (Trend) → Pace vs last period (Timeline) → Where it went (Top Movers) → Price effects (Inflation) → Resulting balance (Net Balance). That's a coherent retrospective story, and the shared month state linking 3 cards is a nice touch.

But coverage has three real gaps:

Zero actionable text insights. The section is 100% "interpret this chart." The strongest engine you already own (generateSpendingInsights + AnomalyService + InsightCard) lives in Reports. Per the One Theory, a takeaway card ("Food up 32% vs last month") is what prompts the next 3-click log — raw charts don't.
"Top Movers" isn't movers. InsightsGenerator.topMovers() just ranks categories by absolute spend — no month-over-month delta. README claims "biggest spending changes month-over-month" and ComparisonService.comparePeriodsSpending() exists unused here. As implemented it's a category breakdown, which also makes the removed donut's absence from the usage note a stale promise (note still says "category breakdowns" — InsightsSection.js:47).
No savings-rate trajectory. Overview shows a savings-rate number; insights never shows its trend. Income/expense are already aggregated in Trend — a savings-rate line is nearly free and is the single most "financial planning" metric missing. 3. Coherence issues found (bugs, not taste)
Mixed language (P0): Both grain selects render Bulgarian labels in an English UI:

TrendBarChartCard.js:139-140 and TimelineYoYCard.js:288-289 → МЕСЕЦ / ГОДИНА
TrendBarChartCard.js:194, 278 → dataset/tooltip label Нетно (Net) Values are English (month/year), aria-labels English — this is leftover, not i18n design.
NetBalanceChart is the odd one out (P0/P1):

Cleanup leak: InsightsSection.js:115-117, 129-136 — the chart is appended in a .then() and cleanup() never destroys it (it stores section.\_chart, which nothing reads). If you leave the tab before the promise resolves, it appends to a detached tree.
Bypasses planningData and re-reads TransactionService.getAll() itself — inconsistent with the cached planningDataManager flow.
Hardcoded currency: 'EUR' (NetBalanceChart.js:323-351) while the app centralizes on formatCurrency — and todo.md:6 plans a configurable currency; this chart would be missed.
Inline styles + own hsl palette vs the shared .card insights-card + insights-chart-theme.js used by the newer cards; fixed 300px-style heights vs the fluid clamp() pattern.
Its "Net Balance (End of Month)" series overlaps Trend's Net line; "Net Worth" duplicates the Dashboard total.
Duplicate controls: shared month is navigated from two places (Timeline's nav in MONTH grain + Top Movers' own buttons), while Trend and NetBalance ignore it — users can't tell which cards "month navigation" applies to.

Duplicate naming: this section is titled "Financial Insights" — the exact title BudgetInsightsSection.js uses in Reports for the textual cards. Two different surfaces, identical names.

Dead code: InsightsSummaryBar + ExpenseDonutCard (only imported by tests). The removal was right per the One Theory (both duplicate Dashboard/Reports), but code should be deleted, not left half-alive.

Stale docs/todos: todo.md:47-50 still requests changes to this section (remove "Top Inflation Drivers" list, remove average button, "Financial Snapshot") — several appear already done by the zero-toggle InflationTrends redesign; worth reconciling so the todo list doesn't drift.

4. Recommendations (priority order)
   P0 — correctness

Translate МЕСЕЦ/ГОДИНА/Нетно → MONTH/YEAR/Net (or commit to a real i18n layer — but pick one).
Fix NetBalanceChart: accept planningData.transactions, destroy chart in cleanup(), guard the async append with a cancelled flag, switch to formatCurrency + insights-chart-theme + .card insights-card.
Fix the usage note copy (drop "category breakdowns" — or keep the promise, see #5).
P1 — make the set coherent & optimal 4. Make Top Movers actual movers: show MoM delta bars (green/red) via existing timelineComparison/ComparisonService — matches README, and differentiates from Timeline (pace) instead of duplicating a breakdown. 5. Add a "Key Takeaways" strip (3 cards max) at the top, reusing InsightsGenerator + InsightCard, scoped to the selected month: biggest category change, budget warning, anomaly. This unifies your two insights systems and is the highest One-Theory- compliant addition. Then rename one of the two "Financial Insights" titles (e.g. Reports → "Spending Insights"). 6. Delete or wire InsightsSummaryBar + ExpenseDonutCard. My recommendation: delete both (they duplicate Dashboard); if you keep the donut anywhere, it's here for the selected month — Top Movers bars and a donut would then be redundant with each other, so pick one. 7. Migrate InflationTrends/NetBalanceChart to shared card CSS + fluid clamp() heights (already open items in todo/todo.md → insights-charts-findings.md §4).

P2 — worthwhile additions (all leverage existing engines) 8. Savings-rate trend — one line on Trend card or a slim sparkline; cheapest high-value addition. 9. Anomaly markers in tooltips — AnomalyService.detectUnusualTransactions already exists; flag spikes in Trend/Timeline hover. 10. Recurring charges / subscriptions detection — genuinely planning-relevant (feeds Forecasts), simple stats over category intervals; only if it stays lightweight (anti-goal guard).

What NOT to add: more KPI bars, portfolio-grade analytics, or a second donut — the exclusion of the summary bar was correct.

Verdict: The chart selection is close to optimal for a retrospective insights tab and the card design is consistent for the newer components — but the section is undermined by Bulgarian label leaks, a legacy NetBalanceChart that doesn't follow the conventions or cleanup contract, stale copy, dead components, a misnamed Top Movers, and the absence of the textual/actionable layer your own engine already produces for Reports. Fix P0+P1 and it goes from "coherent-looking" to genuinely coherent.

Want me to turn this into an implementation plan (P0 first), or start with a specific item?
