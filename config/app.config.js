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
try {
  // Skip validation in test environment
  if (import.meta.env.MODE === 'test') {
    validationPassed = true;
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
      errorDiv.style.cssText =
        'padding: 20px; font-family: monospace; background: #ffebee; color: #c62828;';
      const heading = document.createElement('h2');
      heading.textContent = 'Configuration Error';
      const msgPara = document.createElement('p');
      msgPara.textContent = error.message;
      const helpPara = document.createElement('p');
      helpPara.textContent =
        'Please check your .env file and restart the development server.';
      errorDiv.appendChild(heading);
      errorDiv.appendChild(msgPara);
      errorDiv.appendChild(helpPara);
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

  // Firebase configuration (validated)
  firebase:
    validationPassed && import.meta.env.MODE !== 'test'
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
