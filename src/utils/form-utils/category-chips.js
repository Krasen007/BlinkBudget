/**
 * Category chip utilities
 * Creates category selection chips and transfer account chips
 */

import {
  CATEGORY_DEFINITIONS,
  CATEGORY_COLORS,
  CATEGORY_OPTIONS,
} from './constants.js';
import { SPACING, FONT_SIZES, TOUCH_TARGETS } from '../constants.js';
import { validateAmount, showFieldError } from './validation.js';
import { ClickTracker } from '../../core/click-tracking-service.js';

/**
 * Create a single category/account chip
 * @param {Object} options - Chip configuration
 * @param {string} options.label - Chip label text
 * @param {string} options.color - Chip color for visual feedback
 * @param {boolean} options.isSelected - Whether chip is selected
 * @param {Function} options.onClick - Click handler
 * @param {string} options.title - Tooltip text (optional)
 * @returns {HTMLButtonElement} Category chip button
 */
const createCategoryChip = options => {
  const {
    label,
    color = 'var(--color-primary)',
    isSelected = false,
    onClick = null,
    title = null,
  } = options;

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.textContent = label;
  chip.className = 'btn category-chip';

  if (title) {
    chip.title = title;
  }

  // Base styles
  chip.style.border = '1px solid var(--color-border)';
  chip.style.transition = 'all 0.2s ease';
  chip.style.borderRadius = 'var(--radius-lg)';

  // Enhanced touch-friendly sizing
  chip.style.minHeight = TOUCH_TARGETS.MIN_HEIGHT;
  chip.style.padding = `${SPACING.LG} ${SPACING.XL}`;
  chip.style.margin = '0'; // Grid handles spacing
  chip.style.fontSize = 'var(--font-size-base)';
  chip.style.fontWeight = '500';
  chip.style.display = 'flex';
  chip.style.alignItems = 'center';
  chip.style.justifyContent = 'center';
  chip.style.textAlign = 'center';
  chip.style.whiteSpace = 'nowrap';
  chip.style.overflow = 'hidden';
  chip.style.overflow = 'hidden';
  chip.style.textOverflow = 'ellipsis';
  // scrollSnapAlign is now handled in the render loop for paging

  // State update function
  const updateChipState = selected => {
    const selectedState = selected !== undefined ? selected : isSelected;
    chip.style.background = selectedState
      ? 'var(--color-primary-light)'
      : 'transparent';
    chip.style.color = selectedState
      ? 'var(--color-background)'
      : 'var(--color-text-muted)';
    chip.style.border = selectedState
      ? '1px solid var(--color-primary)'
      : '1px solid var(--color-border)';
  };

  // Enhanced touch feedback
  chip.addEventListener(
    'touchstart',
    () => {
      chip.style.boxShadow = `0 4px 20px ${color}60`;
      chip.style.border = `1px solid ${color}`;
    },
    { passive: true }
  );

  chip.addEventListener(
    'touchend',
    () => {
      if (!isSelected) {
        chip.style.boxShadow = 'none';
        chip.style.border = '1px solid var(--color-border)';
      }
    },
    { passive: true }
  );

  chip.addEventListener(
    'touchcancel',
    () => {
      if (!isSelected) {
        chip.style.boxShadow = 'none';
        chip.style.border = '1px solid var(--color-border)';
      }
    },
    { passive: true }
  );

  // Hover effects for desktop
  chip.addEventListener('mouseenter', () => {
    if (!isSelected) {
      chip.style.border = `1px solid ${color}`;
      chip.style.color = color;
      chip.style.boxShadow = `0 0 8px ${color}40`;
    }
  });

  chip.addEventListener('mouseleave', () => {
    if (!isSelected) {
      chip.style.border = '1px solid var(--color-border)';
      chip.style.color = 'var(--color-text-muted)';
      chip.style.boxShadow = 'none';
    }
  });

  // Click handler
  if (onClick) {
    chip.addEventListener('click', () => {
      ClickTracker.recordClick();
      onClick();
    });
  }

  // Initial state
  updateChipState();

  // Expose update function
  chip.updateState = updateChipState;

  return chip;
};

/**
 * Create category container with responsive height
 * @returns {HTMLDivElement} Category container
 */
