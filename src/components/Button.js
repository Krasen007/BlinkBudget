/**
 * Functional Button component (factory).
 * Replaces the former BaseComponent-backed class layer while preserving the
 * public surface consumed across the app: ButtonComponent props, DOM classes,
 * aria state, touch feedback, click guarding, and a light `buttonInstance`
 * helper API (setLoading/setDisabled/setText/activate).
 *
 * Supported props: text, ariaLabel, variant, size, type, disabled, loading,
 * icon, iconPosition, fullWidth, href, target, onClick, preventDefault.
 */

const BUTTON_DEFAULTS = {
  text: '',
  ariaLabel: null,
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

export const ButtonComponent = (props = {}) => {
  const opts = { ...BUTTON_DEFAULTS, ...props };

  const el = document.createElement('button');
  el.type = opts.type;
  el.className = [
    'btn',
    `btn-${opts.variant}`,
    `btn-${opts.size}`,
    opts.fullWidth ? 'btn-full-width' : null,
    opts.loading ? 'btn-loading' : null,
    opts.disabled ? 'btn-disabled' : null,
  ]
    .filter(Boolean)
    .join(' ');

  // Content kept flat so button.textContent === text when no icon is used
  if (opts.icon && opts.iconPosition === 'left') {
    const iconLeft = document.createElement('span');
    iconLeft.className = 'btn-icon btn-icon-left';
    iconLeft.textContent = opts.icon;
    el.appendChild(iconLeft);
  }

  const label = document.createElement('span');
  label.className = 'btn-content';
  label.textContent = opts.text;
  el.appendChild(label);

  if (opts.icon && opts.iconPosition === 'right') {
    const iconRight = document.createElement('span');
    iconRight.className = 'btn-icon btn-icon-right';
    iconRight.textContent = opts.icon;
    el.appendChild(iconRight);
  }

  // Link-style buttons still render as <button> (legacy behavior)
  if (opts.href) {
    el.setAttribute('role', 'link');
    el.dataset.href = opts.href;
    el.dataset.target = opts.target;
    if (opts.target === '_blank') {
      el.setAttribute('rel', 'noopener noreferrer');
    }
  } else {
    el.removeAttribute('role');
  }

  const syncState = () => {
    el.classList.toggle('btn-loading', opts.loading);
    el.classList.toggle('btn-disabled', opts.disabled);
    el.disabled = Boolean(opts.disabled || opts.loading);

    let ariaLabel = opts.ariaLabel || opts.text || null;
    if (opts.loading && !opts.ariaLabel) ariaLabel = 'Loading';
    else if (opts.disabled && !opts.ariaLabel) ariaLabel = 'Disabled button';
    if (ariaLabel) el.setAttribute('aria-label', ariaLabel);
    else el.removeAttribute('aria-label');

    if (opts.disabled || opts.loading) {
      el.setAttribute('aria-disabled', 'true');
    } else {
      el.removeAttribute('aria-disabled');
    }

    if (opts.loading) el.setAttribute('aria-busy', 'true');
    else el.removeAttribute('aria-busy');
  };
  syncState();

  el.addEventListener('click', e => {
    if (!opts.onClick || opts.disabled || opts.loading) return;
    if (opts.preventDefault) e.preventDefault();
    opts.onClick(e);
  });

  // Touch feedback (guarded for disabled/loading)
  el.addEventListener(
    'touchstart',
    () => {
      if (!opts.disabled && !opts.loading) {
        el.classList.add('btn-touch-active');
      }
    },
    { passive: true }
  );
  const clearTouch = () => el.classList.remove('btn-touch-active');
  el.addEventListener('touchend', clearTouch, { passive: true });
  el.addEventListener('touchcancel', clearTouch, { passive: true });

  // Light instance API for callers needing imperative control
  el.buttonInstance = {
    element: el,
    setText(text) {
      opts.text = text;
      label.textContent = text;
      syncState();
    },
    setVariant(variant) {
      el.classList.remove(`btn-${opts.variant}`);
      opts.variant = variant;
      el.classList.add(`btn-${opts.variant}`);
    },
    setDisabled(disabled) {
      opts.disabled = Boolean(disabled);
      syncState();
    },
    setLoading(loading) {
      opts.loading = Boolean(loading);
      syncState();
    },
    activate() {
      if (opts.onClick && !opts.disabled && !opts.loading) {
        opts.onClick(new Event('click'));
      }
    },
  };

  return el;
};

/**
 * Factory alias retained for compatibility.
 */
export function createButton(_elementOrOptions, maybeOptions = {}) {
  const props =
    _elementOrOptions && !_elementOrOptions.nodeType
      ? _elementOrOptions
      : maybeOptions;
  return ButtonComponent(props);
}

export { ButtonComponent as default };
