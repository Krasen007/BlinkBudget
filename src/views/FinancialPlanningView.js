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
import { StorageService } from '../core/storage.js';
import { ChartRenderer } from '../components/ChartRenderer.js';
import { InsightsGenerator } from '../core/insights-generator.js';
import {
  createProjectedBalanceChart,
  createPortfolioCompositionChart,
  createGoalProgressChart,
  createForecastComparisonChart,
} from '../utils/financial-planning-charts.js';
import {
  COLORS,
  SPACING,
  BREAKPOINTS,
  TIMING,
  STORAGE_KEYS,
} from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';

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

  // Small helper to show a short usage note under section headers
  function createUsageNote(text) {
    const note = document.createElement('div');
    note.className = 'section-usage-note';
    note.style.fontSize = '0.95rem';
    note.style.color = COLORS.TEXT_MUTED;
    note.style.marginBottom = SPACING.MD;
    note.style.lineHeight = '1.4';
    note.textContent = text;
    return note;
  }

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
    const title = document.createElement('h1');
    title.id = 'financial-planning-title';
    title.textContent = 'Financial Planning';
    title.style.margin = '0';
    title.style.fontSize = '2rem';
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
    syncStatus.textContent = navigator.onLine ? 'Sync: online' : 'Sync: offline';
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
    nav.style.flexShrink = '0';
    nav.style.overflowX = 'auto';
    nav.style.scrollbarWidth = 'none';
    nav.style.msOverflowStyle = 'none';

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
      tab.setAttribute('aria-selected', section.id === currentSection ? 'true' : 'false');
      tab.setAttribute('aria-controls', `${section.id}-panel`);
      tab.id = `${section.id}-tab`;
      
      tab.innerHTML = `
        <span class="tab-icon">${section.icon}</span>
        <span class="tab-label">${section.label}</span>
      `;
      
      // Tab styling
      Object.assign(tab.style, {
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.XS,
        padding: `${SPACING.SM} ${SPACING.MD}`,
        border: 'none',
        borderRadius: 'var(--radius-md)',
        background: section.id === currentSection ? COLORS.PRIMARY : COLORS.SURFACE,
        color: section.id === currentSection ? 'white' : COLORS.TEXT_MAIN,
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        minWidth: 'fit-content',
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
  function switchSection(sectionId) {
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
    renderSection(sectionId);
  }

  /**
   * Render the content for the selected section
   */
  function renderSection(sectionId) {
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
        renderInvestmentsSection();
        break;
      case 'goals':
        renderGoalsSection();
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
    const section = createSectionContainer('overview', 'Financial Overview', '📊');
    section.appendChild(createUsageNote('At-a-glance health summary: shows current balance, monthly expense averages, savings rate and emergency fund advice. Use the quick actions to jump to Forecasts, Investments, Goals or run scenarios.'));
    
    if (!planningData) {
      const placeholder = createPlaceholder(
        'Loading Financial Data',
        'Please wait while we analyze your financial information.',
        '⏳'
      );
      section.appendChild(placeholder);
      content.appendChild(section);
      return;
    }

    // Quick stats cards
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    statsGrid.style.display = 'grid';
    statsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
    statsGrid.style.gap = SPACING.MD;
    statsGrid.style.marginBottom = SPACING.XL;

    // Calculate real stats from transaction data
    const { transactions } = planningData;
    let totalIncome = 0;
    let totalExpenses = 0;
    let monthlyExpenses = 0;

    // Calculate totals and monthly averages
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const recentTransactions = transactions.filter(t => new Date(t.timestamp) >= threeMonthsAgo);

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount;
      }
    });

    // Calculate monthly expenses from recent data
    if (recentTransactions.length > 0) {
      const recentExpenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const monthsOfData = Math.max(1, (now - threeMonthsAgo) / (1000 * 60 * 60 * 24 * 30));
      monthlyExpenses = recentExpenses / monthsOfData;
    }

    const currentBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

    // Generate risk assessments
    let emergencyFundAssessment = null;
    let riskScore = null;

    try {
      // Assume emergency fund is current balance (simplified)
      emergencyFundAssessment = riskAssessor.assessEmergencyFundAdequacy(monthlyExpenses, Math.max(0, currentBalance));
      
      // Calculate overall risk score
      const riskFactors = [
        {
          category: 'Emergency Fund',
          riskLevel: emergencyFundAssessment.riskLevel,
          message: emergencyFundAssessment.message
        }
      ];
      
      riskScore = riskAssessor.calculateOverallRiskScore(riskFactors);
    } catch (error) {
      console.error('Error calculating risk assessments:', error);
    }

    const stats = [
      { 
        label: 'Current Balance', 
        value: `€${currentBalance.toFixed(2)}`, 
        color: currentBalance >= 0 ? COLORS.SUCCESS : COLORS.ERROR, 
        icon: '💰',
        subtitle: currentBalance >= 0 ? 'Positive balance' : 'Negative balance'
      },
      { 
        label: 'Monthly Expenses', 
        value: `€${monthlyExpenses.toFixed(2)}`, 
        color: COLORS.ERROR, 
        icon: '📉',
        subtitle: 'Average last 3 months'
      },
      { 
        label: 'Savings Rate', 
        value: `${savingsRate.toFixed(1)}%`, 
        color: savingsRate > 20 ? COLORS.SUCCESS : savingsRate > 10 ? COLORS.WARNING : COLORS.ERROR, 
        icon: '🎯',
        subtitle: savingsRate > 20 ? 'Excellent' : savingsRate > 10 ? 'Good' : 'Needs improvement'
      },
      { 
        label: 'Risk Level', 
        value: riskScore ? riskScore.level.charAt(0).toUpperCase() + riskScore.level.slice(1) : 'Unknown', 
        color: riskScore ? (riskScore.level === 'low' ? COLORS.SUCCESS : riskScore.level === 'moderate' ? COLORS.WARNING : COLORS.ERROR) : COLORS.TEXT_MUTED, 
        icon: riskScore ? (riskScore.level === 'low' ? '✅' : riskScore.level === 'moderate' ? '⚠️' : '🚨') : '❓',
        subtitle: riskScore ? riskScore.message : 'Calculating...'
      },
    ];

    stats.forEach(stat => {
      const card = createStatsCard(stat);
      statsGrid.appendChild(card);
    });

    section.appendChild(statsGrid);

    // Emergency Fund Status (if available)
    if (emergencyFundAssessment && emergencyFundAssessment.status !== 'error') {
      const emergencyFundCard = createEmergencyFundCard(emergencyFundAssessment);
      section.appendChild(emergencyFundCard);
    }

    // Quick actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'quick-actions';
    actionsContainer.style.display = 'flex';
    actionsContainer.style.gap = SPACING.MD;
    actionsContainer.style.flexWrap = 'wrap';
    actionsContainer.style.marginTop = SPACING.XL;

    const actions = [
      { label: 'View Forecasts', icon: '🔮', action: () => switchSection('forecasts') },
      { label: 'Add Investment', icon: '💰', action: () => switchSection('investments') },
      { label: 'Set Goal', icon: '🎯', action: () => switchSection('goals') },
      { label: 'Run Scenario', icon: '🔄', action: () => switchSection('scenarios') },
    ];

    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = 'action-button';
      button.innerHTML = `${action.icon} ${action.label}`;
      button.style.padding = `${SPACING.MD} ${SPACING.LG}`;
      button.style.border = `1px solid ${COLORS.BORDER}`;
      button.style.borderRadius = 'var(--radius-md)';
      button.style.background = COLORS.SURFACE;
      button.style.color = COLORS.TEXT_MAIN;
      button.style.cursor = 'pointer';
      button.style.fontSize = '0.875rem';
      button.style.fontWeight = '500';
      button.style.transition = 'all 0.2s ease';
      
      button.addEventListener('click', action.action);
      button.addEventListener('mouseenter', () => {
        button.style.background = COLORS.SURFACE_HOVER;
        button.style.borderColor = COLORS.PRIMARY;
      });
      button.addEventListener('mouseleave', () => {
        button.style.background = COLORS.SURFACE;
        button.style.borderColor = COLORS.BORDER;
      });

      actionsContainer.appendChild(button);
    });

    section.appendChild(actionsContainer);
    content.appendChild(section);
  }

  /**
   * Render Forecasts section - Income/expense predictions
   */
  function renderForecastsSection() {
    const section = createSectionContainer('forecasts', 'Financial Forecasts', '🔮');
    section.appendChild(createUsageNote('Forecasts use your past 3+ months of transactions to predict income and expenses. Adjust assumptions in the scenario tab to see how changes affect future balances.'));
    
    if (!planningData || !planningData.transactions || planningData.transactions.length < 3) {
      const placeholder = createPlaceholder(
        'Insufficient Data for Forecasting',
        'Add at least 3 months of transaction history to generate accurate financial forecasts.',
        '📊'
      );
      section.appendChild(placeholder);
      content.appendChild(section);
      return;
    }

    try {
      // Generate forecasts
      const incomeForecasts = forecastEngine.generateIncomeForecasts(planningData.transactions, 6);
      const expenseForecasts = forecastEngine.generateExpenseForecasts(planningData.transactions, 6);

      // Create forecast summary cards
      const summaryGrid = document.createElement('div');
      summaryGrid.className = 'forecast-summary-grid';
      summaryGrid.style.display = 'grid';
      summaryGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
      summaryGrid.style.gap = SPACING.MD;
      summaryGrid.style.marginBottom = SPACING.XL;

      // Calculate totals for next 6 months
      const totalIncomeForecasted = incomeForecasts.reduce((sum, f) => sum + f.predictedAmount, 0);
      const totalExpensesForecasted = expenseForecasts.reduce((sum, f) => sum + f.predictedAmount, 0);
      const netForecast = totalIncomeForecasted - totalExpensesForecasted;
      const avgConfidence = (incomeForecasts.reduce((sum, f) => sum + f.confidence, 0) + 
                           expenseForecasts.reduce((sum, f) => sum + f.confidence, 0)) / 
                           (incomeForecasts.length + expenseForecasts.length);

      const summaryCards = [
        { 
          label: 'Forecasted Income (6mo)', 
          value: `€${totalIncomeForecasted.toFixed(2)}`, 
          color: COLORS.SUCCESS, 
          icon: '📈',
          subtitle: `Avg: €${(totalIncomeForecasted / 6).toFixed(2)}/month`
        },
        { 
          label: 'Forecasted Expenses (6mo)', 
          value: `€${totalExpensesForecasted.toFixed(2)}`, 
          color: COLORS.ERROR, 
          icon: '📉',
          subtitle: `Avg: €${(totalExpensesForecasted / 6).toFixed(2)}/month`
        },
        { 
          label: 'Net Forecast (6mo)', 
          value: `€${netForecast.toFixed(2)}`, 
          color: netForecast >= 0 ? COLORS.SUCCESS : COLORS.ERROR, 
          icon: netForecast >= 0 ? '💰' : '⚠️',
          subtitle: `Avg: €${(netForecast / 6).toFixed(2)}/month`
        },
        { 
          label: 'Forecast Confidence', 
          value: `${(avgConfidence * 100).toFixed(0)}%`, 
          color: avgConfidence > 0.7 ? COLORS.SUCCESS : avgConfidence > 0.4 ? COLORS.WARNING : COLORS.ERROR, 
          icon: '🎯',
          subtitle: avgConfidence > 0.7 ? 'High confidence' : avgConfidence > 0.4 ? 'Moderate confidence' : 'Low confidence'
        },
      ];

      summaryCards.forEach(card => {
        const cardElement = createForecastCard(card);
        summaryGrid.appendChild(cardElement);
      });

      section.appendChild(summaryGrid);

      // Create forecast comparison chart
      createForecastComparisonChart(chartRenderer, incomeForecasts, expenseForecasts)
        .then(({ section: chartSection, chart }) => {
          section.appendChild(chartSection);
          activeCharts.set('forecast-comparison', chart);
        })
        .catch(error => {
          console.error('Error creating forecast comparison chart:', error);
        });

      // Generate balance projections
      const currentBalance = planningData.transactions
        .reduce((balance, t) => balance + (t.type === 'income' ? t.amount : -t.amount), 0);
      
      const balanceProjections = balancePredictor.projectBalances(
        currentBalance, 
        incomeForecasts, 
        expenseForecasts, 
        6
      );

      // Create projected balance chart
      createProjectedBalanceChart(chartRenderer, balanceProjections)
        .then(({ section: chartSection, chart }) => {
          section.appendChild(chartSection);
          activeCharts.set('projected-balance', chart);
        })
        .catch(error => {
          console.error('Error creating projected balance chart:', error);
        });

      // Create detailed forecast table
      const forecastTable = createForecastTable(incomeForecasts, expenseForecasts);
      section.appendChild(forecastTable);

    } catch (error) {
      console.error('Error rendering forecasts:', error);
      const errorPlaceholder = createPlaceholder(
        'Error Generating Forecasts',
        'There was an error processing your transaction data. Please try refreshing the page.',
        '⚠️'
      );
      section.appendChild(errorPlaceholder);
    }
    
    content.appendChild(section);
  }

  /**
   * Render Investments section - Portfolio tracking
   */
  function renderInvestmentsSection() {
    const section = createSectionContainer('investments', 'Investment Portfolio', '💰');
    section.appendChild(createUsageNote('Track manual investments here. Add holdings with symbol, shares, and purchase price. Edits sync to cloud; deletions remove from cloud. Charts update automatically.'));
    
    // For now, create sample portfolio data since investment tracking isn't fully implemented
    const samplePortfolioData = {
      totalValue: 25000,
      assetAllocation: {
        stocks: 15000,
        bonds: 5000,
        etfs: 3000,
        cash: 2000,
      },
    };

    // Try to load real portfolio summary from StorageService
    let portfolioData;
    try {
      portfolioData = StorageService.calculatePortfolioSummary();
    } catch (err) {
      console.warn('Error fetching portfolio summary from StorageService:', err);
      portfolioData = null;
    }

    const useMockPortfolio = !portfolioData || !portfolioData.totalValue;
    const portfolioToRender = useMockPortfolio ? samplePortfolioData : portfolioData;

    // Create portfolio composition chart
    createPortfolioCompositionChart(chartRenderer, portfolioToRender)
      .then(({ section: chartSection, chart }) => {
        section.appendChild(chartSection);
        activeCharts.set('portfolio-composition', chart);
      })
      .catch(error => {
        console.error('Error creating portfolio composition chart:', error);
      });

    // Add simple add-investment UI and placeholder when no real portfolio data
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = SPACING.SM;
    controls.style.alignItems = 'center';
    controls.style.marginTop = SPACING.MD;

    const addInvBtn = document.createElement('button');
    addInvBtn.textContent = 'Add Investment';
    addInvBtn.className = 'btn btn-secondary';

    const invForm = document.createElement('div');
    invForm.style.display = 'none';
    invForm.style.gap = SPACING.SM;
    invForm.style.marginTop = SPACING.SM;

    const symInput = document.createElement('input');
    symInput.placeholder = 'Symbol (e.g. AAPL)';
    symInput.required = true;
    symInput.setAttribute('aria-label', 'Investment symbol');
    const symError = document.createElement('div');
    symError.style.color = COLORS.ERROR;
    symError.style.fontSize = '0.85rem';
    symError.style.display = 'none';
    const sharesInput = document.createElement('input');
    sharesInput.type = 'number';
    sharesInput.placeholder = 'Shares';
    sharesInput.required = true;
    sharesInput.setAttribute('aria-label', 'Shares');
    const sharesError = document.createElement('div');
    sharesError.style.color = COLORS.ERROR;
    sharesError.style.fontSize = '0.85rem';
    sharesError.style.display = 'none';
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.placeholder = 'Purchase Price';
    priceInput.required = true;
    priceInput.setAttribute('aria-label', 'Purchase Price');
    const priceError = document.createElement('div');
    priceError.style.color = COLORS.ERROR;
    priceError.style.fontSize = '0.85rem';
    priceError.style.display = 'none';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';

    const saveInvBtn = document.createElement('button');
    saveInvBtn.textContent = 'Save';
    saveInvBtn.className = 'btn btn-primary';
    saveInvBtn.disabled = true;

    invForm.appendChild(symInput);
    invForm.appendChild(symError);
    invForm.appendChild(sharesInput);
    invForm.appendChild(sharesError);
    invForm.appendChild(priceInput);
    invForm.appendChild(priceError);
    invForm.appendChild(dateInput);
    invForm.appendChild(saveInvBtn);

    addInvBtn.addEventListener('click', () => {
      invForm.style.display = invForm.style.display === 'none' ? 'flex' : 'none';
      invForm.style.flexWrap = 'wrap';
    });

    saveInvBtn.addEventListener('click', () => {
      const symbol = symInput.value.trim();
      const shares = Number(sharesInput.value) || 0;
      const purchasePrice = Number(priceInput.value) || 0;
      const purchaseDate = dateInput.value ? new Date(dateInput.value) : new Date();

      // Basic validation
      let valid = true;
      if (!symbol) { symError.textContent = 'Symbol is required.'; symError.style.display = 'block'; valid = false; } else { symError.style.display = 'none'; }
      if (!(shares > 0)) { sharesError.textContent = 'Shares must be greater than 0.'; sharesError.style.display = 'block'; valid = false; } else { sharesError.style.display = 'none'; }
      if (!(purchasePrice >= 0)) { priceError.textContent = 'Price must be 0 or greater.'; priceError.style.display = 'block'; valid = false; } else { priceError.style.display = 'none'; }
      if (!valid) return;

      try {
        StorageService.addInvestment(symbol, shares, purchasePrice, purchaseDate, {});
        // Refresh portfolio chart
        const updated = StorageService.calculatePortfolioSummary();
        createPortfolioCompositionChart(chartRenderer, updated)
          .then(({ section: chartSection, chart }) => {
            // Replace existing chart section
            const existing = section.querySelector('[data-chart-type="portfolio-composition"]');
            if (existing) existing.replaceWith(chartSection);
            activeCharts.set('portfolio-composition', chart);
          })
          .catch(err => console.error('Error refreshing portfolio chart:', err));

        invForm.style.display = 'none';
        symInput.value = '';
        sharesInput.value = '';
        priceInput.value = '';
        dateInput.value = '';
      } catch (err) {
        console.error('Failed to save investment', err);
      }
    });

    // Enable Save only when basic fields are valid
    function validateInvForm() {
      const symbol = symInput.value.trim();
      const shares = Number(sharesInput.value) || 0;
      const price = Number(priceInput.value) || -1;
      saveInvBtn.disabled = !(symbol && shares > 0 && price >= 0);
    }

    symInput.addEventListener('input', validateInvForm);
    sharesInput.addEventListener('input', validateInvForm);
    priceInput.addEventListener('input', validateInvForm);

    controls.appendChild(addInvBtn);
    controls.appendChild(invForm);
    section.appendChild(controls);
    
    // Investments list (editable)
    const investmentsList = document.createElement('div');
    investmentsList.className = 'investments-list';
    investmentsList.style.marginTop = SPACING.MD;
    section.appendChild(investmentsList);

    function refreshInvestmentsList() {
      investmentsList.innerHTML = '';
      let items = [];
      try {
        items = StorageService.getInvestments() || [];
      } catch (err) {
        console.warn('Error loading investments for list:', err);
        items = [];
      }

      if (!items.length) {
        const empty = document.createElement('div');
        empty.textContent = 'No investments yet.';
        empty.style.color = COLORS.TEXT_MUTED;
        investmentsList.appendChild(empty);
        return;
      }

      const ul = document.createElement('ul');
      ul.style.listStyle = 'none';
      ul.style.padding = '0';
      ul.style.margin = '0';
      ul.style.display = 'grid';
      ul.style.gap = SPACING.SM;

      items.forEach(inv => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.flexDirection = 'column';

        const title = document.createElement('div');
        title.textContent = `${inv.symbol} · ${inv.name}`;
        title.style.fontWeight = '600';

        const meta = document.createElement('div');
        meta.style.fontSize = '0.9rem';
        meta.style.color = COLORS.TEXT_MUTED;
        meta.textContent = `${inv.shares} shares @ ${new Intl.NumberFormat('en-US', {style:'currency',currency:'EUR'}).format(inv.currentPrice)}`;

        left.appendChild(title);
        left.appendChild(meta);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = SPACING.SM;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn btn-secondary';

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'btn btn-ghost';

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(left);
        li.appendChild(actions);

        ul.appendChild(li);

        // Edit handler - toggle inline edit
        editBtn.addEventListener('click', () => {
          if (li._editing) return;
          li._editing = true;
          const form = document.createElement('div');
          form.style.display = 'flex';
          form.style.gap = SPACING.SM;
          form.style.flexWrap = 'wrap';
          form.style.alignItems = 'center';
          form.style.maxWidth = '100%';
          form.style.boxSizing = 'border-box';

          const sharesFld = document.createElement('input');
          sharesFld.type = 'number';
          sharesFld.value = inv.shares;
          sharesFld.style.width = '80px';

          const priceFld = document.createElement('input');
          priceFld.type = 'number';
          priceFld.value = inv.purchasePrice || inv.currentPrice || 0;
          priceFld.style.width = '120px';

          const saveBtn = document.createElement('button');
          saveBtn.textContent = 'Save';
          saveBtn.className = 'btn btn-primary';

          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.className = 'btn btn-ghost';

          form.appendChild(sharesFld);
          form.appendChild(priceFld);
          form.appendChild(saveBtn);
          form.appendChild(cancelBtn);

          li.appendChild(form);

          cancelBtn.addEventListener('click', () => {
            li._editing = false;
            form.remove();
          });

          saveBtn.addEventListener('click', () => {
            const newShares = Number(sharesFld.value) || 0;
            const newPrice = Number(priceFld.value) || 0;
            try {
              StorageService.updateInvestment(inv.id, { shares: newShares, purchasePrice: newPrice, currentPrice: newPrice });
              // refresh chart and list
              const updated = StorageService.calculatePortfolioSummary();
              createPortfolioCompositionChart(chartRenderer, updated)
                .then(({ section: chartSection, chart }) => {
                  const existing = section.querySelector('[data-chart-type="portfolio-composition"]');
                  if (existing) existing.replaceWith(chartSection);
                  activeCharts.set('portfolio-composition', chart);
                })
                .catch(err => console.error('Error refreshing portfolio chart:', err));

              li._editing = false;
              refreshInvestmentsList();
            } catch (err) {
              console.error('Failed to update investment', err);
            }
          });
        });

        delBtn.addEventListener('click', () => {
          try {
            StorageService.removeInvestment(inv.symbol);
            // refresh chart
            const updated = StorageService.calculatePortfolioSummary();
            createPortfolioCompositionChart(chartRenderer, updated)
              .then(({ section: chartSection, chart }) => {
                const existing = section.querySelector('[data-chart-type="portfolio-composition"]');
                if (existing) existing.replaceWith(chartSection);
                activeCharts.set('portfolio-composition', chart);
              })
              .catch(err => console.error('Error refreshing portfolio chart:', err));

            refreshInvestmentsList();
          } catch (err) {
            console.error('Failed to remove investment', err);
          }
        });
      });

      investmentsList.appendChild(ul);
    }

    // Initial population
    refreshInvestmentsList();

    if (useMockPortfolio) {
      const placeholder = createPlaceholder(
        'Investment Tracker Coming Soon',
        'Full investment tracking with real-time data integration and performance monitoring is coming soon.',
        '💰'
      );
      section.appendChild(placeholder);
    }
    content.appendChild(section);
  }

  /**
   * Render Goals section - Long-term planning
   */
  function renderGoalsSection() {
    const section = createSectionContainer('goals', 'Financial Goals', '🎯');
    section.appendChild(createUsageNote('Create and track goals (target amount, date, current savings). The planner calculates required monthly savings and progress. Use scenarios to model different savings rates.'));
    
    // Try to load goals from StorageService; fallback to sample goals
    let goalsFromStorage = [];
    try {
      goalsFromStorage = StorageService.getGoals() || [];
    } catch (err) {
      console.warn('Error fetching goals from StorageService:', err);
      goalsFromStorage = [];
    }

    const sampleGoals = [
      {
        id: '1',
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentSavings: 7500,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
      {
        id: '2',
        name: 'House Down Payment',
        targetAmount: 50000,
        currentSavings: 15000,
        targetDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years from now
      },
      {
        id: '3',
        name: 'Vacation Fund',
        targetAmount: 5000,
        currentSavings: 2000,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      },
    ];

    const hasRealGoals = Array.isArray(goalsFromStorage) && goalsFromStorage.length > 0;
    const goalsToRender = hasRealGoals ? goalsFromStorage : sampleGoals;

    // Create goal progress chart
    createGoalProgressChart(chartRenderer, goalsToRender)
      .then(({ section: chartSection, chart }) => {
        section.appendChild(chartSection);
        activeCharts.set('goal-progress', chart);
      })
      .catch(error => {
        console.error('Error creating goal progress chart:', error);
      });

    // Add simple add-goal UI so users can create goals
    const goalControls = document.createElement('div');
    goalControls.style.display = 'flex';
    goalControls.style.gap = SPACING.SM;
    goalControls.style.alignItems = 'center';
    goalControls.style.marginTop = SPACING.MD;

    const addGoalBtn = document.createElement('button');
    addGoalBtn.textContent = 'Add Goal';
    addGoalBtn.className = 'btn btn-secondary';

    const goalForm = document.createElement('div');
    goalForm.style.display = 'none';
    goalForm.style.gap = SPACING.SM;
    goalForm.style.marginTop = SPACING.SM;

    const goalName = document.createElement('input');
    goalName.placeholder = 'Goal name';
    const goalTarget = document.createElement('input');
    goalTarget.type = 'number';
    goalTarget.placeholder = 'Target amount';
    const goalDate = document.createElement('input');
    goalDate.type = 'date';
    const goalCurrent = document.createElement('input');
    goalCurrent.type = 'number';
    goalCurrent.placeholder = 'Current savings';

    const saveGoalBtn = document.createElement('button');
    saveGoalBtn.textContent = 'Save Goal';
    saveGoalBtn.className = 'btn btn-primary';

    goalForm.appendChild(goalName);
    goalForm.appendChild(goalTarget);
    goalForm.appendChild(goalDate);
    goalForm.appendChild(goalCurrent);
    goalForm.appendChild(saveGoalBtn);

    addGoalBtn.addEventListener('click', () => {
      goalForm.style.display = goalForm.style.display === 'none' ? 'flex' : 'none';
      goalForm.style.flexWrap = 'wrap';
    });

    saveGoalBtn.addEventListener('click', () => {
      const name = goalName.value.trim();
      const target = Number(goalTarget.value) || 0;
      const tdate = goalDate.value ? new Date(goalDate.value) : null;
      const current = Number(goalCurrent.value) || 0;

      // Basic validation
      let valid = true;
      if (!name) { alert('Goal name is required.'); valid = false; }
      if (!(target > 0)) { alert('Target amount must be greater than 0.'); valid = false; }
      if (!tdate || isNaN(tdate.getTime())) { alert('Please choose a valid target date.'); valid = false; }
      if (!valid) return;

      try {
        StorageService.createGoal(name, target, tdate, current, {});
        // Refresh goals chart
        const updatedGoals = StorageService.getGoals();
        createGoalProgressChart(chartRenderer, updatedGoals)
          .then(({ section: chartSection, chart }) => {
            const existing = section.querySelector('[data-chart-type="goal-progress"]');
            if (existing) existing.replaceWith(chartSection);
            activeCharts.set('goal-progress', chart);
          })
          .catch(err => console.error('Error refreshing goals chart:', err));

        goalForm.style.display = 'none';
        goalName.value = '';
        goalTarget.value = '';
        goalDate.value = '';
        goalCurrent.value = '';
      } catch (err) {
        console.error('Failed to save goal', err);
      }
    });

    goalControls.appendChild(addGoalBtn);
    goalControls.appendChild(goalForm);
    section.appendChild(goalControls);
    // Goals list (editable)
    const goalsList = document.createElement('div');
    goalsList.className = 'goals-list';
    goalsList.style.marginTop = SPACING.MD;
    section.appendChild(goalsList);

    function refreshGoalsList() {
      goalsList.innerHTML = '';
      let items = [];
      try {
        items = StorageService.getGoals() || [];
      } catch (err) {
        console.warn('Error loading goals for list:', err);
        items = [];
      }

      if (!items.length) {
        const empty = document.createElement('div');
        empty.textContent = 'No goals yet.';
        empty.style.color = COLORS.TEXT_MUTED;
        goalsList.appendChild(empty);
        return;
      }

      const ul = document.createElement('ul');
      ul.style.listStyle = 'none';
      ul.style.padding = '0';
      ul.style.margin = '0';
      ul.style.display = 'grid';
      ul.style.gap = SPACING.SM;

      items.forEach(goal => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.flexDirection = 'column';

        const title = document.createElement('div');
        title.textContent = `${goal.name}`;
        title.style.fontWeight = '600';

        const meta = document.createElement('div');
        meta.style.fontSize = '0.9rem';
        meta.style.color = COLORS.TEXT_MUTED;
        meta.textContent = `${new Intl.NumberFormat('en-US', {style:'currency',currency:'EUR'}).format(goal.currentSavings)} of ${new Intl.NumberFormat('en-US', {style:'currency',currency:'EUR'}).format(goal.targetAmount)} by ${new Date(goal.targetDate).toLocaleDateString()}`;

        left.appendChild(title);
        left.appendChild(meta);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = SPACING.SM;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn btn-secondary';

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'btn btn-ghost';

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(left);
        li.appendChild(actions);

        ul.appendChild(li);

        editBtn.addEventListener('click', () => {
          if (li._editing) return;
          li._editing = true;
          const form = document.createElement('div');
          form.style.display = 'flex';
          form.style.gap = SPACING.SM;

          const nameFld = document.createElement('input');
          nameFld.value = goal.name;
          nameFld.style.minWidth = '160px';
          nameFld.style.flex = '1 1 160px';
          const targetFld = document.createElement('input');
          targetFld.type = 'number';
          targetFld.value = goal.targetAmount;
          targetFld.style.flex = '0 0 120px';
          targetFld.style.minWidth = '100px';
          const dateFld = document.createElement('input');
          dateFld.type = 'date';
          dateFld.style.flex = '0 0 160px';
          dateFld.style.minWidth = '140px';
          // Safely parse targetDate; if invalid or missing, leave empty to avoid RangeError
          let isoDate = '';
          if (goal && goal.targetDate) {
            const d = new Date(goal.targetDate);
            if (!isNaN(d.getTime())) {
              isoDate = d.toISOString().slice(0, 10);
            }
          }
          dateFld.value = isoDate;
          const currentFld = document.createElement('input');
          currentFld.type = 'number';
          currentFld.value = goal.currentSavings;
          currentFld.style.flex = '0 0 120px';
          currentFld.style.minWidth = '100px';

          const saveBtn = document.createElement('button');
          saveBtn.textContent = 'Save';
          saveBtn.className = 'btn btn-primary';

          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.className = 'btn btn-ghost';

          form.appendChild(nameFld);
          form.appendChild(targetFld);
          form.appendChild(dateFld);
          form.appendChild(currentFld);
          form.appendChild(saveBtn);
          form.appendChild(cancelBtn);

          li.appendChild(form);

          cancelBtn.addEventListener('click', () => {
            li._editing = false;
            form.remove();
          });

          saveBtn.addEventListener('click', () => {
            try {
              const updates = {
                name: nameFld.value.trim(),
                targetAmount: Number(targetFld.value) || 0,
                targetDate: dateFld.value ? new Date(dateFld.value) : new Date(goal.targetDate),
                currentSavings: Number(currentFld.value) || 0
              };
              StorageService.updateGoal(goal.id, updates);
              // refresh chart
              const updatedGoals = StorageService.getGoals();
              createGoalProgressChart(chartRenderer, updatedGoals)
                .then(({ section: chartSection, chart }) => {
                  const existing = section.querySelector('[data-chart-type="goal-progress"]');
                  if (existing) existing.replaceWith(chartSection);
                  activeCharts.set('goal-progress', chart);
                })
                .catch(err => console.error('Error refreshing goals chart:', err));

              li._editing = false;
              refreshGoalsList();
            } catch (err) {
              console.error('Failed to update goal', err);
            }
          });
        });

        delBtn.addEventListener('click', () => {
          try {
            StorageService.deleteGoal(goal.id);
            const updatedGoals = StorageService.getGoals();
            createGoalProgressChart(chartRenderer, updatedGoals)
              .then(({ section: chartSection, chart }) => {
                const existing = section.querySelector('[data-chart-type="goal-progress"]');
                if (existing) existing.replaceWith(chartSection);
                activeCharts.set('goal-progress', chart);
              })
              .catch(err => console.error('Error refreshing goals chart:', err));

            refreshGoalsList();
          } catch (err) {
            console.error('Failed to delete goal', err);
          }
        });
      });

      goalsList.appendChild(ul);
    }

    refreshGoalsList();

    // Ensure ConflictDialog is present to handle any sync conflicts
    import('../components/ConflictDialog.js')
      .then(mod => {
        try {
          if (mod && typeof mod.ConflictDialog === 'function') {
            mod.ConflictDialog();
          }
        } catch (err) {
          console.warn('ConflictDialog init failed:', err);
        }
      })
      .catch(e => {
        // dynamic import may fail in older environments; ignore
        console.warn('ConflictDialog not available:', e);
      });

    // Add placeholder only when goals are not managed yet
    if (!hasRealGoals) {
      const placeholder = createPlaceholder(
        'Goal Planner Coming Soon',
        'Full goal planning with custom targets, automatic progress tracking, and wealth projections is coming soon.',
        '🎯'
      );
      section.appendChild(placeholder);
    }
    content.appendChild(section);
  }

  /**
   * Render Insights section - Advanced analytics
   */
  function renderInsightsSection() {
    const section = createSectionContainer('insights', 'Financial Insights', '💡');
    section.appendChild(createUsageNote('Insights highlight Top Movers and timeline comparisons. Use these to find categories driving changes and drill into transactions for details.'));

    if (!planningData || !planningData.transactions || planningData.transactions.length === 0) {
      const placeholder = createPlaceholder(
        'Advanced Insights Coming Soon',
        'Discover spending patterns, top movers analysis, and timeline comparisons.',
        '💡'
      );
      section.appendChild(placeholder);
      content.appendChild(section);
      return;
    }

    const transactions = planningData.transactions;

    // Top Movers (by absolute spend/amount per category)
    const topMovers = InsightsGenerator.topMovers(transactions, 6);

    const topContainer = document.createElement('div');
    topContainer.className = 'insights-top-movers';
    topContainer.style.display = 'flex';
    topContainer.style.flexDirection = 'column';
    topContainer.style.gap = SPACING.MD;

    const topTitle = document.createElement('h3');
    topTitle.textContent = 'Top Movers';
    topTitle.style.margin = '0';
    topTitle.style.fontSize = '1rem';
    topTitle.style.fontWeight = '600';
    topContainer.appendChild(topTitle);

    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.margin = '0';
    list.style.display = 'grid';
    list.style.gridTemplateColumns = '1fr auto';
    list.style.gap = SPACING.SM;

    const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' });

    topMovers.forEach(item => {
      const liLabel = document.createElement('li');
      liLabel.textContent = item.category;
      liLabel.style.fontWeight = '600';
      liLabel.style.color = COLORS.TEXT_MAIN;

      const liValue = document.createElement('li');
      liValue.textContent = currency.format(Math.abs(item.total));
      liValue.style.textAlign = 'right';
      liValue.style.color = COLORS.TEXT_MUTED;

      list.appendChild(liLabel);
      list.appendChild(liValue);
    });

    topContainer.appendChild(list);

    // Chart for Top Movers
    const topChartDiv = document.createElement('div');
    topChartDiv.style.marginTop = SPACING.MD;
    topChartDiv.style.position = 'relative';
    topChartDiv.style.height = '220px';
    const topCanvas = document.createElement('canvas');
    topCanvas.id = `insights-top-movers-${Date.now()}`;
    topCanvas.style.width = '100%';
    topCanvas.style.maxHeight = '100%';
    topChartDiv.appendChild(topCanvas);
    topContainer.appendChild(topChartDiv);

    section.appendChild(topContainer);

    // Render bar chart for top movers
    const topLabels = topMovers.map(t => t.category);
    const topData = topMovers.map(t => Math.abs(t.total));

    chartRenderer.createBarChart(topCanvas, {
      labels: topLabels,
      datasets: [{ label: 'Amount', data: topData }]
    }, { title: 'Top Movers' })
      .then(chart => { if (chart) activeCharts.set('insights-top-movers', chart); })
      .catch(err => console.error('Top movers chart error', err));

    // Timeline comparison: monthly expenses this period vs previous period
    const monthsBack = 6;
    const now = new Date();
    const monthKeys = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    function sumForMonth(key, txs) {
      const [y, m] = key.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      return txs.reduce((sum, t) => {
        const ts = new Date(t.timestamp);
        if (ts >= start && ts < end && t.type === 'expense') {
          return sum + (typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0);
        }
        return sum;
      }, 0);
    }

    const currentSeries = monthKeys.map(k => ({ period: k, value: sumForMonth(k, transactions) }));
    const previousSeries = monthKeys.map(k => {
      const [y, m] = k.split('-').map(Number);
      const prevKey = `${y - 1}-${String(m).padStart(2, '0')}`;
      return { period: prevKey, value: sumForMonth(prevKey, transactions) };
    });

    const timelineLabels = monthKeys.map(k => {
      const [y, m] = k.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const currentData = currentSeries.map(s => s.value);
    const previousData = previousSeries.map(s => s.value);

    const timelineDiv = document.createElement('div');
    timelineDiv.style.marginTop = SPACING.LG;
    const timelineTitle = document.createElement('h3');
    timelineTitle.textContent = 'Monthly Expenses: This Period vs Previous Year';
    timelineTitle.style.margin = '0';
    timelineTitle.style.fontSize = '1rem';
    timelineTitle.style.fontWeight = '600';
    timelineDiv.appendChild(timelineTitle);

    const timelineChartWrapper = document.createElement('div');
    timelineChartWrapper.style.position = 'relative';
    timelineChartWrapper.style.height = '300px';
    const timelineCanvas = document.createElement('canvas');
    timelineCanvas.id = `insights-timeline-${Date.now()}`;
    timelineCanvas.style.width = '100%';
    timelineCanvas.style.maxHeight = '100%';
    timelineChartWrapper.appendChild(timelineCanvas);
    timelineDiv.appendChild(timelineChartWrapper);

    section.appendChild(timelineDiv);

    chartRenderer.createLineChart(timelineCanvas, {
      labels: timelineLabels,
      datasets: [
        { label: 'This Period', data: currentData },
        { label: 'Previous Year', data: previousData }
      ]
    }, { title: 'Expenses Timeline' })
      .then(chart => { if (chart) activeCharts.set('insights-timeline', chart); })
      .catch(err => console.error('Timeline chart error', err));

    content.appendChild(section);
  }

  /**
   * Render Scenarios section - What-if modeling
   */
  function renderScenariosSection() {
    const section = createSectionContainer('scenarios', 'Scenario Planning', '🔄');
    section.appendChild(createUsageNote('Run what-if scenarios by adjusting savings, income or expenses. Compare scenarios side-by-side to see impact on goals and projected balances.'));
    
    const form = document.createElement('div');
    form.className = 'scenario-form';
    form.style.display = 'grid';
    form.style.gridTemplateColumns = '1fr 1fr';
    form.style.gap = SPACING.MD;

    const monthlyLabel = document.createElement('label');
    monthlyLabel.textContent = 'Monthly Savings (€)';
    const monthlyInput = document.createElement('input');
    monthlyInput.type = 'number';
    monthlyInput.value = '200';
    monthlyInput.style.padding = SPACING.SM;

    const returnLabel = document.createElement('label');
    returnLabel.textContent = 'Annual Return (%)';
    const returnInput = document.createElement('input');
    returnInput.type = 'number';
    returnInput.value = '5';
    returnInput.style.padding = SPACING.SM;

    const yearsLabel = document.createElement('label');
    yearsLabel.textContent = 'Years';
    const yearsInput = document.createElement('input');
    yearsInput.type = 'number';
    yearsInput.value = '10';
    yearsInput.style.padding = SPACING.SM;

    const initialLabel = document.createElement('label');
    initialLabel.textContent = 'Initial Amount (€)';
    const initialInput = document.createElement('input');
    initialInput.type = 'number';
    initialInput.value = '1000';
    initialInput.style.padding = SPACING.SM;

    const runBtn = document.createElement('button');
    runBtn.textContent = 'Run Scenario';
    runBtn.className = 'btn btn-primary';
    runBtn.style.gridColumn = '1 / -1';
    runBtn.style.padding = `${SPACING.SM} ${SPACING.MD}`;

    form.appendChild(monthlyLabel);
    form.appendChild(monthlyInput);
    form.appendChild(returnLabel);
    form.appendChild(returnInput);
    form.appendChild(yearsLabel);
    form.appendChild(yearsInput);
    form.appendChild(initialLabel);
    form.appendChild(initialInput);
    form.appendChild(runBtn);

    section.appendChild(form);

    const outputContainer = document.createElement('div');
    outputContainer.className = 'scenario-output';
    outputContainer.style.marginTop = SPACING.LG;
    section.appendChild(outputContainer);

    runBtn.addEventListener('click', () => {
      const monthly = Number(monthlyInput.value) || 0;
      const yearlyReturn = (Number(returnInput.value) || 0) / 100;
      const years = Math.max(1, Number(yearsInput.value) || 1);
      const initial = Number(initialInput.value) || 0;

      // Use GoalPlanner projection utility to generate yearly projections
      const projections = goalPlanner.projectWealthAccumulation(monthly, yearlyReturn, years, initial);

      // Convert to series for chart helper
      const series = projections.map(p => ({ period: `Year ${p.year}`, value: p.projectedWealth }));

      // Cleanup previous scenario chart
      if (activeCharts.has('scenario-chart')) {
        const existing = activeCharts.get('scenario-chart');
        if (existing && typeof existing.destroy === 'function') existing.destroy();
        activeCharts.delete('scenario-chart');
      }

      createProjectedBalanceChart(chartRenderer, series)
        .then(({ section: chartSection, chart }) => {
          // Replace output
          outputContainer.innerHTML = '';
          outputContainer.appendChild(chartSection);
          if (chart) activeCharts.set('scenario-chart', chart);
        })
        .catch(err => console.error('Scenario chart error', err));
    });

    
    
    
    
    
    
    
    content.appendChild(section);
  }

  /**
   * Create a section container with header
   */
  function createSectionContainer(id, title, icon) {
    const section = document.createElement('section');
    section.className = `financial-planning-section ${id}-section`;
    section.style.display = 'flex';
    section.style.flexDirection = 'column';
    section.style.gap = SPACING.LG;

    const header = document.createElement('div');
    header.className = 'section-header';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = SPACING.MD;
    header.style.marginBottom = SPACING.MD;

    const headerTitle = document.createElement('h2');
    headerTitle.textContent = `${icon} ${title}`;
    headerTitle.style.margin = '0';
    headerTitle.style.fontSize = '1.5rem';
    headerTitle.style.fontWeight = '600';
    headerTitle.style.color = COLORS.TEXT_MAIN;

    header.appendChild(headerTitle);
    section.appendChild(header);

    return section;
  }

  /**
   * Create a stats card for the overview section
   */
  function createStatsCard({ label, value, color, icon, subtitle }) {
    const card = document.createElement('div');
    card.className = 'stats-card';
    card.style.padding = SPACING.LG;
    card.style.background = COLORS.SURFACE;
    card.style.border = `1px solid ${COLORS.BORDER}`;
    card.style.borderRadius = 'var(--radius-lg)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = SPACING.SM;

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = SPACING.SM;

    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    iconSpan.style.fontSize = '1.25rem';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.fontSize = '0.875rem';
    labelSpan.style.color = COLORS.TEXT_MUTED;
    labelSpan.style.fontWeight = '500';

    header.appendChild(iconSpan);
    header.appendChild(labelSpan);

    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    valueSpan.style.fontSize = '1.75rem';
    valueSpan.style.fontWeight = 'bold';
    valueSpan.style.color = color;

    card.appendChild(header);
    card.appendChild(valueSpan);

    if (subtitle) {
      const subtitleSpan = document.createElement('span');
      subtitleSpan.textContent = subtitle;
      subtitleSpan.style.fontSize = '0.75rem';
      subtitleSpan.style.color = COLORS.TEXT_MUTED;
      card.appendChild(subtitleSpan);
    }

    return card;
  }

  /**
   * Create emergency fund assessment card
   */
  function createEmergencyFundCard(assessment) {
    const card = document.createElement('div');
    card.className = 'emergency-fund-card';
    card.style.padding = SPACING.LG;
    card.style.background = COLORS.SURFACE;
    card.style.border = `2px solid ${assessment.riskLevel === 'low' ? COLORS.SUCCESS : assessment.riskLevel === 'moderate' ? COLORS.WARNING : COLORS.ERROR}`;
    card.style.borderRadius = 'var(--radius-lg)';
    card.style.marginBottom = SPACING.LG;

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = SPACING.MD;

    const title = document.createElement('h3');
    title.textContent = '🛡️ Emergency Fund Status';
    title.style.margin = '0';
    title.style.fontSize = '1.125rem';
    title.style.fontWeight = '600';
    title.style.color = COLORS.TEXT_MAIN;

    const status = document.createElement('span');
    status.textContent = assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1);
    status.style.padding = `${SPACING.XS} ${SPACING.SM}`;
    status.style.borderRadius = 'var(--radius-sm)';
    status.style.fontSize = '0.75rem';
    status.style.fontWeight = '600';
    status.style.background = assessment.riskLevel === 'low' ? COLORS.SUCCESS : assessment.riskLevel === 'moderate' ? COLORS.WARNING : COLORS.ERROR;
    status.style.color = 'white';

    header.appendChild(title);
    header.appendChild(status);

    const message = document.createElement('p');
    message.textContent = assessment.message;
    message.style.margin = '0';
    message.style.marginBottom = SPACING.SM;
    message.style.color = COLORS.TEXT_MAIN;
    message.style.fontSize = '0.875rem';

    const recommendation = document.createElement('p');
    recommendation.textContent = assessment.recommendation;
    recommendation.style.margin = '0';
    recommendation.style.color = COLORS.TEXT_MUTED;
    recommendation.style.fontSize = '0.875rem';
    recommendation.style.fontStyle = 'italic';

    card.appendChild(header);
    card.appendChild(message);
    card.appendChild(recommendation);

    return card;
  }

  /**
   * Create a forecast card with enhanced styling
   */
  function createForecastCard({ label, value, color, icon, subtitle }) {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.style.padding = SPACING.LG;
    card.style.background = COLORS.SURFACE;
    card.style.border = `1px solid ${COLORS.BORDER}`;
    card.style.borderRadius = 'var(--radius-lg)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = SPACING.SM;

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = SPACING.SM;

    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    iconSpan.style.fontSize = '1.25rem';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.fontSize = '0.875rem';
    labelSpan.style.color = COLORS.TEXT_MUTED;
    labelSpan.style.fontWeight = '500';

    header.appendChild(iconSpan);
    header.appendChild(labelSpan);

    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    valueSpan.style.fontSize = '1.75rem';
    valueSpan.style.fontWeight = 'bold';
    valueSpan.style.color = color;

    const subtitleSpan = document.createElement('span');
    subtitleSpan.textContent = subtitle;
    subtitleSpan.style.fontSize = '0.75rem';
    subtitleSpan.style.color = COLORS.TEXT_MUTED;

    card.appendChild(header);
    card.appendChild(valueSpan);
    card.appendChild(subtitleSpan);

    return card;
  }

  /**
   * Create a detailed forecast table
   */
  function createForecastTable(incomeForecasts, expenseForecasts) {
    const container = document.createElement('div');
    container.className = 'forecast-table-container';
    container.style.background = COLORS.SURFACE;
    container.style.border = `1px solid ${COLORS.BORDER}`;
    container.style.borderRadius = 'var(--radius-lg)';
    container.style.padding = SPACING.LG;

    const title = document.createElement('h3');
    title.textContent = 'Monthly Forecast Breakdown';
    title.style.margin = '0';
    title.style.marginBottom = SPACING.MD;
    title.style.fontSize = '1.125rem';
    title.style.fontWeight = '600';
    title.style.color = COLORS.TEXT_MAIN;

    const table = document.createElement('div');
    table.className = 'forecast-table';
    table.style.display = 'grid';
    table.style.gridTemplateColumns = '1fr auto auto auto auto';
    table.style.gap = `${SPACING.SM} ${SPACING.MD}`;
    table.style.fontSize = '0.875rem';

    // Header row
    const headers = ['Month', 'Income', 'Expenses', 'Net', 'Confidence'];
    headers.forEach(header => {
      const headerCell = document.createElement('div');
      headerCell.textContent = header;
      headerCell.style.fontWeight = '600';
      headerCell.style.color = COLORS.TEXT_MUTED;
      headerCell.style.paddingBottom = SPACING.SM;
      headerCell.style.borderBottom = `1px solid ${COLORS.BORDER}`;
      table.appendChild(headerCell);
    });

    // Data rows
    const maxRows = Math.max(incomeForecasts.length, expenseForecasts.length);
    for (let i = 0; i < maxRows; i++) {
      const income = incomeForecasts[i] || { predictedAmount: 0, confidence: 0 };
      const expense = expenseForecasts[i] || { predictedAmount: 0, confidence: 0 };
      const net = income.predictedAmount - expense.predictedAmount;
      const confidence = Math.min(income.confidence, expense.confidence);

      // Month
      const monthCell = document.createElement('div');
      monthCell.textContent = income.period ? income.period.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : `Month ${i + 1}`;
      monthCell.style.paddingTop = SPACING.SM;
      table.appendChild(monthCell);

      // Income
      const incomeCell = document.createElement('div');
      incomeCell.textContent = `€${income.predictedAmount.toFixed(2)}`;
      incomeCell.style.color = COLORS.SUCCESS;
      incomeCell.style.fontWeight = '500';
      incomeCell.style.paddingTop = SPACING.SM;
      incomeCell.style.textAlign = 'right';
      table.appendChild(incomeCell);

      // Expenses
      const expenseCell = document.createElement('div');
      expenseCell.textContent = `€${expense.predictedAmount.toFixed(2)}`;
      expenseCell.style.color = COLORS.ERROR;
      expenseCell.style.fontWeight = '500';
      expenseCell.style.paddingTop = SPACING.SM;
      expenseCell.style.textAlign = 'right';
      table.appendChild(expenseCell);

      // Net
      const netCell = document.createElement('div');
      netCell.textContent = `€${net.toFixed(2)}`;
      netCell.style.color = net >= 0 ? COLORS.SUCCESS : COLORS.ERROR;
      netCell.style.fontWeight = '600';
      netCell.style.paddingTop = SPACING.SM;
      netCell.style.textAlign = 'right';
      table.appendChild(netCell);

      // Confidence
      const confidenceCell = document.createElement('div');
      confidenceCell.textContent = `${(confidence * 100).toFixed(0)}%`;
      confidenceCell.style.color = confidence > 0.7 ? COLORS.SUCCESS : confidence > 0.4 ? COLORS.WARNING : COLORS.ERROR;
      confidenceCell.style.paddingTop = SPACING.SM;
      confidenceCell.style.textAlign = 'right';
      table.appendChild(confidenceCell);
    }

    container.appendChild(title);
    container.appendChild(table);

    return container;
  }

  /**
   * Create a placeholder for sections under development
   */
  function createPlaceholder(title, description, icon) {
    const placeholder = document.createElement('div');
    placeholder.className = 'section-placeholder';
    placeholder.style.display = 'flex';
    placeholder.style.flexDirection = 'column';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';
    placeholder.style.padding = `${SPACING.XL} ${SPACING.LG}`;
    placeholder.style.background = COLORS.SURFACE;
    placeholder.style.border = `2px dashed ${COLORS.BORDER}`;
    placeholder.style.borderRadius = 'var(--radius-lg)';
    placeholder.style.textAlign = 'center';
    placeholder.style.minHeight = '300px';

    const iconDiv = document.createElement('div');
    iconDiv.textContent = icon;
    iconDiv.style.fontSize = '3rem';
    iconDiv.style.marginBottom = SPACING.MD;

    const titleDiv = document.createElement('h3');
    titleDiv.textContent = title;
    titleDiv.style.margin = '0';
    titleDiv.style.marginBottom = SPACING.SM;
    titleDiv.style.fontSize = '1.25rem';
    titleDiv.style.fontWeight = '600';
    titleDiv.style.color = COLORS.TEXT_MAIN;

    const descDiv = document.createElement('p');
    descDiv.textContent = description;
    descDiv.style.margin = '0';
    descDiv.style.fontSize = '0.875rem';
    descDiv.style.color = COLORS.TEXT_MUTED;
    descDiv.style.maxWidth = '400px';
    descDiv.style.lineHeight = '1.5';

    placeholder.appendChild(iconDiv);
    placeholder.appendChild(titleDiv);
    placeholder.appendChild(descDiv);

    return placeholder;
  }

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
      if (investmentsCacheRaw) console.log(`[Sync] ${investmentsKey} loaded from cache`);
      const goalsCacheRaw = localStorage.getItem(goalsKey);
      if (goalsCacheRaw) console.log(`[Sync] ${goalsKey} loaded from cache`);

      const investments = StorageService.getInvestments ? StorageService.getInvestments() : [];
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
    
    // Update container padding
    container.style.padding = isMobile ? `0 ${SPACING.SM}` : `0 ${SPACING.MD}`;
    
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
  const handleStorageUpdate = (e) => {
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
  const handleForecastInvalidate = (_e) => {
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
  const handleSyncState = (e) => {
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
  const handleKeyboardShortcuts = (e) => {
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
  renderSection(currentSection);

  return container;
};
