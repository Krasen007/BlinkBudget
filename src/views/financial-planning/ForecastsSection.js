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
import { SavingsGoalsService } from '../../core/savings-goals-service.js';

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

    // Compute net expenses: sum all expense amounts, subtract all refund amounts.
    // Refund-only categories produce a negative net that reduces the total —
    // identical to MetricsService.calculateCategoryBreakdown after the fix
    // (no per-category floor; the total is floored at 0 at the end).
    const categoryTotals = Object.create(null);
    monthTransactions.forEach(t => {
      if (t.type === 'expense') {
        const cat = t.category || 'Uncategorized';
        categoryTotals[cat] =
          (categoryTotals[cat] || 0) + Math.abs(t.amount || 0);
      } else if (t.type === 'refund') {
        const cat = t.category || 'Uncategorized';
        categoryTotals[cat] =
          (categoryTotals[cat] || 0) - Math.abs(t.amount || 0);
      }
    });
    // Sum all net category amounts (can be negative if refunds exceed expenses)
    const expenses = Object.values(categoryTotals).reduce(
      (sum, net) => sum + net,
      0
    );

    monthlyData.push({
      period: monthDate,
      income,
      expenses,
    });
  }

  return { monthlyData };
}

/**
 * Create a goal connection section showing forecast vs goal progress
 */
