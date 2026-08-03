/**
 * Financial Planning View - Advanced Financial Planning & Forecasting
 *
 * Main view component for comprehensive financial planning features including:
 * - Financial forecasting and predictions
 * - Investment portfolio tracking
 * - Long-term goal planning
 * - Advanced insights and analytics
 * - Risk assessment and warnings
 *
 * Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.7, 4.1-4.7, 5.1-5.6, 6.1-6.6, 7.1-7.6, 8.1-8.6, 9.1-9.6, 10.1-10.6, 11.1-11.6
 */

import { Router } from '../core/router.js';
import { ForecastEngine } from '../core/forecast-engine.js';
import { AccountBalancePredictor } from '../core/Account/account-balance-predictor.js';
import { ChartRenderer } from '../components/ChartRenderer.js';
import { AuthService } from '../core/auth-service.js';
import { SyncService } from '../core/sync-service.js';

import { COLORS, SPACING, TIMING, STORAGE_KEYS } from '../utils/constants.js';

import { debounce } from '../utils/touch-utils.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';

import { escapeHtml } from '../utils/security-utils.js';

import { OverviewSection } from './financial-planning/OverviewSection.js';
import { ForecastsSection } from './financial-planning/ForecastsSection.js';
import { InvestmentsSection } from './financial-planning/InvestmentsSection.js';
import { GoalsSection } from './financial-planning/GoalsSection.js';
import { InsightsSection } from './financial-planning/InsightsSection.js';
import { BudgetsSection } from './financial-planning/BudgetsSection.js';
import { planningDataManager } from '../core/financial-planning/PlanningDataManager.js';

// Simple deep equality check for browser compatibility
const isDeepEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isDeepEqual(a[key], b[key])) return false;
  }

  return true;
};

// Use in-memory CacheService for instant planning data access (no JSON overhead)
import { CacheService } from '../core/cache-service.js';

const PLANNING_CACHE_KEY = 'financial_planning_data';
const PLANNING_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedPlanningData() {
  return CacheService.get(PLANNING_CACHE_KEY);
}

function setCachedPlanningData(data) {
  CacheService.put(PLANNING_CACHE_KEY, data, PLANNING_CACHE_TTL_MS);
}

function clearPlanningCache() {
  CacheService.del(PLANNING_CACHE_KEY);
}

