/**
 * Time Period Selector Component
 *
 * Provides a comprehensive time period selection interface with daily, weekly,
 * monthly, and custom period options. Includes date range validation and selection.
 *
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { DateInput } from './DateInput.js';
import {
  formatDate,
  formatDateForDisplay,
  dateToISO,
} from '../utils/date-utils.js';
import {
  getCurrentMonthPeriod,
  getCurrentQuarterPeriod,
  getTodayPeriod,
  getSpecificQuarterPeriod,
} from '../utils/reports-utils.js';

/**
 * Get a specific month period (for navigation)
 */
function getSpecificMonthPeriod(monthsOffset = 0) {
  const now = new Date();
  const targetDate = new Date(
    now.getFullYear(),
    now.getMonth() + monthsOffset,
    1
  );
  const startOfMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    0
  );
  endOfMonth.setHours(23, 59, 59, 999);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return {
    type: 'monthly',
    startDate: startOfMonth,
    endDate: endOfMonth,
    label: `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`,
  };
}

/**
 * Get a specific year period (for navigation)
 */
function getSpecificYearPeriod(yearsOffset = 0) {
  const now = new Date();
  const targetYear = now.getFullYear() + yearsOffset;
  const startOfYear = new Date(targetYear, 0, 1);
  const endOfYear = new Date(targetYear, 11, 31);
  endOfYear.setHours(23, 59, 59, 999);

  return {
    type: 'yearly',
    startDate: startOfYear,
    endDate: endOfYear,
    label: targetYear.toString(),
  };
}

/**
 * Whole-day offset between a date and today (0 = today, -1 = yesterday, ...)
 * @param {Date|string} date - Reference date
 * @returns {number} Whole days between the date and today
 */
function getDayOffsetFromDate(date) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const targetStart = new Date(date);
  targetStart.setHours(0, 0, 0, 0);
  return Math.round((targetStart - todayStart) / 86400000);
}

/**
 * Get a specific day period (for navigation)
 */
function getSpecificDayPeriod(daysOffset = 0) {
  const now = new Date();
  const targetDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysOffset
  );

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  let label;
  if (daysOffset === 0) {
    label = 'Today';
  } else if (daysOffset === -1) {
    label = 'Yesterday';
  } else {
    label = formatDateForDisplay(targetDate);
  }

  return {
    type: 'daily',
    startDate: startOfDay,
    endDate: endOfDay,
    label,
  };
}

