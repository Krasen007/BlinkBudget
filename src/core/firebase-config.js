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

// Firebase is initialized lazily — only when auth or Firestore is actually
// needed. This keeps the Firebase SDK off the cold-start critical path.
let app = null;
let auth = null;
let initializationError = null;
let isInitializing = false;

/**
 * Initialize Firebase on first use. Safe to call multiple times — subsequent
 * calls are no-ops once initialization completes or fails.
 */
export const initializeFirebase = () => {
  if (app || initializationError || isInitializing) return;
  isInitializing = true;

  // Skip Firebase entirely in local mode
  if (config.localMode) {
    console.info(
      '[Firebase] Local mode active — skipping Firebase initialization.'
    );
    isInitializing = false;
    return;
  }

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
  } finally {
    isInitializing = false;
  }
};

/**
 * Get the Firebase App instance, initializing it first if needed.
 */
export const getFirebaseApp = () => {
  initializeFirebase();
  return app;
};

/**
 * Get the Firebase Auth instance, initializing Firebase first if needed.
 */
export const getAuthInstance = () => {
  initializeFirebase();
  return auth;
};

// Defer Firestore initialization until needed (e.g., after login)
let dbInstance = null;
export const getDb = () => {
  initializeFirebase();
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
  initializeFirebase();
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

// Export Firebase instances (may be null until initializeFirebase() is called)
export { app, analytics, auth };

// Export initialization status for components to check.
// Getters reflect live state after lazy initialization.
export const firebaseStatus = {
  get isInitialized() {
    return !!app;
  },
  get hasError() {
    return !!initializationError;
  },
  get error() {
    return initializationError;
  },
  get canUseAuth() {
    return !!auth;
  },
  canUseFirestore: () => !!app,
};
