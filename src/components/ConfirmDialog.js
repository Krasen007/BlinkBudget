import { ButtonComponent } from './Button.js';
import {
  MobileConfirmDialog,
  MobileAlert,
  MobilePrompt,
} from './MobileModal.js';
import { COLORS } from '../utils/constants.js';

/**
 * Enhanced Confirm Dialog with mobile support
 */
export const ConfirmDialog = ({
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  title = 'Confirm Action',
  variant = 'danger',
}) => {
  // Use mobile modal on mobile devices
  if (window.mobileUtils?.isMobile()) {
    return MobileConfirmDialog({
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      onConfirm,
      onCancel,
      variant,
    });
  }

  // Desktop version - existing logic
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';

  const card = document.createElement('div');
  card.className = 'dialog-card';

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.marginBottom = 'var(--spacing-md)';
  titleEl.style.textAlign = 'center';

  const text = document.createElement('p');
  text.textContent = message;
  text.style.marginBottom = 'var(--spacing-lg)';
  text.style.textAlign = 'center';

  const btnGroup = document.createElement('div');
  btnGroup.style.display = 'flex';
  btnGroup.style.gap = 'var(--spacing-md)';
  btnGroup.style.justifyContent = 'center';

  const cancelBtn = ButtonComponent({
    text: 'Cancel',
    variant: 'secondary',
    onClick: () => {
      document.body.removeChild(overlay);
      if (onCancel) onCancel();
    },
  });

  const confirmBtn = ButtonComponent({
    text: confirmText,
    variant: variant,
    onClick: () => {
      document.body.removeChild(overlay);
      if (onConfirm) onConfirm();
    },
  });

  if (variant === 'danger') {
    confirmBtn.style.backgroundColor = COLORS.ERROR;
    confirmBtn.style.color = 'white';
    confirmBtn.style.border = `1px solid ${COLORS.ERROR}`;
  }

  btnGroup.appendChild(cancelBtn);
  btnGroup.appendChild(confirmBtn);

  card.appendChild(titleEl);
  card.appendChild(text);
  card.appendChild(btnGroup);
  overlay.appendChild(card);

  document.body.appendChild(overlay);
};

/**
 * Standard Alert Dialog
 */
export const AlertDialog = ({
  message,
  title = 'Alert',
  buttonText = 'OK',
  onConfirm,
}) => {
  if (window.mobileUtils?.isMobile()) {
    return MobileAlert({ title, message, buttonText, onConfirm });
  }

  // Desktop implementation
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';

  const card = document.createElement('div');
  card.className = 'dialog-card';

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.marginBottom = 'var(--spacing-md)';
  titleEl.style.textAlign = 'center';

  const text = document.createElement('p');
  text.textContent = message;
  text.style.marginBottom = 'var(--spacing-lg)';
  text.style.textAlign = 'center';

  const okBtn = ButtonComponent({
    text: buttonText,
    variant: 'primary',
    onClick: () => {
      document.body.removeChild(overlay);
      if (onConfirm) onConfirm();
    },
  });
  okBtn.style.width = '100%';

  card.appendChild(titleEl);
  card.appendChild(text);
  card.appendChild(okBtn);
  overlay.appendChild(card);

  document.body.appendChild(overlay);
};

/**
 * Standard Prompt Dialog
 */
export const PromptDialog = ({
  title,
  message,
  initialValue = '',
  placeholder = '',
  onSave,
  onCancel,
}) => {
  if (window.mobileUtils?.isMobile()) {
    return MobilePrompt({
      title,
      message,
      initialValue,
      placeholder,
      onSave,
      onCancel,
    });
  }

  // Desktop implementation
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';

  const card = document.createElement('div');
  card.className = 'dialog-card';

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.marginBottom = 'var(--spacing-md)';
  titleEl.style.textAlign = 'center';

  const text = document.createElement('p');
  text.textContent = message || '';
  if (message) text.style.marginBottom = 'var(--spacing-md)';
  text.style.textAlign = 'center';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = initialValue;
  input.placeholder = placeholder;
  input.style.width = '100%';
  input.style.padding = 'var(--spacing-md)';
  input.style.marginBottom = 'var(--spacing-lg)';
  input.style.borderRadius = 'var(--radius-md)';
  input.style.border = '1px solid var(--color-border)';

  const btnGroup = document.createElement('div');
  btnGroup.style.display = 'flex';
  btnGroup.style.gap = 'var(--spacing-md)';

  const cancelBtn = ButtonComponent({
    text: 'Cancel',
    variant: 'secondary',
    onClick: () => {
      document.body.removeChild(overlay);
      if (onCancel) onCancel();
    },
  });
  cancelBtn.style.flex = '1';

  const saveBtn = ButtonComponent({
    text: 'Save',
    variant: 'primary',
    onClick: () => {
      document.body.removeChild(overlay);
      onSave(input.value);
    },
  });
  saveBtn.style.flex = '1';

  btnGroup.appendChild(cancelBtn);
  btnGroup.appendChild(saveBtn);

  card.appendChild(titleEl);
  if (message) card.appendChild(text);
  card.appendChild(input);
  card.appendChild(btnGroup);
  overlay.appendChild(card);

  document.body.appendChild(overlay);
  setTimeout(() => input.focus(), 100);
};

/**
 * PWA Installation Instructions Dialog
 */
export const PWAInstructionsDialog = () => {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const title = 'Install App';

  const message = isIOS
    ? 'To install BlinkBudget on your iPhone/iPad:\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"\n3. Tap Add.'
    : 'To install BlinkBudget on your device:\n1. Open your browser\'s menu\n2. Look for "Install App" or "Add to Home Screen"\n3. Follow the instructions.';

  if (window.mobileUtils?.isMobile()) {
    return MobileAlert({
      title,
      message,
      buttonText: 'Got it',
    });
  }

  // Desktop implementation (rare but for completeness)
  AlertDialog({ title, message });
};
