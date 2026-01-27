/**
 * Analytics Instance Singleton
 *
 * Provides a shared instance of the AnalyticsEngine to ensure caching persists
 * across view navigations.
 */

import { AnalyticsEngine } from '../analytics-engine.js';

let instance = null;

export const getAnalyticsEngine = () => {
  if (!instance) {
    instance = new AnalyticsEngine();
  }
  return instance;
};

// Allow resetting for testing or hard refresh
export const resetAnalyticsEngine = () => {
  instance = null;
};
