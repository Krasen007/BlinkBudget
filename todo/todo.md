DO NOT IMPLEMENT: when you start the app the default view should be to add new entry
DO NOT IMPLEMENT: add option to reorder categories or auto sort them by most common, it may also be learning from the user behavior and predict the category based on the amount
DO NOT IMPLEMENT: Add visual indicators for refund transactions in lists
DO NOT IMPLEMENT: when deleting a transaction create animation of the row dissapearing
DO NOT IMPLEMENT: Client-side session timeout (30 minutes of inactivity; monitor clicks/keypresses, auto logout)
DO NOT IMPLEMENT: Local data encryption for sensitive information in localStorage (encryptData/decryptData)
DO NOT IMPLEMENT: Mask technical error messages from Firestore operations
DO NOT IMPLEMENT: Implement an audit logging mechanism for sensitive user actions (account changes, data export)
DO NOT IMPLEMENT: Add password reset option in the login if user forgets it
DO NOT IMPLEMENT: make security.md following all the security best practices 
DO NOT IMPLEMENT: add possibility to import transactions from a csv file
DO NOT IMPLEMENT: Forecast: Estimate future income and expenses based on your past spending, Preview how your account balances will change over time, Avoid low account balances, overdraft fees, and going over your credit card limit.
DO NOT IMPLEMENT: See all your investments at one place, View allocation across asset classes, sectors and countries, Monitor investment performance in the near and long term.
DO NOT IMPLEMENT: Plan for long term goals like retirement, buying a house, kid's education, Preview a long term financial forecast to see if you can reach your goals.
DO NOT IMPLEMENT: Insights: Top Movers 1 Jan 2026 vs Dec 2025
DO NOT IMPLEMENT: Insights: Timeline Jan vs Dec 2025
***
[x] fix wrong amount display -$-6.00
[x] add refund option
[x] add hover effect when the mouse is going over the items in the dashboard
[x] when you add a new expense the Save expense button is not needed, it should save automattically when the categorie is selected.
[x] the list of transactions should be scrollable to see earlier entries
[x] style the scroll bar to match the rest of the app feel
[x] fix inconsistences of how the category text is displayed above the date, it seems some are few pixels apart
[x] We should have the possibility to have multiple Accounts like checking account, savings account etc. <!-- id: 9 -->
[x] style the cancel button and the delete confirmation window to be the same style as the rest of the app
[x] add option to edit name of categories or add new categories
[x] add option to add an expense in the past
[x] add option to delete entries style the date picker to be the same style as the rest of the app.
[x] Simplify date handling - Remove duplicate date input (keep only top)
[x] Adjust spacing - tighter compact layout
[x] Reorder elements - Different sequence (e.g., Amount first, then Type at the bottom)
[x] Begin work on sorting and filtering by month and year, seeing old transactions and being able to filter them
[x] Implement category-based filtering
[x] begin work on PWA
[x] when editing transactions the original selected category should be shown in the first position
[x] when adding new transaction the selected account should be the account when adding the transaction
[x] when editing a trasaction the selected categorie should show at the first position in the list to make it easier to select it
[x] change the name of the date format to remove the iso / us etc. just leave the format.
[x] on mobile, the accounts in the settings view, the name and type should be shown on a single row to save space
[x] when oppening the PWA app, the text blinking your transctions should is good but in reality the app should load the transactions from the local storage and after that it should sync the latest transactions from the server 
[x] on mobile when scrolling the transactions a hover effect should removed
[x] change the $ in the transactions to €
[x] add install PWA button in the settings
[x] add refresh button in the settings
[ ] add option to double tap on a transaction to split it in half