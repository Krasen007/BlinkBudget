/**
 * Enhanced Button Component - WebApp.md Component Pattern
 * Standardized button with accessibility, animations, and touch support
 */

import { BaseComponent } from './BaseComponent.js';

export class Button extends BaseComponent {
  constructor(element, options = {}) {
    super(element, {
      text: '',
      variant: 'primary', // primary, secondary, success, warning, error
      size: 'medium', // small, medium, large
      type: 'button',
      disabled: false,
      loading: false,
      icon: null,
      iconPosition: 'left', // left, right
      fullWidth: false,
      href: null, // for link-style buttons
      target: '_self',
      onClick: null,
      preventDefault: false,
      ...options,
    });
  }

  getDefaultOptions() {
    return {
      text: '',
      variant: 'primary',
      size: 'medium',
      type: 'button',
      disabled: false,
      loading: false,
      icon: null,
      iconPosition: 'left',
      fullWidth: false,
      href: null,
      target: '_self',
      onClick: null,
      preventDefault: false,
    };
  }

  setupElement() {
    super.setupElement();

    if (!this.element) {
      console.warn('Button: No element provided. Button will not be rendered.');
      return;
    }

    this.element.classList.add('btn');
    this.element.classList.add(`btn-${this.options.variant}`);
    this.element.classList.add(`btn-${this.options.size}`);

    if (this.options.fullWidth) {
      this.element.classList.add('btn-full-width');
    }

    if (this.options.disabled) {
      this.element.classList.add('btn-disabled');
    } else {
      this.element.classList.remove('btn-disabled');
    }

    if (this.options.loading) {
      this.element.classList.add('btn-loading');
    } else {
      this.element.classList.remove('btn-loading');
    }
  }

  render() {
    if (!this.element) {
      return;
    }

    this.element.innerHTML = '';

    // Create button content
    const content = this.createElement('span', ['btn-content']);

    // Add icon if specified
    if (this.options.icon) {
      const icon = this.createElement('span', [
        'btn-icon',
        `btn-icon-${this.options.iconPosition}`,
      ]);
      icon.textContent = this.options.icon;
      icon.setAttribute('aria-hidden', 'true');

      if (this.options.iconPosition === 'right') {
        content.appendChild(this.createTextNode(this.options.text));
        content.appendChild(icon);
      } else {
        content.appendChild(icon);
        content.appendChild(this.createTextNode(this.options.text));
      }
    } else {
      content.appendChild(this.createTextNode(this.options.text));
    }

    // Add loading spinner
    if (this.options.loading) {
      const spinner = this.createElement('span', ['btn-spinner']);
      spinner.innerHTML = '<div class="spinner-inner"></div>';
      content.appendChild(spinner);
    }

    this.element.appendChild(content);

    // Set attributes
    this.element.setAttribute('type', this.options.type);

    // Only set disabled attribute if actually disabled or loading
    if (this.options.disabled || this.options.loading) {
      this.element.setAttribute('disabled', 'true');
    } else {
      this.element.removeAttribute('disabled');
    }

    if (this.options.href) {
      this.element.setAttribute('href', this.options.href);
      this.element.setAttribute('target', this.options.target);
      if (this.options.target === '_blank') {
        this.element.setAttribute('rel', 'noopener noreferrer');
      }
    }
  }

  bindEvents() {
    super.bindEvents();

    if (this.options.onClick && !this.options.disabled) {
      this.addEventListener('click', e => {
        if (!this.options.disabled && !this.options.loading) {
          if (this.options.preventDefault) {
            e.preventDefault();
          }
          this.options.onClick(e);
        }
      });
    }

    // Touch event handlers for mobile optimization
    this.addEventListener(
      'touchstart',
      _e => {
        if (!this.options.disabled && !this.options.loading) {
          this.element.classList.add('btn-touch-active');
        }
      },
      { passive: true }
    );

    this.addEventListener(
      'touchend',
      () => {
        this.element.classList.remove('btn-touch-active');
      },
      { passive: true }
    );

    this.addEventListener(
      'touchcancel',
      () => {
        this.element.classList.remove('btn-touch-active');
      },
      { passive: true }
    );

    // Keyboard support
    this.addEventListener('keydown', e => {
      if (
        (e.key === 'Enter' || e.key === ' ') &&
        !this.options.disabled &&
        !this.options.loading
      ) {
        e.preventDefault();
        if (this.options.onClick) {
          this.options.onClick(e);
        }
      }
    });
  }

  // Public API methods
  setText(text) {
    this.options.text = text;
    this.render();
  }

  setVariant(variant) {
    if (!this.element) {
      return;
    }
    this.element.classList.remove(`btn-${this.options.variant}`);
    this.options.variant = variant;
    this.element.classList.add(`btn-${this.options.variant}`);
  }

  setDisabled(disabled) {
    this.options.disabled = disabled;
    this.setupElement();
    this.render();
  }

  setLoading(loading) {
    this.options.loading = loading;
    this.setupElement();
    this.render();
  }

  activate() {
    if (
      this.options.onClick &&
      !this.options.disabled &&
      !this.options.loading
    ) {
      this.options.onClick(new Event('click'));
    }
  }

  getRole() {
    return this.options.href ? 'link' : 'button';
  }

  getAriaLabel() {
    if (this.options.loading) return 'Loading';
    if (this.options.disabled) return 'Disabled button';
    return this.options.text || null;
  }

  // Utility method to create text nodes
  createTextNode(text) {
    return document.createTextNode(text || '');
  }
}

/**
 * Functional Component Wrapper - Backward compatibility
 */
export const ButtonComponent = (props = {}) => {
  const button = document.createElement('button');
  new Button(button, props);
  return button;
};

/**
 * Factory function for creating buttons
 */
export function createButton(element, options = {}) {
  return new Button(element, options);
}

/**
 * Backward compatibility export
 */
export { Button as default };
