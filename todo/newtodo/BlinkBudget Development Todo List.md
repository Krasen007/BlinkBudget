# BlinkBudget Development Todo List

## **High Priority - Core 3-Click Experience** 🚨

### **Quick Mode Implementation**

- [ ] Add "Quick Add" toggle to settings
- [ ] Implement auto-submit on high-confidence category selection
- [ ] Optimize Dashboard -> Add transition for zero-delay focus
- [ ] Test and validate 3-click workflow

### **Account Intelligence Enhancement**

- [ ] Enhance `AccountService` with category usage tracking
- [ ] Implement smart account defaults based on category patterns
- [ ] Add one-tap account switcher to transaction form
- [ ] Create account-category mapping logic

---

## **Medium Priority - User Retention** 🔄

### **Recurring Transaction System**

- [ ] Create `RecurringTransactionService.js`
- [ ] Implement `STORAGE_KEYS.RECURRING` storage structure
- [ ] Build recurring transactions management UI
- [ ] Add "Convert to Recurring" functionality from existing transactions
- [ ] Implement automatic recurring entry suggestions
- [ ] Create notification system for upcoming recurring items

---

## **Low Priority - Nice to Have** ✨

### **Data Import/Export Ecosystem**

- [ ] Build CSV/JSON import tool for user migration
- [ ] Optimize Firebase sync metadata handling
- [ ] Create import validation and conflict resolution

### **Visual Polish**

- [ ] Implement smoother Dashboard-Form transitions
- [ ] Add micro-animations for smart matches
- [ ] Create multi-format report generation (PDF/Charts)

---

## **Future Analysis - Consider Carefully** 🤔

### **Contextual Intelligence**

- [ ] Research merchant extraction improvements
- [ ] Evaluate geolocation integration benefits vs privacy concerns
- [ ] Assess location-based category suggestion value
- [ ] Consider merchant-to-category auto-mapping

---

## **Implementation Notes**

**Current Status**: Core analytics and smart suggestions are implemented. Focus should be on UX optimization rather than new features.

**Bloat Risk Assessment**:

- ✅ Implement: Quick Mode, Account Intelligence, Recurring Transactions
- 🟡 Consider: Import Tool, Visual Polish
- 🔴 Avoid: Complex geolocation, advanced merchant logic

**Success Metrics to Track**:

- Average transaction entry time
- Smart category match accuracy
- Recurring transaction feature adoption
