export const Button = ({ text, onClick, variant = 'primary', type = 'button', className = '', disabled = false }) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.type = type;
    btn.className = `btn btn-${variant} ${className}`;
    btn.disabled = disabled;
    
    if (onClick) {
        btn.addEventListener('click', onClick);
    }
    
    // Enhanced touch feedback
    btn.addEventListener('touchstart', (e) => {
        if (!btn.disabled) {
            btn.classList.add('btn-touch-active');
            // Haptic feedback for supported devices
            if (navigator.vibrate) {
                navigator.vibrate(10); // Very brief haptic feedback
            }
        }
    }, { passive: true });
    
    btn.addEventListener('touchend', () => {
        btn.classList.remove('btn-touch-active');
    }, { passive: true });
    
    btn.addEventListener('touchcancel', () => {
        btn.classList.remove('btn-touch-active');
    }, { passive: true });
    
    // Mouse events for desktop compatibility
    btn.addEventListener('mousedown', () => {
        if (!btn.disabled) {
            btn.classList.add('btn-touch-active');
        }
    });
    
    btn.addEventListener('mouseup', () => {
        btn.classList.remove('btn-touch-active');
    });
    
    btn.addEventListener('mouseleave', () => {
        btn.classList.remove('btn-touch-active');
    });
    
    return btn;
};
