# Disaster Recovery Runbook

This runbook provides step-by-step procedures for handling disaster recovery scenarios for BlinkBudget, ensuring business continuity and data integrity.

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

- **DevOps Lead**: [Contact Information]
- **Full Stack Developer**: [Contact Information]
- **Product Owner**: [Contact Information]

### External Services

- **Firebase Support**: [Contact Information]
- **Netlify Support**: [Contact Information]
- **Snyk Support**: [Contact Information]

### Communication Channels

- **Emergency Slack Channel**: #blinkbudget-emergency
- **Email Distribution**: emergency@blinkbudget.app
- **Phone Tree**: [List of contacts]

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
   - Activate appropriate response team
   - Document initial findings

### Step 2: Immediate Containment (First 30 minutes)

1. **Prevent Further Damage**

   ```bash
   # If security breach suspected, rotate secrets immediately

   # Rotate Firebase API keys and service accounts
   gcloud auth login  # Authenticate with required permissions
   gcloud config set project PROJECT_ID  # Set target project

   # Revoke existing service account keys
   gcloud iam service-accounts keys list --iam-account=SERVICE_ACCOUNT_EMAIL
   gcloud iam service-accounts keys delete KEY_ID --iam-account=SERVICE_ACCOUNT_EMAIL

   # Create new service account key
   gcloud iam service-accounts keys create KEY_NAME.json --iam-account=SERVICE_ACCOUNT_EMAIL

   # Update Firebase API keys in console
   # Visit: https://console.firebase.google.com/project/PROJECT_ID/settings/serviceaccounts
   # Generate new web API key and update all client applications

   # Update Netlify environment variables
   netlify login  # Authenticate with required permissions
   netlify switch SITE_ID  # Set target site

   # Update environment variables
   netlify env:set VAR_NAME "new_value" --context=production
   netlify env:set VAR_NAME "new_value" --context=deploy-preview

   # Trigger redeploy to apply new environment variables
   netlify trigger deploy --prod

   # Generic secret rotation (example with AWS Secrets Manager)
   aws configure set profile.admin  # Use admin profile with required permissions

   # Create new secret version
   aws secretsmanager create-secret-version --secret-id SECRET_ARN \
     --secret-string '{"API_KEY":"new_key_value"}' --version-stage AWSCURRENT

   # Update dependent services to use new secret version
   # Update application code to fetch latest secret version

   # Disable old secret version after verification
   aws secretsmanager update-secret-version-stage --secret-id SECRET_ARN \
     --version-stage AWSPREVIOUS --move-to-version-id PREVIOUS_VERSION_ID

   # Verify secret propagation
   aws secretsmanager get-secret-value --secret-id SECRET_ARN --version-stage AWSCURRENT

   # Rollback command (if needed)
   aws secretsmanager restore-secret-version --secret-id SECRET_ARN --version-id PREVIOUS_VERSION_ID
   ```

2. **Activate Monitoring**
   - Enable enhanced logging
   - Set up alerts for critical metrics
   - Monitor system resources

3. **Communication**
   - Notify core team
   - Send initial status update
   - Set up emergency communication channel

---

## Data Recovery Procedures

### Scenario 1: Firebase Data Loss

#### Recovery from Backup

1. **Assess Backup Availability**

   ```bash
   # Check latest backup verification
   curl -X GET "https://us-central1-your-project.cloudfunctions.net/getBackupVerificationStatus"
   ```

2. **Initiate Emergency Backup**

   ```bash
   # Create emergency backup if needed
   curl -X POST "https://us-central1-your-project.cloudfunctions.net/emergencyBackup?userId=USER_ID"
   ```

3. **Restore from Backup**

   ```javascript
   // Using the BackupService (wrapped in async function)
   (async () => {
     try {
       // Dynamic import for CommonJS compatibility
       const { BackupService } = await import('./src/core/backup-service.js');

       const result = await BackupService.restoreBackup();
       console.log(`Restored ${result} transactions`);
     } catch (error) {
       console.error('Backup restoration failed:', error);
       process.exit(1);
     }
   })();
   ```

4. **Verify Data Integrity**
   ```bash
   # Run backup verification
   curl -X POST "https://us-central1-your-project.cloudfunctions.net/manualBackupVerification?userId=USER_ID"
   ```

#### Manual Recovery Process

1. **Access Firebase Console**
   - Navigate to Firestore Database
   - Check user data collections

2. **Export Available Data**
   - Use Firebase Console export feature
   - Export to JSON or CSV format

3. **Data Validation**
   - Verify data completeness
   - Check for corruption
   - Validate data relationships

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
   // Restore specific time range
   const backup = await BackupService.fetchBackup();
   const missingData = backup.transactions.filter(
     tx => tx.date >= startDate && tx.date <= endDate
   );

   // Restore missing transactions
   missingData.forEach(tx => TransactionService.add(tx));
   ```

---

## Service Recovery Procedures

### Scenario 1: Complete Service Outage

#### Recovery Steps

1. **Check Deployment Status**

   ```bash
   # Check Netlify deploy logs
   netlify deploy --list

   # Check GitHub Actions status
   # Visit: https://github.com/your-org/blinkbudget/actions
   ```

2. **Rollback if Needed**

   ```bash
   # Rollback to previous working version
   netlify rollback --site-id=$NETLIFY_SITE_ID [PREVIOUS_DEPLOY_ID]
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
   - Check Core Web Vitals
   - Monitor bundle size
   - Analyze database queries