export const TimePeriodSelector = (options = {}) => {
  const {
    initialPeriod = getCurrentMonthPeriod(),
    onChange = null,
    showCustomRange = true,
    className = '',
  } = options;

  const container = document.createElement('div');
  container.className = `time-period-selector ${className}`;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = SPACING.XS;
  container.style.width = '100%';
  container.style.flexShrink = '0';

  let currentPeriod = initialPeriod;
  let customStartDate = null;
  let customEndDate = null;

  const buttonsContainer = document.createElement('nav');

  buttonsContainer.setAttribute('role', 'tablist');
  buttonsContainer.style.display = 'grid';
  buttonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';

  buttonsContainer.style.gap = SPACING.SM;
  buttonsContainer.style.flexWrap = 'wrap'; // Allow wrapping
  buttonsContainer.style.maxWidth = '100%';

  // Hide scrollbar for webkit browsers
  const style = document.createElement('style');
  style.textContent = `
    .time-period-selector::-webkit-scrollbar {
      display: none;
    }
  `;
  document.head.appendChild(style);

  const periods = [
    { key: 'month', label: 'This Month', getValue: getCurrentMonthPeriod },
    {
      key: 'lastMonth',
      label: 'Last Month',
      getValue: () => getSpecificMonthPeriod(-1),
    },
    { key: 'today', label: 'Today', getValue: getTodayPeriod },
    {
      key: 'quarter',
      label: 'This Quarter',
      getValue: getCurrentQuarterPeriod,
    },
    {
      key: 'year',
      label: 'This Year',
      getValue: () => getSpecificYearPeriod(0),
    },
  ];

  function createArrow(direction) {
    const arrow = document.createElement('span');
    arrow.innerHTML = direction === 'left' ? '←' : '→';
    arrow.style.fontSize = '1em';
    arrow.style.position = 'absolute';
    arrow.style[direction === 'left' ? 'left' : 'right'] = '0';
    arrow.style.top = '0';
    arrow.style.bottom = '0';
    arrow.style.display = 'flex';
    arrow.style.alignItems = 'center';
    arrow.style.padding = `0 ${SPACING.SM}`;
    arrow.style.cursor = 'pointer';
    arrow.style[
      direction === 'left' ? 'borderTopLeftRadius' : 'borderTopRightRadius'
    ] = 'var(--radius-md)';
    arrow.style[
      direction === 'left'
        ? 'borderBottomLeftRadius'
        : 'borderBottomRightRadius'
    ] = 'var(--radius-md)';
    arrow.style.transition = 'background 0.2s ease';
    arrow.style.zIndex = '1';
    arrow.className = `arrow-${direction}`;

    // ARIA and keyboard support
    arrow.tabIndex = 0;
    arrow.setAttribute('role', 'button');
    arrow.setAttribute(
      'aria-label',
      direction === 'left' ? 'Previous period' : 'Next period'
    );

    arrow.addEventListener('mouseenter', () => {
      arrow.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    arrow.addEventListener('mouseleave', () => {
      arrow.style.background = 'transparent';
    });

    // Keyboard support
    arrow.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        arrow.click();
      }
    });

    return arrow;
  }

  function updateRightArrowVisibility(rightArrow, currentOffset, periodKey) {
    // For quarters, show right arrow if offset is not 0 (not current quarter)
    // For months and years, show right arrow only if we're in the past (offset < 0)
    if (periodKey === 'quarter') {
      rightArrow.style.display = currentOffset !== 0 ? 'flex' : 'none';
    } else {
      rightArrow.style.display = currentOffset < 0 ? 'flex' : 'none';
    }
  }

  if (showCustomRange) {
    periods.push({ key: 'custom', label: 'Custom Range', getValue: null });
  }

  const periodButtons = new Map();
  periods.forEach(period => {
    const button = createPeriodButton(period);
    periodButtons.set(period.key, button);
    buttonsContainer.appendChild(button);
  });

  const customRangeContainer = createCustomRangeSelector();

  // Navigation status message — lives outside the custom-range panel so
  // arrow-navigation errors stay visible when that panel is hidden
  const navigationMessage = document.createElement('div');
  navigationMessage.className = 'navigation-message';
  navigationMessage.setAttribute('role', 'alert');
  navigationMessage.style.display = 'none';
  navigationMessage.style.fontSize = FONT_SIZES.SM;
  navigationMessage.style.textAlign = 'center';
  navigationMessage.style.marginTop = SPACING.XS;

  container.appendChild(buttonsContainer);
  container.appendChild(navigationMessage);
  if (showCustomRange) {
    container.appendChild(customRangeContainer);
  }

  /**
   * Create a period selection button
   */
  function createPeriodButton(period) {
    const typeToKeyMap = {
      daily: 'today',
      monthly: 'month',
      lastMonth: 'lastMonth',
      quarterly: 'quarter',
      yearly: 'year',
      custom: 'custom',
    };

    // For monthly periods, we need to check if it's last month vs current month
    let initialKey;
    if (initialPeriod.type === 'monthly') {
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const periodStart = new Date(initialPeriod.startDate);

      if (
        periodStart.getFullYear() === lastMonthStart.getFullYear() &&
        periodStart.getMonth() === lastMonthStart.getMonth()
      ) {
        initialKey = 'lastMonth';
      } else {
        initialKey = 'month';
      }
    } else {
      initialKey = typeToKeyMap[initialPeriod.type] || 'month';
    }

    const button = document.createElement('button');
    button.className = 'view-tab'; // Standardized class
    button.dataset.period = period.key;

    if (period.key === 'lastMonth') {
      button.dataset.monthOffset = '-1';
    } else if (period.key === 'quarter') {
      button.dataset.quarterOffset = '0';
    } else if (period.key === 'year') {
      button.dataset.yearOffset = '0';
    } else if (period.key === 'today') {
      const initialDayOffset =
        initialPeriod.type === 'daily'
          ? getDayOffsetFromDate(initialPeriod.startDate)
          : 0;
      button.dataset.dayOffset = initialDayOffset.toString();
    }

    button.setAttribute('role', 'tab');
    button.setAttribute(
      'aria-selected',
      period.key === initialKey ? 'true' : 'false'
    );
    // Remove aria-controls since the target panel doesn't exist
    button.id = `${period.key}-tab`;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'tab-label';

    if (period.key === 'lastMonth') {
      labelSpan.textContent =
        period.key === initialKey ? initialPeriod.label : 'Last Month';
    } else if (period.key === 'quarter') {
      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
      const currentQuarterLabel = `${quarterLabels[currentQuarter]} ${now.getFullYear()}`;
      labelSpan.textContent =
        period.key === initialKey ? initialPeriod.label : currentQuarterLabel;
    } else if (period.key === 'year') {
      labelSpan.textContent =
        period.key === initialKey ? initialPeriod.label : 'This Year';
    } else if (period.key === 'today') {
      labelSpan.textContent =
        period.key === initialKey ? initialPeriod.label : period.label;
    } else {
      labelSpan.textContent = period.label;
    }

    if (
      period.key === 'lastMonth' ||
      period.key === 'quarter' ||
      period.key === 'year' ||
      period.key === 'today'
    ) {
      // Add relative position to the parent button so the absolute arrow docks cleanly to the button's bounds
      button.style.position = 'relative';

      const arrowContainer = document.createElement('div');
      arrowContainer.style.display = 'flex';
      arrowContainer.style.alignItems = 'center';
      arrowContainer.style.justifyContent = 'center'; // Center the text
      arrowContainer.style.width = '100%';

      const leftArrow = createArrow('left');
      const rightArrow = createArrow('right');

      // Right arrow starts hidden (offset -1 for month, 0 for year/quarter/today)
      const initialMonthOffset = period.key === 'lastMonth' ? -1 : 0;
      const initialQuarterOffset = 0;
      const initialYearOffset = 0;
      const initialOffset =
        period.key === 'lastMonth'
          ? initialMonthOffset
          : period.key === 'quarter'
            ? initialQuarterOffset
            : period.key === 'today'
              ? parseInt(button.dataset.dayOffset || '0', 10)
              : initialYearOffset;
      updateRightArrowVisibility(rightArrow, initialOffset, period.key);

      // Left arrow click — go further back
      leftArrow.addEventListener('click', e => {
        e.stopPropagation();
        if (period.key === 'lastMonth') {
          const currentOffset = parseInt(button.dataset.monthOffset || '-1');
          const newOffset = currentOffset - 1;
          const newPeriod = getSpecificMonthPeriod(newOffset);
          handleNavigation('lastMonth', newPeriod, 'month', {
            offset: currentOffset,
            nextOffset: newOffset,
            rightArrow,
            offsetKey: 'monthOffset',
            arrowPeriodKey: period.key,
          });
        } else if (period.key === 'quarter') {
          const currentOffset = parseInt(button.dataset.quarterOffset || '0');
          const newOffset = currentOffset - 1;
          const newPeriod = getSpecificQuarterPeriod(newOffset);
          handleNavigation('quarter', newPeriod, 'quarter', {
            offset: currentOffset,
            nextOffset: newOffset,
            rightArrow,
            offsetKey: 'quarterOffset',
            arrowPeriodKey: period.key,
          });
        } else if (period.key === 'year') {
          const currentOffset = parseInt(button.dataset.yearOffset || '0');
          const newOffset = currentOffset - 1;
          const newPeriod = getSpecificYearPeriod(newOffset);
          handleNavigation('year', newPeriod, 'year', {
            offset: currentOffset,
            nextOffset: newOffset,
            rightArrow,
            offsetKey: 'yearOffset',
            arrowPeriodKey: undefined,
          });
        } else if (period.key === 'today') {
          const currentOffset = parseInt(button.dataset.dayOffset || '0');
          const newOffset = currentOffset - 1;
          const newPeriod = getSpecificDayPeriod(newOffset);
          handleNavigation('today', newPeriod, 'day', {
            offset: currentOffset,
            nextOffset: newOffset,
            rightArrow,
            offsetKey: 'dayOffset',
            arrowPeriodKey: period.key,
          });
        }
      });

      // Right arrow click — go forward (only when in the past)
      rightArrow.addEventListener('click', e => {
        e.stopPropagation();
        if (period.key === 'lastMonth') {
          const currentOffset = parseInt(button.dataset.monthOffset || '-1');
          const newOffset = currentOffset + 1;
          const newPeriod = getSpecificMonthPeriod(newOffset);
          handleNavigation('lastMonth', newPeriod, 'month', {
            offset: currentOffset,
            nextOffset: newOffset,
            rightArrow,
            offsetKey: 'monthOffset',
            arrowPeriodKey: undefined,
          });
        } else if (period.key === 'quarter') {
          const currentOffset = parseInt(button.dataset.quarterOffset || '0');
          const newOffset = currentOffset + 1;
          const newPeriod = getSpecificQuarterPeriod(newOffset);
          handleNavigation('quarter', newPeriod, 'quarter', {
            offset: currentOffset,
            nextOffset: newOffset,
            rightArrow,
            offsetKey: 'quarterOffset',
            arrowPeriodKey: undefined,
          });
        } else if (period.key === 'year') {
          const currentOffset = parseInt(button.dataset.yearOffset || '0');
          const newOffset = currentOffset + 1;
          const newPeriod = getSpecificYearPeriod(newOffset);
          handleNavigation('year', newPeriod, 'year', {
            offset: currentOffset,
            nextOffset: newOffset,
            rightArrow,
            offsetKey: 'yearOffset',
            arrowPeriodKey: undefined,
          });
        } else if (period.key === 'today') {
          const currentOffset = parseInt(button.dataset.dayOffset || '0');
          const newOffset = currentOffset + 1;
          const newPeriod = getSpecificDayPeriod(newOffset);
          handleNavigation('today', newPeriod, 'day', {
            offset: currentOffset,
            nextOffset: newOffset,
            rightArrow,
            offsetKey: 'dayOffset',
            arrowPeriodKey: undefined,
          });
        }
      });

      const textContainer = document.createElement('span');
      textContainer.style.display = 'block';
      textContainer.appendChild(labelSpan);

      arrowContainer.appendChild(leftArrow);
      arrowContainer.appendChild(textContainer);
      arrowContainer.appendChild(rightArrow);
      button.appendChild(arrowContainer);
    } else {
      button.appendChild(labelSpan);
    }

    // Use global .view-tab styling instead of inline styles
    button.style.flex = '1 0 auto'; // Just keep the flex property

    button.addEventListener('click', () => {
      if (period.key === 'custom') {
        handleCustomPeriodSelection();
      } else {
        handlePredefinedPeriodSelection(period);
      }
    });

    // Standardize hover/active in CSS, but handle active state here for JS logic
    if (period.key === initialKey) {
      button.style.background = COLORS.PRIMARY;
      button.style.color = 'white';
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
    } else {
      button.setAttribute('aria-selected', 'false');
    }

    return button;
  }

  /**
   * Create custom date range selector
   */
  function createCustomRangeSelector() {
    const customContainer = document.createElement('div');
    customContainer.className = 'custom-range-selector';
    customContainer.style.display = 'none';
    customContainer.style.flexDirection = 'column';
    customContainer.style.gap = SPACING.MD;
    customContainer.style.padding = SPACING.MD;
    customContainer.style.background = COLORS.SURFACE;
    customContainer.style.border = `1px solid ${COLORS.BORDER}`;
    customContainer.style.borderRadius = 'var(--radius-lg)';
    customContainer.style.marginTop = SPACING.SM;

    const title = document.createElement('h4');
    title.textContent = 'Select Custom Date Range';
    title.style.margin = '0';
    title.style.fontSize = FONT_SIZES.BASE;
    title.style.color = COLORS.TEXT_MAIN;
    title.style.textAlign = 'center';

    const dateInputsContainer = document.createElement('div');
    dateInputsContainer.style.display = 'flex';
    dateInputsContainer.style.gap = SPACING.MD;
    dateInputsContainer.style.alignItems = 'center';
    dateInputsContainer.style.justifyContent = 'center';
    dateInputsContainer.style.flexWrap = 'wrap';

    const startDateContainer = document.createElement('div');
    startDateContainer.style.display = 'flex';
    startDateContainer.style.flexDirection = 'column';
    startDateContainer.style.alignItems = 'center';
    startDateContainer.style.gap = SPACING.XS;

    const startLabel = document.createElement('label');
    startLabel.textContent = 'From';
    startLabel.style.fontSize = FONT_SIZES.SM;
    startLabel.style.color = COLORS.TEXT_MUTED;
    startLabel.style.fontWeight = '500';

    const startDateInput = DateInput({
      value: null,
      onChange: handleStartDateChange,
      showLabel: false,
    });

    // Get the input ID for label association
    const startInputElement =
      startDateInput.querySelector('input[type="date"]');
    if (startInputElement && startLabel) {
      startLabel.setAttribute('for', startInputElement.id);
    }

    startDateContainer.appendChild(startLabel);
    startDateContainer.appendChild(startDateInput);

    const separator = document.createElement('div');
    separator.textContent = '—';
    separator.style.color = COLORS.TEXT_MUTED;
    separator.style.fontSize = FONT_SIZES.LG;
    separator.style.margin = `0 ${SPACING.SM}`;

    const endDateContainer = document.createElement('div');
    endDateContainer.style.display = 'flex';
    endDateContainer.style.flexDirection = 'column';
    endDateContainer.style.alignItems = 'center';
    endDateContainer.style.gap = SPACING.XS;

    const endLabel = document.createElement('label');
    endLabel.textContent = 'To';
    endLabel.style.fontSize = FONT_SIZES.SM;
    endLabel.style.color = COLORS.TEXT_MUTED;
    endLabel.style.fontWeight = '500';

    const endDateInput = DateInput({
      value: null,
      onChange: handleEndDateChange,
      showLabel: false,
    });

    // Get the input ID for label association
    const endInputElement = endDateInput.querySelector('input[type="date"]');
    if (endInputElement && endLabel) {
      endLabel.setAttribute('for', endInputElement.id);
    }

    endDateContainer.appendChild(endLabel);
    endDateContainer.appendChild(endDateInput);

    const actionsContainer = document.createElement('div');
    actionsContainer.style.display = 'flex';
    actionsContainer.style.gap = SPACING.SM;
    actionsContainer.style.justifyContent = 'center';
    actionsContainer.style.marginTop = SPACING.SM;

    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply Range';
    applyButton.className = 'btn btn-primary';
    applyButton.style.padding = `${SPACING.SM} ${SPACING.MD}`;
    applyButton.style.background = COLORS.PRIMARY;
    applyButton.style.color = 'white';
    applyButton.style.border = 'none';
    applyButton.style.borderRadius = 'var(--radius-md)';
    applyButton.style.cursor = 'pointer';
    applyButton.style.fontSize = FONT_SIZES.SM;
    applyButton.disabled = true;
    applyButton.addEventListener('click', applyCustomRange);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'btn btn-outline';
    cancelButton.style.padding = `${SPACING.SM} ${SPACING.MD}`;
    cancelButton.style.background = 'transparent';
    cancelButton.style.color = COLORS.TEXT_MUTED;
    cancelButton.style.border = `1px solid ${COLORS.BORDER}`;
    cancelButton.style.borderRadius = 'var(--radius-md)';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontSize = FONT_SIZES.SM;
    cancelButton.addEventListener('click', cancelCustomRange);

    const validationMessage = document.createElement('div');
    validationMessage.className = 'validation-message';
    validationMessage.style.display = 'none';
    validationMessage.style.fontSize = FONT_SIZES.SM;
    validationMessage.style.textAlign = 'center';
    validationMessage.style.marginTop = SPACING.XS;

    dateInputsContainer.appendChild(startDateContainer);
    dateInputsContainer.appendChild(separator);
    dateInputsContainer.appendChild(endDateContainer);

    actionsContainer.appendChild(cancelButton);
    actionsContainer.appendChild(applyButton);

    customContainer.appendChild(title);
    customContainer.appendChild(dateInputsContainer);
    customContainer.appendChild(validationMessage);
    customContainer.appendChild(actionsContainer);

    customContainer._startDateInput = startDateInput;
    customContainer._endDateInput = endDateInput;
    customContainer._applyButton = applyButton;
    customContainer._validationMessage = validationMessage;

    return customContainer;
  }

  /**
   * Check if two time periods are the same
   */
  function isSamePeriod(period1, period2) {
    if (!period1 || !period2) return false;
    if (period1.type !== period2.type) return false;

    const start1 = new Date(period1.startDate).getTime();
    const end1 = new Date(period1.endDate).getTime();
    const start2 = new Date(period2.startDate).getTime();
    const end2 = new Date(period2.endDate).getTime();

    return start1 === start2 && end1 === end2;
  }

  function showNavigationError(message) {
    navigationMessage.textContent = message;
    navigationMessage.style.display = 'block';
  }

  /**
   * Apply month, quarter, year, or day navigation without recreating the selector.
   * @param {string} buttonKey - Period button key ('lastMonth' | 'quarter' | 'year' | 'today')
   * @param {Object} newPeriod - Target time period
   * @param {string} unitLabel - Unit name for error messages
   * @param {Object} [nav] - Pre-mutation navigation state captured by the arrow
   *   handler before it computes the new offset. Carries the prior `offset`,
   *   the candidate `nextOffset`, the button's `rightArrow` element, the
   *   `offsetKey` dataset key, and the `arrowPeriodKey` originally passed to
   *   `updateRightArrowVisibility` (right-arrow clicks historically omit it).
   */
  function handleNavigation(buttonKey, newPeriod, unitLabel, nav = null) {
    const button = periodButtons.get(buttonKey);
    // Snapshot the selector state so a rejected navigation (consumer throws
    // or an invalid period) restores the exact previous period, active tab,
    // label, and offset instead of surfacing an error banner with the wrong
    // tab highlighted.
    const previousPeriod = currentPeriod;
    const previousActiveButton = container.querySelector('.view-tab.active');
    const previousLabel = button
      .querySelector('.tab-label')
      ?.textContent?.slice();
    const previousOffset =
      nav?.offset ??
      button.dataset.monthOffset ??
      button.dataset.quarterOffset ??
      button.dataset.yearOffset;
    // Restore the offset dataset + right-arrow visibility to a given value,
    // preserving the exact updateRightArrowVisibility call shape the arrow
    // handler used on the success path.
    const restoreOffsetUI = offsetValue => {
      if (!nav) return;
      button.dataset[nav.offsetKey] = offsetValue.toString();
      updateRightArrowVisibility(
        nav.rightArrow,
        offsetValue,
        nav.arrowPeriodKey
      );
    };
    try {
      if (!validateTimePeriod(newPeriod)) {
        if (nav) restoreOffsetUI(nav.offset);
        showNavigationError('Invalid time period selected');
        return;
      }

      // Notify first: if the consumer rejects the navigation, keep the
      // previous period, label, offset, and active button untouched so an
      // error never leaves the selector showing a period nobody owns.
      if (onChange) {
        onChange(newPeriod, { isNavigation: true });
      }

      currentPeriod = newPeriod;

      if (nav) restoreOffsetUI(nav.nextOffset);

      setActiveButton(button);
      hideCustomRangeSelector();

      const labelSpan = button.querySelector('.tab-label');
      if (labelSpan) {
        labelSpan.textContent = newPeriod.label;
      }

      // Notify parent component but with a flag to prevent full recreation
    } catch (error) {
      currentPeriod = previousPeriod;
      if (previousLabel !== undefined) {
        const labelSpan = button.querySelector('.tab-label');
        if (labelSpan) {
          labelSpan.textContent = previousLabel;
        }
      }
      if (nav) {
        restoreOffsetUI(nav.offset);
      } else if (previousOffset === undefined) {
        delete button.dataset.monthOffset;
        delete button.dataset.quarterOffset;
        delete button.dataset.yearOffset;
      } else if (buttonKey === 'lastMonth') {
        button.dataset.monthOffset = previousOffset;
      } else if (buttonKey === 'quarter') {
        button.dataset.quarterOffset = previousOffset;
      } else if (buttonKey === 'year') {
        button.dataset.yearOffset = previousOffset;
      }
      if (previousActiveButton) {
        setActiveButton(previousActiveButton);
      }
      console.error(`Error navigating to ${unitLabel}:`, error);
      showNavigationError(`Error navigating to ${unitLabel}`);
    }
  }

  /**
   * Handle predefined period selection
   */
  function handlePredefinedPeriodSelection(period) {
    try {
      const newPeriod = period.getValue();
      if (!validateTimePeriod(newPeriod)) {
        showValidationError('Invalid time period selected');
        return;
      }

      // Re-selecting the active period must not fire another onChange
      if (isSamePeriod(currentPeriod, newPeriod)) {
        setActiveButton(periodButtons.get(period.key));
        hideCustomRangeSelector();
        return;
      }

      currentPeriod = newPeriod;

      const button = periodButtons.get(period.key);
      setActiveButton(button);
      hideCustomRangeSelector();

      // Navigatable buttons display the specific period they moved to
      if (
        period.key === 'lastMonth' ||
        period.key === 'quarter' ||
        period.key === 'year' ||
        period.key === 'today'
      ) {
        const labelSpan = button.querySelector('.tab-label');
        if (labelSpan) {
          labelSpan.textContent = newPeriod.label;
        }
      }

      // Re-selecting Today re-anchors day navigation at the current day
      if (period.key === 'today') {
        button.dataset.dayOffset = '0';
        const rightArrow = button.querySelector('.arrow-right');
        if (rightArrow) {
          updateRightArrowVisibility(rightArrow, 0, 'today');
        }
      }

      if (onChange) {
        onChange(currentPeriod);
      }
    } catch (error) {
      console.error('Error selecting predefined period:', error);
      showValidationError('Error selecting time period');
    }
  }

  /**
   * Handle custom period selection
   */
  function handleCustomPeriodSelection() {
    setActiveButton(periodButtons.get('custom'));
    showCustomRangeSelector();

    // Pre-fill the range with the period currently shown
    if (currentPeriod && currentPeriod.startDate && currentPeriod.endDate) {
      customRangeContainer._startDateInput.setDate(
        dateToISO(currentPeriod.startDate)
      );
      customRangeContainer._endDateInput.setDate(
        dateToISO(currentPeriod.endDate)
      );
      customStartDate = currentPeriod.startDate;
      customEndDate = currentPeriod.endDate;
      validateCustomRange();
    }
  }

  /**
   * Handle start date change in custom range
   */
  function handleStartDateChange(isoDate) {
    customStartDate = isoDate ? new Date(isoDate) : null;
    validateCustomRange();
  }

  /**
   * Handle end date change in custom range
   */
  function handleEndDateChange(isoDate) {
    customEndDate = isoDate ? new Date(isoDate) : null;
    validateCustomRange();
  }

  /**
   * Validate custom date range
   */
  function validateCustomRange() {
    const applyButton = customRangeContainer._applyButton;
    const validationMessage = customRangeContainer._validationMessage;

    validationMessage.style.display = 'none';
    applyButton.disabled = true;

    if (!customStartDate || !customEndDate) {
      return; // Wait for both dates to be selected
    }

    if (customStartDate > customEndDate) {
      showValidationError('Start date must be before end date');
      return;
    }

    // Check for reasonable date range (not more than 2 years)
    const daysDifference =
      (customEndDate - customStartDate) / (1000 * 60 * 60 * 24);
    if (daysDifference > 730) {
      showValidationError('Date range cannot exceed 2 years');
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (customEndDate > today) {
      showValidationError('End date cannot be in the future');
      return;
    }

    applyButton.disabled = false;
    hideValidationError();
  }

  /**
   * Apply custom date range
   */
  function applyCustomRange() {
    if (!customStartDate || !customEndDate) {
      showValidationError('Please select both start and end dates');
      return;
    }

    try {
      const customPeriod = {
        type: 'custom',
        startDate: new Date(customStartDate),
        endDate: new Date(customEndDate),
        label: `${formatDate(dateToISO(customStartDate))} - ${formatDate(dateToISO(customEndDate))}`,
      };

      // Include the entire final day in the selected range.
      customPeriod.endDate.setHours(23, 59, 59, 999);

      if (!validateTimePeriod(customPeriod)) {
        showValidationError('Invalid custom date range');
        return;
      }

      currentPeriod = customPeriod;

      const customButton = periodButtons.get('custom');
      customButton.textContent = customPeriod.label;
      hideCustomRangeSelector();

      if (onChange) {
        onChange(currentPeriod);
      }
    } catch (error) {
      console.error('Error applying custom range:', error);
      showValidationError('Error applying custom date range');
    }
  }

  /**
   * Cancel custom range selection
   */
  function cancelCustomRange() {
    hideCustomRangeSelector();

    const customButton = periodButtons.get('custom');
    customButton.textContent = 'Custom Range';

    // Revert to previous period if it wasn't custom
    if (currentPeriod.type !== 'custom') {
      const previousButton = Array.from(periodButtons.values()).find(
        btn =>
          btn.classList.contains('active') && btn.dataset.period !== 'custom'
      );

      if (previousButton) {
        setActiveButton(previousButton);
      } else {
        handlePredefinedPeriodSelection(periods.find(p => p.key === 'month'));
      }
    }
  }

  /**
   * Show custom range selector
   */
  function showCustomRangeSelector() {
    customRangeContainer.style.display = 'flex';

    customRangeContainer.style.opacity = '0';
    customRangeContainer.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      customRangeContainer.style.transition = 'all 0.3s ease';
      customRangeContainer.style.opacity = '1';
      customRangeContainer.style.transform = 'translateY(0)';
    }, 10);
  }

  /**
   * Hide custom range selector
   */
  function hideCustomRangeSelector() {
    customRangeContainer.style.transition = 'all 0.3s ease';
    customRangeContainer.style.opacity = '0';
    customRangeContainer.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      customRangeContainer.style.display = 'none';
    }, 300);
  }

  /**
   * Set active button state - match FinancialPlanningView styling
   */
  function setActiveButton(activeButton) {
    navigationMessage.textContent = '';
    navigationMessage.style.display = 'none';
    periodButtons.forEach(button => {
      button.style.background = COLORS.SURFACE;
      button.style.color = COLORS.TEXT_MAIN;
      button.setAttribute('aria-selected', 'false');
      button.classList.remove('active');
    });

    activeButton.style.background = COLORS.PRIMARY;
    activeButton.style.color = 'white';
    activeButton.setAttribute('aria-selected', 'true');
    activeButton.classList.add('active');
  }

  /**
   * Show validation error message
   */
  function showValidationError(message) {
    const validationMessage = customRangeContainer._validationMessage;
    validationMessage.textContent = message;
    validationMessage.style.color = COLORS.ERROR;
    validationMessage.style.display = 'block';
  }

  /**
   * Hide validation error message
   */
  function hideValidationError() {
    const validationMessage = customRangeContainer._validationMessage;
    validationMessage.style.display = 'none';
  }

  /**
   * Validate time period object
   */
  function validateTimePeriod(period) {
    if (!period || !period.startDate || !period.endDate) {
      return false;
    }

    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }

    if (startDate > endDate) {
      return false;
    }

    return true;
  }

  /**
   * Handle responsive layout updates - match FinancialPlanningView exactly
   */
  function updateResponsiveLayout() {
    // FinancialPlanningView doesn't change tab styling based on screen size
    // The tabs maintain consistent styling across all devices
    // No need to update button styles - they're already responsive by design
  }

  window.addEventListener('resize', updateResponsiveLayout);

  // Cleanup function
  container.cleanup = () => {
    window.removeEventListener('resize', updateResponsiveLayout);
  };

  // Public API
  container.getCurrentPeriod = () => currentPeriod;
  container.setPeriod = period => {
    if (validateTimePeriod(period)) {
      currentPeriod = period;

      const matchingPeriod = periods.find(p => p.key === period.type);
      if (matchingPeriod) {
        setActiveButton(periodButtons.get(matchingPeriod.key));
      } else {
        // Handle custom monthly periods (like February, etc.)
        if (period.type === 'monthly') {
          const now = new Date();
          const currentMonthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );
          const periodStart = new Date(period.startDate);

          // If it's not the current month, use the Last Month button
          if (
            periodStart.getFullYear() !== currentMonthStart.getFullYear() ||
            periodStart.getMonth() !== currentMonthStart.getMonth()
          ) {
            const yearDiff = periodStart.getFullYear() - now.getFullYear();
            const monthDiff = periodStart.getMonth() - now.getMonth();
            const totalMonthOffset = yearDiff * 12 + monthDiff;

            setActiveButton(periodButtons.get('lastMonth'));

            const lastMonthButton = periodButtons.get('lastMonth');
            const labelSpan = lastMonthButton.querySelector('.tab-label');
            if (labelSpan) {
              labelSpan.textContent = period.label;
            }

            lastMonthButton.dataset.monthOffset = totalMonthOffset.toString();

            const rightArrow = lastMonthButton.querySelector('.arrow-right');
            if (rightArrow) {
              updateRightArrowVisibility(
                rightArrow,
                totalMonthOffset,
                'lastMonth'
              );
            }
          }
        } else if (period.type === 'quarterly') {
          const now = new Date();
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const periodStart = new Date(period.startDate);
          const periodQuarter = Math.floor(periodStart.getMonth() / 3);

          const yearDiff = periodStart.getFullYear() - now.getFullYear();
          const quarterDiff = periodQuarter - currentQuarter;
          const totalQuarterOffset = yearDiff * 4 + quarterDiff;

          setActiveButton(periodButtons.get('quarter'));

          const quarterButton = periodButtons.get('quarter');
          const labelSpan = quarterButton.querySelector('.tab-label');
          if (labelSpan) {
            labelSpan.textContent = period.label;
          }

          quarterButton.dataset.quarterOffset = totalQuarterOffset.toString();

          const rightArrow = quarterButton.querySelector('.arrow-right');
          if (rightArrow) {
            updateRightArrowVisibility(
              rightArrow,
              totalQuarterOffset,
              'quarter'
            );
          }
        } else if (period.type === 'daily') {
          // Daily periods always land on the Today tab
          const dayOffset = getDayOffsetFromDate(period.startDate);
          const todayButton = periodButtons.get('today');
          setActiveButton(todayButton);

          const labelSpan = todayButton.querySelector('.tab-label');
          if (labelSpan) {
            labelSpan.textContent = period.label;
          }

          todayButton.dataset.dayOffset = dayOffset.toString();
          const rightArrow = todayButton.querySelector('.arrow-right');
          if (rightArrow) {
            updateRightArrowVisibility(rightArrow, dayOffset, 'today');
          }
        }
      }
    }
  };

  return container;
};
