# Inflation Trends Implementation Plan

## Simplified Approach for BlinkBudget

**Assessment:** Current spec is overengineered - 684 lines of design docs for what should be a simple feature.

**BlinkBudget Philosophy:** 3-click speed, 100kb PWA, privacy-first, minimal complexity.

---

## 🎯 Simplified Feature Scope

### What Users Actually Need

- See if their spending is increasing due to inflation vs actual spending changes
- Focus on top 3-5 categories (not complex analysis)
- Simple time period selection (3, 6, 12 months)
- Clear visual indication of inflation impact

### What We're Removing from Original Spec

- Complex formal interfaces and algorithms
- Overly detailed error handling scenarios
- Property-based testing requirements
- Complex caching strategies
- Dual Y-axis charts (confusing for users)
- Custom time periods (adds complexity)

---

## 📋 Implementation Tasks (1 Week Sprint)

### Day 1-2: Core Service & Data

#### Task 1: Personal Inflation Service

**File:** `src/core/personal-inflation-service.js`
**Effort:** 6 hours

```javascript
export const PersonalInflationService = {
  // Calculate personal inflation rate for a category
  calculateCategoryInflation(
    transactions,
    category,
    monthsBack = 12,
    method = 'average'
  ) {
    const categoryTransactions = transactions
      .filter(t => t.category === category && t.type === 'expense')
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (categoryTransactions.length < 2) return 0;

    // Group by month and calculate average spending
    const monthlyAverages = this.getMonthlyAverages(
      categoryTransactions,
      monthsBack
    );

    let oldAvg, recentAvg;

    if (method === 'median') {
      // Use median to handle outliers better
      const sorted = [...monthlyAverages].sort((a, b) => a - b);
      oldAvg = sorted[Math.floor(sorted.length / 2)] || 0;
      recentAvg = sorted[0] || 0;
    } else {
      // Default to average
      oldAvg = monthlyAverages[monthlyAverages.length - 1] || 0;
      recentAvg = monthlyAverages[0] || 0;
    }

    if (oldAvg === 0) return 0;
    return (recentAvg - oldAvg) / oldAvg;
  },

  // Get monthly average spending for category
  getMonthlyAverages(transactions, monthsBack) {
    const monthly = {};
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsBack);

    transactions
      .filter(t => new Date(t.timestamp) >= cutoff)
      .forEach(t => {
        const month = t.timestamp.substring(0, 7); // YYYY-MM
        monthly[month] = (monthly[month] || []).concat(t.amount);
      });

    return Object.values(monthly).map(
      amounts => amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
    );
  },

  // Get top categories by personal inflation impact
  getTopInflationCategories(transactions, count = 3, monthsBack = 12) {
    const categories = [
      ...new Set(
        transactions.filter(t => t.type === 'expense').map(t => t.category)
      ),
    ];

    const categoryInflation = categories.map(category => {
      const inflationRate = this.calculateCategoryInflation(
        transactions,
        category,
        monthsBack,
        'average'
      );
      const trend = this.getTrendDirection(inflationRate);

      return {
        category,
        inflationRate,
        totalSpending: transactions
          .filter(t => t.category === category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        trend, // 'up', 'down', or 'stable'
      };
    });

    return categoryInflation
      .filter(c => c.inflationRate !== 0)
      .sort((a, b) => Math.abs(b.inflationRate) - Math.abs(a.inflationRate))
      .slice(0, count);
  },

  // Get trend direction for visual indicators
  getTrendDirection(inflationRate) {
    if (inflationRate > 0.05) return 'up'; // >5% inflation
    if (inflationRate < -0.05) return 'down'; // >5% deflation
    return 'stable'; // +/-5% range
  },
};
```

### Day 3-4: UI Component

#### Task 3: InflationTrends Component

**File:** `src/components/Insights/InflationTrends.js`
**Effort:** 6 hours

