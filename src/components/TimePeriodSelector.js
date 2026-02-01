/**
 * Time Period Selector Component
 *
 * Provides a comprehensive time period selection interface with daily, weekly,
 * monthly, and custom period options. Includes date range validation and selection.
 *
 * Requirements: 1.2, 2.5
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { DateInput } from './DateInput.js';
import { formatDate, dateToISO } from '../utils/date-utils.js';
import {
  getCurrentMonthPeriod,
  getCurrentQuarterPeriod,
  getTodayPeriod,
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

  // State management
  let currentPeriod = initialPeriod;
  let customStartDate = null;
  let customEndDate = null;

  // Create main selector buttons container - exact match to FinancialPlanningView
  const buttonsContainer = document.createElement('nav');
  buttonsContainer.className = 'financial-planning-nav'; // Use same class name
  buttonsContainer.setAttribute('role', 'tablist');
  buttonsContainer.style.display = 'grid';
  buttonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';

  buttonsContainer.style.gap = SPACING.SM;
  buttonsContainer.style.marginBottom = SPACING.LG;
  buttonsContainer.style.flexWrap = 'wrap'; // Allow wrapping
  buttonsContainer.style.maxWidth = '100%';

  // Hide scrollbar for webkit browsers - exact match to FinancialPlanningView
  const style = document.createElement('style');
  style.textContent = `
    .financial-planning-nav::-webkit-scrollbar {
      display: none;
    }
  `;
  document.head.appendChild(style);

  // Define available time periods
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

  // Add custom period option if enabled
  if (showCustomRange) {
    periods.push({ key: 'custom', label: 'Custom Range', getValue: null });
  }

  // Create period buttons
  const periodButtons = new Map();
  periods.forEach(period => {
    const button = createPeriodButton(period);
    periodButtons.set(period.key, button);
    buttonsContainer.appendChild(button);
  });

  // Create custom date range selector (initially hidden)
  const customRangeContainer = createCustomRangeSelector();

  // Assemble the component
  container.appendChild(buttonsContainer);
  if (showCustomRange) {
    container.appendChild(customRangeContainer);
  }

  /**
   * Create a period selection button
   */
  function createPeriodButton(period) {
    // Map period types to button keys
    const typeToKeyMap = {
      daily: 'today',
      monthly: 'month',
      lastMonth: 'lastMonth',
      quarterly: 'quarter',
      yearly: 'year',
      custom: 'custom',
    };

    // Set active state for initial period
    // For monthly periods, we need to check if it's last month vs current month
    let initialKey = 'month'; // default
    if (initialPeriod.type === 'monthly') {
      // Check if this is last month by comparing dates
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
    button.className = 'financial-planning-tab'; // Use same class name as FinancialPlanningView
    button.dataset.period = period.key;

    // Initialize month offset for last month button and year offset for year button
    if (period.key === 'lastMonth') {
      button.dataset.monthOffset = '-1';
    } else if (period.key === 'year') {
      button.dataset.yearOffset = '0';
    }

    button.setAttribute('role', 'tab');
    button.setAttribute(
      'aria-selected',
      period.key === initialKey ? 'true' : 'false'
    );
    button.setAttribute('aria-controls', `${period.key}-panel`);
    button.id = `${period.key}-tab`;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'tab-label';

    // Set initial label for Last Month and Year buttons
    if (period.key === 'lastMonth') {
      labelSpan.textContent = 'Last Month';
    } else if (period.key === 'year') {
      labelSpan.textContent = 'This Year';
    } else {
      labelSpan.textContent = period.label;
    }

    // Add arrow for Last Month and Year buttons
    if (period.key === 'lastMonth' || period.key === 'year') {
      const arrowContainer = document.createElement('div');
      arrowContainer.style.display = 'flex';
      arrowContainer.style.alignItems = 'center';
      arrowContainer.style.justifyContent = 'flex-start'; // Anchor to left
      arrowContainer.style.width = '100%';
      arrowContainer.style.position = 'relative';

      // Left arrow for navigation - fixed position
      const leftArrow = document.createElement('span');
      leftArrow.innerHTML = '←';
      leftArrow.style.fontSize = '1.2em';
      leftArrow.style.position = 'absolute';
      leftArrow.style.left = '-5px'; // Why is -5px? it is not fixed exactly on the left side
      leftArrow.style.top = '50%';
      leftArrow.style.transform = 'translateY(-50%)';
      leftArrow.style.cursor = 'pointer';
      leftArrow.style.padding = `${SPACING.XS}`;
      leftArrow.style.borderRadius = 'var(--radius-sm)';
      leftArrow.style.transition = 'background 0.2s ease';
      leftArrow.style.zIndex = '1';

      // Add hover effect for arrow
      leftArrow.addEventListener('mouseenter', () => {
        leftArrow.style.background = 'rgba(255, 255, 255, 0.1)';
      });
      leftArrow.addEventListener('mouseleave', () => {
        leftArrow.style.background = 'transparent';
      });

      // Arrow click handler for navigation
      leftArrow.addEventListener('click', e => {
        e.stopPropagation(); // Prevent button click

        if (period.key === 'lastMonth') {
          // Handle month navigation
          const currentOffset = parseInt(button.dataset.monthOffset || '-1');
          const newOffset = currentOffset - 1;
          button.dataset.monthOffset = newOffset.toString();
          const newPeriod = getSpecificMonthPeriod(newOffset);
          handleMonthNavigation(newPeriod);
        } else if (period.key === 'year') {
          // Handle year navigation
          const currentOffset = parseInt(button.dataset.yearOffset || '0');
          const newOffset = currentOffset - 1;
          button.dataset.yearOffset = newOffset.toString();
          const newPeriod = getSpecificYearPeriod(newOffset);
          handleYearNavigation(newPeriod);
        }
      });

      // Text container with left padding for arrow
      const textContainer = document.createElement('span');
      textContainer.style.paddingLeft = '28px'; // Space for arrow
      textContainer.style.display = 'block';
      textContainer.appendChild(labelSpan);

      arrowContainer.appendChild(leftArrow);
      arrowContainer.appendChild(textContainer);
      button.appendChild(arrowContainer);
    } else {
      button.appendChild(labelSpan);
    }

    // Exact same styling as FinancialPlanningView tabs
    Object.assign(button.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.XS,
      padding: `${SPACING.MD} ${SPACING.XL}`,
      minHeight: 'var(--touch-target-min)',
      minWidth: 'var(--touch-target-min)',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      background: period.key === initialKey ? COLORS.PRIMARY : COLORS.SURFACE,
      color: period.key === initialKey ? 'white' : COLORS.TEXT_MAIN,
      cursor: 'pointer',
      fontSize: 'var(--font-size-md)',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s ease',
      flex: '1 0 auto', // Grow to fill space, but respect content size
    });
    button.addEventListener('click', () => {
      if (period.key === 'custom') {
        handleCustomPeriodSelection();
      } else {
        handlePredefinedPeriodSelection(period);
      }
    });

    // Add hover effects matching FinancialPlanningView
    button.addEventListener('mouseenter', () => {
      if (period.key !== initialKey) {
        button.style.background = COLORS.SURFACE_HOVER;
      }
    });

    button.addEventListener('mouseleave', () => {
      if (period.key !== initialKey) {
        button.style.background = COLORS.SURFACE;
      }
    });

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

    // Title
    const title = document.createElement('h4');
    title.textContent = 'Select Custom Date Range';
    title.style.margin = '0';
    title.style.fontSize = FONT_SIZES.BASE;
    title.style.color = COLORS.TEXT_MAIN;
    title.style.textAlign = 'center';

    // Date inputs container
    const dateInputsContainer = document.createElement('div');
    dateInputsContainer.style.display = 'flex';
    dateInputsContainer.style.gap = SPACING.MD;
    dateInputsContainer.style.alignItems = 'center';
    dateInputsContainer.style.justifyContent = 'center';
    dateInputsContainer.style.flexWrap = 'wrap';

    // Start date input
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

    // Separator
    const separator = document.createElement('div');
    separator.textContent = '—';
    separator.style.color = COLORS.TEXT_MUTED;
    separator.style.fontSize = FONT_SIZES.LG;
    separator.style.margin = `0 ${SPACING.SM}`;

    // End date input
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

    // Action buttons
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

    // Validation message
    const validationMessage = document.createElement('div');
    validationMessage.className = 'validation-message';
    validationMessage.style.display = 'none';
    validationMessage.style.fontSize = FONT_SIZES.SM;
    validationMessage.style.textAlign = 'center';
    validationMessage.style.marginTop = SPACING.XS;

    // Assemble custom range selector
    dateInputsContainer.appendChild(startDateContainer);
    dateInputsContainer.appendChild(separator);
    dateInputsContainer.appendChild(endDateContainer);

    actionsContainer.appendChild(cancelButton);
    actionsContainer.appendChild(applyButton);

    customContainer.appendChild(title);
    customContainer.appendChild(dateInputsContainer);
    customContainer.appendChild(validationMessage);
    customContainer.appendChild(actionsContainer);

    // Store references for later use
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

    // For predefined periods, compare start and end dates
    const start1 = new Date(period1.startDate).getTime();
    const end1 = new Date(period1.endDate).getTime();
    const start2 = new Date(period2.startDate).getTime();
    const end2 = new Date(period2.endDate).getTime();

    return start1 === start2 && end1 === end2;
  }

  /**
   * Handle month navigation
   */
  function handleMonthNavigation(newPeriod) {
    try {
      // Validate the period
      if (!validateTimePeriod(newPeriod)) {
        showValidationError('Invalid time period selected');
        return;
      }

      // Update state
      currentPeriod = newPeriod;

      // Update UI - set Last Month button as active
      setActiveButton(periodButtons.get('lastMonth'));
      hideCustomRangeSelector();

      // Update the Last Month button label to show the actual month
      const lastMonthButton = periodButtons.get('lastMonth');
      const labelSpan = lastMonthButton.querySelector('.tab-label');
      if (labelSpan) {
        labelSpan.textContent = newPeriod.label;
      }

      // Notify parent component but with a flag to prevent full recreation
      if (onChange) {
        onChange(currentPeriod, { isNavigation: true });
      }
    } catch (error) {
      console.error('Error navigating to month:', error);
      showValidationError('Error navigating to month');
    }
  }

  /**
   * Handle year navigation
   */
  function handleYearNavigation(newPeriod) {
    try {
      // Validate the period
      if (!validateTimePeriod(newPeriod)) {
        showValidationError('Invalid time period selected');
        return;
      }

      // Update state
      currentPeriod = newPeriod;

      // Update UI - set Year button as active
      setActiveButton(periodButtons.get('year'));
      hideCustomRangeSelector();

      // Update the Year button label to show the actual year
      const yearButton = periodButtons.get('year');
      const labelSpan = yearButton.querySelector('.tab-label');
      if (labelSpan) {
        labelSpan.textContent = newPeriod.label;
      }

      // Notify parent component but with a flag to prevent full recreation
      if (onChange) {
        onChange(currentPeriod, { isNavigation: true });
      }
    } catch (error) {
      console.error('Error navigating to year:', error);
      showValidationError('Error navigating to year');
    }
  }

  /**
   * Handle predefined period selection
   */
  function handlePredefinedPeriodSelection(period) {
    try {
      const newPeriod = period.getValue();

      // Validate the period
      if (!validateTimePeriod(newPeriod)) {
        showValidationError('Invalid time period selected');
        return;
      }

      // Check if the selected period is the same as current period
      if (isSamePeriod(currentPeriod, newPeriod)) {
        // Same period selected, just ensure UI is correct but don't trigger change
        setActiveButton(periodButtons.get(period.key));
        hideCustomRangeSelector();
        return;
      }

      // Update state
      currentPeriod = newPeriod;

      // Update UI
      setActiveButton(periodButtons.get(period.key));
      hideCustomRangeSelector();

      // Notify parent component
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

    // Initialize with current period dates if available
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

    // Clear previous validation state
    validationMessage.style.display = 'none';
    applyButton.disabled = true;

    if (!customStartDate || !customEndDate) {
      return; // Wait for both dates to be selected
    }

    // Validate date range
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

    // Check for future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (customEndDate > today) {
      showValidationError('End date cannot be in the future');
      return;
    }

    // All validations passed
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
      // Create custom period object
      const customPeriod = {
        type: 'custom',
        startDate: new Date(customStartDate),
        endDate: new Date(customEndDate),
        label: `${formatDate(dateToISO(customStartDate))} - ${formatDate(dateToISO(customEndDate))}`,
      };

      // Set end date to end of day
      customPeriod.endDate.setHours(23, 59, 59, 999);

      // Validate the custom period
      if (!validateTimePeriod(customPeriod)) {
        showValidationError('Invalid custom date range');
        return;
      }

      // Update state
      currentPeriod = customPeriod;

      // Update button label to show selected range
      const customButton = periodButtons.get('custom');
      customButton.textContent = customPeriod.label;

      // Hide custom range selector
      hideCustomRangeSelector();

      // Notify parent component
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

    // Reset custom button label
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
        // Default to current month
        handlePredefinedPeriodSelection(periods.find(p => p.key === 'month'));
      }
    }
  }

  /**
   * Show custom range selector
   */
  function showCustomRangeSelector() {
    customRangeContainer.style.display = 'flex';

    // Animate in
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
    // Reset all buttons
    periodButtons.forEach(button => {
      button.style.background = COLORS.SURFACE;
      button.style.color = COLORS.TEXT_MAIN;
      button.setAttribute('aria-selected', 'false');
      button.classList.remove('active');
    });

    // Set active button
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

    // Check for valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }

    // Check date order
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

  // Add responsive listener
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

      // Update UI to reflect the new period
      const matchingPeriod = periods.find(p => p.key === period.type);
      if (matchingPeriod) {
        setActiveButton(periodButtons.get(matchingPeriod.key));
      }
    }
  };

  return container;
};