function createGoalConnectionSection(goals, forecasts, currentBalance) {
  // Filter to active goals with targets
  const activeGoals = goals.filter(g => g.targetAmount > 0 && !g.progress?.isCompleted);
  if (activeGoals.length === 0) return null;

  const container = document.createElement('div');
  container.className = 'goal-connection-section';
  container.style.background = COLORS.SURFACE;
  container.style.border = `1px solid ${COLORS.BORDER}`;
  container.style.borderRadius = 'var(--radius-lg)';
  container.style.padding = SPACING.LG;
  container.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Goal Progress';
  title.style.margin = '0';
  title.style.marginBottom = SPACING.MD;
  title.style.fontSize = '1.125rem';
  title.style.fontWeight = '600';
  title.style.color = COLORS.TEXT_MAIN;
  container.appendChild(title);

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
  grid.style.gap = SPACING.MD;

  activeGoals.forEach(goal => {
    // Calculate projected balance at goal target date
    const goalDate = new Date(goal.targetDate);
    const projectedBalanceAtGoal = forecasts.reduce((balance, forecast) => {
      if (forecast.period <= goalDate) {
        return balance + forecast.predictedAmount - (forecasts.find(f => f.period === forecast.period)?.predictedAmount || 0);
      }
      return balance;
    }, currentBalance);

    // Use goalComparison from the first forecast if available
    const firstForecast = forecasts[0];
    const goalComparison = firstForecast?.goalComparison;

    let statusHtml = '';
    let statusColor = COLORS.TEXT_MUTED;

    if (goalComparison && goalComparison.goalId === goal.id) {
      const { status, statusMessage, shortfall } = goalComparison;
      const goalProjectedBalance = projectedBalanceAtGoal; // Use calculated value
      statusColor = status === 'on_track' ? COLORS.SUCCESS : status === 'at_risk' ? COLORS.WARNING : COLORS.ERROR;

      if (status === 'on_track') {
        statusHtml = `
          <div style="color: ${COLORS.SUCCESS}; font-weight: 600;">✓ On Track</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">${statusMessage}</div>
          <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-top: 8px;">
            Projected: €${goalProjectedBalance.toFixed(0)} / Target: €${goal.targetAmount}
          </div>
        `;
      } else if (status === 'at_risk') {
        statusHtml = `
          <div style="color: ${COLORS.WARNING}; font-weight: 600;">⚠️ Needs Attention</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">${statusMessage}</div>
          <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-top: 8px;">
            Shortfall: €${shortfall.toFixed(0)} by ${goalDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
        `;
      } else {
        statusHtml = `
          <div style="color: ${COLORS.ERROR}; font-weight: 600;">⚠️ Off Track</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">${statusMessage}</div>
          <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-top: 8px;">
            Shortfall: €${shortfall.toFixed(0)}
          </div>
        `;
      }
    } else {
      // Fallback calculation
      const remaining = goal.targetAmount - goal.progress?.currentAmount;
      const monthsToGoal = goal.progress?.estimatedMonthsToComplete;

      if (monthsToGoal && monthsToGoal <= 12) {
        statusHtml = `
          <div style="color: ${COLORS.WARNING}; font-weight: 600;">Track Progress</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">€${remaining.toFixed(0)} remaining</div>
          <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-top: 8px;">
            ${monthsToGoal} months at current rate
          </div>
        `;
      } else {
        statusHtml = `
          <div style="color: ${COLORS.TEXT_MUTED}; font-weight: 600;">📍 ${goal.progress?.percentage?.toFixed(0) || 0}% Complete</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">€${goal.progress?.currentAmount?.toFixed(0) || 0} saved</div>
        `;
      }
    }

    const goalCard = document.createElement('div');
    goalCard.className = 'goal-connection-card';
    goalCard.style.background = 'var(--color-surface-alt)';
    goalCard.style.borderRadius = 'var(--radius-md)';
    goalCard.style.padding = SPACING.MD;
    goalCard.style.borderLeft = `4px solid ${statusColor}`;

    goalCard.innerHTML = `
      <div style="font-weight: 600; margin-bottom: ${SPACING.SM};">${goal.name}</div>
      <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: ${SPACING.SM};">
        Target: €${goal.targetAmount.toLocaleString()} by ${goalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      ${statusHtml}
    `;

    grid.appendChild(goalCard);
  });

  container.appendChild(grid);
  return container;
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
 * @returns {Promise<HTMLElement>} Promise resolving to DOM element containing forecasts section content
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
      'Forecasts use all available transaction history to predict income and expenses. Recent months are weighted more heavily.'
    )
  );

  if (
    !planningData ||
    !planningData.transactions ||
    planningData.transactions.length === 0
  ) {
    const placeholder = createPlaceholder(
      'No Transaction Data Available',
      'Your transaction data may be syncing from the cloud. Please refresh the page or check your internet connection.',
      '🔄'
    );
    section.appendChild(placeholder);

    // Add a refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh Data';
    refreshBtn.className = 'btn btn-primary';
    refreshBtn.style.marginTop = SPACING.MD;
    refreshBtn.onclick = () => {
      window.location.reload();
    };
    section.appendChild(refreshBtn);
    return section;
  }

  if (planningData.transactions.length < 3) {
    const placeholder = createPlaceholder(
      'Insufficient Data for Forecasting',
      'Add at least 3 months of transaction history to generate accurate financial forecasts.',
      '📊'
    );
    section.appendChild(placeholder);
    return section;
  }

  try {
    // Clear forecast cache to ensure updated filtering is applied
    if (forecastEngine && typeof forecastEngine.clearCache === 'function') {
      forecastEngine.clearCache();
    }

    // Load active goals for goal comparison
    let activeGoals = [];
    try {
      activeGoals = await SavingsGoalsService.calculateGoalProgress(
        planningData.transactions || []
      );
    } catch (error) {
      console.warn('Could not load goals for forecast connection:', error);
    }

    // Generate forecasts - pass first active goal for comparison (if any)
    const firstActiveGoal = activeGoals.find(g => g.targetAmount > 0 && !g.progress?.isCompleted);
    const goalOptions = firstActiveGoal
      ? {
          goalId: firstActiveGoal.id,
          goalTarget: {
            id: firstActiveGoal.id,
            name: firstActiveGoal.name,
            targetAmount: firstActiveGoal.targetAmount,
            targetDate: firstActiveGoal.targetDate,
          },
        }
      : {};

    const incomeForecasts = forecastEngine.generateIncomeForecasts(
      planningData.transactions,
      6,
      goalOptions
    );
    const expenseForecasts = forecastEngine.generateExpenseForecasts(
      planningData.transactions,
      6
    );

    // Create forecast summary cards
    const summaryGrid = document.createElement('div');
    summaryGrid.className = 'forecast-summary-grid';
    summaryGrid.style.display = 'grid';
    summaryGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    summaryGrid.style.gap = SPACING.MD;

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

    // Calculate uncertainty ranges for income and expenses
    const incomeRange =
      incomeForecasts.length > 0
        ? {
            lower: incomeForecasts.reduce(
              (sum, f) => sum + (f.lowerBound || 0),
              0
            ),
            upper: incomeForecasts.reduce(
              (sum, f) => sum + (f.upperBound || 0),
              0
            ),
          }
        : { lower: 0, upper: 0 };

    const expenseRange =
      expenseForecasts.length > 0
        ? {
            lower: expenseForecasts.reduce(
              (sum, f) => sum + (f.lowerBound || 0),
              0
            ),
            upper: expenseForecasts.reduce(
              (sum, f) => sum + (f.upperBound || 0),
              0
            ),
          }
        : { lower: 0, upper: 0 };

    const netRange = {
      lower: incomeRange.lower - expenseRange.upper,
      upper: incomeRange.upper - expenseRange.lower,
    };

    // Determine trend arrows
    const incomeTrend =
      incomeForecasts.length > 0 && incomeForecasts[0].trend
        ? incomeForecasts[0].trend > 0
          ? '↑'
          : incomeForecasts[0].trend < 0
            ? '↓'
            : '→'
        : '→';

    const expenseTrend =
      expenseForecasts.length > 0 && expenseForecasts[0].trend
        ? expenseForecasts[0].trend > 0
          ? '↑'
          : expenseForecasts[0].trend < 0
            ? '↓'
            : '→'
        : '→';

    const summaryCards = [
      {
        label: 'Forecasted Income (6mo)',
        value: `€${totalIncomeForecasted.toFixed(2)}`,
        color: COLORS.SUCCESS,
        icon: '📈',
        subtitle: `Avg: €${(totalIncomeForecasted / 6).toFixed(2)}/month ${incomeTrend}`,
        range: `Range: €${incomeRange.lower.toFixed(2)} - €${incomeRange.upper.toFixed(2)}`,
      },
      {
        label: 'Forecasted Expenses (6mo)',
        value: `€${totalExpensesForecasted.toFixed(2)}`,
        color: COLORS.ERROR,
        icon: '📉',
        subtitle: `Avg: €${(totalExpensesForecasted / 6).toFixed(2)}/month ${expenseTrend}`,
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

    // Generate balance projections first (needed for goal connection)
    const currentBalance = planningData.transactions.reduce((balance, t) => {
      if (t.isGhost) return balance;
      return balance + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    // Add goal connection section if goals exist
    if (activeGoals.length > 0) {
      const goalSection = createGoalConnectionSection(
        activeGoals,
        incomeForecasts,
        currentBalance
      );
      if (goalSection) {
        section.appendChild(goalSection);
      }
    }

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
