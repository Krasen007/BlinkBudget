import { COLORS, SPACING } from '../../utils/constants.js';

/**
 * Generate historical monthly data from transactions.
 */
export function generateHistoricalData(transactions, months = 3) {
  const monthlyData = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      1
    );

    const monthTransactions = transactions.filter(transaction => {
      if (transaction.isGhost) return false;
      const transactionDate = new Date(
        transaction.date || transaction.timestamp
      );
      return transactionDate >= monthDate && transactionDate < nextMonthDate;
    });

    const income = monthTransactions
      .filter(transaction => transaction.type === 'income')
      .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    const categoryTotals = Object.create(null);
    monthTransactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      if (transaction.type === 'expense') {
        categoryTotals[category] =
          (categoryTotals[category] || 0) + Math.abs(transaction.amount || 0);
      } else if (transaction.type === 'refund') {
        categoryTotals[category] =
          (categoryTotals[category] || 0) - Math.abs(transaction.amount || 0);
      }
    });

    const expenses = Object.values(categoryTotals).reduce(
      (sum, net) => sum + net,
      0
    );
    monthlyData.push({ period: monthDate, income, expenses });
  }

  return { monthlyData };
}

/**
 * Create a monthly table that separates historical actuals from statistical estimates.
 */
export function createForecastTable(
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
  title.textContent = 'Monthly Statistical Trend Breakdown';
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

  ['Month', 'Income', 'Expenses', 'Net', 'Model'].forEach(header => {
    const cell = document.createElement('div');
    cell.textContent = header;
    cell.style.fontWeight = '600';
    cell.style.color = COLORS.TEXT_MUTED;
    cell.style.paddingBottom = SPACING.SM;
    cell.style.borderBottom = `1px solid ${COLORS.BORDER}`;
    table.appendChild(cell);
  });

  if (historicalData?.monthlyData) {
    historicalData.monthlyData.forEach(month => {
      const monthCell = document.createElement('div');
      monthCell.textContent = month.period.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      monthCell.style.paddingTop = SPACING.SM;
      monthCell.style.fontWeight = '600';
      table.appendChild(monthCell);

      const incomeCell = document.createElement('div');
      incomeCell.textContent = `€${month.income.toFixed(2)}`;
      incomeCell.style.color = COLORS.SUCCESS;
      incomeCell.style.fontWeight = '500';
      incomeCell.style.paddingTop = SPACING.SM;
      incomeCell.style.textAlign = 'right';
      table.appendChild(incomeCell);

      const expenseCell = document.createElement('div');
      expenseCell.textContent = `€${month.expenses.toFixed(2)}`;
      expenseCell.style.color = COLORS.ERROR;
      expenseCell.style.fontWeight = '500';
      expenseCell.style.paddingTop = SPACING.SM;
      expenseCell.style.textAlign = 'right';
      table.appendChild(expenseCell);

      const net = month.income - month.expenses;
      const netCell = document.createElement('div');
      netCell.textContent = `€${net.toFixed(2)}`;
      netCell.style.color = net >= 0 ? COLORS.SUCCESS : COLORS.ERROR;
      netCell.style.fontWeight = '600';
      netCell.style.paddingTop = SPACING.SM;
      netCell.style.textAlign = 'right';
      table.appendChild(netCell);

      const modelCell = document.createElement('div');
      modelCell.textContent = 'Actual';
      modelCell.style.color = COLORS.PRIMARY;
      modelCell.style.fontWeight = '600';
      modelCell.style.paddingTop = SPACING.SM;
      modelCell.style.textAlign = 'right';
      modelCell.style.fontSize = '0.875rem';
      table.appendChild(modelCell);
    });
  }

  const maxForecastRows = Math.max(
    incomeForecasts.length,
    expenseForecasts.length
  );
  for (let i = 0; i < maxForecastRows; i++) {
    const income = incomeForecasts[i] || { predictedAmount: 0 };
    const expense = expenseForecasts[i] || { predictedAmount: 0 };
    const net = income.predictedAmount - expense.predictedAmount;

    const monthCell = document.createElement('div');
    monthCell.textContent = income.period
      ? income.period.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : `Month ${i + 1}`;
    monthCell.style.paddingTop = SPACING.SM;
    table.appendChild(monthCell);

    const incomeCell = document.createElement('div');
    incomeCell.textContent = `€${income.predictedAmount.toFixed(2)}`;
    incomeCell.style.color = COLORS.SUCCESS;
    incomeCell.style.fontWeight = '500';
    incomeCell.style.paddingTop = SPACING.SM;
    incomeCell.style.textAlign = 'right';
    table.appendChild(incomeCell);

    const expenseCell = document.createElement('div');
    expenseCell.textContent = `€${expense.predictedAmount.toFixed(2)}`;
    expenseCell.style.color = COLORS.ERROR;
    expenseCell.style.fontWeight = '500';
    expenseCell.style.paddingTop = SPACING.SM;
    expenseCell.style.textAlign = 'right';
    table.appendChild(expenseCell);

    const netCell = document.createElement('div');
    netCell.textContent = `€${net.toFixed(2)}`;
    netCell.style.color = net >= 0 ? COLORS.SUCCESS : COLORS.ERROR;
    netCell.style.fontWeight = '600';
    netCell.style.paddingTop = SPACING.SM;
    netCell.style.textAlign = 'right';
    table.appendChild(netCell);

    const modelCell = document.createElement('div');
    modelCell.textContent = 'Forecast';
    modelCell.style.color = COLORS.TEXT_MUTED;
    modelCell.style.fontWeight = '500';
    modelCell.style.paddingTop = SPACING.SM;
    modelCell.style.textAlign = 'right';
    modelCell.style.fontSize = '0.875rem';
    table.appendChild(modelCell);
  }

  container.appendChild(title);
  container.appendChild(table);
  return container;
}
