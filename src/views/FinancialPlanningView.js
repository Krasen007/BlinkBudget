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
import {
  COLORS,
  SPACING,
  BREAKPOINTS,
  DIMENSIONS,
  TIMING,
  STORAGE_KEYS,
} from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';

export const FinancialPlanningView = () => {
  const container = document.createElement('div');
  container.className = 'view-financial-planning';
  container.style.width = '100%';
  container.style.maxWidth = DIMENSIONS.CONTAINER_MAX_WIDTH;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.padding = `0 ${SPACING.MD}`;
  container.style.overflow = 'hidden';

  // State management
  let currentSection = 'overview';
  let isLoading = false;
  let planningData = null;

  // Initialize calculation engines
  const forecastEngine = new ForecastEngine();
  const balancePredictor = new AccountBalancePredictor();
  const riskAssessor = new RiskAssessor();

  // Create header
  const header = createHeader();
  container.appendChild(header);

  // Create navigation tabs
  const navigation = createNavigation();
  container.appendChild(navigation);

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

    // Right side (empty for now, could add actions later)
    const rightSide = document.createElement('div');
    rightSide.style.display = 'flex';
    rightSide.style.alignItems = 'center';
    rightSide.style.gap = SPACING.SM;

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
    
    const placeholder = createPlaceholder(
      'Investment Tracker Coming Soon',
      'Track your investment portfolio with asset allocation analysis and performance monitoring.',
      '💰'
    );
    
    section.appendChild(placeholder);
    content.appendChild(section);
  }

  /**
   * Render Goals section - Long-term planning
   */
  function renderGoalsSection() {
    const section = createSectionContainer('goals', 'Financial Goals', '🎯');
    
    const placeholder = createPlaceholder(
      'Goal Planner Coming Soon',
      'Set and track long-term financial goals with progress monitoring and wealth projections.',
      '🎯'
    );
    
    section.appendChild(placeholder);
    content.appendChild(section);
  }

  /**
   * Render Insights section - Advanced analytics
   */
  function renderInsightsSection() {
    const section = createSectionContainer('insights', 'Financial Insights', '💡');
    
    const placeholder = createPlaceholder(
      'Advanced Insights Coming Soon',
      'Discover spending patterns, top movers analysis, and timeline comparisons.',
      '💡'
    );
    
    section.appendChild(placeholder);
    content.appendChild(section);
  }

  /**
   * Render Scenarios section - What-if modeling
   */
  function renderScenariosSection() {
    const section = createSectionContainer('scenarios', 'Scenario Planning', '🔄');
    
    const placeholder = createPlaceholder(
      'Scenario Planner Coming Soon',
      'Model different financial scenarios and see their long-term impact on your goals.',
      '🔄'
    );
    
    section.appendChild(placeholder);
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

      // TODO: Load investment data, goals, etc. when those services are implemented
      planningData = {
        transactions,
        accounts,
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
    if (e.detail.key === STORAGE_KEYS.TRANSACTIONS || e.detail.key === STORAGE_KEYS.ACCOUNTS) {
      loadPlanningData();
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
  window.addEventListener('keydown', handleKeyboardShortcuts);

  // Cleanup function
  container.cleanup = () => {
    window.removeEventListener('resize', updateResponsiveLayout);
    window.removeEventListener('storage-updated', handleStorageUpdate);
    window.removeEventListener('keydown', handleKeyboardShortcuts);
  };

  // Initialize
  updateResponsiveLayout();
  loadPlanningData();
  renderSection(currentSection);

  return container;
};