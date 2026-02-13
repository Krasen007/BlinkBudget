/**
 * Overview Section - Financial Health Summary
 *
 * Extracted from FinancialPlanningView.js for better maintainability.
 * Displays financial health summary with stats cards and risk assessment.
 *
 * Responsibilities:
 * - Financial health summary display
 * - Stats cards generation (balance, expenses, savings rate, risk level)
 * - Emergency fund assessment integration
 * - Risk calculation and display
 */

import { COLORS, SPACING } from '../../utils/constants.js';
import { StatsCard } from '../../components/financial-planning/StatsCard.js';
import { EmergencyFundCard } from '../../components/financial-planning/EmergencyFundCard.js';
import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
} from '../../utils/financial-planning-helpers.js';
import { offlineDataManager } from '../../core/offline-data-manager.js';

/**
 * Overview Section Component
 * @param {Object} planningData - Financial planning data including transactions
 * @param {Object} riskAssessor - Risk assessment service instance
 * @returns {HTMLElement} DOM element containing overview section content
 */
export const OverviewSection = (planningData, riskAssessor) => {
  const section = createSectionContainer(
    'overview',
    'Financial Overview',
    '📊'
  );

  // Check for cached data first
  const cachedData = offlineDataManager.getCachedPlanningData('overview');
  const isOffline = !offlineDataManager.isOnline;
  let dataToUse = planningData;

  if (cachedData && (!planningData || isOffline)) {
    console.log('[OverviewSection] Using cached planning data');
    dataToUse = cachedData.data;
  }

  section.appendChild(
    createUsageNote(
      'At-a-glance health summary: shows current balance, monthly expense averages, savings rate and emergency fund advice.'
    )
  );

  if (!dataToUse) {
    const placeholder = createPlaceholder(
      isOffline ? 'No Offline Data Available' : 'Loading Financial Data',
      isOffline
        ? 'Connect to the internet to load your financial overview for the first time.'
        : 'Please wait while we analyze your financial information.',
      isOffline ? '📡' : '⏳'
    );
    section.appendChild(placeholder);

    // Cache the section state for offline access
    if (!isOffline && dataToUse) {
      offlineDataManager.cachePlanningData('overview', dataToUse);
    } else if (cachedData) {
      dataToUse = cachedData.data;
    }

    return section;
  }

  // Quick stats cards
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';
  statsGrid.style.display = 'grid';
  statsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
  statsGrid.style.gap = SPACING.MD;
  statsGrid.style.marginBottom = SPACING.XL;

  // Calculate real stats from transaction data - SAME LOGIC AS DASHBOARD
  const { transactions = [] } = dataToUse;
  let allTimeIncome = 0;
  let allTimeExpense = 0;
  let monthlyExpenses = 0;
  let allTimeTransfers = 0;

  // Filter out ghost transactions for totals calculation (same as dashboard)
  const validTransactionsForStats = transactions.filter(t => !t.isGhost);

  // Calculate ALL TIME totals (same as dashboard)
  validTransactionsForStats.forEach(t => {
    if (t.type === 'income') {
      allTimeIncome += t.amount;
    } else if (t.type === 'expense') {
      allTimeExpense += t.amount;
    } else if (t.type === 'refund') {
      allTimeExpense -= t.amount; // Refunds reduce expenses
    } else if (t.type === 'transfer') {
      // Track transfers separately - don't include in income/expense totals for savings rate
      allTimeTransfers += t.amount;
    }
  });

  const currentBalance = allTimeIncome - allTimeExpense;

  // Calculate monthly expenses from recent data
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const recentTransactions = transactions.filter(
    t => !t.isGhost && new Date(t.timestamp) >= threeMonthsAgo
  );

  if (recentTransactions.length > 0) {
    const recentExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthsOfData = Math.max(
      1,
      (now - threeMonthsAgo) / (1000 * 60 * 60 * 24 * 30)
    );
    monthlyExpenses = recentExpenses / monthsOfData;
  }

  const effectiveIncome = allTimeIncome - allTimeTransfers;
  const savingsRate =
    effectiveIncome > 0
      ? ((allTimeIncome - allTimeExpense) / effectiveIncome) * 100
      : 0;

  // Generate risk assessments
  let emergencyFundAssessment = null;
  let riskScore = null;

  try {
    // Assume emergency fund is current balance (simplified)
    emergencyFundAssessment = riskAssessor.assessEmergencyFundAdequacy(
      monthlyExpenses,
      Math.max(0, currentBalance)
    );

    // Calculate overall risk score
    const riskFactors = [
      {
        category: 'Emergency Fund',
        riskLevel: emergencyFundAssessment.riskLevel,
        message: emergencyFundAssessment.message,
      },
    ];

    riskScore = riskAssessor.calculateOverallRiskScore(riskFactors);
  } catch (error) {
    console.error('Error calculating risk assessments:', error);
  }

  // Cache the calculated data for offline access
  if (!isOffline && dataToUse) {
    offlineDataManager.cachePlanningData('overview', {
      data: dataToUse,
      timestamp: Date.now(),
      stats: {
        currentBalance,
        monthlyExpenses,
        savingsRate,
        emergencyFundAssessment,
        riskScore,
      },
    });
  }

  const stats = [
    {
      label: 'Current Balance',
      value: `€${currentBalance.toFixed(2)}`,
      color: currentBalance >= 0 ? COLORS.SUCCESS : COLORS.ERROR,
      icon: '💰',
      subtitle: currentBalance >= 0 ? 'Positive balance' : 'Negative balance',
      calculationHelp: `
        <p><strong>Formula:</strong> Total Income - Total Expenses (including refunds and transfers)</p>
        <p>This shows your net financial position by calculating all income minus all expenses, refunds, and transfer movements across all your accounts. Matches the dashboard calculation.</p>
      `,
    },
    {
      label: 'Monthly Expenses',
      value: `€${monthlyExpenses.toFixed(2)}`,
      color: COLORS.ERROR,
      icon: '📉',
      subtitle: 'Average last 3 months',
      calculationHelp: `
        <p><strong>Formula:</strong> Total expenses from last 3 months ÷ Number of months in that period</p>
        <p>This calculates your average monthly spending by analyzing expense transactions over the most recent 3-month period, providing a realistic view of your regular spending patterns.</p>
      `,
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      color:
        savingsRate > 20
          ? COLORS.SUCCESS
          : savingsRate > 10
            ? COLORS.WARNING
            : COLORS.ERROR,
      icon: '🎯',
      subtitle:
        savingsRate > 20
          ? 'Excellent'
          : savingsRate > 10
            ? 'Good'
            : 'Needs improvement',
      calculationHelp: `
        <p><strong>Formula:</strong> (Total Income - Total Expenses) ÷ Total Income × 100</p>
        <p>This percentage shows how much of your income you're saving. A higher rate indicates better financial health and more money available for investments or emergencies.</p>
      `,
    },
    {
      label: 'Risk Level',
      value: riskScore
        ? riskScore.level.charAt(0).toUpperCase() + riskScore.level.slice(1)
        : 'Unknown',
      color: riskScore
        ? riskScore.level === 'low'
          ? COLORS.SUCCESS
          : riskScore.level === 'moderate'
            ? COLORS.WARNING
            : COLORS.ERROR
        : COLORS.TEXT_MUTED,
      icon: riskScore
        ? riskScore.level === 'low'
          ? '✅'
          : riskScore.level === 'moderate'
            ? '⚠️'
            : '🚨'
        : '❓',
      subtitle: riskScore ? riskScore.message : 'Calculating...',
      calculationHelp: `
        <p><strong>Assessment:</strong> Based on emergency fund adequacy</p>
        <p>Risk level is determined by evaluating your emergency fund coverage relative to monthly expenses. Low risk indicates strong financial preparedness, while high risk suggests immediate attention is needed.</p>
      `,
    },
  ];

  stats.forEach(stat => {
    const card = StatsCard(stat);
    statsGrid.appendChild(card);
  });

  section.appendChild(statsGrid);

  // Emergency Fund Status (if available)
  if (emergencyFundAssessment && emergencyFundAssessment.status !== 'error') {
    const emergencyFundCard = EmergencyFundCard(emergencyFundAssessment);
    section.appendChild(emergencyFundCard);
  }

  return section;
};
