/**
 * QuickAmountPresets Component
 * Part of Feature 3.4.1: Quick Amount Presets
 *
 * Dynamically updates when preset amounts change.
 *
 * IMPORTANT: Use createQuickAmountPresets() factory which returns { container, destroy }.
 * Call destroy() when removing the component to clean up the AmountPresetService subscription.
 */

import { AmountPresetService } from '../core/amount-preset-service.js';
import { TransactionService } from '../core/transaction-service.js';
import { getCopyString } from '../utils/copy-strings.js';

export const QuickAmountPresets = ({ onPresetSelect }) => {
  const container = document.createElement('div');
  container.className = 'quick-amount-presets';
  container.setAttribute('role', 'group');
  container.setAttribute(
    'aria-label',
    getCopyString('transaction.quickAmounts')
  );

  /**
   * Render the preset buttons
   */
  const renderButtons = () => {
    // console.log('renderButtons() called');
    // Clear existing buttons
    container.innerHTML = '';

    const presets = AmountPresetService.getPresets() || [];
    const displayPresets = presets.length > 0 ? presets : [5, 10, 20, 50];

    // console.log('Displaying presets:', displayPresets);
    displayPresets.forEach(amount => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quick-amount-preset-btn';
      button.textContent = `$${amount}`;
      button.setAttribute(
        'aria-label',
        `${getCopyString('transaction.quickAmount')}: $${amount}`
      );
      button.setAttribute('data-amount', amount);
      button.setAttribute('tabindex', '0');

      button.style.minWidth = '60px';
      button.style.minHeight = '44px';
      button.style.padding = 'var(--spacing-sm) var(--spacing-md)';
      button.style.fontSize = 'var(--font-size-base)';
      button.style.fontWeight = '600';
      button.style.color = 'var(--color-primary)';
      button.style.backgroundColor = 'var(--color-surface)';
      button.style.border = '1px solid var(--color-border)';
      button.style.borderRadius = 'var(--radius-md)';
      button.style.cursor = 'pointer';
      button.style.transition = 'all var(--transition-fast)';
      button.style.outline = 'none';
      button.style.position = 'relative';

      button.addEventListener('focus', () => {
        button.style.boxShadow = 'var(--focus-shadow-strong)';
        button.style.borderColor = 'var(--focus-color)';
      });

      button.addEventListener('blur', () => {
        button.style.boxShadow = 'none';
        button.style.borderColor = 'var(--color-border)';
      });

      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = 'var(--color-surface-hover)';
        button.style.borderColor = 'var(--color-primary)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'var(--color-surface)';
        button.style.borderColor = 'var(--color-border)';
      });

      button.addEventListener(
        'touchstart',
        () => {
          button.style.transform = 'scale(0.96)';
        },
        { passive: true }
      );

      button.addEventListener(
        'touchend',
        () => {
          button.style.transform = 'scale(1)';
        },
        { passive: true }
      );

      button.addEventListener(
        'touchcancel',
        () => {
          button.style.transform = 'scale(1)';
        },
        { passive: true }
      );

      button.addEventListener('click', () => {
        if (onPresetSelect) {
          onPresetSelect(amount);
        }
        if (window.analyticsEngine) {
          window.analyticsEngine.recordAmountPreset(amount);
        }
      });

      button.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onPresetSelect) {
            onPresetSelect(amount);
          }
          if (window.analyticsEngine) {
            window.analyticsEngine.recordAmountPreset(amount);
          }
        }
      });

      // Get all transactions for counting
      const transactions = TransactionService.getAll();

      // Count transactions with this amount
      const amountCount = transactions.filter(t => t.amount === amount).length;

      // Add counter badge to button
      const counterBadge = document.createElement('span');
      counterBadge.className = 'quick-amount-badge';
      counterBadge.textContent = amountCount;
      counterBadge.setAttribute('aria-hidden', 'true');

      counterBadge.style.fontSize = '0.55rem';
      counterBadge.style.fontWeight = 'normal';
      counterBadge.style.color = 'var(--color-text-muted)';
      counterBadge.style.padding = '0 2px';
      counterBadge.style.lineHeight = '1';
      counterBadge.style.position = 'absolute';
      counterBadge.style.bottom = '2px';
      counterBadge.style.right = '2px';
      counterBadge.style.transform = 'translateY(-50%)';
      counterBadge.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.25)';
      counterBadge.style.textTransform = 'uppercase';

      button.appendChild(counterBadge);

      container.appendChild(button);
    });

    // Add a reset button
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'quick-amount-preset-reset-btn';
    resetBtn.innerHTML = '↺';
    resetBtn.setAttribute('aria-label', 'Reset amount presets');
    resetBtn.setAttribute('title', 'Reset amount presets');
    resetBtn.setAttribute('tabindex', '0');

    resetBtn.style.minWidth = '44px';
    resetBtn.style.minHeight = '44px';
    resetBtn.style.padding = 'var(--spacing-sm)';
    resetBtn.style.fontSize = '1.2rem';
    resetBtn.style.fontWeight = 'normal';
    resetBtn.style.color = 'var(--color-text-muted)';
    resetBtn.style.backgroundColor = 'transparent';
    resetBtn.style.border = '1px dashed var(--color-border)';
    resetBtn.style.borderRadius = 'var(--radius-md)';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.transition = 'all var(--transition-fast)';
    resetBtn.style.outline = 'none';
    resetBtn.style.display = 'inline-flex';
    resetBtn.style.alignItems = 'center';
    resetBtn.style.justifyContent = 'center';
    resetBtn.style.marginLeft = 'var(--spacing-xs)';

    resetBtn.addEventListener('focus', () => {
      resetBtn.style.boxShadow = 'var(--focus-shadow-strong)';
      resetBtn.style.borderColor = 'var(--focus-color)';
    });

    resetBtn.addEventListener('blur', () => {
      resetBtn.style.boxShadow = 'none';
      resetBtn.style.borderColor = 'var(--color-border)';
    });

    resetBtn.addEventListener('mouseenter', () => {
      resetBtn.style.backgroundColor = 'var(--color-surface-hover)';
      resetBtn.style.color = 'var(--color-error)';
      resetBtn.style.borderColor = 'var(--color-error)';
    });

    resetBtn.addEventListener('mouseleave', () => {
      resetBtn.style.backgroundColor = 'transparent';
      resetBtn.style.color = 'var(--color-text-muted)';
      resetBtn.style.borderColor = 'var(--color-border)';
    });

    resetBtn.addEventListener('click', () => {
      AmountPresetService.resetPresets();
    });

    // Touch events for mobile feedback only
    resetBtn.addEventListener(
      'touchstart',
      _e => {
        resetBtn.style.transform = 'scale(0.95)';
        resetBtn.style.backgroundColor = 'var(--color-surface-hover)';
        resetBtn.style.color = 'var(--color-error)';
        resetBtn.style.borderColor = 'var(--color-error)';
      },
      { passive: true }
    );

    resetBtn.addEventListener(
      'touchend',
      _e => {
        resetBtn.style.transform = '';
        resetBtn.style.backgroundColor = 'transparent';
        resetBtn.style.color = 'var(--color-text-muted)';
        resetBtn.style.borderColor = 'var(--color-border)';
      },
      { passive: true }
    );

    resetBtn.addEventListener(
      'touchcancel',
      _e => {
        resetBtn.style.transform = '';
        resetBtn.style.backgroundColor = 'transparent';
        resetBtn.style.color = 'var(--color-text-muted)';
        resetBtn.style.borderColor = 'var(--color-border)';
      },
      { passive: true }
    );

    resetBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        AmountPresetService.resetPresets();
      }
    });

    container.appendChild(resetBtn);
  };

  // Initial render
  renderButtons();

  // Subscribe to preset changes and re-render when they update
  const unsubscribe = AmountPresetService.onPresetsChange(() => {
    renderButtons();
  });

  return { container, unsubscribe };
};

/**
 * Factory function to create QuickAmountPresets with cleanup support
 *
 * @param {Function} onPresetSelect - Callback when a preset is selected
 * @returns {Object} Object with { container, destroy }
 * @returns {HTMLElement} container - The DOM element to append
 * @returns {Function} destroy - Must be called when removing the component to clean up
 *                               the AmountPresetService subscription and prevent memory leaks
 *
 * Usage:
 *   const { container, destroy } = createQuickAmountPresets(onSelect);
 *   parent.appendChild(container);
 *   // Later, when removing:
 *   parent.removeChild(container);
 *   destroy(); // Clean up subscription
 */
export const createQuickAmountPresets = onPresetSelect => {
  const { container, unsubscribe } = QuickAmountPresets({ onPresetSelect });

  return {
    container,
    /**
     * Cleanup function - MUST be called when removing the component
     * Unsubscribes from AmountPresetService.onPresetsChange to prevent memory leaks
     */
    destroy() {
      unsubscribe();
    },
  };
};

export default QuickAmountPresets;