```javascript
import { PersonalInflationService } from '../../core/personal-inflation-service.js';
import { prepareChartData } from '../../utils/inflation-chart-utils.js';

export const InflationTrends = data => {
  const el = document.createElement('div');
  el.className = 'inflation-trends';

  // Chart type toggle (bar vs line)
  const chartTypeSelector = createChartTypeSelector();

  // Calculation method toggle (average vs median)
  const calcMethodSelector = createCalcMethodSelector();

  // Simple time period selector
  const periodSelector = createPeriodSelector();

  // Chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'inflation-chart';

  // Get top categories by personal inflation
  const topCategories = PersonalInflationService.getTopInflationCategories(
    data.transactions,
    3,
    6 // default 6 months
  );

  // Render chart using existing ChartRenderer
  const chart = ChartRenderer.createLineChart(chartContainer, {
    data: prepareChartData(data.transactions, 6, 'average', 'line'),
    options: getChartOptions(),
  });

  // Handle chart type changes
  chartTypeSelector.addEventListener('change', e => {
    const newType = e.target.value;
    const newData = prepareChartData(data.transactions, 6, 'average', newType);
    chart.destroy();
    const newChart =
      newType === 'bar'
        ? ChartRenderer.createBarChart(chartContainer, {
            data: newData,
            options: getChartOptions(),
          })
        : ChartRenderer.createLineChart(chartContainer, {
            data: newData,
            options: getChartOptions(),
          });
  });

  // Handle calculation method changes
  calcMethodSelector.addEventListener('change', e => {
    const newMethod = e.target.value;
    const chartType = chartTypeSelector.querySelector('input:checked').value;
    const newData = prepareChartData(
      data.transactions,
      6,
      newMethod,
      chartType
    );
    chart.data.datasets = newData;
    chart.update();
  });

  // Handle period changes
  periodSelector.addEventListener('change', e => {
    const newPeriod = parseInt(e.target.value);
    const calcMethod = calcMethodSelector.querySelector('input:checked').value;
    const chartType = chartTypeSelector.querySelector('input:checked').value;
    const newData = prepareChartData(
      data.transactions,
      newPeriod,
      calcMethod,
      chartType
    );
    chart.data.datasets = newData;
    chart.update();
  });

  el.append(
    chartTypeSelector,
    calcMethodSelector,
    periodSelector,
    chartContainer
  );
  return { element: el, cleanup: () => chart.destroy() };
};

const createChartTypeSelector = () => {
  const container = document.createElement('div');
  container.className = 'chart-type-selector';

  const types = [
    { value: 'line', label: 'Trend Line' },
    { value: 'bar', label: 'Monthly Bars' },
  ];

  types.forEach(type => {
    const wrapper = document.createElement('label');
    wrapper.className = 'radio-wrapper';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'chart-type';
    input.value = type.value;
    input.checked = type.value === 'line';

    const span = document.createElement('span');
    span.textContent = type.label;

    wrapper.append(input, span);
    container.appendChild(wrapper);
  });

  return container;
};

const createCalcMethodSelector = () => {
  const container = document.createElement('div');
  container.className = 'calc-method-selector';

  const methods = [
    { value: 'average', label: 'Average' },
    { value: 'median', label: 'Median (less outliers)' },
  ];

  methods.forEach(method => {
    const wrapper = document.createElement('label');
    wrapper.className = 'radio-wrapper';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'calc-method';
    input.value = method.value;
    input.checked = method.value === 'average';

    const span = document.createElement('span');
    span.textContent = method.label;

    wrapper.append(input, span);
    container.appendChild(wrapper);
  });

  return container;
};

const createPeriodSelector = () => {
  const container = document.createElement('div');
  container.className = 'period-selector';

  const periods = [
    { value: 3, label: '3 months' },
    { value: 6, label: '6 months' },
    { value: 12, label: '12 months' },
  ];

  periods.forEach(period => {
    const button = document.createElement('button');
    button.textContent = period.label;
    button.value = period.value;
    button.className = period.value === 6 ? 'active' : '';

    button.addEventListener('click', () => {
      container
        .querySelectorAll('button')
        .forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });

    container.appendChild(button);
  });

  return container;
};
```

