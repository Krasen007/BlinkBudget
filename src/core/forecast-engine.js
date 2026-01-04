/**
 * Forecast Engine - Financial Forecasting with Statistical Methods
 *
 * Generates financial forecasts using proven statistical methods optimized for personal finance data.
 * Implements exponential smoothing, seasonal pattern detection, and recurring transaction analysis.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

export class ForecastEngine {
  constructor() {
    this.cache = new Map();
    this.defaultAlpha = 0.3; // Exponential smoothing parameter
    this.minDataPoints = 3; // Minimum months of data required
  }

  /**
   * Generate income forecasts for the specified number of months
   * @param {Array} transactions - Historical transaction data
   * @param {number} months - Number of months to forecast (default: 12)
   * @returns {Array} Array of forecast objects
   */
  generateIncomeForecasts(transactions, months = 12) {
    try {
      // Validate input
      if (!Array.isArray(transactions) || transactions.length === 0) {
        return this._generateBasicForecast('income', 0, months);
      }

      const incomeTransactions = transactions.filter(t => 
        t && t.type === 'income' && typeof t.amount === 'number' && t.timestamp
      );
      
      if (incomeTransactions.length < this.minDataPoints) {
        return this._generateBasicForecast('income', 0, months);
      }

      const monthlyData = this._aggregateByMonth(incomeTransactions);
      const seasonalPatterns = this.detectSeasonalPatterns(incomeTransactions);
      const recurringTransactions = this.identifyRecurringTransactions(incomeTransactions);

      const forecasts = [];
      const baseForecasts = this.exponentialSmoothing(monthlyData.values, this.defaultAlpha);
      const lastValue = baseForecasts[baseForecasts.length - 1] || 0;

      for (let i = 0; i < months; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i + 1);
        
        const monthIndex = futureDate.getMonth();
        const seasonalMultiplier = seasonalPatterns.income?.[monthIndex] || 1;
        const recurringAmount = this._getRecurringAmountForMonth(recurringTransactions, futureDate);
        
        const baseAmount = lastValue * seasonalMultiplier;
        const predictedAmount = Math.max(0, baseAmount + recurringAmount);
        
        const confidence = this._calculateConfidence(monthlyData.values, i);
        const confidenceInterval = this._calculateConfidenceInterval(predictedAmount, monthlyData.variance, i);

        forecasts.push({
          period: new Date(futureDate),
          predictedAmount: Math.round(predictedAmount * 100) / 100,
          confidenceInterval,
          confidence,
          method: recurringAmount > 0 ? 'recurring' : 'exponential_smoothing',
          seasonalFactor: seasonalMultiplier
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating income forecasts:', error);
      return this._generateBasicForecast('income', 0, months);
    }
  }

  /**
   * Generate expense forecasts for the specified number of months
   * @param {Array} transactions - Historical transaction data
   * @param {number} months - Number of months to forecast (default: 12)
   * @returns {Array} Array of forecast objects
   */
  generateExpenseForecasts(transactions, months = 12) {
    try {
      // Validate input
      if (!Array.isArray(transactions) || transactions.length === 0) {
        return this._generateBasicForecast('expense', 0, months);
      }

      const expenseTransactions = transactions.filter(t => 
        t && t.type === 'expense' && typeof t.amount === 'number' && t.timestamp
      );
      
      if (expenseTransactions.length < this.minDataPoints) {
        return this._generateBasicForecast('expense', 0, months);
      }

      const monthlyData = this._aggregateByMonth(expenseTransactions);
      const seasonalPatterns = this.detectSeasonalPatterns(expenseTransactions);
      const recurringTransactions = this.identifyRecurringTransactions(expenseTransactions);

      const forecasts = [];
      const baseForecasts = this.exponentialSmoothing(monthlyData.values, this.defaultAlpha);
      const lastValue = baseForecasts[baseForecasts.length - 1] || 0;

      for (let i = 0; i < months; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i + 1);
        
        const monthIndex = futureDate.getMonth();
        const seasonalMultiplier = seasonalPatterns.expense?.[monthIndex] || 1;
        const recurringAmount = this._getRecurringAmountForMonth(recurringTransactions, futureDate);
        
        const baseAmount = lastValue * seasonalMultiplier;
        const predictedAmount = Math.max(0, baseAmount + recurringAmount);
        
        const confidence = this._calculateConfidence(monthlyData.values, i);
        const confidenceInterval = this._calculateConfidenceInterval(predictedAmount, monthlyData.variance, i);

        forecasts.push({
          period: new Date(futureDate),
          predictedAmount: Math.round(predictedAmount * 100) / 100,
          confidenceInterval,
          confidence,
          method: recurringAmount > 0 ? 'recurring' : 'exponential_smoothing',
          seasonalFactor: seasonalMultiplier
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating expense forecasts:', error);
      return this._generateBasicForecast('expense', 0, months);
    }
  }

  /**
   * Detect seasonal patterns in transaction data
   * @param {Array} transactions - Transaction data
   * @returns {Object} Seasonal patterns by type and month
   */
  detectSeasonalPatterns(transactions) {
    try {
      const patterns = { income: new Array(12).fill(1), expense: new Array(12).fill(1) };
      
      // Filter valid transactions
      const validTransactions = transactions.filter(transaction => 
        transaction && 
        typeof transaction.amount === 'number' && 
        transaction.timestamp &&
        transaction.type
      );

      if (validTransactions.length < 12) {
        return patterns; // Not enough data for seasonal analysis
      }

      const monthlyTotals = { income: new Array(12).fill(0), expense: new Array(12).fill(0) };
      const monthlyCounts = { income: new Array(12).fill(0), expense: new Array(12).fill(0) };

      validTransactions.forEach(transaction => {
        try {
          const date = new Date(transaction.timestamp);
          if (isNaN(date.getTime())) {
            return; // Skip invalid dates
          }

          const month = date.getMonth();
          const type = transaction.type === 'income' ? 'income' : 'expense';
          
          monthlyTotals[type][month] += transaction.amount;
          monthlyCounts[type][month]++;
        } catch (error) {
          console.warn('Error processing transaction for seasonal analysis:', transaction, error);
        }
      });

      // Calculate average monthly amounts
      const monthlyAverages = { income: [], expense: [] };
      ['income', 'expense'].forEach(type => {
        for (let month = 0; month < 12; month++) {
          const avg = monthlyCounts[type][month] > 0 
            ? monthlyTotals[type][month] / monthlyCounts[type][month]
            : 0;
          monthlyAverages[type][month] = avg;
        }
      });

      // Calculate seasonal multipliers
      ['income', 'expense'].forEach(type => {
        const yearlyAverage = monthlyAverages[type].reduce((sum, val) => sum + val, 0) / 12;
        
        if (yearlyAverage > 0) {
          for (let month = 0; month < 12; month++) {
            patterns[type][month] = monthlyAverages[type][month] / yearlyAverage;
            // Cap extreme values
            patterns[type][month] = Math.max(0.5, Math.min(2.0, patterns[type][month]));
          }
        }
      });

      return patterns;
    } catch (error) {
      console.error('Error detecting seasonal patterns:', error);
      return { income: new Array(12).fill(1), expense: new Array(12).fill(1) };
    }
  }

  /**
   * Exponential smoothing algorithm
   * @param {Array} data - Time series data
   * @param {number} alpha - Smoothing parameter (0-1)
   * @returns {Array} Smoothed values
   */
  exponentialSmoothing(data, alpha = 0.3) {
    if (!data || data.length === 0) return [];

    const smoothed = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      const smoothedValue = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
      smoothed.push(smoothedValue);
    }

    return smoothed;
  }

  /**
   * Moving average calculation
   * @param {Array} data - Time series data
   * @param {number} windowSize - Window size for moving average
   * @returns {Array} Moving averages
   */
  movingAverage(data, windowSize = 3) {
    if (!data || data.length < windowSize) return data || [];

    const movingAverages = [];
    
    for (let i = windowSize - 1; i < data.length; i++) {
      const window = data.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
      movingAverages.push(average);
    }

    return movingAverages;
  }

  /**
   * Identify recurring transactions (monthly/weekly patterns)
   * @param {Array} transactions - Transaction data
   * @returns {Array} Recurring transaction patterns
   */
  identifyRecurringTransactions(transactions) {
    try {
      const recurringPatterns = [];
      const transactionGroups = new Map();

      // Filter out transactions without required properties
      const validTransactions = transactions.filter(transaction => 
        transaction && 
        typeof transaction.amount === 'number' && 
        transaction.timestamp &&
        (transaction.description || transaction.category)
      );

      // Group transactions by description and amount (with tolerance)
      validTransactions.forEach(transaction => {
        const key = this._generateRecurringKey(transaction);
        if (!transactionGroups.has(key)) {
          transactionGroups.set(key, []);
        }
        transactionGroups.get(key).push(transaction);
      });

      // Analyze each group for recurring patterns
      transactionGroups.forEach((group, key) => {
        if (group.length >= 3) { // Need at least 3 occurrences
          const pattern = this._analyzeRecurringPattern(group);
          if (pattern.isRecurring) {
            recurringPatterns.push({
              key,
              description: group[0].description || group[0].category || 'Unknown',
              averageAmount: pattern.averageAmount,
              frequency: pattern.frequency, // 'monthly', 'weekly', etc.
              confidence: pattern.confidence,
              lastOccurrence: new Date(Math.max(...group.map(t => new Date(t.timestamp))))
            });
          }
        }
      });

      return recurringPatterns;
    } catch (error) {
      console.error('Error identifying recurring transactions:', error);
      return [];
    }
  }

  /**
   * Calculate confidence intervals for forecasts
   * @param {number} forecast - Forecast value
   * @param {number} historicalVariance - Historical variance
   * @param {number} horizon - Forecast horizon (months ahead)
   * @returns {Object} Confidence interval
   */
  _calculateConfidenceInterval(forecast, historicalVariance, horizon) {
    const standardError = Math.sqrt(historicalVariance * (1 + horizon * 0.1));
    const margin = 1.96 * standardError; // 95% confidence interval

    return {
      lower: Math.max(0, forecast - margin),
      upper: forecast + margin
    };
  }

  /**
   * Calculate confidence level for forecasts
   * @param {Array} historicalData - Historical data points
   * @param {number} horizon - Forecast horizon
   * @returns {number} Confidence level (0-1)
   */
  _calculateConfidence(historicalData, horizon) {
    const dataPoints = historicalData.length;
    const baseConfidence = Math.min(1, dataPoints / 12); // More data = higher confidence
    const horizonPenalty = Math.max(0, 1 - (horizon * 0.05)); // Confidence decreases with horizon
    
    return Math.round((baseConfidence * horizonPenalty) * 100) / 100;
  }

  /**
   * Aggregate transactions by month
   * @param {Array} transactions - Transaction data
   * @returns {Object} Monthly aggregated data
   */
  _aggregateByMonth(transactions) {
    const monthlyTotals = new Map();
    
    // Filter out invalid transactions
    const validTransactions = transactions.filter(transaction => 
      transaction && 
      typeof transaction.amount === 'number' && 
      transaction.timestamp
    );

    validTransactions.forEach(transaction => {
      try {
        const date = new Date(transaction.timestamp);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid timestamp in transaction:', transaction);
          return;
        }
        
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyTotals.has(monthKey)) {
          monthlyTotals.set(monthKey, 0);
        }
        monthlyTotals.set(monthKey, monthlyTotals.get(monthKey) + transaction.amount);
      } catch (error) {
        console.warn('Error processing transaction for aggregation:', transaction, error);
      }
    });

    const values = Array.from(monthlyTotals.values());
    
    if (values.length === 0) {
      return { values: [0], mean: 0, variance: 0 };
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return { values, mean, variance };
  }

  /**
   * Generate basic forecast when insufficient data
   * @param {string} type - 'income' or 'expense'
   * @param {number} baseAmount - Base amount to use
   * @param {number} months - Number of months
   * @returns {Array} Basic forecast array
   */
  _generateBasicForecast(type, baseAmount, months) {
    const forecasts = [];
    
    for (let i = 0; i < months; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i + 1);
      
      forecasts.push({
        period: new Date(futureDate),
        predictedAmount: baseAmount,
        confidenceInterval: { lower: 0, upper: baseAmount * 1.5 },
        confidence: 0.1, // Very low confidence
        method: 'insufficient_data',
        seasonalFactor: 1
      });
    }

    return forecasts;
  }

  /**
   * Generate a key for grouping recurring transactions
   * @param {Object} transaction - Transaction object
   * @returns {string} Grouping key
   */
  _generateRecurringKey(transaction) {
    const description = (transaction.description || transaction.category || 'unknown').toLowerCase().trim();
    const roundedAmount = Math.round(transaction.amount / 10) * 10; // Group similar amounts
    return `${description}-${roundedAmount}`;
  }

  /**
   * Analyze a group of transactions for recurring patterns
   * @param {Array} transactions - Group of similar transactions
   * @returns {Object} Pattern analysis result
   */
  _analyzeRecurringPattern(transactions) {
    const dates = transactions.map(t => new Date(t.timestamp)).sort((a, b) => a - b);
    const amounts = transactions.map(t => t.amount);
    
    // Calculate intervals between transactions (in days)
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }

    // Determine if pattern is recurring
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const intervalVariance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const intervalStdDev = Math.sqrt(intervalVariance);
    
    // Consider recurring if intervals are consistent
    const isRecurring = intervalStdDev < (avgInterval * 0.3); // 30% tolerance
    
    let frequency = 'irregular';
    if (isRecurring) {
      if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly';
      else if (avgInterval >= 6 && avgInterval <= 8) frequency = 'weekly';
      else if (avgInterval >= 13 && avgInterval <= 15) frequency = 'biweekly';
    }

    const averageAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const confidence = isRecurring ? Math.min(1, transactions.length / 6) : 0;

    return {
      isRecurring,
      frequency,
      averageAmount,
      confidence,
      intervalDays: avgInterval
    };
  }

  /**
   * Get recurring amount for a specific month
   * @param {Array} recurringTransactions - Recurring transaction patterns
   * @param {Date} targetDate - Target month
   * @returns {number} Expected recurring amount
   */
  _getRecurringAmountForMonth(recurringTransactions, targetDate) {
    let totalRecurring = 0;

    recurringTransactions.forEach(pattern => {
      if (pattern.frequency === 'monthly' && pattern.confidence > 0.5) {
        totalRecurring += pattern.averageAmount;
      }
    });

    return totalRecurring;
  }

  /**
   * Clear forecast cache
   */
  clearCache() {
    this.cache.clear();
  }
}