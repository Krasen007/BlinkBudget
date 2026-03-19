/**
 * Enhanced Input Component - WebApp.md Input Pattern
 * Standardized input with accessibility, validation, and touch support
 */

import { BaseComponent } from './BaseComponent.js';

const ICONS = Object.freeze({});

const applySafeIconContent = (iconEl, iconKey) => {
  if (!iconEl) return;
  const safeKey = String(iconKey ?? '');

  if (ICONS[safeKey]) {
    iconEl.innerHTML = ICONS[safeKey];
  } else {
    iconEl.textContent = safeKey;
  }
};

export class EnhancedInput extends BaseComponent {
  constructor(element, options = {}) {
    super(element, {
      type: 'text',
      label: '',
      placeholder: '',
      value: '',
      required: false,
      disabled: false,
      readonly: false,
      error: null,
      helper: '',
      size: 'medium', // small, medium, large
      variant: 'default', // default, outlined, filled
      icon: null,
      iconPosition: 'left',
      maxLength: null,
      minLength: null,
      pattern: null,
      autocomplete: 'off',
      inputmode: 'text',
      validate: null, // custom validation function
      onChange: null,
      onFocus: null,
      onBlur: null,
      onValidate: null,
      ...options,
    });
  }

  getDefaultOptions() {
    return {
      type: 'text',
      label: '',
      placeholder: '',
      value: '',
      required: false,
      disabled: false,
      readonly: false,
      error: null,
      helper: '',
      size: 'medium',
      variant: 'default',
      icon: null,
      iconPosition: 'left',
      maxLength: null,
      minLength: null,
      pattern: null,
      autocomplete: 'off',
      inputmode: 'text',
      validate: null,
      onChange: null,
      onFocus: null,
      onBlur: null,
      onValidate: null,
    };
  }

  getDefaultState() {
    return {
      ...super.getDefaultState(),
      focused: false,
      dirty: false,
      validated: false,
      error: this.options?.error ?? null,
    };
  }

  setupElement() {
    super.setupElement();
    this.element.classList.add('enhanced-input');
    this.element.classList.add(`input-${this.options.size}`);
    this.element.classList.add(`input-${this.options.variant}`);

    if (this.options.disabled) {
      this.element.classList.add('input-disabled');
    }

    if (this.state.error) {
      this.element.classList.add('input-error');
    }

    if (this.state.focused) {
      this.element.classList.add('input-focused');
    }
  }

  render() {
    this.element.innerHTML = '';

    if (!this.errorId) {
      this.errorId = `${this.getInputId()}-error`;
    }

    const container = this.createElement('div', ['input-container']);

    // Label
    if (this.options.label) {
      const label = this.createElement('label', ['input-label']);
      label.textContent = this.options.label;
      label.setAttribute('for', this.getInputId());

      if (this.options.required) {
        const required = this.createElement('span', ['input-required']);
        required.textContent = ' *';
        required.setAttribute('aria-label', 'required');
        label.appendChild(required);
      }

      container.appendChild(label);
    }

    // Input wrapper
    const inputWrapper = this.createElement('div', ['input-wrapper']);

    // Icon (left)
    if (this.options.icon && this.options.iconPosition === 'left') {
      const icon = this.createElement('div', ['input-icon', 'input-icon-left']);
      const iconKey = String(this.options.icon);
      applySafeIconContent(icon, iconKey);
      icon.setAttribute('aria-hidden', 'true');
      inputWrapper.appendChild(icon);
    }

    // Input element
    const input = this.createInputElement();
    inputWrapper.appendChild(input);

    // Icon (right)
    if (this.options.icon && this.options.iconPosition === 'right') {
      const icon = this.createElement('div', [
        'input-icon',
        'input-icon-right',
      ]);
      const iconKey = String(this.options.icon);
      applySafeIconContent(icon, iconKey);
      icon.setAttribute('aria-hidden', 'true');
      inputWrapper.appendChild(icon);
    }

    container.appendChild(inputWrapper);

    // Helper text
    if (this.options.helper || this.state.error) {
      const helper = this.createElement('div', ['input-helper']);

      if (this.state.error) {
        helper.textContent = this.state.error;
        helper.classList.add('input-error-text');
      } else {
        helper.textContent = this.options.helper;
      }

      helper.setAttribute('id', `${this.getInputId()}-helper`);
      container.appendChild(helper);
    }

    if (this.state.error) {
      const errorEl = this.createElement('div', ['input-error-message']);
      errorEl.id = this.errorId;
      errorEl.textContent = this.state.error;
      errorEl.setAttribute('aria-live', 'polite');
      container.appendChild(errorEl);
    }

    this.element.appendChild(container);

    this.bindEvents();
  }

