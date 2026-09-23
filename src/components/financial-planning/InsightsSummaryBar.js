/**
 * InsightsSummaryBar Component
 *
 * Displays the top summary KPI metrics matching BlinkBudget's card design:
 * - NET WORTH (All-time available balance / net worth)
 * - Income (Income for the active period)
 * - Expense (Expenses for the active period)
 */

/**
 * Format a number with two decimals and comma separators
 * @param {number} num
 * @returns {string}
 */
export function formatMetricNumber(num) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));
}

/**
 * Filter transactions by period
 * @param {Array} transactions
 * @param {string} period - 'this-month' | 'this-year' | 'last-month' | 'last-year' | 'all-time'
 * @returns {Array}
 */
export function filterTransactionsByPeriod(
  transactions,
  period = 'this-month'
) {
  if (!transactions || !Array.isArray(transactions)) return [];
  if (period === 'all-time') {
    return transactions.filter(t => !t.isGhost);
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions.filter(t => {
    if (t.isGhost) return false;
    const date = new Date(t.date || t.timestamp);
    if (isNaN(date.getTime())) return false;

    if (period === 'this-month') {
      return (
        date.getFullYear() === currentYear && date.getMonth() === currentMonth
      );
    }
    if (period === 'this-year') {
      return date.getFullYear() === currentYear;
    }
    if (period === 'last-month') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getFullYear() === prevYear && date.getMonth() === prevMonth;
    }
    if (period === 'last-year') {
      return date.getFullYear() === currentYear - 1;
    }
    return true;
  });
}

/**
 * Calculate KPI summary stats from transactions
 * @param {Array} allTransactions
 * @param {string} period
 * @returns {{ netWorth: number, income: number, expense: number }}
 */
export function calculateSummaryMetrics(
  allTransactions = [],
  period = 'this-month'
) {
  const valid = allTransactions.filter(t => !t.isGhost);

  // All-time Net Worth calculation matching dashboard total available
  let allTimeIncome = 0;
  let allTimeExpense = 0;

  valid.forEach(t => {
    const amt = typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;
    if (t.type === 'income') allTimeIncome += amt;
    if (t.type === 'expense') allTimeExpense += amt;
    if (t.type === 'refund') allTimeExpense -= amt;
  });

  const netWorth = allTimeIncome - allTimeExpense;

  // Period Income and Expense
  const periodTx = filterTransactionsByPeriod(valid, period);
  let income = 0;
  let expense = 0;

  periodTx.forEach(t => {
    const amt = typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;
    if (t.type === 'income') {
      income += amt;
    } else if (t.type === 'expense') {
      expense += amt;
    } else if (t.type === 'refund') {
      expense -= amt;
    }
  });

  return { netWorth, income, expense: Math.max(0, expense) };
}

/**
 * Create a single KPI card using the established `.card` + insights card
 * classes from src/styles/components/insights-charts.css.
 * @param {Object} props
 * @param {string} props.icon - Emoji icon (decorative)
 * @param {string} props.label - Uppercase KPI label
 * @param {string} props.value - Pre-formatted value
 * @param {string} props.valueClass - Modifier class for the value color
 * @returns {HTMLElement}
 */
function createStatCard({ icon, label, value, valueClass }) {
  const card = document.createElement('div');
  card.className = 'card insights-stat-card';

  const header = document.createElement('div');
  header.className = 'insights-stat-header';

  const iconEl = document.createElement('span');
  iconEl.className = 'insights-stat-icon';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = icon;

  const labelEl = document.createElement('span');
  labelEl.className = 'insights-stat-label';
  labelEl.textContent = label;

  header.appendChild(iconEl);
  header.appendChild(labelEl);

  const valueEl = document.createElement('div');
  valueEl.className = `insights-stat-value ${valueClass}`;
  valueEl.textContent = value;

  card.appendChild(header);
  card.appendChild(valueEl);

  return card;
}

/**
 * InsightsSummaryBar component
 * @param {Object} props
 * @param {Array} props.transactions
 * @param {string} [props.initialPeriod='this-month']
 * @returns {{ element: HTMLElement, update: Function }}
 */
export const InsightsSummaryBar = ({
  transactions = [],
  initialPeriod = 'this-month',
}) => {
  const container = document.createElement('div');
  container.className = 'insights-summary-grid';

  let currentPeriod = initialPeriod;
  let currentTransactions = transactions;

  function render() {
    const { netWorth, income, expense } = calculateSummaryMetrics(
      currentTransactions,
      currentPeriod
    );

    const netWorthSign = netWorth >= 0 ? '+ ' : '- ';
    const netWorthFormatted = `${netWorthSign}${formatMetricNumber(netWorth)}`;
    const incomeFormatted = `+ ${formatMetricNumber(income)}`;
    const expenseFormatted = `- ${formatMetricNumber(expense)}`;

    container.replaceChildren(
      createStatCard({
        icon: '💼',
        label: 'NET WORTH',
        value: netWorthFormatted,
        valueClass: 'value-networth',
      }),
      createStatCard({
        icon: '📈',
        label: 'Income',
        value: incomeFormatted,
        valueClass: 'value-income',
      }),
      createStatCard({
        icon: '📉',
        label: 'Expense',
        value: expenseFormatted,
        valueClass: 'value-expense',
      })
    );
  }

  render();

  return {
    element: container,
    update: (newPeriod, newTransactions) => {
      if (newPeriod) currentPeriod = newPeriod;
      if (newTransactions) currentTransactions = newTransactions;
      render();
    },
  };
};
