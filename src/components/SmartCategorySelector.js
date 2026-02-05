/**
 * Smart Category Selector Component
 * Enhanced category selection with intelligent predictions
 * Based on UX design specifications for 3-click transaction entry
 */

import { suggestionService } from '../core/suggestion-service.js';
import { getCategoryIconHTML } from '../utils/category-icons.js';

export const SmartCategorySelector = {
  /**
   * Create smart category selector component
   * @param {Object} options - Component options
   * @returns {HTMLElement} Component element
   */
  create(options = {}) {
    const {
      onCategorySelect,
      onSmartMatchAccept,
      amount = 0,
      initialCategory = '',
      className = '',
    } = options;

    const container = document.createElement('div');
    container.className = `smart-category-container ${className}`;
    container.setAttribute('data-tutorial-target', 'category-selector');

    // Label
    const label = document.createElement('div');
    label.className = 'smart-category-label';
    label.innerHTML = '🏷️ Category';
    container.appendChild(label);

    // Smart match section
    const smartMatchContainer = document.createElement('div');
    smartMatchContainer.className = 'smart-match-container';
    smartMatchContainer.style.display = 'none';
    container.appendChild(smartMatchContainer);

    // Category grid label
    const gridLabel = document.createElement('div');
    gridLabel.className = 'category-grid-label';
    gridLabel.innerHTML = '📊 All Categories';
    container.appendChild(gridLabel);

    // Category grid
    const categoryGrid = document.createElement('div');
    categoryGrid.className = 'category-grid';
    container.appendChild(categoryGrid);

    // Initialize categories
    this.initializeCategories(categoryGrid, onCategorySelect, initialCategory);

    // Store references
    container.updateSmartMatch = newAmount => {
      this.updateSmartMatch(
        newAmount,
        smartMatchContainer,
        onSmartMatchAccept,
        onCategorySelect
      );
    };

    container.getSelectedCategory = () => {
      const selected = categoryGrid.querySelector('.category-card.selected');
      return selected ? selected.dataset.category : null;
    };

    container.setSelectedCategory = category => {
      categoryGrid.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.category === category) {
          card.classList.add('selected');
        }
      });
    };

    // Initial smart match update
    if (amount > 0) {
      container.updateSmartMatch(amount);
    }

    return container;
  },

  /**
   * Initialize category grid
   * @param {HTMLElement} grid - Grid container
   * @param {Function} onSelect - Selection callback
   * @param {string} initialCategory - Initially selected category
   */
  async initializeCategories(grid, onSelect, initialCategory = '') {
    try {
      // 1. Get all available categories (system + custom)
      const { CustomCategoryService } =
        await import('../core/custom-category-service.js');
      const allCategoryData =
        CustomCategoryService.getSystemCategories('expense');
      const customCategories = CustomCategoryService.getByType('expense');

      // Combine them
      const availableCategories = [...allCategoryData, ...customCategories];

      // 2. Get transaction history for frequency data
      const transactions = await this.getTransactionHistory();

      // Calculate frequencies for ALL available categories
      const categoryCount = {};
      transactions.forEach(tx => {
        if (tx.category) {
          categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
        }
      });

      const totalTransactions = transactions.length;

      // Map frequencies to our combined list
      const categoriesWithFrequency = availableCategories.map(cat => {
        const count = categoryCount[cat.name] || 0;
        const pct = totalTransactions > 0 ? count / totalTransactions : 0;
        return {
          category: cat.name,
          count,
          percentage: pct,
          frequency: this.getFrequencyLevel(pct),
          ...cat,
        };
      });

      // Sort by frequency
      categoriesWithFrequency.sort((a, b) => b.count - a.count);

      // 3. Create category cards
      categoriesWithFrequency.forEach(categoryData => {
        const card = this.createCategoryCard(categoryData);

        if (categoryData.category === initialCategory) {
          card.classList.add('selected');
        }

        card.addEventListener('click', () => {
          // Remove selected class from all cards
          grid
            .querySelectorAll('.category-card')
            .forEach(c => c.classList.remove('selected'));

          // Add selected class to clicked card
          card.classList.add('selected');

          if (onSelect) {
            onSelect(categoryData.category);
          }

          // Record selection for learning
          suggestionService.recordUserSelection(
            'category',
            categoryData.category
          );
        });

        grid.appendChild(card);
      });
    } catch (error) {
      console.warn('Failed to initialize categories:', error);
      // Fallback to basic categories
      this.initializeFallbackCategories(grid, onSelect, initialCategory);
    }
  },

  /**
   * Get frequency level for UI styling
   * @param {number} percentage - Usage percentage (0-1)
   * @returns {string} Frequency level (high, medium, low)
   */
  getFrequencyLevel(percentage) {
    if (percentage >= 0.2) return 'high';
    if (percentage >= 0.1) return 'medium';
    return 'low';
  },

  /**
   * Initialize fallback categories if transaction history fails
   * @param {HTMLElement} grid - Grid container
   * @param {Function} onSelect - Selection callback
   * @param {string} initialCategory - Initially selected category
   */
  initializeFallbackCategories(grid, onSelect, initialCategory) {
    const fallbackCategories = [
      'Храна',
      'Заведения',
      'Гориво',
      'Автомобил',
      'Сметки',
      'Забавления',
      'Лекар',
      'Заплата',
      'Подаръци',
      'Други',
    ];

    fallbackCategories.forEach((category, index) => {
      const categoryData = {
        category,
        frequency: 'medium',
        percentage: 0.1,
      };

      const card = this.createCategoryCard(categoryData, index === 0);

      if (category === initialCategory) {
        card.classList.add('selected');
      }

      card.addEventListener('click', () => {
        grid
          .querySelectorAll('.category-card')
          .forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        if (onSelect) {
          onSelect(category);
        }

        // Record selection for learning
        suggestionService.recordUserSelection('category', category);
      });

      grid.appendChild(card);
    });
  },

  /**
   * Create category card element
   * @param {Object} categoryData - Category data
   * @param {boolean} _isFirst - Whether this is the first category
   * @returns {HTMLElement} Category card element
   */
  createCategoryCard(categoryData, _isFirst = false) {
    const card = document.createElement('button');
    card.className = `category-card ${categoryData.frequency}-frequency`;
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', 'false');
    card.setAttribute('aria-label', `${categoryData.category} category`);
    card.dataset.category = categoryData.category;

    // Category icon
    const icon = document.createElement('div');
    icon.className = 'category-icon';
    icon.innerHTML = getCategoryIconHTML(categoryData.category, {
      size: 'medium',
    });
    card.appendChild(icon);

    // Category name
    const name = document.createElement('div');
    name.className = 'category-name';
    name.textContent = categoryData.category;
    card.appendChild(name);

    // Frequency indicator
    if (categoryData.percentage > 0) {
      const frequency = document.createElement('div');
      frequency.className = 'category-frequency';
      frequency.textContent = `${Math.round(categoryData.percentage * 100)}%`;
      card.appendChild(frequency);
    }

    return card;
  },

  /**
   * Update smart match based on amount
   * @param {number} amount - Transaction amount
   * @param {HTMLElement} container - Smart match container
   * @param {Function} onAccept - Accept callback
   * @param {Function} onSelect - Selection callback
   */
  async updateSmartMatch(amount, container, onAccept, onSelect) {
    if (amount <= 0) {
      container.style.display = 'none';
      return;
    }

    try {
      const smartMatch = await suggestionService.getSmartCategoryMatch(amount);

      if (smartMatch && smartMatch.confidence >= 0.6) {
        this.renderSmartMatch(smartMatch, container, onAccept, onSelect);
        container.style.display = 'block';
      } else {
        container.style.display = 'none';
      }
    } catch (error) {
      console.warn('Failed to get smart category match:', error);
      container.style.display = 'none';
    }
  },

  /**
   * Render smart match section
   * @param {Object} smartMatch - Smart match data
   * @param {HTMLElement} container - Container element
   * @param {Function} onAccept - Accept callback
   * @param {Function} onSelect - Selection callback
   */
  renderSmartMatch(smartMatch, container, onAccept, onSelect) {
    container.innerHTML = '';

    // Star indicator
    const star = document.createElement('div');
    star.className = 'smart-match-star';
    star.textContent = '⭐';
    container.appendChild(star);

    // Match content
    const matchContent = document.createElement('div');
    matchContent.className = 'smart-match-content';

    // Category with icon
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'smart-match-category';

    const iconHTML = getCategoryIconHTML(smartMatch.category, {
      size: 'medium',
    });
    categoryDiv.innerHTML = `${iconHTML} ${smartMatch.category}`;
    matchContent.appendChild(categoryDiv);

    // Reasoning
    const reasoning = document.createElement('div');
    reasoning.className = 'smart-match-reasoning';
    reasoning.textContent = `Based on: ${smartMatch.reasoning}`;
    matchContent.appendChild(reasoning);

    // Confidence
    const confidence = document.createElement('div');
    confidence.className = 'smart-match-confidence';
    const confidencePercent = Math.round(smartMatch.confidence * 100);
    confidence.textContent = `Confidence: ${confidencePercent}%`;
    matchContent.appendChild(confidence);

    container.appendChild(matchContent);

    // Accept button
    const acceptButton = document.createElement('button');
    acceptButton.className = 'smart-match-accept';
    acceptButton.textContent = 'Use This Category';
    acceptButton.addEventListener('click', () => {
      if (onAccept) {
        onAccept(smartMatch);
      }
      if (onSelect) {
        onSelect(smartMatch.category);
      }

      // Record smart match acceptance
      suggestionService.recordUserSelection('smartMatch', smartMatch.category);
    });

    container.appendChild(acceptButton);
  },

  /**
   * Get transaction history for frequency analysis
   * @returns {Array} Transaction history
   */
  async getTransactionHistory() {
    try {
      const { TransactionService } =
        await import('../core/transaction-service.js');
      return TransactionService.getAll();
    } catch (error) {
      console.warn('Failed to load transaction history:', error);
      return [];
    }
  },
};
