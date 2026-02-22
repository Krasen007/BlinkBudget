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
import { AccountService } from '../core/Account/account-service.js';
import { ForecastEngine } from '../core/forecast-engine.js';
import { AccountBalancePredictor } from '../core/Account/account-balance-predictor.js';
import { RiskAssessor } from '../core/risk-assessor.js';
import { GoalPlanner } from '../core/goal-planner.js';
import { ChartRenderer } from '../components/ChartRenderer.js';

import { COLORS, SPACING, TIMING, STORAGE_KEYS } from '../utils/constants.js';

import { debounce } from '../utils/touch-utils.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';

import { OverviewSection } from './financial-planning/OverviewSection.js';
import { ForecastsSection } from './financial-planning/ForecastsSection.js';
import { InvestmentsSection } from './financial-planning/InvestmentsSection.js';
import { GoalsSection } from './financial-planning/GoalsSection.js';
import { InsightsSection } from './financial-planning/InsightsSection.js';
import { ScenariosSection } from './financial-planning/ScenariosSection.js';
import { BudgetsSection } from './financial-planning/BudgetsSection.js';

export const FinancialPlanningView = () => {
  const container = document.createElement('div');
  container.className = 'view-financial-planning view-container';

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
    leftSide.style.display = 'flex';
    leftSide.style.alignItems = 'center';
    leftSide.style.gap = SPACING.MD;
    leftSide.style.minWidth = '0';
    leftSide.style.flexShrink = '1';

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
      { id: 'scenarios', label: 'Scenarios', icon: '🔄' },
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

      tab.innerHTML = `
        <span class="tab-icon">${section.icon}</span>
        <span class="tab-label">${section.label}</span>
      `;

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
      case 'scenarios':
        renderScenariosSection();
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
   * Load planning data from various services
   */
  async function loadPlanningData() {
    if (isLoading) return;

    try {
      isLoading = true;

      // Get transaction and account data
      const transactions = TransactionService.getAll();
      const accounts = AccountService.getAccounts();

      // Load investment data, goals, and budgets (prefer local cache first)
      const investmentsKey = STORAGE_KEYS.INVESTMENTS;
      const goalsKey = STORAGE_KEYS.GOALS;
      const budgetsKey = STORAGE_KEYS.BUDGETS;

      const investmentsCacheRaw = localStorage.getItem(investmentsKey);
      const goalsCacheRaw = localStorage.getItem(goalsKey);
      const budgetsCacheRaw = localStorage.getItem(budgetsKey);

      if (investmentsCacheRaw || goalsCacheRaw || budgetsCacheRaw) {
        console.log(`[Sync] Planning data loaded from cache:`, {
          investments: !!investmentsCacheRaw,
          goals: !!goalsCacheRaw,
          budgets: !!budgetsCacheRaw,
        });
      }

      // Import StorageService dynamically
      const { StorageService } = await import('../core/storage.js');
      const investments = StorageService.getInvestments
        ? StorageService.getInvestments()
        : [];
      const goals = StorageService.getGoals ? StorageService.getGoals() : [];
      const budgets = StorageService.getBudgets
        ? StorageService.getBudgets()
        : [];

      planningData = {
        transactions,
        accounts,
        investments,
        goals,
        budgets,
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
    // Shared title update etc
  }, TIMING.DEBOUNCE_RESIZE);

  // Event listeners
  window.addEventListener('resize', updateResponsiveLayout);

  // Storage update handler
  const handleStorageUpdate = e => {
    if (
      e.detail.key === STORAGE_KEYS.TRANSACTIONS ||
      e.detail.key === STORAGE_KEYS.ACCOUNTS ||
      e.detail.key === STORAGE_KEYS.INVESTMENTS ||
      e.detail.key === STORAGE_KEYS.GOALS ||
      e.detail.key === STORAGE_KEYS.BUDGETS
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

  return container;
};
