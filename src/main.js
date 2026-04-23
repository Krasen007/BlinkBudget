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
import { TransactionService } from './core/transaction-service.js';
import { getAnalyticsEngine } from './core/analytics/AnalyticsInstance.js';
import { getCurrentMonthPeriod } from './utils/reports-utils.js';
import './core/mobile-utils.js'; // Initialize consolidated mobile utilities
import './pwa.js'; // Register PWA service worker

InstallService.init();

/**
 * Pre-load ReportsView data for instant navigation
 */
const preloadReportsData = async () => {
  try {
    console.log('[Main] Pre-loading ReportsView data...');

    // Pre-load Chart.js
    const { preloadChartJS } = await import('./core/chart-loader.js');
    await preloadChartJS();

    // Get transactions and analytics engine
    const transactions = TransactionService.getAll();
    const analyticsEngine = getAnalyticsEngine();

    // Pre-calculate analytics for current month
    const currentTimePeriod = getCurrentMonthPeriod();

    const startStr =
      currentTimePeriod.startDate instanceof Date
        ? currentTimePeriod.startDate.toISOString()
        : currentTimePeriod.startDate;
    const endStr =
      currentTimePeriod.endDate instanceof Date
        ? currentTimePeriod.endDate.toISOString()
        : currentTimePeriod.endDate;
    const cacheKey = `report_data_${startStr}_${endStr}`;

    // Check if already cached
    if (analyticsEngine.cache.get(cacheKey)) {
      console.log('[Main] ReportsView data already cached');
      return;
    }

    // Calculate and cache analytics data (without raw transactions)
    const analyticsData = {
      timePeriod: currentTimePeriod,
      insights: analyticsEngine.generateSpendingInsights(
        transactions,
        currentTimePeriod
      ),
      categoryBreakdown: analyticsEngine.calculateCategoryBreakdown(
        transactions,
        currentTimePeriod
      ),
      incomeVsExpenses: analyticsEngine.calculateIncomeVsExpenses(
        transactions,
        currentTimePeriod
      ),
      costOfLiving: analyticsEngine.calculateCostOfLiving(
        transactions,
        currentTimePeriod
      ),
    };

    analyticsEngine.cache.set(cacheKey, analyticsData);

    console.log('[Main] ReportsView data pre-loaded successfully');
  } catch (error) {
    console.warn('[Main] Failed to pre-load ReportsView data:', error);
    // Don't block app initialization if pre-loading fails
  }
};

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

      // Pre-load ReportsView data for instant navigation
      preloadReportsData();

      // Initialize tutorial system after user is authenticated
      import('./components/tutorial/TutorialManager.js')
        .then(({ TutorialManager }) => {
          const initTutorial = async () => {
            const tutorialManager = new TutorialManager();
            const shouldShowTutorial = await tutorialManager.initialize();

            if (shouldShowTutorial) {
              // Show tutorial after a short delay to let app settle
              tutorialManager.startWithDelay(1500);
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

      // Cleanup tutorial manager
      if (window.tutorialManager) {
        window.tutorialManager.destroy();
        window.tutorialManager = null;
      }

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
  CacheInvalidator.init();
  // Initialize enhanced back button handling for mobile
  if (window.mobileUtils && window.mobileUtils.setupBackButtonHandling) {
    window.mobileUtils.setupBackButtonHandling();
  }
  // Initialize privacy service after app is ready
  PrivacyService.init();
  console.log('[Main] App initialized, starting router.');
  Router.init();
};

initApp();
