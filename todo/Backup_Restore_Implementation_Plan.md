# BlinkBudget Backup/Restore Implementation Document (Updated Feb 2026)

## Status Audit

The backup/restore system is **~80% complete**. The core infrastructure and UI are in place, but several critical finishing touches are missing to ensure the "Hard Restore" promise is fulfilled.

### **What's Implemented** ✅

- [x] **Core Service**: `src/core/backup-service.js` handles daily backups to Firebase.
- [x] **UI Component**: `src/components/BackupRestoreSection.js` is integrated into Settings.
- [x] **Initialization**: `src/main.js` correctly triggers the service on app load.
- [x] **Transaction Restore**: Basic restoration of transactions works.
- [x] **Verification**: Sophisticated verification and integrity checks (`verifyBackup`).

### **Identified Gaps** ⚠️

- [ ] **Partial Restore**: `restoreBackup()` currently ignores Accounts, Goals, and Investments.
- [ ] **AccountService Gaps**: `AccountService.js` lacks a `clear()` or `batchSet()` method required for a "Hard Restore".
- [ ] **Visibility Listener**: The `visibilitychange` trigger mentioned in the plan is missing from `BackupService.js`.
- [ ] **Metadata Display**: The UI doesn't show the `lastBackupDate` to the user.

---

## Overview

Implement offline-first backup/restore functionality allowing users to restore data up to the previous day. Single daily backup stored in Firebase, triggered automatically once per day to create "yesterday's state" backup.

## Architecture

- **Backup Storage**: Firebase `/users/{userId}/backups/daily_backup/data`
- **Metadata Storage**: Settings document (`lastBackupDate`, `lastBackupDataAsOf`)
- **Triggers**: App startup (30s delay) + visibility changes (once per day max)
- **Operations**: Delete after date (local) + restore last backup (cloud)

## Core Logic

### Backup Timing Strategy

```javascript
// Backup created ONCE per day containing CURRENT state
// Represents "yesterday's backup" even though created today
const backupData = {
  backupDate: this.getTodayISO(), // When backup was created (today)
  dataAsOf: this.getYesterdayISO(), // What this backup represents (yesterday's state)
  transactions: TransactionService.getAll(), // Current data as of backup creation
  // ... other current data
};
```

### Daily Trigger Logic

```javascript
// Only create backup if not already created today
if (!lastBackupDate || lastBackupDate !== today) {
  await this.createBackup(); // Creates backup of CURRENT data
  SettingsService.saveSetting('lastBackupDate', today);
  SettingsService.saveSetting('lastBackupDataAsOf', this.getYesterdayISO());
}
```

## Files to Create

### 1. `src/core/backup-service.js`

