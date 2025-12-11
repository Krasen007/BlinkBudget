import { Router } from './core/router.js';
import { DashboardView } from './views/DashboardView.js';
import { AddView } from './views/AddView.js';
import { EditView } from './views/EditView.js';
import { SettingsView } from './views/SettingsView.js';
import { MobileNavigation, updateMobileNavigation } from './components/MobileNavigation.js';
import './core/mobile.js'; // Initialize mobile utilities

const initApp = () => {
    const app = document.querySelector('#app');

    // Clear initial content
    app.innerHTML = '';

    // Initialize mobile navigation (only on mobile)
    let mobileNav = null;
    const initMobileNav = () => {
        // Remove existing mobile nav if present
        const existingNav = document.querySelector('.mobile-nav');
        if (existingNav) {
            existingNav.remove();
        }
        
        // Add mobile navigation on mobile devices
        if (window.mobileUtils?.isMobile()) {
            mobileNav = MobileNavigation({ currentRoute: getCurrentRoute() });
            document.body.appendChild(mobileNav);
        }
    };

    // Helper to get current route
    const getCurrentRoute = () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        return hash.split('?')[0];
    };

    // Route Handlers
    Router.on('dashboard', () => {
        app.innerHTML = '';
        app.appendChild(DashboardView());
        updateMobileNavigation('dashboard');
    });

    Router.on('add-expense', () => {
        app.innerHTML = '';
        app.appendChild(AddView());
        updateMobileNavigation('add-expense');
    });

    Router.on('edit-expense', (params) => {
        app.innerHTML = '';
        app.appendChild(EditView(params));
        updateMobileNavigation('dashboard'); // Edit doesn't have nav item, highlight dashboard
    });

    Router.on('settings', () => {
        app.innerHTML = '';
        app.appendChild(SettingsView());
        updateMobileNavigation('settings');
    });

    // Initialize mobile navigation
    initMobileNav();

    // Re-initialize mobile nav on resize (for responsive behavior)
    window.addEventListener('resize', () => {
        setTimeout(initMobileNav, 100); // Debounce
    });

    // Start
    Router.init();
};

initApp();
