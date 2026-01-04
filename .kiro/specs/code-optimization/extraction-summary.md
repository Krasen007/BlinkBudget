# TransactionForm Extraction - Quick Reference

## Current State → Target State

### Before (724 lines)

```
TransactionForm.js
├── Form setup (20 lines)
├── Account select (40 lines)
├── Type toggle creation (100 lines) ⚠️ EXTRACT
├── Amount input (40 lines) ⚠️ EXTRACT
├── Category definitions (40 lines) ⚠️ EXTRACT
├── Category rendering (250 lines) ⚠️ EXTRACT
├── Validation logic (50 lines) ⚠️ EXTRACT
├── Keyboard handling (60 lines) ⚠️ EXTRACT
├── Submission logic (40 lines) ⚠️ EXTRACT
└── Layout assembly (84 lines)
```

### After (~150 lines)

```
TransactionForm.js (Orchestration)
├── Form setup (10 lines)
├── Account select (15 lines) → uses dom-factory
├── Type toggle (10 lines) → uses form-utils/type-toggle
├── Amount input (10 lines) → uses form-utils/amount-input
├── Category selector (15 lines) → uses form-utils/category-chips
├── Layout assembly (20 lines)
├── Edit mode button (20 lines)
├── Keyboard setup (5 lines) → uses form-utils/keyboard
└── Initialization (5 lines)

New Utilities:
├── form-utils/
│   ├── type-toggle.js (80 lines)
│   ├── category-chips.js (200 lines)
│   ├── amount-input.js (60 lines)
│   ├── validation.js (80 lines)
│   ├── keyboard.js (70 lines)
│   ├── submission.js (60 lines)
│   └── constants.js (50 lines)
```

---

## Extraction Breakdown

| Component       | Current Lines | Extracted To        | New Lines | Savings |
| --------------- | ------------- | ------------------- | --------- | ------- |
| Type Toggle     | 100           | `type-toggle.js`    | 80        | 20      |
| Category System | 290           | `category-chips.js` | 200       | 90      |
| Amount Input    | 40            | `amount-input.js`   | 60        | -20\*   |
| Validation      | 50            | `validation.js`     | 80        | -30\*   |
| Keyboard        | 60            | `keyboard.js`       | 70        | -10\*   |
| Submission      | 40            | `submission.js`     | 60        | -20\*   |
| Constants       | 40            | `constants.js`      | 50        | -10\*   |
| **Total**       | **620**       | **7 files**         | **600**   | **20**  |

\*Negative savings are expected - we're adding structure, error handling, and reusability. The benefit is in organization and reusability, not line count reduction of utilities.

**Net Result:** TransactionForm goes from 724 → ~150 lines (79% reduction)

---

## Key Extraction Functions

### 1. Type Toggle

```javascript
// FROM: createTypeBtn() inside TransactionForm
// TO: form-utils/type-toggle.js

createTypeToggleGroup({
  initialType: 'expense',
  onTypeChange: (type) => { ... }
})
// Returns: { container, currentType, setType(), onTypeChange() }
```

### 2. Category Selector

```javascript
// FROM: renderCategories() + chip creation inside TransactionForm
// TO: form-utils/category-chips.js

createCategorySelector({
  type: 'expense',
  accounts: [...],
  currentAccountId: 'main',
  onSelect: (category) => { ... }
})
// Returns: { container, selectedCategory, setCategory(), render() }
```

### 3. Amount Input

```javascript
// FROM: amountInput creation + handlers inside TransactionForm
// TO: form-utils/amount-input.js

createAmountInput({
  initialValue: 0,
  externalDateInput: dateInput,
});
// Returns: { input, validate(), getValue(), setValue() }
```

### 4. Validation

```javascript
// FROM: Duplicated validation in 3 places
// TO: form-utils/validation.js

validateTransactionForm({
  amount: 100,
  category: 'Food',
  type: 'expense',
});
// Returns: { valid: true, errors: {} }
```

---

## State Management Flow

### Current (Scattered)

```
TransactionForm
├── let currentType = 'expense'
├── let selectedCategory = null
├── let selectedToAccount = null
├── let currentAccountId = 'main'
└── State updates scattered throughout
```

### After (Centralized)

```
TransactionForm
├── const typeState = createTypeToggleGroup(...)
├── const categoryState = createCategorySelector(...)
├── const amountState = createAmountInput(...)
└── State managed by utilities, exposed via APIs
```

---

## Code Duplication Elimination

### Before: Validation Logic (3 copies)

```javascript
// Line 377-387: Transfer chip click
const amountVal = parseFloat(amountInput.value);
if (isNaN(amountVal) || amountVal === 0) {
  amountInput.focus();
  amountInput.style.border = `1px solid ${COLORS.ERROR}`;
  // ...
}

// Line 496-507: Category chip click (same code)
// Line 600-606: OK button click (same code)
```

