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

  /**
   * Filter transactions by multiple categories
   * @param {Array} transactions - Raw transaction data
   * @param {Array} categories - Array of category names to include
   * @param {string} filterType - 'include' or 'exclude'
   * @returns {Array} Filtered transactions
   */
  static filterByCategories(
    transactions,
    categories = [],
    filterType = 'include'
  ) {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }

    if (!categories || categories.length === 0) {
      return transactions;
    }

    return transactions.filter(transaction => {
      // Exclude ghost transactions
      if (transaction.isGhost) return false;

      const hasCategory = categories.includes(transaction.category);
      return filterType === 'include' ? hasCategory : !hasCategory;
    });
  }

  /**
   * Filter transactions by amount range
   * @param {Array} transactions - Raw transaction data
   * @param {Object} amountRange - Amount range configuration
   * @param {number} amountRange.min - Minimum amount (optional)
   * @param {number} amountRange.max - Maximum amount (optional)
   * @returns {Array} Filtered transactions
   */
  static filterByAmountRange(transactions, amountRange) {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }

    if (
      !amountRange ||
      (amountRange.min === undefined && amountRange.max === undefined)
    ) {
      return transactions;
    }

    const { min, max } = amountRange;

    return transactions.filter(transaction => {
      // Exclude ghost transactions
      if (transaction.isGhost) return false;

      const amount = Math.abs(transaction.amount || 0);

      if (min !== undefined && amount < min) return false;
      if (max !== undefined && amount > max) return false;

      return true;
    });
  }

  /**
   * Filter transactions by transaction type
   * @param {Array} transactions - Raw transaction data
   * @param {Array} types - Array of types to include ('expense', 'income', 'transfer')
   * @returns {Array} Filtered transactions
   */
  static filterByTypes(transactions, types = []) {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }

    if (!types || types.length === 0) {
      return transactions;
    }

    return transactions.filter(transaction => {
      // Exclude ghost transactions
      if (transaction.isGhost) return false;

      return types.includes(transaction.type);
    });
  }

  /**
   * Filter transactions by account
   * @param {Array} transactions - Raw transaction data
   * @param {Array} accountIds - Array of account IDs to include
   * @returns {Array} Filtered transactions
   */
  static filterByAccounts(transactions, accountIds = []) {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }

    if (!accountIds || accountIds.length === 0) {
      return transactions;
    }

    return transactions.filter(transaction => {
      // Exclude ghost transactions
      if (transaction.isGhost) return false;

      return accountIds.includes(transaction.accountId);
    });
  }

  /**
   * Filter transactions by description/notes text
   * @param {Array} transactions - Raw transaction data
   * @param {string} searchText - Text to search for
   * @param {boolean} caseSensitive - Whether search should be case sensitive
   * @returns {Array} Filtered transactions
   */
  static filterByText(transactions, searchText = '', caseSensitive = false) {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }

    if (!searchText || searchText.trim() === '') {
      return transactions;
    }

    const search = caseSensitive ? searchText : searchText.toLowerCase();

    return transactions.filter(transaction => {
      // Exclude ghost transactions
      if (transaction.isGhost) return false;

      const description = transaction.description || '';
      const notes = transaction.notes || '';
      const category = transaction.category || '';

      const searchableText = caseSensitive
        ? `${description} ${notes} ${category}`
        : `${description} ${notes} ${category}`.toLowerCase();

      return searchableText.includes(search);
    });
  }

  /**
   * Apply multiple filters at once
   * @param {Array} transactions - Raw transaction data
   * @param {Object} filters - Filter configuration object
   * @param {Object} filters.dateRange - Date range filter
   * @param {Array} filters.categories - Categories filter
   * @param {string} filters.categoryFilterType - 'include' or 'exclude'
   * @param {Object} filters.amountRange - Amount range filter
   * @param {Array} filters.types - Transaction types filter
   * @param {Array} filters.accounts - Accounts filter
   * @param {string} filters.searchText - Text search filter
   * @param {boolean} filters.caseSensitive - Case sensitive search
   * @returns {Array} Filtered transactions
   */
  static applyFilters(transactions, filters = {}) {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }

    let filteredTransactions = [...transactions];

    // Apply each filter if present
    if (filters.dateRange) {
      filteredTransactions = this.filterByTimePeriod(
        filteredTransactions,
        filters.dateRange
      );
    }

    if (filters.categories && filters.categories.length > 0) {
      filteredTransactions = this.filterByCategories(
        filteredTransactions,
        filters.categories,
        filters.categoryFilterType || 'include'
      );
    }

    if (filters.amountRange) {
      filteredTransactions = this.filterByAmountRange(
        filteredTransactions,
        filters.amountRange
      );
    }

    if (filters.types && filters.types.length > 0) {
      filteredTransactions = this.filterByTypes(
        filteredTransactions,
        filters.types
      );
    }

    if (filters.accounts && filters.accounts.length > 0) {
      filteredTransactions = this.filterByAccounts(
        filteredTransactions,
        filters.accounts
      );
    }

    if (filters.searchText && filters.searchText.trim() !== '') {
      filteredTransactions = this.filterByText(
        filteredTransactions,
        filters.searchText,
        filters.caseSensitive || false
      );
    }

    return filteredTransactions;
  }

  /**
   * Get filter summary for display
   * @param {Object} filters - Filter configuration object
   * @returns {Object} Filter summary with human-readable descriptions
   */
  static getFilterSummary(filters = {}) {
    const summary = {
      hasFilters: false,
      descriptions: [],
      count: 0,
    };

    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      summary.descriptions.push(
        `Date: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      );
      summary.hasFilters = true;
    }

    if (filters.categories && filters.categories.length > 0) {
      const type = filters.categoryFilterType || 'include';
      const action = type === 'include' ? 'Categories' : 'Excluding';
      summary.descriptions.push(`${action}: ${filters.categories.join(', ')}`);
      summary.hasFilters = true;
    }

    if (filters.amountRange) {
      const { min, max } = filters.amountRange;
      let amountDesc = 'Amount: ';
      if (min !== undefined && max !== undefined) {
        amountDesc += `$${min} - $${max}`;
      } else if (min !== undefined) {
        amountDesc += `≥ $${min}`;
      } else if (max !== undefined) {
        amountDesc += `≤ $${max}`;
      }
      summary.descriptions.push(amountDesc);
      summary.hasFilters = true;
    }

    if (filters.types && filters.types.length > 0) {
      summary.descriptions.push(`Types: ${filters.types.join(', ')}`);
      summary.hasFilters = true;
    }

    if (filters.accounts && filters.accounts.length > 0) {
      summary.descriptions.push(
        `Accounts: ${filters.accounts.length} selected`
      );
      summary.hasFilters = true;
    }

    if (filters.searchText && filters.searchText.trim() !== '') {
      summary.descriptions.push(`Search: "${filters.searchText}"`);
      summary.hasFilters = true;
    }

    summary.count = summary.descriptions.length;
    return summary;
  }

  /**
   * Clear all filters
   * @returns {Object} Empty filter object
   */
  static clearFilters() {
    return {
      dateRange: null,
      categories: [],
      categoryFilterType: 'include',
      amountRange: null,
      types: [],
      accounts: [],
      searchText: '',
      caseSensitive: false,
    };
  }
}
