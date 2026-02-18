/**
 * Type toggle utilities
 * Creates transaction type toggle buttons (expense, income, transfer, refund)
 */

import { TYPE_COLORS } from '../constants.js';

/**
 * Create a type toggle button
 * @param {Object} options - Button configuration
 * @param {string} options.type - Transaction type (expense, income, transfer, refund)
 * @param {string} options.label - Button label
 * @param {Function} options.onClick - Click handler
 * @param {Function} options.updateState - State update function
 * @param {string} options.currentType - Currently selected type
 * @returns {HTMLButtonElement} Type toggle button
 */
const createTypeButton = options => {
  const { type, label, onClick, currentType } = options;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.className = 'btn type-toggle-btn';
  btn.style.flex = '1';
  btn.style.border = '1px solid var(--color-border)';
  btn.style.transition = 'all 0.2s ease';
  btn.style.borderRadius = 'var(--radius-lg)';

  // Compact sizing for single row layout
  btn.style.minHeight = '56px'; // Match TOUCH_TARGETS.MIN_HEIGHT
  btn.style.padding = 'var(--spacing-sm) var(--spacing-md)'; // Smaller horizontal padding
  btn.style.margin = '0'; // Grid handles spacing
  btn.style.fontSize = '0.9rem'; // Slightly smaller font for better fit
  btn.style.fontWeight = '500';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.textAlign = 'center';
  btn.style.whiteSpace = 'nowrap';
  btn.style.overflow = 'hidden';
  btn.style.textOverflow = 'ellipsis';

  // State update function - will be called by parent
  const updateButtonState = () => {
    const currentTypeValue =
      typeof currentType === 'function' ? currentType() : currentType;
    const isActive = currentTypeValue === type;
    const activeColor = TYPE_COLORS[type] || TYPE_COLORS.transfer;

    btn.style.background = isActive ? activeColor : 'transparent';
    btn.style.border = isActive
      ? '1px solid transparent'
      : '1px solid var(--color-border)';
    btn.style.color = isActive ? 'white' : 'var(--color-text-muted)';
  };

  // Click handler
  btn.addEventListener('click', () => {
    onClick(type);
  });

  // Enhanced touch feedback
  btn.addEventListener(
    'touchstart',
    () => {
      btn.style.transform = 'scale(0.96)';
    },
    { passive: true }
  );

  btn.addEventListener(
    'touchend',
    () => {
      btn.style.transform = 'scale(1)';
    },
    { passive: true }
  );

  btn.addEventListener(
    'touchcancel',
    () => {
      btn.style.transform = 'scale(1)';
    },
    { passive: true }
  );

  // Hover effect for desktop
  btn.addEventListener('mouseenter', () => {
    const currentTypeValue =
      typeof currentType === 'function' ? currentType() : currentType;
    if (currentTypeValue !== type) {
      btn.style.border = '1px solid var(--color-text-muted)';
      btn.style.backgroundColor = 'var(--color-surface-hover)';
      btn.style.color = 'var(--color-text-main)';
      btn.style.boxShadow = 'none';
    }
  });

  btn.addEventListener('mouseleave', () => {
    const currentTypeValue =
      typeof currentType === 'function' ? currentType() : currentType;
    if (currentTypeValue !== type) {
      btn.style.border = '1px solid var(--color-border)';
      btn.style.backgroundColor = 'transparent';
      btn.style.color = 'var(--color-text-muted)';
      btn.style.boxShadow = 'none';
    }
  });

  // Store update function on button
  btn.updateState = updateButtonState;

  return btn;
};

/**
 * Create a type toggle group with all transaction types
 * @param {Object} options - Configuration options
 * @param {string} options.initialType - Initial selected type (default: 'expense')
 * @param {Function} options.onTypeChange - Callback when type changes
 * @returns {Object} Type toggle group with container and state management
 */
export const createTypeToggleGroup = (options = {}) => {
  const { initialType = 'expense', onTypeChange = null } = options;

  let currentType = initialType;

  const typeGroup = document.createElement('fieldset');
  typeGroup.className = 'type-toggle-group';
  typeGroup.style.display = 'grid';
  typeGroup.style.gap = 'var(--spacing-sm)';
  typeGroup.style.border = 'none';
  typeGroup.style.padding = '0';
  typeGroup.style.marginBottom = 'var(--spacing-xs)';

  const legend = document.createElement('legend');
  legend.textContent = 'Transaction Type';
  legend.className = 'visually-hidden';
  typeGroup.appendChild(legend);


  // Responsive grid: 4 columns on larger screens, 2 rows of 2 on very small screens
  const updateGridLayout = () => {
    if (window.innerWidth < 400) {
      typeGroup.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
      typeGroup.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
  };

  updateGridLayout();
  window.addEventListener('resize', updateGridLayout);

  const buttons = {};
  const buttonConfigs = [
    { type: 'expense', label: 'Expense' },
    { type: 'income', label: 'Income' },
    { type: 'transfer', label: 'Transfer' },
    { type: 'refund', label: 'Refund' },
  ];

  // Update all button states
  const updateAllButtons = () => {
    Object.entries(buttons).forEach(([type, btn]) => {
      const isActive = currentType === type;
      const activeColor = TYPE_COLORS[type] || TYPE_COLORS.transfer;

      btn.style.background = isActive ? activeColor : 'transparent';
      btn.style.border = isActive
        ? '1px solid transparent'
        : '1px solid var(--color-border)';
      btn.style.color = isActive ? 'white' : 'var(--color-text-muted)';
    });
  };

  // Create all buttons
  buttonConfigs.forEach(config => {
    const btn = createTypeButton({
      type: config.type,
      label: config.label,
      currentType: () => currentType, // Function to get current type
      onClick: type => {
        currentType = type;
        updateAllButtons();
        if (onTypeChange) {
          onTypeChange(type);
        }
      },
      updateState: updateAllButtons,
    });

    buttons[config.type] = btn;
    typeGroup.appendChild(btn);
  });

  // Initial state
  updateAllButtons();

  /**
   * Set the current type programmatically
   * @param {string} type - Type to set
   */
  const setType = type => {
    currentType = type;
    updateAllButtons();
    if (onTypeChange) {
      onTypeChange(type);
    }
  };

  return {
    container: typeGroup,
    currentType: () => currentType,
    setType,
    buttons,
  };
};
