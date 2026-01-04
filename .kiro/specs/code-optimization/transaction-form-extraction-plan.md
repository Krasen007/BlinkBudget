# TransactionForm.js Extraction Plan

## Overview

**Current State:**

- File: `src/components/TransactionForm.js`
- Current Lines: **724 lines**
- Target: **<200 lines** (64% reduction needed)
- Primary Issue: Multiple responsibilities mixed in one component

**Goal:**
Extract reusable utilities and patterns to reduce component size while maintaining full functionality and API compatibility.

---

## Extraction Analysis

### 1. Type Toggle System (Lines 65-161)

**Current Code:**

- `createTypeBtn()` function (lines 72-144)
- Type button creation and state management
- Touch feedback handlers
- Hover effects
- State update logic

**Extraction Target:** `src/utils/form-utils/type-toggle.js`

**What to Extract:**

```javascript
// Extract:
- createTypeBtn() function → createTypeToggleButton()
- Type color mapping logic → TYPE_COLORS constant
- Touch feedback setup → use existing touch-utils
- State management → createTypeToggleGroup() returns group + state manager
```

**Estimated Lines Saved:** ~100 lines

**New Utility API:**

```javascript
// src/utils/form-utils/type-toggle.js
export const createTypeToggleGroup = options => {
  // Returns: { container, currentType, setType(type), onTypeChange(callback) }
};
```

---

### 2. Category Chip System (Lines 208-549)

**Current Code:**

- Category definitions and colors (lines 211-245)
- `renderCategories()` function (lines 302-549)
- Category chip creation (duplicated for transfers vs categories)
- Touch feedback for chips
- Click handlers with validation
- Auto-submit logic

**Extraction Target:** `src/utils/form-utils/category-chips.js`

**What to Extract:**

```javascript
// Extract:
- categoryDefinitions → CATEGORY_DEFINITIONS constant
- categoryColors → CATEGORY_COLORS constant
- categoryOptions → CATEGORY_OPTIONS constant
- createCategoryChip() → unified chip creation function
- createTransferAccountChip() → transfer-specific chip
- renderCategories() → createCategorySelector() factory
- Chip container setup → createCategoryContainer()
```

**Estimated Lines Saved:** ~250 lines

**New Utility API:**

```javascript
// src/utils/form-utils/category-chips.js
export const CATEGORY_DEFINITIONS = { ... }
export const CATEGORY_COLORS = { ... }
export const CATEGORY_OPTIONS = { ... }

export const createCategorySelector = (options) => {
  // Returns: { container, selectedCategory, setCategory(cat), render() }
}

export const createCategoryChip = (options) => {
  // Returns: chip element with all handlers
}
```

---

### 3. Amount Input with Validation (Lines 170-206)

**Current Code:**

- Amount input creation
- Mobile optimizations (inputMode, pattern)
- Keyboard-aware scrolling
- Focus handlers

**Extraction Target:** `src/utils/form-utils/amount-input.js`

**What to Extract:**

```javascript
// Extract:
- createAmountInput() → factory function
- Mobile keyboard handling → use mobile-utils
- Validation logic → validateAmount()
```

**Estimated Lines Saved:** ~40 lines

**New Utility API:**

```javascript
// src/utils/form-utils/amount-input.js
export const createAmountInput = options => {
  // Returns: { input, validate(), getValue(), setValue() }
};

export const validateAmount = value => {
  // Returns: { valid: boolean, error: string }
};
```

---

### 4. Account Select (Lines 20-62)

**Current Code:**

- Account select creation
- Haptic feedback on change
- Mobile zoom prevention

**Extraction Target:** Use existing `dom-factory.js` + enhance

**What to Extract:**

```javascript
// Enhance dom-factory.js createSelect() to support:
- Mobile optimizations
- Haptic feedback integration
- Account-specific patterns
```

**Estimated Lines Saved:** ~30 lines

---

### 5. Keyboard Handling (Lines 652-707)

**Current Code:**

- `setupKeyboardHandling()` function
- Visual viewport management
- Form padding adjustments
- Body class toggling

**Extraction Target:** `src/utils/form-utils/keyboard.js`

**What to Extract:**

```javascript
// Extract:
- setupKeyboardHandling() → setupFormKeyboardHandling()
- Viewport resize handling
- Cleanup function creation
```

**Estimated Lines Saved:** ~60 lines

**New Utility API:**

```javascript
// src/utils/form-utils/keyboard.js
export const setupFormKeyboardHandling = (form, inputs) => {
  // Returns: cleanup function
};
```

---

### 6. Form Validation (Lines 376-387, 494-507, 598-623)

**Current Code:**

- Amount validation (duplicated 3 times)
- Category validation (duplicated 2 times)
- Error feedback (haptic + visual)

**Extraction Target:** `src/utils/form-utils/validation.js`

**What to Extract:**

```javascript
// Extract:
- validateAmount() → centralized validation
- validateCategory() → category/transfer validation
- showValidationError() → error feedback utility
```

