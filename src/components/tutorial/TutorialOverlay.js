/**
 * TutorialOverlay - Full-screen overlay for tutorial steps
 * Handles welcome screens and celebration screens
 */

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
      z-index: 9999;
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
      opacity: 0;
      transform: scale(0.9);
      transition: all var(--transition-normal);
    `;

    // Create welcome illustration
    const illustration = this.createWelcomeIllustration();

    content.innerHTML = `
      <div class="tutorial-welcome__illustration">
        ${illustration}
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

    // Animate in
    requestAnimationFrame(() => {
      content.style.opacity = '1';
      content.style.transform = 'scale(1)';
    });

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
      opacity: 0;
      transform: scale(0.9);
      transition: all var(--transition-normal);
    `;

    // Create celebration illustration
    const illustration = this.createCelebrationIllustration(
      options.illustration
    );

    content.innerHTML = `
      <div class="tutorial-celebration__illustration">
        ${illustration}
      </div>
      <h2 class="tutorial-celebration__title">${options.title}</h2>
      <p class="tutorial-celebration__description">${options.description}</p>
      <div class="tutorial-celebration__actions">
        ${this.createActions(...options.actions)}
      </div>
    `;

    overlay.innerHTML = '';
    overlay.appendChild(content);

    // Animate in
    requestAnimationFrame(() => {
      content.style.opacity = '1';
      content.style.transform = 'scale(1)';
    });

    this.attachActionListeners(content, overlay);
  },

  createWelcomeIllustration() {
    return `
      <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: var(--spacing-lg);">
        <!-- Animated logo/illustration -->
        <g class="welcome-animation">
          <!-- Background circle -->
          <circle cx="60" cy="60" r="50" fill="var(--color-primary)" opacity="0.1"/>
          
          <!-- Phone outline -->
          <rect x="40" y="25" width="40" height="70" rx="8" 
                fill="none" stroke="var(--color-primary)" stroke-width="2"/>
          
          <!-- Touch points animation -->
          <circle cx="50" cy="45" r="4" fill="var(--color-primary)" class="touch-point-1"/>
          <circle cx="60" cy="60" r="4" fill="var(--color-primary)" class="touch-point-2"/>
          <circle cx="70" cy="75" r="4" fill="var(--color-primary)" class="touch-point-3"/>
          
          <!-- Connection lines -->
          <path d="M50 45 L60 60 L70 75" 
                stroke="var(--color-primary)" stroke-width="1.5" 
                fill="none" stroke-dasharray="2,2" class="connection-line"/>
        </g>
      </svg>
    `;
  },

  createCelebrationIllustration(type) {
    switch (type) {
      case 'success-check':
        return `
          <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: var(--spacing-lg);">
            <g class="success-animation">
              <!-- Success circle -->
              <circle cx="60" cy="60" r="50" fill="var(--color-primary)" opacity="0.1"/>
              <circle cx="60" cy="60" r="40" fill="none" stroke="var(--color-primary)" 
                      stroke-width="3" class="success-circle"/>
              
              <!-- Checkmark -->
              <path d="M40 60 L52 72 L80 44" 
                    stroke="var(--color-primary)" stroke-width="4" 
                    fill="none" stroke-linecap="round" stroke-linejoin="round" 
                    class="checkmark-path"/>
            </g>
          </svg>
        `;
      default:
        return this.createWelcomeIllustration();
    }
  },

  createActions(...actions) {
    return actions
      .map(action => {
        if (!action) return '';

        const variant = action.variant || 'primary';
        return `
        <button class="btn btn--${variant} tutorial-action" 
                data-action="${action.id}"
                style="margin: 0 var(--spacing-xs);">
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
          case 'complete':
            if (overlay.onNext) overlay.onNext();
            break;
          case 'skip':
          case 'dismiss':
            if (overlay.onDismiss) overlay.onDismiss();
            break;
          case 'previous':
            if (overlay.onPrevious) overlay.onPrevious();
            break;
          case 'dashboard':
            if (overlay.onNext) overlay.onNext(); // Will trigger completion and navigation
            break;
        }
      });
    });

    // Add keyboard navigation
    content.addEventListener('keydown', e => {
      const focusedButton = content.querySelector(':focus');

      switch (e.key) {
        case 'Enter':
          if (focusedButton) {
            focusedButton.click();
          }
          break;
        case 'Tab': {
          // Allow default tab behavior but constrain to overlay
          const focusableElements = content.querySelectorAll(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

    // Focus first button for accessibility
    const firstButton = content.querySelector('.tutorial-action');
    if (firstButton) {
      setTimeout(() => firstButton.focus(), 100);
    }
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
