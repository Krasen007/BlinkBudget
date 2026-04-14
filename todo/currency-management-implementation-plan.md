# Currency Management Implementation Plan

## Overview

This implementation plan addresses the need for a comprehensive currency management system throughout BlinkBudget that allows users to select their preferred currency or disable currency display entirely. The current codebase has inconsistent currency formatting with hardcoded locales and currency symbols scattered across multiple files.

## Current State Analysis

### Issues Identified

1. **Inconsistent Locale Usage**: Mixed use of 'en-US', 'en-EU' locales
2. **Hardcoded Currency Symbols**: Direct € and $ symbols in various files
3. **Scattered Currency Logic**: Currency formatting logic duplicated across 15+ files
4. **No Central Currency Configuration**: No user preference system for currency selection
5. **Mixed Currency Codes**: Some files use USD, others use EUR inconsistently

### Files Requiring Changes

#### Core Currency Files
- `src/utils/financial-planning-helpers.js` - Contains `formatCurrency` function
- `src/utils/reports-charts.js` - Multiple Intl.NumberFormat instances
- `src/utils/financial-planning-charts.js` - Chart currency formatting
- `src/utils/inflation-chart-utils.js` - USD hardcoded

#### View Files
- `src/views/financial-planning/OverviewSection.js` - Hardcoded € symbols
- `src/views/financial-planning/InvestmentsSection.js` - Mixed locale usage
- `src/views/financial-planning/InsightsSection.js` - en-US locale
- `src/views/financial-planning/GoalsSection.js` - en-US locale
- `src/views/financial-planning/BudgetsSection.js` - Uses formatCurrency (good)
- `src/views/financial-planning/ForecastsSection.js` - Hardcoded € symbols

#### Component Files
- Various chart and UI components with embedded currency formatting

## Implementation Strategy

### Phase 1: Create Central Currency Service

#### 1.1 Create Currency Service
**File**: `src/core/currency-service.js`

**Features**:
- Central currency configuration management
- User preference storage and retrieval
- Currency formatting with locale-aware options
- Support for "no currency" mode
- Currency symbol caching for performance
- Real-time currency conversion (future enhancement)

**API Design**:
```javascript
class CurrencyService {
  // Configuration
  static setCurrency(currencyCode)
  static getCurrency()
  static setLocale(locale)
  static getLocale()
  static setDisplayMode(mode) // 'symbol', 'code', 'none'
  static getDisplayMode()
  
  // Formatting
  static format(value, options = {})
  static formatWithSymbol(value)
  static formatWithCode(value)
  static formatWithoutCurrency(value)
  
  // Utilities
  static getCurrencySymbol(currencyCode)
  static isNoCurrencyMode()
  static getSupportedCurrencies()
}
```

#### 1.2 Update Settings Service
**File**: `src/core/settings-service.js`

**Additions**:
- Currency preference storage
- Locale preference storage
- Display mode preference (symbol/code/none)
- Default currency detection based on browser locale

#### 1.3 Create Currency Configuration
**File**: `src/config/currency-config.js`

**Content**:
- Supported currencies with their locales
- Currency symbols and codes
- Decimal precision rules
- Formatting templates

### Phase 2: Replace Direct Currency Formatting

#### 2.1 Update Core Helper Functions
**File**: `src/utils/financial-planning-helpers.js`

**Changes**:
- Modify `formatCurrency` to use `CurrencyService`
- Add backward compatibility layer
- Deprecate direct usage in favor of service

#### 2.2 Chart Utilities Updates
**Files**: 
- `src/utils/reports-charts.js`
- `src/utils/financial-planning-charts.js`
- `src/utils/inflation-chart-utils.js`

**Changes**:
- Replace all `Intl.NumberFormat` instances with `CurrencyService.format`
- Update chart tooltips and labels
- Ensure consistent formatting across all charts

#### 2.3 View Files Updates
**Files**: All financial planning view files

**Changes**:
- Replace hardcoded € symbols with `CurrencyService.format`
- Update all currency display logic
- Ensure responsive formatting (mobile vs desktop)

### Phase 3: User Interface Integration

#### 3.1 Currency Settings Component
**File**: `src/components/CurrencySelector.js`

**Features**:
- Currency selection dropdown
- Locale selection
- Display mode toggle (symbol/code/none)
- Live preview of formatting
- Reset to defaults option

#### 3.2 Settings Integration
**File**: `src/views/SettingsView.js`

