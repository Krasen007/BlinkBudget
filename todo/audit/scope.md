# BlinkBudget — Scope & Taste Audit

**Date:** 2026-07-30
**Lens:** `todo/tasteful-software-guide.md` — the Tasteful Software Guide for AI Agents
**Method:** Static analysis of `src/`, `docs/prd.md`, `AGENTS.md`, `README.md`, and planning docs. No commands executed.

---

## 1. The Core Problem (as stated)

> "Help track your expenses quickly and easily, with a maximum of 3 clicks to log purchases." — `docs/prd.md` §1

> "BlinkBudget's core promise is to transform the chore of expense tracking into a swift, almost unconscious habit, achieving a logged entry in a mere three clicks from purchase." — `AGENTS.md`

The differentiator is **speed-as-habit**: not power-features, but making logging frictionless enough to become unconscious. The product's entire defensibility rests on this one promise.

## 2. The Explicit Anti-Goals (the guardrails)

> "BlinkBudget is NOT a collaboration tool, NOT a full investment portfolio manager, NOT a tax preparation tool, and NOT for complex multi-entity financial tracking. We are for individuals who want to understand their spending in seconds, not minutes." — `AGENTS.md`

> "the existing savings goals and investments features stay — they are intentionally simple, useful tools for end users. The anti-goal is a guard against adding _new_ complexity (e.g. brokerage-grade portfolio management), not a mandate to remove them." — `AGENTS.md`

The anti-goal is explicit and self-aware: **no brokerage-grade portfolio management**. The savings-goals and investments features are permitted *only* insofar as they remain "intentionally simple."

---

## 3. What the Codebase Actually Contains

### 3.1 Scale of the surface area

| Layer | Count | Notes |
|---|---|---|
| `src/core/` service files | **53** | 37 root + 11 `analytics/` + 4 `Account/` + 1 `financial-planning/` |
| `src/views/` | **14** | 8 top-level routes + 6 financial-planning sections |
| `src/components/` | **49** | 42 general + 6 financial-planning + 1 `ui/` |
| Major routes exposed | **9** | landing, login, dashboard, add-expense, edit-expense, category-manager, reports, financial-planning, settings |

### 3.2 The core flow (tasteful, focused)

The 3-click logging flow is genuinely well-built and on-mission:

- `src/core/click-tracking-service.js` (178 lines) — **directly measures the 3-click KPI** from flow start to saved transaction. This is a product team that instrumented its own differentiator.
- `src/views/AddView.js` → `src/components/TransactionForm.js` → `src/utils/form-utils/category-chips.js` — auto-submit on category selection, no save button.
- `src/core/amount-preset-service.js` (148 lines) — quick-amount presets that learn from usage. Accelerates the core flow.
- `src/core/transaction-service.js` (337 lines) — CRUD, split, copy, tag management. The heart of the app, appropriately sized.

**Verdict:** The core is coherent, measured, and earns its place. The team clearly understands the problem.

### 3.3 The "advanced" layer (where taste breaks down)

Beneath the core sits a second product — a personal finance analytics and forecasting suite — that is far larger than the core itself:

**Analytics engine (`src/core/analytics/`, 11 files):**
- `AnomalyService.js` (293 lines) — statistical spending-spike, category-concentration, and timing-anomaly detection
- `TrendService.js`, `ComparisonService.js`, `RecommendationService.js`, `MetricsService.js`, `PredictionService.js`, `FilteringService.js`, `AnalyticsCache.js`, `AnalyticsInstance.js`

**Forecasting & planning:**
- `src/core/forecast-engine.js` — income/expense predictions, cash-flow analysis, **scenario planning ("what-if" analysis)**
- `src/core/analytics/PredictionService.js` — 12-month balance projections
- `src/core/Account/account-balance-predictor.js` — future balances for all accounts

**Investments — the clearest anti-goal violation:**
- `src/core/investment-tracker.js` (**631 lines**) — full portfolio management supporting **8 asset classes** (stocks, bonds, ETF, real estate, crypto, cash, commodities, other), with:
  - Asset allocation analysis
  - **Sector allocation analysis**
  - **Geographic allocation analysis**
  - Annualized return calculations
  - Top/bottom performer ranking
  - `getPortfolioSummary()` aggregating all of the above

This is **brokerage-grade portfolio management** — the exact phrase the anti-goal names as the thing not to build. The AGENTS.md caveat ("investments features stay — they are intentionally simple") is contradicted by a 631-line tracker with sector/region diversification analytics.

**Other speculative/aspirational features:**
- "Personal Inflation Rate" — `src/components/InflationTrends.js` + `src/utils/inflation-chart-utils.js`
- "Cost of Living Analysis" — `MetricsService.calculateCostOfLiving()`
- "Financial Health Score" — `MetricsService.calculateFinancialHealthScore()`
- "AI-powered budget recommendations" — `RecommendationService.generateBudgetRecommendations()`

