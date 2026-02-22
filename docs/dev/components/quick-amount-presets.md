# Quick Amount Presets Component

## Overview

The Quick Amount Presets component displays a row of preset amount buttons on the transaction form, allowing users to quickly fill in commonly used expense amounts.

## Component Location

- File: Rendered dynamically via transaction form components
- Service: src/core/amount-preset-service.js
- Analytics Engine: src/core/analytics-engine.js

## Features

### Preset Display

- Shows top 4 most frequently used amounts
- Each button displays amount and usage count
- Ordered by frequency (most used first)

### Interaction

- Single tap/click fills the amount field
- Visual feedback on touch/click
- Accessible keyboard navigation

### Data Flow

Transaction Form -> AnalyticsEngine.getAmountPresets() -> AmountPresetService.getPresets() -> localStorage -> Preset Buttons -> Amount Input

## API Reference

### Getting Presets

const presets = analyticsEngine.getAmountPresets();
// Output: [10, 20, 5, 50]

### Recording Usage

analyticsEngine.recordAmountPreset(amount);

### Recalculating Presets

const newPresets = analyticsEngine.calculateAmountPresets();

## Data Structures

### Preset Data (localStorage)

{ amounts: { 10: 25, 5: 20, 20: 15, 50: 10 }, presets: [10, 5, 20, 50] }

## Accessibility

- Buttons have accessible names with amount
- Keyboard navigation support (Tab, Enter)
- Screen reader announcements
- Minimum touch target size (44x44px)

## Performance

- Presets cached in memory after first load
- LocalStorage read is synchronous
- Updates trigger on transaction submit only

---

_Template Version: 1.0_
_Last Updated: February 22, 2026_
