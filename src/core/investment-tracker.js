/**
 * Investment Tracker - Portfolio Management and Analysis
 *
 * Manages investment portfolio data and provides comprehensive analysis capabilities.
 * Supports manual entry, asset allocation analysis, and performance monitoring.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import { generateId } from '../utils/id-utils.js';

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
      if (!purchasePrice || typeof purchasePrice !== 'number' || purchasePrice <= 0) {
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
        currentPrice: metadata.currentPrice || purchasePrice, // Default to purchase price
        purchaseDate: new Date(purchaseDate),
        assetClass: metadata.assetClass || 'stock',
        sector: metadata.sector || 'Unknown',
        region: metadata.region || 'Unknown',
        currency: metadata.currency || 'EUR',
        createdAt: new Date(),
        updatedAt: new Date()
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

      const investment = this.investments.find(inv => inv.symbol === symbol.toUpperCase());
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
      const index = this.investments.findIndex(inv => inv.symbol === symbol.toUpperCase());
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
   * @param {Object} updates - Fields to update (shares, purchasePrice, currentPrice, name, assetClass, sector, region)
   * @returns {Object|null} Updated investment or null if not found
   */
  updateInvestment(id, updates = {}) {
    try {
      const investment = this.investments.find(inv => inv.id === id || inv.symbol === id);
      if (!investment) return null;

      const allowed = ['shares', 'purchasePrice', 'currentPrice', 'name', 'assetClass', 'sector', 'region', 'currency'];
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
    return this.investments.find(inv => inv.symbol === symbol.toUpperCase()) || null;
  }

  /**
   * Calculate total portfolio value
   * @param {Array} investments - Optional specific investments array
   * @returns {number} Total portfolio value
   */
  calculatePortfolioValue(investments = null) {
    const investmentList = investments || this.investments;
    return investmentList.reduce((total, investment) => {
      return total + (investment.shares * investment.currentPrice);
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
      const gainLossPercentage = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0;

      totalCurrentValue += currentValue;
      totalPurchaseValue += purchaseValue;

      individualGains.push({
        symbol: investment.symbol,
        name: investment.name,
        currentValue: Math.round(currentValue * 100) / 100,
        purchaseValue: Math.round(purchaseValue * 100) / 100,
        gainLoss: Math.round(gainLoss * 100) / 100,
        gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
        shares: investment.shares
      });
    });

    const totalGainLoss = totalCurrentValue - totalPurchaseValue;
    const totalGainLossPercentage = totalPurchaseValue > 0 ? (totalGainLoss / totalPurchaseValue) * 100 : 0;

    return {
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
      totalGainLoss: Math.round(totalGainLoss * 100) / 100,
      totalGainLossPercentage: Math.round(totalGainLossPercentage * 100) / 100,
      individualGains
    };
  }

  /**
   * Calculate returns for a specific time period
   * @param {Array} investments - Optional specific investments array
   * @param {string} timePeriod - Time period ('1month', '3months', '1year', 'all-time')
   * @returns {Object} Returns analysis
   */
  calculateReturns(investments = null, timePeriod = 'all-time') {
    const investmentList = investments || this.investments;
    
    // For now, we'll calculate based on purchase date
    // In a real implementation, you'd have historical price data
    const now = new Date();
    let cutoffDate = new Date(0); // Beginning of time for 'all-time'

    switch (timePeriod) {
      case '1month':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3months':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '1year':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all-time':
      default:
        cutoffDate = new Date(0);
        break;
    }

    const relevantInvestments = investmentList.filter(inv => inv.purchaseDate >= cutoffDate);
    const gainsLosses = this.calculateGainsLosses(relevantInvestments);

    // Calculate annualized return for investments older than 1 year
    const returnsWithAnnualized = gainsLosses.individualGains.map(gain => {
      const investment = investmentList.find(inv => inv.symbol === gain.symbol);
      const daysSincePurchase = (now - investment.purchaseDate) / (1000 * 60 * 60 * 24);
      const yearsSincePurchase = daysSincePurchase / 365.25;

      let annualizedReturn = 0;
      if (yearsSincePurchase > 0 && gain.purchaseValue > 0) {
        annualizedReturn = (Math.pow(gain.currentValue / gain.purchaseValue, 1 / yearsSincePurchase) - 1) * 100;
      }

      return {
        ...gain,
        daysSincePurchase: Math.round(daysSincePurchase),
        yearsSincePurchase: Math.round(yearsSincePurchase * 100) / 100,
        annualizedReturn: Math.round(annualizedReturn * 100) / 100
      };
    });

    return {
      timePeriod,
      cutoffDate,
      investmentCount: relevantInvestments.length,
      ...gainsLosses,
      individualReturns: returnsWithAnnualized
    };
  }

  /**
   * Analyze asset allocation
   * @param {Array} investments - Optional specific investments array
   * @returns {Object} Asset allocation analysis
   */
  analyzeAssetAllocation(investments = null) {
    const investmentList = investments || this.investments;
    const totalValue = this.calculatePortfolioValue(investmentList);

    if (totalValue === 0) {
      return {
        totalValue: 0,
        allocations: {},
        percentages: {}
      };
    }

    const allocations = {};
    const percentages = {};

    investmentList.forEach(investment => {
      const value = investment.shares * investment.currentPrice;
      const assetClass = investment.assetClass || 'Unknown';

      allocations[assetClass] = (allocations[assetClass] || 0) + value;
    });

    // Calculate percentages
    Object.keys(allocations).forEach(assetClass => {
      percentages[assetClass] = Math.round((allocations[assetClass] / totalValue) * 10000) / 100; // 2 decimal places
      allocations[assetClass] = Math.round(allocations[assetClass] * 100) / 100;
    });

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      allocations,
      percentages
    };
  }

  /**
   * Analyze sector allocation
   * @param {Array} investments - Optional specific investments array
   * @returns {Object} Sector allocation analysis
   */
  analyzeSectorAllocation(investments = null) {
    const investmentList = investments || this.investments;
    const totalValue = this.calculatePortfolioValue(investmentList);

    if (totalValue === 0) {
      return {
        totalValue: 0,
        allocations: {},
        percentages: {}
      };
    }

    const allocations = {};
    const percentages = {};

    investmentList.forEach(investment => {
      const value = investment.shares * investment.currentPrice;
      const sector = investment.sector || 'Unknown';

      allocations[sector] = (allocations[sector] || 0) + value;
    });

    // Calculate percentages
    Object.keys(allocations).forEach(sector => {
      percentages[sector] = Math.round((allocations[sector] / totalValue) * 10000) / 100;
      allocations[sector] = Math.round(allocations[sector] * 100) / 100;
    });

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      allocations,
      percentages
    };
  }

  /**
   * Analyze geographic allocation
   * @param {Array} investments - Optional specific investments array
   * @returns {Object} Geographic allocation analysis
   */
  analyzeGeographicAllocation(investments = null) {
    const investmentList = investments || this.investments;
    const totalValue = this.calculatePortfolioValue(investmentList);

    if (totalValue === 0) {
      return {
        totalValue: 0,
        allocations: {},
        percentages: {}
      };
    }

    const allocations = {};
    const percentages = {};

    investmentList.forEach(investment => {
      const value = investment.shares * investment.currentPrice;
      const region = investment.region || 'Unknown';

      allocations[region] = (allocations[region] || 0) + value;
    });

    // Calculate percentages
    Object.keys(allocations).forEach(region => {
      percentages[region] = Math.round((allocations[region] / totalValue) * 10000) / 100;
      allocations[region] = Math.round(allocations[region] * 100) / 100;
    });

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      allocations,
      percentages
    };
  }

  /**
   * Get top performers and underperformers
   * @param {number} count - Number of top/bottom performers to return
   * @returns {Object} Top and bottom performers
   */
  getTopPerformers(count = 5) {
    const gainsLosses = this.calculateGainsLosses();
    const sorted = [...gainsLosses.individualGains].sort((a, b) => b.gainLossPercentage - a.gainLossPercentage);

    return {
      topPerformers: sorted.slice(0, count),
      bottomPerformers: sorted.slice(-count).reverse(),
      totalInvestments: sorted.length
    };
  }

  /**
   * Get portfolio summary
   * @returns {Object} Complete portfolio summary
   */
  getPortfolioSummary() {
    const totalValue = this.calculatePortfolioValue();
    const gainsLosses = this.calculateGainsLosses();
    const assetAllocation = this.analyzeAssetAllocation();
    const sectorAllocation = this.analyzeSectorAllocation();
    const geographicAllocation = this.analyzeGeographicAllocation();
    const topPerformers = this.getTopPerformers(3);

    return {
      totalValue,
      investmentCount: this.investments.length,
      gainsLosses,
      assetAllocation,
      sectorAllocation,
      geographicAllocation,
      topPerformers,
      lastUpdated: new Date()
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

      const investments = JSON.parse(stored);
      
      // Convert date strings back to Date objects (with validation)
      return investments.map(investment => {
        const pd = investment.purchaseDate ? new Date(investment.purchaseDate) : null;
        const ca = investment.createdAt ? new Date(investment.createdAt) : null;
        const ua = investment.updatedAt ? new Date(investment.updatedAt) : null;

        return {
          ...investment,
          purchaseDate: pd && !isNaN(pd.getTime()) ? pd : null,
          createdAt: ca && !isNaN(ca.getTime()) ? ca : new Date(),
          updatedAt: ua && !isNaN(ua.getTime()) ? ua : new Date()
        };
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
      window.dispatchEvent(new CustomEvent('storage-updated', {
        detail: { key: this.storageKey, data: this.investments }
      }));
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
}