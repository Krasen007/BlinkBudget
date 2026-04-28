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
import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
} from '../../utils/financial-planning-helpers.js';

// Risk thresholds for emergency fund assessment
const RISK_THRESHOLDS = {
  emergencyFund: {
    minimum: 3, // 3 months minimum
    recommended: 6, // 6 months recommended
    optimal: 12, // 12 months optimal
  },
};

/**
 * Assess emergency fund adequacy
 * @param {number} monthlyExpenses - Monthly expenses
 * @param {number} emergencyFund - Current emergency fund amount
 * @returns {Object} Emergency fund assessment
 */
function assessEmergencyFundAdequacy(monthlyExpenses, emergencyFund) {
  try {
    if (monthlyExpenses <= 0) {
      return {
        status: 'unknown',
        message: 'Unable to assess emergency fund - insufficient expense data',
        recommendation:
          'Track expenses for at least 3 months to get accurate assessment',
        monthsCovered: 0,
        targetAmount: 0,
        shortfall: 0,
        riskLevel: 'unknown',
      };
    }

    const monthsCovered = emergencyFund / monthlyExpenses;
    const recommendedAmount =
      monthlyExpenses * RISK_THRESHOLDS.emergencyFund.recommended;
    const shortfall = Math.max(0, recommendedAmount - emergencyFund);

    let status, riskLevel, message, recommendation;

    if (monthsCovered >= RISK_THRESHOLDS.emergencyFund.optimal) {
      status = 'excellent';
      riskLevel = 'low';
      message = `Excellent emergency fund: ${monthsCovered.toFixed(1)} months of expenses covered`;
      recommendation =
        'Consider investing excess emergency funds for better returns while maintaining liquidity';
    } else if (monthsCovered >= RISK_THRESHOLDS.emergencyFund.recommended) {
      status = 'good';
      riskLevel = 'low';
      message = `Good emergency fund: ${monthsCovered.toFixed(1)} months of expenses covered`;
      recommendation =
        'Emergency fund is adequate. Consider building towards 12 months for optimal security';
    } else if (monthsCovered >= RISK_THRESHOLDS.emergencyFund.minimum) {
      status = 'adequate';
      riskLevel = 'moderate';
      message = `Minimum emergency fund: ${monthsCovered.toFixed(1)} months of expenses covered`;
      recommendation = `Build emergency fund to €${recommendedAmount.toFixed(2)} (6 months of expenses)`;
    } else if (monthsCovered > 0) {
      status = 'insufficient';
      riskLevel = 'critical';
      message = `Insufficient emergency fund: Only ${monthsCovered.toFixed(1)} months covered`;
      recommendation = `Urgent: Build emergency fund to at least €${(monthlyExpenses * 3).toFixed(2)} (3 months minimum)`;
    } else {
      status = 'none';
      riskLevel = 'critical';
      message = 'No emergency fund detected';
      recommendation = `Critical: Start building emergency fund immediately. Target: €${recommendedAmount.toFixed(2)}`;
    }

    return {
      status,
      riskLevel,
      message,
      recommendation,
      monthsCovered: Math.round(monthsCovered * 10) / 10,
      currentAmount: emergencyFund,
      targetAmount: recommendedAmount,
      shortfall: Math.round(shortfall * 100) / 100,
      monthlyExpenses,
    };
  } catch (error) {
    console.error('Error assessing emergency fund:', error);
    return {
      status: 'error',
      riskLevel: 'unknown',
      message: 'Error calculating emergency fund assessment',
      recommendation: 'Please check your financial data and try again',
      monthsCovered: 0,
      targetAmount: 0,
      shortfall: 0,
      currentAmount: 0,
      monthlyExpenses: 0,
    };
  }
}
/**
 * Overview Section Component
 * @param {Object} planningData - Financial planning data including transactions
 * @returns {HTMLElement} DOM element containing overview section content
 */
export const OverviewSection = planningData => {
  const section = createSectionContainer(
    'overview',
    'Financial Overview',
    '📊'
  );

  section.appendChild(
    createUsageNote(
      'At-a-glance health summary: shows current balance, monthly expense averages, savings rate and emergency fund advice.'
    )
  );

  if (!planningData) {
    const placeholder = createPlaceholder(
      'Loading Financial Data',
      'Please wait while we analyze your financial information.',
      '⏳'
    );
    section.appendChild(placeholder);
  }

  // Quick stats cards
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';
  statsGrid.style.display = 'grid';
  statsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
  statsGrid.style.gap = SPACING.MD;

  // Calculate real stats from transaction data - SAME LOGIC AS DASHBOARD
  if (!planningData) {
    section.appendChild(statsGrid);
    return section;
  }

  const { transactions = [] } = planningData;
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

  // Assess emergency fund
  // Note: Using currentBalance (net worth) as emergency fund proxy since account-level data
  // is not available in planningData. In future, this should compute from designated savings accounts
  // or accept an explicit emergencyFund input from user settings.
  const emergencyFund = Math.max(0, currentBalance);
  const emergencyFundAssessment = assessEmergencyFundAdequacy(
    monthlyExpenses,
    emergencyFund
  );

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
      value:
        emergencyFundAssessment.riskLevel.charAt(0).toUpperCase() +
        emergencyFundAssessment.riskLevel.slice(1),
      color:
        emergencyFundAssessment.riskLevel === 'low'
          ? COLORS.SUCCESS
          : emergencyFundAssessment.riskLevel === 'moderate'
            ? COLORS.WARNING
            : emergencyFundAssessment.riskLevel === 'critical'
              ? COLORS.ERROR
              : COLORS.TEXT_MUTED,
      icon:
        emergencyFundAssessment.riskLevel === 'low'
          ? '✅'
          : emergencyFundAssessment.riskLevel === 'moderate'
            ? '⚠️'
            : emergencyFundAssessment.riskLevel === 'critical'
              ? '🚨'
              : '❓',
      subtitle: emergencyFundAssessment.message,
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

  // Emergency Fund Card
  const emergencyFundCard = createEmergencyFundCard(emergencyFundAssessment);
  section.appendChild(emergencyFundCard);

  return section;
};