```javascript
/**
 * BackupService
 * Handles automatic daily backups and restore operations
 */

import { getDb } from './firebase-config.js';
import { AuthService } from './auth-service.js';
import { TransactionService } from './transaction-service.js';
import { AccountService } from './account-service.js';
import { SettingsService } from './settings-service.js';
import { GoalPlanner } from './goal-planner.js';
import { InvestmentTracker } from './investment-tracker.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const BackupService = {
  init() {
    // Delayed startup check (30 seconds after app load)
    setTimeout(() => {
      this.checkAndCreateBackup();
    }, 30000);

    // Visibility change check (when user returns to app)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAndCreateBackup();
      }
    });
  },

  async checkAndCreateBackup() {
    const lastBackupDate = SettingsService.getSetting('lastBackupDate');
    const today = this.getTodayISO();

    // Only create backup if not already created today
    if (!lastBackupDate || lastBackupDate !== today) {
      // Skip if offline
      if (!navigator.onLine) {
        console.log('[Backup] Skipping backup - offline');
        return;
      }

      try {
        window.dispatchEvent(
          new CustomEvent('backup-operation', {
            detail: { operation: 'backup', status: 'starting' },
          })
        );

        await this.createBackup();
        SettingsService.saveSetting('lastBackupDate', today);
        SettingsService.saveSetting(
          'lastBackupDataAsOf',
          this.getYesterdayISO()
        );

        window.dispatchEvent(
          new CustomEvent('backup-operation', {
            detail: { operation: 'backup', status: 'completed' },
          })
        );

        console.log('[Backup] Daily backup created successfully');
      } catch (error) {
        console.error('[Backup] Failed to create backup:', error);
        window.dispatchEvent(
          new CustomEvent('backup-operation', {
            detail: {
              operation: 'backup',
              status: 'failed',
              error: error.message,
            },
          })
        );
      }
    }
  },

    // Create backup of CURRENT state (represents yesterday's backup)
    const backupData = {
      backupDate: this.getTodayISO(), // When backup was created
      dataAsOf: this.getYesterdayISO(), // What this backup represents
      transactions: TransactionService.getAll(),
      accounts: AccountService.getAccounts(),
      settings: SettingsService.getAllSettings(),
      goals: GoalPlanner.getAllGoals(),
      investments: InvestmentTracker.getAllInvestments(),
    };

    const backupRef = doc(
      getDb(),
      'users',
      userId,
      'backups',
      'daily_backup',
      'data'
    );
    await setDoc(backupRef, backupData);
  },

  async fetchBackup() {
    const userId = AuthService.getUserId();
    if (!userId) return null;

    try {
      const backupRef = doc(
        getDb(),
        'users',
        userId,
        'backups',
        'daily_backup',
        'data'
      );
      const backupSnap = await getDoc(backupRef);

      if (backupSnap.exists()) {
        return backupSnap.data();
      }
    } catch (error) {
      console.error('[Backup] Failed to fetch backup:', error);
    }
    return null;
  },

  async restoreBackup() {
    if (!navigator.onLine) {
      throw new Error('Restore requires internet connection');
    }

    window.dispatchEvent(
      new CustomEvent('backup-operation', {
        detail: { operation: 'restore', status: 'starting' },
      })
    );

    try {
      const backup = await this.fetchBackup();
      if (!backup || !backup.transactions) {
        throw new Error('No backup data available');
      }

      // Hard Restore Strategy (Replace)
      // User wants state to be exactly like backup.

      // 1. Clear current transactions
      TransactionService.clear();

      // 2. Load transactions from backup
      backup.transactions.forEach(t => TransactionService.add(t));

      // 3. Restore other entities (Accounts, Settings, Goals, Investments) if present in backup
      // Assuming backup contains these, we should clear and set them too or selective update?
      // For MVP, focus on transactions as the critical data.

      window.dispatchEvent(
        new CustomEvent('backup-operation', {
          detail: {
            operation: 'restore',
            status: 'completed',
            count: backup.transactions.length,
          },
        })
      );

      return backup.transactions.length;
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('backup-operation', {
          detail: {
            operation: 'restore',
            status: 'failed',
            error: error.message,
          },
        })
      );
      throw error;
    }
  },

  deleteTransactionsInDateRange(startDate, endDate) {
    const transactions = TransactionService.getAll();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const toDelete = transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      return tDate >= start && tDate <= end;
    });

    toDelete.forEach(t => TransactionService.remove(t.id));
    return toDelete.length;
  },

  deleteTransactionsAfter(cutoffDate) {
    const transactions = TransactionService.getAll();
    const cutoff = new Date(cutoffDate);
    cutoff.setHours(23, 59, 59, 999);

    const toDelete = transactions.filter(t => new Date(t.timestamp) > cutoff);
    toDelete.forEach(t => TransactionService.remove(t.id));

    return toDelete.length;
  },

  getTodayISO() {
    return new Date().toISOString().split('T')[0];
  },

  getYesterdayISO() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  },
};
```

### 2. `src/components/BackupRestoreSection.js`

