/**
 * Smart Suggestions Service
 * Analyzes transaction history and provides intelligent suggestions
 * for amounts, categories, and notes to enable 3-click transaction entry
 */

import { TransactionService } from './transaction-service.js';
import { categoryIcons } from '../utils/category-icons.js';

export class SuggestionService {
  constructor() {
    this.cache = new Map();
    this.patterns = new Map();
    this.userHistory = [];
    this.lastAnalysis = null;
    this.confidenceThresholds = {
      high: 0.8,
      medium: 0.6,
      low: 0.4,
    };

    // Initialize with common patterns
    this.initializeCommonPatterns();
  }

  /**
   * Initialize common spending patterns
   */
  initializeCommonPatterns() {
    // Time-based patterns
    this.patterns.set('timePatterns', {
      '06:00-10:00': {
        categories: ['Храна', 'Заведения'],
        amounts: [4.5, 5.0, 8.0, 12.0],
        confidence: 0.7,
      },
      '11:00-14:00': {
        categories: ['Заведения', 'Храна'],
        amounts: [12.0, 15.0, 18.0, 25.0],
        confidence: 0.8,
      },
      '17:00-21:00': {
        categories: ['Заведения', 'Забавления'],
        amounts: [25.0, 35.0, 50.0, 75.0],
        confidence: 0.6,
      },
      '21:00-23:59': {
        categories: ['Забавления', 'Други'],
        amounts: [15.0, 20.0, 30.0],
        confidence: 0.5,
      },
    });

    // Amount range patterns
    this.patterns.set('amountRanges', {
      '0-5': {
        categories: ['Храна', 'Други'],
        confidence: 0.8,
      },
      '5-15': {
        categories: ['Заведения', 'Храна', 'Гориво'],
        confidence: 0.7,
      },
      '15-30': {
        categories: ['Гориво', 'Забавления'],
        confidence: 0.6,
      },
      '30-100': {
        categories: ['Сметки', 'Забавления', 'Други'],
        confidence: 0.7,
      },
      '100+': {
        categories: ['Сметки', 'Други'],
        confidence: 0.5,
      },
    });

    // Common merchant patterns
    this.patterns.set('merchantPatterns', {
      starbucks: {
        category: 'Храна',
        amounts: [4.5, 5.0, 6.0],
        notes: ['Starbucks кафе', 'Кафе сутрин', 'Кафе пауза'],
        confidence: 0.9,
      },
      shell: {
        category: 'Гориво',
        amounts: [25.0, 35.0, 50.0, 65.0],
        notes: ['Гориво', 'Танкване', 'Седмично гориво'],
        confidence: 0.8,
      },
      walmart: {
        category: 'Храна',
        amounts: [50.0, 100.0, 150.0, 200.0],
        notes: ['Хранителни стоки', 'Седмично пазаруване', 'Домашни потреби'],
        confidence: 0.8,
      },
      mcdonald: {
        category: 'Заведения',
        amounts: [8.0, 12.0, 15.0],
        notes: ['Обяд', 'Бързо хранене', 'Бързо ядене'],
        confidence: 0.8,
      },
    });
  }

