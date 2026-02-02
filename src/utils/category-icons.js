/**
 * Category Icons Utility
 * Provides SVG icons and styling for transaction categories
 * Based on UX design specifications for Smart Suggestions
 */

export const categoryIcons = {
  // Food & Drink
  Храна: {
    name: 'coffee-shop',
    svg: '<path d="M18 6h-1a4 4 0 0 0-4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a4 4 0 0 0-4-4H2"/><path d="M6 6h12"/><path d="M18 10h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2"/><path d="M8 14h.01"/><path d="M8 18h.01"/>',
    color: '#F97316',
    category: 'food-drink',
  },
  Заведения: {
    name: 'restaurant',
    svg: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    color: '#F97316',
    category: 'food-drink',
  },
  Гориво: {
    name: 'gas-station',
    svg: '<path d="M5 12V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4"/><path d="M5 12v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8"/><path d="M9 8v2"/><path d="M19 2v10l-2 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-8"/><path d="M19 8h3"/>',
    color: '#EF4444',
    category: 'transport',
  },
  Автомобил: {
    name: 'car',
    svg: '<path d="M19 9h-4.79a1 1 0 0 0-.72.31l-3.1 3.1a1 1 0 0 1-.72.31H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M5 11V9a2 2 0 0 1 2-2h1"/>',
    color: '#EF4444',
    category: 'transport',
  },
  Сметки: {
    name: 'utilities',
    svg: '<path d="M15 3v4a3 3 0 0 0 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V10a3 3 0 0 0 3-3V3"/><path d="M9 3v4a3 3 0 0 0 3 3"/><path d="M9 12v6"/><path d="M12 12v6"/><path d="M15 12v6"/>',
    color: '#8B5CF6',
    category: 'home',
  },
  Забавления: {
    name: 'entertainment',
    svg: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
    color: '#A855F7',
    category: 'entertainment',
  },
  Лекар: {
    name: 'medical',
    svg: '<path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/><path d="M12 8v8"/><path d="M8 12h8"/>',
    color: '#EF4444',
    category: 'medical',
  },
  Заплата: {
    name: 'salary',
    svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    color: '#22C55E',
    category: 'income',
  },
  Подаръци: {
    name: 'gifts',
    svg: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M8 21h8"/><path d="M12 8V2h0a2 2 0 0 1 2 2v4"/>',
    color: '#A855F7',
    category: 'personal',
  },
  Други: {
    name: 'miscellaneous',
    svg: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    color: '#6B7280',
    category: 'miscellaneous',
  },
};

/**
 * Get category icon data
 * @param {string} category - Category name
 * @returns {Object|null} Icon data or null if not found
 */
export function getCategoryIcon(category) {
  return categoryIcons[category] || categoryIcons['Други'];
}

/**
 * Create category icon SVG element
 * @param {string} category - Category name
 * @param {Object} options - Icon options
 * @returns {SVGElement} SVG element
 */
export function createCategoryIcon(category, options = {}) {
  const iconData = getCategoryIcon(category);
  if (!iconData) return null;

  const { size = 'medium', className = '', color = null } = options;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', color || iconData.color);
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  // Set size classes
  const sizeClasses = {
    small: 'category-icon-small',
    medium: '',
    large: 'category-icon-large',
    xl: 'category-icon-xl',
  };

  svg.className.baseVal = `category-icon ${sizeClasses[size]} category-icon-${iconData.category} ${className}`;

  // Add SVG paths
  svg.innerHTML = iconData.svg;

  return svg;
}

/**
 * Get category icon HTML string
 * @param {string} category - Category name
 * @param {Object} options - Icon options
 * @returns {string} SVG HTML string
 */
export function getCategoryIconHTML(category, options = {}) {
  const iconData = getCategoryIcon(category);
  if (!iconData) return '';

  const { size = 'medium', className = '', color = null } = options;

  const sizeClasses = {
    small: 'category-icon-small',
    medium: '',
    large: 'category-icon-large',
    xl: 'category-icon-xl',
  };

  return `
    <svg class="category-icon ${sizeClasses[size]} category-icon-${iconData.category} ${className}" 
         viewBox="0 0 24 24" fill="none" stroke="${color || iconData.color}" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      ${iconData.svg}
    </svg>
  `;
}

