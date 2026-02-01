/**
 * Data Management Section Component
 * Handles CSV export functionality
 */

import { Button } from './Button.js';
import { DateInput } from './DateInput.js';
import { TransactionService } from '../core/transaction-service.js';
import { AlertDialog } from './ConfirmDialog.js';
import {
  COLORS,
  SPACING,
  TOUCH_TARGETS,
  FONT_SIZES,
} from '../utils/constants.js';
import { getFirstDayOfMonthISO, getTodayISO } from '../utils/date-utils.js';

export const DataManagementSection = () => {
  const section = document.createElement('div');
  section.className = 'card mobile-settings-card';
  section.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Data Management';
  title.className = 'mobile-settings-title';
  Object.assign(title.style, {
    marginBottom: SPACING.MD,
    fontSize: FONT_SIZES.XL,
  });
  section.appendChild(title);

  // Date Range Container
  const dateRangeContainer = document.createElement('div');
  dateRangeContainer.className = 'mobile-date-range-form';
  Object.assign(dateRangeContainer.style, {
    display: 'flex',
    flexDirection: 'row',
    gap: SPACING.SM,
    marginBottom: SPACING.LG,
  });

  // Helper to create date input with label
  const createDateField = (labelText, initialValue, id) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'mobile-date-input-wrapper';
    wrapper.style.flex = '1';

    const dateComp = DateInput({
      value: initialValue,
      showLabel: false, // We render our own label above
    });
    // Override width to fill container
    Object.assign(dateComp.style, {
      width: '100%',
      marginRight: '0',
    });

    const input = dateComp.querySelector('input[type="date"]'); // Get internal input for value access
    if (input) input.id = id; // Set ID for tracking

    const lbl = document.createElement('label');
    lbl.textContent = labelText;
    lbl.htmlFor = id;
    Object.assign(lbl.style, {
      display: 'block',
      fontSize: FONT_SIZES.SM,
      fontWeight: '500',
      color: 'var(--color-text-muted)',
      marginBottom: SPACING.XS,
    });

    wrapper.appendChild(lbl);
    wrapper.appendChild(dateComp);

    return { wrapper, input: dateComp }; // Return component as input interface
  };

  const startInput = createDateField(
    'Start Date',
    getFirstDayOfMonthISO(),
    'export-start'
  );
  const endInput = createDateField('End Date', getTodayISO(), 'export-end');

  dateRangeContainer.appendChild(startInput.wrapper);
  dateRangeContainer.appendChild(endInput.wrapper);

  const exportBtn = Button({
    text: 'Export Transactions (CSV)',
    variant: 'primary',
    onClick: () => {
      const start = new Date(startInput.input.getDate());
      const end = new Date(endInput.input.getDate());
      end.setHours(23, 59, 59, 999);

      const transactions = TransactionService.getAll().filter(t => {
        const tDate = new Date(t.timestamp);
        return tDate >= start && tDate <= end;
      });

      if (transactions.length === 0) {
        AlertDialog({ message: 'No transactions found in this date range.' });
        return;
      }

      // Generate CSV
      const headers = ['Date', 'Type', 'Category', 'Amount'];
      const rows = transactions.map(t => [
        new Date(t.timestamp).toLocaleDateString(),
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
        t.category,
        (t.type === 'expense' ? -t.amount : t.amount).toFixed(2),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blinkbudget_export_${startInput.input.getDate()}_to_${endInput.input.getDate()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
  exportBtn.className += ' touch-target mobile-form-button';
  Object.assign(exportBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
  });

  section.appendChild(dateRangeContainer);
  section.appendChild(exportBtn);

  // Emergency Recovery Section
  const emergencyDivider = document.createElement('div');
  emergencyDivider.style.margin = `${SPACING.LG} 0`;
  emergencyDivider.style.borderTop = `1px solid ${COLORS.BORDER}`;
  section.appendChild(emergencyDivider);

  const emergencyTitle = document.createElement('h4');
  emergencyTitle.textContent = 'Recovery & Fail-safe';
  emergencyTitle.style.marginBottom = SPACING.SM;
  emergencyTitle.style.fontSize = FONT_SIZES.MD;
  emergencyTitle.style.color = 'var(--color-primary-light)';
  section.appendChild(emergencyTitle);

  const emergencyBtn = Button({
    text: '⚠️ Emergency JSON Export',
    variant: 'secondary',
    onClick: async () => {
      const { EmergencyService } = await import('../core/emergency-service.js');
      const result = EmergencyService.triggerEmergencyDownload();

      if (result.success) {
        // Dynamic import to avoid circular dependencies
        const { MobileAlert } = await import('./MobileModal.js');
        MobileAlert({
          title: 'Export Successful',
          message:
            'Your emergency data file has been downloaded. Keep this file safe!',
          buttonText: 'Got it',
        });
      }
    },
  });

  emergencyBtn.className += ' touch-target mobile-form-button';
  Object.assign(emergencyBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
    borderColor: 'var(--color-primary)',
    color: 'var(--color-primary-light)',
    background: 'rgba(255, 255, 255, 0.05)',
  });

  section.appendChild(emergencyBtn);

  return section;
};
