# Security Setup Guide for BlinkBudget

This guide provides comprehensive instructions for setting up and maintaining security best practices for the BlinkBudget application.

## Environment Variable Management

### Required Environment Variables

The following environment variables must be configured for the application to function securely:

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

### GitHub Secrets Configuration

1. **Production Environment Secrets** (for `main` branch):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`
   - `SNYK_TOKEN`

2. **Staging Environment Secrets** (for `develop` branch):
   - `VITE_FIREBASE_API_KEY_STAGING`
   - `VITE_FIREBASE_AUTH_DOMAIN_STAGING`
   - `VITE_FIREBASE_PROJECT_ID_STAGING`
   - `VITE_FIREBASE_STORAGE_BUCKET_STAGING`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID_STAGING`
   - `VITE_FIREBASE_APP_ID_STAGING`
   - `VITE_FIREBASE_MEASUREMENT_ID_STAGING`
   - `NETLIFY_SITE_ID_STAGING`

### Netlify Environment Variables

Configure the same variables in your Netlify site settings under **Site Settings > Environment Variables**:

1. Go to your Netlify dashboard
2. Select the site
3. Navigate to **Site Settings > Environment Variables**
4. Add all required variables for the corresponding environment

## CORS Configuration

The application includes CORS headers in `netlify.toml`:

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://blinkbudget.netlify.app"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
    Access-Control-Allow-Credentials = "true"
```

### Firebase CORS Rules

Update your Firebase project with appropriate CORS rules:

```javascript
// Firebase Cloud Functions CORS configuration
const cors = require('cors')({ origin: true });

exports.yourFunction = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Your function logic here
  });
});
```

## Security Headers

The application implements comprehensive security headers:

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` - Restricts sensitive APIs

## Dependency Security

### Automated Scanning

1. **Snyk Integration**:
   - Configure Snyk token in GitHub secrets
   - Automatic weekly scans via Dependabot
   - High severity vulnerabilities fail builds

2. **GitHub Dependabot**:
   - Weekly dependency updates
   - Grouped updates for related packages
   - Automatic pull request creation

### Manual Security Checks

Run security scans manually:

```bash
# Validate environment variables
npm run validate-env

# Run Snyk scan locally (requires Snyk CLI)
snyk test --severity-threshold=high

# Audit npm packages
npm audit
```

## Firebase Security Rules

### Firestore Security Rules

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

## Rate Limiting

### Firebase Authentication

Configure rate limiting in Firebase Console:

1. Go to **Authentication > Settings**
2. Enable **Email enumeration protection**
3. Set appropriate rate limits for:
   - Password reset requests
   - Email verification
   - Account creation

### API Rate Limiting

Implement rate limiting for custom API endpoints:

```javascript
// Example rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);
```

## Security Monitoring

### Snyk Monitoring

- Continuous vulnerability scanning
- License compliance checking
- Dependency graph analysis

### Firebase Monitoring

- Authentication event logging
- Database access patterns
- Error tracking and alerting

## Best Practices

### Development

1. **Never commit secrets** to version control
2. **Use environment-specific configurations**
3. **Validate all user inputs**
4. **Implement proper error handling** without exposing sensitive information

### Deployment

1. **Use HTTPS everywhere**
2. **Implement proper CSP headers**
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
   npm run validate-env
   ```

2. **CORS errors**:
   - Check Netlify headers configuration
   - Verify Firebase CORS rules
   - Ensure correct origin URLs

3. **Firebase authentication issues**:
   - Verify API key configuration
   - Check authDomain format
   - Review Firebase security rules

### Security Incident Response

1. **Immediate actions**:
   - Identify and contain the breach
   - Reset compromised credentials
   - Enable additional monitoring

2. **Investigation**:
   - Review access logs
   - Analyze affected data
   - Document timeline

3. **Recovery**:
   - Patch vulnerabilities
   - Notify affected users
   - Implement preventive measures

## Compliance

### Data Protection

- GDPR compliance for EU users
- Data minimization principles
- Right to data deletion
- Privacy by design

### Security Standards

- OWASP Top 10 mitigation
- Secure coding practices
- Regular security assessments
- Incident response procedures
