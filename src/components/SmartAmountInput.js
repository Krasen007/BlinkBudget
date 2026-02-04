/**
 * Smart Amount Input Component
 * Enhanced amount input with intelligent suggestions
 * Based on UX design specifications for 3-click transaction entry
 */

import { suggestionService } from '../core/suggestion-service.js';
import { getCategoryIconHTML } from '../utils/category-icons.js';

export const SmartAmountInput = {
  /**
   * Create smart amount input component
   * @param {Object} options - Component options
   * @returns {HTMLElement} Component element
   */
  create(options = {}) {
    const {
      onAmountChange,
      onSuggestionSelect,
      placeholder = '0.00',
      initialValue = '',
      className = '',
    } = options;

    const container = document.createElement('div');
    container.className = `smart-amount-container ${className}`;

    // Label
    const label = document.createElement('div');
    label.className = 'smart-amount-label';
    label.innerHTML = '💰 Amount';
    container.appendChild(label);

    // Amount input field
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'smart-amount-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'smart-amount-input';
    input.placeholder = placeholder;
    input.value = initialValue;
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.setAttribute('data-tutorial-target', 'amount-input');

    // Format amount as user types
    input.addEventListener('input', e => {
      const value = e.target.value;
      const formattedValue = this.formatAmount(value);
      if (formattedValue !== value) {
        const cursorPos = e.target.selectionStart;
        const lengthDiff = value.length - formattedValue.length;
        const adjustedPos = Math.max(0, cursorPos - lengthDiff);
        e.target.value = formattedValue;
        e.target.setSelectionRange(adjustedPos, adjustedPos);
      }

      const amount = this.parseAmount(formattedValue);
      if (onAmountChange) {
        onAmountChange(amount);
      }

      // Update suggestions with debouncing
      this.debounceUpdateSuggestions(amount, suggestionsContainer);
    });

    // Focus event to show suggestions
    input.addEventListener('focus', () => {
      const amount = this.parseAmount(input.value);
      this.updateSuggestions(amount, suggestionsContainer, onSuggestionSelect);
    });

    // Blur event with delay to allow suggestion clicks
    input.addEventListener('blur', () => {
      setTimeout(() => {
        suggestionsContainer.style.display = 'none';
      }, 200);
    });

    inputWrapper.appendChild(input);
    container.appendChild(inputWrapper);

    // Suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'smart-suggestions-container';
    suggestionsContainer.style.display = 'none';
    container.appendChild(suggestionsContainer);

    // Store reference for external access
    container.getAmount = () => this.parseAmount(input.value);
    container.setAmount = amount => {
      input.value = this.formatAmount(amount.toString());
      const parsedAmount = this.parseAmount(input.value);
      if (onAmountChange) {
        onAmountChange(parsedAmount);
      }
    };
    container.focus = () => input.focus();
    container.clear = () => {
      input.value = '';
      suggestionsContainer.style.display = 'none';
      if (onAmountChange) {
        onAmountChange(0);
      }
    };

    return container;
  },

  /**
   * Format amount for display
   * @param {string} value - Raw input value
   * @returns {string} Formatted amount
   */
  formatAmount(value) {
    // Remove non-numeric characters except decimal point
    let clean = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    let parts = clean.split('.');
    if (parts.length > 2) {
      clean = `${parts[0]}.${parts.slice(1).join('')}`;
      parts = clean.split('.');
    }

    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      clean = `${parts[0]}.${parts[1].substring(0, 2)}`;
    }

    return clean;
  },

  /**
   * Parse amount string to number
   * @param {string} value - Formatted amount string
   * @returns {number} Parsed amount
   */
  parseAmount(value) {
    const clean = value.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  },

  /**
   * Update suggestions display
   * @param {number} amount - Current amount
   * @param {HTMLElement} container - Suggestions container
   * @param {Function} onSelect - Selection callback
   */
  async updateSuggestions(amount, container, onSelect) {
    if (amount <= 0) {
      container.style.display = 'none';
      return;
    }

    try {
      const suggestions = await suggestionService.getAmountSuggestions({
        amount,
      });
      this.renderSuggestions(suggestions, container, onSelect);
    } catch (error) {
      console.warn('Failed to load amount suggestions:', error);
      container.style.display = 'none';
    }
  },

  /**
   * Render suggestion chips
   * @param {Array} suggestions - Array of suggestions
   * @param {HTMLElement} container - Container element
   * @param {Function} onSelect - Selection callback
   */
  renderSuggestions(suggestions, container, onSelect) {
    if (suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = '';

    // Suggestions label
    const label = document.createElement('div');
    label.className = 'suggestions-label';
    label.innerHTML = '💡 Smart Suggestions';
    container.appendChild(label);

    // Suggestions chips container
    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'suggestion-chips-container';

    suggestions.forEach((suggestion, index) => {
      const chip = this.createSuggestionChip(suggestion, index === 0);

      chip.addEventListener('click', () => {
        // Remove selected class from all chips
        chipsContainer.querySelectorAll('.suggestion-chip').forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-selected', 'false');
        });

        // Add selected class to clicked chip
        chip.classList.add('selected');
        chip.setAttribute('aria-selected', 'true');

        if (onSelect) {
          onSelect(suggestion);
        }
      });

      chipsContainer.appendChild(chip);
    });

    container.appendChild(chipsContainer);

    // Confidence indicator for top suggestion
    if (suggestions.length > 0 && suggestions[0].confidence >= 0.8) {
      const confidence = this.createConfidenceIndicator(suggestions[0]);
      container.appendChild(confidence);
    }

    container.style.display = 'block';
  },

  /**
   * Create individual suggestion chip
   * @param {Object} suggestion - Suggestion data
   * @param {boolean} isTopSuggestion - Whether this is the top suggestion
   * @returns {HTMLElement} Suggestion chip element
   */
  createSuggestionChip(suggestion, isTopSuggestion = false) {
    const chip = document.createElement('button');
    chip.className = 'suggestion-chip';
    chip.setAttribute('role', 'option');
    chip.setAttribute('aria-selected', 'false');
    chip.setAttribute(
      'aria-label',
      `${suggestion.amount} dollars, ${suggestion.category || 'no category'}`
    );

    if (isTopSuggestion) {
      chip.classList.add('top-suggestion');
    }

    // Amount
    const amountDiv = document.createElement('div');
    amountDiv.className = 'suggestion-amount';
    amountDiv.textContent = `$${suggestion.amount.toFixed(2)}`;
    chip.appendChild(amountDiv);

    // Category with icon
    if (suggestion.category) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'suggestion-category';

      const iconHTML = getCategoryIconHTML(suggestion.category, {
        size: 'small',
      });
      // Create icon container separately to avoid XSS
      const iconSpan = document.createElement('span');
      iconSpan.innerHTML = iconHTML;
      const textSpan = document.createElement('span');
      textSpan.textContent = ` ${suggestion.category}`;
      categoryDiv.appendChild(iconSpan);
      categoryDiv.appendChild(textSpan);

      chip.appendChild(categoryDiv);
    }

    return chip;
  },

  /**
   * Create confidence indicator
   * @param {Object} suggestion - Top suggestion
   */
  createConfidenceIndicator(suggestion) {
    const indicator = document.createElement('div');
    indicator.className = `confidence-indicator confidence-${suggestionService.getConfidenceLevel(suggestion.confidence)}`;

    const confidencePercent = Math.round(suggestion.confidence * 100);
    indicator.textContent = `⭐ Most Likely: ${suggestion.category || 'Unknown'} (${confidencePercent}% confidence)`;

    return indicator;
  },

  /**
   * Debounced suggestion updates
   */
  debounceUpdateSuggestions: (function () {
    let timeoutId;
    return function (amount, container) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.updateSuggestions(amount, container, null);
      }, 300);
    };
  })(),
};
