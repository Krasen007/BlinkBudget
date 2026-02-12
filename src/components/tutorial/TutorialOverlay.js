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
    overlay.showInfo = options => this.showInfo(overlay, options);
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

    const illustrationDiv = document.createElement('div');
    illustrationDiv.className = 'tutorial-welcome__illustration';
    illustrationDiv.innerHTML = illustration; // Safe: hardcoded SVG from internal method

    const title = document.createElement('h2');
    title.className = 'tutorial-welcome__title';
    title.textContent = options.title;

    const description = document.createElement('p');
    description.className = 'tutorial-welcome__description';
    description.textContent = options.description;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'tutorial-welcome__actions';
    actionsDiv.appendChild(
      this.createActions(options.primaryAction, options.secondaryAction)
    );

    content.append(illustrationDiv, title, description, actionsDiv);

    // Clear overlay and add content
    overlay.innerHTML = '';
    overlay.appendChild(content);

    // Animate in
    requestAnimationFrame(() => {
      content.style.opacity = '1';
      content.style.transform = 'scale(1)';
    });

    // Attach click listeners to action buttons via delegation
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

    const illustrationDiv = document.createElement('div');
    illustrationDiv.className = 'tutorial-celebration__illustration';
    illustrationDiv.innerHTML = illustration; // Safe: hardcoded SVG

    const title = document.createElement('h2');
    title.className = 'tutorial-celebration__title';
    title.textContent = options.title;

    const description = document.createElement('div');
    description.className = 'tutorial-celebration__description';
    description.appendChild(this.createSafeContent(options.description));

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'tutorial-celebration__actions';
    actionsDiv.appendChild(this.createActions(...(options.actions || [])));

    content.append(illustrationDiv, title, description, actionsDiv);

    overlay.innerHTML = '';
    overlay.appendChild(content);

    // Animate in
    requestAnimationFrame(() => {
      content.style.opacity = '1';
      content.style.transform = 'scale(1)';
    });

    this.attachActionListeners(content, overlay);
  },

  showInfo(overlay, options) {
    const content = document.createElement('div');
    content.className = 'tutorial-info';
    content.style.cssText = `
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-2xl);
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      opacity: 0;
      transform: scale(0.9);
      transition: all var(--transition-normal);
    `;

    // Create illustration if provided
    if (options.illustration) {
      const illustration = this.createInfoIllustration(options.illustration);
      const illustrationDiv = document.createElement('div');
      illustrationDiv.className = 'tutorial-info__illustration';
      illustrationDiv.innerHTML = illustration; // Safe: hardcoded SVG
      content.appendChild(illustrationDiv);
    }

    const title = document.createElement('h2');
    title.className = 'tutorial-info__title';
    title.textContent = options.title;
    content.appendChild(title);

    const infoContent = document.createElement('div');
    infoContent.className = 'tutorial-info__content';
    infoContent.appendChild(this.createSafeContent(options.content));
    content.appendChild(infoContent);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'tutorial-info__actions';
    actionsDiv.appendChild(this.createActions(...(options.actions || [])));
    content.appendChild(actionsDiv);

    overlay.innerHTML = '';
    overlay.appendChild(content);

    // Animate in
    requestAnimationFrame(() => {
      content.style.opacity = '1';
      content.style.transform = 'scale(1)';
    });

    this.attachActionListeners(content, overlay);
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

  createInfoIllustration(type) {
    // Return existing SVG string helpers...
    switch (type) {
      case 'three-clicks':
        return `
          <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: var(--spacing-lg);">
            <g class="three-clicks-animation">
              <circle cx="30" cy="60" r="8" fill="var(--color-primary)" opacity="0.8"/>
              <circle cx="60" cy="60" r="8" fill="var(--color-primary)" opacity="0.8"/>
              <circle cx="90" cy="60" r="8" fill="var(--color-primary)" opacity="0.8"/>
              <path d="M38 60 L52 60 M68 60 L82 60" stroke="var(--color-primary)" stroke-width="2" opacity="0.5"/>
              <text x="30" y="45" text-anchor="middle" fill="var(--color-primary)" font-size="12" font-weight="bold">1</text>
              <text x="60" y="45" text-anchor="middle" fill="var(--color-primary)" font-size="12" font-weight="bold">2</text>
              <text x="90" y="45" text-anchor="middle" fill="var(--color-primary)" font-size="12" font-weight="bold">3</text>
            </g>
          </svg>
        `;
      case 'smart-features':
        return `
          <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: var(--spacing-lg);">
            <g class="smart-features-animation">
              <path d="M60 30 C40 30, 25 45, 25 60 C25 75, 40 90, 60 90 C80 90, 95 75, 95 60 C95 45, 80 30, 60 30 Z" 
                    fill="var(--color-primary)" opacity="0.1"/>
              <circle cx="60" cy="55" r="15" fill="var(--color-primary)" opacity="0.8"/>
              <rect x="50" y="70" width="20" height="8" fill="var(--color-primary)" opacity="0.6"/>
              <path d="M60 25 L60 15 M45 35 L35 25 M75 35 L85 25" stroke="var(--color-primary)" stroke-width="2" opacity="0.6"/>
            </g>
          </svg>
        `;
      case 'accounts':
        return `
          <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: var(--spacing-lg);">
            <g class="accounts-animation">
              <rect x="25" y="40" width="35" height="25" rx="4" fill="var(--color-primary)" opacity="0.8"/>
              <rect x="35" y="50" width="35" height="25" rx="4" fill="var(--color-primary)" opacity="0.6"/>
              <rect x="45" y="60" width="35" height="25" rx="4" fill="var(--color-primary)" opacity="0.4"/>
              <rect x="30" y="47" width="8" height="6" fill="white" opacity="0.8"/>
              <rect x="40" y="57" width="8" height="6" fill="white" opacity="0.8"/>
              <rect x="50" y="67" width="8" height="6" fill="white" opacity="0.8"/>
            </g>
          </svg>
        `;
      case 'planning':
        return `
          <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: var(--spacing-lg);">
            <g class="planning-animation">
              <rect x="20" y="70" width="15" height="20" fill="var(--color-primary)" opacity="0.6"/>
              <rect x="40" y="60" width="15" height="30" fill="var(--color-primary)" opacity="0.7"/>
              <rect x="60" y="50" width="15" height="40" fill="var(--color-primary)" opacity="0.8"/>
              <rect x="80" y="40" width="15" height="50" fill="var(--color-primary)" opacity="0.9"/>
              <path d="M27 70 L47 60 L67 50 L87 40" stroke="var(--color-primary)" stroke-width="2" fill="none"/>
              <circle cx="87" cy="40" r="4" fill="var(--color-primary)"/>
            </g>
          </svg>
        `;
      case 'mobile':
        return `
          <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: var(--spacing-lg);">
            <g class="mobile-animation">
              <rect x="40" y="25" width="40" height="70" rx="8" 
                    fill="var(--color-primary)" opacity="0.1" stroke="var(--color-primary)" stroke-width="2"/>
              <rect x="45" y="35" width="30" height="45" fill="var(--color-primary)" opacity="0.2"/>
              <circle cx="60" cy="57" r="8" fill="var(--color-primary)" opacity="0.8"/>
              <circle cx="60" cy="57" r="12" fill="none" stroke="var(--color-primary)" 
                      stroke-width="2" opacity="0.4" class="touch-ripple"/>
              <rect x="55" y="85" width="10" height="2" rx="1" fill="var(--color-primary)" opacity="0.6"/>
            </g>
          </svg>
        `;
      case 'success-celebration':
        return this.createCelebrationIllustration('success-check');
      default:
        return this.createWelcomeIllustration();
    }
  },

  createActions(...actions) {
    const fragment = document.createDocumentFragment();

    actions.forEach(action => {
      if (!action) return;

      const variant = action.variant || 'primary';
      const button = document.createElement('button');
      button.className = `btn btn--${variant} tutorial-action`;
      button.dataset.action = action.id;
      button.style.margin = '0 var(--spacing-xs)';
      button.textContent = action.text;

      fragment.appendChild(button);
    });

    return fragment;
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
      switch (e.key) {
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