2. **Implement Temporary Fixes**
   - Enable aggressive caching
   - Disable non-essential features
   - Scale up resources if needed

3. **Monitor Performance**
   - Set up performance alerts
   - Monitor user experience metrics
   - Track recovery progress

### Scenario 3: Security Incident

#### Recovery Steps

1. **Immediate Lockdown**

   ```bash
   # Rotate all secrets
   # Update Firebase rules
   # Enable enhanced monitoring
   ```

2. **Investigation**
   - Review audit logs
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

   ```
   🚨 EMERGENCY ALERT - BlinkBudget

   Status: [CRITICAL/HIGH/MEDIUM/LOW]
   Issue: [Brief description]
   Impact: [Number of users affected]
   ETA: [Estimated resolution time]
   Updates: [Channel for updates]
   ```

2. **Progress Updates (Every 30 minutes)**
   - Current status
   - Actions taken
   - Next steps
   - Revised ETA

3. **Resolution Notification**
   - Issue resolved
   - Root cause analysis
   - Preventive measures
   - Lessons learned

### External Communication

1. **User Notification (If needed)**
   - Status page update
   - In-app notification
   - Email announcement
   - Social media update

2. **Stakeholder Communication**
   - Management updates
   - Partner notifications
   - Regulatory reporting (if required)

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
   - Training requirements

### Step 2: System Hardening

1. **Security Review**
   - Update security rules
   - Enhance monitoring
   - Improve alerting
   - Test recovery procedures

2. **Performance Optimization**
   - Address bottlenecks
   - Optimize queries
   - Improve caching
   - Scale resources

### Step 3: Monitoring Enhancement

1. **Update Alert Thresholds**
   - Based on incident data
   - Reduce false positives
   - Improve detection time

2. **Add New Metrics**
   - Based on incident patterns
   - Early warning indicators
   - Predictive monitoring

---

## Testing and Validation

### Recovery Testing

1. **Backup Verification**

   ```bash
   # Test backup integrity
   npm run validate-env

   # Test backup restoration
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
   snyk test --severity-threshold=high

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
       // Trigger alert
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
   - Security penetration testing
   - Capacity planning review
   - Documentation update

### Backup Strategy

1. **Multiple Backup Layers**
   - Real-time sync to Firebase
   - Daily automated backups
   - Weekly full exports
   - Monthly archive backups

2. **Backup Verification**
   - Automated daily verification
   - Weekly manual verification
   - Monthly restore testing
   - Quarterly disaster recovery drill

---

## Quick Reference Commands

### Emergency Commands

```bash
# Immediate service status check
curl -I https://blinkbudget.netlify.app

# Force emergency backup
curl -X POST "https://us-central1-your-project.cloudfunctions.net/emergencyBackup?userId=USER_ID"

# Verify backup integrity
curl -X POST "https://us-central1-your-project.cloudfunctions.net/manualBackupVerification?userId=USER_ID"

# Get system status
curl -X GET "https://us-central1-your-project.cloudfunctions.net/getBackupVerificationStatus"

# Emergency rollback
netlify rollback --site-id=$NETLIFY_SITE_ID [PREVIOUS_DEPLOY_ID]

# Force redeploy
git checkout main
git push origin main
```

### Monitoring Commands

```bash
# Check backup verification logs
firebase functions:log --only verifyAllBackups

# Monitor real-time logs
firebase functions:log --only emergencyBackup

# Check deployment status
netlify deploy --list

# Run security scan
snyk test --severity-threshold=high

# Check application health
npm run check && npm test
```

---

## Contact Information Template

```
EMERGENCY CONTACTS
==================

Primary DevOps: [Name] - [Phone] - [Email]
Secondary DevOps: [Name] - [Phone] - [Email]
Firebase Support: [Phone] - [Email]
Netlify Support: [Phone] - [Email]

SERVICE PROVIDERS
=================

Firebase Console: https://console.firebase.google.com/
Netlify Dashboard: https://app.netlify.com/
GitHub Repository: https://github.com/your-org/blinkbudget
Snyk Dashboard: https://app.snyk.io/

CRITICAL URLs
=============

Production App: https://blinkbudget.netlify.app
Staging App: https://blinkbudget-staging.netlify.app
Status Page: https://status.blinkbudget.app
Emergency Documentation: [Link to runbook]
```

---

## Revision History

| Version | Date           | Changes                           | Author      |
| ------- | -------------- | --------------------------------- | ----------- |
| 1.0     | [Current Date] | Initial disaster recovery runbook | DevOps Team |
| 1.1     | [Future Date]  | [Changes made]                    | [Author]    |

---

**Important**: This runbook should be reviewed and updated quarterly, or after any major incident. All team members should be familiar with these procedures and participate in regular disaster recovery drills.