const createCategoryContainer = () => {
  const container = document.createElement('div');
  container.className = 'category-chip-container';
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'none';
  container.style.gridTemplateRows = 'repeat(2, 1fr)';
  container.style.gridAutoFlow = 'column';
  container.style.gridAutoColumns =
    'calc((100% - var(--spacing-sm) * 2) / 3 - 1px)';
  container.style.gap = SPACING.SM;
  container.style.padding = SPACING.SM;
  container.style.boxSizing = 'border-box';
  container.style.borderRadius = 'var(--radius-md)';
  container.style.background = 'var(--color-surface)';
  container.style.border = '1px solid var(--color-border)';
  container.style.overflowX = 'auto';
  container.style.overflowY = 'hidden';
  container.style.webkitOverflowScrolling = 'touch';
  container.style.scrollSnapType = 'x mandatory';
  container.style.marginBottom = SPACING.MD;
  container.style.maxHeight = 'none'; // Override CSS max-height to prevents vertical clipping

  // Remove dynamic height calculation as we use fixed rows now

  // Enable horizontal scrolling with mouse wheel (paged)
  let isScrolling = false;
  container.addEventListener(
    'wheel',
    e => {
      if (e.deltaY !== 0) {
        e.preventDefault();

        if (isScrolling) return;

        isScrolling = true;
        const direction = e.deltaY > 0 ? 1 : -1;

        container.scrollBy({
          left: direction * container.clientWidth,
          behavior: 'smooth',
        });

        setTimeout(() => {
          isScrolling = false;
        }, 500);
      }
    },
    { passive: false }
  );

  return container;
};

/**
 * Create category selector with rendering capabilities
 * @param {Object} options - Selector configuration
 * @param {string} options.type - Current transaction type
 * @param {Array} options.accounts - Available accounts (for transfers)
 * @param {string} options.currentAccountId - Current source account ID
 * @param {string|null} options.initialCategory - Initially selected category
 * @param {string|null} options.initialToAccount - Initially selected transfer account
 * @param {Function} options.onSelect - Callback when category/account selected
 * @param {Function} options.onSubmit - Submit handler for auto-submit
 * @param {HTMLInputElement} options.amountInput - Amount input element
 * @param {HTMLInputElement} options.externalDateInput - External date input
 * @returns {Object} Category selector with container and state management
 */
