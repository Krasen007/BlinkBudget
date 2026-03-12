/**
 * BaselineAnalysis Component
 *
 * Displays floor vs average spending analysis with insights and trends.
 * Helps users understand their spending patterns and variability.
 */

export const BaselineAnalysis = ({
  category = null,
  period = 'monthly',
  accountId = null,
  showInsights = true,
  compact = false,
}) => {
  const container = document.createElement('div');
  container.className = `baseline-analysis ${compact ? 'compact' : 'full'}`;

  // Load baseline data
  const loadBaselineData = async () => {
    try {
      const { BaselineService } = await import('../core/baseline-service.js');
      const baseline = category
        ? BaselineService.calculateBaseline({ category, period, accountId })
        : BaselineService.getOverallBaseline({ period, accountId });

      renderBaseline(baseline);
    } catch (error) {
      console.error('[BaselineAnalysis] Failed to load data:', error);
      renderError();
    }
  };

  const renderBaseline = baseline => {
    container.innerHTML = '';

    if (baseline.dataPoints === 0) {
      renderNoData();
      return;
    }

    // Header
    const header = document.createElement('div');
    header.className = 'baseline-header';
    
    const h3 = document.createElement('h3');
    h3.className = 'baseline-title';
    h3.textContent = `${category ? `${category} Spending` : 'Overall Spending'} Baseline`;
    
    const periodDiv = document.createElement('div');
    periodDiv.className = 'baseline-period';
    periodDiv.textContent = `Per ${period}`;
    
    header.appendChild(h3);
    header.appendChild(periodDiv);
    container.appendChild(header);

    // Metrics Grid
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'baseline-metrics';

    // Average
    const avgMetric = createMetric({
      label: 'Average',
      value: `$${baseline.average.toFixed(2)}`,
      type: 'primary',
      trend: 'neutral',
    });

    // Floor
    const floorMetric = createMetric({
      label: 'Floor (Min)',
      value: `$${baseline.floor.toFixed(2)}`,
      type:
        floorToAverageRatio(baseline.floor, baseline.average) < 70
          ? 'positive'
          : 'neutral',
      trend: 'down',
    });

    // Ceiling
    const ceilingMetric = createMetric({
      label: 'Ceiling (Max)',
      value: `$${baseline.ceiling.toFixed(2)}`,
      type: 'warning',
      trend: 'up',
    });

    // Variability
    const variabilityMetric = createMetric({
      label: 'Variability',
      value: `${baseline.variability.toFixed(1)}%`,
      type: getVariabilityType(baseline.variability),
      trend: 'neutral',
    });

    metricsGrid.appendChild(avgMetric);
    metricsGrid.appendChild(floorMetric);
    metricsGrid.appendChild(ceilingMetric);
    metricsGrid.appendChild(variabilityMetric);

    container.appendChild(metricsGrid);

    // Consistency Indicator
    const consistencyIndicator = createConsistencyIndicator(
      baseline.consistency
    );
    container.appendChild(consistencyIndicator);

    // Period Chart (if not compact)
    if (!compact && baseline.periods.length > 1) {
      const periodChart = createPeriodChart(baseline);
      container.appendChild(periodChart);
    }

    // Insights (if enabled)
    if (showInsights && baseline.insights.length > 0) {
      const insightsSection = createInsightsSection(baseline.insights);
      container.appendChild(insightsSection);
    }
  };

  const createMetric = ({ label, value, type, trend }) => {
    const metric = document.createElement('div');
    metric.className = `baseline-metric metric-${type}`;

    metric.innerHTML = `
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
      <div class="metric-trend trend-${trend}"></div>
    `;

    return metric;
  };

  const createConsistencyIndicator = consistency => {
    const indicator = document.createElement('div');
    indicator.className = 'consistency-indicator';

    const consistencyConfig = {
      very_consistent: {
        label: 'Very Consistent',
        color: 'success',
        icon: '✓',
      },
      consistent: { label: 'Consistent', color: 'positive', icon: '✓' },
      variable: { label: 'Variable', color: 'warning', icon: '~' },
      very_variable: { label: 'Very Variable', color: 'error', icon: '!' },
    };

    const config = consistencyConfig[consistency] || consistencyConfig.variable;

    indicator.innerHTML = `
      <div class="consistency-icon consistency-${config.color}">${config.icon}</div>
      <div class="consistency-label">${config.label}</div>
      <div class="consistency-description">Spending pattern consistency</div>
    `;

    return indicator;
  };

  const createPeriodChart = baseline => {
    const chartContainer = document.createElement('div');
    chartContainer.className = 'period-chart';

    const chartTitle = document.createElement('h4');
    chartTitle.textContent = 'Spending History';
    chartTitle.className = 'chart-title';
    chartContainer.appendChild(chartTitle);

    const chart = document.createElement('div');
    chart.className = 'chart-bars';

    // Create bar chart
    const maxValue = Math.max(...baseline.periods.map(p => p.total));

    baseline.periods.forEach(period => {
      const barContainer = document.createElement('div');
      barContainer.className = 'bar-container';

      const bar = document.createElement('div');
      bar.className = 'bar';
      const height = maxValue > 0 ? (period.total / maxValue) * 100 : 0;
      bar.style.height = `${height}%`;

      // Color based on relation to average
      if (period.total <= baseline.floor) {
        bar.classList.add('bar-floor');
      } else if (period.total >= baseline.ceiling) {
        bar.classList.add('bar-ceiling');
      } else {
        bar.classList.add('bar-average');
      }

      const label = document.createElement('div');
      label.className = 'bar-label';
      label.textContent = formatPeriodLabel(period.period, baseline.period);

      const value = document.createElement('div');
      value.className = 'bar-value';
      value.textContent = `$${period.total.toFixed(0)}`;

      barContainer.appendChild(bar);
      barContainer.appendChild(label);
      barContainer.appendChild(value);
      chart.appendChild(barContainer);
    });

    chartContainer.appendChild(chart);

    // Add average line
    const avgLine = document.createElement('div');
    avgLine.className = 'average-line';
    avgLine.style.bottom = `${(baseline.average / maxValue) * 100}%`;
    avgLine.title = `Average: $${baseline.average.toFixed(2)}`;
    chart.appendChild(avgLine);

    return chartContainer;
  };

  const createInsightsSection = insights => {
    const section = document.createElement('div');
    section.className = 'insights-section';

    const title = document.createElement('h4');
    title.textContent = 'Insights';
    title.className = 'insights-title';
    section.appendChild(title);

    const insightsList = document.createElement('div');
    insightsList.className = 'insights-list';

    insights.forEach(insight => {
      const insightCard = document.createElement('div');
      insightCard.className = `insight-card insight-${insight.type}`;

      insightCard.innerHTML = `
        <div class="insight-header">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-priority priority-${insight.priority}"></div>
        </div>
        <div class="insight-description">${insight.description}</div>
      `;

      insightsList.appendChild(insightCard);
    });

    section.appendChild(insightsList);
    return section;
  };

  const renderNoData = () => {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'baseline-no-data';
    
    const icon = document.createElement('div');
    icon.className = 'no-data-icon';
    icon.textContent = '📊';
    
    const title = document.createElement('div');
    title.className = 'no-data-title';
    title.textContent = 'No Data Available';
    
    const desc = document.createElement('div');
    desc.className = 'no-data-description';
    desc.textContent = category ? `No expense data found for ${category}` : 'No expense data available';
    
    wrapper.appendChild(icon);
    wrapper.appendChild(title);
    wrapper.appendChild(desc);
    container.appendChild(wrapper);
  };

  const renderError = () => {
    container.innerHTML = `
      <div class="baseline-error">
        <div class="error-icon">⚠️</div>
        <div class="error-title">Unable to Load Data</div>
        <div class="error-description">Please try again later</div>
      </div>
    `;
  };

  // Helper functions
  const floorToAverageRatio = (floor, average) => {
    return average > 0 ? (floor / average) * 100 : 0;
  };

  const getVariabilityType = variability => {
    if (variability < 15) return 'success';
    if (variability < 25) return 'positive';
    if (variability < 40) return 'warning';
    return 'error';
  };

  const formatPeriodLabel = (period, periodType) => {
    let dateStr;
    if (periodType === 'weekly') {
      dateStr = `${period}T00:00:00`;
    } else if (periodType === 'monthly') {
      dateStr = `${period}-01T00:00:00`;
    } else {
      dateStr = `${period}-01-01T00:00:00`;
    }
    const date = new Date(dateStr);

    switch (periodType) {
      case 'weekly':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        });
      case 'yearly':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        });
    }
  };

  // Load data initially
  loadBaselineData();

  return container;
};
