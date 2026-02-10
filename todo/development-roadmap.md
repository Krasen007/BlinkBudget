# BlinkBudget Development Roadmap (Unified)

## **Status Audit - February 2026**

BlinkBudget has made significant progress since its initial roadmap. The analytical foundation is enterprise-grade, and the "Smart" features required for the 3-click promise are largely in place.

### **Core Accomplishments** ✅

- [x] **Smart Suggestions Engine**: `SuggestionService.js` implemented with time, amount, and category patterns.
- [x] **Intelligent UI Components**: `SmartCategorySelector`, `SmartAmountInput`, and `SmartNoteField` are integrated into the main transaction flow.
- [x] **Budget Management**: `BudgetService.js` provides robust category-based budgeting.
- [x] **Advanced Analytics**: `ForecastEngine`, `AnomalyService`, and `InsightsService` provide high-value data analysis.
- [x] **Data Portability**: CSV and Emergency JSON export are fully functional.
- [x] **Data Integrity**: `DataIntegrityService` and `DataCleanupService` ensure database health.

---

## **Priority 1: Closing the 3-Click Loop** 🚨

_Focus: Friction elimination and default optimization_

### **1.1 Quick Mode Toggle**

- [ ] Implement a specific "Quick Add" toggle in settings.
- [ ] In Quick Mode: Auto-submit transaction when a high-confidence category suggestion is tapped.
- [ ] Streamline the "Dashboard -> Add" transition even further (zero-delay focus).

### **1.2 Account Intelligence**

- [ ] **Usage Tracking**: Enhance `AccountService` to track which accounts are used for specific categories.
- [ ] **Smart Defaults**: Auto-select the most likely account (e.g., Groceries -> Debit Card, Coffee -> Cash).
- [ ] **Quick Switcher**: Add a one-tap account switcher to the Smart form.

---

## **Priority 2: Recurring Transaction Management** 🔄

_Focus: Move from detection to automation_

### **2.1 Recurring Service Layer**

- [ ] Create `RecurringTransactionService.js` to bridge the `ForecastEngine` detection with actual storage.
- [ ] Implement a `STORAGE_KEYS.RECURRING` collection.

### **2.2 Management UI**

- [ ] Build a "Recurring Transactions" section in Settings or Financial Planning.
- [ ] Allow users to "Convert to Recurring" from existing transactions or the Forecast insights.

### **2.3 Automatic Processing**

- [ ] Implement a system to auto-insert or "Suggest for Today" recurring entries when they are due.
- [ ] Notification/Alert system for upcoming bills.

---

## **Priority 3: Contextual Intelligence & Geolocation** 📍

_Focus: Hyper-local personalization_

### **3.1 Merchant Logic**

- [ ] Better merchant extraction from notes (e.g., "Starbucks Sofia" -> "Starbucks").
- [ ] Map merchants to categories automatically (Starbucks -> Coffee).

### **3.2 Location Awareness**

- [ ] Optional Geolocation integration to suggest categories based on nearby businesses.
- [ ] Pattern learning: "When at this location, I usually spend on Groceries".

---

## **Priority 4: Mobile UX Polish & Ecosystem** ✨

### **4.1 Visual Feedback**

- [ ] Smoother transitions between Dashboard and Forms.
- [ ] Micro-animations for "Smart Match" high-confidence hits.
- [ ] Multi-format reports (PDF/Charts) for monthly summaries.

### **4.2 Data Ecosystem**

- [ ] **Import Tool**: CSV/JSON import to allow users to migrate from other apps.
- [ ] **Cloud Sync Refinement**: Further optimize the Firebase sync for metadata (ghostId, etc.).

---

## **Updated Implementation Timeline**

- **Weeks 1-2 (Current)**: Quick Mode & Account Intelligence.
- **Weeks 3-4**: Recurring Transaction Service & UI.
- **Weeks 5-6**: Contextual/Merchant Intelligence.
- **Weeks 7-8**: Advanced Reporting & Ecosystem.

## **Success Metrics**

- **Speed**: Average transaction entry < 5 seconds.
- **Accuracy**: 80% success rate for Smart Category matches.
- **Retention**: 40% of users interacting with Recurring Transaction automation.

---

_Note: This roadmap is a living document, updated to reflect the reality of the codebase as of Feb 2026._
