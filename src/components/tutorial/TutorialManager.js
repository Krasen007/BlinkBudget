/**
 * TutorialManager - Main controller for the interactive tutorial system
 * Handles tutorial state, step progression, and component coordination
 */

import { TutorialOverlay } from './TutorialOverlay.js';
import { TutorialTooltip } from './TutorialTooltip.js';
import {
  TUTORIAL_STEPS,
  TUTORIAL_CONFIG,
  TUTORIAL_EVENTS,
} from '../../utils/tutorial-config.js';
import { SettingsService } from '../../core/settings-service.js';

export class TutorialManager {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.overlay = null;
    this.tooltip = null;
    this.steps = TUTORIAL_STEPS;
    this.spotlightElement = null;
    this.seenSteps = new Set();
    this.onComplete = null;
    this.timeouts = new Set(); // Track active timeouts

    // Bind methods to maintain context
    this.handleAction = this.handleAction.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Initialize tutorial system
   * @returns {Promise<boolean>} Whether tutorial should be shown
   */
  async initialize() {
    // Load seen steps from storage
    this.loadSeenSteps();

    // Check if tutorial should be shown
    const hasSeenTutorial = SettingsService.getSetting(
      TUTORIAL_CONFIG.completedKey
    );
    const isDismissed = SettingsService.getSetting(
      TUTORIAL_CONFIG.dismissedKey
    );
    const transactionCount = await this.getTransactionCount();

    return !hasSeenTutorial && !isDismissed && transactionCount === 0;
  }

  /**
   * Load seen steps from storage
   */
  loadSeenSteps() {
    const seenStepsData =
      SettingsService.getSetting(TUTORIAL_CONFIG.seenStepsKey) || [];
    this.seenSteps = new Set(seenStepsData);
  }

  /**
   * Save seen steps to storage
   */
  saveSeenSteps() {
    SettingsService.saveSetting(
      TUTORIAL_CONFIG.seenStepsKey,
      Array.from(this.seenSteps)
    );
  }

  /**
   * Mark current step as seen
   */
  markStepAsSeen(stepId) {
    this.seenSteps.add(stepId);
    this.saveSeenSteps();
  }

  /**
   * Check if a step has been seen
   */
  isStepSeen(stepId) {
    return this.seenSteps.has(stepId);
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

    // Add global event listeners
    this.addGlobalEventListeners();

    // Emit start event
    this.emitEvent(TUTORIAL_EVENTS.STARTED, { step: this.currentStep });

    // Show first step
    this.showCurrentStep();
  }

  /**
   * Start the tutorial after a delay
   * @param {number} delay - Delay in milliseconds
   */
  startWithDelay(delay) {
    this.setTimeout(() => {
      this.start();
    }, delay);
  }

