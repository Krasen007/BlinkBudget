# BlinkBudget vs. Ledger: Feature Review

**Review date:** 2026-11-27  
**Repositories reviewed:** [BlinkBudget](https://github.com/Krasen007/BlinkBudget) and [Ledger](https://github.com/moeckjeremy/ledger-home-finance)  
**Scope:** Repository code, product documentation, changelogs, tests, and the supplied comparison image.

## Verdict

BlinkBudget should borrow some of Ledger’s features, but not its entire product shape. BlinkBudget already has a stronger foundation for fast manual entry, interactive analytics, anomaly detection, goals, forecasts, investments, offline/PWA use, export/import safety, and Firebase multi-device sync. The biggest opportunity is to make the data actionable in day-to-day cash management rather than adding more visualizations.

The most valuable additions, in order, are:

1. **User-managed recurring bills and subscriptions with due dates and expected amounts.**
2. **A date-based cash-flow forecast tied to paydays and bills.**
3. **CSV/bank import with duplicate detection and pending-transaction matching.**
4. **Statement reconciliation.**
5. **A real debt payoff planner.**
6. **Budget rollover and an optional zero-based/envelope mode.**
7. **Optional investment price refresh and account-linked holdings.**

I would not copy Ledger’s US-specific tax engine, Home Assistant integration, or optional AI features unless BlinkBudget is intentionally expanding beyond its current fast, privacy-conscious expense-tracking position.

## What BlinkBudget already does well

BlinkBudget is not a basic expense tracker. The repository contains separate services and views for accounts, transactions, budgets, goals, forecasts, recurring-pattern detection, investments, insights, backup/restore, and sync. Its current product direction is visible in the financial-planning sections and services in the [source tree](https://github.com/Krasen007/BlinkBudget/tree/master/src).

Its differentiators are worth protecting:

- Fast expense and income entry with category chips, quick amount presets, account selection, transfers, refunds, tags, split transactions, copying, bulk editing, and undo.
- Reports and insights including category drill-downs, twelve-month history, cash-flow Sankey, year-over-year comparisons, anomaly/spike detection, inflation trends, top movers, recurring-pattern cards, and forecast charts.
- Savings goals, budget suggestions, account balance prediction, and manual investment lots with grouped holdings and gain/loss calculations.
- Local-first behavior, PWA/offline support, JSON/CSV export, daily cloud backup, recovery tooling, and Firebase synchronization.
- A substantial automated test suite. The declared Yarn workflow passed **114 test files and 826 tests**, and `yarn build` completed successfully in this review.

These capabilities mean the next improvement should make the existing data model more useful, not add another chart page.

## Highest-value features to adopt from Ledger

### 1. Recurring bills as first-class records — highest priority

BlinkBudget currently detects recurring transactions heuristically. The [recurring detector](https://github.com/Krasen007/BlinkBudget/blob/master/src/core/recurring-detector.js) groups expenses by category and estimates cadence and amount. That is useful for discovery, but it is not the same as a bill system: users cannot reliably confirm a subscription, set a due date, mark a bill variable, pause it, rename it, attach a payment link, or record an expected occurrence that has not yet appeared.

Ledger treats recurring items as planned events and uses them in its forecast. See its [recurring page](https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/src/pages/Recurring.tsx) and [recurring/cash-flow logic](https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/server/cashflow.js).

**Recommended BlinkBudget design:** keep automatic detection, but let the user promote a detected pattern into a recurring bill. Store merchant/name, category, account, cadence, next due date, expected amount, variable/fixed flag, active state, and optional URL. Show upcoming bills on the dashboard and let users confirm, skip, or adjust an occurrence. This is a good fit for BlinkBudget because it adds planning value without slowing the three-click expense workflow.

### 2. Paycheck-aware cash-flow forecast — highest priority

BlinkBudget has statistical income/expense forecasting in [forecast-engine.js](https://github.com/Krasen007/BlinkBudget/blob/master/src/core/forecast-engine.js) and account projections in [account-balance-predictor.js](https://github.com/Krasen007/BlinkBudget/blob/master/src/core/Account/account-balance-predictor.js). However, its forecast is primarily monthly and statistical. It does not model the actual sequence of money entering and leaving an account before the next payday.

Ledger’s [cash-flow module](https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/server/cashflow.js) combines account balance, pending items, recurring bills, pay schedules, expected deposits, and a short date-based horizon.

**Recommended BlinkBudget design:** add a lightweight “cash runway” view for the next 30–45 days. Let users define pay schedules and bills, then calculate the balance after each dated event. Show the lowest projected balance, the date it occurs, and whether it happens before the next income event. Keep the existing statistical forecast for longer-term trends; do not replace it.

### 3. Robust CSV import and duplicate matching — high priority

BlinkBudget has export and recovery-oriented data management, but repository searches did not find a dedicated bank CSV importer comparable to Ledger’s importer. Ledger’s [importer](https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/server/importer.js) previews files, handles common date/amount formats, detects whether signs need flipping, supports pending rows, fingerprints imports, skips duplicates, and can settle a manually entered transaction when the posted bank row arrives.

**Recommended BlinkBudget design:** implement CSV import before considering direct bank aggregation. Start with a preview/mapping screen, account selection, sign/date normalization, category rules, and a deterministic fingerprint such as account + date + amount + normalized merchant + occurrence index. Show “new / duplicate / possible match” before commit. This gives users a practical migration and backup path while avoiding the privacy and operational complexity of bank credentials.

### 4. Statement reconciliation — high priority for trust

BlinkBudget has an integrity report, backups, and data recovery, but no equivalent of a bank-statement reconciliation workflow. Ledger’s [statement check](https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/server/reconcile.js) compares opening balance, closing balance, and recorded transactions over a period, then suggests likely causes for a gap such as a missing, duplicated, out-of-period, pending, or sign-reversed transaction.

**Recommended BlinkBudget design:** add reconciliation per account: select start/end dates, enter opening/closing balances, calculate the difference, and show candidate transactions that could explain it. This will improve user confidence more than additional analytics because financial apps are judged by whether balances can be trusted.

### 5. Debt payoff planning — medium/high priority

BlinkBudget can represent credit accounts and has credit-utilization risk logic inside [account-balance-predictor.js](https://github.com/Krasen007/BlinkBudget/blob/master/src/core/Account/account-balance-predictor.js), but there is no dedicated debt entity or payoff plan. Ledger has a dedicated [debt page](https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/src/pages/Debt.tsx) and server logic for minimum payments, extra payments, snowball versus avalanche comparison, payoff dates, interest, and what-if scenarios.

**Recommended BlinkBudget design:** add a debt planner only after account semantics are solid. A useful MVP needs balance, APR, minimum payment, payment date, and optional extra payment. Show snowball and avalanche side by side, including payoff month and estimated interest. Make it a planning tool, not financial advice, and keep it separate from ordinary spending budgets.

### 6. Budget rollover and optional zero-based budgeting — medium priority

BlinkBudget currently supports category limits and suggestions through [budget-service.js](https://github.com/Krasen007/BlinkBudget/blob/master/src/core/budget-service.js) and [BudgetsSection.js](https://github.com/Krasen007/BlinkBudget/blob/master/src/views/financial-planning/BudgetsSection.js). Ledger adds two useful ideas: carry unused category money forward, and optionally “give every dollar a job.” Its [budget page](https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/src/pages/Budgets.tsx) shows both mechanisms.

**Recommended BlinkBudget design:** implement rollover first, with explicit per-category settings and a clear rule for overspending. Add zero-based/envelope budgeting only as an opt-in mode. Do not make it the default because it would conflict with BlinkBudget’s low-friction entry promise and could make new users feel they must fully configure the app before recording a purchase.

### 7. Investment price refresh and account linkage — medium/low priority

BlinkBudget already has a more capable manual investment model than a simple placeholder: [investment-tracker.js](https://github.com/Krasen007/BlinkBudget/blob/master/src/core/investment-tracker.js) supports lots, grouped holdings, current prices, gain/loss, and portfolio summaries. Ledger’s investment feature is different: it links holdings to investment accounts, can consume bank-reported holdings, and optionally refreshes ticker prices. See [Ledger’s investment page](https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/src/pages/Investments.tsx) and [holdings/price logic](https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/server/holdings.js).

**Recommended BlinkBudget design:** add optional price refresh with a visible last-updated timestamp, stale-price warning, and a privacy notice. Then link portfolio value to account balances. Avoid automatic trading, recommendations, or complex allocation advice.

## Features I would not copy yet

**Tax estimation:** Ledger’s tax system is detailed but strongly US-oriented and carries a maintenance burden. It would distract from BlinkBudget’s core product unless you choose one country and deliberately build a country-specific tax product.

**AI CFO, receipt OCR, and statement OCR:** Ledger supports optional AI features, including receipt and statement reading. These can be useful later, but they introduce cost, privacy, consent, error-handling, and data-retention questions. A deterministic CSV importer and reconciliation workflow should come first.

**Home Assistant sensors and self-hosting:** Ledger’s Home Assistant integration is valuable for its audience, but it is not a general budgeting feature. BlinkBudget should only pursue a self-hosted deployment if privacy and local ownership become explicit product goals.

## Important BlinkBudget issues exposed by the review

1. **Currency is not actually configurable.** `src/utils/constants.js` defines `CURRENCY_SYMBOL = '€'`, and several chart helpers hardcode EUR. The project TODO also acknowledges this. Make currency a user setting and centralize all formatting before adding international features.
2. **The emergency-fund assessment uses current net balance as a proxy.** [OverviewSection.js](https://github.com/Krasen007/BlinkBudget/blob/master/src/views/financial-planning/OverviewSection.js) explicitly notes that account-level savings data is not available to the assessment. A negative or investment-heavy account mix can make this metric misleading. Use designated liquid savings accounts or let the user choose which accounts count.
3. **Savings-goal progress is only reliable when transactions are explicitly linked to a goal.** [savings-goals-service.js](https://github.com/Krasen007/BlinkBudget/blob/master/src/core/savings-goals-service.js) filters contributing transactions by `goalId` or metadata. Add a clear goal/account funding model before presenting goals as a complete savings picture.
4. **Forecast confidence should be communicated carefully.** The forecast engine is useful, but it is a statistical estimate rather than Ledger’s event-based cash forecast. Label the two models differently so users do not interpret monthly trend projections as guaranteed cash availability.
5. **The repository has large view modules and some deferred error-handling work.** The project’s own [deferred audit](https://github.com/Krasen007/BlinkBudget/blob/master/todo/views-audit-deferred-items-2026-11-23.md) identifies unhandled dynamic-import failures around destructive confirmation dialogs and several views above 500 lines. Before adding major planning features, finish the confirmation-dialog error path and modularize only when touching those areas.

## Suggested roadmap

**Phase 1: trust and planning foundation.** Centralize currency settings; introduce a first-class recurring-bill model; add the 30–45 day event-based cash runway; add tests for date rules, skipped bills, variable amounts, and low-balance warnings.

**Phase 2: data portability and correctness.** Add CSV preview/import with fingerprinting and duplicate detection; add account reconciliation; expose import/reconciliation status in the integrity report; add migration tests and recovery coverage.

**Phase 3: financial planning.** Add debt payoff planning, starting with snowball/avalanche comparison and what-if extra payments; then add category rollover. Keep this behind the existing Financial Planning area so the quick-entry surface remains simple.

**Phase 4: optional enrichment.** Add investment price refresh and account linkage; consider receipt OCR or AI only after privacy controls, consent, deletion behavior, and cost limits are well defined.

## Bottom line

Yes: BlinkBudget should improve using selected Ledger ideas. The strongest product combination would be **BlinkBudget’s fast capture and analytics plus Ledger’s operational reliability**—planned bills, dated cash flow, imports, reconciliation, and debt payoff. Avoid copying Ledger’s breadth indiscriminately; those features should be added only when they improve a concrete decision a user needs to make.

## References

[1]: https://github.com/Krasen007/BlinkBudget "BlinkBudget repository"
[2]: https://github.com/moeckjeremy/ledger-home-finance "Ledger repository"
[3]: https://github.com/Krasen007/BlinkBudget/tree/master/src "BlinkBudget source tree"
[4]: https://github.com/Krasen007/BlinkBudget/blob/master/src/core/recurring-detector.js "BlinkBudget recurring detector"
[5]: https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/src/pages/Recurring.tsx "Ledger recurring bills page"
[6]: https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/server/cashflow.js "Ledger cash-flow forecast"
[7]: https://github.com/Krasen007/BlinkBudget/blob/master/src/core/forecast-engine.js "BlinkBudget forecast engine"
[8]: https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/server/importer.js "Ledger CSV importer"
[9]: https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/server/reconcile.js "Ledger statement reconciliation"
[10]: https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/src/pages/Debt.tsx "Ledger debt planner UI"
[11]: https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/src/pages/Budgets.tsx "Ledger budgets and zero-based mode"
[12]: https://github.com/Krasen007/BlinkBudget/blob/master/src/core/investment-tracker.js "BlinkBudget investment tracker"
[13]: https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/src/pages/Investments.tsx "Ledger investment holdings UI"
[14]: https://github.com/moeckjeremy/ledger-home-finance/blob/main/ledger/server/holdings.js "Ledger investment holdings service"
[15]: https://github.com/Krasen007/BlinkBudget/blob/master/src/views/financial-planning/OverviewSection.js "BlinkBudget financial overview"
[16]: https://github.com/Krasen007/BlinkBudget/blob/master/src/core/savings-goals-service.js "BlinkBudget savings goal service"
[17]: https://github.com/Krasen007/BlinkBudget/blob/master/todo/views-audit-deferred-items-2026-11-23.md "BlinkBudget deferred code-quality audit"
