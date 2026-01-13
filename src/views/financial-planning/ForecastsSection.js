/**
 * Forecasts Section - Income/Expense Predictions
 *
 * Extracted from FinancialPlanningView.js for better maintainability.
 * Displays financial forecasts with charts and detailed tables.
 *
 * Responsibilities:
 * - Income/expense forecasting display
 * - Forecast summary cards
 * - Chart integration (forecast comparison, projected balance)
 * - Detailed forecast table generation
 */

import { COLORS, SPACING } from '../../utils/constants.js';
import { ForecastCard } from '../../components/financial-planning/ForecastCard.js';
import {
  createProjectedBalanceChart,
  createForecastComparisonChart,
} from '../../utils/financial-planning-charts.js';
import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
} from '../../utils/financial-planning-helpers.js';

/**
 * Create a detailed forecast table
 */
function createForecastTable(incomeForecasts, expenseForecasts) {
  const container = document.createElement('div');
  container.className = 'forecast-table-container';
  container.style.background = COLORS.SURFACE;
  container.style.border = `1px solid ${COLORS.BORDER}`;
  container.style.borderRadius = 'var(--radius-lg)';
  container.style.padding = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Monthly Forecast Breakdown';
  title.style.margin = '0';
  title.style.marginBottom = SPACING.MD;
  title.style.fontSize = '1.125rem';
  title.style.fontWeight = '600';
  title.style.color = COLORS.TEXT_MAIN;

  const table = document.createElement('div');
  table.className = 'forecast-table';
  table.style.display = 'grid';
  table.style.gridTemplateColumns = '1fr auto auto auto auto';
  table.style.gap = `${SPACING.SM} ${SPACING.MD}`;
  table.style.fontSize = '0.875rem';

  // Header row
  const headers = ['Month', 'Income', 'Expenses', 'Net', 'Confidence'];
  headers.forEach(header => {
    const headerCell = document.createElement('div');
    headerCell.textContent = header;
    headerCell.style.fontWeight = '600';
    headerCell.style.color = COLORS.TEXT_MUTED;
    headerCell.style.paddingBottom = SPACING.SM;
    headerCell.style.borderBottom = `1px solid ${COLORS.BORDER}`;
    table.appendChild(headerCell);
  });

  // Data rows
  const maxRows = Math.max(incomeForecasts.length, expenseForecasts.length);
  for (let i = 0; i < maxRows; i++) {
    const income = incomeForecasts[i] || {
      predictedAmount: 0,
      confidence: 0,
    };
    const expense = expenseForecasts[i] || {
      predictedAmount: 0,
      confidence: 0,
    };
    const net = income.predictedAmount - expense.predictedAmount;
    const confidence = Math.min(income.confidence, expense.confidence);

    // Month
    const monthCell = document.createElement('div');
    monthCell.textContent = income.period
      ? income.period.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : `Month ${i + 1}`;
    monthCell.style.paddingTop = SPACING.SM;
    table.appendChild(monthCell);

    // Income
    const incomeCell = document.createElement('div');
    incomeCell.textContent = `€${income.predictedAmount.toFixed(2)}`;
    incomeCell.style.color = COLORS.SUCCESS;
    incomeCell.style.fontWeight = '500';
    incomeCell.style.paddingTop = SPACING.SM;
    incomeCell.style.textAlign = 'right';
    table.appendChild(incomeCell);

    // Expenses
    const expenseCell = document.createElement('div');
    expenseCell.textContent = `€${expense.predictedAmount.toFixed(2)}`;
    expenseCell.style.color = COLORS.ERROR;
    expenseCell.style.fontWeight = '500';
    expenseCell.style.paddingTop = SPACING.SM;
    expenseCell.style.textAlign = 'right';
    table.appendChild(expenseCell);

    // Net
    const netCell = document.createElement('div');
    netCell.textContent = `€${net.toFixed(2)}`;
    netCell.style.color = net >= 0 ? COLORS.SUCCESS : COLORS.ERROR;
    netCell.style.fontWeight = '600';
    netCell.style.paddingTop = SPACING.SM;
    netCell.style.textAlign = 'right';
    table.appendChild(netCell);

    // Confidence
    const confidenceCell = document.createElement('div');
    confidenceCell.textContent = `${(confidence * 100).toFixed(0)}%`;
    confidenceCell.style.color =
      confidence > 0.7
        ? COLORS.SUCCESS
        : confidence > 0.4
          ? COLORS.WARNING
          : COLORS.ERROR;
    confidenceCell.style.paddingTop = SPACING.SM;
    confidenceCell.style.textAlign = 'right';
    table.appendChild(confidenceCell);
  }

  container.appendChild(title);
  container.appendChild(table);

  return container;
}

/**
 * Forecasts Section Component
 * @param {Object} planningData - Financial planning data including transactions
 * @param {Object} forecastEngine - Forecast engine service instance
 * @param {Object} balancePredictor - Balance predictor service instance
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @returns {HTMLElement} DOM element containing forecasts section content
 */
