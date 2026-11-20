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
   * @param {Object|string} metadata - Additional investment metadata (name, currentPrice, notes) or a plain notes string
   * @returns {Object} Created investment object
   */
  addInvestment(symbol, shares, purchasePrice, purchaseDate, metadata = '') {
    try {
      // Validate inputs
      if (!symbol || typeof symbol !== 'string') {
        throw new Error('Symbol is required and must be a string');
      }
      if (!Number.isFinite(shares) || shares <= 0) {
        throw new Error('Shares must be a positive number');
      }
      if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
        throw new Error('Purchase price must be a positive number');
      }
      if (!purchaseDate || !(purchaseDate instanceof Date)) {
        throw new Error('Purchase date must be a valid Date object');
      }

      // Normalize metadata: accept either an object { name, currentPrice, notes }
      // or a plain notes string (backward compatible).
      const meta =
        metadata && typeof metadata === 'object'
          ? metadata
          : { notes: metadata };
      const notes = typeof meta.notes === 'string' ? meta.notes : '';
      const name =
        typeof meta.name === 'string' && meta.name.trim() !== ''
          ? meta.name.trim()
          : symbol.toUpperCase().trim();
      const currentPrice =
        Number.isFinite(meta.currentPrice) && meta.currentPrice > 0
          ? meta.currentPrice
          : purchasePrice;

      const investment = {
        id: generateId(),
        symbol: symbol.toUpperCase().trim(),
        name,
        shares: Number(shares),
        purchasePrice: Math.round(purchasePrice * 100) / 100, // Round to 2 decimal places
        currentPrice: Math.round(currentPrice * 100) / 100, // Round to 2 decimal places
        purchaseDate: new Date(purchaseDate),
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
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
   * Remove an entire holding from the portfolio (all lots for the symbol)
   * @param {string} symbol - Investment symbol to remove
   * @returns {boolean} True if any lots were removed, false if not found
   */
  removeInvestment(symbol) {
    try {
      if (!symbol || typeof symbol !== 'string') {
        return false;
      }
      const target = symbol.toUpperCase().trim();
      const before = this.investments.length;
      this.investments = this.investments.filter(inv => inv.symbol !== target);
      if (this.investments.length === before) {
        return false;
      }

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
   * Group investments by symbol into holdings, computing aggregate stats
   * (total shares, average cost per share, current value, gain/loss) along
   * with the individual purchase lots that make up each holding.
   *
   * This is what makes dollar-cost-averaged positions readable: multiple
   * purchases of the same symbol (e.g. BTC at 55000, 54500, 66000) roll up
   * into one holding showing the average cost per share, while the
   * individual purchases remain visible underneath.
   *
   * @returns {Array} Array of holding objects:
   *   { symbol, name, totalShares, totalInvested, averageCost,
   *     currentPrice, currentValue, totalGainLoss,
   *     totalGainLossPercentage, lots: [investment, ...] }
   */
  getHoldingsGrouped() {
    const bySymbol = new Map();

    for (const investment of this.investments) {
      const symbol = investment.symbol;
      if (!bySymbol.has(symbol)) {
        bySymbol.set(symbol, {
          symbol,
          name: investment.name || symbol,
          lots: [],
          totalShares: 0,
          totalInvested: 0,
          currentValue: 0,
        });
      }
      const holding = bySymbol.get(symbol);
      const shares = Number(investment.shares) || 0;
      const purchasePrice = Number(investment.purchasePrice) || 0;
      const currentPrice =
        Number.isFinite(investment.currentPrice) && investment.currentPrice > 0
          ? investment.currentPrice
          : purchasePrice;

      holding.lots.push(investment);
      holding.totalShares += shares;
      holding.totalInvested += shares * purchasePrice;
      holding.currentValue += shares * currentPrice;
    }

    return [...bySymbol.values()].map(holding => {
      const averageCost =
        holding.totalShares > 0
          ? holding.totalInvested / holding.totalShares
          : 0;
      const totalGainLoss = holding.currentValue - holding.totalInvested;
      const totalGainLossPercentage =
        holding.totalInvested > 0
          ? (totalGainLoss / holding.totalInvested) * 100
          : 0;

      // Quote the holding at the current price of its most recently
      // updated lot.
      const latestLot = holding.lots
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.purchaseDate) -
            new Date(a.updatedAt || a.purchaseDate)
        )[0];
      const currentPrice =
        latestLot &&
        Number.isFinite(latestLot.currentPrice) &&
        latestLot.currentPrice > 0
          ? latestLot.currentPrice
          : latestLot.purchasePrice;

      return {
        symbol: holding.symbol,
        name: holding.name,
        totalShares: holding.totalShares,
        totalInvested: Math.round(holding.totalInvested * 100) / 100,
        averageCost: Math.round(averageCost * 100) / 100,
        currentPrice: Math.round(currentPrice * 100) / 100,
        currentValue: Math.round(holding.currentValue * 100) / 100,
        totalGainLoss: Math.round(totalGainLoss * 100) / 100,
        totalGainLossPercentage:
          Math.round(totalGainLossPercentage * 100) / 100,
        lots: holding.lots.map(lot => {
          const shares = Number(lot.shares) || 0;
          const purchasePrice = Number(lot.purchasePrice) || 0;
          const lotCurrentPrice =
            Number.isFinite(lot.currentPrice) && lot.currentPrice > 0
              ? lot.currentPrice
              : purchasePrice;
          return {
            ...lot,
            lotValue: Math.round(shares * lotCurrentPrice * 100) / 100,
            lotGainLoss:
              Math.round((lotCurrentPrice - purchasePrice) * shares * 100) /
              100,
          };
        }),
      };
    });
  }

  /**
   * Remove a single investment lot by id (keeps sibling lots of the same
   * symbol intact, unlike removeInvestment(symbol) which removes the whole
   * holding).
   * @param {string} id - Investment id
   * @returns {boolean} True if removed, false if not found
   */
  removeInvestmentById(id) {
    try {
      const index = this.investments.findIndex(inv => inv.id === id);
      if (index === -1) return false;

      this.investments.splice(index, 1);
      this._saveInvestments();
      return true;
    } catch (error) {
      console.error('Error removing investment:', error);
      throw error;
    }
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
   * Rehydrate the Date fields on stored/imported investments and drop any
   * entry whose purchaseDate cannot be parsed.
   *
   * Shared by _loadInvestments() (localStorage read) and
   * batchSetInvestments() (restore) so both paths apply identical date
   * rules — a restored backup must never admit an investment that the very
   * next page load would silently discard.
   *
   * @param {Array} investments - Raw investment records
   * @returns {Array} Normalized investments with validated Date fields
   */
  _normalizeInvestments(investments) {
    return investments
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

      return this._normalizeInvestments(investments);
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

    const normalizedInvestments = this._normalizeInvestments(investments);

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
