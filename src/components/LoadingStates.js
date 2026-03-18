/**
 * Loading States Components - WebApp.md Loading Pattern
 * Provides consistent loading and empty states
 */

import { BaseComponent } from './BaseComponent.js';
import { ErrorBoundary } from './ErrorBoundary.js';

export class LoadingState extends BaseComponent {
  constructor(element, options = {}) {
    super(element, {
      type: 'spinner', // 'spinner', 'skeleton', 'dots'
      size: 'medium', // 'small', 'medium', 'large'
      text: null,
      overlay: false,
      ...options,
    });
  }

  getDefaultOptions() {
    return {
      type: 'spinner',
      size: 'medium',
      text: null,
      overlay: false,
      center: true,
    };
  }

  setupElement() {
    super.setupElement();
    this.element.classList.add('loading-state');
    if (this.options.overlay) {
      this.element.classList.add('loading-overlay');
    }
  }

  render() {
    this.element.innerHTML = '';

    const container = this.createElement('div', [
      'loading-container',
      this.options.center ? 'loading-centered' : '',
    ]);

    // Create loading indicator
    const indicator = this.createLoadingIndicator();
    container.appendChild(indicator);

    // Add loading text if provided
    if (this.options.text) {
      const text = this.createElement('div', ['loading-text']);
      text.textContent = this.options.text;
      container.appendChild(text);
    }

    this.element.appendChild(container);
  }

  createLoadingIndicator() {
    switch (this.options.type) {
      case 'spinner':
        return this.createSpinner();
      case 'skeleton':
        return this.createSkeleton();
      case 'dots':
        return this.createDots();
      default:
        return this.createSpinner();
    }
  }

  createSpinner() {
    const spinner = this.createElement('div', [
      'spinner',
      `spinner-${this.options.size}`,
    ]);

    // Create spinner animation using CSS
    const spinnerInner = this.createElement('div', ['spinner-inner']);
    spinner.appendChild(spinnerInner);

    return spinner;
  }

  createSkeleton() {
    const skeleton = this.createElement('div', [
      'skeleton',
      `skeleton-${this.options.size}`,
    ]);

    // Add shimmer effect
    const shimmer = this.createShimmer();
    skeleton.appendChild(shimmer);

    return skeleton;
  }

  createDots() {
    const dots = this.createElement('div', [
      'loading-dots',
      `loading-dots-${this.options.size}`,
    ]);

    // Create three dots
    for (let i = 0; i < 3; i++) {
      const dot = this.createElement('div', ['loading-dot']);
      dots.appendChild(dot);
    }

    return dots;
  }

  getRole() {
    return 'status';
  }

  getAriaLabel() {
    return this.options.text || 'Loading';
  }
}

export class EmptyState extends BaseComponent {
  constructor(element, options = {}) {
    super(element, {
      icon: '📭',
      title: 'No data',
      description: 'There is nothing to show here.',
      action: null, // { text, onClick }
      ...options,
    });
  }

  getDefaultOptions() {
    return {
      icon: '📭',
      title: 'No data',
      description: 'There is nothing to show here.',
      action: null,
    };
  }

  setupElement() {
    super.setupElement();
    this.element.classList.add('empty-state');
  }

  render() {
    this.element.innerHTML = '';

    const container = this.createElement('div', ['empty-state-container']);

    // Icon
    const icon = this.createElement('div', ['empty-state-icon']);
    icon.textContent = this.options.icon;
    icon.setAttribute('aria-hidden', 'true');

    // Title
    const title = this.createElement('h3', ['empty-state-title']);
    title.textContent = this.options.title;

    // Description
    const description = this.createElement('p', ['empty-state-description']);
    description.textContent = this.options.description;

    container.appendChild(icon);
    container.appendChild(title);
    container.appendChild(description);

    // Action button if provided
    if (this.options.action) {
      const actionButton = this.createElement('button', ['btn', 'btn-primary']);
      actionButton.textContent = this.options.action.text;
      actionButton.addEventListener('click', this.options.action.onClick);
      container.appendChild(actionButton);
    }

    this.element.appendChild(container);
  }

  getRole() {
    return 'status';
  }

  getAriaLabel() {
    return this.options.title;
  }
}

