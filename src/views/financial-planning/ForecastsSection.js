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
 * Generate historical monthly data from transactions
 */
function generateHistoricalData(transactions, months = 3) {
  const monthlyData = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      1
    );

    const monthTransactions = transactions.filter(t => {
      if (t.isGhost) return false;
      const transactionDate = new Date(t.date || t.timestamp);
      return transactionDate >= monthDate && transactionDate < nextMonthDate;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    monthlyData.push({
      period: monthDate,
      income,
      expenses,
    });
  }

  return { monthlyData };
}

/**
 * Create a detailed forecast table with historical values for previous months
 */
function createForecastTable(
  incomeForecasts,
  expenseForecasts,
  historicalData
) {
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
  const headers = ['Month', 'Income', 'Expenses', 'Net', 'Type'];
  headers.forEach(header => {
    const headerCell = document.createElement('div');
    headerCell.textContent = header;
    headerCell.style.fontWeight = '600';
    headerCell.style.color = COLORS.TEXT_MUTED;
    headerCell.style.paddingBottom = SPACING.SM;
    headerCell.style.borderBottom = `1px solid ${COLORS.BORDER}`;
    table.appendChild(headerCell);
  });

  // Add historical months first
  if (historicalData && historicalData.monthlyData) {
    historicalData.monthlyData.forEach((month, _index) => {
      // Month
      const monthCell = document.createElement('div');
      monthCell.textContent = month.period.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      monthCell.style.paddingTop = SPACING.SM;
      monthCell.style.fontWeight = '600'; // Bold for historical months
      table.appendChild(monthCell);

      // Income
      const incomeCell = document.createElement('div');
      incomeCell.textContent = `€${month.income.toFixed(2)}`;
      incomeCell.style.color = COLORS.SUCCESS;
      incomeCell.style.fontWeight = '500';
      incomeCell.style.paddingTop = SPACING.SM;
      incomeCell.style.textAlign = 'right';
      table.appendChild(incomeCell);

      // Expenses
      const expenseCell = document.createElement('div');
      expenseCell.textContent = `€${month.expenses.toFixed(2)}`;
      expenseCell.style.color = COLORS.ERROR;
      expenseCell.style.fontWeight = '500';
      expenseCell.style.paddingTop = SPACING.SM;
      expenseCell.style.textAlign = 'right';
      table.appendChild(expenseCell);

      // Net
      const net = month.income - month.expenses;
      const netCell = document.createElement('div');
      netCell.textContent = `€${net.toFixed(2)}`;
      netCell.style.color = net >= 0 ? COLORS.SUCCESS : COLORS.ERROR;
      netCell.style.fontWeight = '600';
      netCell.style.paddingTop = SPACING.SM;
      netCell.style.textAlign = 'right';
      table.appendChild(netCell);

      // Historical column (shows "Actual" for historical months)
      const historicalCell = document.createElement('div');
      historicalCell.textContent = 'Actual';
      historicalCell.style.color = COLORS.PRIMARY;
      historicalCell.style.fontWeight = '600';
      historicalCell.style.paddingTop = SPACING.SM;
      historicalCell.style.textAlign = 'right';
      historicalCell.style.fontSize = '0.875rem';
      table.appendChild(historicalCell);
    });
  }

  // Add forecasted months
  const maxForecastRows = Math.max(
    incomeForecasts.length,
    expenseForecasts.length
  );
  for (let i = 0; i < maxForecastRows; i++) {
    const income = incomeForecasts[i] || {
      predictedAmount: 0,
      confidence: 0,
    };
    const expense = expenseForecasts[i] || {
      predictedAmount: 0,
      confidence: 0,
    };
    const net = income.predictedAmount - expense.predictedAmount;
    // const confidence = Math.min(income.confidence, expense.confidence); // Unused for now

    // Month
    const monthCell = document.createElement('div');
    monthCell.textContent = income.period
      ? income.period.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : `Month ${i + 1}`;
    monthCell.style.paddingTop = SPACING.SM;
    monthCell.style.fontWeight = 'normal'; // Normal weight for forecasted months
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

    // Historical column (shows "Forecast" for forecasted months)
    const historicalCell = document.createElement('div');
    historicalCell.textContent = 'Forecast';
    historicalCell.style.color = COLORS.TEXT_MUTED;
    historicalCell.style.fontWeight = '500';
    historicalCell.style.paddingTop = SPACING.SM;
    historicalCell.style.textAlign = 'right';
    historicalCell.style.fontSize = '0.875rem';
    table.appendChild(historicalCell);
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
      'Forecasts use your past 3+ months of transactions to predict income and expenses.'
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
    const currentBalance = planningData.transactions.reduce((balance, t) => {
      if (t.isGhost) return balance;
      return balance + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

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

    // Create detailed forecast table with historical data
    const historicalData = generateHistoricalData(planningData.transactions, 3);
    const forecastTable = createForecastTable(
      incomeForecasts,
      expenseForecasts,
      historicalData
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