**Estimated Lines Saved:** ~50 lines

**New Utility API:**

```javascript
// src/utils/form-utils/validation.js
export const validateTransactionForm = data => {
  // Returns: { valid: boolean, errors: {} }
};

export const showFieldError = (element, message) => {
  // Visual + haptic error feedback
};
```

---

### 7. Category Container Height Calculation (Lines 267-297)

**Current Code:**

- `calculateCategoryHeight()` function
- Visual viewport resize handling
- Mobile-specific height logic

**Extraction Target:** `src/utils/form-utils/category-chips.js` (part of container creation)

**What to Extract:**

```javascript
// Extract:
- calculateCategoryHeight() → internal to createCategoryContainer()
- Viewport resize handling → part of container lifecycle
```

**Estimated Lines Saved:** ~30 lines

---

### 8. Form Submission Logic (Lines 397-405, 528-545, 625-641)

**Current Code:**

- Auto-submit on category selection (duplicated)
- OK button submit (edit mode)
- Date handling
- Error handling

**Extraction Target:** `src/utils/form-utils/submission.js`

**What to Extract:**

```javascript
// Extract:
- prepareTransactionData() → normalize data before submit
- handleSubmit() → unified submit handler
- Date source resolution → getDateSource()
```

**Estimated Lines Saved:** ~40 lines

**New Utility API:**

```javascript
// src/utils/form-utils/submission.js
export const prepareTransactionData = (formState, dateInput) => {
  // Returns: normalized transaction object
};

export const handleFormSubmit = (data, onSubmit, onError) => {
  // Unified submit with error handling
};
```

---

## Proposed File Structure

```
src/utils/form-utils/
├── index.js                 # Barrel export
├── type-toggle.js           # Type toggle creation (~80 lines)
├── category-chips.js       # Category/account selection (~200 lines)
├── amount-input.js          # Amount input factory (~60 lines)
├── validation.js            # Form validation utilities (~80 lines)
├── keyboard.js              # Keyboard handling (~70 lines)
├── submission.js            # Submit logic (~60 lines)
└── constants.js             # Form-specific constants (~50 lines)
```

**Total New Utility Code:** ~600 lines (well-organized, reusable)
**TransactionForm After Refactor:** ~150-180 lines (orchestration only)

---

## Refactored TransactionForm Structure

```javascript
// src/components/TransactionForm.js (Refactored - ~150 lines)

import { StorageService } from '../core/storage.js';
import { SPACING, DIMENSIONS } from '../utils/constants.js';
import { createTypeToggleGroup } from '../utils/form-utils/type-toggle.js';
import { createCategorySelector } from '../utils/form-utils/category-chips.js';
import { createAmountInput, validateAmount } from '../utils/form-utils/amount-input.js';
import { createSelect } from '../utils/dom-factory.js';
import { setupFormKeyboardHandling } from '../utils/form-utils/keyboard.js';
import { validateTransactionForm, showFieldError } from '../utils/form-utils/validation.js';
import { prepareTransactionData, handleFormSubmit } from '../utils/form-utils/submission.js';

export const TransactionForm = ({ onSubmit, initialValues = {}, externalDateInput = null }) => {
    // 1. Form setup (10 lines)
    const form = createFormContainer();

    // 2. Account selection (15 lines)
    const { accountSelect, currentAccountId } = createAccountSelector(initialValues);

    // 3. Type toggle (10 lines)
    const { typeGroup, currentType, setType } = createTypeToggleGroup({
        initialType: initialValues.type,
        onTypeChange: handleTypeChange
    });

    // 4. Amount input (10 lines)
    const { amountInput, validate: validateAmountInput } = createAmountInput({
        initialValue: initialValues.amount,
        externalDateInput
    });

    // 5. Category selector (15 lines)
    const { categoryContainer, selectedCategory, setCategory } = createCategorySelector({
        type: currentType,
        accounts,
        currentAccountId,
        initialCategory: initialValues.category,
        onSelect: handleCategorySelect
    });

    // 6. Layout assembly (20 lines)
    assembleFormLayout(form, amountInput, accountSelect, categoryContainer, typeGroup);

    // 7. Edit mode OK button (20 lines)
    if (initialValues.id) {
        addOkButton(form, { amountInput, categoryContainer, currentType, ... });
    }

    // 8. Keyboard handling (5 lines)
    setupFormKeyboardHandling(form, [amountInput, accountSelect]);

    // 9. Initial focus (5 lines)
    initializeForm(amountInput);

    return form;
};
```

---

## Extraction Priority & Order

### Phase 1: Constants & Data (Low Risk)

1. Extract category definitions, colors, options → `form-utils/constants.js`
2. Extract type color mapping → `form-utils/type-toggle.js`

**Impact:** ~50 lines saved, no behavior change

### Phase 2: Validation Utilities (Low Risk)

3. Extract `validateAmount()` → `form-utils/validation.js`
4. Extract `validateCategory()` → `form-utils/validation.js`
5. Extract error feedback → `form-utils/validation.js`

