# BlinkBudget To-Do List

[ ] release TWA (Trusted Web Activity) as windows store app...
Lightweight distribution methods that leverage the existing web app without adding heavy framework dependencies.

[ ] Implement ability to disable the Currency sign in the app... src/utils/constants.js:14 — hardcoded €; and give option to change to other symbol like $, it could be auto detected but this should be tested if correctly detirmines the right currency.
possible implementation that needs to be verified first:

## Plan: Configurable Currency Symbol

### Current State

- `CURRENCY_SYMBOL = '€'` is hardcoded at `src/utils/constants.js:14`
- Used in 5 files: `DashboardStatsCard.js`, `QuickAmountPresets.js`, `DashboardView.js`, `TransactionListItem.js`, `InvestmentsSection.js`

### Approach

**1. Add setting to `SettingsService`** (`src/core/settings-service.js`)

- Add `currencySymbol: '€'` to the defaults in `getAllSettings()`

**2. Create `CurrencySymbolSection` component** (`src/components/CurrencySymbolSection.js`)

- Follow the `DateFormatSection` pattern
- Dropdown with common currency symbols: `€`, `$`, `£`, `¥`, `₽`, `лв`, disabled, etc.
- Save selection via `SettingsService.saveSetting('currencySymbol', value)`

**3. Add section to `SettingsView`** (`src/views/SettingsView.js`)

- Insert `CurrencySymbolSection` in the general settings area

**4. Replace static constant with dynamic getter** (`src/utils/constants.js`)

- Add `getCurrencySymbol()` that reads from `SettingsService`
- Keep `CURRENCY_SYMBOL` as fallback default for backward compatibility

**5. Update all consumers** to use `getCurrencySymbol()` instead of `CURRENCY_SYMBOL`

**6. Add tests** for the new setting

### Currency Options

`€` (Euro), `$` (Dollar), `£` (Pound), `¥` (Yen), `₽` (Ruble), `лв` (Lev), `₹` (Rupee), `₩` (Won), `Fr` (Franc), `kr` (Krone)

[ ] src/core/custom-category-service.js:22-94 — manual reorder, it should be possible to use drag to reorder, not just the arrows.

in financial-planning?section=insights remove the section with Top Inflation Drivers its information is shown below in the chart.
also remove monthly bars and just keep the trend line, optimize the UI, remove the average button as its just that one and always on.
in Top Movers the part that shows Monthly Expenses: September 2026 - make it to show only the daily Expenses as the monthly one is not very informative.
Financial Snapshot - remove it from the app, its info is a bit redundant.
in the budget section
Suggested Budgets remove the color of the button as its a bit overwhelming to see so many colors.
