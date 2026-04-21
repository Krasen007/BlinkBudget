/**
 * ViewPreloader
 * Preloads all application views in the background for instant navigation.
 * Uses dynamic imports with caching to ensure views load instantly when needed.
 * Also preloads cloud data from Firebase for instant access across all views.
 */

export const ViewPreloader = {
  cache: new Map(),
  preloadPromises: new Map(),
  dataPreloaded: false,

  /**
   * Preload a single view module
   * @param {string} name - The name/identifier for the view
   * @param {Function} importFn - The dynamic import function
   */
  async preloadView(name, importFn) {
    // Skip if already cached or already preloading
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    if (this.preloadPromises.has(name)) {
      return this.preloadPromises.get(name);
    }

    // Create preload promise
    const promise = importFn()
      .then(module => {
        this.cache.set(name, module);
        this.preloadPromises.delete(name);
        console.log(`[ViewPreloader] Preloaded: ${name}`);
        return module;
      })
      .catch(error => {
        this.preloadPromises.delete(name);
        console.warn(`[ViewPreloader] Failed to preload: ${name}`, error);
        // Don't throw - allow fallback to regular import
        return null;
      });

    this.preloadPromises.set(name, promise);
    return promise;
  },

  /**
   * Get a cached view module
   * @param {string} name - The name/identifier for the view
   * @returns {Object|null} The cached module or null if not cached
   */
  getCachedView(name) {
    return this.cache.get(name) || null;
  },

  /**
   * Check if a view is cached
   * @param {string} name - The name/identifier for the view
   * @returns {boolean}
   */
  isCached(name) {
    return this.cache.has(name);
  },

  /**
   * Preload all views in the background
   * Should be called after app initialization
   */
  preloadAll() {
    console.log('[ViewPreloader] Starting background preload of all views...');

    // Use setTimeout to not block initial render
    setTimeout(() => {
      const preloadTasks = [
        this.preloadView(
          'LandingView',
          () => import('../views/LandingView.js')
        ),
        this.preloadView(
          'SettingsView',
          () => import('../views/SettingsView.js')
        ),
        this.preloadView(
          'FinancialPlanningView',
          () => import('../views/FinancialPlanningView.js')
        ),
        this.preloadView('LoginView', () => import('../views/LoginView.js')),
        this.preloadView(
          'CustomCategoryManager',
          () => import('../components/CustomCategoryManager.js')
        ),
      ];

      // Preload financial-planning sub-components
      const financialPlanningPreloadTasks = [
        this.preloadView(
          'BudgetsSection',
          () => import('../views/financial-planning/BudgetsSection.js')
        ),
        this.preloadView(
          'ForecastsSection',
          () => import('../views/financial-planning/ForecastsSection.js')
        ),
        this.preloadView(
          'GoalsSection',
          () => import('../views/financial-planning/GoalsSection.js')
        ),
        this.preloadView(
          'InsightsSection',
          () => import('../views/financial-planning/InsightsSection.js')
        ),
        this.preloadView(
          'InvestmentsSection',
          () => import('../views/financial-planning/InvestmentsSection.js')
        ),
        this.preloadView(
          'OverviewSection',
          () => import('../views/financial-planning/OverviewSection.js')
        ),
      ];

      // Preload heavy components used in views
      const componentPreloadTasks = [
        this.preloadView(
          'ChartLoader',
          () => import('../core/chart-loader.js')
        ),
        this.preloadView(
          'AnalyticsInstance',
          () => import('../core/analytics/AnalyticsInstance.js')
        ),
      ];

      // Execute all preloads in parallel but don't await
      Promise.all([
        ...preloadTasks,
        ...financialPlanningPreloadTasks,
        ...componentPreloadTasks,
        this.preloadCloudData(),
      ]).then(() => {
        console.log('[ViewPreloader] All views preloaded successfully');
      });
    }, 100); // Small delay to ensure initial view renders first
  },

  /**
   * Preload cloud data from Firebase
   * Pulls all data types and preloads planning data cache
   */
  async preloadCloudData() {
    if (this.dataPreloaded) {
      console.log('[ViewPreloader] Cloud data already preloaded');
      return;
    }

    console.log('[ViewPreloader] Starting cloud data preload...');

    try {
      // Import SyncService dynamically to avoid circular dependency
      const { SyncService } = await import('./sync-service.js');
      const { AuthService } = await import('./auth-service.js');

      const userId = AuthService.getUserId();
      if (!userId) {
        console.log('[ViewPreloader] No user, skipping cloud data preload');
        return;
      }

      // Pull all data from cloud
      await SyncService.pullFromCloud(userId);
      console.log('[ViewPreloader] Cloud data pulled successfully');

      // Preload planning data cache
      const { planningDataManager } =
        await import('./financial-planning/PlanningDataManager.js');
      await planningDataManager.loadData();
      console.log('[ViewPreloader] Planning data preloaded successfully');

      // Preload goal-planner and investment-tracker services
      await import('./goal-planner.js');
      await import('./investment-tracker.js');
      console.log('[ViewPreloader] Financial planning services preloaded');

      this.dataPreloaded = true;
      console.log('[ViewPreloader] Cloud data preloading complete');
    } catch (error) {
      console.warn('[ViewPreloader] Failed to preload cloud data:', error);
      // Don't throw - allow app to function even if preload fails
    }
  },

  /**
   * Clear the cache (useful for testing or hard refresh scenarios)
   */
  clearCache() {
    this.cache.clear();
    this.preloadPromises.clear();
    this.dataPreloaded = false;
    console.log('[ViewPreloader] Cache cleared');
  },
};
