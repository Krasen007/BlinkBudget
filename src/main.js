import { Router } from './core/router.js';
import { AuthService } from './core/auth-service.js';
import { SyncService } from './core/sync-service.js';
import { NavigationState } from './core/navigation-state.js';
import { ViewManager } from './core/view-manager.js';
import { routes } from './router/routes.js';
import { routeGuard } from './router/guard.js';
import { MobileNavigation } from './components/MobileNavigation.js';
import { NetworkStatus } from './components/NetworkStatus.js';
import { LoadingView } from './components/LoadingView.js';
import './core/mobile.js'; // Initialize mobile utilities
import './pwa.js'; // Register PWA service worker
import { InstallService } from './core/install.js';

InstallService.init();

const initApp = () => {
    const app = document.querySelector('#app');
    ViewManager.init(app);

    // Initial loading state
    app.appendChild(LoadingView());

    // Initialize mobile navigation
    const initMobileNav = () => {
        const existingNav = document.querySelector('.mobile-nav');
        if (existingNav) existingNav.remove();

        if (window.mobileUtils?.isMobile()) {
            const mobileNav = MobileNavigation({ currentRoute: Router.getCurrentRoute() });
            document.body.appendChild(mobileNav);
        }
    };

    // Register Routes
    Object.entries(routes).forEach(([path, handler]) => {
        Router.on(path, handler);
    });

    // Register Route Guard
    Router.before(routeGuard);

    // Mobile Responsive updates
    if (window.mobileUtils) {
        window.mobileUtils.onResponsiveChange(() => initMobileNav());
    } else {
        initMobileNav();
    }

    // Network status
    document.body.appendChild(NetworkStatus());

    // Auth Initialization
    AuthService.init(async (user) => {
        const currentRoute = Router.getCurrentRoute();

        if (user) {
            console.log("[Main] User authenticated, starting sync...");
            localStorage.setItem('auth_hint', 'true');
            SyncService.startRealtimeSync(user.uid);
            if (currentRoute === 'login') Router.navigate('dashboard');
        } else {
            console.log("[Main] No user, stopping sync.");
            localStorage.removeItem('auth_hint');
            SyncService.stopSync();
            NavigationState.clearState();
            if (currentRoute !== 'login') Router.navigate('login');
        }

        initMobileNav();
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user } }));
    });

    NavigationState.init();
    console.log("[Main] App initialized, starting router.");
    Router.init();
};

initApp();
