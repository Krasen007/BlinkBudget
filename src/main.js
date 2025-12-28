import { Router } from './core/router.js';
import { AuthService } from './core/auth-service.js';
import { SyncService } from './core/sync-service.js';
import { NavigationState } from './core/navigation-state.js';
// Views are now loaded dynamically to reduce initial bundle size
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

    // View Management with smooth transitions
    let currentView = null;
    let transitionTimeout = null;
    const setView = (view) => {
        if (currentView && typeof currentView.cleanup === 'function') {
            currentView.cleanup();
        }
        
        // Cancel any pending transition
        if (transitionTimeout) {
            clearTimeout(transitionTimeout);
        }
        
        // Add smooth transition effect
        app.style.opacity = '0';
        app.style.transition = 'opacity 0.2s ease-in-out';
        
        transitionTimeout = setTimeout(() => {
            app.innerHTML = '';
            currentView = view;
            app.appendChild(view);
            
            // Fade in the new view
            app.style.opacity = '1';
            transitionTimeout = null;
        }, 100); // Short delay for smooth transition
    };
    // Route Handlers (with dynamic imports for code splitting)
    // Register Global Route Guard
    Router.before(async (route) => {
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

    // Route Handlers (with dynamic imports for code splitting)
    Router.on('dashboard', async () => {
        NavigationState.setLastActiveView('dashboard');
        const { DashboardView } = await import('./views/DashboardView.js');
        setView(DashboardView());
        updateMobileNavigation('dashboard'); // Keep dashboard for desktop, but mobile nav shows charts
    });

    Router.on('add-expense', async (params) => {
        NavigationState.setLastActiveView('add-expense');
        const { AddView } = await import('./views/AddView.js');
        setView(AddView(params));
        updateMobileNavigation('add-expense');
    });

    Router.on('edit-expense', async (params) => {
        NavigationState.setLastActiveView('edit-expense');
        const { EditView } = await import('./views/EditView.js');
        setView(EditView(params));
        updateMobileNavigation('dashboard'); // Edit doesn't have nav item, highlight dashboard
    });

    Router.on('settings', async () => {
        NavigationState.setLastActiveView('settings');
        const { SettingsView } = await import('./views/SettingsView.js');
        setView(SettingsView());
        updateMobileNavigation('settings');
    });

    Router.on('reports', async () => {
        NavigationState.setLastActiveView('reports');
        const { ReportsView } = await import('./views/ReportsView.js');
        setView(ReportsView());
        updateMobileNavigation('reports');
    });

    Router.on('login', async () => {
        NavigationState.setLastActiveView('login');
        const { LoginView } = await import('./views/LoginView.js');
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
