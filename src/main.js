// Main entry point
const initApp = () => {
    const app = document.querySelector('#app');
    if (app) {
        console.log('BlinkBudget initialized. Core foundation loaded.');

        // Simple interactivity verification
        const startBtn = document.querySelector('.btn-primary');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('Start button clicked');
            });
        }
    } else {
        console.error('Failed to find #app element');
    }
};

initApp();
