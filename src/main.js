import { Router } from './core/router.js';
import { AuthService } from './core/auth-service.js';
import { SyncService } from './core/sync-service.js';
import { DashboardView } from './views/DashboardView.js';
import { AddView } from './views/AddView.js';
import { EditView } from './views/EditView.js';
import { SettingsView } from './views/SettingsView.js';
import { LoginView } from './views/LoginView.js';
import { MobileNavigation, updateMobileNavigation } from './components/MobileNavigation.js';
import './core/mobile.js'; // Initialize mobile utilities

const initApp = () => {
    const app = document.querySelector('#app');

    // Clear initial content and show loading
    app.innerHTML = `
        <div class="loading-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; gap:1rem; background-color:var(--color-background);">
            <div class="spinner" style="width:40px; height:40px; border:4px solid var(--color-surface); border-top-color:var(--color-primary); border-radius:50%; animation: spin 1s linear infinite;"></div>
            <p style="color:var(--color-text-muted); font-size:var(--font-size-sm);">Blinking your budget...</p>
        </div>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    `;

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

    // Route Guard
    const withAuth = (handler) => {
        return (params) => {
            if (!AuthService.isAuthenticated()) {
                Router.navigate('login');
                return;
            }
            handler(params);
        };
    };

    // View Management
    let currentView = null;
    const setView = (view) => {
        if (currentView && typeof currentView.cleanup === 'function') {
            currentView.cleanup();
        }
        app.innerHTML = '';
        currentView = view;
        app.appendChild(view);
    };

    // Route Handlers
    Router.on('dashboard', withAuth(() => {
        setView(DashboardView());
        updateMobileNavigation('dashboard');
    }));

    Router.on('add-expense', withAuth(() => {
        setView(AddView());
        updateMobileNavigation('add-expense');
    }));

    Router.on('edit-expense', withAuth((params) => {
        setView(EditView(params));
        updateMobileNavigation('dashboard'); // Edit doesn't have nav item, highlight dashboard
    }));

    Router.on('settings', withAuth(() => {
        setView(SettingsView());
        updateMobileNavigation('settings');
    }));

    Router.on('login', () => {
        if (AuthService.isAuthenticated()) {
            Router.navigate('dashboard');
            return;
        }
        setView(LoginView());
        updateMobileNavigation('login');
    });

    // We don't call SyncService.init() here anymore as it's handled in AuthService.init callback
    // for better coordination of the initial data pull.

    // Initialize mobile navigation
    initMobileNav();

    // Re-initialize mobile nav on resize (for responsive behavior)
    window.addEventListener('resize', () => {
        setTimeout(initMobileNav, 100); // Debounce
    });

    // Start
    AuthService.init(async (user) => {
        // Handle auth state changes and data synchronization
        const currentRoute = getCurrentRoute();

        if (user) {
            console.log("[Main] User authenticated, ensuring data sync...");
            await SyncService.pullFromCloud(user.uid);
            SyncService.startRealtimeSync(user.uid);

            if (currentRoute === 'login') {
                Router.navigate('dashboard');
            }
        } else {
            console.log("[Main] No user, stopping sync.");
            SyncService.stopSync();
            if (currentRoute !== 'login') {
                Router.navigate('login');
            }
        }

        // Re-init mobile nav if needed
        initMobileNav();
    }).then(() => {
        console.log("[Main] App initialized, starting router.");
        Router.init();
    });
};

initApp();