/**
 * Create emergency fund card
 * @param {Object} assessment - Emergency fund assessment
 * @returns {HTMLElement} Emergency fund card element
 */
function createEmergencyFundCard(assessment) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.padding = SPACING.LG;
  card.style.background = COLORS.SURFACE;
  card.style.border = `1px solid ${COLORS.BORDER}`;
  card.style.borderRadius = 'var(--radius-lg)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = SPACING.MD;

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.gap = SPACING.SM;

  const titleGroup = document.createElement('div');
  titleGroup.style.display = 'flex';
  titleGroup.style.alignItems = 'center';
  titleGroup.style.gap = SPACING.SM;

  const icon = document.createElement('span');
  icon.textContent = '🛡️';
  icon.style.fontSize = '1.25rem';

  const title = document.createElement('h3');
  title.textContent = 'Emergency Fund';
  title.style.margin = '0';
  title.style.fontSize = '0.875rem';
  title.style.fontWeight = '500';
  title.style.color = COLORS.TEXT_MUTED;

  titleGroup.appendChild(icon);
  titleGroup.appendChild(title);

  const statusBadge = document.createElement('span');
  statusBadge.textContent =
    assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1);
  statusBadge.style.padding = '4px 12px';
  statusBadge.style.borderRadius = '20px';
  statusBadge.style.fontSize = '0.75rem';
  statusBadge.style.fontWeight = '600';
  statusBadge.style.backgroundColor =
    assessment.riskLevel === 'low'
      ? COLORS.SUCCESS
      : assessment.riskLevel === 'moderate'
        ? COLORS.WARNING
        : assessment.riskLevel === 'critical'
          ? COLORS.ERROR
          : COLORS.TEXT_MUTED;
  statusBadge.style.color = 'white';

  header.appendChild(titleGroup);
  header.appendChild(statusBadge);

  const message = document.createElement('p');
  message.textContent = assessment.message;
  message.style.margin = '0';
  message.style.fontSize = '0.875rem';
  message.style.color = COLORS.TEXT_MAIN;

  const details = document.createElement('div');
  details.style.display = 'grid';
  details.style.gridTemplateColumns = 'repeat(2, 1fr)';
  details.style.gap = SPACING.MD;
  details.style.paddingTop = SPACING.SM;
  details.style.borderTop = `1px solid ${COLORS.BORDER}`;

  const detailItems = [
    {
      label: 'Current Amount',
      value: `€${assessment.currentAmount.toFixed(2)}`,
    },
    { label: 'Target Amount', value: `€${assessment.targetAmount.toFixed(2)}` },
    { label: 'Months Covered', value: assessment.monthsCovered.toFixed(1) },
    {
      label: 'Shortfall',
      value:
        assessment.shortfall > 0
          ? `€${assessment.shortfall.toFixed(2)}`
          : 'None',
    },
  ];

  detailItems.forEach(item => {
    const detail = document.createElement('div');
    detail.innerHTML = `
      <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: 4px;">${item.label}</div>
      <div style="font-weight: 600; color: ${COLORS.TEXT_MAIN}; font-size: 1rem;">${item.value}</div>
    `;
    details.appendChild(detail);
  });

  const recommendation = document.createElement('div');
  recommendation.style.marginTop = SPACING.SM;
  recommendation.style.padding = SPACING.MD;
  recommendation.style.background =
    assessment.riskLevel === 'low'
      ? 'rgba(34, 197, 94, 0.1)'
      : assessment.riskLevel === 'moderate'
        ? 'rgba(234, 179, 8, 0.1)'
        : assessment.riskLevel === 'critical'
          ? 'rgba(239, 68, 68, 0.1)'
          : 'rgba(156, 163, 175, 0.1)';
  recommendation.style.borderRadius = 'var(--radius-md)';
  recommendation.style.border = `1px solid ${
    assessment.riskLevel === 'low'
      ? COLORS.SUCCESS
      : assessment.riskLevel === 'moderate'
        ? COLORS.WARNING
        : assessment.riskLevel === 'critical'
          ? COLORS.ERROR
          : COLORS.TEXT_MUTED
  }`;
  recommendation.innerHTML = `
    <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: 4px; font-weight: 500;">Recommendation</div>
    <div style="font-weight: 500; color: ${COLORS.TEXT_MAIN}; font-size: 0.875rem;">${assessment.recommendation}</div>
  `;

  card.appendChild(header);
  card.appendChild(message);
  card.appendChild(details);
  card.appendChild(recommendation);

  return card;
}