  /**
   * Add global event listeners
   */
  addGlobalEventListeners() {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Remove global event listeners
   */
  removeGlobalEventListeners() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Reposition tooltip if it exists
    if (this.tooltip && this.steps[this.currentStep]) {
      const step = this.steps[this.currentStep];
      const targetElement = document.querySelector(step.target);

      if (targetElement) {
        const placement = TutorialTooltip.calculatePosition(
          targetElement,
          step.position
        );
        this.tooltip.style.top = `${placement.top}px`;
        this.tooltip.style.left = `${placement.left}px`;
      }
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event) {
    if (!this.isActive) return;

    switch (event.key) {
      case 'Escape':
        this.skip();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.previous();
        break;
    }
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

    // Mark step as seen
    this.markStepAsSeen(step.id);

    // Emit step started event
    this.emitEvent(TUTORIAL_EVENTS.STEP_STARTED, {
      stepId: step.id,
      stepIndex: this.currentStep,
    });

    // Handle overlay visibility based on step type
    const usesOverlay = [
      'welcome',
      'info',
      'celebration',
      'navigation',
    ].includes(step.type);

    if (this.overlay) {
      if (usesOverlay) {
        this.overlay.style.display = 'flex';
        // Ensure opacity is reset if it was hidden
        this.setTimeout(() => {
          if (this.overlay) this.overlay.style.opacity = '1';
        }, 0);
      } else {
        this.overlay.style.display = 'none';
      }
    }

    // Handle different step types
    switch (step.type) {
      case 'welcome':
        this.showWelcomeStep(step);
        break;
      case 'navigation':
        this.showNavigationStep(step);
        break;
      case 'spotlight':
        this.showSpotlightStep(step);
        break;
      case 'info':
        this.showInfoStep(step);
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
    const delay = step.delay || 0;

    if (delay > 0) {
      this.setTimeout(() => {
        this.executeSpotlightStep(step);
      }, delay);
    } else {
      this.executeSpotlightStep(step);
    }
  }

  /**
   * Execute the actual spotlight step after delay
   */
  executeSpotlightStep(step) {
    // Try to find the target element with retries
    this.findTargetWithRetry(step.target, targetElement => {
      // Check if we are still active and on the correct step before proceeding
      if (!this.isActive || this.steps[this.currentStep]?.id !== step.id) {
        return;
      }

      if (!targetElement) {
        console.warn(`Tutorial target not found after retries: ${step.target}`);
        this.emitEvent(TUTORIAL_EVENTS.TARGET_NOT_FOUND, {
          target: step.target,
        });
        this.next();
        return;
      }

      // Create spotlight
      this.createSpotlight(targetElement);

      // Show tooltip
      this.showTooltipStep(step);
    });
  }

  /**
   * Find target element with retries for dynamic content
   */
  findTargetWithRetry(target, callback, retries = 8, delay = 1000) {
    const targetElement = document.querySelector(target);

    if (targetElement) {
      callback(targetElement);
    } else if (retries > 0) {
      this.setTimeout(() => {
        this.findTargetWithRetry(target, callback, retries - 1, delay);
      }, delay);
    } else {
      callback(null);
    }
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
      top: ${rect.top - TUTORIAL_CONFIG.spotlightPadding}px;
      left: ${rect.left - TUTORIAL_CONFIG.spotlightPadding}px;
      width: ${rect.width + TUTORIAL_CONFIG.spotlightPadding * 2}px;
      height: ${rect.height + TUTORIAL_CONFIG.spotlightPadding * 2}px;
      border: 3px solid var(--color-primary);
      border-radius: var(--radius-md);
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
      pointer-events: none;
      z-index: 9999;
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
      this.emitEvent(TUTORIAL_EVENTS.TARGET_NOT_FOUND, { target: step.target });
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
      onAction: this.handleAction,
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
   * Show navigation step
   */
  showNavigationStep(step) {
    this.overlay.showInfo({
      title: step.title,
      content: step.content,
      illustration: step.illustration,
      actions: step.actions || [],
    });

    // Navigate to the target route after a short delay
    this.setTimeout(() => {
      import('../../core/router.js').then(({ Router }) => {
        Router.navigate(step.target);
      });
    }, 1000);
  }

  /**
   * Show info step
   */
  showInfoStep(step) {
    this.overlay.showInfo({
      title: step.title,
      content: step.content,
      illustration: step.illustration,
      actions: step.actions || [],
    });
  }

  /**
   * Handle tutorial action
   */
  handleAction(action) {
    this.emitEvent(TUTORIAL_EVENTS.ACTION_TRIGGERED, {
      action,
      stepId: this.steps[this.currentStep]?.id,
    });

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
      case 'dismiss':
        this.dismiss();
        break;
      case 'dashboard':
        this.complete();
        import('../../core/router.js').then(({ Router }) => {
          Router.navigate('dashboard');
        });
        break;
      default:
        // Custom action handlers
        if (this.steps[this.currentStep]?.onAction) {
          this.steps[this.currentStep].onAction(action);
        }
    }
  }

  /**
   * Move to next step
   */
  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.emitEvent(TUTORIAL_EVENTS.STEP_COMPLETED, {
        stepId: this.steps[this.currentStep]?.id,
        stepIndex: this.currentStep,
      });

      this.cleanup();
      this.currentStep++;
      this.showCurrentStep();
    } else {
      this.complete();
    }
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
    this.clearTimeouts();
    this.cleanup();
    this.isActive = false;

    // Mark as completed since skipped implies "don't show again"
    SettingsService.saveSetting(TUTORIAL_CONFIG.completedKey, true);

    this.removeOverlay();
    this.removeGlobalEventListeners();

    this.emitEvent(TUTORIAL_EVENTS.SKIPPED, { stepIndex: this.currentStep });
  }

  /**
   * Dismiss tutorial (can be shown again later)
   */
  dismiss() {
    this.cleanup();
    this.isActive = false;

    // Mark as dismissed but not completed
    SettingsService.saveSetting(TUTORIAL_CONFIG.dismissedKey, true);

    this.removeOverlay();
    this.removeGlobalEventListeners();
    this.emitEvent(TUTORIAL_EVENTS.DISMISSED, { stepIndex: this.currentStep });
  }

  /**
   * Complete tutorial
   */
  complete() {
    this.cleanup();
    this.isActive = false;

    // Mark as completed
    SettingsService.saveSetting(TUTORIAL_CONFIG.completedKey, true);

    this.removeOverlay();
    this.removeGlobalEventListeners();

    this.emitEvent(TUTORIAL_EVENTS.COMPLETED, {
      totalSteps: this.steps.length,
      seenSteps: Array.from(this.seenSteps),
    });

    // Trigger completion callback
    if (this.onComplete) {
      this.onComplete();
    }
  }

  removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
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
   * Wrapper for setTimeout that tracks ID for cleanup
   */
  setTimeout(callback, delay) {
    const id = setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  /**
   * Clear all active timeouts
   */
  clearTimeouts() {
    this.timeouts.forEach(clearTimeout);
    this.timeouts.clear();
  }

  /**
   * Get transaction count from storage
   */
  async getTransactionCount() {
    try {
      // Use the existing StorageService to get transactions
      const transactions = await this.getAllTransactions();
      return transactions.length;
    } catch (error) {
      console.warn('Could not get transaction count:', error);
      return 0;
    }
  }

  /**
   * Get all transactions (helper method)
   */
  async getAllTransactions() {
    // Import dynamically to avoid circular dependencies
    const { StorageService } = await import('../../core/storage.js');
    return StorageService.getAllTransactions();
  }

  /**
   * Emit custom event
   */
  emitEvent(eventName, data) {
    const event = new CustomEvent(eventName, {
      detail: data,
    });
    window.dispatchEvent(event);
  }

  /**
   * Restart tutorial from beginning
   */
  restart() {
    this.clearTimeouts();
    this.cleanup();
    this.currentStep = 0;
    this.seenSteps.clear();
    this.saveSeenSteps();
    SettingsService.saveSetting(TUTORIAL_CONFIG.completedKey, false);
    SettingsService.saveSetting(TUTORIAL_CONFIG.dismissedKey, false);
    this.start();
  }

  /**
   * Destroy tutorial manager
   */
  destroy() {
    this.clearTimeouts();
    this.cleanup();
    this.removeGlobalEventListeners();
    this.removeOverlay();
    this.isActive = false;
  }
}
