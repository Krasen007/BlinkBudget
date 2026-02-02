/**
 * Smart Note Field Component
 * Enhanced note input with intelligent suggestions and merchant recognition
 * Based on UX design specifications for 3-click transaction entry
 */

import { suggestionService } from '../core/suggestion-service.js';

export const SmartNoteField = {
  /**
   * Create smart note field component
   * @param {Object} options - Component options
   * @returns {HTMLElement} Component element
   */
  create(options = {}) {
    const {
      onNoteChange,
      onSuggestionSelect,
      category: initialCategory = '',
      amount: initialAmount = 0,
      initialValue = '',
      placeholder = 'Add a note (optional)',
      className = '',
    } = options;

    // Use mutable variables for context that can be updated
    let category = initialCategory;
    let amount = initialAmount;

    const container = document.createElement('div');
    container.className = `smart-note-container ${className}`;

    // Label
    const label = document.createElement('div');
    label.className = 'smart-note-label';
    label.innerHTML = '📝 Note (Optional)';
    container.appendChild(label);

    // Note input field
    const input = document.createElement('textarea');
    input.className = 'smart-note-input';
    input.placeholder = placeholder;
    input.value = initialValue;
    input.rows = 1;
    input.setAttribute('aria-label', 'Transaction note');

    // Auto-resize textarea
    input.addEventListener('input', () => {
      this.autoResizeTextarea(input);

      if (onNoteChange) {
        onNoteChange(input.value);
      }

      // Update suggestions with debouncing
      this.debounceUpdateSuggestions(
        input.value,
        category,
        amount,
        suggestionsContainer,
        onSuggestionSelect
      );
    });

    // Focus event to show suggestions
    input.addEventListener('focus', () => {
      this.updateSuggestions(
        input.value,
        category,
        amount,
        suggestionsContainer,
        onSuggestionSelect
      );
    });

    // Blur event with delay
    input.addEventListener('blur', () => {
      setTimeout(() => {
        suggestionsContainer.style.display = 'none';
      }, 200);
    });

    container.appendChild(input);

    // Suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'note-suggestions-container';
    suggestionsContainer.style.display = 'none';
    container.appendChild(suggestionsContainer);

    // Merchant recognition container
    const merchantContainer = document.createElement('div');
    merchantContainer.className = 'merchant-recognition-container';
    merchantContainer.style.display = 'none';
    container.appendChild(merchantContainer);

    // Store references for external access
    container.getNote = () => input.value;
    container.setNote = note => {
      input.value = note;
      this.autoResizeTextarea(input);
      if (onNoteChange) {
        onNoteChange(note);
      }
    };
    container.focus = () => input.focus();
    container.clear = () => {
      input.value = '';
      this.autoResizeTextarea(input);
      suggestionsContainer.style.display = 'none';
      merchantContainer.style.display = 'none';
      if (onNoteChange) {
        onNoteChange('');
      }
    };
    container.updateContext = (newCategory, newAmount) => {
      category = newCategory;
      amount = newAmount;
      if (input.value) {
        this.updateSuggestions(
          input.value,
          category,
          amount,
          suggestionsContainer,
          onSuggestionSelect
        );
      }
    };

    return container;
  },

  /**
   * Auto-resize textarea based on content
   * @param {HTMLTextAreaElement} textarea - Textarea element
   */
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  },

  /**
   * Update suggestions display
   * @param {string} note - Current note
   * @param {string} currentCategory - Current category
   * @param {number} currentAmount - Current amount
   * @param {HTMLElement} container - Suggestions container
   * @param {Function} onSelect - Selection callback
   */
  async updateSuggestions(
    note,
    currentCategory,
    currentAmount,
    container,
    onSelect
  ) {
    if (!currentCategory && currentAmount <= 0) {
      container.style.display = 'none';
      return;
    }

    try {
      const suggestions = await suggestionService.getNoteSuggestions(
        currentCategory,
        currentAmount,
        note
      );
      this.renderSuggestions(suggestions, container, onSelect);
    } catch (error) {
      console.warn('Failed to load note suggestions:', error);
      container.style.display = 'none';
    }
  },

  /**
   * Render suggestion list
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
    label.textContent = `💡 Suggestions${suggestions[0].source === 'category' ? ` for ${suggestions[0].source}` : ''}:`;
    container.appendChild(label);

    // Suggestions list
    const list = document.createElement('ul');
    list.className = 'suggestion-list';

    suggestions.forEach(suggestion => {
      const item = document.createElement('li');
      item.className = 'suggestion-item';
      item.textContent = suggestion.note;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-label', suggestion.note);

      item.addEventListener('click', () => {
        if (onSelect) {
          onSelect(suggestion);
        }
      });

      // Add hover effect for keyboard navigation
      item.addEventListener('mouseenter', () => {
        item.classList.add('hovered');
      });

      item.addEventListener('mouseleave', () => {
        item.classList.remove('hovered');
      });

      list.appendChild(item);
    });

    container.appendChild(list);
    container.style.display = 'block';
  },

  /**
   * Render merchant recognition
   * @param {Object} merchant - Merchant data
   * @param {HTMLElement} container - Merchant container
   * @param {Function} onRecognized - Recognition callback
   */
  renderMerchantRecognition(merchant, container, onRecognized) {
    container.innerHTML = '';

    const merchantName = document.createElement('div');
    merchantName.className = 'merchant-name';
    merchantName.innerHTML = `🏪 Recognized Merchant: ⭐ ${merchant.name}`;
    container.appendChild(merchantName);

    const merchantDetails = document.createElement('div');
    merchantDetails.className = 'merchant-details';
    merchantDetails.innerHTML = `📍 Based on pattern recognition`;
    container.appendChild(merchantDetails);

    container.style.display = 'block';

    if (onRecognized) {
      onRecognized(merchant);
    }
  },

  /**
   * Check for merchant patterns in note
   * @param {string} note - Current note
   * @param {HTMLElement} container - Merchant container
   * @param {Function} onRecognized - Recognition callback
   */
  async checkMerchantPatterns(note, container, onRecognized) {
    if (!note || note.length < 3) {
      container.style.display = 'none';
      return;
    }

    const merchantPatterns = {
      starbucks: { name: 'Starbucks', confidence: 0.9 },
      shell: { name: 'Shell Gas Station', confidence: 0.8 },
      walmart: { name: 'Walmart', confidence: 0.8 },
      mcdonald: { name: "McDonald's", confidence: 0.8 },
      target: { name: 'Target', confidence: 0.7 },
      costco: { name: 'Costco', confidence: 0.7 },
      amazon: { name: 'Amazon', confidence: 0.6 },
    };

    const noteLower = note.toLowerCase();

    for (const [pattern, merchant] of Object.entries(merchantPatterns)) {
      if (noteLower.includes(pattern)) {
        this.renderMerchantRecognition(merchant, container, onRecognized);
        return;
      }
    }

    container.style.display = 'none';
  },

  /**
   * Setup keyboard navigation for suggestions
   * @param {HTMLElement} container - Container element
   * @param {Function} onSelect - Selection callback
   */
  setupKeyboardNavigation(container, onSelect) {
    const items = container.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    let currentIndex = -1;

    const selectItem = index => {
      items.forEach((item, i) => {
        item.classList.toggle('hovered', i === index);
      });

      if (index >= 0 && index < items.length && onSelect) {
        const suggestion = {
          note: items[index].textContent,
          source: 'keyboard',
        };
        onSelect(suggestion);
      }
    };

    container.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          currentIndex = Math.min(currentIndex + 1, items.length - 1);
          selectItem(currentIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          currentIndex = Math.max(currentIndex - 1, -1);
          selectItem(currentIndex);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (currentIndex >= 0) {
            items[currentIndex].click();
          }
          break;
        case 'Escape':
          container.style.display = 'none';
          currentIndex = -1;
          break;
      }
    });
  },

  /**
   * Debounced suggestion updates
   */
  debounceUpdateSuggestions: (function () {
    let timeoutId;
    return function (note, category, amount, container, onSelect) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.updateSuggestions(note, category, amount, container, onSelect);
      }, 300);
    };
  })(),
};
