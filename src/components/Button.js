export const Button = ({ text, onClick, variant = 'primary', type = 'button', className = '', disabled = false }) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.type = type;
    btn.className = `btn btn-${variant} ${className}`;
    btn.disabled = disabled;

    if (onClick) {
        btn.addEventListener('click', onClick);
    }

    if (onClick) {
        btn.addEventListener('click', onClick);
    }

    return btn;
};
