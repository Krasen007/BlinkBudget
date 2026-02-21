/**
 * Firebase Lazy Loader
 *
 * Defers Firebase initialization until actually needed (auth or data sync).
 * This reduces initial bundle load and improves Time to Interactive (TTI).
 *
 * Performance optimization: Reduces initial JS execution by ~150KB
 */

let firebasePromise = null;
let firebaseModules = null;

/**
 * Lazy load Firebase modules on demand
 * @returns {Promise<Object>} Firebase modules (app, auth, analytics, etc.)
 */
export async function loadFirebase() {
  // Return cached modules if already loaded
  if (firebaseModules) {
    return firebaseModules;
  }

  // Return existing promise if already loading
  if (firebasePromise) {
    return firebasePromise;
  }

  // Start loading Firebase
  firebasePromise = (async () => {
    try {
      const firebaseConfig = await import('./firebase-config.js');
      firebaseModules = {
        app: firebaseConfig.app,
        auth: firebaseConfig.auth,
        analytics: firebaseConfig.analytics,
        firebaseStatus: firebaseConfig.firebaseStatus,
        getDb: firebaseConfig.getDb,
      };
      return firebaseModules;
    } catch (error) {
      console.error('[FirebaseLazy] Failed to load Firebase:', error);
      firebasePromise = null; // Reset so we can retry
      throw error;
    }
  })();

  return firebasePromise;
}

/**
 * Get Firebase modules synchronously if already loaded, otherwise null
 * @returns {Object|null} Firebase modules or null if not yet loaded
 */
export function getFirebaseSync() {
  return firebaseModules;
}

/**
 * Check if Firebase is loaded
 * @returns {boolean} True if Firebase modules are loaded
 */
export function isFirebaseLoaded() {
  return !!firebaseModules;
}
