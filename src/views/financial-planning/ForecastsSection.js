/**
 * Statistical monthly forecasts and their chart/table presentation.
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
import { ProgressiveEmptyState } from '../../components/ProgressiveEmptyState.js';
import {
  createForecastTable,
  generateHistoricalData,
} from './forecast-table.js';

/**
 * Build the financial planning forecast section.
 * @param {Object} planningData - Financial planning data including transactions
 * @param {Object} forecastEngine - Forecast engine instance
 * @param {Object} balancePredictor - Balance predictor instance
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Active chart instances
 * @returns {Promise<HTMLElement>} Forecast section
 */
export const ForecastsSection = async (
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
      'Forecasts use all available transaction history to predict income and expenses. Recent months are weighted more heavily. Scheduled bills and paydays are not included, so forecasts are not a guarantee of available cash.'
    )
  );

  const txCount = (planningData?.transactions || []).length;
  const unlockCard = ProgressiveEmptyState({
    section: 'forecasts',
    transactionCount: txCount,
    minTransactions: 90,
  });
  if (unlockCard) section.appendChild(unlockCard);

  if (!planningData?.transactions?.length) {
    section.appendChild(
      createPlaceholder(
        'No Transaction Data Available',
        'Your transaction data may be syncing from the cloud. Please refresh the page or check your internet connection.',
        '🔄'
      )
    );

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh Data';
    refreshBtn.className = 'btn btn-primary';
    refreshBtn.style.marginTop = SPACING.MD;
    refreshBtn.onclick = () => window.location.reload();
    section.appendChild(refreshBtn);
    return section;
  }

  if (planningData.transactions.length < 3) {
    section.appendChild(
      createPlaceholder(
        'Insufficient Data for Forecasting',
        'Add at least 3 months of transaction history to generate accurate financial forecasts.',
        '📊'
      )
    );
    return section;
  }

  try {
    if (typeof forecastEngine?.clearCache === 'function') {
      forecastEngine.clearCache();
    }

    const incomeForecasts = forecastEngine.generateIncomeForecasts(
      planningData.transactions,
      6
    );
    const expenseForecasts = forecastEngine.generateExpenseForecasts(
      planningData.transactions,
      6
    );

    const totalIncomeForecasted = incomeForecasts.reduce(
      (sum, forecast) => sum + forecast.predictedAmount,
      0
    );
    const totalExpensesForecasted = expenseForecasts.reduce(
      (sum, forecast) => sum + forecast.predictedAmount,
      0
    );
    const netForecast = totalIncomeForecasted - totalExpensesForecasted;
    const forecastCount = incomeForecasts.length + expenseForecasts.length;
    const avgConfidence =
      forecastCount > 0
        ? (incomeForecasts.reduce(
            (sum, forecast) => sum + forecast.confidence,
            0
          ) +
            expenseForecasts.reduce(
              (sum, forecast) => sum + forecast.confidence,
              0
            )) /
          forecastCount
        : 0;

    const sumRange = (forecasts, bound) =>
      forecasts.reduce((sum, forecast) => sum + (forecast[bound] || 0), 0);
    const incomeRange = {
      lower: sumRange(incomeForecasts, 'lowerBound'),
      upper: sumRange(incomeForecasts, 'upperBound'),
    };
    const expenseRange = {
      lower: sumRange(expenseForecasts, 'lowerBound'),
      upper: sumRange(expenseForecasts, 'upperBound'),
    };
    const netRange = {
      lower: incomeRange.lower - expenseRange.upper,
      upper: incomeRange.upper - expenseRange.lower,
    };

    const trendArrow = forecasts => {
      const trend = forecasts[0]?.trend || 0;
      return trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
    };
    const summaryCards = [
      {
        label: 'Forecasted Income (6mo)',
        value: `€${totalIncomeForecasted.toFixed(2)}`,
        color: COLORS.SUCCESS,
        icon: '📈',
        subtitle: `Avg: €${(totalIncomeForecasted / 6).toFixed(2)}/month ${trendArrow(incomeForecasts)}`,
        range: `Range: €${incomeRange.lower.toFixed(2)} - €${incomeRange.upper.toFixed(2)}`,
      },
      {
        label: 'Forecasted Expenses (6mo)',
        value: `€${totalExpensesForecasted.toFixed(2)}`,
        color: COLORS.ERROR,
        icon: '📉',
        subtitle: `Avg: €${(totalExpensesForecasted / 6).toFixed(2)}/month ${trendArrow(expenseForecasts)}`,
        range: `Range: €${expenseRange.lower.toFixed(2)} - €${expenseRange.upper.toFixed(2)}`,
      },
      {
        label: 'Net Forecast (6mo)',
        value: `€${netForecast.toFixed(2)}`,
        color: netForecast >= 0 ? COLORS.SUCCESS : COLORS.ERROR,
        icon: netForecast >= 0 ? '💰' : '⚠️',
        subtitle: `Avg: €${(netForecast / 6).toFixed(2)}/month`,
        range: `Range: €${netRange.lower.toFixed(2)} - €${netRange.upper.toFixed(2)}`,
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
            ? 'High confidence > 0.7'
            : avgConfidence > 0.4
              ? 'Moderate confidence > 0.4'
              : 'Low confidence',
      },
    ];

    const summaryGrid = document.createElement('div');
    summaryGrid.className = 'forecast-summary-grid';
    summaryGrid.style.display = 'grid';
    summaryGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    summaryGrid.style.gap = SPACING.MD;
    summaryCards.forEach(card => summaryGrid.appendChild(ForecastCard(card)));
    section.appendChild(summaryGrid);

    const currentBalance = planningData.transactions.reduce((balance, tx) => {
      if (tx.isGhost) return balance;
      return balance + (tx.type === 'income' ? tx.amount : -tx.amount);
    }, 0);

    const comparisonSlot = document.createElement('div');
    comparisonSlot.className = 'forecast-chart-slot';
    section.appendChild(comparisonSlot);
    const balanceSlot = document.createElement('div');
    balanceSlot.className = 'forecast-chart-slot';
    section.appendChild(balanceSlot);

    createForecastComparisonChart(
      chartRenderer,
      incomeForecasts,
      expenseForecasts
    )
      .then(({ section: chartSection, chart }) => {
        comparisonSlot.appendChild(chartSection);
        activeCharts.set('forecast-comparison', chart);
      })
      .catch(error => {
        console.error('Error creating forecast comparison chart:', error);
      });

    const balanceProjections = balancePredictor.projectBalances(
      currentBalance,
      incomeForecasts,
      expenseForecasts,
      6
    );
    createProjectedBalanceChart(chartRenderer, balanceProjections)
      .then(({ section: chartSection, chart }) => {
        balanceSlot.appendChild(chartSection);
        activeCharts.set('projected-balance', chart);
      })
      .catch(error => {
        console.error('Error creating projected balance chart:', error);
      });

    const historicalData = generateHistoricalData(planningData.transactions, 3);
    section.appendChild(
      createForecastTable(incomeForecasts, expenseForecasts, historicalData)
    );
  } catch (error) {
    console.error('Error rendering forecasts:', error);
    section.appendChild(
      createPlaceholder(
        'Error Generating Forecasts',
        'There was an error processing your transaction data. Please try refreshing the page.',
        '⚠️'
      )
    );
  }

  return section;
};