/**
 * Get all categories with their icons
 * @returns {Array} Array of category objects with icons
 */
export function getAllCategoriesWithIcons() {
  return Object.entries(categoryIcons).map(([name, iconData]) => ({
    name,
    ...iconData,
  }));
}

/**
 * Get categories by frequency for UI display
 * @param {Array} transactions - Transaction history
 * @returns {Array} Categories sorted by frequency
 */
export function getCategoriesByFrequency(transactions = []) {
  const categoryCount = {};

  transactions.forEach(tx => {
    if (tx.category) {
      categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
    }
  });

  const totalTransactions = transactions.length;

  return Object.entries(categoryCount)
    .map(([category, count]) => {
      const iconData = getCategoryIcon(category);
      const pct = totalTransactions > 0 ? count / totalTransactions : 0;
      return {
        category,
        count,
        percentage: pct,
        frequency: getFrequencyLevel(pct),
        ...iconData,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Get frequency level for UI styling
 * @param {number} percentage - Usage percentage (0-1)
 * @returns {string} Frequency level (high, medium, low)
 */
function getFrequencyLevel(percentage) {
  if (percentage >= 0.2) return 'high';
  if (percentage >= 0.1) return 'medium';
  return 'low';
}

/**
 * Initialize category icons CSS
 * Adds CSS variables and base styles to document
 */
export function initializeCategoryIconsCSS() {
  if (document.getElementById('category-icons-styles')) {
    return; // Already initialized
  }

  const style = document.createElement('style');
  style.id = 'category-icons-styles';
  style.textContent = `
    /* Category Icons Base Styles */
    .category-icon {
      width: 24px;
      height: 24px;
      stroke: currentColor;
      stroke-width: 2;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: all var(--transition-fast, 0.2s ease);
    }

    .category-icon-small {
      width: 16px;
      height: 16px;
    }

    .category-icon-large {
      width: 32px;
      height: 32px;
    }

    .category-icon-xl {
      width: 48px;
      height: 48px;
    }

    /* Category-specific colors */
    .category-icon-food-drink {
      color: #F97316;
    }

    .category-icon-transport {
      color: #EF4444;
    }

    .category-icon-home {
      color: #8B5CF6;
    }

    .category-icon-entertainment {
      color: #A855F7;
    }

    .category-icon-medical {
      color: #EF4444;
    }

    .category-icon-income {
      color: #22C55E;
    }

    .category-icon-finance {
      color: #3B82F6;
    }

    .category-icon-personal {
      color: #A855F7;
    }

    .category-icon-miscellaneous {
      color: #6B7280;
    }

    /* Hover effects */
    .category-card:hover .category-icon {
      transform: scale(1.1);
    }

    .suggestion-chip:hover .category-icon {
      transform: translateY(-1px);
    }

    /* Selection feedback */
    .category-card.selected .category-icon {
      animation: iconPulse 0.3s ease-out;
    }

    @keyframes iconPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* Responsive behavior */
    @media (width <= 480px) {
      .category-icon {
        width: 20px;
        height: 20px;
      }
      
      .category-card .category-icon {
        width: 18px;
        height: 18px;
      }
      
      .suggestion-chip .category-icon {
        width: 16px;
        height: 16px;
      }
    }

    @media (width <= 380px) {
      .category-icon {
        width: 16px;
        height: 16px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .category-icon {
        stroke: var(--color-text-main);
      }
      
      .category-icon.selected {
        stroke: white;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .category-icon {
        stroke-width: 3;
      }
      
      .category-icon.selected {
        stroke: black;
        fill: white;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .category-icon {
        transition: none;
      }
      
      .category-card:hover .category-icon {
        transform: none;
      }
    }
  `;

  document.head.appendChild(style);
}