**Impact:** ~50 lines saved, improves consistency

### Phase 3: Input Factories (Medium Risk)

6. Extract `createAmountInput()` → `form-utils/amount-input.js`
7. Enhance `createSelect()` in dom-factory for account selection

**Impact:** ~40 lines saved, improves reusability

### Phase 4: Category System (High Impact)

8. Extract `createCategoryChip()` → `form-utils/category-chips.js`
9. Extract `createCategorySelector()` → `form-utils/category-chips.js`
10. Extract category container setup → `form-utils/category-chips.js`

**Impact:** ~250 lines saved, major simplification

### Phase 5: Type Toggle (High Impact)

11. Extract `createTypeToggleGroup()` → `form-utils/type-toggle.js`

**Impact:** ~100 lines saved, improves reusability

### Phase 6: Keyboard & Submission (Medium Risk)

12. Extract `setupFormKeyboardHandling()` → `form-utils/keyboard.js`
13. Extract submission logic → `form-utils/submission.js`

**Impact:** ~100 lines saved, improves maintainability

### Phase 7: Refactor TransactionForm (Final)

14. Refactor TransactionForm to use all new utilities
15. Test thoroughly
16. Verify line count < 200

**Impact:** Component becomes orchestration layer only

---

## Dependencies & Interactions

### External Dependencies

- `StorageService` - Account data, settings
- `window.mobileUtils` - Mobile detection, haptic feedback, keyboard handling
- `constants.js` - Colors, spacing, dimensions
- `touch-utils.js` - Touch feedback patterns
- `dom-factory.js` - Basic DOM creation

### Internal State Flow

```
User Input → Validation → State Update → Visual Feedback → Auto-Submit (if valid)
     ↓
Type Change → Category Re-render → State Reset
     ↓
Account Change → Transfer Filter Update (if transfer type)
```

### Callback Chain

```
Category Select → Validate Amount → Validate Category → Prepare Data → onSubmit()
Type Change → Reset Selections → Re-render Categories
Account Change → Re-render (if transfer) → Update Filter
```

---

## Testing Strategy

### Unit Tests (New Utilities)

- `type-toggle.test.js` - Type button creation, state management
- `category-chips.test.js` - Chip creation, selection, rendering
- `amount-input.test.js` - Input creation, validation
- `validation.test.js` - All validation scenarios
- `keyboard.test.js` - Keyboard handling setup
- `submission.test.js` - Data preparation, error handling

### Integration Tests (TransactionForm)

- Form initialization with initial values
- Type toggle changes category display
- Category selection triggers auto-submit
- Amount validation prevents invalid submits
- Edit mode OK button behavior
- Keyboard handling on mobile
- Account change updates transfer list

### Regression Tests

- All existing TransactionForm tests must pass
- Verify API compatibility (props, callbacks unchanged)
- Verify visual appearance unchanged
- Verify mobile interactions unchanged

---

## Risk Assessment

### Low Risk

- Constants extraction
- Validation utilities
- Amount input factory

### Medium Risk

- Keyboard handling (viewport API complexity)
- Submission logic (error handling edge cases)
- Account select enhancement

### High Risk

- Category chip system (complex state, multiple code paths)
- Type toggle (state synchronization)
- Full form refactor (integration points)

### Mitigation

1. Extract incrementally (one utility at a time)
2. Write tests before refactoring
3. Keep old code commented during transition
4. Test after each extraction phase
5. Verify bundle size doesn't increase

---

## Success Metrics

### Primary Goals

- ✅ TransactionForm.js < 200 lines
- ✅ All tests pass
- ✅ No API changes
- ✅ No visual/behavior changes
- ✅ Bundle size ≤ current size

### Secondary Goals

- ✅ Utilities reusable in other components
- ✅ Better code organization
- ✅ Easier to maintain and extend
- ✅ Consistent patterns established

---

## Estimated Timeline

- **Phase 1-2:** 2-3 hours (Constants, Validation)
- **Phase 3:** 1-2 hours (Input Factories)
- **Phase 4:** 4-6 hours (Category System - most complex)
- **Phase 5:** 2-3 hours (Type Toggle)
- **Phase 6:** 2-3 hours (Keyboard, Submission)
- **Phase 7:** 3-4 hours (Final Refactor, Testing)

**Total:** ~14-21 hours of focused work

---

## Next Steps

1. ✅ Review and approve this extraction plan
2. Create utility file structure
3. Begin Phase 1 extraction (constants)
4. Test incrementally after each phase
5. Complete full refactor
6. Validate all metrics

---

## Notes

- Keep existing CSS classes unchanged (`.category-chip`, `.type-toggle-btn`, etc.)
- Maintain all existing event handlers and callbacks
- Preserve mobile optimizations (haptic feedback, keyboard handling)
- Keep auto-submit behavior exactly as-is
- Maintain edit mode OK button functionality
- Preserve all validation error messages and feedback
