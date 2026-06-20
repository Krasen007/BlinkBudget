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

[ ] fix tutorial
Tasteful Approach: Instead of fixing a multi-step tutorial, ask: Can the app be simplified so a tutorial isn't needed? Optimize the empty state to be welcoming. If a tutorial is kept, it must be instantly dismissible.

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
