DO NOT IMPLEMENT: when you start the app the default view should be to add new entry
DO NOT IMPLEMENT: add option to reorder categories or auto sort them by most common, it may also be learning from the user behavior and predict the category based on the amount
DO NOT IMPLEMENT: Add visual indicators for refund transactions in lists
DO NOT IMPLEMENT: when deleting a transaction create animation of the row dissapearing / when splitting a transaction create animation of the row duplicating
DO NOT IMPLEMENT: Client-side session timeout (30 minutes of inactivity; monitor clicks/keypresses, auto logout)
DO NOT IMPLEMENT: Local data encryption for sensitive information in localStorage (encryptData/decryptData)
DO NOT IMPLEMENT: Mask technical error messages from Firestore operations
DO NOT IMPLEMENT: make security.md following all the security best practices
DO NOT IMPLEMENT: add possibility to import transactions from a csv file
DO NOT IMPLEMENT: add possible language selection with preloaded categories of the preferred language
DO NOT IMPLEMENT: release as windows store app https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store
DO NOT IMPLEMENT: use Ionic's Capacitor or Cordova to make android app
DO NOT IMPLEMENT: Convert to TWA (Trusted Web Activity) - Use Bubblewrap to convert PWA to native Android app for system navigation bar control

---

[ ] Historical Pattern Recognition: Implement long-term trend identification with spending direction analysis and consistency scoring
[ ] Predictive Budget Recommendations: Generate budget optimization suggestions based on historical spending patterns and future projections
[ ] Location-Based Categories: GPS-aware category suggestions based on user location (e.g., "Coffee" when at café)
[ ] Progressive Image Loading: Implement progressive loading for category icons and visual elements

---

[ ] lazy load older transactions, they should be kept on server and only the transactions for the last 30 days should be cached on the device / PWA
[ ] add option to mark a transaction as important, maybe a checkbox or a star icon and when the user marks a transaction as important it should be highlighted in the transactions list
[ ] fix tutorial
[ ] we should think about possible management UI for the app for the system admin to overview the users and their accounts and other metrics like the audit logs, also other possible things like user management, billing, etc.
[ ] Update account-service.js and storage.js to implement an optional limit property for accounts, allowing the app to track credit limits and spending thresholds. This change exposes new API methods to calculate available credit and trigger utilization warnings, as originally outlined in the design spec.
[ ] consider removing googleapis for fonts
[ ] investigate: data integrity check in settings is adding unexpected labels to categories - determine root cause and fix
[ ] Add basic client-side security monitoring for failed login attempts and unusual data access patterns
[ ] Implement ability to disable the Currency sign in the app or change it with custom value, current default is EUR but if the user is from a different country they might want to change it, maybe it should be auto detected? Think of the simplest solution regarding this.
