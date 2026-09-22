# Insights Charts — Findings & Refinements (Financial Planning > Insights)

Date: 2026-09-22
Scope: uncommitted Insights charts work + style / timeline-default / app-width verification.

## 1. Uncommitted inventory (read)

Modified:
- `src/views/financial-planning/InsightsSection.js` — rewired to new cards
- `src/components/ChartRenderer.js` — `+createDoughnutChart / +createMixedChart / +exportChartAsImage`
- `src/core/chart-loader.js` — `+DoughnutController`
- `src/styles/main.css` — `+insights-charts.css`
- (this session) `src/components/financial-planning/ExpenseDonutCard.js`, `TrendBarChartCard.js`, `TimelineYoYCard.js`, `src/views/financial-planning/insights-movers-timeline.js`, `src/styles/components/insights-charts.css` — style/width fixes, still uncommitted

New (untracked):
- `src/components/financial-planning/InsightsSummaryBar.js` — NET WORTH / ДОХОД / РАЗХОД KPI bar
- `src/components/financial-planning/ExpenseDonutCard.js` — EXPENSE donut + tag list
- `src/components/financial-planning/TrendBarChartCard.js` — diverging Income vs Expense bars + Net line
- `src/components/financial-planning/TimelineYoYCard.js` — TIMELINE cumulative comparison
- `src/components/financial-planning/insights-chart-theme.js` — shared canvas palette
- `src/styles/components/insights-charts.css` — section stylesheet
- `src/views/financial-planning/insights-movers-timeline.js` — Top Movers + Daily Expenses
- `tests/components/insights-charts.test.js`, `tests/financial-planning/InsightsSection.test.js` — 20 tests

## 2. Requirement verification

### a) TIMELINE selectable for month, default = this month — DONE (verified)
- `TimelineYoYCard.js`: `currentGrain = 'month'` default; grain select МЕСЕЦ / ГОДИНА; `getSelectedMonth()` → `new Date(y, m + offset, 1)`, `offset: 0` = this month.
- `TrendBarChartCard.js`: `currentGrain = 'month'` default.
- `ExpenseDonutCard.js` + `InsightsSummaryBar.js`: `initialPeriod = 'this-month'`.
- `insights-movers-timeline.js`: Top Movers + Daily Expenses read `sharedMonthState.offset = 0`, synced via `onNavigate`.

### b) BlinkBudget established style — WAS PARTIAL, fixed this session
Was: `.insights-card` duplicated `.card` instead of reusing it; `.insights-select` used `--color-background` vs `.view-select` `--color-surface`; inline `canvas.style.width/maxHeight` in movers-timeline.
Fixed:
- Cards now `class="card insights-card …"` (`ExpenseDonutCard`, `TrendBarChartCard`, `TimelineYoYCard`, top-movers, daily-timeline) → inherit `webapp-patterns.css:.card`.
- All 3 selects now `class="insights-select view-select"` (compact variant of global pattern).
- Removed `canvas.style.width/maxHeight`; sizing via `.insights-chart-area canvas { width:100% !important; height:100% !important; }`.
- `.insights-select` background → `surface`, added `max-width:100%`.

### c) App width + mobile friendly — WAS NO, fixed this session
Was: `@media --lg { grid-template-columns: repeat(2,…) }` → inside `.view-container { max-width:600px }` = 2× ~290px unreadable charts.
Fixed:
- `.insights-charts-grid`, `.insights-summary-grid`, `.insights-card`, `.insights-stat-card` → `width:100%; max-width:100%; min-width:0` — single column, stacked full-width, never exceeds app width.
- `.insights-chart-area { height: clamp(200px,52vw,320px); overflow:hidden }`, `--compact { clamp(180px,44vw,230px) }`, `.donut-wrapper { clamp(190px,46vw,240px) }` — fluid phone→desktop.
- Header `flex-wrap:wrap`; `<=360px` actions → `width:100%` so selects/nav stay tappable.

## 3. Validation
- `yarn vitest run tests/components/insights-charts.test.js tests/financial-planning/InsightsSection.test.js` → **20/20 pass**.
- `yarn run lint` → 0 errors, only pre-existing warnings.

## 4. Further refinements (open)
- [ ] `NetBalanceChart.js` + `InflationTrends.js` still use inline card styles — outside this changeset; consider migrating to `.card insights-card` for full consistency.
- [ ] `insights-chart-theme.js` net hue (`hsl(198,93%,60%)`) intentionally deviates from `--color-info`; confirm intentional vs token alignment.
- [ ] Confirm single-column-for-all-widths is the desired end state (chosen because 600px container makes 2-up unreadable); if 2-up is wanted on wide desktop, needs a container wider than 600px first.
- [ ] Legacy `insights-movers-timeline.js` daily chart has no explicit month/year grain toggle (navigates via prev/next month buttons through shared state) — confirm acceptable per "TIMELINE selectable for month".
- [ ] Visual pass on a real phone (360px) + desktop for donut center-total overlap and 12-bar trend readability.
