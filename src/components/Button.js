export const Button = ({ text, onClick, variant = 'primary', type = 'button', className = '', disabled = false }) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.type = type;
    btn.className = `btn btn-${variant} ${className}`;
    btn.disabled = disabled;

    if (onClick) {
        btn.addEventListener('click', onClick);
    }

    // Touch event handlers for mobile optimization
    btn.addEventListener('touchstart', (e) => {
        if (!btn.disabled) {
            btn.classList.add('btn-touch-active');
        }
    });

    btn.addEventListener('touchend', (e) => {
        btn.classList.remove('btn-touch-active');
    });

    return btn;
};
