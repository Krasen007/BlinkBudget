# Backup/Restore Implementation - Actionable Tasks

## Current Status: ~80% Complete

### ✅ Completed
- Core BackupService with daily Firebase backups
- BackupRestoreSection UI component in Settings
- Service initialization in main.js
- Transaction restore functionality
- Backup verification system
- Event-driven progress tracking

### 🔄 Remaining Tasks

#### High Priority
- [ ] **Add visibilitychange listener** to BackupService.init() for backup triggers when users return to app
- [ ] **Display backup metadata** in UI (lastBackupDate, lastBackupDataAsOf) for user confidence
- [ ] **Complete full restore functionality** - restore Accounts, Goals, and Investments (not just transactions)
- [ ] **Add AccountService.clear() and batchSet() methods** for complete data replacement

#### Medium Priority
- [ ] **Add delete transactions after date functionality** to BackupRestoreSection UI
- [ ] **Implement error handling improvements** for offline/online edge cases
- [ ] **Add backup status indicators** (success/failure) in Settings

#### Low Priority
- [ ] **Add backup scheduling options** (manual vs automatic)
- [ ] **Implement backup encryption** for enhanced security
- [ ] **Add multiple backup retention** (keep last 7 days instead of just 1)

### 🔧 Implementation Notes

#### visibilitychange Listener
```javascript
// Add to BackupService.init()
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    this.checkAndCreateBackup();
  }
});
```

#### UI Metadata Display
```javascript
// Add to BackupRestoreSection
const lastBackupDate = SettingsService.getSetting('lastBackupDate');
const lastBackupDataAsOf = SettingsService.getSetting('lastBackupDataAsOf');
// Display to user
```

#### Full Restore
```javascript
// Extend restoreBackup() to handle all data types
if (backup.accounts) AccountService.clear(); AccountService.batchSet(backup.accounts);
if (backup.goals) GoalPlanner.clear(); GoalPlanner.batchSet(backup.goals);
if (backup.investments) InvestmentTracker.clear(); InvestmentTracker.batchSet(backup.investments);
```

#### AccountService Methods
```javascript
// Add to AccountService
clear() { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([])); }
batchSet(accounts) { this._persist(accounts, true); }
```

### 📋 Test Checklist
- [ ] Backup triggers on app startup
- [ ] Backup triggers on visibility change (once per day max)
- [ ] Restore replaces ALL data types
- [ ] UI shows last backup date
- [ ] Error handling works offline
- [ ] User warnings are clear for data loss

### 🎯 Success Criteria
- Users can fully restore app state from any backup
- Backup status is visible and trustworthy
- System handles edge cases gracefully
- No data loss scenarios remain
