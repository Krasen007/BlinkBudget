import { recommendationService } from './analytics/RecommendationService.js';
import { trendService } from './analytics/TrendService.js';
import { ComparisonService } from './analytics/ComparisonService.js';
/**
 * Analytics Engine for BlinkBudget Reports & Insights
 *
 * Processes raw transaction data to generate insights, calculations, and analytics.
 * This file acts as a facade orchestrating specialized services.
 *
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2
 */

import { FilteringService } from './analytics/FilteringService.js';
import { MetricsService } from './analytics/MetricsService.js';
import { InsightsService } from './analytics/InsightsService.js';
import { AnomalyService } from './analytics/AnomalyService.js';
import { AnalyticsCache } from './analytics/AnalyticsCache.js';
import { PredictionService } from './analytics/PredictionService.js';
import { CategoryUsageService } from './analytics/category-usage-service.js';
import { AmountPresetService } from './amount-preset-service.js';

export class AnalyticsEngine {
  constructor() {
    this.cache = new AnalyticsCache();
    this.memoizedCalculations = new Map();
    this.dataVersion = Date.now(); // Track data changes for cache invalidation
  }

  /**
   * Memoize expensive calculations with TTL
   */
  memoize(key, calculation, ttlMs = 300000) {
    // 5 minutes default TTL
    const cached = this.memoizedCalculations.get(key);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      // Return Promise for async calculations, raw value for sync
      return cached.isPromise ? Promise.resolve(cached.result) : cached.result;
    }

    const result = calculation();

    // Handle Promise results
    if (result && typeof result.then === 'function') {
      // Store the pending Promise immediately so callers get the same in-flight promise
      this.memoizedCalculations.set(key, {
        result,
        timestamp: Date.now(),
        isPromise: true,
      });

      result
        .then(resolvedValue => {
          // Replace cached entry with resolved value and updated timestamp
          this.memoizedCalculations.set(key, {
            result: resolvedValue,
            timestamp: Date.now(),
            isPromise: true,
          });
        })
        .catch(error => {
          // Remove cache entry on rejection to avoid caching failures
          this.memoizedCalculations.delete(key);
          console.warn(
            'Memoized calculation failed, cache entry removed:',
            error
          );
        });

      return result;
    }

