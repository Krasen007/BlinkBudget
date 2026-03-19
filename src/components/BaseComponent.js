/**
 * Base Component Pattern - WebApp.md Component Architecture
 * Provides consistent component structure and lifecycle management
 */

export class BaseComponent {
  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...this.getDefaultOptions(), ...options };
    this.state = { ...this.getDefaultState() };
    this.children = new Map();
    this.eventListeners = new Map();
    this.isDestroyed = false;

    this.init();
  }

  /**
   * Default options - override in subclasses
   */
  getDefaultOptions() {
    return {
      className: '',
      focusable: false,
      animated: true,
      accessible: true,
    };
  }

  /**
   * Default state - override in subclasses
   */
  getDefaultState() {
    return {
      loading: false,
      error: null,
      focused: false,
      disabled: false,
    };
  }

  /**
   * Initialize component
   */
  init() {
    this.setupElement();
    this.bindEvents();
    this.render();
    this.onInit();
  }

  /**
   * Setup element with base classes and attributes
   */
  setupElement() {
    if (!this.element) return;

    // Add base classes
    const baseClasses = ['component'];
    if (this.options.className) {
      baseClasses.push(this.options.className);
    }
    if (this.state.loading) {
      baseClasses.push('loading');
    }
    if (this.state.error) {
      baseClasses.push('error');
    }

    this.element.className = baseClasses.join(' ');

    // Add accessibility attributes
    if (this.options.accessible) {
      this.setupAccessibility();
    }

    // Add focus management
    if (this.options.focusable) {
      this.setupFocusManagement();
    }
  }

  /**
   * Setup accessibility attributes
   */
  setupAccessibility() {
    // Add ARIA attributes based on component role
    if (this.getRole()) {
      this.element.setAttribute('role', this.getRole());
    }

    if (this.getAriaLabel()) {
      this.element.setAttribute('aria-label', this.getAriaLabel());
    }

    if (this.getAriaDescribedBy()) {
      this.element.setAttribute('aria-describedby', this.getAriaDescribedBy());
    }
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    if (this._focusSetupDone) return;
    this._focusSetupDone = true;

    this.element.setAttribute('tabindex', this.state.disabled ? '-1' : '0');

    this._handleFocus = () => {
      this.setState({ focused: true });
      this.onFocus();
    };

    this._handleBlur = () => {
      this.setState({ focused: false });
      this.onBlur();
    };

    this._handleKeyDown = e => this.handleKeyDown(e);

    this.addEventListener('focus', this._handleFocus);
    this.addEventListener('blur', this._handleBlur);

    // Add keyboard navigation
    this.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Bind events - override in subclasses
   */
  bindEvents() {
    // Subclasses implement specific event bindings
  }

  /**
   * Render component - override in subclasses
   */
  render() {
    // Subclasses implement specific rendering
  }

  /**
   * Component lifecycle hooks
   */
  onInit() {
    // Override in subclasses
  }

  onFocus() {
    // Override in subclasses
  }

  onBlur() {
    // Override in subclasses
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event) {
    // Common keyboard patterns
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (
          this.element.tagName !== 'INPUT' &&
          this.element.tagName !== 'TEXTAREA'
        ) {
          event.preventDefault();
          this.activate();
        }
        break;
      case 'Escape':
        this.cancel();
        break;
    }
  }

  /**
   * Activate component (Enter/Space)
   */
  activate() {
    if (typeof this.onClick === 'function') {
      this.onClick();
    }
  }

  /**
   * Cancel action (Escape)
   */
  cancel() {
    if (typeof this.onCancel === 'function') {
      this.onCancel();
    }
  }

  /**
   * Update component state
   */
  setState(newState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };

    this.setupElement(); // Update classes and attributes
    this.onStateChange(prevState, this.state);
    this.render();
  }

  /**
   * State change handler
   */
  onStateChange(_prevState, _nextState) {
    // Override in subclasses
  }

  /**
   * Add event listener with cleanup tracking
   */
  addEventListener(type, handler, options = {}) {
    if (this.isDestroyed || !this.element) return;

    const wrappedHandler = handler.bind(this);
    this.element.addEventListener(type, wrappedHandler, options);

    // Track for cleanup
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners
      .get(type)
      .push({ original: handler, handler: wrappedHandler, options });
  }

  /**
   * Remove event listener
   */
  removeEventListener(type, handler) {
    if (!this.element) return;

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.findIndex(
        l => l.original === handler || l.handler === handler
      );
      if (index !== -1) {
        const entry = listeners[index];
        this.element.removeEventListener(type, entry.handler, entry.options);
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Add child component
   */
  addChild(name, component) {
    this.children.set(name, component);
    return component;
  }

  /**
   * Get child component
   */
  getChild(name) {
    return this.children.get(name);
  }

  /**
   * Remove child component
   */
  removeChild(name) {
    const child = this.children.get(name);
    if (child && typeof child.destroy === 'function') {
      child.destroy();
    }
    this.children.delete(name);
  }

  /**
   * Show loading state
   */
  setLoading(loading = true) {
    this.setState({ loading });
  }

  /**
   * Set error state
   */
  setError(error) {
    this.setState({ error });
  }

  /**
   * Clear error state
   */
  clearError() {
    this.setState({ error: null });
  }

  /**
   * Check if component is focused
   */
  isFocused() {
    return this.state.focused;
  }

  /**
   * Check if component has error
   */
  hasError() {
    return !!this.state.error;
  }

  /**
   * Check if component is loading
   */
  isLoading() {
    return this.state.loading;
  }

  /**
   * Get component role - override in subclasses
   */
  getRole() {
    return null;
  }

  /**
   * Get aria label - override in subclasses
   */
  getAriaLabel() {
    return null;
  }

  /**
   * Get aria described by - override in subclasses
   */
  getAriaDescribedBy() {
    return null;
  }

  /**
   * Emit custom event
   */
  emit(eventName, detail = {}, options = {}) {
    if (this.isDestroyed || !this.element) return;

    const event = new CustomEvent(eventName, {
      detail: { component: this, ...detail },
      bubbles: true,
      cancelable: true,
      ...options,
    });

    this.element.dispatchEvent(event);
  }

  /**
   * Listen to custom event
   */
  on(eventName, handler) {
    if (this.isDestroyed || !this.element) return;

    const wrappedHandler = e => {
      if (!this.isDestroyed) {
        handler.call(this, e);
      }
    };

    this.element.addEventListener(eventName, wrappedHandler);

    // Track for cleanup
    if (!this.eventListeners.has(`custom:${eventName}`)) {
      this.eventListeners.set(`custom:${eventName}`, []);
    }
    this.eventListeners.get(`custom:${eventName}`).push({
      handler: wrappedHandler,
      options: undefined,
    });
  }

  /**
   * Destroy component and cleanup
   */
  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Remove all event listeners
    this.eventListeners.forEach((listeners, type) => {
      listeners.forEach(({ handler, options }) => {
        if (this.element) {
          this.element.removeEventListener(
            type.replace('custom:', ''),
            handler,
            options
          );
        }
      });
    });
    this.eventListeners.clear();

    // Destroy all children
    this.children.forEach((child, name) => {
      this.removeChild(name);
    });
    this.children.clear();

    // Clear element reference
    if (this.element) {
      this.element.innerHTML = '';
      this.element.removeAttribute('role');
      this.element.removeAttribute('aria-label');
      this.element.removeAttribute('aria-describedby');
      this.element.removeAttribute('tabindex');
    }

    this.onDestroy();
  }

  /**
   * Destroy hook - override in subclasses
   */
  onDestroy() {
    // Override in subclasses
  }

  /**
   * Utility: Create element with classes
   */
  createElement(tag, classes = [], attributes = {}) {
    const element = document.createElement(tag);

    if (Array.isArray(classes)) {
      element.className = classes.join(' ');
    } else if (typeof classes === 'string') {
      element.className = classes;
    }

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else if (key.startsWith('aria-')) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    });

    return element;
  }

  /**
   * Utility: Create shimmer loading element
   */
  createShimmer(height = '1rem', width = '100%') {
    const shimmer = this.createElement('div', ['shimmer'], {
      style: `height: ${height}; width: ${width};`,
    });
    return shimmer;
  }

  /**
   * Utility: Create status announcement for screen readers
   */
  announceStatus(message, priority = 'polite') {
    const announcement = this.createElement('div', ['status-announcement'], {
      'aria-live': priority,
      'aria-atomic': 'true',
    });
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }
}

