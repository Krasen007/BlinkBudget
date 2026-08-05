/**
 * ProgressiveEmptyState Component
 *
 * Displays a unified progressive unlock banner/card across financial planning sections.
 * Connects the 3-click transaction logging habit to advanced feature unlocks.
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';

const SECTION_CONFIGS = {
  budgets: {
    title: 'Smart Budget Suggestions',
    icon: '📊',
    minTransactions: 30,
    benefit:
      'Log 30+ transactions to unlock auto-suggested category budgets calculated from your actual spending history.',
  },
  goals: {
    title: 'Goal Cash Flow Insights',
    icon: '🎯',
    minTransactions: 30,
    benefit:
      'Log 30+ transactions to connect your spending patterns to long-term savings goals.',
  },
  insights: {
    title: 'Deep Analytics & Trends',
    icon: '📈',
    minTransactions: 30,
    benefit:
      'Log 30+ transactions to view top expense movers, category trends, and personal inflation analysis.',
  },
  forecasts: {
    title: 'Income & Expense Forecasting',
    icon: '🔮',
    minTransactions: 90,
    benefit:
      'Log 90+ transactions (3 months of history) to unlock 6-month balance and cash flow predictions.',
  },
  investments: {
    title: 'Portfolio & Net Worth Sync',
    icon: '💼',
    minTransactions: 30,
    benefit:
      'Log 30+ transactions to see how your portfolio holdings interact with overall net worth.',
  },
  overview: {
    title: 'Financial Health Assessment',
    icon: '🛡️',
    minTransactions: 30,
    benefit:
      'Log 30+ transactions to get an accurate emergency fund coverage assessment and risk score.',
  },
};

/**
 * Functional component returning DOM element for progressive empty state banner
 * @param {Object} options
 * @param {string} options.section - Section key ('budgets'|'goals'|'insights'|'forecasts'|'investments'|'overview')
 * @param {number} options.transactionCount - Number of logged transactions
 * @param {number} [options.minTransactions] - Override threshold if needed
 * @param {Function} [options.onAction] - Optional click handler for CTA button
 * @returns {HTMLElement|null} DOM element or null if feature is fully unlocked
 */
export const ProgressiveEmptyState = ({
  section,
  transactionCount = 0,
  minTransactions,
  onAction,
}) => {
  const normalizedKey = (section || 'overview').toLowerCase();
  const config = SECTION_CONFIGS[normalizedKey] || SECTION_CONFIGS.overview;
  const threshold = minTransactions ?? config.minTransactions;

  if (transactionCount >= threshold) {
    return null; // Feature is fully unlocked
  }

  const fontSm = FONT_SIZES?.SM || '0.875rem';
  const fontMd = FONT_SIZES?.MD || '1rem';
  const fontLg = FONT_SIZES?.LG || '1.125rem';

  const spaceXs = SPACING?.XS || '4px';
  const spaceSm = SPACING?.SM || '8px';
  const spaceMd = SPACING?.MD || '16px';

  const colorPrimary = COLORS?.PRIMARY || '#3b82f6';
  const colorSurface = COLORS?.SURFACE || 'var(--color-surface)';
  const colorSurfaceHover =
    COLORS?.SURFACE_HOVER || 'var(--color-surface-hover)';
  const colorBorder = COLORS?.BORDER || 'var(--color-border)';
  const colorTextMain = COLORS?.TEXT_MAIN || 'var(--color-text-main)';
  const colorTextMuted = COLORS?.TEXT_MUTED || 'var(--color-text-muted)';

  const remaining = Math.max(0, threshold - transactionCount);
  const progressPercent = Math.min(
    100,
    Math.round((transactionCount / threshold) * 100)
  );

  const container = document.createElement('div');
  container.className = `progressive-empty-state progressive-empty-state--${normalizedKey}`;
  Object.assign(container.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: spaceSm,
    padding: spaceMd,
    backgroundColor: colorSurface,
    borderRadius: '8px',
    border: `1px solid ${colorBorder}`,
    margin: `${spaceSm} 0`,
  });

  // Top Row: Icon + Title + Progress Badge
  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spaceSm,
  });

  const titleBox = document.createElement('div');
  titleBox.style.display = 'flex';
  titleBox.style.alignItems = 'center';
  titleBox.style.gap = spaceSm;

  const iconEl = document.createElement('span');
  iconEl.textContent = config.icon;
  iconEl.style.fontSize = fontLg;

  const titleEl = document.createElement('span');
  titleEl.textContent = config.title;
  titleEl.style.fontWeight = '600';
  titleEl.style.fontSize = fontMd;
  titleEl.style.color = colorTextMain;

  titleBox.appendChild(iconEl);
  titleBox.appendChild(titleEl);

  const badge = document.createElement('span');
  badge.textContent = `${transactionCount} / ${threshold} transactions`;
  Object.assign(badge.style, {
    fontSize: fontSm,
    color: colorPrimary,
    fontWeight: '500',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: '2px 8px',
    borderRadius: '12px',
  });

  header.appendChild(titleBox);
  header.appendChild(badge);
  container.appendChild(header);

  // Message & Progress Bar
  const msg = document.createElement('p');
  msg.textContent =
    transactionCount === 0
      ? `Log ${threshold} transactions to unlock complete ${config.title.toLowerCase()}.`
      : `Log ${remaining} more transaction${remaining === 1 ? '' : 's'} to unlock ${config.title.toLowerCase()}.`;
  Object.assign(msg.style, {
    margin: '0',
    fontSize: fontSm,
    color: colorTextMuted,
  });
  container.appendChild(msg);

  // Visual Progress Bar
  const track = document.createElement('div');
  Object.assign(track.style, {
    width: '100%',
    height: '6px',
    backgroundColor: colorSurfaceHover,
    borderRadius: '3px',
    overflow: 'hidden',
  });

  const fill = document.createElement('div');
  Object.assign(fill.style, {
    width: `${progressPercent}%`,
    height: '100%',
    backgroundColor: colorPrimary,
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  });
  track.appendChild(fill);
  container.appendChild(track);

  // Benefit hint
  const benefit = document.createElement('p');
  benefit.textContent = config.benefit;
  Object.assign(benefit.style, {
    margin: '0',
    fontSize: fontSm,
    color: colorTextMuted,
    fontStyle: 'italic',
  });
  container.appendChild(benefit);

  // Action CTA (if handler passed)
  if (onAction) {
    const btn = document.createElement('button');
    btn.textContent = '⚡ Log Transaction in 3 Clicks';
    Object.assign(btn.style, {
      alignSelf: 'flex-start',
      marginTop: spaceXs,
      padding: `${spaceXs} ${spaceMd}`,
      fontSize: fontSm,
      fontWeight: '500',
      color: '#ffffff',
      backgroundColor: colorPrimary,
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
    });
    btn.addEventListener('click', onAction);
    container.appendChild(btn);
  }

  return container;
};