    // Non-Promise result - cache immediately
    this.memoizedCalculations.set(key, {
      result,
      timestamp: Date.now(),
      isPromise: false,
    });
    return result;
  }

  /**
   * Generate optimized cache key with better hit rates
   */
  generateOptimizedCacheKey(baseKey, params = {}) {
    const paramHash = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${baseKey}_${paramHash}_${this.dataVersion}`;
  }

  // Create a short, deterministic signature for a transactions array to include
  // in cache keys without embedding the full payload. This avoids very large
  // cache keys while still ensuring different transaction sets produce
  // different keys.
  _transactionsSignature(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0)
      return 'none';

    // Use a stronger hash algorithm than the original djb2-style
    let combinedData = '';

    // Serialize each transaction into a consistent string format
    for (const t of transactions) {
      const s = `${t.id || ''}|${t.date || t.timestamp || ''}|${t.amount ?? t.value ?? 0}|${t.category || ''}|${t.payee || ''}|${t.description || ''}`;
      combinedData += s;
    }

    // Improved hash algorithm for browser compatibility - stronger than original
    let hash = 5381;
    for (let i = 0; i < combinedData.length; i++) {
      hash = ((hash << 5) + hash) ^ combinedData.charCodeAt(i);
    }

    // Convert to hex and truncate to first 16 characters
    const hashHex = Math.abs(hash)
      .toString(16)
      .padStart(8, '0')
      .substring(0, 16);
    return `${transactions.length}_${hashHex}`;
  }

  /**
   * Filter transactions by time period
   */
  filterTransactionsByTimePeriod(transactions, timePeriod) {
    return FilteringService.filterByTimePeriod(transactions, timePeriod);
  }

  /**
   * Calculate category breakdown for expenses (optimized)
   */
  calculateCategoryBreakdown(transactions, timePeriod) {
    // Use a transactions signature in the key so different datasets don't collide.
    // Use memoize(...) exclusively here to avoid duplicate TTL semantics with
    // AnalyticsCache (memoize handles short-lived in-memory TTLs reliably).
    const txSig = this._transactionsSignature(transactions);
    const cacheKey = this.generateOptimizedCacheKey('categoryBreakdown', {
      timePeriod,
      txSig,
    });

    const result = this.memoize(cacheKey, () => {
      return MetricsService.calculateCategoryBreakdown(
        transactions,
        timePeriod
      );
    });

    return result;
  }

  /**
   * Calculate income vs expense summary (optimized)
   */
  calculateIncomeVsExpenses(transactions, timePeriod) {
    const txSig = this._transactionsSignature(transactions);
    const cacheKey = this.generateOptimizedCacheKey('incomeVsExpenses', {
      timePeriod,
      txSig,
    });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = this.memoize(cacheKey, () => {
      return MetricsService.calculateIncomeVsExpenses(transactions, timePeriod);
    });

    // Set in both caches for expected test behavior
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate cost of living summary
   */
  calculateCostOfLiving(transactions, timePeriod) {
    const cacheKey = `costOfLiving_${JSON.stringify(timePeriod)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = MetricsService.calculateCostOfLiving(
      transactions,
      timePeriod
    );
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Generate spending insights (optimized)
   */
  generateSpendingInsights(transactions, currentPeriod, previousPeriod = null) {
    const txSig = this._transactionsSignature(transactions);
    const cacheKey = this.generateOptimizedCacheKey('insights', {
      currentPeriod,
      previousPeriod,
      txSig,
    });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = this.memoize(cacheKey, () => {
      return InsightsService.generateSpendingInsights(
        transactions,
        currentPeriod,
        previousPeriod
      );
    });

    // Set in both caches for expected test behavior
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Detect spending anomalies
   */
  detectSpendingAnomalies(transactions, currentPeriod) {
    return AnomalyService.detectAnomalies(transactions, currentPeriod);
  }

  /**
   * Identify top spending categories
   */
  identifyTopSpendingCategories(transactions, timePeriod, topN = 5) {
    const cacheKey = `topCategories_${JSON.stringify(timePeriod)}_${topN}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = MetricsService.identifyTopCategories(
      transactions,
      timePeriod,
      topN
    );
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Predict future spending
   */
  predictFutureSpending(transactions, monthsToPredict = 3, options = {}) {
    const cacheKey = `prediction_${monthsToPredict}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = PredictionService.predictFutureSpending(
      transactions,
      monthsToPredict,
      options
    );
    this.cache.set(cacheKey, result);
    return result;
  }


  /**
   * Analyze frequency patterns for categories (simple implementation)
   */
  analyzeFrequencyPatterns(transactions, timePeriod, targetCategories = null) {
    const cacheKey = `frequency_${JSON.stringify(timePeriod)}_${JSON.stringify(targetCategories || [])}_${this._transactionsSignature(transactions)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Filter transactions by time period
    let filteredTransactions = FilteringService.filterByTimePeriod(
      transactions,
      timePeriod
    );

    // Further filter by target categories if provided
    if (targetCategories && targetCategories.length > 0) {
      filteredTransactions = filteredTransactions.filter(t =>
        targetCategories.includes(t.category)
      );
    }

    // Calculate frequency per category
    const categoryFrequency = {};
    filteredTransactions.forEach(t => {
      if (t.category) {
        categoryFrequency[t.category] =
          (categoryFrequency[t.category] || 0) + 1;
      }
    });

    // Convert to array format expected by CategorySelector
    const categories = Object.entries(categoryFrequency).map(
      ([category, count]) => ({
        category,
        count,
        frequency: count,
      })
    );

    this.cache.set(cacheKey, { categories });
    return { categories };
  }

  // ========== Quick Amount Presets (Feature 3.4.1) ==========

  /**
   * Get the current top 4 amount presets
   * @returns {Array} Array of preset amounts sorted by frequency
   */
  getAmountPresets() {
    return AmountPresetService.getPresets();
  }

  /**
   * Record an amount usage when a transaction is submitted
   * @param {number} amount - The transaction amount to record
   */
  recordAmountPreset(amount) {
    AmountPresetService.recordAmount(amount);
  }

  /**
   * Recalculate presets from transaction history
   * @returns {Array} Updated presets array
   */
  calculateAmountPresets() {
    return AmountPresetService.getPresets();
  }

  /**
   * Clear all amount presets
   */
  resetAmountPresets() {
    AmountPresetService.resetPresets();
  }

  // ========== Category Usage Analytics (Feature 3.2.2) ==========

  /**
   * Get usage statistics for all categories
   * @returns {Object} Category usage statistics
   */
  getCategoryUsageStats() {
    return CategoryUsageService.getCategoryUsageStats();
  }

  /**
   * Get top N most frequently used categories
   * @param {number} limit - Number of categories to return
   * @returns {Array} Top categories by frequency
   */
  getMostFrequentCategories(limit = 5) {
    return CategoryUsageService.getMostFrequentCategories(limit);
  }

  /**
   * Get trend data for a specific category
   * @param {string} categoryId - Category name/ID
   * @returns {Object} Category trend data
   */
  getCategoryTrends(categoryId) {
    return CategoryUsageService.getCategoryTrends(categoryId);
  }

  /**
   * Update category usage from transactions
   * @param {Array} transactions - Array of transactions to process
   */
  updateCategoryUsage(transactions) {
    CategoryUsageService.updateFromTransactions(transactions);
  }

  /**
   * Clear category usage data
   */
  resetCategoryUsage() {
    CategoryUsageService.resetUsageData();
  }

  // Cache management (proxied to AnalyticsCache)
  clearCache() {
    this.memoizedCalculations.clear();
    this.cache.clearAll();
  }
  invalidateCache(pattern) {
    this.dataVersion = Date.now();
    this.memoizedCalculations.clear();
    this.cache.invalidate(pattern);
  }
  getCacheStats() {
    return this.cache.getStats();
  }
  invalidateCacheOnDataUpdate() {
    this.cache.clearAll();
  }

  // Legacy/Internal methods - mostly proxied if still needed by other services
  // but many are now static in their respective services.

  // ========== Recommendation Service (Feature 3.3.1 & 3.3.3) ==========

  /**
   * Generate optimization insights
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period
   * @returns {Array} Optimization insights
   */
  getOptimizationInsights(transactions, timePeriod) {
    return recommendationService.getOptimizationInsights(transactions, timePeriod);
  }

  /**
   * Get total savings potential
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period
   * @returns {Object} Savings potential breakdown
   */
  getSavingsPotential(transactions, timePeriod) {
    return recommendationService.getSavingsPotential(transactions, timePeriod);
  }

  /**
   * Get alternative suggestions for a category
   * @param {string} categoryId - Category name
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period
   * @returns {Array} Alternative suggestions
   */
  getAlternativeSuggestions(categoryId, transactions, timePeriod) {
    return recommendationService.getAlternativeSuggestions(
      categoryId,
      transactions,
      timePeriod
    );
  }

  /**
   * Dismiss an optimization insight
   * @param {string} insightId - Insight ID
   */
  dismissOptimizationInsight(insightId) {
    recommendationService.dismissInsight(insightId);
  }

  /**
   * Get optimization stats
   * @returns {Object} Optimization statistics
   */
  getOptimizationStats() {
    return recommendationService.getStats();
  }

  // ========== Trend Service (Feature 3.3.2) ==========

  /**
   * Get trend analysis for categories
   * @param {string|null} categoryId - Category to analyze
   * @param {Array} transactions - Transaction data
   * @returns {Object} Trend analysis results
   */
  getTrendAnalysis(categoryId, transactions) {
    return trendService.getTrendAnalysis(categoryId, transactions);
  }

  /**
   * Get consistency scores
   * @param {Array} transactions - Transaction data
   * @returns {Object} Consistency scores
   */
  getConsistencyScores(transactions) {
    return trendService.getConsistencyScores(transactions);
  }

  /**
   * Detect seasonal patterns
   * @param {string} categoryId - Category to analyze
   * @param {Array} transactions - Transaction data
   * @returns {Object} Seasonal pattern data
   */
  detectSeasonalPatterns(categoryId, transactions) {
    return trendService.detectSeasonalPatterns(
      categoryId,
      transactions
    );
  }

  /**
   * Get spending direction
   * @param {string} categoryId - Category to analyze
   * @param {Array} transactions - Transaction data
   * @returns {Object} Spending direction
   */
  getSpendingDirection(categoryId, transactions) {
    return trendService.getSpendingDirection(categoryId, transactions);
  }

  // ========== Comparison Service (Feature 3.3.3) ==========

  /**
   * Compare spending patterns between periods
   * @param {Array} transactions - Transaction data
   * @param {Object} currentPeriod - Current time period
   * @param {Object} comparisonPeriod - Previous time period
   * @returns {Object} Comparison results
   */
  comparePeriodsSpending(transactions, currentPeriod, comparisonPeriod) {
    return ComparisonService.comparePeriodsSpending(
      transactions,
      currentPeriod,
      comparisonPeriod
    );
  }

  /**
   * Get personal benchmarking data - compare current vs last month
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period
   * @returns {Array} Benchmarking data
   */
  getPersonalBenchmarking(transactions, timePeriod) {
    return ComparisonService.getPersonalBenchmarking(
      transactions,
      timePeriod
    );
  }

  /**
   * Get historical insights for multiple periods
   * @param {Array} transactions - Transaction data
   * @param {Array} historicalPeriods - Array of historical periods
   * @returns {Object} Historical insights
   */
  getHistoricalInsights(transactions, historicalPeriods) {
    return ComparisonService.getHistoricalInsights(
      transactions,
      historicalPeriods
    );
  }

  // ========== Recommendation Service (Feature 3.3.4) ==========

  /**
   * Get percentile rankings for categories
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period
   * @returns {Array} Percentile rankings
   */
  getPercentileRankings(transactions, timePeriod) {
    return recommendationService.getPercentileRankings(
      transactions,
      timePeriod
    );
  }

  /**
   * Get budget recommendations based on historical spending
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period
   * @returns {Array} Budget recommendations
   */
  getBudgetRecommendations(transactions, timePeriod) {
    return recommendationService.getBudgetRecommendations(
      transactions,
      timePeriod
    );
  }

  /**
   * Get recommended amount for a specific category
   * @param {string} categoryId - Category name
   * @param {Array} transactions - Transaction data
   * @returns {Object} Recommended amount
   */
  getRecommendedAmount(categoryId, transactions) {
    return recommendationService.getRecommendedAmount(
      categoryId,
      transactions
    );
  }

  /**
   * Get seasonal adjustments for categories
   * @param {string} categoryId - Category name
   * @param {Array} transactions - Transaction data
   * @returns {Object} Seasonal adjustments
   */
  getSeasonalAdjustments(categoryId, transactions) {
    return recommendationService.getSeasonalAdjustments(
      categoryId,
      transactions
    );
  }
}
