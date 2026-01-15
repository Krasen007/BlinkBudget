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
import { PatternAnalyzer } from '../analytics/pattern-analyzer.js';
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
    gap: ${SPACING.LG};
    padding: ${SPACING.MD};
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
    container.appendChild(createTimeOfDaySection(timeOfDayAnalysis));

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
    border-left: 4px solid ${color.border};
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

    // Weekday column
    const weekdayColumn = createSpendingColumn(
        'Weekday',
        analysis.weekday.total,
        analysis.weekend.total,
        COLORS.PRIMARY,
        analysis.weekend.uniqueDays
    );
    chartContainer.appendChild(weekdayColumn);

    // Weekend column
    const weekendColumn = createSpendingColumn(
        'Weekend',
        analysis.weekend.total,
        analysis.weekend.total,
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

    // Visual bar
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
    width: 100%;
    height: 100px;
    background: ${COLORS.BACKGROUND};
    border-radius: ${SPACING.XS};
    position: relative;
    overflow: hidden;
  `;

    const bar = document.createElement('div');
    const heightPercent = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
    bar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: ${heightPercent}%;
    background: ${color};
    transition: height 0.3s ease;
  `;

    barContainer.appendChild(bar);

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
function createTimeOfDaySection(analysis) {
    const section = document.createElement('div');
    section.style.cssText = `
    background: ${COLORS.SURFACE};
    border-radius: ${SPACING.MD};
    padding: ${SPACING.MD};
  `;

    const title = document.createElement('h3');
    title.textContent = 'Time of Day Patterns';
    title.style.cssText = `
    margin: 0 0 ${SPACING.MD} 0;
    color: ${COLORS.TEXT_MAIN};
    font-size: ${FONT_SIZES.LG};
    font-weight: 600;
  `;
    section.appendChild(title);

    // Time period bars
    const periodsContainer = document.createElement('div');
    periodsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${SPACING.SM};
  `;

    const periodColors = {
        earlyMorning: COLORS.SECONDARY,
        morning: COLORS.PRIMARY,
        afternoon: COLORS.ACCENT,
        evening: COLORS.WARNING,
        night: COLORS.MUTED,
    };

    Object.entries(analysis.periods).forEach(([period, data]) => {
        if (data.total > 0) {
            const periodBar = createTimePeriodBar(period, data, periodColors[period]);
            periodsContainer.appendChild(periodBar);
        }
    });

    section.appendChild(periodsContainer);

    // Insights
    if (analysis.insights.length > 0) {
        const insightsEl = document.createElement('div');
        insightsEl.style.cssText = `
      margin-top: ${SPACING.MD};
      padding-top: ${SPACING.MD};
      border-top: 1px solid ${COLORS.BORDER};
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
 * Create time period bar
 */
function createTimePeriodBar(period, data, color) {
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: ${SPACING.SM};
  `;

    const label = document.createElement('div');
    label.textContent = data.label || period;
    label.style.cssText = `
    width: 120px;
    font-size: ${FONT_SIZES.SM};
    color: ${COLORS.TEXT_MAIN};
    flex-shrink: 0;
  `;

    const barWrapper = document.createElement('div');
    barWrapper.style.cssText = `
    flex: 1;
    height: 24px;
    background: ${COLORS.BACKGROUND};
    border-radius: ${SPACING.XS};
    position: relative;
    overflow: hidden;
  `;

    const maxAmount = Math.max(
        ...Object.values(data.hourlyBreakdown).map(h => h.amount)
    );
    const barWidth = maxAmount > 0 ? (data.total / maxAmount) * 100 : 0;

    const bar = document.createElement('div');
    bar.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${Math.max(barWidth, 2)}%;
    background: ${color};
    transition: width 0.3s ease;
  `;

    barWrapper.appendChild(bar);

    const amount = document.createElement('div');
    amount.textContent = formatCurrency(data.total);
    amount.style.cssText = `
    width: 80px;
    text-align: right;
    font-size: ${FONT_SIZES.SM};
    font-weight: 600;
    color: ${COLORS.TEXT_MAIN};
    flex-shrink: 0;
  `;

    barContainer.appendChild(label);
    barContainer.appendChild(barWrapper);
    barContainer.appendChild(amount);

    return barContainer;
}