  createInputElement() {
    const input = this.createElement('input', ['input-field']);

    // Basic attributes
    input.type = this.options.type;
    input.id = this.getInputId();
    input.placeholder = this.options.placeholder;
    input.value = this.options.value;
    input.disabled = this.options.disabled;
    input.readOnly = this.options.readonly;
    input.required = this.options.required;
    input.autocomplete = this.options.autocomplete;
    input.inputMode = this.options.inputmode;

    // Validation attributes
    if (this.options.maxLength) {
      input.maxLength = this.options.maxLength;
    }

    if (this.options.minLength) {
      input.minLength = this.options.minLength;
    }

    if (this.options.pattern) {
      input.pattern = this.options.pattern;
    }

    // Accessibility attributes
    if (this.options.helper || this.state.error) {
      input.setAttribute('aria-describedby', `${this.getInputId()}-helper`);
    }

    if (this.state.error) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-errormessage', this.errorId);
    }

    // Store reference for event handling
    this.inputElement = input;

    return input;
  }

  getInputId() {
    if (!this.inputId) {
      this.inputId = `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.inputId;
  }

  bindEvents() {
    super.bindEvents();

    if (!this.inputElement) return;

    if (this._inputAbortController) {
      this._inputAbortController.abort();
    }
    this._inputAbortController = new AbortController();
    const { signal } = this._inputAbortController;

    // Input events
    this.inputElement.addEventListener(
      'input',
      e => {
        this.options.value = e.target.value;
        this.setState({ dirty: true });

        if (this.options.onChange) {
          this.options.onChange(e.target.value, e);
        }

        // Validate on input if dirty
        if (this.state.dirty) {
          this.validate();
        }
      },
      { signal }
    );

    this.inputElement.addEventListener(
      'focus',
      e => {
        this.setState({ focused: true });
        this.setupElement();

        if (this.options.onFocus) {
          this.options.onFocus(e);
        }
      },
      { signal }
    );

    this.inputElement.addEventListener(
      'blur',
      e => {
        this.setState({ focused: false });
        this.setupElement();

        // Validate on blur
        this.validate();

        if (this.options.onBlur) {
          this.options.onBlur(e);
        }
      },
      { signal }
    );

    // Keyboard navigation
    this.inputElement.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Escape') {
          this.inputElement.blur();
        }
      },
      { signal }
    );
  }

  validate() {
    let error = null;
    const value = String(this.options.value ?? '');

    // Built-in validation
    if (this.options.required && !value.trim()) {
      error = 'This field is required';
    }

    if (this.options.minLength && value.length < this.options.minLength) {
      error = `Minimum ${this.options.minLength} characters required`;
    }

    if (this.options.maxLength && value.length > this.options.maxLength) {
      error = `Maximum ${this.options.maxLength} characters allowed`;
    }

    // Pattern validation
    if (this.options.pattern && !new RegExp(this.options.pattern).test(value)) {
      error = 'Invalid format';
    }

    // Custom validation
    if (this.options.validate && !error) {
      const customError = this.options.validate(value);
      if (customError) {
        error = customError;
      }
    }

    // Update state
    this.setState({ error, validated: true });
    this.setupElement();
    this.render();

    if (this.inputElement) {
      this.bindEvents();
    }

    // Emit validation event
    this.emit('validate', {
      value: this.options.value,
      error,
      isValid: !error,
    });

    if (this.options.onValidate) {
      this.options.onValidate(error, this.options.value);
    }

    return !error;
  }

  // Public API methods
  getValue() {
    return this.options.value;
  }

  setValue(value) {
    this.options.value = value;

    if (this.inputElement) {
      this.inputElement.value = value;
    }

    this.setState({ dirty: true });

    if (this.state.validated) {
      this.validate();
    }
  }

  setError(error) {
    this.setState({ error });
    this.setupElement();
    this.render();
    this.bindEvents();
  }

  clearError() {
    this.setState({ error: null });
    this.setupElement();
    this.render();
    this.bindEvents();
  }

  setDisabled(disabled) {
    this.options.disabled = disabled;
    this.setupElement();
    this.render();
    this.bindEvents();
  }

  focus() {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  blur() {
    if (this.inputElement) {
      this.inputElement.blur();
    }
  }

  select() {
    if (this.inputElement) {
      this.inputElement.select();
    }
  }

  getRole() {
    return this.options.type === 'search' ? 'searchbox' : 'textbox';
  }

  getAriaLabel() {
    return this.options.label;
  }

  getAriaDescribedBy() {
    return this.options.helper || this.state.error
      ? `${this.getInputId()}-helper`
      : null;
  }

  onDestroy() {
    super.onDestroy();

    if (this._inputAbortController) {
      this._inputAbortController.abort();
      this._inputAbortController = null;
    }
    this.inputElement = null;
  }
}

/**
 * Functional Component Wrapper
 */
export const EnhancedInputComponent = (props = {}) => {
  const container = document.createElement('div');
  new EnhancedInput(container, props);
  return container;
};

/**
 * Factory function
 */
export function createEnhancedInput(element, options = {}) {
  return new EnhancedInput(element, options);
}

/**
 * Backward compatibility
 */
export { EnhancedInputComponent as default };
