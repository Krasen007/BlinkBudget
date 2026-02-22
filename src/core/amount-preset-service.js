/**
 * Amount Preset Service
 *
 * Tracks and manages quick amount presets based on user transaction frequency.
 * Feature 3.4.1 - Quick Amount Presets
 *
 * Stores in localStorage with key amount_presets
 */

const AMOUNT_PRESETS_KEY = 'amount_presets';
const MAX_PRESETS = 4;

/**
 * AmountPresetService
 * Provides methods to track amount frequency and calculate top presets
 */
export const AmountPresetService = {
  /**
   * Get the current stored presets data
   * @returns {Object} Presets data object
   */
  _getStoredPresets() {
    try {
      const data = localStorage.getItem(AMOUNT_PRESETS_KEY);
      return data ? JSON.parse(data) : { amounts: {}, presets: [] };
    } catch (error) {
      console.error('Error reading amount presets:', error);
      return { amounts: {}, presets: [] };
    }
  },

  /**
   * Save presets data to localStorage
   * @param {Object} presetsData - Presets data to save
   */
  _savePresets(presetsData) {
    try {
      localStorage.setItem(AMOUNT_PRESETS_KEY, JSON.stringify(presetsData));
    } catch (error) {
      console.error('Error saving amount presets:', error);
    }
  },

  /**
   * Get the current top 4 amount presets
   * @returns {Array} Array of preset amounts sorted by frequency
   */
  getPresets() {
    const presetsData = this._getStoredPresets();
    return presetsData.presets || [];
  },

  /**
   * Record an amount usage - increment count for that amount
   * @param {number} amount - The transaction amount to record
   */
  recordAmount(amount) {
    if (!amount || amount <= 0) return;

    // Round to 2 decimal places for consistency
    const normalizedAmount = Math.round(amount * 100) / 100;

    const presetsData = this._getStoredPresets();

    // Increment count for this amount
    if (!presetsData.amounts[normalizedAmount]) {
      presetsData.amounts[normalizedAmount] = 0;
    }
    presetsData.amounts[normalizedAmount]++;

    // Recalculate presets
    presetsData.presets = this._calculateTopPresets(presetsData.amounts);

    this._savePresets(presetsData);
  },

  /**
   * Calculate top presets from amount frequency data
   * @private
   * @param {Object} amounts - Object mapping amounts to their counts
   * @returns {Array} Top 4 amounts sorted by frequency
   */
  _calculateTopPresets(amounts) {
    const amountEntries = Object.entries(amounts);

    if (amountEntries.length === 0) {
      return [];
    }

    // Sort by count (descending), then by amount (ascending) for tie-breaking
    amountEntries.sort((a, b) => {
      const countDiff = b[1] - a[1];
      if (countDiff !== 0) return countDiff;
      return parseFloat(a[0]) - parseFloat(b[0]);
    });

    // Return top 4 amounts
    return amountEntries
      .slice(0, MAX_PRESETS)
      .map(([amount]) => parseFloat(amount));
  },

  /**
   * Clear all presets data
   */
  resetPresets() {
    const emptyData = { amounts: {}, presets: [] };
    this._savePresets(emptyData);
  },

  /**
   * Get frequency data for all amounts (for debugging/analytics)
   * @returns {Object} Object mapping amounts to their counts
   */
  getFrequencyData() {
    const presetsData = this._getStoredPresets();
    return presetsData.amounts || {};
  },

  /**
   * Get the count for a specific amount
   * @param {number} amount - The amount to check
   * @returns {number} The count for this amount
   */
  getAmountCount(amount) {
    const normalizedAmount = Math.round(amount * 100) / 100;
    const presetsData = this._getStoredPresets();
    return presetsData.amounts[normalizedAmount] || 0;
  },
};

export default AmountPresetService;
