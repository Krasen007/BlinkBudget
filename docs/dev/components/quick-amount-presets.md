# Quick Amount Presets Component

## Overview

The Quick Amount Presets component displays a row of preset amount buttons on the transaction form, allowing users to quickly fill in commonly used expense amounts.

## Component Location

- Service: src/core/amount-preset-service.js
- Used in: Transaction form components
- Feature: Quick Amount Presets (Feature 3.4.1)

## Features

### Preset Display

- Shows top 4 most frequently used amounts
- Each button displays amount with usage tracking
- Ordered by frequency (most used first)

### Interaction

- Single tap/click fills the amount field
- Visual feedback on touch/click
- Accessible keyboard navigation

### Data Flow

Transaction Form -> AmountPresetService.getPresets() (reads localStorage) -> Preset Buttons -> Amount Input Field

## API Reference

### Getting Presets

```javascript
import { AmountPresetService } from '../core/amount-preset-service.js';

const presets = AmountPresetService.getPresets();
// Output: [10, 20, 5, 50] - top 4 amounts by frequency
```

### Recording Usage

```javascript
AmountPresetService.recordAmount(25.5);
```

### Getting Frequency Data

```javascript
const frequencyData = AmountPresetService.getFrequencyData();
// Output: { 10: 25, 5: 20, 20: 15, 50: 10 }
```

### Subscribing to Changes

```javascript
const unsubscribe = AmountPresetService.onPresetsChange(newPresets => {
  console.log('Presets updated:', newPresets);
});

// Cleanup when done
unsubscribe();
```

## Data Structures

### Preset Data (localStorage)

```javascript
// Stored with key 'amount_presets'
{
  amounts: {
    10: 25,    // Amount 10.00 used 25 times
    5: 20,     // Amount 5.00 used 20 times
    20: 15,    // Amount 20.00 used 15 times
    25.50: 8,   // Amount 25.50 used 8 times
    50: 10     // Amount 50.00 used 10 times
  },
  presets: [10, 5, 20, 25.50, 50]  // Top 4 amounts sorted by frequency (decimal format)
}
```

## Implementation Details

### AmountPresetService Methods

| Method                      | Description                   | Parameters          | Returns                |
| --------------------------- | ----------------------------- | ------------------- | ---------------------- |
| `getPresets()`              | Get current top 4 presets     | none                | `Array<number>`        |
| `recordAmount(amount)`      | Record usage of an amount     | `number` amount     | `void`                 |
| `getFrequencyData()`        | Get all frequency data        | none                | `Object`               |
| `getAmountCount(amount)`    | Get count for specific amount | `number` amount     | `number`               |
| `resetPresets()`            | Clear all preset data         | none                | `void`                 |
| `onPresetsChange(callback)` | Subscribe to preset changes   | `Function` callback | `Function` unsubscribe |

### Constants

```javascript
const AMOUNT_PRESETS_KEY = 'amount_presets';
const MAX_PRESETS = 4;
const PRESETS_CHANGE_EVENT = 'amount-presets-changed';
```

## Accessibility

- Buttons have accessible names with amount
- Keyboard navigation support (Tab, Enter, Space)
- Screen reader announcements via ARIA attributes
- Minimum touch target size (44x44px minimum)

## Performance

- Presets cached in localStorage
- Synchronous localStorage reads
- Updates trigger on transaction submit only
- Event-driven updates to UI components

## Usage Example

```javascript
// In transaction form component
import { AmountPresetService } from '../core/amount-preset-service.js';

// Get current presets
const presets = AmountPresetService.getPresets();

// Create preset buttons
presets.forEach(amount => {
  const button = createPresetButton(amount);
  button.addEventListener('click', () => {
    // Fill amount field
    amountField.value = amount;

    // Record usage
    AmountPresetService.recordAmount(amount);
  });
});

// Listen for preset updates
const unsubscribe = AmountPresetService.onPresetsChange(newPresets => {
  updatePresetButtons(newPresets);
});
```

## Error Handling

- localStorage errors are caught and logged
- Invalid amounts are ignored (<= 0)
- Normalized to 2 decimal places for consistency
- Graceful fallback to empty presets if data corrupted

---

_Component Version: 1.0_
_Last Updated: April 7, 2026_
