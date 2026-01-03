import { Router } from './core/router.js';
import { AuthService } from './core/auth-service.js';
import { SyncService } from './core/sync-service.js';
import { NavigationState } from './core/navigation-state.js';
import { DashboardView } from './views/DashboardView.js';
import { AddView } from './views/AddView.js';
import { EditView } from './views/EditView.js';
import { SettingsView } from './views/SettingsView.js';
import { ReportsView } from './views/ReportsView.js';
import { LoginView } from './views/LoginView.js';
import { MobileNavigation, updateMobileNavigation } from './components/MobileNavigation.js';
import { NetworkStatus } from './components/NetworkStatus.js';
import './core/mobile.js'; // Initialize mobile utilities
import './pwa.js'; // Register PWA service worker
import { InstallService } from './core/install.js';

InstallService.init();

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
            if (!AuthService.isAuthenticated() && !AuthService.hasAuthHint()) {
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

        // Remove the transition timeout and opacity hiding which causes the "black screen" flash.
        // For a fast app, an instant swap is often better than a slow fade that reveals the background.
        app.innerHTML = '';
        currentView = view;
        app.appendChild(view);

        // Reset app opacity if it was previously set for any reason
        app.style.opacity = '1';
        app.style.transition = 'none';

        // Ensure we scroll to top on view changes
        window.scrollTo(0, 0);
    };
    // Route Handlers (with dynamic imports for code splitting)
    // Register Global Route Guard (Synchronous check for speed)
    Router.before((route) => {
        if (route === 'login') {
            if (AuthService.isAuthenticated()) {
                Router.navigate('dashboard');
                return false;
            }
            return true;
        }

        // Protected routes
        const protectedRoutes = ['dashboard', 'add-expense', 'edit-expense', 'settings', 'reports'];
        if (protectedRoutes.includes(route)) {
            if (!AuthService.isAuthenticated() && !AuthService.hasAuthHint()) {
                Router.navigate('login');
                return false;
            }
        }
        return true;
    });

    // Route Handlers (using static imports for instant transitions)
    Router.on('dashboard', () => {
        NavigationState.setLastActiveView('dashboard');
        setView(DashboardView());
        updateMobileNavigation('dashboard');
    });

    Router.on('add-expense', (params) => {
        NavigationState.setLastActiveView('add-expense');
        setView(AddView(params));
        updateMobileNavigation('add-expense');
    });

    Router.on('edit-expense', (params) => {
        NavigationState.setLastActiveView('edit-expense');
        setView(EditView(params));
        updateMobileNavigation('dashboard');
    });

    Router.on('settings', () => {
        NavigationState.setLastActiveView('settings');
        setView(SettingsView());
        updateMobileNavigation('settings');
    });

    Router.on('reports', () => {
        NavigationState.setLastActiveView('reports');
        setView(ReportsView());
        updateMobileNavigation('reports');
    });

    Router.on('login', () => {
        NavigationState.setLastActiveView('login');
        setView(LoginView());
        updateMobileNavigation('login');
    });

    // We don't call SyncService.init() here anymore as it's handled in AuthService.init callback
    // for better coordination of the initial data pull.

    // Initialize mobile navigation
    initMobileNav();

    // Add network status indicator
    const networkStatus = NetworkStatus();
    document.body.appendChild(networkStatus);

    // Re-initialize mobile nav on resize (for responsive behavior)
    window.addEventListener('resize', () => {
        setTimeout(initMobileNav, 100); // Debounce
    });

    // Initialize Auth in background
    AuthService.init(async (user) => {
        // Handle auth state changes and data synchronization
        const currentRoute = getCurrentRoute();

        if (user) {
            console.log("[Main] User authenticated, starting offline-first sync...");
            localStorage.setItem('auth_hint', 'true'); // Ensure hint is set
            SyncService.startRealtimeSync(user.uid);

            if (currentRoute === 'login') {
                Router.navigate('dashboard');
            }
        } else {
            console.log("[Main] No user, stopping sync.");
            localStorage.removeItem('auth_hint'); // Clear hint if auth fails
            SyncService.stopSync();
            // Clear navigation state on logout
            NavigationState.clearState();
            if (currentRoute !== 'login') {
                Router.navigate('login');
            }
        }

        // Re-init mobile nav if needed
        initMobileNav();

        // Dispatch auth state change event for components to update (e.g., Dashboard title)
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user } }));
    });

    // Initialize navigation state management
    NavigationState.init();

    console.log("[Main] App initialized, starting router.");
    Router.init();
};

initApp();
