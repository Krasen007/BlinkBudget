/**
 * Environment variable validation utility
 */
function validateEnvironmentVariables() {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all Firebase configuration variables are set.'
    );
  }

  // Validate Firebase API key format
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    throw new Error('Invalid Firebase API key format');
  }

  // Validate project ID format
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId || !/^[a-zA-Z0-9-]+$/.test(projectId)) {
    throw new Error('Invalid Firebase project ID format');
  }

  return true;
}

// Validate environment variables on import
let validationPassed = false;
let localMode = false;
try {
  // Check if any Firebase env vars exist at all
  const hasAnyFirebaseVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
  ].some(key => import.meta.env[key]);
  // Ensure test mode is handled before falling back to local-only when no
  // Firebase variables are present. Otherwise test runs without Firebase
  // env vars may be forced into localMode which changes downstream behavior.
  if (import.meta.env.MODE === 'test') {
    validationPassed = true;
  } else if (!hasAnyFirebaseVars) {
    // No Firebase env vars at all → local-only mode
    localMode = true;
    validationPassed = true;
    if (import.meta.env.DEV) {
      console.info(`
⚡ BlinkBudget running in LOCAL MODE
No Firebase configuration detected. Sync & auth are disabled.
All data will be stored in localStorage only.
To enable cloud features, create a .env file with your Firebase credentials.
      `);
    }
  } else {
    validateEnvironmentVariables();
    validationPassed = true;
  }
} catch (error) {
  console.error('Environment validation failed:', error.message);
  // In development, show a clear error
  if (import.meta.env.DEV) {
    if (typeof document !== 'undefined' && document.body) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'config-error-container';
      errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-xl, 24px);
        background: var(--color-background, #0a0a0c);
        font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        z-index: 99999;
      `;

      const errorCard = document.createElement('div');
      errorCard.style.cssText = `
        max-width: 600px;
        width: 100%;
        padding: var(--spacing-2xl, 32px);
        background: var(--color-surface, #16161a);
        border: 1px solid var(--color-error, #ff4d4d);
        border-radius: var(--radius-lg, 12px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-error, #ff4d4d) inset;
      `;

      const icon = document.createElement('div');
      icon.style.cssText = `
        width: 48px;
        height: 48px;
        margin-bottom: var(--spacing-lg, 16px);
        background: var(--color-error-light, rgba(255, 77, 77, 0.1));
        border-radius: var(--radius-full, 9999px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: var(--color-error, #ff4d4d);
        font-weight: bold;
      `;
      icon.textContent = '!';

      const heading = document.createElement('h2');
      heading.textContent = 'Configuration Error';
      heading.style.cssText = `
        font-size: var(--font-size-2xl, 24px);
        font-weight: 700;
        color: var(--color-text-main, #ffffff);
        margin: 0 0 var(--spacing-md, 12px) 0;
        font-family: var(--font-heading, inherit);
        letter-spacing: -0.02em;
      `;

      const msgPara = document.createElement('p');
      msgPara.textContent = error.message;
      msgPara.style.cssText = `
        font-size: var(--font-size-base, 16px);
        line-height: var(--line-height-relaxed, 1.75);
        color: var(--color-text-main, #ffffff);
        margin: 0 0 var(--spacing-lg, 16px) 0;
        padding: var(--spacing-md, 12px);
        background: #8b0000;
        border-left: 4px solid var(--color-error, #ff4d4d);
        border-radius: var(--radius-sm, 6px);
        font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        font-size: var(--font-size-sm, 14px);
        word-break: break-word;
      `;

      const helpPara = document.createElement('p');
      helpPara.textContent =
        'Please check your .env file and restart the development server.';
      helpPara.style.cssText = `
        font-size: var(--font-size-sm, 14px);
        line-height: var(--line-height-normal, 1.5);
        color: var(--color-text-muted, #b4b4b4);
        margin: 0;
      `;

      errorCard.appendChild(icon);
      errorCard.appendChild(heading);
      errorCard.appendChild(msgPara);
      errorCard.appendChild(helpPara);
      errorDiv.appendChild(errorCard);
      document.body.innerHTML = '';
      document.body.appendChild(errorDiv);
    }
  }
}

export const config = {
  env: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  validationPassed,
  localMode,

  // Firebase configuration (validated)
  firebase:
    validationPassed && import.meta.env.MODE !== 'test' && !localMode
      ? {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
          measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
        }
      : import.meta.env.MODE === 'test'
        ? {
            // Mock configuration for tests
            apiKey: 'test-api-key',
            authDomain: 'test.firebaseapp.com',
            projectId: 'test-project',
            storageBucket: 'test.firebasestorage.app',
            messagingSenderId: '123456789',
            appId: 'test-app-id',
            measurementId: 'test-measurement-id',
          }
        : null,
};