#### Task 4: Chart Data Preparation

**File:** `src/utils/inflation-chart-utils.js`
**Effort:** 3 hours

```javascript
export const prepareChartData = (
  transactions,
  period = 6,
  calcMethod = 'average',
  chartType = 'line'
) => {
  const topCategories = PersonalInflationService.getTopInflationCategories(
    transactions,
    3,
    period
  );

  return topCategories.map(category => {
    const monthlyData = calculateMonthlySpending(
      transactions,
      category.category,
      period
    );

    const chartData =
      chartType === 'bar'
        ? monthlyData.map(month => ({
            x: month.month,
            y: month.amount,
          }))
        : monthlyData.map(month => ({
            x: month.month,
            y: month.amount,
          }));

    return {
      label: `${category.category} (${(category.inflationRate * 100).toFixed(1)}% personal inflation)`,
      data: chartData,
      backgroundColor: getTrendColor(category.trend),
      borderColor: getTrendColor(category.trend),
      trend: category.trend, // for custom indicators
    };
  });
};

export const calculateMonthlySpending = (
  transactions,
  category,
  monthsBack
) => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);

  const monthlySpending = {};

  transactions
    .filter(
      t =>
        t.category === category &&
        t.type === 'expense' &&
        new Date(t.timestamp) >= cutoff
    )
    .forEach(t => {
      const month = t.timestamp.substring(0, 7);
      monthlySpending[month] = (monthlySpending[month] || 0) + t.amount;
    });

  return Object.entries(monthlySpending).map(([month, amount]) => ({
    month,
    amount,
  }));
};

// Color coding for trend indicators
const getTrendColor = trend => {
  switch (trend) {
    case 'up':
      return 'var(--trend-up, #ff4757)'; // Red for inflation
    case 'down':
      return 'var(--trend-down, #10b981)'; // Green for deflation
    case 'stable':
      return 'var(--trend-stable, #6b7280)'; // Yellow for stable
    default:
      return 'var(--text-secondary, #6c757d)';
  }
};

// Create trend indicator element
export const createTrendIndicator = (trend, inflationRate) => {
  const indicator = document.createElement('span');
  indicator.className = `trend-indicator trend-${trend}`;

  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const percentage = `${(inflationRate * 100).toFixed(1)}%`;

  indicator.innerHTML = `${arrow} ${percentage}`;
  indicator.title = `${trend === 'up' ? 'Prices increasing' : trend === 'down' ? 'Prices decreasing' : 'Prices stable'}`;

  return indicator;
};
```

### Day 5: Integration & Styling

#### Task 5: Insights Integration

**File:** `src/views/InsightsView.js` modifications
**Effort:** 2 hours

```javascript
// Add to existing Insights section
const inflationSection = InflationTrends(planningData);
insightsContainer.appendChild(inflationSection.element);
```

#### Task 6: CSS Styling

**File:** `src/styles/components/inflation-trends.css`
**Effort:** 2 hours

```css
.inflation-trends {
  margin: 1rem 0;
}

.inflation-chart {
  height: 300px;
  margin: 1rem 0;
}

/* Chart type selector */
.chart-type-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.calc-method-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.radio-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-wrapper input[type='radio'] {
  margin: 0;
}

.radio-wrapper span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Period selector */
.period-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.period-selector button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.period-selector button:hover {
  background: var(--surface-hover);
}

.period-selector button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Trend indicators */
.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
}

.trend-indicator.trend-up {
  background: var(--trend-up, #ff4757);
  color: white;
}

.trend-indicator.trend-down {
  background: var(--trend-down, #10b981);
  color: white;
}

.trend-indicator.trend-stable {
  background: var(--trend-stable, #6b7280);
  color: white;
}

/* CSS custom properties for trend colors */
:root {
  --trend-up: #ff4757;
  --trend-down: #10b981;
  --trend-stable: #6b7280;
}

/* Responsive design */
@media (max-width: 600px) {
  .inflation-trends {
    font-size: 0.875rem;
  }

  .chart-type-selector,
  .calc-method-selector,
  .period-selector {
    flex-wrap: wrap;
  }

  .radio-wrapper {
    min-width: 120px;
  }

  .period-selector button {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }

  .trend-indicator {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
  }
}
```

