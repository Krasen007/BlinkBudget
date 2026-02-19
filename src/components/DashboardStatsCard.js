/**
 * Dashboard Statistics Card Component
 * Displays a single stat card (Total Available, Total Spent, etc.)
 */

import {
  COLORS,
  FONT_SIZES,
  SPACING,
  TOUCH_TARGETS,
  BREAKPOINTS,
  CURRENCY_SYMBOL,
} from '../utils/constants.js';

export const DashboardStatsCard = ({ label, value, color }) => {
  const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
  const card = document.createElement('div');
  card.className = 'card dashboard-stat-card';

  Object.assign(card.style, {
    textAlign: 'left',
    padding: isMobile ? `${SPACING.MD} ${SPACING.SM}` : SPACING.LG,
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,

    display: 'flex',
    flexDirection: isMobile ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'center' : 'flex-start',
    gap: isMobile ? SPACING.MD : 0,
  });

  const lbl = document.createElement('p');
  lbl.textContent = label;
  lbl.className = 'dashboard-stat-label';
  Object.assign(lbl.style, {
    fontSize: isMobile
      ? FONT_SIZES.STAT_LABEL_MOBILE
      : FONT_SIZES.STAT_LABEL_DESKTOP,
    marginBottom: isMobile ? 0 : SPACING.XS,
    color: COLORS.TEXT_MUTED,
    lineHeight: 'var(--line-height-normal)',
    fontWeight: '500',
  });

  const val = document.createElement('h2');
  val.textContent = `${CURRENCY_SYMBOL}${value.toFixed(2)}`;
  val.className = 'dashboard-stat-value';
  Object.assign(val.style, {
    color,
    margin: 0,
    fontSize: isMobile
      ? FONT_SIZES.STAT_VALUE_MOBILE
      : FONT_SIZES.STAT_VALUE_DESKTOP,
    lineHeight: 'var(--line-height-tight)',
    fontWeight: '700',
  });

  card.appendChild(lbl);
  card.appendChild(val);

  return card;
};
