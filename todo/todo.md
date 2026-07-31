# BlinkBudget To-Do List

✅ Implement (Strongly Aligned with Vision)
These items directly support the "Extremely fast," "3-click interaction," and "invisible design" principles without adding cognitive load or UI clutter.

[ ] when you start the app the default view should be to add new entry
Optimizes the first 10 seconds. Effortless and directly serves the single core problem (logging expenses fast).
Currently, src/core/router.js explicitly defaults to dashboard (e.g., const rawHash = window.location.hash.slice(1) || 'dashboard';), and main.js routes to the dashboard upon successful login. We can easily change this to add-expense.

[ ] when deleting a transaction create animation of the row disappearing / when splitting a transaction create animation of the row duplicating
"Make the design invisible when well-executed." Subtle animations improve the feel and user confidence without adding complexity.
Currently, rows are just instantly removed from the DOM when deleted. We will need to add a simple CSS @keyframes animation and apply a class right before removing the DOM element.

[ ] Mask technical error messages from Firestore operations
"Design by subtraction." Users shouldn't be burdened with technical state; it breaks the effortless illusion.
Right now, if Firestore fails (e.g., in sync-service.js or auth-service.js), the raw technical errors are often caught and passed upward. We'll need to wrap these in generic, user-friendly messages (e.g., "Unable to sync right now, changes saved locally").

[ ] Progressive Image Loading: Implement progressive loading for category icons and visual elements
Enhances the core promise of an "extremely fast" app invisibly.
You already have a fantastic src/core/lazy-loader.js utility and corresponding CSS (.lazy-image-placeholder in performance-accessibility.css). However, it's currently used mainly for charts and heavy components. To finish this, we just need to add the data-lazy="image" attribute to the category icons across the app.

[ ] consider removing googleapis for fonts
Reduces external dependencies and improves load times, aligning with the local-first, fast ethos.
index.html is still fetching Inter and Outfit from fonts.googleapis.com. We would need to download these fonts, place them in a local assets/fonts folder, and update our @font-face CSS.

[?] investigate: data integrity check in settings is adding unexpected labels to categories
Core bug fix. Broken features destroy user trust.
The src/core/data-integrity-service.js exists and is running, but we'll need to dive into its validation logic to see why it's mistakenly mutating category labels.

[ ] Convert to TWA (Trusted Web Activity)... and [ ] release as windows store app...
Lightweight distribution methods that leverage the existing web app without adding heavy framework dependencies.
TWA is actually already done. All we need is to release as a Windows Store app.

⚠️ Implement with Restraint (Needs "Tasteful" Adjustments)
These solve real problems but the proposed solutions introduce too much UI surface area. We should use smart defaults instead of adding settings.

[ ] Auto-sort categories by frequency invisibly
Tasteful Approach: Implement automatic sorting by usage frequency without adding manual reordering UI. "Treat every default as a deliberate taste decision." Manual sorting adds cognitive load.

[ ] Implement ability to disable the Currency sign in the app... auto detected?
Tasteful Approach: Auto-detect only. Use the browser's Intl.NumberFormat().resolvedOptions().currency to show the correct format automatically. Prioritize the invisible "just works" default over adding another dropdown to the settings page.

🚫 DO NOT Implement (Anti-Patterns)
These items violate the Tasteful Guide. They are "Feature Factory" additions, add friction, or contradict the core vision. We should delete these from todo.md.

[ ] Client-side session timeout (30 minutes of inactivity; auto logout)
Adds massive friction. Violates "effortless first ten seconds." This is a personal tracker, not a high-security banking portal.

[ ] Local data encryption for sensitive information in localStorage...
Engineering complexity for minimal real-world gain. If the device is compromised, local encryption keys are too.

[ ] add possibility to import transactions from a csv file
Adds massive surface area and complexity (parsing, mapping columns). Users importing CSVs are doing complex financial tracking (an explicit Anti-Goal).

[ ] use Ionic's Capacitor or Cordova to make android app
Violates the "Zero Dependencies" rule. Bloats the app. The TWA/PWA approach is much more tasteful.

[ ] Historical Pattern Recognition... & [ ] Predictive Budget Recommendations...
"Data-Driven Without Vision." Too much cognitive load. We should let users see their data clearly rather than building an opaque AI scoring engine that clutters the UI.

[ ] Location-Based Categories: GPS-aware category suggestions...
Introduces browser privacy popups, battery drain, and unpredictability. It's a "clever" engineering feature that gets in the way of a simple 3-click tracking workflow.

[ ] lazy load older transactions... only last 30 days cached
Violates "Local First". Text data is extremely cheap; localStorage can hold years of transactions effortlessly. Adds unnecessary cloud sync complexity.

[ ] add option to mark a transaction as important...
Increases cognitive load ("Do I need to star this?"). Adds UI clutter for a niche usecase.

[ ] management UI for the app for the system admin...
Massive feature creep. Irrelevant to the core user problem.

[ ] Update account-service.js... implement an optional limit property... trigger utilization warnings
Creeping towards complex financial tracking. Adding limits, thresholds, and warnings increases cognitive load and UI surface area.

[ ] Add basic client-side security monitoring for failed login attempts...
Over-engineering. Not necessary for this type of lightweight app.

---

Decide explicitly: is the investment tracker "intentionally simple" or brokerage-grade? AGENTS.md says the former; investment-tracker.js (631 lines, 8 asset classes, sector/region allocation) is the latter. Either:
Subtract: Reduce to a simple holdings list (symbol, shares, cost basis, current value) — the "intentionally simple" version the anti-goal permits. Remove sector/geographic allocation, annualized returns, top-performer ranking.
We should apply those suggestions and improve and optimize the investment tracker.

Apply the Omission test to each analytics feature. For every one of the ~20 "Advanced Analytics & Intelligence" features, ask: what core-polish work was not done because this was built? The Guide: "What are we choosing NOT to build by building this?"
Cut or consolidate features that produce outputs without decisions. "Personal Inflation Rate" and "Financial Health Score" are numbers without a next action. The Guide: "DON'T build features that don't serve the core problem." If a feature doesn't change a user's behavior, it's decoration.
We should iterate over those features, what we can do to improve them to serve better the user.

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

Write down the one theory. The product needs to decide whether it is "the fastest expense tracker" or "a personal finance dashboard." The Guide: "DO make choices that serve a coherent point of view about the problem domain." Two theories is zero theories.
If keeping the advanced layer, make it reinforce the core. The only justification for any advanced feature is that it makes the core 3-click habit more valuable — e.g., "your categorized spending makes this budget meaningful." Features that exist for their own sake fail the Coherence test.
We shall keep the advanced layer. Lets iterate on how we can make it better for the user.
