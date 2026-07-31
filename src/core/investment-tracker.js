/**
 * Investment Tracker - Portfolio Management and Analysis
 *
 * Manages investment portfolio data and provides comprehensive analysis capabilities.
 * Supports manual entry, asset allocation analysis, and performance monitoring.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import { generateId } from '../utils/id-utils.js';
import { safeJsonParse } from '../utils/security-utils.js';

export class InvestmentTracker {
  constructor() {
    this.storageKey = 'blinkbudget_investments';
    this.investments = this._loadInvestments();
  }

  /**
   * Add a new investment to the portfolio
   * @param {string} symbol - Investment symbol/ticker
   * @param {number} shares - Number of shares
   * @param {number} purchasePrice - Price per share at purchase
   * @param {Date} purchaseDate - Date of purchase
   * @param {Object} metadata - Additional investment metadata
   * @returns {Object} Created investment object
   */
  addInvestment(symbol, shares, purchasePrice, purchaseDate, metadata = {}) {
    try {
      // Validate inputs
      if (!symbol || typeof symbol !== 'string') {
        throw new Error('Symbol is required and must be a string');
      }
      if (!shares || typeof shares !== 'number' || shares <= 0) {
        throw new Error('Shares must be a positive number');
      }
      if (
        !purchasePrice ||
        typeof purchasePrice !== 'number' ||
        purchasePrice <= 0
      ) {
        throw new Error('Purchase price must be a positive number');
      }
      if (!purchaseDate || !(purchaseDate instanceof Date)) {
        throw new Error('Purchase date must be a valid Date object');
      }

      const investment = {
        id: generateId(),
        symbol: symbol.toUpperCase().trim(),
        name: metadata.name || symbol.toUpperCase(),
        shares: Math.round(shares * 10000) / 10000, // Round to 4 decimal places
        purchasePrice: Math.round(purchasePrice * 100) / 100, // Round to 2 decimal places
        currentPrice: metadata.currentPrice || purchasePrice, // Use currentPrice from metadata or default to purchase price
        purchaseDate: new Date(purchaseDate),
        notes: metadata.notes || '',
        lastPriceUpdate:
          metadata.currentPrice && metadata.currentPrice !== purchasePrice
            ? new Date()
            : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { ...metadata },
      };

      this.investments.push(investment);
      this._saveInvestments();

      return investment;
    } catch (error) {
      console.error('Error adding investment:', error);
      throw error;
    }
  }

  /**
   * Update investment current price
   * @param {string} symbol - Investment symbol
   * @param {number} currentPrice - New current price
   * @returns {Object|null} Updated investment or null if not found
   */
  updateInvestmentValue(symbol, currentPrice) {
    try {
      if (typeof currentPrice !== 'number' || currentPrice <= 0) {
        throw new Error('Current price must be a positive number');
      }

      const investment = this.investments.find(
        inv => inv.symbol === symbol.toUpperCase()
      );
      if (!investment) {
        return null;
      }

      investment.currentPrice = Math.round(currentPrice * 100) / 100;
      investment.updatedAt = new Date();

      this._saveInvestments();
      return investment;
    } catch (error) {
      console.error('Error updating investment value:', error);
      throw error;
    }
  }

  /**
   * Remove an investment from the portfolio
   * @param {string} symbol - Investment symbol to remove
   * @returns {boolean} True if removed, false if not found
   */
  removeInvestment(symbol) {
    try {
      const index = this.investments.findIndex(
        inv => inv.symbol === symbol.toUpperCase()
      );
      if (index === -1) {
        return false;
      }

      this.investments.splice(index, 1);
      this._saveInvestments();
      return true;
    } catch (error) {
      console.error('Error removing investment:', error);
      throw error;
    }
  }

  /**
   * Update an existing investment's fields
   * @param {string} id - Investment id
   * @param {Object} updates - Fields to update (shares, purchasePrice, currentPrice, name, notes)
   * @returns {Object|null} Updated investment or null if not found
   */
  updateInvestment(id, updates = {}) {
    try {
      const investment = this.investments.find(
        inv => inv.id === id || inv.symbol === id
      );
      if (!investment) return null;

      const allowed = [
        'symbol',
        'shares',
        'purchasePrice',
        'currentPrice',
        'purchaseDate',
        'name',
        'notes',
        'metadata',
      ];
      allowed.forEach(key => {
        if (updates[key] !== undefined) {
          investment[key] = updates[key];
        }
      });

      investment.updatedAt = new Date();
      this._saveInvestments();
      return investment;
    } catch (error) {
      console.error('Error updating investment:', error);
      throw error;
    }
  }

  /**
   * Get all investments
   * @returns {Array} Array of investment objects
   */
  getAllInvestments() {
    return [...this.investments];
  }

  /**
   * Get investment by symbol
   * @param {string} symbol - Investment symbol
   * @returns {Object|null} Investment object or null if not found
   */
  getInvestment(symbol) {
    return (
      this.investments.find(inv => inv.symbol === symbol.toUpperCase()) || null
    );
  }

  /**
   * Calculate total portfolio value
   * @param {Array} investments - Optional specific investments array
   * @returns {number} Total portfolio value
   */
  calculatePortfolioValue(investments = null) {
    const investmentList = investments || this.investments;
    return investmentList.reduce((total, investment) => {
      return total + investment.shares * investment.currentPrice;
    }, 0);
  }

  /**
   * Calculate gains/losses for all investments
   * @param {Array} investments - Optional specific investments array
   * @returns {Object} Gains/losses summary
   */
  calculateGainsLosses(investments = null) {
    const investmentList = investments || this.investments;

    let totalCurrentValue = 0;
    let totalPurchaseValue = 0;
    const individualGains = [];

    investmentList.forEach(investment => {
      const currentValue = investment.shares * investment.currentPrice;
      const purchaseValue = investment.shares * investment.purchasePrice;
      const gainLoss = currentValue - purchaseValue;
      const gainLossPercentage =
        purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0;

      totalCurrentValue += currentValue;
      totalPurchaseValue += purchaseValue;

      individualGains.push({
        symbol: investment.symbol,
        name: investment.name,
        currentValue: Math.round(currentValue * 100) / 100,
        purchaseValue: Math.round(purchaseValue * 100) / 100,
        gainLoss: Math.round(gainLoss * 100) / 100,
        gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
        shares: investment.shares,
      });
    });

    const totalGainLoss = totalCurrentValue - totalPurchaseValue;
    const totalGainLossPercentage =
      totalPurchaseValue > 0 ? (totalGainLoss / totalPurchaseValue) * 100 : 0;

    return {
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
      totalGainLoss: Math.round(totalGainLoss * 100) / 100,
      totalGainLossPercentage: Math.round(totalGainLossPercentage * 100) / 100,
      individualGains,
    };
  }

  /**
   * Load investments from localStorage
   * @returns {Array} Array of investments
   */
  _loadInvestments() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const investments = safeJsonParse(stored);

      // Convert date strings back to Date objects (with validation)
      return investments
        .map(investment => {
          const pd = investment.purchaseDate
            ? new Date(investment.purchaseDate)
            : null;
          const ca = investment.createdAt
            ? new Date(investment.createdAt)
            : null;
          const ua = investment.updatedAt
            ? new Date(investment.updatedAt)
            : null;

          return {
            ...investment,
            purchaseDate: pd && !isNaN(pd.getTime()) ? pd : null,
            createdAt: ca && !isNaN(ca.getTime()) ? ca : new Date(),
            updatedAt: ua && !isNaN(ua.getTime()) ? ua : new Date(),
          };
        })
        .filter(investment => {
          if (!investment.purchaseDate) {
            console.warn(
              `Skipping investment ${investment.symbol} due to invalid purchaseDate`
            );
            return false;
          }
          return true;
        });
    } catch (error) {
      console.error('Error loading investments:', error);
      return [];
    }
  }

  /**
   * Save investments to localStorage
   */
  _saveInvestments() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.investments));

      // Dispatch storage update event
      window.dispatchEvent(
        new CustomEvent('storage-updated', {
          detail: { key: this.storageKey, data: this.investments },
        })
      );
    } catch (error) {
      console.error('Error saving investments:', error);
      throw error;
    }
  }

  /**
   * Clear all investments (for testing/reset)
   */
  clearAllInvestments() {
    this.investments = [];
    this._saveInvestments();
  }

  /**
   * Set multiple investments at once (for restore operations)
   * @param {Array} investments - Array of investment objects
   */
  batchSetInvestments(investments) {
    if (!Array.isArray(investments)) {
      throw new Error(
        '[InvestmentTracker] batchSetInvestments requires an array of investments'
      );
    }

    // Normalize date fields for each investment with validation
    const normalizedInvestments = investments
      .map(investment => {
        const pd = investment.purchaseDate
          ? new Date(investment.purchaseDate)
          : null;
        const ca = investment.createdAt ? new Date(investment.createdAt) : null;
        const ua = investment.updatedAt ? new Date(investment.updatedAt) : null;

        return {
          ...investment,
          purchaseDate: pd && !isNaN(pd.getTime()) ? pd : null,
          createdAt: ca && !isNaN(ca.getTime()) ? ca : new Date(),
          updatedAt: ua && !isNaN(ua.getTime()) ? ua : new Date(),
        };
      })
      .filter(investment => {
        if (!investment.purchaseDate) {
          console.warn(
            `[InvestmentTracker] Skipping investment ${investment.symbol || 'unknown'} due to invalid purchaseDate`
          );
          return false;
        }
        return true;
      });

    console.log(
      `[InvestmentTracker] Setting ${normalizedInvestments.length} investments`
    );
    this.investments = [...normalizedInvestments];
    this._saveInvestments();
    return [...this.investments]; // Return a copy to prevent mutation
  }
}

// Singleton instance
export const investmentTracker = new InvestmentTracker();
