/**
 * Financial Planning View - Advanced Financial Planning & Forecasting
 *
 * Main view component for comprehensive financial planning features including:
 * - Financial forecasting and predictions
 * - Investment portfolio tracking
 * - Long-term goal planning
 * - Advanced insights and analytics
 * - Risk assessment and warnings
 * - Scenario planning and modeling
 *
 * Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.7, 4.1-4.7, 5.1-5.6, 6.1-6.6, 7.1-7.6, 8.1-8.6, 9.1-9.6, 10.1-10.6, 11.1-11.6
 */

import { Router } from '../core/router.js';
import { TransactionService } from '../core/transaction-service.js';
import { AccountService } from '../core/account-service.js';
import { ForecastEngine } from '../core/forecast-engine.js';
import { AccountBalancePredictor } from '../core/account-balance-predictor.js';
import { RiskAssessor } from '../core/risk-assessor.js';
import { GoalPlanner } from '../core/goal-planner.js';
import { ChartRenderer } from '../components/ChartRenderer.js';

import {
  COLORS,
  SPACING,
  BREAKPOINTS,
  TIMING,
  STORAGE_KEYS,
} from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';

import { OverviewSection } from './financial-planning/OverviewSection.js';
import { ForecastsSection } from './financial-planning/ForecastsSection.js';
import { InvestmentsSection } from './financial-planning/InvestmentsSection.js';
import { GoalsSection } from './financial-planning/GoalsSection.js';
import { InsightsSection } from './financial-planning/InsightsSection.js';
import { ScenariosSection } from './financial-planning/ScenariosSection.js';

