import { SPACING } from '../utils/constants.js';

/**
 * NetworkStatus - A subtle indicator showing offline/online status
 * Only visible when offline
 */
export const NetworkStatus = () => {
  const container = document.createElement('div');
  container.className = 'network-status';

  // Mobile nav is ~60px tall, so position above it on mobile
  const isMobile = window.innerWidth < 768;
  const bottomOffset = isMobile ? '80px' : SPACING.MD;

  Object.assign(container.style, {
    position: 'fixed',
    bottom: bottomOffset,
    left: '50%',
    transform: 'translateX(-50%) translateY(150%)',
    backgroundColor: 'transparent',
    color: '#fff',
    padding: `${SPACING.XS} ${SPACING.MD}`,
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '500',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.XS,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 236, 218, 0.2)',
    transition:
      'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
    pointerEvents: 'none',
    opacity: '0',
  });

  const icon = document.createElement('span');
  icon.textContent = '📡';
  icon.style.fontSize = '1rem';
  icon.style.filter = 'drop-shadow(0 0 8px rgba(255, 159, 67, 0.5))';

  const text = document.createElement('span');
  text.textContent = 'Offline';
  text.style.color = '#fff';
  text.style.textShadow = `
        0 0 10px rgba(255, 159, 67, 0.8),
        0 0 20px rgba(255, 159, 67, 0.4)
    `;

  container.appendChild(icon);
  container.appendChild(text);

  // Update status based on network
  const updateStatus = () => {
    if (navigator.onLine) {
      // Slide down (hide) and fade out
      container.style.transform = 'translateX(-50%) translateY(150%)';
      container.style.opacity = '0';
    } else {
      // Slide up (show) and fade in
      container.style.transform = 'translateX(-50%) translateY(0)';
      container.style.opacity = '1';
    }
  };

  // Listen to online/offline events
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  // Update position on resize (for mobile nav)
  const updatePosition = () => {
    const isMobileNow = window.innerWidth < 768;
    container.style.bottom = isMobileNow ? '80px' : SPACING.MD;
  };
  window.addEventListener('resize', updatePosition);

  // Initial check
  updateStatus();

  // Cleanup
  container.cleanup = () => {
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
    window.removeEventListener('resize', updatePosition);
  };

  return container;
};
