/**
 * Error Boundary Component - WebApp.md Error Handling Pattern
 * Catches and handles component errors gracefully
 */

import { BaseComponent } from './BaseComponent.js';

export class ErrorBoundary extends BaseComponent {
  constructor(element, options = {}) {
    super(element, {
      fallbackContent: '<div class="error-fallback">Something went wrong</div>',
      showErrorDetails: false,
      ...options,
    });

    this._retryTimer = null;
  }

  getDefaultOptions() {
    return {
      fallbackContent: '<div class="error-fallback">Something went wrong</div>',
      showErrorDetails: false,
      retryable: true,
      logErrors: true,
    };
  }

  init() {
    // Store original content
    this.originalContent = this.element.innerHTML;
    this.originalChildren = Array.from(this.element.children);

    super.init();
  }

  setupElement() {
    super.setupElement();
    this.element.classList.add('error-boundary');
  }

  render() {
    if (this.state.error) {
      this.renderError();
    } else {
      this.renderContent();
    }
  }

  renderContent() {
    this.element.innerHTML = '';
    this.originalChildren.forEach(child => {
      this.element.appendChild(child);
    });
  }

  renderError() {
    this.element.innerHTML = '';

    const errorCard = this.createElement('div', [
      'card',
      'error-boundary-card',
    ]);

    const errorContent = this.createElement('div', ['card-content']);

    // Error icon
    const errorIcon = this.createElement('div', ['error-icon']);
    errorIcon.innerHTML = '⚠️';
    errorIcon.setAttribute('aria-hidden', 'true');

    // Error message
    const errorMessage = this.createElement('h3', ['error-title']);
    errorMessage.textContent = 'Something went wrong';

    const errorDescription = this.createElement('p', ['error-description']);
    if (this.options.showErrorDetails && this.state.error) {
      errorDescription.textContent =
        this.state.error.message || 'An unexpected error occurred';
    } else {
      errorDescription.textContent =
        'An unexpected error occurred. Please try again.';
    }

    // Retry button
    let retryButton = null;
    if (this.options.retryable) {
      retryButton = this.createElement('button', ['btn', 'btn-primary']);
      retryButton.textContent = 'Try Again';
      retryButton.addEventListener('click', () => this.retry());
    }

    // Assemble error card
    errorContent.appendChild(errorIcon);
    errorContent.appendChild(errorMessage);
    errorContent.appendChild(errorDescription);
    if (retryButton) {
      errorContent.appendChild(retryButton);
    }

    errorCard.appendChild(errorContent);
    this.element.appendChild(errorCard);

    // Announce to screen readers
    this.announceStatus('Error occurred. Something went wrong.', 'assertive');
  }

  handleError(error, errorInfo = {}) {
    this.setState({ error });

    // Log error if enabled
    if (this.options.logErrors) {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    // Emit error event
    this.emit('error', { error, errorInfo });
  }

  retry() {
    this.setState({ error: null });
    this.announceStatus('Retrying...', 'polite');
    this.emit('retry');
  }

  getRole() {
    return this.state.error ? 'alert' : null;
  }

  getAriaLabel() {
    return this.state.error ? 'Error occurred' : null;
  }

  destroy() {
    if (this._retryTimer) {
      clearTimeout(this._retryTimer);
      this._retryTimer = null;
    }
    super.destroy();
  }
}

/**
 * Higher-order component for error boundary wrapping
 */
export function withErrorBoundary(Component, errorBoundaryOptions = {}) {
  return function ErrorBoundaryWrapper(props) {
    return class WrappedComponent extends ErrorBoundary {
      constructor(element) {
        super(element, errorBoundaryOptions);
        this.componentProps = props;
        this.childComponent = null;
      }

      renderContent() {
        this.element.innerHTML = '';

        // Create container for child component
        const container = this.createElement('div');
        this.element.appendChild(container);

        // Initialize child component
        try {
          this.childComponent = new Component(container, this.componentProps);
        } catch (error) {
          this.handleError(error);
        }
      }

      retry() {
        super.retry();
        // Re-initialize child component
        if (this._retryTimer) {
          clearTimeout(this._retryTimer);
        }
        this._retryTimer = setTimeout(() => {
          if (this.isDestroyed) return;
          this.renderContent();
        }, 100);
      }

      destroy() {
        if (
          this.childComponent &&
          typeof this.childComponent.destroy === 'function'
        ) {
          this.childComponent.destroy();
        }
        super.destroy();
      }
    };
  };
}

/**
 * Simple error boundary function for functional components
 */
export function createErrorBoundary(element, options = {}) {
  return new ErrorBoundary(element, options);
}
