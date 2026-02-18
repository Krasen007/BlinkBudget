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
import { ComparisonService } from './analytics/ComparisonService.js';
import { PatternAnalyzer } from './analytics/pattern-analyzer.js';

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
      return cached.result;
    }

    const result = calculation();

    // Handle Promise results
    if (result && typeof result.then === 'function') {
      // Store the pending Promise immediately so callers get the same in-flight promise
      this.memoizedCalculations.set(key, {
        result,
        timestamp: Date.now(),
      });

      result
        .then(resolvedValue => {
          // Replace cached entry with resolved value and updated timestamp
          this.memoizedCalculations.set(key, {
            result: resolvedValue,
            timestamp: Date.now(),
          });
        })
        .catch(error => {
          // Remove cache entry on rejection to avoid caching failures
          this.memoizedCalculations.delete(key);
          console.warn('Memoized calculation failed, cache entry removed:', error);
        });

      return result;
    }

    // Non-Promise result - cache immediately
    this.memoizedCalculations.set(key, {
      result,
      timestamp: Date.now(),
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
    let h = 0;
    for (const t of transactions) {
      const s = `${t.id || ''}|${t.date || t.timestamp || ''}|${t.amount ?? t.value ?? 0}|${t.category || ''}|${t.payee || ''}|${t.description || ''}`;
      for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0; // force 32-bit int
      }
    }
    return `${transactions.length}_${Math.abs(h).toString(36)}`;
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
   * Compare spending patterns between periods
   */
  comparePeriodsSpending(transactions, currentPeriod, comparisonPeriod) {
    const cacheKey = `comparison_${JSON.stringify(currentPeriod)}_${JSON.stringify(comparisonPeriod)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = ComparisonService.comparePeriodsSpending(
      transactions,
      currentPeriod,
      comparisonPeriod
    );
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get historical insights
   */
  getHistoricalInsights(transactions, historicalPeriods) {
    const cacheKey = `historicalInsights_${JSON.stringify(historicalPeriods)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = ComparisonService.getHistoricalInsights(
      transactions,
      historicalPeriods
    );
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Analyze weekday vs weekend spending patterns
   */
  analyzeWeekdayVsWeekend(transactions, timePeriod) {
    const cacheKey = `weekdayWeekend_${JSON.stringify(timePeriod)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = PatternAnalyzer.analyzeWeekdayVsWeekend(
      transactions,
      timePeriod
    );
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Analyze time-of-day spending patterns
   */
  analyzeTimeOfDayPatterns(transactions, timePeriod) {
    const cacheKey = `timeOfDay_${JSON.stringify(timePeriod)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = PatternAnalyzer.analyzeTimeOfDayPatterns(
      transactions,
      timePeriod
    );
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Analyze frequency patterns for categories
   */
  analyzeFrequencyPatterns(transactions, timePeriod, targetCategories = null) {
    const cacheKey = `frequency_${JSON.stringify(timePeriod)}_${JSON.stringify(targetCategories || [])}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = PatternAnalyzer.analyzeFrequencyPatterns(
      transactions,
      timePeriod,
      targetCategories
    );
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Generate trend alerts and warnings
   */
  generateTrendAlerts(transactions, timePeriod, previousPeriod = null) {
    const cacheKey = `trends_${JSON.stringify(timePeriod)}_${JSON.stringify(previousPeriod || {})}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = PatternAnalyzer.generateTrendAlerts(
      transactions,
      timePeriod,
      previousPeriod
    );
    this.cache.set(cacheKey, result);
    return result;
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
}