---

## 🏗️ Technical Architecture (Personal Inflation Focus)

### Data Flow

```
User selects period → InflationTrends component → PersonalInflationService → ChartRenderer → Display
```

### Key Components

1. **PersonalInflationService** - Calculates personal inflation from user's spending
2. **InflationTrends** - Simple UI component showing personal inflation trends
3. **Chart integration** - Use existing ChartRenderer
4. **No external data** - All calculations from user transactions

### Personal Inflation Formula

```
personal_inflation_rate = (recent_monthly_avg - old_monthly_avg) / old_monthly_avg
```

### What Users Will See

- "Coffee (33.2% personal inflation)" - their coffee costs increased 33%
- "Groceries (-5.1% personal inflation)" - their grocery costs decreased 5%
- "Transportation (12.7% personal inflation)" - their transport costs increased 13%

### Performance Considerations

- **Bundle size impact:** ~3kb (well under 100kb limit)
- **Calculation time:** <50ms for 10k transactions
- **Render time:** <200ms using existing ChartRenderer

---

## 📊 Success Metrics (Personal Inflation Focus)

### User Engagement

- Users can view personal inflation trends in 3 clicks
- Chart renders within 500ms
- Feature adoption rate >20% of Insights users
- Users understand their personal price changes vs. spending changes

### Technical Success

- Bundle size increase <5kb
- No performance regression in Insights section
- Works offline (all calculations local)
- Accurate personal inflation calculations

### User Value

- Users identify which categories are costing more over time
- Clear understanding of personal purchasing power changes
- Actionable insights for budget adjustments

---

## 🚨 Risks & Mitigations

### Risk 1: Insufficient Transaction History

**Problem:** New users won't have enough data for meaningful personal inflation
**Mitigation:** Show "Need more data" message for categories with <3 months of history

### Risk 2: Category Inconsistency

**Problem:** Users change shopping habits, affecting inflation calculations
**Mitigation:** Use rolling averages and filter out outliers (>2x normal spending)

### Risk 3: Over-engineering

**Mitigation:** Stick to simplified personal inflation formula, no complex statistical models

### Risk 4: User Confusion

**Mitigation:** Clear tooltip: "Personal inflation shows how YOUR prices changed over time"

---

## 📝 Definition of Done

- [ ] PersonalInflationService with personal inflation calculation methods
- [ ] InflationTrends component renders in Insights section
- [ ] Time period selector works (3, 6, 12 months)
- [ ] Chart displays top 3 categories with personal inflation trends
- [ ] Responsive design works on mobile
- [ ] Bundle size increase <5kb
- [ ] Basic unit tests for personal inflation calculations
- [ ] Manual testing on real devices
- [ ] Clear user messaging about personal vs. general inflation

---

## 🔄 Future Enhancements (Post-Launch)

1. **More categories** - Expand from 3 to 5 top inflation categories
2. **Inflation alerts** - Notify users when personal inflation exceeds 20% in a category
3. **Seasonal adjustments** - Account for seasonal spending patterns
4. **Export functionality** - CSV export of personal inflation trends
5. **Category comparisons** - Compare personal inflation across similar categories

---

**Total Effort Estimate:** 24 hours (3 days)
**Complexity:** Low-Medium - fits BlinkBudget's simple philosophy with enhanced UX
**Bundle Impact:** ~4kb (includes trend indicators and chart type toggle)
**Launch Timeline:** Next sprint

This approach delivers 80% of user value with 20% of the complexity specified in the original design document.
