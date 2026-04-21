/**
 * Toast Notification Component
 * Displays a non-intrusive notification banner with action buttons
 */
export const ToastNotification = ({
  message,
  actionText = 'Reload',
  onAction,
  duration = 0, // 0 = no auto-dismiss
  variant = 'info', // 'info', 'success', 'warning', 'error'
}) => {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${variant}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  // Icon based on variant
  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕',
  };

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = icons[variant] || icons.info;

  const text = document.createElement('span');
  text.className = 'toast-message';
  text.textContent = message;

  const actionBtn = document.createElement('button');
  actionBtn.className = 'toast-action';
  actionBtn.textContent = actionText;
  actionBtn.setAttribute('aria-label', actionText);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close notification');

  const dismiss = () => {
    toast.classList.add('toast-dismissing');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300); // Match CSS transition duration
  };

  actionBtn.addEventListener('click', e => {
    e.preventDefault();
    dismiss();
    if (onAction) onAction();
  });

  closeBtn.addEventListener('click', e => {
    e.preventDefault();
    dismiss();
  });

  toast.appendChild(icon);
  toast.appendChild(text);
  toast.appendChild(actionBtn);
  toast.appendChild(closeBtn);

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // Auto-dismiss if duration is set
  if (duration > 0) {
    setTimeout(dismiss, duration);
  }

  return toast;
};