export const createCategorySelector = (options = {}) => {
  const {
    type = 'expense',
    accounts = [],
    currentAccountId = null,
    initialCategory = null,
    initialToAccount = null,
    onSelect = null,
    onSubmit = null,
    amountInput = null,
    externalDateInput = null,
  } = options;

  let selectedCategory = initialCategory;
  let selectedToAccount = initialToAccount;
  let currentType = type;
  let currentSourceAccount = currentAccountId;
  let prioritizedCategory = initialCategory; // Track category to show first in list

  const container = createCategoryContainer();
  const categoryGroup = document.createElement('div');
  categoryGroup.appendChild(container);

  /**
   * Render categories or transfer accounts
   */
  const render = () => {
    container.innerHTML = ''; // Clear existing

    if (currentType === 'transfer') {
      // Render Accounts as destinations (exclude current source)
      const targets = accounts.filter(a => a.id !== currentSourceAccount);

      if (targets.length === 0) {
        const msg = document.createElement('p');
        msg.textContent = 'No other accounts to transfer to.';
        msg.style.color = 'var(--color-text-muted)';
        msg.style.fontSize = FONT_SIZES.SM;
        container.appendChild(msg);
        return;
      }

      targets.forEach(acc => {
        const chip = createCategoryChip({
          label: acc.name,
          color: 'var(--color-primary)',
          isSelected: selectedToAccount === acc.id,
          onClick: () => {
            // Validate amount
            // Validate amount
            let amountValidation = { valid: true, value: 0 };
            if (amountInput) {
              amountValidation = validateAmount(amountInput.value);
              if (!amountValidation.valid) {
                showFieldError(amountInput);
                return;
              }
            }

            selectedToAccount = acc.id;

            // Auto-submit for Transfer
            if (onSubmit && amountInput) {
              const dateSource =
                externalDateInput ||
                (() => {
                  const fallback = document.createElement('input');
                  fallback.type = 'date';
                  fallback.value = new Date().toISOString().split('T')[0];
                  return fallback;
                })();

              const dateValue = dateSource.getDate
                ? dateSource.getDate()
                : dateSource.value || new Date().toISOString().split('T')[0];

              onSubmit({
                amount: amountValidation.value,
                category: 'Transfer',
                type: 'transfer',
                accountId: currentSourceAccount,
                toAccountId: selectedToAccount,
                timestamp: new Date(dateValue).toISOString(),
              });
            }

            if (onSelect) {
              onSelect({ type: 'transfer', toAccountId: acc.id });
            }

            // Re-render to update selection state
            render();
          },
        });

        container.appendChild(chip);
      });
    } else {
      // Standard Categories
      let rawCats = CATEGORY_OPTIONS[currentType] || CATEGORY_OPTIONS.expense;

      // REFINEMENT: If we have a prioritized category, move it to the front
      if (prioritizedCategory && rawCats.includes(prioritizedCategory)) {
        rawCats = [
          prioritizedCategory,
          ...rawCats.filter(cat => cat !== prioritizedCategory),
        ];
      }

      // Reorder categories to fill rows visually (Horizontal order)
      // Grid flows Column-first. To appear Row-first in a 3x2 grid:
      // Visual:  0 1 2
      //          3 4 5
      // Grid:    0 3
      //          1 4
      //          2 5
      // Sequence needed: 0, 3, 1, 4, 2, 5

      const reorderForVisualLayout = items => {
        const result = [];
        const chunkSize = 6;
        // indices for 3x2 grid column-first fill to appear row-first
        const order = [0, 3, 1, 4, 2, 5];

        for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize);
          // Pad chunk to 6 if needed to ensure correct layout
          while (chunk.length < 6) {
            chunk.push(null);
          }

          const reorderedChunk = new Array(6);
          chunk.forEach((item, index) => {
            if (index < 6) {
              reorderedChunk[order.indexOf(index)] = item;
            }
          });

          result.push(...reorderedChunk);
        }
        return result;
      };

      const processedCats = reorderForVisualLayout(rawCats);

      processedCats.forEach((cat, index) => {
        let chip;

        if (cat === null) {
          // Invisible spacer to maintain grid layout
          chip = document.createElement('div');
          chip.style.minHeight = TOUCH_TARGETS.MIN_HEIGHT;
          chip.style.margin = '0';
          chip.style.visibility = 'hidden';
        } else {
          const catColor = CATEGORY_COLORS[cat] || 'var(--color-primary)';
          chip = createCategoryChip({
            label: cat,
            color: catColor,
            isSelected: selectedCategory === cat,
            title: CATEGORY_DEFINITIONS[cat] || null,
            onClick: () => {
              // Validate amount
              // Validate amount
              let amountValidation = { valid: true, value: 0 };
              if (amountInput) {
                amountValidation = validateAmount(amountInput.value);
                if (!amountValidation.valid) {
                  showFieldError(amountInput);
                  return;
                }
              }

              // Visual feedback - deselect all
              Array.from(container.children).forEach(c => {
                if (c.classList.contains('category-chip')) {
                  if (c.updateState) c.updateState(false);
                }
              });

              selectedCategory = cat;

              // Update this chip state
              chip.updateState(true);

              // Auto-submit
              if (onSubmit && amountInput) {
                try {
                  const dateSource =
                    externalDateInput ||
                    (() => {
                      const fallback = document.createElement('input');
                      fallback.type = 'date';
                      fallback.value = new Date().toISOString().split('T')[0];
                      return fallback;
                    })();

                  const dateValue = dateSource.getDate
                    ? dateSource.getDate()
                    : dateSource.value ||
                      new Date().toISOString().split('T')[0];

                  onSubmit({
                    amount: amountValidation.value,
                    category: selectedCategory,
                    type: currentType,
                    accountId: currentSourceAccount,
                    timestamp: new Date(dateValue).toISOString(),
                  });
                } catch (e) {
                  console.error('Submit failed:', e);
                  // Import MobileAlert dynamically to avoid circular dependencies
                  import('../../components/MobileModal.js').then(
                    ({ MobileAlert }) => {
                      MobileAlert({
                        title: 'Transaction Error',
                        message: `Error submitting transaction: ${e.message}`,
                        buttonText: 'OK',
                      });
                    }
                  );
                }
              }

              if (onSelect) {
                onSelect({ type: 'category', category: cat });
              }
            },
          });
        }

        // Apply page snapping logic: Only the start of a "page" (6 items) should snap
        if (index % 6 === 0) {
          chip.style.scrollSnapAlign = 'start';
        } else {
          chip.style.scrollSnapAlign = 'none';
        }

        container.appendChild(chip);
      });
    }
  };

  /**
   * Set the transaction type and re-render
   * @param {string} type - Transaction type
   */
  const setType = type => {
    currentType = type;
    selectedCategory = null;
    selectedToAccount = null;
    prioritizedCategory = null; // Reset priority when manually changing type
    render();
  };

  /**
   * Set the source account (for transfer filtering)
   * @param {string} accountId - Source account ID
   */
  const setSourceAccount = accountId => {
    currentSourceAccount = accountId;
    if (currentType === 'transfer') {
      render();
    }
  };

  // Initial render
  render();

  return {
    container: categoryGroup,
    chipContainer: container,
    selectedCategory: () => selectedCategory,
    selectedToAccount: () => selectedToAccount,
    setCategory: cat => {
      selectedCategory = cat;
      render();
    },
    setToAccount: accountId => {
      selectedToAccount = accountId;
      render();
    },
    setType,
    setSourceAccount,
    render,
  };
};
