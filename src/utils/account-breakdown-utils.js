/**
 * Account Breakdown Utilities
 *
 * Aggregates the transactions of a reporting period per account type so the
 * "Explore Accounts" section in Reports can show one card per wallet type
 * (Cash, Checking Account, ...) and let the user drill into it.
 */

import { getAccountTypeColor, getAccountTypeLabel } from './constants.js';
import { normalizeAccountType } from './account-filter-utils.js';

/**
 * Group the period transactions by account type.
 *
 * `amount` follows the same convention as the category breakdown: expenses
 * minus refunds charged to accounts of that type, so transfers never inflate
 * "spending". `transactionCount` mirrors the dashboard account filter and
 * counts every transaction that touches one of the accounts (a transfer is
 * counted for both sides).
 *
 * @param {Object} params
 * @param {Array} params.transactions - All transactions
 * @param {Object} params.timePeriod - Period with startDate/endDate
 * @param {Array} params.accounts - Accounts list
 * @returns {Array} One entry per account type with period activity
 */
export const buildAccountTypeBreakdown = ({
  transactions = [],
  timePeriod = null,
  accounts = [],
} = {}) => {
  if (!timePeriod || !timePeriod.startDate || !timePeriod.endDate) return [];

  const startDate = new Date(timePeriod.startDate);
  const endDate = new Date(timePeriod.endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const periodTransactions = transactions.filter(transaction => {
    // Ghost copies (transactions moved to another month) must not be counted.
    if (transaction.isGhost) return false;
    const transactionDate = new Date(transaction.date || transaction.timestamp);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  let totalExpensesForPeriod = 0;
  periodTransactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      totalExpensesForPeriod += transaction.amount;
    } else if (transaction.type === 'refund') {
      totalExpensesForPeriod -= transaction.amount;
    }
  });

  // Bucket the accounts (and their ids) by normalized type
  const accountIdsByType = new Map();
  const accountCountByType = new Map();
  accounts.forEach(account => {
    const type = normalizeAccountType(account.type);
    if (!accountIdsByType.has(type)) {
      accountIdsByType.set(type, new Set());
      accountCountByType.set(type, 0);
    }
    accountIdsByType.get(type).add(account.id);
    accountCountByType.set(type, accountCountByType.get(type) + 1);
  });

  const breakdown = [];
  accountIdsByType.forEach((accountIds, type) => {
    let amount = 0;
    let transactionCount = 0;

    periodTransactions.forEach(transaction => {
      const isSource =
        transaction.accountId != null && accountIds.has(transaction.accountId);
      const isDestination =
        transaction.toAccountId != null &&
        accountIds.has(transaction.toAccountId);
      if (!isSource && !isDestination) return;

      transactionCount += 1;

      if (!isSource) return;
      if (transaction.type === 'expense') amount += transaction.amount;
      else if (transaction.type === 'refund') amount -= transaction.amount;
    });

    if (transactionCount === 0) return;

    breakdown.push({
      name: getAccountTypeLabel(type),
      type,
      color: getAccountTypeColor(type),
      amount,
      transactionCount,
      accountCount: accountCountByType.get(type),
      percentage:
        totalExpensesForPeriod > 0
          ? (Math.max(0, amount) / totalExpensesForPeriod) * 100
          : 0,
      isAccountType: true,
    });
  });

  return breakdown.sort((a, b) => b.amount - a.amount);
};
