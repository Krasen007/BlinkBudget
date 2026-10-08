import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { config } from '../../config/app.config.js';
import { PrivacyService } from './privacy-service.js';

// Handle Firebase initialization with graceful fallback
let app = null;
let auth = null;
let initializationError = null;

// Skip Firebase entirely in local mode
if (config.localMode) {
  console.info(
    '[Firebase] Local mode active — skipping Firebase initialization.'
  );
} else {
  try {
    // Check if Firebase configuration is properly validated
    if (!config.validationPassed || !config.firebase) {
      throw new Error(
        'Firebase configuration is not properly validated. Check environment variables.'
      );
    }

    // Initialize Firebase with validated configuration
    app = initializeApp(config.firebase);
    auth = getAuth(app);

    console.log('Firebase initialized successfully');
  } catch (error) {
    initializationError = error;
    console.error('Firebase initialization failed:', error.message);

    // In development, show a helpful error message
    if (config.isDev) {
      console.warn(`
🔥 Firebase Initialization Failed 🔥

Error: ${error.message}

To fix this issue:
1. Copy .env.example to .env
2. Fill in your Firebase credentials from the Firebase console
3. Restart the development server

The app will continue to run in local-only mode.
      `);
    }
  }
}

// Defer Firestore initialization until needed (e.g., after login)
let dbInstance = null;
export const getDb = () => {
  if (!dbInstance) {
    if (!app) {
      throw new Error('Firebase not initialized. Cannot access Firestore.');
    }
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    console.log(
      'Firestore initialized with persistent cache and multi-tab support.'
    );
  }
  return dbInstance;
};

// Initialize Analytics only when the user has explicitly opted in.
// Analytics is disabled by default (PrivacyService's default consent for
// 'analytics' is false), so this satisfies Store policy 10.5 (Personal
// Information) — we never auto-collect usage data without consent. Call
// initializeAnalytics() again after the user grants analytics consent.
let analytics = null;

export const initializeAnalytics = () => {
  if (analytics || !app) {
    return analytics;
  }
  if (!PrivacyService.getConsent('analytics')) {
    console.info(
      '[Firebase] Analytics disabled — user has not granted analytics consent.'
    );
    return null;
  }
  isSupported()
    .then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(e => {
      console.warn('Analytics not supported in this environment:', e.message);
    });
  return analytics;
};

// Attempt to initialize analytics at startup only if consent was previously
// granted (e.g. a returning user who already opted in on another device).
initializeAnalytics();

// Export Firebase instances and status
export { app, analytics, auth };

// Export initialization status for components to check
export const firebaseStatus = {
  isInitialized: !!app,
  hasError: !!initializationError,
  error: initializationError,
  canUseAuth: !!auth,
  canUseFirestore: () => !!app,
};
