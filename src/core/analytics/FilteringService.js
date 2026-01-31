/**
 * FilteringService
 * Handles transaction filtering logic for analytics.
 */

export class FilteringService {
  /**
   * Filter transactions by time period
   * @param {Array} transactions - Raw transaction data
   * @param {Object} timePeriod - Time period configuration
   * @param {Date|string} timePeriod.startDate - Start date
   * @param {Date|string} timePeriod.endDate - End date
   * @returns {Array} Filtered transactions
   */
  static filterByTimePeriod(transactions, timePeriod) {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }

    if (!timePeriod || !timePeriod.startDate || !timePeriod.endDate) {
      return transactions;
    }

    const startDate = new Date(timePeriod.startDate);
    const endDate = new Date(timePeriod.endDate);

    // Set time to start/end of day for accurate filtering
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return transactions.filter(transaction => {
      // Exclude ghost (moved) transactions by default to prevent double counting
      if (transaction.isGhost) return false;

      const transactionDate = new Date(
        transaction.date || transaction.timestamp
      );
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }
}
