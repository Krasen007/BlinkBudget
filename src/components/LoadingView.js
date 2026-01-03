/**
 * Loading View Component
 * Displays a full-screen loading indicator during initial app load
 */

export const LoadingView = () => {
    const container = document.createElement('div');
    container.className = 'loading-screen';

    Object.assign(container.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem',
        backgroundColor: 'var(--color-background)'
    });

    container.innerHTML = `
        <div class="spinner" style="width:40px; height:40px; border:4px solid var(--color-surface); border-top-color:var(--color-primary); border-radius:50%; animation: spin 1s linear infinite;"></div>
        <p style="color:var(--color-text-muted); font-size:var(--font-size-sm);">Blinking your budget...</p>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    `;

    return container;
};
