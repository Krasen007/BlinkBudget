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
    stepIndicator,
  }) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';

    // Position will be set later
    tooltip.style.opacity = '0';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'tutorial-tooltip__content';

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'tutorial-tooltip__title';
      titleEl.textContent = title;
      contentDiv.appendChild(titleEl);
    }

    const body = document.createElement('div');
    body.className = 'tutorial-tooltip__body';
    body.appendChild(this.createSafeContent(content));
    contentDiv.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'tutorial-tooltip__footer';

    // Steps indicator (if explicitly passed or needed)
    if (stepIndicator) {
      const steps = document.createElement('div');
      steps.className = 'tutorial-tooltip__steps';
      steps.textContent = stepIndicator;
      footer.appendChild(steps);
    }

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'tutorial-tooltip__actions';
    actionsContainer.appendChild(this.createActions(actions));
    footer.appendChild(actionsContainer);

    // Only append footer if it has content (actions or steps)
    if (actions.length > 0 || stepIndicator) {
      contentDiv.appendChild(footer);
    }

    tooltip.appendChild(contentDiv);

    // Add arrow
    const arrow = document.createElement('div');
    arrow.className = 'tutorial-tooltip__arrow';
    tooltip.appendChild(arrow);

    // Store callback
    tooltip.onAction = onAction;

    // Calculate initial position
    const placement = this.calculatePosition(target, position);
    this.applyPosition(tooltip, placement);

    // Attach listeners
    this.attachListeners(tooltip);

    // Handle window resize
    const handleResize = () => {
      const newPlacement = this.calculatePosition(target, position);
      this.applyPosition(tooltip, newPlacement);
    };

    window.addEventListener('resize', handleResize);
    tooltip._resizeHandler = handleResize;

    // Set initial state
    tooltip.style.transform = 'scale(0.9)';
    tooltip.style.opacity = '0';

    // Animate in - Use CSS transitions for better performance
    tooltip.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'scale(1)';

    return tooltip;
  },

  applyPosition(tooltip, placement) {
    tooltip.style.top = `${placement.top}px`;
    tooltip.style.left = `${placement.left}px`;

    // Update arrow
    const arrow = tooltip.querySelector('.tutorial-tooltip__arrow');
    if (arrow) {
      const arrowStyles = {
        top: 'bottom: -7px; left: 50%; transform: translateX(-50%) rotate(45deg);',
        bottom:
          'top: -7px; left: 50%; transform: translateX(-50%) rotate(45deg);',
        left: 'right: -7px; top: 50%; transform: translateY(-50%) rotate(45deg);',
        right:
          'left: -7px; top: 50%; transform: translateY(-50%) rotate(45deg);',
      };

      arrow.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        ${arrowStyles[placement.arrowPosition]}
      `;

      // Override border based on position to merge with tooltip border
      if (placement.arrowPosition === 'top') {
        arrow.style.borderTop = 'none';
        arrow.style.borderLeft = 'none';
      } else if (placement.arrowPosition === 'bottom') {
        arrow.style.borderBottom = 'none';
        arrow.style.borderRight = 'none';
      } else if (placement.arrowPosition === 'left') {
        arrow.style.borderTop = 'none';
        arrow.style.borderRight = 'none';
      } else if (placement.arrowPosition === 'right') {
        arrow.style.borderBottom = 'none';
        arrow.style.borderLeft = 'none';
      }
    }
  },

  /**
   * Safely create content with basic formatting support
   * Supports <br>, \n, and **text**
   */
  createSafeContent(text) {
    const container = document.createDocumentFragment();
    if (!text) return container;

    // Replace newlines with <br> tag for splitting
    const normalizedText = text.replace(/\n/g, '<br>');

    // Split by <br> tags (case insensitive)
    const lines = normalizedText.split(/<br\s*\/?>/i);

    lines.forEach((line, index) => {
      if (index > 0) {
        container.appendChild(document.createElement('br'));
      }

      // Handle bold text (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/);
      parts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const strong = document.createElement('strong');
          strong.textContent = part.slice(2, -2);
          container.appendChild(strong);
        } else {
          container.appendChild(document.createTextNode(part));
        }
      });
    });

    return container;
  },

  createActions(actions = []) {
    const fragment = document.createDocumentFragment();

    actions.forEach(action => {
      if (!action) return;

      const variant = action.variant || 'secondary';
      const button = document.createElement('button');
      button.className = `btn btn--${variant} tutorial-tooltip-action`;
      button.dataset.action = action.id;
      button.style.margin = '0 var(--spacing-xs)';
      button.textContent = action.text;

      fragment.appendChild(button);
    });

    return fragment;
  },

  calculatePosition(target, preferredPosition) {
    if (!target) {
      return { top: 0, left: 0, arrowPosition: 'top' };
    }
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
        arrowPosition: 'bottom',
      };
    }

    return {
      top,
      left,
      arrowPosition: 'top',
    };
  },

  createArrow(_position) {
    // Legacy method kept if referenced elsewhere, but applyPosition handles it now for efficiency
    // Ideally we should remove this if unused, but avoiding potential breakage for now.
    const arrow = document.createElement('div');
    return arrow;
  },

  attachListeners(tooltip) {
    // Action buttons
    tooltip.querySelectorAll('.tutorial-tooltip-action').forEach(button => {
      button.addEventListener('click', e => {
        e.stopPropagation(); // Prevent bubbling
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
          if (e.target.classList.contains('tutorial-tooltip-action')) {
            e.preventDefault();
            const action = e.target.dataset.action;
            if (tooltip.onAction) tooltip.onAction(action);
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