export class ProgressIndicator extends BaseComponent {
  constructor(element, options = {}) {
    super(element, {
      value: 0,
      max: 100,
      showPercentage: true,
      animated: true,
      color: 'primary', // 'primary', 'success', 'warning', 'error'
      size: 'medium', // 'small', 'medium', 'large'
      ...options,
    });
  }

  getDefaultOptions() {
    return {
      value: 0,
      max: 100,
      showPercentage: true,
      animated: true,
      color: 'primary',
      size: 'medium',
    };
  }

  setupElement() {
    super.setupElement();
    this.element.classList.add('progress-indicator');
  }

  render() {
    this.element.innerHTML = '';

    const container = this.createElement('div', [
      'progress-container',
      `progress-${this.options.size}`,
    ]);

    // Progress bar
    const progressBar = this.createElement('div', [
      'progress-bar',
      `progress-${this.options.color}`,
    ]);

    const progressFill = this.createElement('div', [
      'progress-fill',
      this.options.animated ? 'progress-animated' : '',
    ]);

    const percentage = Math.min(
      100,
      Math.max(0, (this.state.value / this.options.max) * 100)
    );
    progressFill.style.width = `${percentage}%`;

    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);

    // Percentage text
    if (this.options.showPercentage) {
      const percentageText = this.createElement('div', ['progress-text']);
      percentageText.textContent = `${Math.round(percentage)}%`;
      container.appendChild(percentageText);
    }

    this.element.appendChild(container);
  }

  setValue(value) {
    this.setState({ value });
  }

  getRole() {
    return 'progressbar';
  }

  getAriaLabel() {
    return `Progress: ${Math.round((this.state.value / this.options.max) * 100)}%`;
  }

  getAriaDescribedBy() {
    return 'progress-text';
  }
}

/**
 * Higher-order component for loading states
 */
export function withLoadingState(Component, loadingOptions = {}) {
  return function LoadingStateWrapper(props) {
    return class WrappedComponent extends BaseComponent {
      constructor(element) {
        super(element);
        this.componentProps = props;
        this.childComponent = null;
        this.loadingComponent = null;
      }

      getDefaultState() {
        return {
          loading: props.loading || false,
          error: props.error || null,
          empty: props.empty || false,
        };
      }

      render() {
        this.element.innerHTML = '';

        if (this.state.loading) {
          this.renderLoading();
        } else if (this.state.error) {
          this.renderError();
        } else if (this.state.empty) {
          this.renderEmpty();
        } else {
          this.renderContent();
        }
      }

      renderLoading() {
        const loadingContainer = this.createElement('div');
        this.element.appendChild(loadingContainer);
        this.loadingComponent = new LoadingState(
          loadingContainer,
          loadingOptions
        );
      }

      renderError() {
        const errorContainer = this.createElement('div');
        this.element.appendChild(errorContainer);
        this.loadingComponent = new ErrorBoundary(errorContainer, {
          fallbackContent: this.state.error.message || 'An error occurred',
          retryable: true,
        });
      }

      renderEmpty() {
        const emptyContainer = this.createElement('div');
        this.element.appendChild(emptyContainer);
        this.loadingComponent = new EmptyState(emptyContainer, {
          title: 'No data available',
          description: 'There are no items to display.',
        });
      }

      renderContent() {
        const container = this.createElement('div');
        this.element.appendChild(container);
        this.childComponent = new Component(container, this.componentProps);
      }

      setState(newState) {
        super.setState(newState);
        // Update child component props if needed
        if (this.childComponent && this.childComponent.setProps) {
          this.childComponent.setProps({ ...this.componentProps, ...newState });
        }
      }

      destroy() {
        if (
          this.childComponent &&
          typeof this.childComponent.destroy === 'function'
        ) {
          this.childComponent.destroy();
        }
        if (
          this.loadingComponent &&
          typeof this.loadingComponent.destroy === 'function'
        ) {
          this.loadingComponent.destroy();
        }
        super.destroy();
      }
    };
  };
}

/**
 * Utility functions for creating loading states
 */
export function createLoadingState(element, options = {}) {
  return new LoadingState(element, options);
}

export function createEmptyState(element, options = {}) {
  return new EmptyState(element, options);
}

export function createProgressIndicator(element, options = {}) {
  return new ProgressIndicator(element, options);
}
