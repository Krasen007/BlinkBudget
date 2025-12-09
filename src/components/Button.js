export const Button = ({ text, onClick, variant = 'primary', type = 'button', className = '' }) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.type = type;
    btn.className = `btn btn-${variant} ${className}`;
    if (onClick) {
        btn.addEventListener('click', onClick);
    }
    return btn;
};