**Additions**:
- Currency settings section
- Integration with CurrencySelector component
- Save and restore functionality
- Validation and error handling

#### 3.3 Real-time Updates
**Implementation**:
- Event-driven currency change notifications
- Automatic UI updates when currency settings change
- Cache invalidation for formatted values
- Smooth transitions between currency formats

### Phase 4: Advanced Features

#### 4.1 Currency Conversion (Future)
**Features**:
- Real-time exchange rate integration
- Multi-currency transaction support
- Historical conversion for reports
- Conversion fee calculations

#### 4.2 Accessibility Enhancements
**Features**:
- Screen reader announcements for currency changes
- High contrast currency symbols
- Keyboard navigation for currency selection
- ARIA labels for currency information

#### 4.3 Performance Optimizations
**Features**:
- Formatted value caching
- Lazy loading of currency data
- Batch formatting updates
- Memory-efficient symbol storage

## Implementation Timeline

### Week 1: Foundation
- [ ] Create CurrencyService class
- [ ] Update SettingsService
- [ ] Create currency configuration
- [ ] Write unit tests for core functionality

### Week 2: Core Updates
- [ ] Update financial-planning-helpers.js
- [ ] Replace chart utility formatting
- [ ] Update view files (batch 1: Overview, Investments)
- [ ] Test currency switching functionality

### Week 3: UI Integration
- [ ] Create CurrencySelector component
- [ ] Integrate with SettingsView
- [ ] Update remaining view files
- [ ] Implement real-time updates
- [ ] User acceptance testing

### Week 4: Polish & Testing
- [ ] Accessibility testing and fixes
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Documentation updates
- [ ] Final integration testing

## Technical Considerations

### Data Migration
- Existing user data with hardcoded currencies
- Settings migration strategy
- Backward compatibility requirements

### Performance
- Caching strategy for formatted values
- Memory usage optimization
- Rendering performance impact

### Internationalization
- RTL language support
- Different number formatting conventions
- Currency symbol positioning

### Testing Strategy
- Unit tests for CurrencyService
- Integration tests for UI components
- Visual regression tests for currency display
- Performance benchmarks

## Risk Assessment

### High Risk
- **Breaking Changes**: Existing currency formatting may break
- **Performance Impact**: Real-time formatting could affect performance
- **User Data**: Existing transactions with currency assumptions

### Medium Risk
- **Browser Compatibility**: Intl.NumberFormat variations
- **User Experience**: Learning curve for new settings
- **Testing Coverage**: Complex currency scenarios

### Low Risk
- **Future Enhancements**: Currency conversion features
- **Documentation**: API documentation updates
- **Code Maintenance**: Ongoing maintenance overhead

## Success Metrics

### Functional Metrics
- [ ] All currency displays use consistent formatting
- [ ] User can switch currency in real-time
- [ ] No currency mode works correctly
- [ ] Settings persist across sessions

### Performance Metrics
- [ ] Currency formatting doesn't impact rendering performance
- [ ] Memory usage remains stable
- [ ] Settings load time under 100ms

### User Experience Metrics
- [ ] Currency settings are intuitive and discoverable
- [ ] Formatting is clear and unambiguous
- [ ] Accessibility standards are met
- [ ] Cross-browser consistency achieved

## Future Enhancements

### Short Term (3-6 months)
- Multi-currency transaction support
- Currency conversion with live rates
- Advanced formatting options
- Currency trend analysis

### Long Term (6-12 months)
- Cryptocurrency support
- Custom currency creation
- Historical currency analysis
- International tax calculations

## Dependencies

### External Dependencies
- Exchange rate API (for future conversion features)
- Additional locale data (if needed)
- Accessibility testing tools

### Internal Dependencies
- SettingsService updates
- StorageService modifications
- Event system enhancements
- Testing framework updates

## Conclusion

This implementation plan provides a comprehensive approach to currency management that addresses current inconsistencies while laying the foundation for future enhancements. The phased approach minimizes risk while ensuring thorough testing and user feedback integration.

The key success factors will be:
1. Maintaining backward compatibility during transition
2. Ensuring consistent user experience across all touchpoints
3. Providing clear and intuitive currency settings
4. Thorough testing across different locales and browsers
5. Performance optimization to maintain app responsiveness

By following this plan, BlinkBudget will have a robust, flexible, and user-friendly currency management system that scales with future needs.
