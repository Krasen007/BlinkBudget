# Refund Transactions Design Document

## Overview

The refund transaction feature extends BlinkBudget's existing transaction system to support logging returned purchases and refunded amounts. This design maintains the app's core 3-click interaction pattern while providing accurate financial tracking for money returned to user accounts.

The implementation leverages the existing transaction form architecture, adding a fourth transaction type ("refund") that reuses expense categories but treats amounts as positive account balance adjustments. This approach ensures consistency with the current user experience while providing clear differentiation for refunded transactions.

## Architecture

The refund feature integrates into BlinkBudget's existing component architecture:

### Component Integration
- **TransactionForm Component**: Extended to support refund type selection and category handling
- **AddView/EditView**: No structural changes required, inherits refund support through TransactionForm
- **StorageService**: Leverages existing transaction storage with type differentiation
- **Category System**: Reuses existing expense categories for refund transactions

### Data Flow
1. User selects "Refund" type in transaction form
2. System displays expense categories (same as regular expenses)
3. User enters amount and selects category
4. Transaction auto-submits with type="refund"
5. Storage service saves transaction with positive amount impact
6. Dashboard displays refund with visual distinction

## Components and Interfaces

### TransactionForm Component Updates

#### Type Toggle Enhancement
```javascript
// Add refund button to existing type toggle group
const refundBtn = createTypeBtn('refund', 'Refund');

// Update type group to include four buttons
typeGroup.appendChild(expenseBtn);
typeGroup.appendChild(incomeBtn);
typeGroup.appendChild(transferBtn);
typeGroup.appendChild(refundBtn);
```

#### Category Rendering Logic
```javascript
// Extend categoryOptions to include refund
const categoryOptions = {
    expense: ['Food & Groceries', 'Dining & Coffee', ...],
    income: ['Paycheck', 'Business / Freelance', ...],
    transfer: [], // Handled separately with account selection
    refund: ['Food & Groceries', 'Dining & Coffee', ...] // Same as expense
};
```

#### Visual Styling
- Refund type button uses distinct color (e.g., teal/cyan) to differentiate from expense (primary) and income (green)
- Category chips maintain existing styling when in refund mode
- Amount input behavior remains unchanged (positive values)

### Storage Integration

#### Transaction Data Structure
```javascript
// Refund transaction example
{
    id: "uuid",
    type: "refund",
    amount: 25.99,
    category: "Food & Groceries",
    accountId: "main",
    timestamp: "2024-12-16T10:30:00.000Z"
}
```

#### Balance Calculation Impact
- Refund transactions add to account balance (like income)
- Category-based filtering includes refunds in their respective expense categories
- Transaction history maintains chronological order regardless of type

## Data Models

### Transaction Type Extension
```javascript
// Existing transaction types: 'expense', 'income', 'transfer'
// New type: 'refund'

const TRANSACTION_TYPES = {
    EXPENSE: 'expense',
    INCOME: 'income', 
    TRANSFER: 'transfer',
    REFUND: 'refund'
};
```

### Category Mapping
```javascript
// Refund categories mirror expense categories
const REFUND_CATEGORIES = [
    'Food & Groceries',
    'Dining & Coffee', 
    'Housing & Bills',
    'Transportation',
    'Leisure & Shopping',
    'Personal Care'
];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Refund category display consistency
*For any* transaction form instance, when the refund type is selected, the displayed categories should be identical to the categories shown when expense type is selected
**Validates: Requirements 1.1**

### Property 2: Refund balance impact
*For any* refund transaction with a positive amount, adding it to an account should increase the account balance by exactly that amount
**Validates: Requirements 1.2**

### Property 3: Refund transaction persistence
*For any* completed refund transaction, the stored data should have type "refund" and preserve the selected expense category
**Validates: Requirements 1.3**

### Property 4: Interaction count consistency
*For any* refund transaction workflow, the number of user interactions required should equal the number required for expense transactions
**Validates: Requirements 1.4**

### Property 5: Category auto-submit behavior
*For any* category selection in refund mode, the auto-submit behavior should be identical to category selection in expense mode
**Validates: Requirements 2.3**

### Property 6: Mobile interaction consistency
*For any* mobile interaction with refund type, touch targets and haptic feedback should match the specifications of other transaction types
**Validates: Requirements 2.4**

### Property 7: Form state preservation
*For any* type switch to refund, the amount and account values should be preserved while category selection should be cleared
**Validates: Requirements 2.5**

### Property 8: Balance calculation correctness
*For any* account balance calculation including refund transactions, refunds should contribute positively like income transactions
**Validates: Requirements 3.2**

### Property 9: Category filter inclusion
*For any* category-based filter operation, refund transactions should appear in filters matching their associated expense category
**Validates: Requirements 3.3**

### Property 10: Edit form initialization
*For any* refund transaction being edited, the form should initialize with refund type selected and show appropriate categories
**Validates: Requirements 4.2**

### Property 11: Edit type switching
*For any* type switch during editing, the available categories should update appropriately for the new transaction type
**Validates: Requirements 4.3**

### Property 12: Edit data persistence
*For any* refund transaction edit and save operation, the transaction should maintain its refund type and associated category
**Validates: Requirements 4.4**

## Error Handling

### Input Validation
- Amount validation remains unchanged (positive numbers, required field)
- Category selection required for refund transactions (same as expenses)
- Account selection validation applies to refunds

### Type Switching Edge Cases
- Switching from refund to transfer clears category selection and shows account destinations
- Switching from transfer to refund clears destination account and shows categories
- Amount and source account preserved across all type switches

### Storage Error Recovery
- Failed refund transaction saves fall back to standard error handling
- Invalid refund data gracefully degrades to expense type with user notification
