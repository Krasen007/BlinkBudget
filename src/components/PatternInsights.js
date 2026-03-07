/**
 * PatternInsights Component
 *
 * Visualizes spending patterns including:
 * - Weekday vs weekend spending comparison
 * - Time-of-day spending patterns
 * - Frequency analysis for categories
 * - Trend alerts and warnings
 *
 * Requirements: Task 2.2 Spending Pattern Analytics
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { PatternAnalyzer } from '../core/analytics/pattern-analyzer.js';
import { formatDateForDisplay } from '../utils/date-utils.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';

export function PatternInsights(
  transactions,
  timePeriod,
  previousPeriod = null
) {
  // Analyze patterns
  const weekdayWeekendAnalysis = PatternAnalyzer.analyzeWeekdayVsWeekend(
    transactions,
    timePeriod
  );
  const timeOfDayAnalysis = PatternAnalyzer.analyzeTimeOfDayPatterns(
    transactions,
    timePeriod
  );
  const trendAlerts = PatternAnalyzer.generateTrendAlerts(
    transactions,
    timePeriod,
    previousPeriod
  );

  // Create main container
  const container = document.createElement('div');
  container.className = 'pattern-insights';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${SPACING.MD};
    padding: ${SPACING.MD};
    background: ${COLORS.SURFACE};
    border-radius: var(--radius-lg);
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${SPACING.MD};
  `;

  const title = document.createElement('h2');
  title.textContent = 'Spending Patterns';
  title.style.cssText = `
    margin: 0;
    color: ${COLORS.TEXT_MAIN};
    font-size: ${FONT_SIZES.XL};
    font-weight: bold;
  `;

  const timeRange = document.createElement('span');
  timeRange.textContent = `${formatDateForDisplay(timePeriod.startDate)} - ${formatDateForDisplay(timePeriod.endDate)}`;
  timeRange.style.cssText = `
    color: ${COLORS.TEXT_MUTED};
    font-size: ${FONT_SIZES.SM};
  `;

  header.appendChild(title);
  header.appendChild(timeRange);
  container.appendChild(header);

  // Trend Alerts Section
  if (trendAlerts.warnings.length > 0 || trendAlerts.insights.length > 0) {
    container.appendChild(createAlertsSection(trendAlerts));
  }

  // Weekday vs Weekend Section
  container.appendChild(createWeekdayWeekendSection(weekdayWeekendAnalysis));

  // Time of Day Section
  container.appendChild(createTimeOfDaySection(timeOfDayAnalysis, transactions));

  return container;
}

/**
 * Create alerts and warnings section
 */