export const FinancialPlanningView = (params = {}) => {
  const container = document.createElement('div');
  container.className = 'view-financial-planning view-container';

  // State management
  let currentSection = params.section || 'overview';
  let isLoading = false;
  let planningData = null;

  // Initialize calculation engines
  const forecastEngine = new ForecastEngine();
  const balancePredictor = new AccountBalancePredictor();
  const chartRenderer = new ChartRenderer();

  // Track active charts for cleanup
  const activeCharts = new Map();

  // Track timeout for cleanup
  let backgroundRefreshTimeout = null;
  let isCancelled = false;

  /**
   * Clean up chart instances created by this view
   */
  function cleanupCharts() {
    activeCharts.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
        } catch (e) {
          // ignore individual chart cleanup errors
          console.warn('Error destroying chart:', e);
        }
      }
    });
    activeCharts.clear();
  }

  // Create header
  const header = createHeader();
  const navigation = createNavigation();

  // Create header container that includes both header and navigation
  const headerContainer = document.createElement('div');
  headerContainer.appendChild(header);
  headerContainer.appendChild(navigation);
  headerContainer.className = 'view-header view-sticky view-header-container';
  container.appendChild(headerContainer);

  // Main content area
  const content = document.createElement('div');
  content.className = 'view-content';
  content.id = 'financial-planning-content';

  container.appendChild(content);

  /**
   * Create header with title and back button
   */
  function createHeader() {
    const header = document.createElement('header');
    header.className = 'view-header-row';

    // Left side with back button and title
    const leftSide = document.createElement('div');
    leftSide.className = 'reports-header-left';

    // Back button (always visible)
    const backButton = document.createElement('button');
    backButton.innerHTML = '← Back';
    backButton.className = 'view-back-btn';
    backButton.title = 'Back to Dashboard';

    backButton.addEventListener('click', () => Router.navigate('dashboard'));

    // Title
    const title = document.createElement('h2');
    title.id = 'financial-planning-title';
    title.textContent = 'Financial Planning';
    title.className = 'view-title';

    leftSide.appendChild(backButton);
    leftSide.appendChild(title);

    // Right side: navigation buttons
    const rightSide = createNavigationButtons('financial-planning');

    header.appendChild(leftSide);
    header.appendChild(rightSide);

    return header;
  }

  /**
   * Create navigation tabs for different planning sections
   */
  function createNavigation() {
    const nav = document.createElement('nav');
    nav.setAttribute('role', 'tablist');

    // Apply exact 3-per-row grid layout as TimePeriodSelector
    Object.assign(nav.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: SPACING.SM,
      width: '100%',
      maxWidth: '100%',
    });

    const sections = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'forecasts', label: 'Forecasts', icon: '🔮' },
      { id: 'investments', label: 'Investments', icon: '💰' },
      { id: 'goals', label: 'Goals', icon: '🎯' },
      { id: 'insights', label: 'Insights', icon: '💡' },
      { id: 'budgets', label: 'Budgets', icon: '📉' },
    ];

    sections.forEach(section => {
      const tab = document.createElement('button');
      tab.className = 'view-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute(
        'aria-selected',
        section.id === currentSection ? 'true' : 'false'
      );
      tab.setAttribute('aria-controls', `${section.id}-panel`);
      tab.id = `${section.id}-tab`;

      // Security: Escape dynamic icon and label values
      tab.innerHTML = `
        <span class="tab-icon">${escapeHtml(section.icon)}</span>
        <span class="tab-label">${escapeHtml(section.label)}</span>
      `;

      // Click handler
      tab.addEventListener('click', () => {
        Router.navigate('financial-planning', { section: section.id });
      });

      nav.appendChild(tab);
    });

    return nav;
  }

  /**
   * Switch between different planning sections
   */
  async function switchSection(sectionId) {
    if (sectionId === currentSection) return;

    // Clean up charts from previous section
    cleanupCharts();

    currentSection = sectionId;

    // Update tab states
    const tabs = navigation.querySelectorAll('.view-tab');
    tabs.forEach(tab => {
      const isActive = tab.id === `${sectionId}-tab`;
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.style.background = isActive ? COLORS.PRIMARY : COLORS.SURFACE;
      tab.style.color = isActive ? 'white' : COLORS.TEXT_MAIN;
    });

    // Render the selected section
    await renderSection(sectionId);
  }

  /**
   * Render the content for the selected section
   */
  async function renderSection(sectionId) {
    content.innerHTML = '';

    // Add section panel attributes
    content.setAttribute('role', 'tabpanel');
    content.setAttribute('aria-labelledby', `${sectionId}-tab`);
    content.id = `${sectionId}-panel`;

    switch (sectionId) {
      case 'overview':
        renderOverviewSection();
        break;
      case 'forecasts':
        renderForecastsSection();
        break;
      case 'investments':
        await renderInvestmentsSection();
        break;
      case 'goals':
        await renderGoalsSection();
        break;
      case 'insights':
        renderInsightsSection();
        break;
      case 'budgets':
        await renderBudgetsSection();
        break;
      default:
        renderOverviewSection();
    }
  }

  /**
   * Render Overview section - Financial health summary
   */
  function renderOverviewSection() {
    const overviewElement = OverviewSection(planningData);
    content.appendChild(overviewElement);
  }

  /**
   * Render Forecasts section - Income/expense predictions
   */
  async function renderForecastsSection() {
    const forecastsElement = await ForecastsSection(
      planningData,
      forecastEngine,
      balancePredictor,
      chartRenderer,
      activeCharts
    );
    content.appendChild(forecastsElement);
  }

  /**
   * Render Investments section - Portfolio tracking
   */
  async function renderInvestmentsSection() {
    const investmentsElement = await InvestmentsSection(
      chartRenderer,
      activeCharts
    );
    content.appendChild(investmentsElement);
  }

  /**
   * Render Goals section - Long-term planning
   */
  async function renderGoalsSection() {
    const goalsElement = await GoalsSection(
      chartRenderer,
      activeCharts,
      planningData,
      forecastEngine
    );
    content.appendChild(goalsElement);
  }

  /**
   * Render Insights section - Advanced analytics
   */
  function renderInsightsSection() {
    const insightsResult = InsightsSection(
      planningData,
      chartRenderer,
      activeCharts
    );
    content.appendChild(insightsResult.element);
  }

  /**
   * Render Budgets section - Category limits and tracking
   */
  async function renderBudgetsSection() {
    const budgetsElement = await BudgetsSection(planningData);
    content.appendChild(budgetsElement);
  }

  // createStatsCard is now imported from StatsCard.js component

  // createPlaceholder is now imported from financial-planning-helpers.js

  /**
   * Load local data first (instant), then optionally sync from cloud in background.
   * This ensures the view renders immediately without blocking on network calls.
   */
  async function loadPlanningData() {
    if (isLoading) return;

    try {
      isLoading = true;

      // 1. Check in-memory cache first (fastest path)
      const cachedData = getCachedPlanningData();
      if (cachedData) {
        console.log('[FinancialPlanning] Using cached data instantly');
        planningData = cachedData;
        renderSection(currentSection);
        isLoading = false;

        // Set lastUpdated on the manager so needsRefresh() reflects real state
        if (cachedData.lastUpdated) {
          planningDataManager.lastUpdated = new Date(cachedData.lastUpdated);
        }

        // Background refresh via idle callback (non-blocking)
        const runBackgroundRefresh = async () => {
          try {
            if (isCancelled) return;

            // Load fresh local data first
            let freshData = await planningDataManager.loadData();

            if (isCancelled) return;

            // If no transactions locally, try cloud sync (non-blocking)
            if (
              !freshData ||
              !freshData.transactions ||
              freshData.transactions.length === 0
            ) {
              await backgroundSyncFromCloud();
              if (isCancelled) return;
              freshData = await planningDataManager.loadData();
            }

            if (isCancelled) return;

            // Update state if data changed
            if (planningData && !isDeepEqual(freshData, planningData)) {
              planningData = freshData;
              setCachedPlanningData(freshData);
              renderSection(currentSection);
              window.dispatchEvent(
                new CustomEvent('storage-updated', {
                  detail: { type: 'financial-planning' },
                })
              );
            } else if (!planningData) {
              // First-time load with data (shouldn't happen since we cache, but handle gracefully)
              planningData = freshData;
              setCachedPlanningData(freshData);
              renderSection(currentSection);
            }
          } catch (error) {
            console.error(
              '[FinancialPlanning] Background refresh failed:',
              error
            );
          }
        };

        if ('requestIdleCallback' in window) {
          backgroundRefreshTimeout = window.requestIdleCallback(
            runBackgroundRefresh,
            { timeout: 2000 }
          );
        } else {
          backgroundRefreshTimeout = setTimeout(runBackgroundRefresh, 200);
        }

        return;
      }

      // 2. No cache — load local data instantly (no cloud blocking)
      planningData = await planningDataManager.loadData();

      // Cache it for next time
      setCachedPlanningData(planningData);

      // Render immediately with local data
      renderSection(currentSection);

      // 3. If no transactions locally, background-sync from cloud (non-blocking)
      if (
        !planningData ||
        !planningData.transactions ||
        planningData.transactions.length === 0
      ) {
        // Fire-and-forget background sync — don't await it
        backgroundSyncFromCloud()
          .then(async () => {
            if (isCancelled) return;
            const freshData = await planningDataManager.loadData();
            if (freshData && !isDeepEqual(freshData, planningData)) {
              planningData = freshData;
              setCachedPlanningData(freshData);
              renderSection(currentSection);
            }
          })
          .catch(err => {
            console.warn(
              '[FinancialPlanning] Background cloud sync failed:',
              err
            );
          });
      }
    } catch (error) {
      console.error('Error loading planning data:', error);
    } finally {
      isLoading = false;
    }
  }

  /**
   * Background sync from cloud — does NOT block rendering.
   * Only syncs if data is stale (older than 5 minutes) or if no local data exists.
   */
  async function backgroundSyncFromCloud() {
    try {
      const userId = AuthService.getUserId();
      if (!userId) return;

      // Only sync from cloud if data is actually stale
      if (planningDataManager.needsRefresh()) {
        console.log('[Planning] Background sync from cloud (data stale)...');
        await SyncService.pullFromCloud(userId);
      } else {
        console.log('[Planning] Local data is fresh, skipping cloud sync');
      }
    } catch (error) {
      console.warn('[Planning] Background cloud sync failed:', error);
    }
  }

  const updateResponsiveLayout = debounce(() => {
    // Shared title update etc
  }, TIMING.DEBOUNCE_RESIZE);

  // Event listeners
  window.addEventListener('resize', updateResponsiveLayout);

  // Handle hash changes to update section when navigating within financial-planning
  const handleHashChange = () => {
    const hash = window.location.hash.slice(1);
    const [route, paramString] = hash.split('?');
    if (route === 'financial-planning' && paramString) {
      const params = new URLSearchParams(paramString);
      const newSection = params.get('section');
      if (newSection && newSection !== currentSection) {
        switchSection(newSection);
      }
    }
  };
  window.addEventListener('hashchange', handleHashChange);

  // Storage update handler
  const handleStorageUpdate = e => {
    if (
      e.detail.key === STORAGE_KEYS.TRANSACTIONS ||
      e.detail.key === STORAGE_KEYS.ACCOUNTS ||
      e.detail.key === STORAGE_KEYS.INVESTMENTS ||
      e.detail.key === STORAGE_KEYS.GOALS ||
      e.detail.key === STORAGE_KEYS.BUDGETS
    ) {
      // Clear the in-memory cache so next load picks up fresh data.
      // Do NOT call planningDataManager.refresh() — that nulls out lastUpdated
      // and causes needsRefresh() to return true, which triggers a cloud sync
      // on the very next visibility change even when nothing has changed.
      clearPlanningCache();
      loadPlanningData();
    }
  };

  // Listen for forecast invalidation requests from CacheInvalidator
  const handleForecastInvalidate = _e => {
    try {
      if (forecastEngine && typeof forecastEngine.clearCache === 'function') {
        forecastEngine.clearCache();
        // Also re-render current section if forecasts are visible
        if (currentSection === 'forecasts' || currentSection === 'overview') {
          renderSection(currentSection);
        }
      }
    } catch (error) {
      console.warn('Error clearing forecast cache:', error);
    }
  };

  // Sync state handler for UI
  const handleSyncState = e => {
    const detail = e.detail || {};
    const right = container.querySelector('.sync-status');
    if (!right) return;
    if (detail.state === 'syncing') {
      right.textContent = `Syncing ${detail.dataType}...`;
      right.style.background = COLORS.SURFACE_HOVER;
      right.style.color = COLORS.TEXT_MAIN;
    } else if (detail.state === 'synced') {
      right.textContent = `Synced ${detail.dataType} ${new Date(detail.timestamp).toLocaleTimeString()}`;
      right.style.background = COLORS.SURFACE;
      right.style.color = COLORS.TEXT_MUTED;
    } else if (detail.state === 'error') {
      right.textContent = `Sync error (${detail.dataType})`;
      right.style.background = COLORS.ERROR;
      right.style.color = 'white';
    }
  };

  // Keyboard shortcuts
  const handleKeyboardShortcuts = e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      Router.navigate('dashboard');
    }
  };

  window.addEventListener('storage-updated', handleStorageUpdate);
  window.addEventListener('sync-state', handleSyncState);
  window.addEventListener('forecast-invalidate', handleForecastInvalidate);
  window.addEventListener('keydown', handleKeyboardShortcuts);

  // Cleanup function
  container.cleanup = () => {
    isCancelled = true;

    if (backgroundRefreshTimeout) {
      if ('requestIdleCallback' in window) {
        window.cancelIdleCallback(backgroundRefreshTimeout);
      } else {
        clearTimeout(backgroundRefreshTimeout);
      }
      backgroundRefreshTimeout = null;
    }

    window.removeEventListener('resize', updateResponsiveLayout);
    window.removeEventListener('hashchange', handleHashChange);
    window.removeEventListener('storage-updated', handleStorageUpdate);
    window.removeEventListener('sync-state', handleSyncState);
    window.removeEventListener('forecast-invalidate', handleForecastInvalidate);
    window.removeEventListener('keydown', handleKeyboardShortcuts);
  };

  // Initialize
  updateResponsiveLayout();
  loadPlanningData();

  return container;
};