/**
 * Functional Component Wrapper - For modern component pattern
 */
export function createComponent(ComponentFunction, defaultProps = {}) {
  return (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    return ComponentFunction(mergedProps);
  };
}

/**
 * Higher-Order Component Pattern - For cross-cutting concerns
 */
export function withHOC(WrappedComponent, enhancer) {
  return function EnhancedComponent(props) {
    const enhanced = enhancer(props);
    return WrappedComponent({ ...props, ...enhanced });
  };
}

/**
 * Error Boundary Component Pattern
 */
export function createErrorBoundary(fallback, onError) {
  return class ErrorBoundary extends BaseComponent {
    constructor(element, options) {
      super(element, options);
      this.originalContent = this.element.innerHTML;
      this.fallback = fallback;
    }

    render() {
      if (this.state.error) {
        this.element.innerHTML = '';

        const fallbackContent =
          typeof this.fallback === 'function'
            ? this.fallback({
                error: this.state.error,
                retry: () => this.retry(),
              })
            : this.fallback;

        if (fallbackContent) {
          if (typeof fallbackContent === 'string') {
            const container = this.createElement('div', ['error-fallback']);
            container.textContent = fallbackContent;
            this.element.appendChild(container);
          } else if (fallbackContent instanceof Node) {
            this.element.appendChild(fallbackContent);
          } else {
            const container = this.createElement('div', ['error-fallback']);
            container.textContent = 'An error occurred';
            this.element.appendChild(container);
          }
          return;
        }

        const errorElement = this.createElement('div', ['card', 'error-state']);
        const cardContent = this.createElement('div', ['card-content']);
        const title = this.createElement('h3');
        title.textContent = 'Something went wrong';

        const message = this.createElement('p');
        const errorMessage =
          this.state.error && this.state.error.message
            ? this.state.error.message
            : 'An unexpected error occurred';
        message.textContent = errorMessage;

        const retryBtn = this.createElement('button', ['btn', 'btn-primary']);
        retryBtn.textContent = 'Try Again';
        retryBtn.addEventListener('click', () => this.retry());

        cardContent.appendChild(title);
        cardContent.appendChild(message);
        cardContent.appendChild(retryBtn);
        errorElement.appendChild(cardContent);

        this.element.appendChild(errorElement);
      } else {
        this.element.innerHTML = this.originalContent;
      }
    }

    retry() {
      this.setState({ error: null });
    }

    onError(error) {
      this.setState({ error });
      if (onError) onError(error, { component: this, element: this.element });
    }
  };
}
