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
import { PredictionService } from './analytics/PredictionService.js';
import { CategoryUsageService } from './analytics/category-usage-service.js';
import { AmountPresetService } from './amount-preset-service.js';
import { recommendationService } from './analytics/RecommendationService.js';
import { trendService } from './analytics/TrendService.js';
import comparisonService from './analytics/ComparisonService.js';

export class AnalyticsEngine {
  constructor() {
    // No caching needed - calculations are fast enough
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
    return MetricsService.calculateCategoryBreakdown(transactions, timePeriod);
  }

  /**
   * Calculate income vs expense summary
   */
  calculateIncomeVsExpenses(transactions, timePeriod) {
    return MetricsService.calculateIncomeVsExpenses(transactions, timePeriod);
  }

  /**
   * Calculate cost of living summary
   */
  calculateCostOfLiving(transactions, timePeriod) {
    return MetricsService.calculateCostOfLiving(transactions, timePeriod);
  }

  /**
   * Generate spending insights
   */
  generateSpendingInsights(transactions, currentPeriod, previousPeriod = null) {
    return InsightsService.generateSpendingInsights(
      transactions,
      currentPeriod,
      previousPeriod
    );
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
    return MetricsService.identifyTopCategories(
      transactions,
      timePeriod,
      topN
    );
  }

  /**
   * Predict future spending
   */
  predictFutureSpending(transactions, monthsToPredict = 3, options = {}) {
    return PredictionService.predictFutureSpending(
      transactions,
      monthsToPredict,
      options
    );
  }

  /**
   * Analyze frequency patterns for categories (simple implementation)
   */
  analyzeFrequencyPatterns(transactions, timePeriod, targetCategories = null) {
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
    return recommendationService.getOptimizationInsights(
      transactions,
      timePeriod
    );
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
    return trendService.detectSeasonalPatterns(categoryId, transactions);
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
    return comparisonService.comparePeriodsSpending(
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
    return comparisonService.getPersonalBenchmarking(transactions, timePeriod);
  }

  /**
   * Get historical insights for multiple periods
   * @param {Array} transactions - Transaction data
   * @param {Array} historicalPeriods - Array of historical periods
   * @returns {Object} Historical insights
   */
  getHistoricalInsights(transactions, historicalPeriods) {
    return comparisonService.getHistoricalInsights(
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
    return recommendationService.getRecommendedAmount(categoryId, transactions);
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
