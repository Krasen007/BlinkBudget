# Deployment and Rollback Procedures

This document outlines the comprehensive deployment and rollback procedures for BlinkBudget, ensuring safe and reliable releases.

## Deployment Workflow

### Pre-Deployment Checklist

Before any deployment, verify the following:

#### Code Quality

- [ ] All tests pass (`npm test`)
- [ ] Code quality checks pass (`npm run check`)
- [ ] Security scan passes (Snyk)
- [ ] Build succeeds (`npm run build`)
- [ ] No sensitive data in code

#### Environment Configuration

- [ ] Environment variables are set for target environment
- [ ] Firebase configuration is correct
- [ ] Netlify environment variables are configured
- [ ] CORS headers are properly configured

#### Documentation

- [ ] CHANGELOG.md updated
- [ ] Release notes prepared
- [ ] Documentation updated if needed

### Deployment Process

#### 1. Development to Staging

```bash
# Ensure develop branch is up to date
git checkout develop
git pull origin develop

# Run full test suite
npm run check
npm test

# Build and deploy to staging
npm run build
netlify deploy --prod --dir=dist --site-id=$NETLIFY_SITE_ID_STAGING
```

#### 2. Staging to Production

```bash
# Create release branch from develop
git checkout -b release/vX.X.X develop

# Run final tests
npm run check
npm test

# Merge to main
git checkout main
git merge release/vX.X.X
git push origin main

# Tag release
git tag -a vX.X.X -m "Release version X.X.X"
git push origin vX.X.X

# Deploy to production (automatic via GitHub Actions)
```

### Automated Deployment (GitHub Actions)

The CI/CD pipeline handles deployments automatically:

1. **Push to `develop`** → Staging deployment
2. **Push to `main`** → Production deployment
3. **Pull Request to `main`** → Tests only, no deployment

## Rollback Procedures

### Immediate Rollback (Netlify)

#### Method 1: Netlify Dashboard

1. Go to Netlify dashboard
2. Select the site
3. Navigate to **Deploys** tab
4. Find the last successful deployment
5. Click **Publish deploy** on the previous version

#### Method 2: Netlify CLI

```bash
# List recent deployments
netlify list

# Rollback to specific deploy
netlify rollback --site-id=$NETLIFY_SITE_ID [DEPLOY_ID]
```

#### Method 3: Git Rollback

```bash
# Reset to previous commit
git reset --hard HEAD~1
git push --force-with-lease origin main

# This will trigger a new deployment with the previous code
```

### Emergency Rollback Procedures

#### Critical Issues (Production Down)

1. **Immediate Actions**:
   - Rollback to last known good version
   - Enable maintenance mode if needed
   - Notify team and stakeholders

2. **Assessment**:
   - Identify root cause
   - Document the issue
   - Plan fix

3. **Recovery**:
   - Apply fix
   - Test thoroughly
   - Redeploy

#### Security Issues

1. **Immediate Actions**:
   - Rollback immediately
   - Change all secrets/credentials
   - Enable enhanced monitoring

2. **Investigation**:
   - Security audit
   - Impact assessment
   - Forensic analysis

3. **Recovery**:
   - Patch vulnerabilities
   - Security review
   - Gradual rollout with monitoring

## Environment Management

### Environment Variables

#### Development

```bash
# Local development
cp .env.example .env
# Edit .env with local Firebase config
```

#### Staging

- Set in Netlify UI: **Site Settings > Environment Variables**
- Prefix with `STAGING_` for clarity
- Use separate Firebase project

#### Production

- Set in Netlify UI: **Site Settings > Environment Variables**
- Use production Firebase project
- Enable all security features

### Firebase Project Separation

#### Development Project

- Name: `blinkbudget-dev`
- Purpose: Development and testing
- Data: Test data only

#### Staging Project

- Name: `blinkbudget-staging`
- Purpose: Pre-production testing
- Data: Anonymized test data

#### Production Project

- Name: `blinkbudget-prod`
- Purpose: Live application
- Data: Real user data

## Monitoring and Alerting

### Deployment Monitoring

#### During Deployment

1. Monitor build logs
2. Check deployment status
3. Verify site accessibility
4. Test critical functionality

#### Post-Deployment

1. Monitor error rates
2. Check performance metrics
3. Verify user analytics
4. Review security logs

### Automated Alerts

#### Critical Alerts

- Site downtime (>5 minutes)
- Error rate >5%
- Security incidents
- Failed deployments

#### Warning Alerts

- Performance degradation
- High memory usage
- Unusual traffic patterns

## Disaster Recovery

### Backup Procedures

#### Data Backups

1. **Firebase Firestore**: Daily automated backups
2. **Firebase Storage**: Weekly backups
3. **Configuration**: Version controlled

#### Recovery Procedures

1. Assess damage
2. Restore from latest backup
3. Verify data integrity
4. Update security credentials

### Business Continuity

#### Minimum Viable Service

- Read-only mode for existing data
- Basic transaction entry
- User authentication

#### Recovery Time Objectives

- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 24 hours

## Security Considerations

### Deployment Security

- Use HTTPS everywhere
- Validate all environment variables
- Enable security headers
- Monitor for unauthorized access

### Post-Deployment Security

- Security audit within 24 hours
- Monitor for unusual activity
- Update security rules if needed
- Review access logs

## Troubleshooting

### Common Deployment Issues

#### Build Failures

1. Check environment variables
2. Verify dependencies
3. Review build logs
4. Test locally

#### Runtime Errors

1. Check browser console
2. Review network requests
3. Verify Firebase configuration
4. Check CORS settings

#### Performance Issues

1. Monitor bundle size
2. Check caching headers
3. Analyze Core Web Vitals
4. Optimize images and assets

### Debugging Tools

#### Local Development

```bash
# Build with detailed logging
npm run build -- --mode development

# Preview local build
npm run preview
```

#### Production Debugging

```bash
# Check Netlify logs
netlify functions:logs

# Monitor Firebase usage
firebase projects:list
```

## Release Communication

### Internal Communication

- Notify team before deployment
- Share deployment schedule
- Document any breaking changes
- Provide rollback contacts

### External Communication

- Update changelog
- Notify users of maintenance
- Share release notes
- Provide support contact information

## Compliance and Legal

### Data Protection

- GDPR compliance for EU users
- Data retention policies
- User consent management
- Right to data deletion

### Security Standards

- OWASP compliance
- Regular security audits
- Penetration testing
- Incident response procedures

## Continuous Improvement

### Post-Mortem Process

1. Document all incidents
2. Identify root causes
3. Implement preventive measures
4. Update procedures

### Metrics and KPIs

- Deployment success rate
- Mean time to recovery (MTTR)
- Change failure rate
- Deployment frequency

This document should be reviewed and updated regularly to reflect changes in the deployment process and infrastructure.
