import { Router } from './core/router.js';
import { DashboardView } from './views/DashboardView.js';
import { AddView } from './views/AddView.js';
import { EditView } from './views/EditView.js';

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

    Router.on('edit-expense', (params) => {
        app.innerHTML = '';
        app.appendChild(EditView(params));
    });

    // Start
    Router.init();
};

initApp();
