/**
 * Data Management Section Component
 * Handles CSV export functionality
 */

import { Button } from './Button.js';
import { DateInput } from './DateInput.js';
import { TransactionService } from '../core/transaction-service.js';
import {
  COLORS,
  SPACING,
  TOUCH_TARGETS,
  FONT_SIZES,
} from '../utils/constants.js';
import { getFirstDayOfMonthISO, getTodayISO } from '../utils/date-utils.js';
import { showWarningToast } from '../utils/toast-notifications.js';

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
        showWarningToast('No transactions found in this date range.', {
          duration: 4000,
          persistent: false,
        });
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
      try {
        // Show loading state
        emergencyBtn.disabled = true;
        emergencyBtn.textContent = '⏳ Exporting...';

        const { EmergencyExportService } =
          await import('../core/emergency-export-service.js');
        const result = await EmergencyExportService.createEmergencyExport();

        if (result.success) {
          // Dynamic import to avoid circular dependencies
          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: 'Export Successful',
            message: `Your emergency data file has been downloaded. File size: ${(result.size / 1024).toFixed(1)}KB`,
            buttonText: 'Got it',
          });
        } else {
          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: 'Export Failed',
            message: `Failed to export data: ${result.error}`,
            buttonText: 'OK',
          });
        }
      } catch (error) {
        console.error('Emergency export failed:', error);
        const { MobileAlert } = await import('./MobileModal.js');
        MobileAlert({
          title: 'Export Failed',
          message: `An unexpected error occurred: ${error.message}`,
          buttonText: 'OK',
        });
      } finally {
        // Reset button state
        emergencyBtn.disabled = false;
        emergencyBtn.textContent = '⚠️ Emergency JSON Export';
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

  // Add spacing
  const spacing = document.createElement('div');
  spacing.style.marginBottom = SPACING.SM;
  section.appendChild(spacing);

  // Data Integrity Check Button
  const integrityBtn = Button({
    text: '🔍 Data Integrity Check',
    variant: 'secondary',
    onClick: async () => {
      try {
        // Show loading state
        integrityBtn.disabled = true;
        integrityBtn.textContent = '🔍 Checking...';

        const { dataIntegrityService } =
          await import('../core/data-integrity-service.js');
        const result = await dataIntegrityService.performIntegrityCheck();

        if (result.summary.corruptionDetected) {
          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: '⚠️ Data Issues Found',
            message: `Found ${result.issues.length} data issues. ${result.summary.failedChecks} checks failed. Please review your data.`,
            buttonText: 'View Details',
          });

          // Show detailed report in console for now
          console.group('Data Integrity Report');
          console.log('Summary:', result.summary);
          console.log('Issues:', result.issues);
          console.log('Recommendations:', result.recommendations);
          console.groupEnd();
        } else {
          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: '✅ Data Integrity OK',
            message: `All ${result.summary.totalChecks} checks passed. Your data is healthy!`,
            buttonText: 'Great!',
          });
        }
      } catch (error) {
        console.error('Data integrity check failed:', error);
        const { MobileAlert } = await import('./MobileModal.js');
        MobileAlert({
          title: 'Check Failed',
          message: `Integrity check failed: ${error.message}`,
          buttonText: 'OK',
        });
      } finally {
        // Reset button state
        integrityBtn.disabled = false;
        integrityBtn.textContent = '🔍 Data Integrity Check';
      }
    },
  });

  integrityBtn.className += ' touch-target mobile-form-button';
  Object.assign(integrityBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
    borderColor: 'var(--color-success)',
    color: 'var(--color-success-light)',
    background: 'rgba(255, 255, 255, 0.05)',
  });

  section.appendChild(integrityBtn);

  // Add spacing
  const spacing2 = document.createElement('div');
  spacing2.style.marginBottom = SPACING.SM;
  section.appendChild(spacing2);

  // Data Cleanup Button
  const cleanupBtn = Button({
    text: '🔧 Fix Data Issues',
    variant: 'secondary',
    onClick: async () => {
      try {
        // Show loading state
        cleanupBtn.disabled = true;
        cleanupBtn.textContent = '🔧 Fixing...';

        const { DataCleanupService } =
          await import('../core/data-cleanup-service.js');
        const result = await DataCleanupService.fixTransactionDataIssues();

        if (result.fixed > 0) {
          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: '✅ Data Fixed',
            message: `Successfully fixed ${result.fixed} data issues. ${result.errors} errors occurred.`,
            buttonText: 'Great!',
          });

          // Show details in console
          console.group('Data Cleanup Results');
          console.log('Fixed:', result.fixed);
          console.log('Errors:', result.errors);
          console.log('Details:', result.details);
          console.groupEnd();
        } else {
          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: 'ℹ️ No Issues Found',
            message: 'No data issues were found that needed fixing.',
            buttonText: 'OK',
          });
        }
      } catch (error) {
        console.error('Data cleanup failed:', error);
        const { MobileAlert } = await import('./MobileModal.js');
        MobileAlert({
          title: 'Cleanup Failed',
          message: `Data cleanup failed: ${error.message}`,
          buttonText: 'OK',
        });
      } finally {
        // Reset button state
        cleanupBtn.disabled = false;
        cleanupBtn.textContent = '🔧 Fix Data Issues';
      }
    },
  });

  cleanupBtn.className += ' touch-target mobile-form-button';
  Object.assign(cleanupBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
    borderColor: 'var(--color-warning)',
    color: 'var(--color-warning-light)',
    background: 'rgba(255, 255, 255, 0.05)',
  });

  section.appendChild(cleanupBtn);

  // Add spacing
  const spacing3 = document.createElement('div');
  spacing3.style.marginBottom = SPACING.SM;
  section.appendChild(spacing3);

  // Emergency Recovery Button
  const recoveryBtn = Button({
    text: '🚨 Emergency Recovery',
    variant: 'secondary',
    onClick: async () => {
      try {
        // Show loading state
        recoveryBtn.disabled = true;
        recoveryBtn.textContent = '🚨 Recovering...';

        const { emergencyRecoveryService } =
          await import('../core/emergency-recovery-service.js');
        const result =
          await emergencyRecoveryService.performEmergencyRecovery();

        if (result.success) {
          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: '✅ Recovery Successful',
            message: `Recovered ${result.dataRestored.transactions} transactions and ${result.dataRestored.accounts} accounts.`,
            buttonText: 'Great!',
          });

          // Show details in console
          console.group('Emergency Recovery Results');
          console.log('Success:', result.success);
          console.log('Data Restored:', result.dataRestored);
          console.log('Steps:', result.steps);
          console.groupEnd();
        } else {
          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: '⚠️ Recovery Failed',
            message: `Recovery failed with ${result.errors.length} errors. Check console for details.`,
            buttonText: 'OK',
          });

          console.group('Emergency Recovery Errors');
          console.error('Errors:', result.errors);
          console.error('Warnings:', result.warnings);
          console.groupEnd();
        }
      } catch (error) {
        console.error('Emergency recovery failed:', error);
        const { MobileAlert } = await import('./MobileModal.js');
        MobileAlert({
          title: 'Recovery Failed',
          message: `Emergency recovery failed: ${error.message}`,
          buttonText: 'OK',
        });
      } finally {
        // Reset button state
        recoveryBtn.disabled = false;
        recoveryBtn.textContent = '🚨 Emergency Recovery';
      }
    },
  });

  recoveryBtn.className += ' touch-target mobile-form-button';
  Object.assign(recoveryBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
    borderColor: 'var(--color-danger)',
    color: 'var(--color-danger-light)',
    background: 'rgba(255, 255, 255, 0.05)',
  });

  section.appendChild(recoveryBtn);

  // Add spacing
  const spacing4 = document.createElement('div');
  spacing4.style.marginBottom = SPACING.SM;
  section.appendChild(spacing4);

  // Restore from Backup Button
  const restoreBtn = Button({
    text: '📂 Restore from Backup',
    variant: 'secondary',
    onClick: async () => {
      try {
        // Show loading state
        restoreBtn.disabled = true;
        restoreBtn.textContent = '📂 Restoring...';

        // Find available backups
        const backupKeys = Object.keys(localStorage).filter(
          key =>
            key.startsWith('cleanup_backup_') ||
            key.startsWith('emergency_backup_')
        );

        if (backupKeys.length === 0) {
          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: 'ℹ️ No Backups Found',
            message: 'No backup files found to restore from.',
            buttonText: 'OK',
          });
          return;
        }

        // Use the most recent backup
        const latestBackup = backupKeys.sort().pop();
        const backupData = JSON.parse(localStorage.getItem(latestBackup));

        if (backupData && backupData.transactions) {
          // Restore transactions
          const { TransactionService } =
            await import('../core/transaction-service.js');
          TransactionService.clear();
          backupData.transactions.forEach(transaction => {
            TransactionService.add(transaction);
          });

          const { MobileAlert } = await import('./MobileModal.js');
          MobileAlert({
            title: '✅ Restore Successful',
            message: `Restored ${backupData.transactions.length} transactions from backup.`,
            buttonText: 'Great!',
          });

          console.group('Backup Restore Results');
          console.log('Restored from:', latestBackup);
          console.log('Transactions:', backupData.transactions.length);
          console.log('Backup timestamp:', backupData.timestamp);
          console.groupEnd();
        }
      } catch (error) {
        console.error('Backup restore failed:', error);
        const { MobileAlert } = await import('./MobileModal.js');
        MobileAlert({
          title: 'Restore Failed',
          message: `Backup restore failed: ${error.message}`,
          buttonText: 'OK',
        });
      } finally {
        // Reset button state
        restoreBtn.disabled = false;
        restoreBtn.textContent = '📂 Restore from Backup';
      }
    },
  });

  restoreBtn.className += ' touch-target mobile-form-button';
  Object.assign(restoreBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
    borderColor: 'var(--color-info)',
    color: 'var(--color-info-light)',
    background: 'rgba(255, 255, 255, 0.05)',
  });

  section.appendChild(restoreBtn);

  return section;
};