function createAlertsSection(alerts) {
  const section = document.createElement('div');
  section.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${SPACING.SM};
  `;

  const title = document.createElement('h3');
  title.textContent = 'Alerts & Insights';
  title.style.cssText = `
    margin: 0;
    color: ${COLORS.TEXT_MAIN};
    font-size: ${FONT_SIZES.LG};
    font-weight: 600;
  `;
  section.appendChild(title);

  // Warnings
  alerts.warnings.forEach(alert => {
    const alertEl = createAlertElement(alert, 'warning');
    section.appendChild(alertEl);
  });

  // Insights
  alerts.insights.forEach(insight => {
    const alertEl = createAlertElement(insight, 'insight');
    section.appendChild(alertEl);
  });

  // Trends
  alerts.trends.forEach(trend => {
    const alertEl = createAlertElement(trend, 'trend');
    section.appendChild(alertEl);
  });

  return section;
}

/**
 * Create individual alert element
 */
function createAlertElement(alert, type) {
  const alertEl = document.createElement('div');

  const colors = {
    warning: {
      bg: COLORS.WARNING_BG,
      border: COLORS.WARNING,
      text: COLORS.WARNING_TEXT,
    },
    insight: {
      bg: COLORS.SUCCESS_BG,
      border: COLORS.SUCCESS,
      text: COLORS.SUCCESS_TEXT,
    },
    trend: { bg: COLORS.INFO_BG, border: COLORS.INFO, text: COLORS.INFO_TEXT },
  };

  const color = colors[type] || colors.insight;

  alertEl.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: ${SPACING.SM};
    padding: ${SPACING.SM};
    background: ${color.bg};
    border-left: none;
    border-radius: ${SPACING.XS};
    margin-bottom: ${SPACING.XS};
  `;

  // Icon
  const icon = document.createElement('div');
  icon.textContent =
    type === 'warning' ? '⚠️' : type === 'insight' ? '✅' : '📊';
  icon.style.cssText = `
    font-size: ${FONT_SIZES.LG};
    flex-shrink: 0;
  `;

  // Content
  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
  `;

  const alertTitle = document.createElement('div');
  alertTitle.textContent = alert.title;
  alertTitle.style.cssText = `
    font-weight: 600;
    color: ${color.text};
    margin-bottom: ${SPACING.XS};
  `;

  const message = document.createElement('div');
  message.textContent = alert.message;
  message.style.cssText = `
    font-size: ${FONT_SIZES.SM};
    color: ${COLORS.TEXT_MAIN};
    margin-bottom: ${SPACING.XS};
  `;

  if (alert.recommendation) {
    const recommendation = document.createElement('div');
    recommendation.textContent = `💡 ${alert.recommendation}`;
    recommendation.style.cssText = `
      font-size: ${FONT_SIZES.SM};
      color: ${COLORS.TEXT_MUTED};
      font-style: italic;
    `;
    content.appendChild(alertTitle);
    content.appendChild(message);
    content.appendChild(recommendation);
  } else {
    content.appendChild(alertTitle);
    content.appendChild(message);
  }

  alertEl.appendChild(icon);
  alertEl.appendChild(content);

  return alertEl;
}

/**
 * Create weekday vs weekend section
 */
function createWeekdayWeekendSection(analysis) {
  const section = document.createElement('div');
  section.style.cssText = `
    background: ${COLORS.SURFACE};
    border-radius: ${SPACING.MD};
    padding: ${SPACING.MD};
    border: none;
  `;

  const title = document.createElement('h3');
  title.textContent = 'Weekday vs Weekend Spending';
  title.style.cssText = `
    margin: 0 0 ${SPACING.MD} 0;
    color: ${COLORS.TEXT_MAIN};
    font-size: ${FONT_SIZES.LG};
    font-weight: 600;
  `;
  section.appendChild(title);

  // Comparison chart
  const chartContainer = document.createElement('div');
  chartContainer.style.cssText = `
    display: flex;
    gap: ${SPACING.LG};
    margin-bottom: ${SPACING.MD};
  `;

  // Calculate max amount for scaling
  const maxAmount = Math.max(analysis.weekday.total, analysis.weekend.total);

  // Weekday column
  const weekdayColumn = createSpendingColumn(
    'Weekday',
    analysis.weekday.total,
    maxAmount,
    COLORS.PRIMARY,
    analysis.weekday.uniqueDays
  );
  chartContainer.appendChild(weekdayColumn);

  // Weekend column
  const weekendColumn = createSpendingColumn(
    'Weekend',
    analysis.weekend.total,
    maxAmount,
    COLORS.ACCENT,
    analysis.weekend.uniqueDays
  );
  chartContainer.appendChild(weekendColumn);

  section.appendChild(chartContainer);

  // Insights
  const insightsEl = document.createElement('div');
  insightsEl.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${SPACING.XS};
  `;

  analysis.comparison.insights.forEach(insight => {
    const insightEl = document.createElement('div');
    insightEl.textContent = `• ${insight}`;
    insightEl.style.cssText = `
      font-size: ${FONT_SIZES.SM};
      color: ${COLORS.TEXT_MUTED};
    `;
    insightsEl.appendChild(insightEl);
  });

  section.appendChild(insightsEl);

  return section;
}

/**
 * Create spending column for weekday/weekend comparison
 */