export const FinancialPlanningView = () => {
  const container = document.createElement('div');
  container.className = 'view-financial-planning view-container view-fixed';

  // State management
  let currentSection = 'overview';
  let isLoading = false;
  let planningData = null;

  // Initialize calculation engines
  const forecastEngine = new ForecastEngine();
  const balancePredictor = new AccountBalancePredictor();
  const riskAssessor = new RiskAssessor();
  const goalPlanner = new GoalPlanner();
  const chartRenderer = new ChartRenderer();

  // Track active charts for cleanup
  const activeCharts = new Map();

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
  container.appendChild(header);

  // Create navigation tabs
  const navigation = createNavigation();
  container.appendChild(navigation);

  // Helper functions now imported from financial-planning-helpers.js

  // Main content area
  const content = document.createElement('main');
  content.className = 'financial-planning-content';
  content.id = 'financial-planning-main-content';
  content.setAttribute('role', 'main');
  content.setAttribute('aria-labelledby', 'financial-planning-title');
  content.style.flex = '1';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.minHeight = '0';
  content.style.overflow = 'auto';
  content.style.gap = SPACING.LG;
  container.appendChild(content);

  /**
   * Create header with title and back button
   */
  function createHeader() {
    const header = document.createElement('header');
    header.className = 'financial-planning-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = SPACING.LG;
    header.style.flexShrink = '0';

    // Left side with back button and title
    const leftSide = document.createElement('div');
    leftSide.style.display = 'flex';
    leftSide.style.alignItems = 'center';
    leftSide.style.gap = SPACING.MD;

    // Back button (always visible)
    const backButton = document.createElement('button');
    backButton.innerHTML = '← Back';
    backButton.className = 'btn btn-ghost financial-planning-back-btn';
    backButton.style.fontSize = '1rem';
    backButton.style.padding = `${SPACING.SM} ${SPACING.MD}`;
    backButton.style.border = `1px solid ${COLORS.BORDER}`;
    backButton.style.borderRadius = 'var(--radius-md)';
    backButton.style.background = COLORS.SURFACE;
    backButton.style.color = COLORS.TEXT_MAIN;
    backButton.style.cursor = 'pointer';
    backButton.style.fontWeight = '500';
    backButton.style.transition = 'all 0.2s ease';
    backButton.title = 'Back to Dashboard';

    // Hover effects
    backButton.addEventListener('mouseenter', () => {
      backButton.style.background = COLORS.SURFACE_HOVER;
      backButton.style.borderColor = COLORS.PRIMARY;
    });

    backButton.addEventListener('mouseleave', () => {
      backButton.style.background = COLORS.SURFACE;
      backButton.style.borderColor = COLORS.BORDER;
    });

    backButton.addEventListener('click', () => Router.navigate('dashboard'));

    // Title
    const title = document.createElement('h2');
    title.id = 'financial-planning-title';
    title.textContent = 'Financial Planning';
    title.style.margin = '0';
    title.style.fontSize =
      window.innerWidth < BREAKPOINTS.MOBILE ? '1.25rem' : 'h2';
    title.style.fontWeight = 'bold';
    title.style.color = COLORS.TEXT_MAIN;

    leftSide.appendChild(backButton);
    leftSide.appendChild(title);

    // Right side: add sync status indicator
    const rightSide = document.createElement('div');
    rightSide.style.display = 'flex';
    rightSide.style.alignItems = 'center';
    rightSide.style.gap = SPACING.SM;

    const syncStatus = document.createElement('div');
    syncStatus.className = 'sync-status';
    syncStatus.style.padding = `${SPACING.XS} ${SPACING.SM}`;
    syncStatus.style.borderRadius = 'var(--radius-sm)';
    syncStatus.style.background = COLORS.SURFACE;
    syncStatus.style.color = COLORS.TEXT_MUTED;
    syncStatus.style.fontSize = '0.875rem';
    syncStatus.textContent = navigator.onLine
      ? 'Sync: online'
      : 'Sync: offline';
    rightSide.appendChild(syncStatus);

    header.appendChild(leftSide);
    header.appendChild(rightSide);

    return header;
  }

  /**
   * Create navigation tabs for different planning sections
   */
  function createNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'financial-planning-nav';
    nav.setAttribute('role', 'tablist');
    nav.style.display = 'flex';
    nav.style.gap = SPACING.SM;
    nav.style.marginBottom = SPACING.LG;
    nav.style.flexWrap = 'wrap'; // Allow wrapping
    nav.style.maxWidth = '100%';

    // Hide scrollbar for webkit browsers
    const style = document.createElement('style');
    style.textContent = `
      .financial-planning-nav::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);

    const sections = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'forecasts', label: 'Forecasts', icon: '🔮' },
      { id: 'investments', label: 'Investments', icon: '💰' },
      { id: 'goals', label: 'Goals', icon: '🎯' },
      { id: 'insights', label: 'Insights', icon: '💡' },
      { id: 'scenarios', label: 'Scenarios', icon: '🔄' },
    ];

    sections.forEach(section => {
      const tab = document.createElement('button');
      tab.className = 'financial-planning-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute(
        'aria-selected',
        section.id === currentSection ? 'true' : 'false'
      );
      tab.setAttribute('aria-controls', `${section.id}-panel`);
      tab.id = `${section.id}-tab`;

      tab.innerHTML = `
        <span class="tab-icon">${section.icon}</span>
        <span class="tab-label">${section.label}</span>
      `;

      // Tab styling - use btn-primary sized padding
      Object.assign(tab.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.XS,
        padding: `${SPACING.MD} ${SPACING.XL}`,
        minHeight: 'var(--touch-target-min)',
        minWidth: 'var(--touch-target-min)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        background:
          section.id === currentSection ? COLORS.PRIMARY : COLORS.SURFACE,
        color: section.id === currentSection ? 'white' : COLORS.TEXT_MAIN,
        cursor: 'pointer',
        fontSize: 'var(--font-size-md)',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        flex: '1 0 auto', // Grow to fill space, but respect content size
      });

      // Hover effects
      tab.addEventListener('mouseenter', () => {
        if (section.id !== currentSection) {
          tab.style.background = COLORS.SURFACE_HOVER;
        }
      });

      tab.addEventListener('mouseleave', () => {
        if (section.id !== currentSection) {
          tab.style.background = COLORS.SURFACE;
        }
      });

      // Click handler
      tab.addEventListener('click', () => {
        switchSection(section.id);
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
    const tabs = navigation.querySelectorAll('.financial-planning-tab');
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
      case 'scenarios':
        renderScenariosSection();
        break;
      default:
        renderOverviewSection();
    }
  }

  /**
   * Render Overview section - Financial health summary
   */
  function renderOverviewSection() {
    const overviewElement = OverviewSection(planningData, riskAssessor);
    content.appendChild(overviewElement);
  }

  /**
   * Render Forecasts section - Income/expense predictions
   */
  function renderForecastsSection() {
    const forecastsElement = ForecastsSection(
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
    const goalsElement = await GoalsSection(chartRenderer, activeCharts);
    content.appendChild(goalsElement);
  }

  /**
   * Render Insights section - Advanced analytics
   */
  function renderInsightsSection() {
    const insightsElement = InsightsSection(
      planningData,
      chartRenderer,
      activeCharts
    );
    content.appendChild(insightsElement);
  }

  /**
   * Render Scenarios section - What-if modeling
   */
  function renderScenariosSection() {
    const scenariosElement = ScenariosSection(
      goalPlanner,
      chartRenderer,
      activeCharts
    );
    content.appendChild(scenariosElement);
  }

  // createStatsCard is now imported from StatsCard.js component

  // createPlaceholder is now imported from financial-planning-helpers.js

  /**
   * Load planning data from various services
   */
  async function loadPlanningData() {
    if (isLoading) return;

    try {
      isLoading = true;

      // Get transaction and account data
      const transactions = TransactionService.getAll();
      const accounts = AccountService.getAccounts();

      // Load investment data and goals (prefer local cache first)
      const investmentsKey = STORAGE_KEYS.INVESTMENTS;
      const goalsKey = STORAGE_KEYS.GOALS;

      const investmentsCacheRaw = localStorage.getItem(investmentsKey);
      if (investmentsCacheRaw)
        console.log(`[Sync] ${investmentsKey} loaded from cache`);
      const goalsCacheRaw = localStorage.getItem(goalsKey);
      if (goalsCacheRaw) console.log(`[Sync] ${goalsKey} loaded from cache`);

      // Import StorageService dynamically
      const { StorageService } = await import('../core/storage.js');
      const investments = StorageService.getInvestments
        ? StorageService.getInvestments()
        : [];
      const goals = StorageService.getGoals ? StorageService.getGoals() : [];

      planningData = {
        transactions,
        accounts,
        investments,
        goals,
        lastUpdated: new Date(),
      };

      // Re-render current section with new data
      renderSection(currentSection);
    } catch (error) {
      console.error('Error loading planning data:', error);
    } finally {
      isLoading = false;
    }
  }
  const updateResponsiveLayout = debounce(() => {
    const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;

    // Layout updates for mobile

    // Update header layout for mobile
    const header = container.querySelector('.financial-planning-header');
    if (header) {
      const leftSide = header.querySelector('div:first-child');
      const title = header.querySelector('h1');
      const backButton = header.querySelector('.financial-planning-back-btn');

      if (isMobile) {
        // Mobile: smaller title, more compact back button
        if (title) title.style.fontSize = '1.5rem';
        if (backButton) {
          backButton.style.padding = `${SPACING.XS} ${SPACING.SM}`;
          backButton.style.fontSize = '0.875rem';
        }
        if (leftSide) leftSide.style.gap = SPACING.SM;
      } else {
        // Desktop: larger title, normal back button
        if (title) title.style.fontSize = '2rem';
        if (backButton) {
          backButton.style.padding = `${SPACING.SM} ${SPACING.MD}`;
          backButton.style.fontSize = '1rem';
        }
        if (leftSide) leftSide.style.gap = SPACING.MD;
      }
    }

    // Update stats grid for mobile
    const statsGrid = content.querySelector('.stats-grid');
    if (statsGrid) {
      statsGrid.style.gridTemplateColumns = isMobile
        ? 'repeat(2, 1fr)'
        : 'repeat(auto-fit, minmax(250px, 1fr))';
    }

    // Update quick actions for mobile
    const actionsContainer = content.querySelector('.quick-actions');
    if (actionsContainer) {
      actionsContainer.style.flexDirection = isMobile ? 'column' : 'row';
    }
  }, TIMING.DEBOUNCE_RESIZE);

  // Event listeners
  window.addEventListener('resize', updateResponsiveLayout);

  // Storage update handler
  const handleStorageUpdate = e => {
    if (
      e.detail.key === STORAGE_KEYS.TRANSACTIONS ||
      e.detail.key === STORAGE_KEYS.ACCOUNTS ||
      e.detail.key === STORAGE_KEYS.INVESTMENTS ||
      e.detail.key === STORAGE_KEYS.GOALS
    ) {
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
    window.removeEventListener('resize', updateResponsiveLayout);
    window.removeEventListener('storage-updated', handleStorageUpdate);
    window.removeEventListener('sync-state', handleSyncState);
    window.removeEventListener('forecast-invalidate', handleForecastInvalidate);
    window.removeEventListener('keydown', handleKeyboardShortcuts);
  };

  // Initialize
  updateResponsiveLayout();
  loadPlanningData();
  (async () => {
    await renderSection(currentSection);
  })();

  return container;
};
