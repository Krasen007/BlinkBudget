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
  }

  /**
   * Filter transactions by time period
   */
  filterTransactionsByTimePeriod(transactions, timePeriod) {
    return FilteringService.filterByTimePeriod(transactions, timePeriod);
  }

  /**
   * Calculate category breakdown for expenses
   */
  calculateCategoryBreakdown(transactions, timePeriod) {
    const cacheKey = `categoryBreakdown_${JSON.stringify(timePeriod)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = MetricsService.calculateCategoryBreakdown(
      transactions,
      timePeriod
    );
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate income vs expense summary
   */
  calculateIncomeVsExpenses(transactions, timePeriod) {
    const cacheKey = `incomeVsExpenses_${JSON.stringify(timePeriod)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = MetricsService.calculateIncomeVsExpenses(
      transactions,
      timePeriod
    );
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
   * Generate spending insights
   */
  generateSpendingInsights(transactions, currentPeriod, previousPeriod = null) {
    const cacheKey = `insights_${JSON.stringify(currentPeriod)}_${JSON.stringify(previousPeriod)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = InsightsService.generateSpendingInsights(
      transactions,
      currentPeriod,
      previousPeriod
    );
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
    this.cache.clear();
  }
  invalidateCache(pattern) {
    this.cache.invalidate(pattern);
  }
  getCacheStats() {
    return this.cache.getStats();
  }
  invalidateCacheOnDataUpdate() {
    this.cache.clear();
  }

  // Legacy/Internal methods - mostly proxied if still needed by other services
  // but many are now static in their respective services.
}
