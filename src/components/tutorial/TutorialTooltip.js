/**
 * TutorialTooltip - Contextual tooltip for tutorial steps
 * Provides tooltips with positioning logic and responsive behavior
 */

import { TUTORIAL_CONFIG } from '../../utils/tutorial-config.js';

export const TutorialTooltip = {
  create({
    target,
    title,
    content,
    position = 'auto',
    actions = [],
    onAction,
  }) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';

    // Calculate position
    const placement = this.calculatePosition(target, position);

    tooltip.style.cssText = `
      position: fixed;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      max-width: ${TUTORIAL_CONFIG.tooltipMaxWidth}px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      top: ${placement.top}px;
      left: ${placement.left}px;
      opacity: 0;
      transform: scale(0.9);
      transition: all var(--transition-normal);
    `;

    // Add arrow
    const arrow = this.createArrow(placement.arrowPosition);
    tooltip.appendChild(arrow);

    // Add content
    tooltip.innerHTML += `
      <h3 class="tutorial-tooltip__title">${title}</h3>
      <p class="tutorial-tooltip__content">${content}</p>
      ${actions.length > 0 ? this.createActionButtons(actions) : ''}
    `;

    // Animate in
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'scale(1)';
    });

    // Store onAction callback
    tooltip.onAction = onAction;

    // Add event listeners
    this.attachListeners(tooltip);

    // Handle window resize
    const handleResize = () => {
      const newPlacement = this.calculatePosition(target, position);
      tooltip.style.top = `${newPlacement.top}px`;
      tooltip.style.left = `${newPlacement.left}px`;

      // Update arrow position
      const newArrow = this.createArrow(newPlacement.arrowPosition);
      const existingArrow = tooltip.querySelector('.tutorial-tooltip__arrow');
      if (existingArrow) {
        existingArrow.replaceWith(newArrow);
      }
    };

    window.addEventListener('resize', handleResize);
    tooltip._resizeHandler = handleResize;

    return tooltip;
  },

  calculatePosition(target, preferredPosition) {
    const targetRect = target.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const tooltipSize = {
      width: TUTORIAL_CONFIG.tooltipMaxWidth,
      height: 150, // estimated height
    };

    // Check if mobile
    const isMobile = viewport.width <= TUTORIAL_CONFIG.mobileBreakpoint;
    if (isMobile) {
      return this.calculateMobilePosition(targetRect, viewport, tooltipSize);
    }

    const position = {};
    let arrowPosition = 'bottom';

    // Auto positioning logic for desktop
    if (preferredPosition === 'auto') {
      // Try to position above first
      if (targetRect.top > tooltipSize.height + TUTORIAL_CONFIG.tooltipOffset) {
        position.top =
          targetRect.top - tooltipSize.height - TUTORIAL_CONFIG.tooltipOffset;
        position.left =
          targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
        arrowPosition = 'bottom';
      } else if (
        targetRect.bottom + tooltipSize.height + TUTORIAL_CONFIG.tooltipOffset <
        viewport.height
      ) {
        position.top = targetRect.bottom + TUTORIAL_CONFIG.tooltipOffset;
        position.left =
          targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
        arrowPosition = 'top';
      } else if (
        targetRect.right + tooltipSize.width + TUTORIAL_CONFIG.tooltipOffset <
        viewport.width
      ) {
        position.top =
          targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
        position.left = targetRect.right + TUTORIAL_CONFIG.tooltipOffset;
        arrowPosition = 'left';
      } else {
        position.top =
          targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
        position.left =
          targetRect.left - tooltipSize.width - TUTORIAL_CONFIG.tooltipOffset;
        arrowPosition = 'right';
      }
    } else {
      // Use preferred position
      switch (preferredPosition) {
        case 'top':
          position.top =
            targetRect.top - tooltipSize.height - TUTORIAL_CONFIG.tooltipOffset;
          position.left =
            targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
          arrowPosition = 'bottom';
          break;
        case 'bottom':
          position.top = targetRect.bottom + TUTORIAL_CONFIG.tooltipOffset;
          position.left =
            targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
          arrowPosition = 'top';
          break;
        case 'left':
          position.top =
            targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
          position.left =
            targetRect.left - tooltipSize.width - TUTORIAL_CONFIG.tooltipOffset;
          arrowPosition = 'right';
          break;
        case 'right':
          position.top =
            targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
          position.left = targetRect.right + TUTORIAL_CONFIG.tooltipOffset;
          arrowPosition = 'left';
          break;
      }
    }

    // Ensure tooltip stays within viewport
    position.left = Math.max(
      TUTORIAL_CONFIG.tooltipOffset,
      Math.min(
        position.left,
        viewport.width - tooltipSize.width - TUTORIAL_CONFIG.tooltipOffset
      )
    );
    position.top = Math.max(
      TUTORIAL_CONFIG.tooltipOffset,
      Math.min(
        position.top,
        viewport.height - tooltipSize.height - TUTORIAL_CONFIG.tooltipOffset
      )
    );

    return {
      ...position,
      arrowPosition,
    };
  },

  calculateMobilePosition(targetRect, viewport, tooltipSize) {
    const offset = TUTORIAL_CONFIG.tooltipOffset;
    const padding = 16; // Mobile padding

    // On mobile, always position below target for better visibility
    const top = targetRect.bottom + offset;
    const left = padding;

    // If not enough space below, position above
    if (top + tooltipSize.height > viewport.height - offset) {
      const adjustedTop = targetRect.top - tooltipSize.height - offset;
      // If still not enough space, position at top with small margin
      if (adjustedTop < offset) {
        return {
          top: offset,
          left,
          arrowPosition: 'top',
        };
      }
      return {
        top: adjustedTop,
        left,
        arrowPosition: 'top',
      };
    }

    return {
      top,
      left,
      arrowPosition: 'top',
    };
  },

  createArrow(position) {
    const arrow = document.createElement('div');
    arrow.className = 'tutorial-tooltip__arrow';

    const arrowStyles = {
      top: 'bottom: -7px; left: 50%; transform: translateX(-50%) rotate(45deg);',
      bottom:
        'top: -7px; left: 50%; transform: translateX(-50%) rotate(45deg);',
      left: 'right: -7px; top: 50%; transform: translateY(-50%) rotate(45deg);',
      right: 'left: -7px; top: 50%; transform: translateY(-50%) rotate(45deg);',
    };

    arrow.style.cssText = `
      position: absolute;
      width: 12px;
      height: 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      ${arrowStyles[position]}
    `;

    return arrow;
  },

  createActionButtons(actions) {
    return `
      <div class="tutorial-tooltip__actions">
        ${actions
          .map(
            action => `
          <button class="btn btn--${action.variant || 'secondary'} tutorial-tooltip-action" 
                  data-action="${action.id}"
                  style="margin: 0 var(--spacing-xs);">
            ${action.text}
          </button>
        `
          )
          .join('')}
      </div>
    `;
  },

  attachListeners(tooltip) {
    // Action buttons
    tooltip.querySelectorAll('.tutorial-tooltip-action').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (tooltip.onAction) {
          tooltip.onAction(action);
        }
      });
    });

    // Keyboard navigation
    tooltip.addEventListener('keydown', e => {
      switch (e.key) {
        case 'Escape':
          if (tooltip.onAction) tooltip.onAction('dismiss');
          break;
        case 'Enter': {
          const focusedButton = tooltip.querySelector(':focus');
          if (focusedButton && tooltip.onAction) {
            tooltip.onAction(focusedButton.dataset.action);
          }
          break;
        }
        case 'Tab': {
          // Constrain focus to tooltip
          const focusableElements = tooltip.querySelectorAll(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
          break;
        }
      }
    });

    // Make tooltip focusable for accessibility
    tooltip.setAttribute('tabindex', '-1');

    // Focus first action button for accessibility
    const firstButton = tooltip.querySelector('.tutorial-tooltip-action');
    if (firstButton) {
      setTimeout(() => firstButton.focus(), 100);
    }
  },

  remove(tooltip) {
    // Clean up resize listener
    if (tooltip._resizeHandler) {
      window.removeEventListener('resize', tooltip._resizeHandler);
    }

    tooltip.style.opacity = '0';
    tooltip.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 250);
  },
};