function createSpendingColumn(label, amount, maxAmount, color, uniqueDays) {
  const column = document.createElement('div');
  column.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${SPACING.SM};
  `;

  const labelEl = document.createElement('div');
  labelEl.textContent = label;
  labelEl.style.cssText = `
    font-weight: 600;
    color: ${COLORS.TEXT_MAIN};
  `;

  // Visual bar with percentage label
  const barContainer = document.createElement('div');
  barContainer.style.cssText = `
    width: 100%;
    height: 100px;
    background: ${COLORS.BACKGROUND};
    border-radius: ${SPACING.XS};
    position: relative;
    overflow: hidden;
    border: 1px solid ${COLORS.BORDER};
    display: flex;
    align-items: flex-end;
    justify-content: center;
  `;

  const bar = document.createElement('div');
  const heightPercent = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  const percentageText = maxAmount > 0 ? Math.round(heightPercent) : 0;
  
  bar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: ${heightPercent}%;
    background: ${color};
    transition: height 0.3s ease;
  `;

  // Add percentage label on the bar
  const percentageLabel = document.createElement('div');
  percentageLabel.textContent = `${percentageText}%`;
  percentageLabel.style.cssText = `
    position: absolute;
    bottom: ${Math.max(heightPercent + 5, 5)}%;
    left: 50%;
    transform: translateX(-50%);
    font-size: ${FONT_SIZES.XS};
    font-weight: 600;
    color: ${COLORS.TEXT_MUTED};
    background: ${COLORS.SURFACE};
    padding: 2px 6px;
    border-radius: ${SPACING.XS};
    white-space: nowrap;
  `;

  barContainer.appendChild(bar);
  barContainer.appendChild(percentageLabel);

  const amountEl = document.createElement('div');
  amountEl.textContent = formatCurrency(amount);
  amountEl.style.cssText = `
    font-size: ${FONT_SIZES.LG};
    font-weight: bold;
    color: ${COLORS.TEXT_MAIN};
  `;

  const daysEl = document.createElement('div');
  daysEl.textContent = `${uniqueDays} days`;
  daysEl.style.cssText = `
    font-size: ${FONT_SIZES.SM};
    color: ${COLORS.TEXT_MUTED};
  `;

  column.appendChild(labelEl);
  column.appendChild(barContainer);
  column.appendChild(amountEl);
  column.appendChild(daysEl);

  return column;
}

/**
 * Create time of day section
 */
