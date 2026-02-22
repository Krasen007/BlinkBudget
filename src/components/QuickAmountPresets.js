/**
 * QuickAmountPresets Component
 * Part of Feature 3.4.1: Quick Amount Presets
 */

import { AmountPresetService } from '../core/amount-preset-service.js';
import { getCopyString } from '../utils/copy-strings.js';

export const QuickAmountPresets = ({ onPresetSelect }) => {
  const presets = AmountPresetService.getPresets() || [];

  const container = document.createElement('div');
  container.className = 'quick-amount-presets';
  container.setAttribute('role', 'group');
  container.setAttribute(
    'aria-label',
    getCopyString('transaction.quickAmounts')
  );

  const displayPresets = presets.length > 0 ? presets : [5, 10, 20, 50];

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

    container.appendChild(button);
  });

  return container;
};

export const createQuickAmountPresets = onPresetSelect => {
  return QuickAmountPresets({ onPresetSelect });
};

export default QuickAmountPresets;
