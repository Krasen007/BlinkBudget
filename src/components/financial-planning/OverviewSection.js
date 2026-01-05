import { SectionContainer } from './SectionContainer.js';
import { StatsCard } from './StatsCard.js';
import { EmergencyFundCard } from './EmergencyFundCard.js';
import { Placeholder } from './Placeholder.js';
import { COLORS } from '../../utils/constants.js';

/**
 * OverviewSection Component - Financial health summary section
 * @param {Object} props - Section properties
 * @param {Object} props.planningData - Planning data from services
 * @param {Array} props.planningData.transactions - Transaction data
 * @param {Function} props.onSectionSwitch - Callback for switching sections
 * @returns {HTMLElement} The overview section element
 */
export const OverviewSection = ({ planningData, onSectionSwitch }) => {
  const section = SectionContainer({
    id: 'overview',
    title: 'Financial Overview',
    icon: '📊',
    usageNote: 'At-a-glance health summary: shows current balance, monthly expense averages, savings rate and emergency fund advice. Use the quick actions to jump to Forecasts, Investments, Goals or run scenarios.'
  });

  if (!planningData) {
    const placeholder = Placeholder({
      title: 'Loading Financial Data',
      description: 'Please wait while we analyze your financial information.',
      icon: '⏳'
    });
    section.appendChild(placeholder);
    return section;
  }

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

  // Generate risk assessments (simplified for now - will be extracted to service)
  let emergencyFundAssessment = null;
  let riskScore = null;

  try {
    // Assume emergency fund is current balance (simplified)
    const emergencyFundRatio = monthlyExpenses > 0 ? currentBalance / monthlyExpenses : 0;
    if (emergencyFundRatio >= 6) {
      emergencyFundAssessment = {
        status: 'adequate',
        message: `You have ${emergencyFundRatio.toFixed(1)} months of expenses saved.`,
        recommendation: 'Great job! You have a solid emergency fund.',
        riskLevel: 'low'
      };
    } else if (emergencyFundRatio >= 3) {
      emergencyFundAssessment = {
        status: 'moderate',
        message: `You have ${emergencyFundRatio.toFixed(1)} months of expenses saved.`,
        recommendation: 'Consider building your emergency fund to 6+ months of expenses.',
        riskLevel: 'moderate'
      };
    } else {
      emergencyFundAssessment = {
        status: 'inadequate',
        message: `You have ${emergencyFundRatio.toFixed(1)} months of expenses saved.`,
        recommendation: 'Build an emergency fund covering 3-6 months of expenses.',
        riskLevel: 'high'
      };
    }

    // Calculate overall risk score
    const riskFactors = [
      {
        category: 'Emergency Fund',
        riskLevel: emergencyFundAssessment.riskLevel,
        message: emergencyFundAssessment.message
      }
    ];

    // Simple risk calculation
    const highRiskCount = riskFactors.filter(f => f.riskLevel === 'high').length;
    const moderateRiskCount = riskFactors.filter(f => f.riskLevel === 'moderate').length;

    if (highRiskCount > 0) {
      riskScore = { level: 'high', message: 'High risk - Immediate attention needed' };
    } else if (moderateRiskCount > 0) {
      riskScore = { level: 'moderate', message: 'Moderate risk - Some improvements needed' };
    } else {
      riskScore = { level: 'low', message: 'Low risk - Good financial health' };
    }
  } catch (error) {
    console.error('Error calculating risk assessments:', error);
  }

  // Quick stats cards
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';
  statsGrid.style.display = 'grid';
  statsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
  statsGrid.style.gap = 'var(--spacing-md)';
  statsGrid.style.marginBottom = 'var(--spacing-xl)';

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
    const card = StatsCard(stat);
    statsGrid.appendChild(card);
  });

  section.appendChild(statsGrid);

  // Emergency Fund Status (if available)
  if (emergencyFundAssessment && emergencyFundAssessment.status !== 'error') {
    const emergencyFundCard = EmergencyFundCard(emergencyFundAssessment);
    section.appendChild(emergencyFundCard);
  }

  // Quick actions
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'quick-actions';
  actionsContainer.style.display = 'flex';
  actionsContainer.style.gap = 'var(--spacing-md)';
  actionsContainer.style.flexWrap = 'wrap';
  actionsContainer.style.marginTop = 'var(--spacing-xl)';

  const actions = [
    { label: 'View Forecasts', icon: '🔮', action: () => onSectionSwitch('forecasts') },
    { label: 'Add Investment', icon: '💰', action: () => onSectionSwitch('investments') },
    { label: 'Set Goal', icon: '🎯', action: () => onSectionSwitch('goals') },
    { label: 'Run Scenario', icon: '🔄', action: () => onSectionSwitch('scenarios') },
  ];

  actions.forEach(action => {
    const button = document.createElement('button');
    button.className = 'action-button';
    button.innerHTML = `${action.icon} ${action.label}`;
    button.style.padding = 'var(--spacing-md) var(--spacing-lg)';
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

  return section;
};
