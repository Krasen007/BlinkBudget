import { Router } from './core/router.js';
import { DashboardView } from './views/DashboardView.js';
import { AddView } from './views/AddView.js';

const initApp = () => {
    const app = document.querySelector('#app');

    // Clear initial content
    app.innerHTML = '';

    // Route Handlers
    Router.on('dashboard', () => {
        app.innerHTML = '';
        app.appendChild(DashboardView());
    });

    Router.on('add-expense', () => {
        app.innerHTML = '';
        app.appendChild(AddView());
    });

    // Start
    Router.init();
};

initApp();
