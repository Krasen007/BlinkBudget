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

export const DashboardStatsCard = ({
  label,
  value,
  color,
  showMonthNavigation = false,
  currentMonthFilter = null,
  onMonthChange = () => {},
  showResetButton = false,
  onReset = () => {},
  isFiltered = false,
  // New props for visual indicators
  trend = null, // 'up', 'down', 'stable'
  trendPercentage = null,
  progressPercentage = null,
  showProgressBar = false,
  targetValue = null,
}) => {
  const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
  const card = document.createElement('div');
  card.className = 'card dashboard-stat-card';
  card.style.position = 'relative';
  card.style.overflow = 'hidden';

  Object.assign(card.style, {
    textAlign: 'left',
    padding: isMobile ? `${SPACING.XS} ${SPACING.XS}` : SPACING.MD,
    minHeight: isMobile ? '80px' : TOUCH_TARGETS.MIN_HEIGHT,

    display: 'flex',
    flexDirection: 'column', // Always use column layout for consistent label-value positioning
    justifyContent: isMobile ? 'center' : 'space-between',
    gap: isMobile ? SPACING.XS : '0',
    alignItems: isMobile ? 'center' : 'flex-start',
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
    margin: 0,
    paddingLeft: showMonthNavigation ? '40px' : '0',
    paddingRight: showMonthNavigation ? '40px' : '0',
  });

  const val = document.createElement('h2');
  val.textContent = `${CURRENCY_SYMBOL}${value.toFixed(2)}`;
  val.className = 'dashboard-stat-value';
  Object.assign(val.style, {
    color,
    margin: 0,
    fontSize: FONT_SIZES.STAT_VALUE_DESKTOP,
    lineHeight: 'var(--line-height-tight)',
    fontWeight: '700',
    paddingLeft: showMonthNavigation ? '40px' : '0',
    paddingRight: showMonthNavigation ? '40px' : '0',
  });

  card.appendChild(lbl);
  card.appendChild(val);

  // Add trend indicator if provided
  if (trend && trendPercentage !== null) {
    const trendContainer = document.createElement('div');
    trendContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    `;

    const trendIcon = document.createElement('span');
    trendIcon.textContent =
      trend === 'up' ? ' rise_up' : trend === 'down' ? ' fall_down' : ' right';
    trendIcon.style.color =
      trend === 'up'
        ? COLORS.ERROR
        : trend === 'down'
          ? COLORS.SUCCESS
          : COLORS.TEXT_MUTED;

    const trendText = document.createElement('span');
    trendText.textContent = `${Math.abs(trendPercentage).toFixed(1)}%`;
    trendText.style.color =
      trend === 'up'
        ? COLORS.ERROR
        : trend === 'down'
          ? COLORS.SUCCESS
          : COLORS.TEXT_MUTED;

    trendContainer.appendChild(trendIcon);
    trendContainer.appendChild(trendText);
    card.appendChild(trendContainer);
  }

  // Add progress bar if enabled
  if (showProgressBar && progressPercentage !== null) {
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      margin-top: 8px;
      width: 100%;
    `;

    const progressBarBg = document.createElement('div');
    progressBarBg.style.cssText = `
      width: 100%;
      height: 4px;
      background: ${COLORS.BORDER};
      border-radius: 2px;
      overflow: hidden;
    `;

    const progressBarFill = document.createElement('div');
    const progressWidth = Math.min(Math.max(progressPercentage, 0), 100);
    progressBarFill.style.cssText = `
      height: 100%;
      width: ${progressWidth}%;
      background: ${color};
      border-radius: 2px;
      transition: width 0.3s ease;
    `;

    progressBarBg.appendChild(progressBarFill);
    progressContainer.appendChild(progressBarBg);

    // Add target indicator if target provided
    if (targetValue !== null) {
      const targetText = document.createElement('div');
      targetText.textContent = `Target: ${CURRENCY_SYMBOL}${targetValue.toFixed(2)}`;
      targetText.style.cssText = `
        font-size: 0.7rem;
        color: ${COLORS.TEXT_MUTED};
        margin-top: 2px;
      `;
      progressContainer.appendChild(targetText);
    }

    card.appendChild(progressContainer);
  }

  // Add reset button if filters are active
  if (showResetButton && isFiltered) {
    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-filters-btn';
    resetBtn.textContent = '↺';
    resetBtn.style.position = 'absolute';
    resetBtn.style.right = '8px';
    resetBtn.style.top = '8px';
    resetBtn.style.background = 'none';
    resetBtn.style.border = 'none';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.padding = '6px 8px';
    resetBtn.style.fontSize = '16px';
    resetBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
    resetBtn.style.transition = 'all 0.2s';
    resetBtn.style.borderRadius = '4px';
    resetBtn.style.zIndex = '2';
    resetBtn.title = 'Reset all filters to show total amount';
    resetBtn.setAttribute('aria-label', 'Reset all filters');

    // Add hover effects
    resetBtn.addEventListener('mouseenter', () => {
      resetBtn.style.color = COLORS.PRIMARY || 'var(--color-primary)';
      resetBtn.style.backgroundColor = 'var(--color-surface-hover)';
      resetBtn.style.transform = 'scale(1.1)';
    });
    resetBtn.addEventListener('mouseleave', () => {
      resetBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
      resetBtn.style.backgroundColor = 'transparent';
      resetBtn.style.transform = 'scale(1)';
    });

    resetBtn.addEventListener('click', () => {
      if (typeof onReset === 'function') {
        onReset();
      }
    });

    card.appendChild(resetBtn);
  }

  // Add anchored month navigation controls if enabled
  if (showMonthNavigation) {
    // Add padding to value to prevent overlap with arrows
    val.style.paddingLeft = '30px';
    val.style.paddingRight = '30px';

    // Left arrow button - covers entire left side
    const prevBtn = document.createElement('button');
    prevBtn.className = 'month-nav-btn prev-month';
    prevBtn.textContent = '◀';
    prevBtn.style.position = 'absolute';
    prevBtn.style.left = '0';
    prevBtn.style.top = '0';
    prevBtn.style.width = '30px';
    prevBtn.style.height = '100%';
    prevBtn.style.background = 'none';
    prevBtn.style.border = 'none';
    prevBtn.style.cursor = 'pointer';
    prevBtn.style.fontSize = '16px';
    prevBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
    prevBtn.style.transition = 'all 0.2s';
    prevBtn.style.zIndex = '1';
    prevBtn.style.display = 'flex';
    prevBtn.style.alignItems = 'center';
    prevBtn.style.justifyContent = 'center';
    prevBtn.style.borderRadius = 'var(--radius-md)';
    prevBtn.title = 'Previous month';
    prevBtn.setAttribute('aria-label', 'Previous month');

    // Right arrow button - covers entire right side
    const nextBtn = document.createElement('button');
    nextBtn.className = 'month-nav-btn next-month';
    nextBtn.textContent = '▶';
    nextBtn.style.position = 'absolute';
    nextBtn.style.right = '0';
    nextBtn.style.top = '0';
    nextBtn.style.width = '30px';
    nextBtn.style.height = '100%';
    nextBtn.style.background = 'none';
    nextBtn.style.border = 'none';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.fontSize = '16px';
    nextBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
    nextBtn.style.transition = 'all 0.2s';
    nextBtn.style.zIndex = '1';
    nextBtn.style.display = 'flex';
    nextBtn.style.alignItems = 'center';
    nextBtn.style.justifyContent = 'center';
    nextBtn.style.borderRadius = 'var(--radius-md)';
    nextBtn.title = 'Next month';
    nextBtn.setAttribute('aria-label', 'Next month');

    // Add hover effects
    const addHoverEffects = btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.color = COLORS.PRIMARY || 'var(--color-primary)';
        btn.style.backgroundColor = 'var(--color-surface-hover)';
        btn.style.borderRadius = 'var(--radius-md)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
        btn.style.backgroundColor = 'transparent';
        btn.style.borderRadius = 'var(--radius-md)';
      });
    };

    addHoverEffects(prevBtn);
    addHoverEffects(nextBtn);

    // Arrow click handlers - navigate months
    const navigateMonth = direction => {
      let currentDate;
      if (currentMonthFilter) {
        currentDate = new Date(currentMonthFilter);
      } else {
        // Default to current month if no filter
        currentDate = new Date();
      }

      // Use UTC methods to avoid timezone shifts and pin to first day
      const currentYear = currentDate.getUTCFullYear();
      const currentMonth = currentDate.getUTCMonth();

      // Navigate to previous/next month in UTC and pin to first day
      const newDate = new Date(
        Date.UTC(currentYear, currentMonth + direction, 1)
      );

      if (typeof onMonthChange === 'function') {
        onMonthChange(newDate.toISOString());
      }
    };

    prevBtn.addEventListener('click', () => navigateMonth(-1));
    nextBtn.addEventListener('click', () => navigateMonth(1));

    card.appendChild(prevBtn);
    card.appendChild(nextBtn);
  }

  return card;
};
