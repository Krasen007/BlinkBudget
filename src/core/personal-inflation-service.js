/**
 * Personal Inflation Service
 *
 * Calculates personal inflation rates based on user's spending patterns.
 * Focuses on how individual prices are changing over time for the user,
 * not general economic inflation.
 *
 * This helps users understand:
 * - Which categories are costing more over time
 * - How their personal purchasing power is changing
 * - Where to focus budget adjustments
 */

export const PersonalInflationService = {
  /**
   * Calculate personal inflation rate for a specific category
   * @param {Array} transactions - All transactions
   * @param {string} category - Category to analyze
   * @param {number} monthsBack - Number of months to look back (default: 12)
   * @param {string} method - Calculation method: 'average' or 'median' (default: 'average')
   * @returns {number} Personal inflation rate as decimal (0.15 = 15%)
   */
  calculateCategoryInflation(transactions, category, monthsBack = 12, method = 'average', referenceDate = new Date()) {
    const categoryTransactions = transactions
      .filter(t => t.category === category && t.type === 'expense')
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (categoryTransactions.length < 2) return 0;
    
    // Group transactions by month
    // We look back monthsBack to get the starting point, and we need data up to referenceDate
    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    // Move cutoff to start of that month to ensure we get full data
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);
    
    const endWindow = new Date(referenceDate);
    
    const monthlyGroups = {};
    categoryTransactions
      .filter(t => {
        const d = new Date(t.timestamp);
        return d >= cutoff && d <= endWindow;
      })
      .forEach(t => {
        const month = t.timestamp.substring(0, 7);
        if (!monthlyGroups[month]) monthlyGroups[month] = [];
        monthlyGroups[month].push(t.amount);
      });
    
    const months = Object.keys(monthlyGroups).sort();
    if (months.length < 2) return 0;
    
    const oldestMonth = months[0];
    const newestMonth = months[months.length - 1];
    
    let oldVal, recentVal;
    
    if (method === 'median') {
      const getMedian = (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      };
      oldVal = getMedian(monthlyGroups[oldestMonth]);
      recentVal = getMedian(monthlyGroups[newestMonth]);
    } else {
      const getAvg = (arr) => arr.reduce((sum, a) => sum + a, 0) / arr.length;
      oldVal = getAvg(monthlyGroups[oldestMonth]);
      recentVal = getAvg(monthlyGroups[newestMonth]);
    }
    
    if (oldVal === 0) return 0;
    return (recentVal - oldVal) / oldVal;
  },

  /**
   * Get monthly average spending for a category
   * @param {Array} transactions - Category transactions
   * @param {number} monthsBack - Number of months to analyze
   * @param {Date} referenceDate - Reference date (default: now)
   * @returns {Array} Array of monthly averages (most recent first)
   */
  getMonthlyAverages(transactions, monthsBack, referenceDate = new Date()) {
    const monthly = {};
    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    cutoff.setDate(1);
    
    const endWindow = new Date(referenceDate);
    
    transactions
      .filter(t => {
        const d = new Date(t.timestamp);
        return d >= cutoff && d <= endWindow;
      })
      .forEach(t => {
        const month = t.timestamp.substring(0, 7); // YYYY-MM
        monthly[month] = (monthly[month] || []).concat(t.amount);
      });
    
    // Calculate averages for each month and sort by date (most recent first)
    return Object.entries(monthly)
      .map(([month, amounts]) => ({
        month,
        average: amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .map(item => item.average);
  },

  /**
   * Get top categories by personal inflation impact
   * @param {Array} transactions - All transactions
   * @param {number} count - Number of top categories to return (default: 9)
   * @param {number} monthsBack - Number of months to analyze (default: 12)
   * @param {string} method - Calculation method (default: 'average')
   * @returns {Array} Top categories with inflation data
   */
  getTopInflationCategories(transactions, count = 9, monthsBack = 12, method = 'average', referenceDate = new Date()) {
    const categories = [...new Set(transactions
      .filter(t => t.type === 'expense')
      .map(t => t.category))];
    
    const categoryInflation = categories.map(category => {
      const inflationRate = this.calculateCategoryInflation(transactions, category, monthsBack, method, referenceDate);
      const trend = this.getTrendDirection(inflationRate);
      
      return {
        category,
        inflationRate,
        totalSpending: transactions
          .filter(t => t.category === category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        trend // 'up', 'down', or 'stable'
      };
    });
    
    return categoryInflation
      .filter(c => c.inflationRate !== 0 && !isNaN(c.inflationRate))
      .sort((a, b) => Math.abs(b.inflationRate) - Math.abs(a.inflationRate))
      .slice(0, count);
  },

  /**
   * Get trend direction for visual indicators
   * @param {number} inflationRate - Inflation rate as decimal
   * @returns {string} Trend direction: 'up', 'down', or 'stable'
   */
  getTrendDirection(inflationRate) {
    if (inflationRate > 0.05) return 'up';      // >5% inflation
    if (inflationRate < -0.05) return 'down';    // >5% deflation
    return 'stable';                              // +/-5% range
  },

  /**
   * Get monthly spending data for chart visualization
   * @param {Array} transactions - All transactions
   * @param {string} category - Category to analyze
   * @param {number} monthsBack - Number of months to analyze
   * @param {Date} referenceDate - Reference date (default: now)
   * @returns {Array} Monthly spending data
   */
  getMonthlySpendingData(transactions, category, monthsBack, referenceDate = new Date()) {
    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    cutoff.setDate(1);
    
    const endWindow = new Date(referenceDate);
    
    const monthlySpending = {};
    
    transactions
      .filter(t => {
        const d = new Date(t.timestamp);
        return t.category === category && 
               t.type === 'expense' && 
               d >= cutoff && 
               d <= endWindow;
      })
      .forEach(t => {
        const month = t.timestamp.substring(0, 7);
        monthlySpending[month] = (monthlySpending[month] || 0) + t.amount;
      });
    
    return Object.entries(monthlySpending).map(([month, amount]) => ({
      month,
      amount
    })).sort((a, b) => a.month.localeCompare(b.month));
  },

  /**
   * Validate if there's enough data for meaningful inflation analysis
   * @param {Array} transactions - All transactions
   * @param {string} category - Category to check
   * @param {number} monthsBack - Number of months to check
   * @returns {Object} Validation result with hasData and reason
   */
  validateCategoryData(transactions, category, monthsBack = 12) {
    const categoryTransactions = transactions
      .filter(t => t.category === category && t.type === 'expense');
    
    if (categoryTransactions.length < 2) {
      return { 
        hasData: false, 
        reason: 'Not enough transactions in this category' 
      };
    }
    
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    
    const recentTransactions = categoryTransactions
      .filter(t => new Date(t.timestamp) >= cutoff);
    
    if (recentTransactions.length < 2) {
      return { 
        hasData: false, 
        reason: `Need more than ${monthsBack} months of data` 
      };
    }
    
    const monthlyData = this.getMonthlyAverages(categoryTransactions, monthsBack);
    if (monthlyData.length < 2) {
      return { 
        hasData: false, 
        reason: 'Need spending in multiple months' 
      };
    }
    
    return { hasData: true };
  }
};