export const ForecastsSection = (
  planningData,
  forecastEngine,
  balancePredictor,
  chartRenderer,
  activeCharts
) => {
  const section = createSectionContainer(
    'forecasts',
    'Financial Forecasts',
    '🔮'
  );

  section.appendChild(
    createUsageNote(
      'Forecasts use your past 3+ months of transactions to predict income and expenses. Adjust assumptions in the scenario tab to see how changes affect future balances.'
    )
  );

  if (
    !planningData ||
    !planningData.transactions ||
    planningData.transactions.length < 3
  ) {
    const placeholder = createPlaceholder(
      'Insufficient Data for Forecasting',
      'Add at least 3 months of transaction history to generate accurate financial forecasts.',
      '📊'
    );
    section.appendChild(placeholder);
    return section;
  }

  try {
    // Generate forecasts
    const incomeForecasts = forecastEngine.generateIncomeForecasts(
      planningData.transactions,
      6
    );
    const expenseForecasts = forecastEngine.generateExpenseForecasts(
      planningData.transactions,
      6
    );

    // Create forecast summary cards
    const summaryGrid = document.createElement('div');
    summaryGrid.className = 'forecast-summary-grid';
    summaryGrid.style.display = 'grid';
    summaryGrid.style.gridTemplateColumns =
      'repeat(auto-fit, minmax(250px, 1fr))';
    summaryGrid.style.gap = SPACING.MD;
    summaryGrid.style.marginBottom = SPACING.XL;

    // Calculate totals for next 6 months
    const totalIncomeForecasted = incomeForecasts.reduce(
      (sum, f) => sum + f.predictedAmount,
      0
    );
    const totalExpensesForecasted = expenseForecasts.reduce(
      (sum, f) => sum + f.predictedAmount,
      0
    );
    const netForecast = totalIncomeForecasted - totalExpensesForecasted;
    const avgConfidence =
      (incomeForecasts.reduce((sum, f) => sum + f.confidence, 0) +
        expenseForecasts.reduce((sum, f) => sum + f.confidence, 0)) /
      (incomeForecasts.length + expenseForecasts.length);

    const summaryCards = [
      {
        label: 'Forecasted Income (6mo)',
        value: `€${totalIncomeForecasted.toFixed(2)}`,
        color: COLORS.SUCCESS,
        icon: '📈',
        subtitle: `Avg: €${(totalIncomeForecasted / 6).toFixed(2)}/month`,
      },
      {
        label: 'Forecasted Expenses (6mo)',
        value: `€${totalExpensesForecasted.toFixed(2)}`,
        color: COLORS.ERROR,
        icon: '📉',
        subtitle: `Avg: €${(totalExpensesForecasted / 6).toFixed(2)}/month`,
      },
      {
        label: 'Net Forecast (6mo)',
        value: `€${netForecast.toFixed(2)}`,
        color: netForecast >= 0 ? COLORS.SUCCESS : COLORS.ERROR,
        icon: netForecast >= 0 ? '💰' : '⚠️',
        subtitle: `Avg: €${(netForecast / 6).toFixed(2)}/month`,
      },
      {
        label: 'Forecast Confidence',
        value: `${(avgConfidence * 100).toFixed(0)}%`,
        color:
          avgConfidence > 0.7
            ? COLORS.SUCCESS
            : avgConfidence > 0.4
              ? COLORS.WARNING
              : COLORS.ERROR,
        icon: '🎯',
        subtitle:
          avgConfidence > 0.7
            ? 'High confidence'
            : avgConfidence > 0.4
              ? 'Moderate confidence'
              : 'Low confidence',
      },
    ];

    summaryCards.forEach(card => {
      const cardElement = ForecastCard(card);
      summaryGrid.appendChild(cardElement);
    });

    section.appendChild(summaryGrid);

    // Create forecast comparison chart
    createForecastComparisonChart(
      chartRenderer,
      incomeForecasts,
      expenseForecasts
    )
      .then(({ section: chartSection, chart }) => {
        section.appendChild(chartSection);
        activeCharts.set('forecast-comparison', chart);
      })
      .catch(error => {
        console.error('Error creating forecast comparison chart:', error);
      });

    // Generate balance projections
    const currentBalance = planningData.transactions.reduce(
      (balance, t) => balance + (t.type === 'income' ? t.amount : -t.amount),
      0
    );

    const balanceProjections = balancePredictor.projectBalances(
      currentBalance,
      incomeForecasts,
      expenseForecasts,
      6
    );

    // Create projected balance chart
    createProjectedBalanceChart(chartRenderer, balanceProjections)
      .then(({ section: chartSection, chart }) => {
        section.appendChild(chartSection);
        activeCharts.set('projected-balance', chart);
      })
      .catch(error => {
        console.error('Error creating projected balance chart:', error);
      });

    // Create detailed forecast table
    const forecastTable = createForecastTable(
      incomeForecasts,
      expenseForecasts
    );
    section.appendChild(forecastTable);
  } catch (error) {
    console.error('Error rendering forecasts:', error);
    const errorPlaceholder = createPlaceholder(
      'Error Generating Forecasts',
      'There was an error processing your transaction data. Please try refreshing the page.',
      '⚠️'
    );
    section.appendChild(errorPlaceholder);
  }

  return section;
};
