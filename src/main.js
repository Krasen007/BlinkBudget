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
import { CacheInvalidator } from './core/cache-invalidator.js';
import { PrivacyService } from './core/privacy-service.js';
import './core/mobile-viewport-manager.js';
import './core/touch-feedback-manager.js';
import './core/mobile-form-optimizer.js';

InstallService.init();

// Initialize privacy service
PrivacyService.init();

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

  // Mobile Responsive updates
  if (window.mobileUtils) {
    window.mobileUtils.onResponsiveChange(() => initMobileNav());
  } else {
    initMobileNav();
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

      // Initialize tutorial system after user is authenticated
      import('./components/tutorial/TutorialManager.js')
        .then(({ TutorialManager }) => {
          const initTutorial = async () => {
            const tutorialManager = new TutorialManager();
            const shouldShowTutorial = await tutorialManager.initialize();

            if (shouldShowTutorial) {
              // Show tutorial after a short delay to let app settle
              setTimeout(() => {
                tutorialManager.start();
              }, 1500);
            }

            // Store reference globally for potential future use
            window.tutorialManager = tutorialManager;
          };

          initTutorial().catch(error => {
            console.warn('[Main] Failed to initialize tutorial:', error);
          });
        })
        .catch(error => {
          console.warn('[Main] Failed to load tutorial module:', error);
        });

      if (currentRoute === 'login' || currentRoute === 'landing') {
        Router.navigate('dashboard');
      }
    } else {
      console.log('[Main] No user, stopping sync.');
      localStorage.removeItem('auth_hint');
      SyncService.stopSync();
      NavigationState.clearState();
      if (currentRoute !== 'login' && currentRoute !== 'landing') {
        Router.navigate('landing');
      }
    }

    initMobileNav();
    window.dispatchEvent(
      new CustomEvent('auth-state-changed', { detail: { user } })
    );
  });

  NavigationState.init();
  // Initialize centralized cache invalidator
  CacheInvalidator.init();
  console.log('[Main] App initialized, starting router.');
  Router.init();
};

initApp();
