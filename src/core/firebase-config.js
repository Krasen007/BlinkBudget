import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { config } from '../../config/app.config.js';

// Validate Firebase configuration is available
if (!config.validationPassed || !config.firebase) {
  throw new Error(
    'Firebase configuration is not properly validated. Check environment variables.'
  );
}

// Initialize Firebase with validated configuration
const app = initializeApp(config.firebase);
const auth = getAuth(app);

// Defer Firestore initialization until needed (e.g., after login)
let dbInstance = null;
export const getDb = () => {
  if (!dbInstance) {
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

// Initialize Analytics conditionally
let analytics = null;

isSupported()
  .then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch(e => {
    console.warn('Analytics not supported in this environment:', e.message);
  });

export { app, analytics, auth };
