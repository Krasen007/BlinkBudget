/**
 * Click Tracking Service
 * Measures user interactions from app launch to saved transaction
 * Tracks clicks, timing, and calculates averages for 3-click optimization
 */

import { STORAGE_KEYS } from '../utils/constants.js';

class ClickTrackingService {
  constructor() {
    this.sessionStart = null;
    this.currentSession = {
      clicks: 0,
      startTime: null,
      inProgress: false,
    };
    this.history = this.loadHistory();
  }

  /**
   * Initialize tracking when user starts a transaction flow
   */
  startTransactionFlow() {
    this.sessionStart = Date.now();
    this.currentSession = {
      clicks: 0,
      startTime: this.sessionStart,
      inProgress: true,
    };
  }

  /**
   * Record a click in the current transaction flow
   */
  recordClick() {
    if (this.currentSession.inProgress) {
      this.currentSession.clicks++;
    }
  }

  /**
   * Complete the transaction flow and save metrics
   */
  completeTransactionFlow() {
    if (!this.currentSession.inProgress) return null;

    const endTime = Date.now();
    const duration = (endTime - this.currentSession.startTime) / 1000; // Convert to seconds

    const metrics = {
      clicks: this.currentSession.clicks,
      duration: duration,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
    };

    // Save to history
    this.history.push(metrics);

    // Keep only last 100 transactions to prevent storage bloat
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }

    this.saveHistory();
    this.resetSession();

    return metrics;
  }

  /**
   * Cancel the current transaction flow
   */
  cancelTransactionFlow() {
    this.resetSession();
  }

  /**
   * Reset current session
   */
  resetSession() {
    this.currentSession = {
      clicks: 0,
      startTime: null,
      inProgress: false,
    };
    this.sessionStart = null;
  }

  /**
   * Get average metrics from history
   */
  getAverageMetrics() {
    if (this.history.length === 0) {
      return {
        averageClicks: 0,
        averageDuration: 0,
        totalTransactions: 0,
      };
    }

    const totalClicks = this.history.reduce(
      (sum, session) => sum + session.clicks,
      0
    );
    const totalDuration = this.history.reduce(
      (sum, session) => sum + session.duration,
      0
    );

    return {
      averageClicks: Math.round((totalClicks / this.history.length) * 10) / 10,
      averageDuration:
        Math.round((totalDuration / this.history.length) * 10) / 10,
      totalTransactions: this.history.length,
    };
  }

  /**
   * Get recent transactions (last 10) for detailed analysis
   */
  getRecentTransactions() {
    return this.history.slice(-10);
  }

  /**
   * Load history from localStorage
   */
  loadHistory() {
    try {
      const stored = localStorage.getItem(
        STORAGE_KEYS.CLICK_TRACKING || 'blinkbudget_click_tracking'
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load click tracking history:', error);
      return [];
    }
  }

  /**
   * Save history to localStorage
   */
  saveHistory() {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CLICK_TRACKING || 'blinkbudget_click_tracking',
        JSON.stringify(this.history)
      );
    } catch (error) {
      console.error('Failed to save click tracking history:', error);
    }
  }

  /**
   * Clear all tracking data
   */
  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Get current session status
   */
  getCurrentSessionStatus() {
    return {
      ...this.currentSession,
      currentDuration: this.currentSession.inProgress
        ? (Date.now() - this.currentSession.startTime) / 1000
        : 0,
    };
  }
}

// Export singleton instance
export const ClickTracker = new ClickTrackingService();
