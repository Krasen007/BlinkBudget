## Investment Tracker: "Intentionally Simple" vs. Brokerage-Grade

The data model and method catalog tell the full story. Here's the current state and the proposed "intentionally simple" version.

---

### Current data model (what gets stored per investment)

```javascript
// Each investment stores ALL of these:
{
  id, symbol, name, shares, purchasePrice, currentPrice, purchaseDate,
  assetClass: 'stocks' | 'bonds' | 'etf' | 'realEstate' | 'crypto' | 'cash' | 'commodities' | 'other',
  sector: 'Technology' | 'Unknown' | etc.,
  region: 'US' | 'Europe' | 'Global' | etc.,
  currency,
  notes,
  lastPriceUpdate,
  createdAt, updatedAt,
  metadata: { ... }
}
```

The 8 asset classes, `sector`, and `region` fields exist solely to power the allocation analyses that the anti-goal says we shouldn't be doing at brokerage grade.

### Current methods (what the tracker does)

| Method | Lines | Purpose | Verdict |
|---|---|---|---|
| `addInvestment()` | 50 | CRUD — add a holding | ✅ Keep |
| `updateInvestmentValue()` | 23 | Update current price | ✅ Keep |
| `removeInvestment()` | 18 | CRUD — remove a holding | ✅ Keep |
| `updateInvestment()` | 35 | CRUD — update fields | ✅ Keep |
| `getAllInvestments()` | 4 | List holdings | ✅ Keep |
| `getInvestment()` | 7 | Get by symbol | ✅ Keep |
| `calculatePortfolioValue()` | 6 | Total value | ✅ Keep |
| `calculateGainsLosses()` | 39 | Gain/loss per holding | ✅ Keep but simplify |
| `calculateReturns()` | 75 | Returns with annualized calculation | ❌ Remove (brokerage-grade) |
| `analyzeAssetAllocation()` | 47 | Allocation by 8 asset classes | ❌ Remove |
| `analyzeSectorAllocation()` | 35 | Sector breakdown | ❌ Remove |
| `analyzeGeographicAllocation()` | 35 | Geographic breakdown | ❌ Remove |
| `getTopPerformers()` | 12 | Top/bottom ranking | ❌ Remove |
| `getPortfolioSummary()` | 19 | Assembles all of the above | ❌ Remove (aggregates removed methods) |
| `clearAllInvestments()` | 4 | Reset | ✅ Keep |
| `batchSetInvestments()` | 39 | Restore | ✅ Keep |
| `_loadInvestments()` | 38 | Persistence | ✅ Keep |
| `_saveInvestments()` | 15 | Persistence | ✅ Keep |

### What the UI shows (InvestmentsSection.js — 1537 lines)

The view renders:
1. **Portfolio composition chart** (asset allocation pie chart)
2. **Investment form** with type-specific fields (stocks show shares/price, crypto shows units, real estate shows sqm/property type, etc.)
3. **Investment list** with edit/delete per row
4. **Net balance chart** (shared with Overview)
5. **Goal tracking** within investments

The 1537 lines include: form builders for ALL 8 asset types, chart logic, CRUD UI, allocation display.

---

### Proposed: "Intentionally Simple" version

**Data model** (simplified):
```javascript
{
  id, symbol, name, shares, purchasePrice, currentPrice, purchaseDate,
  notes  // free text only — no structured sector/region/assetClass
}
```

**Methods to keep** (those that serve the 3-click user):
- `addInvestment()` — but accept only symbol, shares, purchasePrice, purchaseDate
- `updateInvestmentValue()` — manual price update
- `removeInvestment()`, `updateInvestment()`, `getAllInvestments()`, `getInvestment()`
- `calculatePortfolioValue()` — total worth
- `calculateGainsLosses()` — simplified: just current value vs purchase value per holding, no annualized returns
- `clearAllInvestments()`, `batchSetInvestments()`, `_loadInvestments()`, `_saveInvestments()`

**Methods to remove entirely** (57% of the file):
- `calculateReturns()` — annualized return calculation is brokerage-grade
- `analyzeAssetAllocation()` — the 8 asset classes were the anti-goal violation
- `analyzeSectorAllocation()` — sector analysis is brokerage-grade
- `analyzeGeographicAllocation()` — geographic analysis is brokerage-grade
- `getTopPerformers()` — ranking is brokerage-grade
- `getPortfolioSummary()` — no longer needed without the above

**What the simplified version looks like:**
```
My Investments
━━━━━━━━━━━━━━━━━━━━━━━━━
Total Portfolio Value: $12,450
Total Gain/Loss: +$1,230 (+11.0%)

AAPL  —  10 shares @ $150  →  $1,500  (+$200)
MSFT  —  5 shares @ $380   →  $1,900  (+$150)
VTI   —  20 shares @ $240  →  $4,800  (+$300)
BTC   —  0.5 @ $42,000     →  $21,000 (+$2,000)

[+ Add Investment]  [Edit]  [Delete]
```

No charts. No allocation breakdowns. No sector/region analysis. No annualized returns. No "top performers" ranking.

**What the user loses:**
- Asset allocation pie chart
- Sector breakdown
- Geographic breakdown
- Annualized return calculation
- Top/bottom performer ranking
- Type-specific form fields (crypto units, real estate sqm, etc.)

**What the user gains:**
- 300 fewer lines of code to maintain
- No cognitive load from investment analysis in an expense tracking app
- A simple holdings list that answers "what do I own and what is it worth?"
- Consistency with the anti-goal

### The test: "What does your 3-click expense data tell you about your investments?"

Answer: Nothing. The investment tracker is a separate product bolted on. The "intentionally simple" version doesn't try to connect it to expense tracking — it just records what you own and what it's worth. That's the level of simplicity the anti-goal intended.

The current version tries to be a mini-Personal Capital. The simplified version is a notepad with math.

---

### Implementation plan summary

**Files to change:**
1. `src/core/investment-tracker.js` (631 → ~250 lines): Remove 6 methods, simplify data model, simplify `updateInvestment()` allowed fields
2. `src/views/financial-planning/InvestmentsSection.js` (1537 → ~500 lines): Remove chart, remove type-specific form fields, remove allocation display, simplify to flat list
3. `src/views/financial-planning/OverviewSection.js`: Remove net balance chart reference if it depends on investment allocation
4. `src/utils/financial-planning-charts.js`: Remove `createPortfolioCompositionChart()` if it's only used by investments
5. `README.md`: Remove "Asset Allocation" and "Performance Metrics" claims
6. `tests/services/investment-tracker.test.js`: Update tests to match simplified API

**What stays in the UI:**
- Investment list (symbol, name, shares, price, current value, gain/loss)
- Add/edit/delete form (symbol, shares, purchase price, current price, purchase date, notes)
- Total portfolio value display
- Total gain/loss display

**What goes:**
- Portfolio composition pie chart
- Asset allocation breakdown
- Sector allocation
- Geographic allocation
- Annualized returns
- Top/bottom performer ranking
- Net balance chart (if investment-specific)