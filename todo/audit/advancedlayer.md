## Implementation Plan: Making the Advanced Layer Reinforce the Core

### Phase 1 — Remove what contradicts the theory (P0) ✅ RESOLVED

**1.1 Strip the investment tracker to "intentionally simple"** ✅
- File: `src/core/investment-tracker.js` (631 lines)
- Remove: sector allocation analysis, geographic allocation analysis, annualized return calculations, top/bottom performer ranking, 8 asset class taxonomy
- Keep: simple holdings list (name, shares, cost basis, current value) + total portfolio value
- Rationale: Portfolio management doesn't answer "what does my 3-click data tell me?" A simple holdings list is a reference, not a product.

**1.2 Remove the Financial Health Score** ✅ YAGNI'd — `calculateFinancialHealthScore()` never existed in the codebase
- File: `src/core/analytics/MetricsService.js` — remove `calculateFinancialHealthScore()` and all callers
- Rationale: A single opaque number compresses many dimensions. It announces cleverness without enabling a decision. The individual metrics (savings rate, income/expense ratio) are more useful.

**1.3 Simplify scenario planning** ✅ YAGNI'd — `scenarioAnalysis()` never existed in the codebase
- File: `src/core/forecast-engine.js` — remove `scenarioAnalysis()` and the what-if UI in `ForecastsSection.js`
- Replace with: A single "what if I save $X more?" projection inline with the existing forecast, not a separate scenario mode
- Rationale: Full scenario planning is a separate product. A single inline projection answers the most common question without adding complexity.

### Phase 2 — Rewrite advanced features to be read-only by default (P1) ✅ RESOLVED

**2.1 Budgets: from CRUD to suggestions** ✅
- File: `src/views/financial-planning/BudgetsSection.js`
- Current: User creates budgets manually (CRUD workflow)
- Target: Budgets are auto-suggested based on 3 months of spending. User can accept, adjust, or dismiss. No empty "create a budget" state.
- Key change: The first time a user visits Budgets, they see suggested limits, not an empty form.

**2.2 Goals: from CRUD to projections** ✅
- File: `src/views/financial-planning/GoalsSection.js`
- Current: User creates goals manually
- Target: Goals are projected from savings patterns. "At your current rate, you could save $X in 12 months. Want to set that as a goal?" One-click acceptance.
- Key change: Goals emerge from data, not from empty forms.

**2.3 Anomaly detection: connect to the transaction list** ✅
- File: `src/views/DashboardView.js` + `src/core/analytics/AnomalyService.js`
- Current: Anomalies appear in the Insights section (buried)
- Target: Anomalous transactions are visually marked in the main transaction list with a subtle indicator. Tapping shows why it was flagged.
- Key change: Anomaly detection becomes a core reading enhancement, not a separate report.

### Phase 3 — Empty state optimization (P2) ✅ RESOLVED

**3.1 Every advanced section's empty state says "keep logging"**
- When a user has < 30 transactions, every advanced section shows a variant of: "Log 30+ transactions to unlock personalized insights."
- This connects the advanced layer to the core habit explicitly.

**3.2 Progressive unlock messages**
- 5 transactions: "You're building your financial picture. Check back after 30 transactions for budget suggestions."
- 30 transactions: "You have enough data for budget suggestions. Visit Budgets to see them."
- 90 transactions: "Forecasts are now available. Your data is telling a story."
- 365 transactions: "Annual insights ready. See how your spending changed this year."

### Phase 4 — README and documentation alignment (P3) ✅ RESOLVED

**4.1 Rewrite the README to reflect the one theory**
- The "Advanced Analytics & Intelligence" section should be renamed to "Insights From Your Data"
- Every feature description should answer: "What does your 3-click data tell you?"
- Remove "AI-powered" language — these are statistical heuristics, not AI

**4.2 Update the audit document**
- Mark P0 items as resolved
- Add the one theory to `AGENTS.md`

### Effort estimate

| Phase | Files touched | Complexity | Risk |
|---|---|---|---|
| 1.1 Strip investment tracker | 2-3 files | Medium | Low (removing code) |
| 1.2 Remove health score | 3-4 files | Low | Low |
| 1.3 Simplify scenario planning | 2-3 files | Low | Low |
| 2.1 Budgets as suggestions | 3-4 files | High | Medium (UX change) |
| 2.2 Goals as projections | 3-4 files | High | Medium |
| 2.3 Anomalies in transaction list | 3-4 files | Medium | Low |
| 3.1-3.2 Empty states | 6-8 files | Medium | Low |
| 4.1-4.2 Documentation | 2 files | Low | None |

**Total: ~25-30 files, estimated 2-3 focused sessions**

### What we should NOT do
- Add onboarding tours or tutorials (adds friction)
- Add "connect your bank" or auto-import (scope creep, security risk)
- Add notifications or alerts (distracts from the 3-click flow)
- Gamify logging (undermines the "unconscious habit" promise)

Ready to start when you are. I'd suggest beginning with Phase 1 (removals) since they're lowest risk and immediately improve coherence.