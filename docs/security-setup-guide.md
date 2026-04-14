# Security Setup Guide for BlinkBudget

This guide provides instructions for setting up security best practices for the BlinkBudget application.

## Environment Variable Management

### Required Environment Variables

The following environment variables must be configured for the application to function:

```bash
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Environment Variable Validation

The project includes a validation script at `config/validate-env.cjs` that:

- Checks for required Firebase environment variables
- Validates that placeholder values are not used
- Verifies Firebase configuration format
- Prevents builds with missing or invalid configuration

Run validation:

```bash
node config/validate-env.cjs
```

## Security Headers Configuration

The application implements security headers in `netlify.toml`:

### Current Security Headers

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` - Restricts sensitive APIs
- `Content-Security-Policy` - Comprehensive CSP for Firebase and application resources
- `Strict-Transport-Security` - Enforces HTTPS

### CORS Configuration

CORS headers are configured for API endpoints:

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://blinkbudget.netlify.app"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
    Access-Control-Allow-Credentials = "true"
```

## Firebase Security Rules

### Firestore Security Rules

Configure proper security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Transactions are scoped to user
    match /users/{userId}/transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Dependency Security

### Automated Scanning

1. **Snyk Integration**:
   - `.snyk` policy file configured
   - Automated vulnerability scanning
   - Integration with GitHub for monitoring

2. **GitHub Dependabot**:
   - Weekly dependency updates
   - Automatic pull request creation
   - Security vulnerability alerts

### Manual Security Checks

Run security scans manually:

```bash
# Validate environment variables
node config/validate-env.cjs

# Audit npm packages
npm audit

# Run Snyk scan (requires Snyk CLI)
npx snyk test --severity-threshold=high
```

## Security Monitoring

### Firebase Console

- Authentication event logging
- Database access patterns
- Error tracking and alerting

### Netlify Dashboard

- Deployment monitoring
- Access logs
- Build status

### Snyk Dashboard

- Continuous vulnerability scanning
- License compliance checking
- Dependency graph analysis

## Best Practices

### Development

1. **Never commit secrets** to version control
2. **Use environment-specific configurations**
3. **Validate all user inputs**
4. **Implement proper error handling** without exposing sensitive information

### Deployment

1. **Use HTTPS everywhere** (enforced by Netlify)
2. **Implement proper CSP headers** (configured in netlify.toml)
3. **Regular security audits**
4. **Keep dependencies updated**

### Operations

1. **Regular backup verification**
2. **Security incident response plan**
3. **Access control reviews**
4. **Compliance monitoring**

## Troubleshooting

### Common Issues

1. **Build failures due to missing environment variables**:

   ```bash
   node config/validate-env.cjs
   ```

2. **CORS errors**:
   - Check netlify.toml headers configuration
   - Verify Firebase CORS rules
   - Ensure correct origin URLs

3. **Firebase authentication issues**:
   - Verify API key configuration
   - Check authDomain format
   - Review Firebase security rules

## Rate Limiting

### Authentication Protection

Implement rate limiting to protect authentication endpoints:

#### Recommended Thresholds

- **Login Attempts**: 5 attempts per minute per IP
- **Password Reset**: 3 requests per hour per email
- **Account Creation**: 2 accounts per hour per IP
- **API Requests**: 100 requests per minute per authenticated user

#### Implementation Options

**Firebase Authentication**:

- Use Firebase Security Rules with rate limiting logic
- Implement Cloud Functions for advanced rate limiting
- Enable Firebase Authentication rate limiting in console
- Monitor authentication logs for suspicious patterns

**Netlify Protection**:

- Use Netlify Edge Functions for rate limiting
- Implement IP-based blocking for repeated failures
- Configure Netlify Edge Rate Limiting rules
- Consider proxying through Cloudflare or similar WAF

### Monitoring and Alerting

#### Metrics to Track

- Rate limit hits and 429 responses
- Spike in failed authentication attempts
- IP reputation and geolocation anomalies
- Unusual user behavior patterns

#### Alert Integration

- Configure alerts for rate limit threshold breaches
- Integrate with existing Snyk/monitoring stack
- Set up automated IP blocking for repeated violations
- Monitor for distributed attack patterns

---

**Note**: This guide reflects the current security setup of BlinkBudget. Review and update regularly as security practices evolve.
