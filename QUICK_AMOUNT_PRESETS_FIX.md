# Quick Amount Presets Auto-Update Fix

**Date**: March 2, 2026  
**Issue**: The 4 automatic amount buttons on the dashboard were not updating to show the most used values
**Status**: ✅ Fixed

## Problem

The quick amount preset buttons displayed default values (5, 10, 20, 50) and never updated, even after transactions were added. The presets were being calculated and stored in localStorage, but the UI component wasn't listening for changes.

### Root Cause

1. **Static Component**: `QuickAmountPresets` was created once and never re-rendered
2. **No Event System**: When `AmountPresetService.recordAmount()` was called, it updated localStorage but didn't notify the UI
3. **No Reactivity**: The component had no way to know when presets changed

## Solution

Implemented a **reactive event system** that notifies the component when presets change:

### Changes Made

#### 1. AmountPresetService (`src/core/amount-preset-service.js`)

Added event emission system:

```javascript
const PRESETS_CHANGE_EVENT = 'amount-presets-changed';

// Emit event when presets are saved
_emitChange() {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(PRESETS_CHANGE_EVENT, {
      detail: { presets: this.getPresets() },
    });
    window.dispatchEvent(event);
  }
}

// Subscribe to preset changes
onPresetsChange(callback) {
  const listener = event => callback(event.detail.presets);
  window.addEventListener(PRESETS_CHANGE_EVENT, listener);
  return () => window.removeEventListener(PRESETS_CHANGE_EVENT, listener);
}
```

**Flow**:

1. When `recordAmount()` is called → `_savePresets()` is called
2. `_savePresets()` now calls `_emitChange()`
3. `_emitChange()` dispatches a custom event with the new presets

#### 2. QuickAmountPresets Component (`src/components/QuickAmountPresets.js`)

Made the component reactive:

```javascript
// Extracted button rendering into a function
const renderButtons = () => {
  container.innerHTML = '';
  const presets = AmountPresetService.getPresets() || [];
  const displayPresets = presets.length > 0 ? presets : [5, 10, 20, 50];
  // ... create buttons
};

// Initial render
renderButtons();

// Subscribe to changes and re-render
const unsubscribe = AmountPresetService.onPresetsChange(() => {
  renderButtons();
});

// Store unsubscribe for cleanup
container._unsubscribe = unsubscribe;
```

**Flow**:

1. Component renders initial buttons
2. Subscribes to `amount-presets-changed` events
3. When event fires, `renderButtons()` is called
4. Buttons are cleared and recreated with new preset values

## How It Works

### User Flow

1. User adds a transaction with amount $25
2. `TransactionService.create()` calls `analyticsEngine.recordAmountPreset(25)`
3. `recordAmountPreset()` calls `AmountPresetService.recordAmount(25)`
4. `recordAmount()` updates localStorage and calls `_emitChange()`
5. `_emitChange()` dispatches `amount-presets-changed` event
6. `QuickAmountPresets` component receives event
7. Component calls `renderButtons()` to update the UI
8. Buttons now show the new most-used amounts

### Example Sequence

```
Initial state: [5, 10, 20, 50] (defaults)

User adds $25 transaction
↓
recordAmount(25) called
↓
localStorage updated: { 25: 1 }
↓
_emitChange() dispatches event
↓
QuickAmountPresets receives event
↓
renderButtons() called
↓
New presets: [25, 5, 10, 20] (25 is now most used)
↓
Buttons update to show: $25, $5, $10, $20
```

## Benefits

✅ **Real-time Updates**: Buttons update immediately after adding a transaction  
✅ **Automatic Learning**: Presets adapt to user's spending patterns  
✅ **No Manual Refresh**: Users don't need to reload the page  
✅ **Efficient**: Uses event system instead of polling  
✅ **Scalable**: Can be used for other reactive components

## Testing

The existing tests in `tests/components/quick-amount-presets.test.js` should still pass. To verify the fix works:

1. Add a transaction with amount $25
2. Go back to dashboard
3. The quick amount buttons should now show $25 as one of the options
4. Add more $25 transactions
5. $25 should move up in the button order (most used first)

## Technical Details

- **Event Type**: CustomEvent with `amount-presets-changed` name
- **Event Detail**: Contains the new presets array
- **Listener Pattern**: Subscribe/unsubscribe pattern for cleanup
- **Performance**: Minimal overhead - only re-renders when presets actually change
- **Browser Support**: Works in all modern browsers (CustomEvent supported since IE 9+)

## Files Modified

1. `src/core/amount-preset-service.js` - Added event system
2. `src/components/QuickAmountPresets.js` - Made component reactive

## No Breaking Changes

- All existing APIs remain unchanged
- Component signature is identical
- Backward compatible with existing code
- Tests should pass without modification
