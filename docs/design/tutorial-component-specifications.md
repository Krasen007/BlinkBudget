# Tutorial Component Specifications for Developers

## Overview

This document provides detailed technical specifications for implementing the interactive tutorial system in BlinkBudget. All components are designed to work with the existing vanilla JavaScript architecture and CSS custom properties system.

## Component Architecture

### File Structure

```
src/
├── components/
│   ├── tutorial/
│   │   ├── TutorialManager.js          # Main tutorial controller
│   │   ├── TutorialOverlay.js          # Overlay component
│   │   ├── TutorialTooltip.js          # Tooltip component
│   │   └── TutorialStep.js             # Individual step logic
├── styles/
│   └── components/
│       └── tutorial.css               # Tutorial-specific styles
└── utils/
    ├── tutorial-config.js              # Tutorial configuration
    └── tutorial-utils.js              # Helper functions
```

## TutorialManager.js

```javascript
/**
 * TutorialManager - Main controller for the interactive tutorial system
 * Handles tutorial state, step progression, and component coordination
 */

import { TutorialOverlay } from './TutorialOverlay.js';
import { TutorialTooltip } from './TutorialTooltip.js';
import { TUTORIAL_STEPS } from '../../utils/tutorial-config.js';
import { StorageService } from '../../core/storage-service.js';

export class TutorialManager {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.overlay = null;
    this.tooltip = null;
    this.steps = TUTORIAL_STEPS;
    this.spotlightElement = null;
  }

  /**
   * Initialize tutorial system
   * @returns {Promise<boolean>} Whether tutorial should be shown
   */
  async initialize() {
    const hasSeenTutorial = StorageService.get('tutorial-completed', false);
    const transactionCount = await this.getTransactionCount();

    return !hasSeenTutorial && transactionCount === 0;
  }

  /**
   * Start the tutorial
   */
  start() {
    if (this.isActive) return;

    this.isActive = true;
    this.currentStep = 0;

    // Create overlay
    this.overlay = TutorialOverlay.create({
      onDismiss: () => this.skip(),
      onNext: () => this.next(),
      onPrevious: () => this.previous(),
    });

    document.body.appendChild(this.overlay);

    // Show first step
    this.showCurrentStep();
  }

  /**
   * Show current tutorial step
   */
  showCurrentStep() {
    const step = this.steps[this.currentStep];

    if (!step) {
      this.complete();
      return;
    }

    // Handle different step types
    switch (step.type) {
      case 'welcome':
        this.showWelcomeStep(step);
        break;
      case 'spotlight':
        this.showSpotlightStep(step);
        break;
      case 'tooltip':
        this.showTooltipStep(step);
        break;
      case 'celebration':
        this.showCelebrationStep(step);
        break;
      default:
        this.next();
    }
  }

  /**
   * Show welcome screen step
   */
  showWelcomeStep(step) {
    this.overlay.showWelcome({
      title: step.title,
      description: step.description,
      primaryAction: step.primaryAction,
      secondaryAction: step.secondaryAction,
    });
  }

  /**
   * Show spotlight step (highlight specific element)
   */
  showSpotlightStep(step) {
    const targetElement = document.querySelector(step.target);

    if (!targetElement) {
      console.warn(`Tutorial target not found: ${step.target}`);
      this.next();
      return;
    }

    // Create spotlight
    this.createSpotlight(targetElement);

    // Show tooltip
    this.showTooltipStep(step);
  }

  /**
   * Create spotlight effect around target element
   */
  createSpotlight(element) {
    // Remove existing spotlight
    if (this.spotlightElement) {
      this.spotlightElement.remove();
    }

    const rect = element.getBoundingClientRect();
    const spotlight = document.createElement('div');
    spotlight.className = 'tutorial-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      top: ${rect.top - 4}px;
      left: ${rect.left - 4}px;
      width: ${rect.width + 8}px;
      height: ${rect.height + 8}px;
      border: 3px solid var(--color-primary);
      border-radius: var(--radius-md);
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
      pointer-events: none;
      z-index: var(--tutorial-z-index);
      animation: tutorial-pulse 2s infinite;
    `;

    document.body.appendChild(spotlight);
    this.spotlightElement = spotlight;

    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Show tooltip step
   */
  showTooltipStep(step) {
    const targetElement = document.querySelector(step.target);

    if (!targetElement) {
      console.warn(`Tutorial target not found: ${step.target}`);
      this.next();
      return;
    }

    // Create tooltip
    this.tooltip = TutorialTooltip.create({
      target: targetElement,
      title: step.title,
      content: step.content,
      position: step.position || 'auto',
      actions: step.actions || [],
      onAction: action => this.handleAction(action),
    });

    document.body.appendChild(this.tooltip);
  }

  /**
   * Show celebration step
   */
  showCelebrationStep(step) {
    this.overlay.showCelebration({
      title: step.title,
      description: step.description,
      illustration: step.illustration,
      actions: step.actions || [],
    });
  }

  /**
   * Handle tutorial action
   */
  handleAction(action) {
    switch (action) {
      case 'next':
        this.next();
        break;
      case 'previous':
        this.previous();
        break;
      case 'skip':
        this.skip();
        break;
      case 'complete':
        this.complete();
        break;
      default:
        // Custom action handlers
        if (this.steps[this.currentStep].onAction) {
          this.steps[this.currentStep].onAction(action);
        }
    }
  }

  /**
   * Move to next step
   */
  next() {
    this.cleanup();
    this.currentStep++;
    this.showCurrentStep();
  }

  /**
   * Move to previous step
   */
  previous() {
    if (this.currentStep <= 0) return;

    this.cleanup();
    this.currentStep--;
    this.showCurrentStep();
  }

  /**
   * Skip tutorial
   */
  skip() {
    this.cleanup();
    this.complete();
  }

  /**
   * Complete tutorial
   */
  complete() {
    this.cleanup();
    this.isActive = false;

    // Mark as completed
    StorageService.set('tutorial-completed', true);

    // Remove overlay
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    // Trigger completion callback
    if (this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * Cleanup current step
   */
  cleanup() {
    // Remove spotlight
    if (this.spotlightElement) {
      this.spotlightElement.remove();
      this.spotlightElement = null;
    }

    // Remove tooltip
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  /**
   * Get transaction count from storage
   */
  async getTransactionCount() {
    // Implementation depends on your transaction service
    const transactions = StorageService.get('transactions', []);
    return transactions.length;
  }

  /**
   * Destroy tutorial manager
   */
  destroy() {
    this.cleanup();
    if (this.overlay) {
      this.overlay.remove();
    }
    this.isActive = false;
  }
}
```

## TutorialOverlay.js

```javascript
/**
 * TutorialOverlay - Full-screen overlay for tutorial steps
 */

import { createButton } from '../../utils/dom-factory.js';

export const TutorialOverlay = {
  create({ onDismiss, onNext, onPrevious }) {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: var(--tutorial-z-index);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-lg);
      opacity: 0;
      transition: opacity var(--transition-normal);
    `;

    // Fade in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    // Store callbacks
    overlay.onDismiss = onDismiss;
    overlay.onNext = onNext;
    overlay.onPrevious = onPrevious;

    // Add methods
    overlay.showWelcome = options => this.showWelcome(overlay, options);
    overlay.showCelebration = options => this.showCelebration(overlay, options);
    overlay.remove = () => this.remove(overlay);

    // Handle escape key
    overlay.addEventListener('keydown', e => {
      if (e.key === 'Escape' && onDismiss) {
        onDismiss();
      }
    });

    return overlay;
  },

  showWelcome(overlay, options) {
    const content = document.createElement('div');
    content.className = 'tutorial-welcome';
    content.style.cssText = `
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-2xl);
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    `;

    content.innerHTML = `
      <div class="tutorial-welcome__illustration">
        <!-- Welcome illustration SVG -->
        <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: var(--spacing-lg);">
          <!-- BlinkBudget logo animation -->
        </svg>
      </div>
      <h2 class="tutorial-welcome__title">${options.title}</h2>
      <p class="tutorial-welcome__description">${options.description}</p>
      <div class="tutorial-welcome__actions">
        ${this.createActions(options.primaryAction, options.secondaryAction)}
      </div>
    `;

    // Clear overlay and add content
    overlay.innerHTML = '';
    overlay.appendChild(content);

    // Add event listeners
    this.attachActionListeners(content, overlay);
  },

  showCelebration(overlay, options) {
    const content = document.createElement('div');
    content.className = 'tutorial-celebration';
    content.style.cssText = `
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-2xl);
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    `;

    content.innerHTML = `
      <div class="tutorial-celebration__illustration">
        ${options.illustration}
      </div>
      <h2 class="tutorial-celebration__title">${options.title}</h2>
      <p class="tutorial-celebration__description">${options.description}</p>
      <div class="tutorial-celebration__actions">
        ${this.createActions(...options.actions)}
      </div>
    `;

    overlay.innerHTML = '';
    overlay.appendChild(content);
    this.attachActionListeners(content, overlay);
  },

  createActions(...actions) {
    return actions
      .map(action => {
        if (!action) return '';

        const variant = action.variant || 'primary';
        return `
        <button class="btn btn--${variant} tutorial-action" data-action="${action.id}">
          ${action.text}
        </button>
      `;
      })
      .join('');
  },

  attachActionListeners(content, overlay) {
    content.querySelectorAll('.tutorial-action').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;

        switch (action) {
          case 'start':
          case 'next':
            if (overlay.onNext) overlay.onNext();
            break;
          case 'skip':
          case 'dismiss':
            if (overlay.onDismiss) overlay.onDismiss();
            break;
          case 'previous':
            if (overlay.onPrevious) overlay.onPrevious();
            break;
          case 'complete':
            if (overlay.onNext) overlay.onNext(); // Will trigger completion
            break;
        }
      });
    });
  },

  remove(overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 250);
  },
};
```

## TutorialTooltip.js

```javascript
/**
 * TutorialTooltip - Contextual tooltip for tutorial steps
 */

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
      max-width: 280px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      z-index: calc(var(--tutorial-z-index) + 1);
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
    window.addEventListener('resize', () => {
      const newPlacement = this.calculatePosition(target, position);
      tooltip.style.top = `${newPlacement.top}px`;
      tooltip.style.left = `${newPlacement.left}px`;
    });

    return tooltip;
  },

  calculatePosition(target, preferredPosition) {
    const targetRect = target.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const tooltipSize = {
      width: 280, // max-width
      height: 150, // estimated height
    };

    let position = {};
    let arrowPosition = 'bottom';

    // Auto positioning logic
    if (preferredPosition === 'auto') {
      // Try to position above first
      if (targetRect.top > tooltipSize.height + 20) {
        position.top = targetRect.top - tooltipSize.height - 10;
        position.left =
          targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
        arrowPosition = 'bottom';
      } else if (
        targetRect.bottom + tooltipSize.height + 20 <
        viewport.height
      ) {
        position.top = targetRect.bottom + 10;
        position.left =
          targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
        arrowPosition = 'top';
      } else if (targetRect.right + tooltipSize.width + 20 < viewport.width) {
        position.top =
          targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
        position.left = targetRect.right + 10;
        arrowPosition = 'left';
      } else {
        position.top =
          targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
        position.left = targetRect.left - tooltipSize.width - 10;
        arrowPosition = 'right';
      }
    } else {
      // Use preferred position
      switch (preferredPosition) {
        case 'top':
          position.top = targetRect.top - tooltipSize.height - 10;
          position.left =
            targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
          arrowPosition = 'bottom';
          break;
        case 'bottom':
          position.top = targetRect.bottom + 10;
          position.left =
            targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
          arrowPosition = 'top';
          break;
        case 'left':
          position.top =
            targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
          position.left = targetRect.left - tooltipSize.width - 10;
          arrowPosition = 'right';
          break;
        case 'right':
          position.top =
            targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
          position.left = targetRect.right + 10;
          arrowPosition = 'left';
          break;
      }
    }

    // Ensure tooltip stays within viewport
    position.left = Math.max(
      10,
      Math.min(position.left, viewport.width - tooltipSize.width - 10)
    );
    position.top = Math.max(
      10,
      Math.min(position.top, viewport.height - tooltipSize.height - 10)
    );

    return {
      ...position,
      arrowPosition,
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
                  data-action="${action.id}">
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
        case 'Enter':
          const focusedButton = tooltip.querySelector(':focus');
          if (focusedButton && tooltip.onAction) {
            tooltip.onAction(focusedButton.dataset.action);
          }
          break;
      }
    });
  },

  remove(tooltip) {
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 250);
  },
};
```

## CSS Implementation

```css
/* tutorial.css */

/* Tutorial-specific tokens */
:root {
  --tutorial-z-index: 9999;
  --tutorial-overlay-opacity: 0.75;
  --tutorial-spotlight-width: 3px;
  --tutorial-animation-duration: 300ms;
}

/* Tutorial overlay */
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, var(--tutorial-overlay-opacity));
  backdrop-filter: blur(4px);
  z-index: var(--tutorial-z-index);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

/* Spotlight effect */
.tutorial-spotlight {
  position: fixed;
  border: var(--tutorial-spotlight-width) solid var(--color-primary);
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
  pointer-events: none;
  z-index: var(--tutorial-z-index);
  animation: tutorial-pulse 2s infinite;
}

@keyframes tutorial-pulse {
  0%,
  100% {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
  }
  50% {
    border-color: var(--color-primary-light);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8);
  }
}

/* Tutorial tooltip */
.tutorial-tooltip {
  position: absolute;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  max-width: 280px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: calc(var(--tutorial-z-index) + 1);
}

.tutorial-tooltip--mobile {
  max-width: calc(100vw - var(--spacing-2xl));
  font-size: var(--font-size-sm);
}

.tutorial-tooltip__arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.tutorial-tooltip__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-main);
}

.tutorial-tooltip__content {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.tutorial-tooltip__actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

/* Welcome screen styles */
.tutorial-welcome {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.tutorial-welcome__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-main);
}

.tutorial-welcome__description {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xl);
}

.tutorial-welcome__actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
}

/* Celebration styles */
.tutorial-celebration {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.tutorial-celebration__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-main);
}

.tutorial-celebration__description {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xl);
}

.tutorial-celebration__actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tutorial-tooltip {
    max-width: calc(100vw - var(--spacing-lg));
  }

  .tutorial-welcome,
  .tutorial-celebration {
    max-width: calc(100vw - var(--spacing-lg));
    padding: var(--spacing-lg);
  }

  .tutorial-welcome__title,
  .tutorial-celebration__title {
    font-size: var(--font-size-lg);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .tutorial-spotlight {
    animation: none;
  }

  .tutorial-tooltip,
  .tutorial-overlay {
    transition: none;
  }
}

/* Focus styles for accessibility */
.tutorial-tooltip:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.tutorial-tooltip-action:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## Integration with Existing Components

### Adding Tutorial Support to TransactionForm

```javascript
// In TransactionForm.js, add tutorial data attributes
amountInput.setAttribute('data-tutorial-target', 'amount-input');
categorySelector.container.setAttribute(
  'data-tutorial-target',
  'category-selector'
);
typeToggle.container.setAttribute('data-tutorial-target', 'type-toggle');
```

### Tutorial Initialization in Main App

```javascript
// In your main app initialization
import { TutorialManager } from './components/tutorial/TutorialManager.js';

class BlinkBudgetApp {
  async initialize() {
    // ... existing initialization

    // Initialize tutorial
    const tutorialManager = new TutorialManager();
    const shouldShowTutorial = await tutorialManager.initialize();

    if (shouldShowTutorial) {
      // Show tutorial after app is ready
      setTimeout(() => {
        tutorialManager.start();
      }, 1000);
    }

    // Store reference for later use
    this.tutorialManager = tutorialManager;
  }
}
```

This specification provides developers with everything needed to implement the interactive tutorial system while maintaining BlinkBudget's existing architecture and design standards.
