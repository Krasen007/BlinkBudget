DO NOT IMPLEMENT: when you start the app the default view should be to add new entry
DO NOT IMPLEMENT: add option to reorder categories or auto sort them by most common, it may also be learning from the user behavior and predict the category based on the amount
DO NOT IMPLEMENT: Add visual indicators for refund transactions in lists
DO NOT IMPLEMENT: when deleting a transaction create animation of the row dissapearing / when splitting a transaction create animation of the row duplicating
DO NOT IMPLEMENT: Client-side session timeout (30 minutes of inactivity; monitor clicks/keypresses, auto logout)
DO NOT IMPLEMENT: Local data encryption for sensitive information in localStorage (encryptData/decryptData)
DO NOT IMPLEMENT: Mask technical error messages from Firestore operations
DO NOT IMPLEMENT: Implement an audit logging mechanism for sensitive user actions (account changes, data export)
DO NOT IMPLEMENT: make security.md following all the security best practices
DO NOT IMPLEMENT: add possibility to import transactions from a csv file
DO NOT IMPLEMENT: Add pre-selected categories when amount matches some amount, example: if user writes 25 assume it is Гориво, between 15 and 35 assume Храна, 13,28 is Телефон, 204,52 - Кредит, 255,64 - Други, highlight the category so that is to be more visible for the user to click e.g. Analyze transaction history; Implement time-based suggestions; Add amount-based category hints; Create confidence scoring; A/B test prediction accuracy

DO NOT IMPLEMENT: release as windows store app https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store
DO NOT IMPLEMENT: use Ionic's Capacitor or Cordova to make android app

---

[ ] Implement offline first loading for charts to be available on PWA evene when there is no internet
[ ] there is a white bar when using the PWA in light mode i must check how it is on the browser
[ ] Chrome browser detects the app core and switches to dark or white mode but when I use the PWA it detects that I'm using light theme and it makes my bar white
[ ] when splitting a transaction on long press add confirmation dialog to make sure the user did not unintentionally did it
[x] implement backup solution on server so if needed a user can restore their data up to the previous day, this could be added in the settings. the button will delete all the transactions after the selected date. example: if i select 2025-12-15 it will delete all the transactions after 2025-12-15 and keep the transactions before 2025-12-15, better will be to select range and the backup to restore transactions in the selected period. think of how this will be implemented on the app while keeping it offline first.
[ ] lazy load older transactions, they should be kept on server and only the transactions for the last 30 days should be cached on the device / PWA
[ ] add option to mark a transaction as important, maybe a checkbox or a star icon and when the user marks a transaction as important it should be highlighted in the transactions list
[ ] fix tutorial
[ ]Add 'Notes' field to Transaction schema and UI forms.
[ ] we should think about possible management UI for the app for the system admin to overview the users and their accounts and other metrics like the audit logs, also other possible things like user management, billing, etc.
[ ] Update account-service.js and storage.js to implement an optional limit property for accounts, allowing the app to track credit limits and spending thresholds. This change exposes new API methods to calculate available credit and trigger utilization warnings, as originally outlined in the design spec.