### After: Single Utility

```javascript
// form-utils/validation.js
export const validateAmount = value => {
  const amount = parseFloat(value);
  if (isNaN(amount) || amount === 0) {
    return { valid: false, error: 'Amount required' };
  }
  return { valid: true, value: Math.abs(amount) };
};

// Used in 3 places:
const validation = validateAmount(amountInput.value);
if (!validation.valid) {
  showFieldError(amountInput, validation.error);
  return;
}
```

---

## Touch Feedback Consolidation

### Before: Duplicated in 3 places

- Type toggle buttons (lines 111-125)
- Transfer account chips (lines 349-370)
- Category chips (lines 452-473)

### After: Single Utility

```javascript
// All use touch-utils.js
import { addTouchFeedback } from '../utils/touch-utils.js';

addTouchFeedback(chip, {
  hapticPattern: HAPTIC_PATTERNS.LIGHT,
  scale: 0.96,
});
```

---

## Category Chip Creation Consolidation

### Before: Two Separate Implementations

- Transfer chips (lines 318-409): 92 lines
- Category chips (lines 415-547): 133 lines
- **Total: 225 lines of similar code**

### After: Single Factory Function

```javascript
// form-utils/category-chips.js
createCategoryChip({
  label: 'Food & Groceries',
  color: '#10b981',
  isSelected: false,
  onClick: () => { ... }
})
// Handles both category and transfer chips
// ~80 lines total (reusable)
```

---

## Mobile Optimizations Preserved

All mobile-specific code will be preserved:

- ✅ Haptic feedback patterns
- ✅ Keyboard-aware scrolling
- ✅ Visual viewport handling
- ✅ Touch target sizing
- ✅ Input zoom prevention
- ✅ Mobile-specific styling

These will be integrated into utilities rather than duplicated.

---

## Testing Coverage

### Before Extraction

- TransactionForm tests: ~10 test cases
- Coverage: Component-level only

### After Extraction

- TransactionForm tests: ~10 test cases (same)
- Type toggle tests: ~5 test cases (new)
- Category chips tests: ~8 test cases (new)
- Amount input tests: ~4 test cases (new)
- Validation tests: ~6 test cases (new)
- Keyboard tests: ~3 test cases (new)
- **Total: ~36 test cases (better coverage)**

---

## Bundle Size Impact

### Current

- TransactionForm.js: ~724 lines
- No utilities extracted

### After

- TransactionForm.js: ~150 lines (-574 lines)
- form-utils/\*: ~600 lines (new, but reusable)
- **Net: +26 lines** (but much better organized)

### Tree-Shaking Benefit

- Other components can import only what they need
- Example: `import { validateAmount } from './form-utils/validation.js'`
- Only validation code included, not entire form utilities

---

## Migration Path

### Step-by-Step

1. ✅ Create utility file structure
2. ✅ Extract constants (no behavior change)
3. ✅ Extract validation (replace 3 copies with 1)
4. ✅ Extract amount input (isolate, test)
5. ✅ Extract category system (biggest change)
6. ✅ Extract type toggle (isolate, test)
7. ✅ Extract keyboard handling (isolate, test)
8. ✅ Extract submission (isolate, test)
9. ✅ Refactor TransactionForm (use all utilities)
10. ✅ Test everything
11. ✅ Verify line count < 200

### Rollback Strategy

- Each utility is independent
- Can revert one utility without affecting others
- Keep old code commented during transition
- Git commits after each phase

---

## Success Criteria Checklist

- [ ] TransactionForm.js < 200 lines
- [ ] All existing tests pass
- [ ] New utility tests written and passing
- [ ] No visual changes (pixel-perfect)
- [ ] No behavior changes (feature-complete)
- [ ] API unchanged (backward compatible)
- [ ] Bundle size ≤ current size
- [ ] Mobile interactions unchanged
- [ ] All edge cases handled
- [ ] Code is more maintainable

---

## Questions to Resolve

1. **Should category definitions be configurable?**
   - Current: Hardcoded in component
   - Option: Move to StorageService settings
   - Decision: Keep in constants for now, make configurable later

2. **Should utilities be in subdirectory or flat?**
   - Current plan: `form-utils/` subdirectory
   - Alternative: Flat `form-*.js` files
   - Decision: Subdirectory for better organization

3. **Should we extract to separate component files?**
   - Option: `TypeToggle.js`, `CategorySelector.js` as components
   - Current plan: Utilities only
   - Decision: Utilities first, components later if needed

---

## Next Actions

1. Review this extraction plan
2. Approve approach and priorities
3. Begin Phase 1 (Constants extraction)
4. Test incrementally
5. Complete full refactor
