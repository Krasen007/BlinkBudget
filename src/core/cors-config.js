/**
 * CORS Configuration for BlinkBudget
 * This file contains CORS settings for any future API endpoints
 * Currently, BlinkBudget uses Firebase services which handle CORS automatically
 */

// CORS configuration for potential future custom API endpoints
export const corsConfig = {
  // Allowed origins for development and production
  allowedOrigins: {
    development: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ],
    production: [
      'https://blinkbudget.netlify.app',
      'https://www.blinkbudget.netlify.app',
      // Add your custom domain here when deployed
    ],
  },

  // CORS headers to be sent with responses
  headers: {
    'Access-Control-Allow-Origin': '*', // This should be dynamically set based on origin
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  },

  /**
   * Check if an origin is allowed
   * @param {string} origin - The requesting origin
   * @param {string} environment - Current environment (development/production)
   * @returns {boolean} Whether the origin is allowed
   */
  isOriginAllowed(origin, environment = 'development') {
    if (!origin) return false;

    const allowedOrigins =
      this.allowedOrigins[environment] || this.allowedOrigins.development;
    return allowedOrigins.includes(origin);
  },

  /**
   * Get CORS headers for a specific origin
   * @param {string} origin - The requesting origin
   * @param {string} environment - Current environment
   * @returns {Object} CORS headers
   */
  getCorsHeaders(origin, environment = 'development') {
    const headers = { ...this.headers };

    // Set specific origin if allowed, otherwise don't set the header
    if (this.isOriginAllowed(origin, environment)) {
      headers['Access-Control-Allow-Origin'] = origin;
    } else {
      // Don't set the header for disallowed origins
      delete headers['Access-Control-Allow-Origin'];
    }

    return headers;
  },

  /**
   * Handle preflight OPTIONS request
   * @param {string} origin - The requesting origin
   * @param {string} environment - Current environment
   * @returns {Object} Response for preflight request
   */
  handlePreflight(origin, environment = 'development') {
    return {
      status: 204,
      headers: this.getCorsHeaders(origin, environment),
    };
  },
};

/**
 * Express.js CORS middleware example (for future use)
 *
 * import { corsConfig } from './cors-config.js';
 *
 * app.use((req, res, next) => {
 *   const origin = req.headers.origin;
 *   const environment = process.env.NODE_ENV || 'development';
 *
 *   // Handle preflight requests
 *   if (req.method === 'OPTIONS') {
 *     const preflightResponse = corsConfig.handlePreflight(origin, environment);
 *     Object.entries(preflightResponse.headers).forEach(([key, value]) => {
 *       res.setHeader(key, value);
 *     });
 *     return res.status(preflightResponse.status).end();
 *   }
 *
 *   // Add CORS headers to all responses
 *   const headers = corsConfig.getCorsHeaders(origin, environment);
 *   Object.entries(headers).forEach(([key, value]) => {
 *     res.setHeader(key, value);
 *   });
 *
 *   next();
 * });
 */

/**
 * Firebase Functions CORS configuration example
 *
 * import { corsConfig } from './cors-config.js';
 *
 * exports.yourFunction = functions.https.onRequest((req, res) => {
 *   const origin = req.headers.origin;
 *   const environment = process.env.NODE_ENV || 'development';
 *
 *   // Handle preflight
 *   if (req.method === 'OPTIONS') {
 *     const preflightResponse = corsConfig.handlePreflight(origin, environment);
 *     Object.entries(preflightResponse.headers).forEach(([key, value]) => {
 *       res.setHeader(key, value);
 *     });
 *     return res.status(preflightResponse.status).end();
 *   }
 *
 *   // Add CORS headers
 *   const headers = corsConfig.getCorsHeaders(origin, environment);
 *   Object.entries(headers).forEach(([key, value]) => {
 *     res.setHeader(key, value);
 *   });
 *
 *   // Your function logic here
 *   res.json({ message: 'Hello from BlinkBudget API' });
 * });
 */