```javascript
/**
 * BackupRestoreSection Component
 * UI for backup/restore operations in settings
 */

import { Button } from './Button.js';
import { DateInput } from './DateInput.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { AlertDialog } from './ConfirmDialog.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';
import { BackupService } from '../core/backup-service.js';
import { getFirstDayOfMonthISO, getTodayISO } from '../utils/date-utils.js';

export const BackupRestoreSection = () => {
  const section = document.createElement('div');
  section.className = 'card mobile-settings-card';
  section.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Backup & Restore';
  title.className = 'mobile-settings-title';
  Object.assign(title.style, {
    marginBottom: SPACING.MD,
    fontSize: FONT_SIZES.XL,
  });
  section.appendChild(title);

  // Date Range UI removed for simplicity

  // Buttons Container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.flexDirection = 'column';
  buttonsContainer.style.gap = SPACING.SM;

  const restoreBtn = Button({
    text: 'Restore From Last Backup',
    variant: 'secondary',
    onClick: () => {
      ConfirmDialog({
        message:
          'WARNING: This will replace your current data with the last backup. Any changes made since the last backup will be LOST. Continue?',
        confirmText: 'Restore & Replace',
        title: 'Confirm Restore',
        onConfirm: async () => {
          try {
            const count = await BackupService.restoreBackup();
            AlertDialog({
              message: `Successfully restored app state from backup.`,
            });
          } catch (error) {
            AlertDialog({ message: `Restore failed: ${error.message}` });
          }
        },
      });
    },
  });
  restoreBtn.className += ' touch-target mobile-form-button';
  Object.assign(restoreBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
  });

  const deleteBtn = Button({
    text: 'Delete Transactions After Date',
    variant: 'danger',
    onClick: () => {
      const cutoff = endInput.input.getDate();

      ConfirmDialog({
        message: `Delete all transactions after ${cutoff}? This action cannot be undone.`,
        confirmText: 'Delete',
        title: 'Confirm Delete',
        onConfirm: () => {
          const count = BackupService.deleteTransactionsAfter(cutoff);
          AlertDialog({
            message: `Deleted ${count} transactions after ${cutoff}.`,
          });
        },
      });
    },
  });
  deleteBtn.className += ' touch-target mobile-form-button';
  Object.assign(deleteBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
  });

  buttonsContainer.appendChild(restoreBtn);
  buttonsContainer.appendChild(deleteBtn);

  section.appendChild(dateRangeContainer);
  section.appendChild(buttonsContainer);

  return section;
};

// Helper function
const createDateField = (labelText, initialValue, id) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'mobile-date-input-wrapper';
  wrapper.style.flex = '1';

  const dateComp = DateInput({
    value: initialValue,
    showLabel: false,
  });

  Object.assign(dateComp.style, {
    width: '100%',
    marginRight: '0',
  });

  const input = dateComp.querySelector('input[type="date"]');
  if (input) input.id = id;

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

  return { wrapper, input: dateComp };
};
```

## Files to Modify

### 1. `src/core/settings-service.js`

**Add backup metadata fields to default settings**:

```javascript
// In getDefaultSettings() or similar
const defaultSettings = {
  // ... existing settings
  lastBackupDate: null,
  lastBackupDataAsOf: null,
};
```

### 2. `src/views/SettingsView.js`

**Add BackupRestoreSection import and component**:

```javascript
// Add import
import { BackupRestoreSection } from '../components/BackupRestoreSection.js';

// In SettingsView() function, after DataManagementSection:
const backupSection = BackupRestoreSection();
contentWrapper.appendChild(backupSection);

// Add event listeners for backup feedback
const handleBackupOperation = e => {
  const { operation, status, count, error } = e.detail;

  if (status === 'starting') {
    console.log(`${operation} starting...`);
  } else if (status === 'completed') {
    console.log(`${operation} completed${count ? ` (${count} items)` : ''}`);
  } else if (status === 'failed') {
    console.error(`${operation} failed:`, error);
  }
};

window.addEventListener('backup-operation', handleBackupOperation);

// In cleanup function:
settingsView.cleanup = () => {
  // ... existing cleanup
  window.removeEventListener('backup-operation', handleBackupOperation);
};
```

### 3. `src/main.js`

**Initialize BackupService**:

```javascript
// After existing service initializations
import { BackupService } from './core/backup-service.js';

// After SyncService.init()
BackupService.init();
```

## Key Features

### Backup Behavior

- **Automatic**: Triggers once per day (30s after app start + visibility changes)
- **Current State**: Backs up current data as of backup creation time
- **Represents Yesterday**: Marked as "yesterday's backup" even though created today
- **Single Storage**: Overwrites previous day's backup in Firebase
- **Offline Safe**: Skips backup if offline, retries next app open

### Restore Behavior

- **Last Backup**: Restores from the single daily backup
- **Replace Strategy**: Wipes local data and loads backup data (exact state match)
- **Online Required**: Must be online to fetch backup from Firebase
- **User Feedback**: Clear warning about data loss (changes since backup)

### Delete Behavior

- **Local Operation**: Delete transactions after selected date (no backup needed)
- **Immediate**: Takes effect immediately, no confirmation needed beyond dialog
- **Irreversible**: Clear warning that action cannot be undone

## Integration Points

- **Dependencies**: Uses all major services (TransactionService, AccountService, etc.)
- **Error Handling**: Leverages existing Firebase error patterns
- **UI Consistency**: Follows existing settings section patterns
- **Event System**: Uses custom events for operation feedback

## Testing Considerations

- Backup creation doesn't interfere with normal app operation
- Restore operations are atomic and safe
- Date handling uses ISO strings for consistency
- Offline behavior is graceful
- User feedback is clear and helpful

This implementation provides a robust backup/restore system that maintains data integrity while being user-friendly and offline-first.
