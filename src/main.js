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
import { InstallService } from './core/install.js';
import { CacheInvalidator } from './core/cache-invalidator.js';
import { PrivacyService } from './core/privacy-service.js';
import './core/mobile-utils.js'; // Initialize consolidated mobile utilities
import './pwa.js'; // Register PWA service worker

try {
  InstallService.init();
} catch (error) {
  console.warn('[Main] Failed to initialize InstallService:', error);
}

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
      const mobileNav = MobileNavigation({
        currentRoute: Router.getCurrentRoute(),
      });
      document.body.appendChild(mobileNav);
    }
  };

  // Register Routes
  Object.entries(routes).forEach(([path, handler]) => {
    Router.on(path, handler);
  });

  // Register Route Guard
  Router.before(routeGuard);

  // Mobile Responsive updates - only init nav if user is authenticated
  if (window.mobileUtils) {
    if (typeof window.mobileUtils.onResponsiveChange === 'function') {
      window.mobileUtils.onResponsiveChange(() => {
        // Only initialize mobile navigation if user is authenticated
        if (AuthService.user) {
          initMobileNav();
        }
      });
    }
  } else {
    // Only initialize mobile navigation if user is authenticated
    if (AuthService.user) {
      initMobileNav();
    }
  }

  // Network status
  document.body.appendChild(NetworkStatus());

  // Auth Initialization
  AuthService.init(async user => {
    const currentRoute = Router.getCurrentRoute();

    if (user) {
      console.log('[Main] User authenticated, starting sync...');
      localStorage.setItem('auth_hint', 'true');

      SyncService.startRealtimeSync(user.uid);
      // Initialize backup service after sync service
      import('./core/backup-service.js').then(({ BackupService }) => {
        BackupService.init();
      });

      if (currentRoute === 'login' || currentRoute === 'landing') {
        Router.navigate('dashboard');
      }
    } else {
      console.log('[Main] No user, stopping sync.');

      // Remove mobile navigation when user logs out
      const existingNav = document.querySelector('.mobile-nav');
      if (existingNav) {
        existingNav.remove();
      }

      localStorage.removeItem('auth_hint');
      SyncService.stopSync();
      NavigationState.clearState();
      if (currentRoute !== 'login' && currentRoute !== 'landing') {
        Router.navigate('landing');
      }
    }

    // Only initialize mobile navigation if user is authenticated
    if (user) {
      initMobileNav();
    }
    window.dispatchEvent(
      new CustomEvent('auth-state-changed', { detail: { user } })
    );
  });

  NavigationState.init();
  // Initialize centralized cache invalidator
  try {
    CacheInvalidator.init();
  } catch (error) {
    console.warn('[Main] Failed to initialize CacheInvalidator:', error);
  }
  // Initialize enhanced back button handling for mobile
  if (window.mobileUtils && window.mobileUtils.setupBackButtonHandling) {
    window.mobileUtils.setupBackButtonHandling();
  }
  // Initialize privacy service before Router.init()
  try {
    PrivacyService.init();
  } catch (error) {
    console.warn('[Main] Failed to initialize PrivacyService:', error);
  }
  console.log('[Main] App initialized, starting router.');
  Router.init();
};

initApp();
