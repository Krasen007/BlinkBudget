import { SectionContainer } from './SectionContainer.js';
import { ForecastCard } from './ForecastCard.js';
import { DataTable } from './DataTable.js';
import { Placeholder } from './Placeholder.js';
import { ForecastEngine } from '../../core/forecast-engine.js';
import { AccountBalancePredictor } from '../../core/Account/account-balance-predictor.js';
import {
  createProjectedBalanceChart,
  createForecastComparisonChart,
} from '../../utils/financial-planning-charts.js';
import { COLORS } from '../../utils/constants.js';

/**
 * ForecastsSection Component - Income/expense predictions section
 * @param {Object} props - Section properties
 * @param {Object} props.planningData - Planning data from services
 * @param {Array} props.planningData.transactions - Transaction data
 * @param {Object} props.chartRenderer - Chart renderer instance
 * @param {Function} props.onChartCreate - Callback when charts are created
 * @returns {HTMLElement} The forecasts section element
 */
export const ForecastsSection = ({
  planningData,
  chartRenderer,
  onChartCreate,
}) => {
  const section = SectionContainer({
    id: 'forecasts',
    title: 'Financial Forecasts',
    icon: '🔮',
    usageNote:
      'Forecasts use your past 3+ months of transactions to predict income and expenses. Adjust assumptions in the scenario tab to see how changes affect future balances.',
  });

  if (
    !planningData ||
    !planningData.transactions ||
    planningData.transactions.length < 3
  ) {
    const placeholder = Placeholder({
      title: 'Insufficient Data for Forecasting',
      description:
        'Add at least 3 months of transaction history to generate accurate financial forecasts.',
      icon: '📊',
    });
    section.appendChild(placeholder);
    return section;
  }

  try {
    // Initialize engines
    const forecastEngine = new ForecastEngine();
    const balancePredictor = new AccountBalancePredictor();

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
    summaryGrid.style.gap = 'var(--spacing-md)';
    summaryGrid.style.marginBottom = 'var(--spacing-xl)';

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
        if (onChartCreate) onChartCreate('forecast-comparison', chart);
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
        if (onChartCreate) onChartCreate('projected-balance', chart);
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
    const errorPlaceholder = Placeholder({
      title: 'Error Generating Forecasts',
      description:
        'There was an error processing your transaction data. Please try refreshing the page.',
      icon: '⚠️',
    });
    section.appendChild(errorPlaceholder);
  }

  return section;
};

/**
 * Create forecast table using DataTable component
 * @param {Array} incomeForecasts - Income forecast data
 * @param {Array} expenseForecasts - Expense forecast data
 * @returns {HTMLElement} The forecast table element
 */
function createForecastTable(incomeForecasts, expenseForecasts) {
  const headers = ['Month', 'Income', 'Expenses', 'Net', 'Confidence'];
  const rows = [];
  const cellStyles = [];

  const maxRows = Math.max(incomeForecasts.length, expenseForecasts.length);
  for (let i = 0; i < maxRows; i++) {
    const income = incomeForecasts[i] || { predictedAmount: 0, confidence: 0 };
    const expense = expenseForecasts[i] || {
      predictedAmount: 0,
      confidence: 0,
    };
    const net = income.predictedAmount - expense.predictedAmount;
    const confidence = Math.min(income.confidence, expense.confidence);

    const row = [
      income.period
        ? income.period.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
        : `Month ${i + 1}`,
      `€${income.predictedAmount.toFixed(2)}`,
      `€${expense.predictedAmount.toFixed(2)}`,
      `€${net.toFixed(2)}`,
      `${(confidence * 100).toFixed(0)}%`,
    ];

    const rowStyles = [
      {}, // Month - default
      { color: COLORS.SUCCESS, fontWeight: '500', textAlign: 'right' }, // Income
      { color: COLORS.ERROR, fontWeight: '500', textAlign: 'right' }, // Expenses
      {
        color: net >= 0 ? COLORS.SUCCESS : COLORS.ERROR,
        fontWeight: '600',
        textAlign: 'right',
      }, // Net
      {
        color:
          confidence > 0.7
            ? COLORS.SUCCESS
            : confidence > 0.4
              ? COLORS.WARNING
              : COLORS.ERROR,
        textAlign: 'right',
      }, // Confidence
    ];

    rows.push(row);
    cellStyles.push(rowStyles);
  }

  return DataTable({
    title: 'Monthly Forecast Breakdown',
    headers,
    rows,
    cellStyles,
  });
}