function createTimeOfDaySection(analysis, transactions) {
  const section = document.createElement('div');
  section.style.cssText = `
    background: ${COLORS.SURFACE};
    border-radius: ${SPACING.MD};
    padding: ${SPACING.MD};
    border: none;
  `;

  const title = document.createElement('h3');
  title.textContent = 'Time of Day Patterns';
  title.style.cssText = `
    margin: 0 0 ${SPACING.SM} 0;
    color: ${COLORS.TEXT_MAIN};
    font-size: ${FONT_SIZES.LG};
    font-weight: 600;
  `;
  section.appendChild(title);

  const subtitle = document.createElement('div');
  subtitle.textContent = 'Daily breakdown of spending by time period';
  subtitle.style.cssText = `
    font-size: ${FONT_SIZES.SM};
    color: ${COLORS.TEXT_MUTED};
    margin-bottom: ${SPACING.MD};
  `;
  section.appendChild(subtitle);

  // Create daily breakdown
  const dailyContainer = document.createElement('div');
  dailyContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${SPACING.SM};
    max-height: 400px;
    overflow-y: auto;
  `;

  const periodColors = {
    earlyMorning: COLORS.SECONDARY,
    morning: COLORS.PRIMARY,
    afternoon: COLORS.ACCENT,
    evening: COLORS.WARNING,
    night: COLORS.MUTED,
  };

  // Get all transactions and group by day
  const dailyData = groupTransactionsByDay(transactions || []);
  
  // Filter to show only current month days
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthDays = Object.keys(dailyData).filter(dayKey => {
    const dayDate = new Date(dayKey);
    return dayDate.getMonth() === currentMonth && dayDate.getFullYear() === currentYear;
  });
  
  if (currentMonthDays.length === 0) {
    const noActivityMsg = document.createElement('div');
    noActivityMsg.textContent = 'No spending activity detected this month';
    noActivityMsg.style.cssText = `
      text-align: center;
      color: ${COLORS.TEXT_MUTED};
      font-size: ${FONT_SIZES.SM};
      padding: ${SPACING.MD};
      font-style: italic;
    `;
    dailyContainer.appendChild(noActivityMsg);
  } else {
    // Sort days chronologically
    const sortedDays = currentMonthDays.sort();
    
    sortedDays.forEach(day => {
      const dayChart = createDailyTimeChart(day, dailyData[day], periodColors);
      dailyContainer.appendChild(dayChart);
    });
  }

  section.appendChild(dailyContainer);

  // Insights
  if (analysis.insights.length > 0) {
    const insightsEl = document.createElement('div');
    insightsEl.style.cssText = `
      margin-top: ${SPACING.MD};
      padding-top: ${SPACING.MD};
      border-top: none;
    `;

    const insightsTitle = document.createElement('div');
    insightsTitle.textContent = 'Key Insights:';
    insightsTitle.style.cssText = `
      font-weight: 600;
      color: ${COLORS.TEXT_MAIN};
      margin-bottom: ${SPACING.XS};
    `;
    insightsEl.appendChild(insightsTitle);

    analysis.insights.forEach(insight => {
      const insightEl = document.createElement('div');
      insightEl.textContent = `• ${insight}`;
      insightEl.style.cssText = `
        font-size: ${FONT_SIZES.SM};
        color: ${COLORS.TEXT_MUTED};
      `;
      insightsEl.appendChild(insightEl);
    });

    section.appendChild(insightsEl);
  }

  return section;
}

/**
 * Group transactions by day and time period
 */
function groupTransactionsByDay(transactions) {
  const dailyData = {};
  
  transactions.forEach(transaction => {
    if (transaction.type === 'transfer') return; // Skip transfers
    
    const date = new Date(transaction.timestamp);
    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = date.getUTCHours(); // Use UTC hours to avoid timezone issues
    
    // Determine time period
    let period;
    if (hour >= 5 && hour < 9) period = 'earlyMorning';
    else if (hour >= 9 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 17) period = 'afternoon';
    else if (hour >= 17 && hour < 21) period = 'evening';
    else period = 'night';
    
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = {
        date: date,
        periods: {
          earlyMorning: { total: 0, count: 0 },
          morning: { total: 0, count: 0 },
          afternoon: { total: 0, count: 0 },
          evening: { total: 0, count: 0 },
          night: { total: 0, count: 0 }
        }
      };
    }
    
    dailyData[dayKey].periods[period].total += Math.abs(transaction.amount);
    dailyData[dayKey].periods[period].count += 1;
  });
  
  return dailyData;
}

/**
 * Create daily time chart with colored bars
 */
function createDailyTimeChart(dayKey, dayData, periodColors) {
  const dayContainer = document.createElement('div');
  dayContainer.style.cssText = `
    border: 1px solid ${COLORS.BORDER};
    border-radius: ${SPACING.SM};
    padding: ${SPACING.SM};
    background: ${COLORS.BACKGROUND};
  `;
  
  // Day header
  const date = new Date(dayKey);
  const dayHeader = document.createElement('div');
  dayHeader.textContent = formatDateForDisplay(date);
  dayHeader.style.cssText = `
    font-weight: 600;
    color: ${COLORS.TEXT_MAIN};
    margin-bottom: ${SPACING.SM};
    font-size: ${FONT_SIZES.SM};
  `;
  dayContainer.appendChild(dayHeader);
  
  // Time periods container
  const periodsContainer = document.createElement('div');
  periodsContainer.style.cssText = `
    display: flex;
    gap: ${SPACING.XS};
    height: 40px;
    align-items: flex-end;
  `;
  
  // Calculate max amount for scaling
  const maxAmount = Math.max(...Object.values(dayData.periods).map(p => p.total));
  
  // Create bars for each period
  Object.entries(dayData.periods).forEach(([period, data]) => {
    if (data.total > 0) {
      const bar = document.createElement('div');
      const heightPercent = maxAmount > 0 ? (data.total / maxAmount) * 100 : 0;
      
      bar.style.cssText = `
        height: ${Math.max(heightPercent, 5)}%;
        width: 20px;
        background: ${periodColors[period]};
        border-radius: 2px;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
      `;
      
      // Tooltip on hover
      bar.title = `${period}: ${formatCurrency(data.total)} (${data.count} transactions)`;
      
      bar.addEventListener('mouseenter', () => {
        bar.style.transform = 'scaleY(1.1)';
      });
      
      bar.addEventListener('mouseleave', () => {
        bar.style.transform = 'scaleY(1)';
      });
      
      periodsContainer.appendChild(bar);
    }
  });
  
  dayContainer.appendChild(periodsContainer);
  
  // Legend
  const legend = document.createElement('div');
  legend.style.cssText = `
    display: flex;
    gap: ${SPACING.XS};
    margin-top: ${SPACING.XS};
    flex-wrap: wrap;
  `;
  
  Object.entries(dayData.periods).forEach(([period, data]) => {
    if (data.total > 0) {
      const legendItem = document.createElement('div');
      legendItem.style.cssText = `
        display: flex;
        align-items: center;
        gap: 2px;
        font-size: ${FONT_SIZES.XS};
        color: ${COLORS.TEXT_MUTED};
      `;
      
      const colorDot = document.createElement('div');
      colorDot.style.cssText = `
        width: 8px;
        height: 8px;
        background: ${periodColors[period]};
        border-radius: 50%;
      `;
      
      const label = document.createElement('span');
      label.textContent = period.slice(0, 3); // First 3 letters
      
      legendItem.appendChild(colorDot);
      legendItem.appendChild(label);
      legend.appendChild(legendItem);
    }
  });
  
  dayContainer.appendChild(legend);
  
  return dayContainer;
}

