/* global require, process, module */

/**
 * Environment Variable Validation Script
 *
 * This script validates that all required environment variables are set
 * before building or deploying the application. It helps prevent runtime
 * errors due to missing configuration.
 *
 * NOTE: This file uses CommonJS (.cjs) to ensure compatibility when run
 * directly via 'node scripts/validate-env.cjs' regardless of the project's
 * "type": "module" setting in package.json.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file for local development
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      return;
    }

    // Find first '=' to split key/value, preserving values that contain '='
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      return; // Skip lines without '='
    }

    const key = line.slice(0, equalIndex).trim();
    const value = line.slice(equalIndex + 1).trim();

    if (key) {
      const cleanKey = key.trim();
      // Remove quotes from value if present
      let cleanValue = value.trim();
      if (
        (cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
        (cleanValue.startsWith("'") && cleanValue.endsWith("'"))
      ) {
        cleanValue = cleanValue.slice(1, -1);
      }

      // Only set if not already set (respect existing process.env)
      if (!process.env[cleanKey]) {
        process.env[cleanKey] = cleanValue;
      }
    }
  });
}

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
];

const optionalVars = [
  'NODE_ENV',
  'NETLIFY_AUTH_TOKEN',
  'NETLIFY_SITE_ID',
  'SNYK_TOKEN',
];

function validateEnvironment() {
  const missing = [];
  const invalid = [];

  console.log('🔍 Validating environment variables...\n');

  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName];

    if (!value) {
      missing.push(varName);
    } else if (value.includes('your-') || value.includes('placeholder')) {
      invalid.push(varName);
    }
  });

  // Report results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error(
      '\nPlease set these variables in your environment or CI/CD secrets.'
    );
    process.exit(1);
  }

  if (invalid.length > 0) {
    console.error(
      '❌ Invalid environment variables (contain placeholder values):'
    );
    invalid.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error(
      '\nPlease replace placeholder values with actual credentials.'
    );
    process.exit(1);
  }

  console.log('✅ All required environment variables are set correctly.');

  // Show optional variables status
  const setOptional = optionalVars.filter(varName => process.env[varName]);
  if (setOptional.length > 0) {
    console.log(`ℹ️  Optional variables set: ${setOptional.join(', ')}`);
  }

  // Validate Firebase configuration format
  validateFirebaseConfig();
}

function validateFirebaseConfig() {
  console.log('\n🔥 Validating Firebase configuration...');

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
  const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET;

  // Basic format validation
  if (projectId && !/^[a-z0-9-]+$/.test(projectId)) {
    console.warn(
      '⚠️  Firebase Project ID may be invalid (should contain only lowercase letters, numbers, and hyphens)'
    );
  }

  if (authDomain && !authDomain.includes('.firebaseapp.com')) {
    console.warn(
      '⚠️  Firebase Auth Domain may be invalid (should end with .firebaseapp.com)'
    );
  }

  if (storageBucket && !storageBucket.includes('.firebasestorage.app')) {
    console.warn(
      '⚠️  Firebase Storage Bucket may be invalid (should end with .firebasestorage.app)'
    );
  }

  console.log('✅ Firebase configuration validation complete.');
}

// Run validation if script is executed directly
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };
