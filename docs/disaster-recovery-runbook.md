## Before Using This Runbook

### Placeholders to Replace

This runbook contains the following placeholders that must be replaced with your actual values:

- `PROJECT_ID`: Your Firebase project ID (found in Firebase Console → Project Settings)
- `SITE_ID`: Your Netlify site ID (found in Netlify Dashboard → Site Settings)

### How to Find These Values

1. **Firebase PROJECT_ID**:
   - Visit https://console.firebase.google.com
   - Select your project
   - Go to Project Settings → General
   - Copy the "Project ID"

2. **Netlify SITE_ID**:
   - Visit https://app.netlify.com
   - Select your site
   - Go to Site Settings → General
   - Copy the "Site ID" from the URL or settings page

### Security Note

Always replace or redact these placeholders before sharing this document with external parties.

---

This runbook provides procedures for handling disaster recovery scenarios for BlinkBudget, ensuring business continuity and data integrity.

## Table of Contents

1. [Emergency Contacts](#emergency-contacts)
2. [Disaster Classification](#disaster-classification)
3. [Immediate Response Procedures](#immediate-response-procedures)
4. [Data Recovery Procedures](#data-recovery-procedures)
5. [Service Recovery Procedures](#service-recovery-procedures)
6. [Communication Procedures](#communication-procedures)
7. [Post-Recovery Procedures](#post-recovery-procedures)
8. [Testing and Validation](#testing-and-validation)
9. [Preventive Measures](#preventive-measures)

---

## Emergency Contacts

### Primary Team

#### Level 1 (Critical) - Immediate Synchronous Escalation

- **Developer**: +1-XXX-XXX-XXXX, developer@blinkbudget.netlify.app
- **Project Maintainer**: +1-XXX-XXX-XXXX, maintainer@blinkbudget.netlify.app
- **Backup Contact**: John Doe, +1-XXX-XXX-XXXX, backup@blinkbudget.netlify.app

#### Level 2-4 (Non-Critical) - GitHub Issues

- **Developer**: Available via GitHub issues
- **Project Maintainer**: Available via GitHub issues
- **Note**: GitHub issues reserved for Level 2-4 incidents only

### External Services

- **Firebase Support**: https://firebase.google.com/support
- **Netlify Support**: https://www.netlify.com/support
- **GitHub Support**: https://support.github.com

### Communication Channels

- **GitHub Issues**: https://github.com/Krasen007/BlinkBudget/issues
- **Project Repository**: https://github.com/Krasen007/BlinkBudget

---

## Disaster Classification

### Level 1 - Critical (Immediate Response Required)

- Complete service outage
- Data corruption or loss
- Security breach
- Database failure

### Level 2 - High (Response within 1 hour)

- Partial service degradation
- Backup system failure
- Performance issues affecting >50% users

### Level 3 - Medium (Response within 4 hours)

- Minor service issues
- Single component failure
- Performance issues affecting <50% users

### Level 4 - Low (Response within 24 hours)

- Documentation issues
- Minor bugs
- Non-critical feature failures

---

## Immediate Response Procedures

### Step 1: Assessment (First 15 minutes)

1. **Identify the Scope**

   ```bash
   # Check service status
   curl -I https://blinkbudget.netlify.app

   # Check Firebase status
   # Visit: https://status.firebase.google.com/

   # Check Netlify status
   # Visit: https://www.netlifystatus.com/
   ```

2. **Gather Initial Information**
   - When did the issue start?
   - What services are affected?
   - How many users are impacted?
   - Are there any error messages?

3. **Initial Triage**
   - Classify disaster level (1-4)
   - Document initial findings
   - Create GitHub issue for tracking

### Step 2: Immediate Containment (First 30 minutes)

1. **Prevent Further Damage**

   ```bash
   # If security breach suspected, rotate secrets immediately
   
   # Firebase API Key Rotation
   # 1. Open Firebase Console: https://console.firebase.google.com/project/PROJECT_ID/settings/serviceaccounts
   # 2. Locate existing web API key in "API Keys" section
   # 3. Click "Delete" to revoke the existing key
   # 4. Click "Create API Key" to generate new key
   # 5. Update all client applications with new key
   # 6. Update environment variables in CI/CD pipelines
   
   # Netlify Environment Variable Update
   # Option A: Dashboard
   # 1. Visit: https://app.netlify.com/sites/SITE_ID/settings/environment
   # 2. Edit/add variables and save
   # 3. Trigger deploy manually or wait for automatic build
   
   # Option B: CLI
   # 1. Set variable: netlify env:set VAR "value" --site SITE_ID
   # 2. Trigger deploy: netlify deploy --prod or netlify build
   
   # Post-Rotation Verification
   # 1. Verify deployments are using new secrets
   # 2. Update any shared secret stores or vaults
   # 3. Confirm all CI/CD pipelines updated
   # 4. Monitor for any authentication failures
   ```

2. **Activate Monitoring**
   - Check Firebase Console for authentication events
   - Monitor Netlify dashboard for deployment status
   - Review GitHub Actions for build failures

3. **Communication**
   - Create GitHub issue for tracking
   - Document initial findings

---

## Data Recovery Procedures

### Scenario 1: Firebase Data Loss

#### Recovery from Backup

1. **Assess Backup Availability**
   - Check Firestore collection 'backups' for recent backup documents
   - Review backup service logs
   - Verify backup document structure and timestamps

2. **Manual Recovery Process**

   ```javascript
   // Using the BackupService
   (async () => {
     try {
       const { BackupService } = await import('./src/core/backup-service.js');
       const result = await BackupService.restoreBackup();
       console.log(`Restored ${result} transactions`);
     } catch (error) {
       console.error('Backup restoration failed:', error);
     }
   })();
   ```

3. **Verify Data Integrity**
   - Check transaction counts
   - Validate data relationships
   - Test data operations

### Scenario 2: Local Storage Corruption

#### Recovery Steps

1. **Clear Corrupted Data**

   ```javascript
   // Clear corrupted local storage
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Force Sync from Firebase**

   ```javascript
   // Re-initialize services to sync from cloud
   window.location.reload();
   ```

3. **Verify Sync**
   - Check that all data loads correctly
   - Verify transaction counts
   - Test data operations

### Scenario 3: Partial Data Loss

#### Targeted Recovery

1. **Identify Missing Data**
   - Compare with backup
   - Check audit logs
   - Identify affected time ranges

2. **Selective Restore**
   ```javascript
   // Using the BackupService for targeted recovery
   (async () => {
     try {
       const { BackupService } = await import('./src/core/backup-service.js');
       
       // Restore specific date range
       const result = await BackupService.restoreBackup({
         startDate: '2026-01-01',
         endDate: '2026-01-31',
         dataTypes: ['transactions', 'accounts', 'categories']
       });
       
       console.log(`Restored ${result.count} records`);
       
       // Post-restore verification
       // 1. Verify restored data integrity
       // 2. Check for duplicates
       // 3. Run functional tests on restored subset
       // 4. Confirm data matches expected date ranges
       
     } catch (error) {
       console.error('Backup restoration failed:', error);
     }
   })();
   ```
   - Verify integrity

---

## Service Recovery Procedures

### Scenario 1: Complete Service Outage

#### Recovery Steps

1. **Check Deployment Status**

   ```bash
   # Check Netlify deploy logs
   # Visit: https://app.netlify.com/sites/SITE_ID/deploys

   # Check GitHub Actions status
   # Visit: https://github.com/Krasen007/BlinkBudget/actions
   ```

2. **Rollback if Needed**

   **Option A: Netlify Dashboard Rollback (Immediate)**
   - Visit https://app.netlify.com/sites/SITE_ID/deploys
   - Locate the last successful deploy
   - Click "Publish deploy" to immediately rollback
   - This requires no git work and is instant

   **Option B: Git Revert (Permanent Fix)**
   - Use `git revert HEAD` to revert the last commit
   - Or revert a specific commit: `git revert <commit-hash>`
   - Push the revert: `git push origin main`
   - Netlify will auto-deploy the reverted commit
   - **Warning**: Avoid `git checkout` to prevent detached HEAD state
   git checkout [PREVIOUS_COMMIT]
   git push origin main
   ```

3. **Redeploy if Needed**
   ```bash
   # Force redeploy from main branch
   git checkout main
   git push origin main
   ```

### Scenario 2: Performance Degradation

#### Recovery Steps

1. **Identify Bottleneck**
   - Check Netlify analytics
   - Monitor bundle size
   - Analyze Firebase performance

2. **Implement Temporary Fixes**
   - Enable aggressive caching
   - Disable non-essential features
   - Monitor performance metrics

### Scenario 3: Security Incident

#### Recovery Steps

1. **Immediate Lockdown**
   - Rotate all secrets
   - Update Firebase rules
   - Enable enhanced monitoring

2. **Investigation**
   - Review Firebase audit logs
   - Identify breach scope
   - Document findings

3. **Recovery**
   - Patch vulnerabilities
   - Restore from clean backup
   - Verify security measures

---

## Communication Procedures

### Internal Communication

1. **Initial Alert (Within 15 minutes)**

   Create GitHub issue with:
   - Status: CRITICAL/HIGH/MEDIUM/LOW
   - Issue description
   - Impact assessment
   - Current status

2. **Progress Updates (Every 30 minutes)**
   - Update GitHub issue with progress
   - Document actions taken
   - Note next steps

3. **Resolution Notification**
   - Mark issue as resolved
   - Document root cause analysis
   - Note preventive measures

### External Communication

1. **User Notification (If needed)**
   - Update README with status
   - Create GitHub release for fixes
   - Document recovery steps

---

## Post-Recovery Procedures

### Step 1: Documentation

1. **Incident Report**
   - Timeline of events
   - Actions taken
   - Root cause analysis
   - Impact assessment

2. **Lessons Learned**
   - What went well
   - What could be improved
   - Process changes needed

### Step 2: System Hardening

1. **Security Review**
   - Update security rules
   - Enhance monitoring
   - Test recovery procedures

2. **Performance Optimization**
   - Address bottlenecks
   - Optimize queries
   - Improve caching

### Step 3: Monitoring Enhancement

1. **Update Alert Thresholds**
   - Based on incident data
   - Reduce false positives
   - Improve detection time

2. **Add New Metrics**
   - Based on incident patterns
   - Early warning indicators

---

## Testing and Validation

### Recovery Testing

1. **Backup Verification**

   ```bash
   # Test backup integrity
   node -e "
   const { BackupService } = require('./src/core/backup-service.js');
   BackupService.verifyBackup().then(console.log);
   "
   ```

2. **Service Health Check**

   ```bash
   # Test all critical functions
   npm test

   # Check deployment
   curl -f https://blinkbudget.netlify.app || echo "Service down"
   ```

3. **Security Validation**

   ```bash
   # Run security scan
   npx snyk test --severity-threshold=high

   # Check security headers
   curl -I https://blinkbudget.netlify.app | grep -E "(X-Frame|X-XSS|X-Content)"
   ```

### User Acceptance Testing

1. **Core Functionality**
   - User authentication
   - Transaction entry
   - Data synchronization
   - Backup/restore operations

2. **Performance Validation**
   - Page load times
   - Transaction processing
   - Data sync speed
   - Mobile responsiveness

---

## Preventive Measures

### Automated Monitoring

1. **Health Checks**

   ```javascript
   // Add to main application
   setInterval(async () => {
     try {
       await BackupService.verifyBackup();
       console.log('Health check passed');
     } catch (error) {
       console.error('Health check failed:', error);
       // Create GitHub issue
     }
   }, 60000); // Every minute
   ```

2. **Automated Alerts**
   - Backup failures
   - Performance degradation
   - Security incidents
   - Resource exhaustion

### Regular Maintenance

1. **Weekly Tasks**
   - Review backup verification results
   - Check security scan results
   - Monitor performance metrics
   - Update dependencies

2. **Monthly Tasks**
   - Test recovery procedures
   - Review and update runbook
   - Conduct security audit
   - Performance optimization

3. **Quarterly Tasks**
   - Full disaster recovery drill
   - Security review
   - Documentation update

### Backup Strategy

1. **Multiple Backup Layers**
   - Real-time sync to Firebase
   - Daily automated backups via BackupService
   - Manual backup capabilities

2. **Backup Verification**
   - Automated daily verification
   - Weekly manual verification
   - Monthly restore testing

---

## Quick Reference Commands

### Emergency Commands

```bash
# Immediate service status check
curl -I https://blinkbudget.netlify.app

# Emergency rollback (via Netlify dashboard)
# Visit: https://app.netlify.com/sites/SITE_ID/deploys

# Force redeploy
git checkout main
git push origin main

# Run security scan
npx snyk test --severity-threshold=high

# Check application health
npm run check && npm test
```

### Monitoring Commands

```bash
# Check deployment status
# Visit: https://app.netlify.com/sites/SITE_ID/deploys

# Monitor Firebase usage
# Visit: https://console.firebase.google.com/

# Check GitHub Actions
# Visit: https://github.com/Krasen007/BlinkBudget/actions
```

---

## Contact Information Template

```
EMERGENCY CONTACTS
==================

Developer: Available via GitHub issues
Project Maintainer: Available via GitHub issues

SERVICE PROVIDERS
=================

Firebase Console: https://console.firebase.google.com/
Netlify Dashboard: https://app.netlify.com/
GitHub Repository: https://github.com/Krasen007/BlinkBudget

CRITICAL URLs
=============

Production App: https://blinkbudget.netlify.app
GitHub Issues: https://github.com/Krasen007/BlinkBudget/issues
```

---

## Revision History

| Version | Date           | Changes                           | Author      |
| ------- | -------------- | --------------------------------- | ----------- |
| 1.0     | April 7, 2026  | Initial disaster recovery runbook | Project Team |

---

**Important**: This runbook should be reviewed and updated quarterly, or after any major incident. All team members should be familiar with these procedures and participate in regular disaster recovery drills.