### 3.4 The financial-planning UI surface

`src/views/financial-planning/` exposes **6 full sections**, each a substantial view:

| Section | Purpose | Lines |
|---|---|---|
| `OverviewSection.js` | Health summary, net worth, savings rate, emergency-fund assessment | 437 |
| `ForecastsSection.js` | 6-month forecasts, projected-balance charts, historical-vs-forecast tables | 454 |
| `InvestmentsSection.js` | Full portfolio CRUD, 8 asset types, type-specific fields | — |
| `GoalsSection.js` | Long-term goal planning, savings targets, milestone tracking | — |
| `InsightsSection.js` | Pattern analysis, recommendations, inflation trends, anomaly alerts | — |
| `BudgetsSection.js` | Category budget limits, health tracking, overspending alerts, performance reports | — |

This is a **second product** bolted onto the first. A user who came for "3-click expense logging" now navigates past a 6-tab financial planning suite.

---

## 4. Findings Against the Guide

### 4.1 The Taste Test — applied to the advanced layer

| Question | Investment Tracker | Forecast Engine | Personal Inflation | Fraud Detection (README) |
|---|---|---|---|---|
| **Necessity** — essential to 3-click logging? | ❌ No | ❌ No | ❌ No | ❌ No (and doesn't exist) |
| **Externalities** — cognitive load added? | High — 6-tab section, 8 asset types | High — forecasting UI | Medium | None (vapor) |
| **Coherence** — aligns with the point of view? | ❌ Violates explicit anti-goal | ⚠️ Stretches "actionable insights" | ⚠️ Stretches | ❌ Fabricated |
| **Calibration** — right amount? | ❌ Brokerage-grade | ❌ 12-month projections + scenarios | Too much | N/A |
| **Omission** — what are we NOT building by building this? | Core polish, empty-state work, onboarding | Same | Same | Trust |
| **Unarticulated need** — serves something users can't articulate? | Arguable for simple goals | Weak | Weak | ❌ |

**The advanced layer fails the Taste Test on nearly every axis.** The core layer passes it.

### 4.2 Anti-Patterns present

**✅ The Feature Factory** — *present in the advanced layer.*
- "Advanced Analytics & Intelligence" in README lists ~20 features across Spending Intelligence, Budget Optimization, Anomaly Detection, and Personal Finance Metrics.
- Success is implicitly measured by feature count (the README is a feature catalog, not a workflow description).
- Features are treated as additive: each analytics service was added without apparent consideration of its negative externality on the "fast, simple" promise.

**⚠️ The CRUD App** — *partially present.*
- The financial-planning sections are structured CRUD workflows (budget CRUD, investment CRUD, goal CRUD) wrapped in UI.
- The defensibility argument for these is "we built this workflow so you don't have to" — the weakest form of moat, which the Guide explicitly warns is approaching zero.

**✅ The Aesthetic-Only Product** — *not the primary issue.* The core flow has considered interactions (auto-submit, click tracking, ghost transactions). The problem isn't superficial polish; it's scope.

**✅ Data-Driven Without Vision** — *present in the analytics layer.*
- "AI-powered recommendations," "personal inflation rate," and "financial health score" are backward-looking compressions of transaction data dressed up as intelligence. There is no coherent theory of *what the user should do differently* because of them — they are outputs without a decision attached.

### 4.3 What the codebase gets right (credit where due)

The Guide is about what to include *and* what to exclude. Several decisions show real taste:

1. **Routing strategy is tasteful.** `src/router/routes.js` statically imports only the core views (Dashboard, Add, Edit, Reports) for instant loading, and dynamically imports the heavy views (FinancialPlanning, Settings). The core flow is not penalized for the advanced layer's weight.
2. **Zero-dependency principle is honored.** Runtime deps are exactly two: `chart.js` and `firebase`. No React/Vue, no analytics SDKs, no ML libraries. This is disciplined.
3. **The core flow is instrumented.** `click-tracking-service.js` measuring the 3-click KPI is a product team that decided *the differentiator itself* was worth measuring. That is taste applied to metrics.
4. **Local-first architecture.** Data in localStorage, cloud sync as enhancement. This serves the "instant interaction" principle directly.
5. **Security discipline.** `textContent` over `innerHTML`, `safeJsonParse`, input validation. The Guide's "make the design invisible when well-executed" applies — good security is invisible.

### 4.4 The central tension

The product has **two coherent theories that contradict each other**:

- **Theory A (core):** "Expense tracking should be so fast it becomes unconscious. Everything else is noise."
- **Theory B (advanced layer):** "Users want a comprehensive personal finance dashboard with forecasting, portfolio management, and AI insights."

The Guide says: *"DON'T build disconnected features that don't serve a unified theory."* The codebase currently serves two theories. The advanced layer does not reinforce the core — it competes with it for attention, maintenance, and the user's first ten seconds.

---

## 5. The Ideal State (per the Guide) vs. Current State

| Guide criterion | Core layer | Advanced layer |
|---|---|---|
| Coherent theory about the problem domain | ✅ Yes | ❌ Competing theory |
| Every interaction feels considered | ✅ Yes | ⚠️ Mixed |
| Defaults exactly right | ✅ Yes (auto-submit) | ❌ Many empty states unoptimized |
| Empty state optimized | ✅ Likely | ❌ Unknown/unconsidered |
| First ten seconds effortless | ✅ Yes (static imports) | ❌ Threatened by surface area |
| Point of view that compounds | ✅ Yes | ❌ Dilutes the point of view |
| Doesn't call attention to itself | ✅ Yes | ❌ "Advanced Analytics & Intelligence" announces cleverness |
| Designed by subtraction | ✅ Yes | ❌ Designed by addition |
| Serves unarticulated needs | ✅ Yes (speed-as-habit) | ⚠️ Arguable for goals; weak elsewhere |
| Taste baked into every layer | ✅ Yes | ❌ Feature-factory pattern |

---

## 6. Recommendations (in priority order)

These are framed as *subtraction* first, per the Guide's "design by subtraction" principle.

### P0 — Stop the bleeding (documentation honesty)
1. **Remove the fabricated "Fraud Prevention" claim from README.** Zero occurrences of "fraud" in source. The AnomalyService does statistical spike detection — label it accurately or remove the claim. The Guide: *"DON'T announce cleverness through the design."* Fabricated capability announcements are the opposite of taste.
2. **Audit every README feature claim against code.** The README is a 242-reference feature catalog. Several "AI-powered" claims are statistical heuristics. Relabel honestly.

### P1 — Reconcile with the anti-goal
3. **Decide explicitly: is the investment tracker "intentionally simple" or brokerage-grade?** AGENTS.md says the former; `investment-tracker.js` (631 lines, 8 asset classes, sector/region allocation) is the latter. Either:
   - **Subtract:** Reduce to a simple holdings list (symbol, shares, cost basis, current value) — the "intentionally simple" version the anti-goal permits. Remove sector/geographic allocation, annualized returns, top-performer ranking.
   - **Or amend the anti-goal** — but only if the team can articulate why a fast expense tracker should also be a portfolio manager, and what it will *not* build as a result.

### P2 — Calibrate the analytics layer
4. **Apply the Omission test to each analytics feature.** For every one of the ~20 "Advanced Analytics & Intelligence" features, ask: what core-polish work was *not* done because this was built? The Guide: *"What are we choosing NOT to build by building this?"*
5. **Cut or consolidate features that produce outputs without decisions.** "Personal Inflation Rate" and "Financial Health Score" are numbers without a next action. The Guide: *"DON'T build features that don't serve the core problem."* If a feature doesn't change a user's behavior, it's decoration.

### P3 — Protect the first ten seconds
6. **Measure the empty state.** The Guide prioritizes the empty state and first ten seconds above feature breadth. The advanced layer's empty states (no investments, no goals, no budgets) are likely unoptimized — each is a wall of "set up your portfolio/goals/budget" that contradicts "effortless."
7. **Keep the routing discipline.** The static/dynamic import split is correct. Resist any pressure to statically import the financial-planning views. The core flow must stay instant.

### P4 — Re-establish a single theory
8. **Write down the one theory.** The product needs to decide whether it is "the fastest expense tracker" or "a personal finance dashboard." The Guide: *"DO make choices that serve a coherent point of view about the problem domain."* Two theories is zero theories.
9. **If keeping the advanced layer, make it reinforce the core.** The only justification for any advanced feature is that it makes the *core 3-click habit* more valuable — e.g., "your categorized spending makes this budget meaningful." Features that exist for their own sake fail the Coherence test.

---

## 7. Summary Verdict

**The core of BlinkBudget is a tasteful product.** The 3-click flow, the click-tracking instrumentation, the local-first architecture, the zero-dependency discipline, and the routing strategy all show a team that understands the problem and makes considered decisions.

**The advanced layer is a feature factory.** It was built because code is cheap and the space of *possible* finance features is large. It violates the explicit anti-goal (brokerage-grade portfolio management), fabricates capabilities in documentation (fraud detection), and competes with the core promise for the user's attention and the team's maintenance budget.

The Guide's central test is: *"When the cost of building approaches zero, the ability to decide what NOT to build becomes the entire product."* BlinkBudget has demonstrated it can build well. The next phase of taste is deciding what to **remove** — or at minimum, what to stop **adding** — so that the core promise compounds instead of dilutes.

**The single most important decision:** Reconcile the investment tracker with the anti-goal. Everything else follows from whether the product is a fast tracker or a finance dashboard. It cannot be both and remain tasteful.