  /**
   * Get amount suggestions based on context
   * @param {Object} context - Current context (time, recent transactions, etc.)
   * @returns {Array} Array of amount suggestions with confidence
   */
  async getAmountSuggestions(context = {}) {
    try {
      const cacheKey = `amount_${JSON.stringify(context)}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const suggestions = [];
      const now = new Date();
      const timeOfDay = this.getTimeOfDay(now);
      const dayOfWeek = now.getDay();

      // Get user's transaction history
      const transactions = await this.getUserTransactionHistory();

      // 1. Time-based suggestions
      const timePatterns = this.patterns.get('timePatterns');
      if (timePatterns[timeOfDay]) {
        const pattern = timePatterns[timeOfDay];
        pattern.amounts.forEach(amount => {
          suggestions.push({
            amount,
            category: pattern.categories[0],
            confidence: pattern.confidence,
            reason: `Time-based: ${timeOfDay}`,
            source: 'timePattern',
          });
        });
      }

      // 2. Recent amounts (last 10 transactions)
      const recentAmounts = transactions
        .slice(-10)
        .map(tx => tx.amount)
        .filter((amount, index, arr) => arr.indexOf(amount) === index) // unique
        .slice(0, 5);

      recentAmounts.forEach(amount => {
        const matchingTx = transactions.find(tx => tx.amount === amount);
        suggestions.push({
          amount,
          category: matchingTx?.category,
          confidence: 0.6,
          reason: 'Recent transaction',
          source: 'recent',
        });
      });

      // 3. Common amounts for this day of week
      const dayOfWeekAmounts = this.getCommonAmountsForDayOfWeek(
        transactions,
        dayOfWeek
      );
      dayOfWeekAmounts.forEach(({ amount, frequency }) => {
        suggestions.push({
          amount,
          confidence: Math.min(0.7, frequency * 0.1),
          reason: `Common on this day`,
          source: 'dayPattern',
        });
      });

      // 4. Most frequent amounts overall
      const frequentAmounts = this.getMostFrequentAmounts(transactions, 5);
      frequentAmounts.forEach(({ amount, frequency }) => {
        suggestions.push({
          amount,
          confidence: Math.min(0.5, frequency * 0.05),
          reason: 'Frequent overall',
          source: 'frequency',
        });
      });

      // Sort by confidence and amount, remove duplicates
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
      const sortedSuggestions = uniqueSuggestions
        .sort((a, b) => {
          if (b.confidence !== a.confidence) {
            return b.confidence - a.confidence;
          }
          return a.amount - b.amount;
        })
        .slice(0, 8); // Top 8 suggestions

      this.cache.set(cacheKey, sortedSuggestions);
      return sortedSuggestions;
    } catch (error) {
      console.warn('Error in getAmountSuggestions:', error);
      // Return basic time-based suggestions as fallback
      return this.getBasicTimeBasedSuggestions();
    }
  }

  /**
   * Get basic time-based suggestions as fallback
   * @returns {Array} Basic suggestions
   */
  getBasicTimeBasedSuggestions() {
    const suggestions = [];
    const now = new Date();
    const timeOfDay = this.getTimeOfDay(now);
    const timePatterns = this.patterns.get('timePatterns');

    if (timePatterns[timeOfDay]) {
      const pattern = timePatterns[timeOfDay];
      pattern.amounts.forEach(amount => {
        suggestions.push({
          amount,
          category: pattern.categories[0],
          confidence: pattern.confidence * 0.5, // Lower confidence for fallback
          reason: `Time-based fallback: ${timeOfDay}`,
          source: 'timePattern',
        });
      });
    }

    return suggestions.slice(0, 3); // Limit fallback suggestions
  }

  /**
   * Get category suggestions based on amount and context
   * @param {number} amount - Transaction amount
   * @param {Object} context - Additional context
   * @returns {Array} Array of category suggestions with confidence
   */
  async getCategorySuggestions(amount, context = {}) {
    const cacheKey = `category_${amount}_${JSON.stringify(context)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const suggestions = [];
    const transactions = await this.getUserTransactionHistory();
    const now = new Date();
    const timeOfDay = this.getTimeOfDay(now);

    // 1. Amount range patterns
    const amountRanges = this.patterns.get('amountRanges');
    const range = this.getAmountRange(amount);
    if (amountRanges[range]) {
      const pattern = amountRanges[range];
      pattern.categories.forEach(category => {
        suggestions.push({
          category,
          confidence: pattern.confidence,
          reason: `Amount range: ${range}`,
          source: 'amountRange',
        });
      });
    }

    // 2. Time-based patterns
    const timePatterns = this.patterns.get('timePatterns');
    if (timePatterns[timeOfDay]) {
      const pattern = timePatterns[timeOfDay];
      pattern.categories.forEach(category => {
        suggestions.push({
          category,
          confidence: pattern.confidence * 0.8, // Slightly lower for time-only
          reason: `Time-based: ${timeOfDay}`,
          source: 'timePattern',
        });
      });
    }

    // 3. Historical patterns for this amount
    const similarAmounts = transactions.filter(
      tx => Math.abs(tx.amount - amount) < amount * 0.2 // Within 20%
    );

    const categoryFrequency = {};
    similarAmounts.forEach(tx => {
      if (tx.category) {
        categoryFrequency[tx.category] =
          (categoryFrequency[tx.category] || 0) + 1;
      }
    });

    Object.entries(categoryFrequency).forEach(([category, frequency]) => {
      const confidence = Math.min(0.9, frequency / similarAmounts.length);
      suggestions.push({
        category,
        confidence,
        reason: `Historical pattern for $${amount}`,
        source: 'historical',
      });
    });

    // 4. Most used categories overall
    const categoryStats = this.getCategoryUsageStats(transactions);
    categoryStats.slice(0, 5).forEach(({ category, percentage }) => {
      suggestions.push({
        category,
        confidence: percentage * 0.3, // Lower confidence for general usage
        reason: 'Frequently used',
        source: 'frequency',
      });
    });

    // Sort and deduplicate
    const uniqueSuggestions = this.deduplicateCategorySuggestions(suggestions);
    const sortedSuggestions = uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);

    this.cache.set(cacheKey, sortedSuggestions);
    return sortedSuggestions;
  }

  /**
   * Get note suggestions for category and amount
   * @param {string} category - Transaction category
   * @param {number} amount - Transaction amount
   * @param {string} description - Current description (partial)
   * @returns {Array} Array of note suggestions
   */
  async getNoteSuggestions(category, amount, description = '') {
    const cacheKey = `notes_${category}_${amount}_${description}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const suggestions = [];
    const transactions = await this.getUserTransactionHistory();

    // 1. Category-specific common notes
    const categoryTransactions = transactions.filter(
      tx => tx.category === category
    );
    const noteFrequency = {};

    categoryTransactions.forEach(tx => {
      if (tx.description && tx.description.trim()) {
        const note = tx.description.trim().toLowerCase();
        noteFrequency[note] = (noteFrequency[note] || 0) + 1;
      }
    });

    // Get most common notes for this category
    Object.entries(noteFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([note, frequency]) => {
        suggestions.push({
          note: this.capitalizeFirst(note),
          confidence: Math.min(0.8, frequency / categoryTransactions.length),
          reason: `Common for ${category}`,
          source: 'category',
        });
      });

    // 2. Merchant pattern matching
    if (description) {
      const merchantPatterns = this.patterns.get('merchantPatterns');
      Object.entries(merchantPatterns).forEach(([merchant, pattern]) => {
        if (description.toLowerCase().includes(merchant)) {
          pattern.notes.forEach(note => {
            suggestions.push({
              note,
              confidence: pattern.confidence,
              reason: `Recognized merchant: ${merchant}`,
              source: 'merchant',
            });
          });
        }
      });
    }

    // 3. Amount-based patterns
    const similarAmountNotes = transactions
      .filter(tx => Math.abs(tx.amount - amount) < amount * 0.1)
      .map(tx => tx.description)
      .filter(desc => desc && desc.trim())
      .slice(0, 3);

    similarAmountNotes.forEach(note => {
      suggestions.push({
        note,
        confidence: 0.5,
        reason: 'Similar amount pattern',
        source: 'amount',
      });
    });

    // 4. Auto-complete based on current input
    if (description.length > 2) {
      const matchingNotes = categoryTransactions
        .map(tx => tx.description)
        .filter(
          desc =>
            desc && desc.toLowerCase().startsWith(description.toLowerCase())
        )
        .slice(0, 3);

      matchingNotes.forEach(note => {
        suggestions.push({
          note,
          confidence: 0.7,
          reason: 'Auto-complete',
          source: 'autocomplete',
        });
      });
    }

    // Deduplicate and sort
    const uniqueSuggestions = this.deduplicateNoteSuggestions(suggestions);
    const sortedSuggestions = uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    this.cache.set(cacheKey, sortedSuggestions);
    return sortedSuggestions;
  }

  /**
   * Get smart match for category based on all available context
   * @param {number} amount - Transaction amount
   * @param {Object} context - Additional context
   * @returns {Object|null} Best category match with confidence
   */
  async getSmartCategoryMatch(amount, context = {}) {
    const categorySuggestions = await this.getCategorySuggestions(
      amount,
      context
    );

    if (categorySuggestions.length === 0) {
      return null;
    }

    // Get the highest confidence suggestion
    const bestMatch = categorySuggestions[0];

    // Only return if confidence meets threshold
    if (bestMatch.confidence >= this.confidenceThresholds.medium) {
      return {
        category: bestMatch.category,
        confidence: bestMatch.confidence,
        reasoning: bestMatch.reason,
        alternatives: categorySuggestions.slice(1, 3), // Top 2 alternatives
      };
    }

    return null;
  }

  /**
   * Record user selection for learning
   * @param {string} type - Type of selection (amount, category, note)
   * @param {*} selected - What was selected
   * @param {Array} rejected - What was rejected/available
   */
  recordUserSelection(type, selected, rejected = []) {
    // This would integrate with a learning system
    // For now, just log for analytics
    console.log(`User selected ${type}:`, selected, 'rejected:', rejected);

    // Update patterns based on user behavior
    this.updateUserPatterns(type, selected, rejected);
  }

  /**
   * Get user's transaction history
   * @returns {Array} User transactions
   */
  async getUserTransactionHistory() {
    if (this.userHistory.length > 0) {
      return this.userHistory;
    }

    try {
      const transactions = TransactionService.getAll();
      this.userHistory = transactions;
      return transactions;
    } catch (error) {
      console.warn('Failed to load transaction history:', error);
      return [];
    }
  }

  /**
   * Get time of day category
   * @param {Date} date - Date to analyze
   * @returns {string} Time category
   */
  getTimeOfDay(date) {
    const hour = date.getHours();

    if (hour >= 6 && hour < 10) return '06:00-10:00';
    if (hour >= 11 && hour < 14) return '11:00-14:00';
    if (hour >= 17 && hour < 21) return '17:00-21:00';
    return '21:00-23:59';
  }

  /**
   * Get amount range category
   * @param {number} amount - Amount to categorize
   * @returns {string} Range category
   */
  getAmountRange(amount) {
    if (amount <= 5) return '0-5';
    if (amount <= 15) return '5-15';
    if (amount <= 30) return '15-30';
    if (amount <= 100) return '30-100';
    return '100+';
  }

  /**
   * Get common amounts for specific day of week
   * @param {Array} transactions - Transaction history
   * @param {number} dayOfWeek - Day of week (0-6)
   * @returns {Array} Common amounts with frequency
   */
  getCommonAmountsForDayOfWeek(transactions, dayOfWeek) {
    const dayTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getDay() === dayOfWeek;
    });

    const amountFrequency = {};
    dayTransactions.forEach(tx => {
      amountFrequency[tx.amount] = (amountFrequency[tx.amount] || 0) + 1;
    });

    return Object.entries(amountFrequency)
      .map(([amount, frequency]) => ({
        amount: parseFloat(amount),
        frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);
  }

  /**
   * Get most frequent amounts
   * @param {Array} transactions - Transaction history
   * @param {number} limit - Maximum number to return
   * @returns {Array} Frequent amounts with frequency
   */
  getMostFrequentAmounts(transactions, limit = 5) {
    const amountFrequency = {};
    transactions.forEach(tx => {
      amountFrequency[tx.amount] = (amountFrequency[tx.amount] || 0) + 1;
    });

    return Object.entries(amountFrequency)
      .map(([amount, frequency]) => ({
        amount: parseFloat(amount),
        frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Get category usage statistics
   * @param {Array} transactions - Transaction history
   * @returns {Array} Category usage stats
   */
  getCategoryUsageStats(transactions) {
    const categoryCount = {};
    const totalTransactions = transactions.length;

    transactions.forEach(tx => {
      if (tx.category) {
        categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
      }
    });

    return Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: count / totalTransactions,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Deduplicate suggestions by amount
   * @param {Array} suggestions - Array of suggestions
   * @returns {Array} Deduplicated suggestions
   */
  deduplicateSuggestions(suggestions) {
    const seen = new Set();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.amount}_${suggestion.category}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Deduplicate category suggestions
   * @param {Array} suggestions - Array of suggestions
   * @returns {Array} Deduplicated suggestions
   */
  deduplicateCategorySuggestions(suggestions) {
    const seen = new Set();
    return suggestions.filter(suggestion => {
      if (!suggestion || !suggestion.category) {
        return false; // Filter out invalid suggestions
      }
      const key = suggestion.category.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Deduplicate note suggestions
   * @param {Array} suggestions - Array of suggestions
   * @returns {Array} Deduplicated suggestions
   */
  deduplicateNoteSuggestions(suggestions) {
    const seen = new Set();
    return suggestions.filter(suggestion => {
      if (
        !suggestion ||
        suggestion.note === null ||
        suggestion.note === undefined
      ) {
        return false; // Filter out null/undefined notes
      }
      const key = suggestion.note.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Update user patterns based on selections
   * @param {string} _type - Type of selection
   * @param {*} _selected - Selected item
   * @param {Array} _rejected - Rejected items
   */
  updateUserPatterns(_type, _selected, _rejected) {
    // This would implement machine learning
    // For now, just update simple frequency counts
    // In a full implementation, this would update a model
  }

  /**
   * Clear suggestion cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Capitalize first letter of string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get confidence level for a score
   * @param {number} score - Confidence score (0-1)
   * @returns {string} Confidence level (high, medium, low)
   */
  getConfidenceLevel(score) {
    if (score >= this.confidenceThresholds.high) return 'high';
    if (score >= this.confidenceThresholds.medium) return 'medium';
    if (score >= this.confidenceThresholds.low) return 'low';
    return 'very_low';
  }
}

// Singleton instance
export const suggestionService = new SuggestionService();
