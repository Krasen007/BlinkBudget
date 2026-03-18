/**
 * Environment Validator - WebApp.md Environment Variables
 * Comprehensive validation and type checking for environment variables
 */

export class EnvValidator {
  constructor() {
    this.schema = this.defineSchema();
    this.errors = [];
    this.warnings = [];
    this.isValid = false;
  }

  defineSchema() {
    return {
      // App Configuration
      APP_NAME: {
        type: 'string',
        required: true,
        pattern: /^[A-Za-z0-9\s-]+$/,
        description: 'Application name',
      },

      APP_URL: {
        type: 'url',
        required: true,
        pattern: /^https?:\/\/.+/,
        description: 'Application URL',
      },

      APP_VERSION: {
        type: 'string',
        required: true,
        pattern: /^\d+\.\d+\.\d+$/,
        description: 'Application version (semantic)',
      },

      // Database Configuration
      DATABASE_URL: {
        type: 'url',
        required: false,
        pattern: /^postgresql:\/\/.+/,
        description: 'PostgreSQL database connection string',
      },

      // Authentication (Firebase)
      NEXT_PUBLIC_FIREBASE_API_KEY: {
        type: 'string',
        required: false,
        pattern: /^[A-Za-z0-9_-]+$/,
        minLength: 20,
        description: 'Firebase API key',
      },

      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: {
        type: 'url',
        required: false,
        pattern: /^https?:\/\/.+/,
        description: 'Firebase auth domain',
      },

      NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
        type: 'string',
        required: false,
        pattern: /^[a-z0-9-]+$/,
        minLength: 6,
        description: 'Firebase project ID',
      },

      // Payments (Stripe)
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
        type: 'string',
        required: false,
        pattern: /^pk_test_|pk_live_/,
        description: 'Stripe publishable key',
      },

      STRIPE_SECRET_KEY: {
        type: 'string',
        required: false,
        pattern: /^sk_test_|sk_live_/,
        description: 'Stripe secret key',
      },

      STRIPE_WEBHOOK_SECRET: {
        type: 'string',
        required: false,
        minLength: 20,
        description: 'Stripe webhook secret',
      },

      // External APIs
      OPENAI_API_KEY: {
        type: 'string',
        required: false,
        pattern: /^sk-/,
        description: 'OpenAI API key',
      },

      RESSEND_API_KEY: {
        type: 'string',
        required: false,
        pattern: /^re_[A-Za-z0-9]+$/,
        description: 'Resend API key',
      },

      // Analytics
      NEXT_PUBLIC_GA_TRACKING_ID: {
        type: 'string',
        required: false,
        pattern: /^G-[A-Z0-9]+$/,
        description: 'Google Analytics tracking ID',
      },

      // Development
      NODE_ENV: {
        type: 'enum',
        enum: ['development', 'production', 'test'],
        required: true,
        description: 'Node environment',
      },
    };
  }

  validate() {
    this.errors = [];
    this.warnings = [];

    console.log('[EnvValidator] Validating environment variables...');

    // Validate each variable in schema
    Object.entries(this.schema).forEach(([key, config]) => {
      this.validateVariable(key, config);
    });

    // Check for deprecated variables
    this.checkDeprecatedVariables();

    // Check for security issues
    this.checkSecurityIssues();

    // Validate Node.js version
    this.validateNodeVersion();

    this.isValid = this.errors.length === 0;

    this.reportResults();

    return {
      isValid: this.isValid,
      errors: this.errors,
      warnings: this.warnings,
      schema: this.schema,
    };
  }

  validateVariable(key, config) {
    const value = this.getEnvValue(key);
    const isPublic = key.startsWith('NEXT_PUBLIC_');

    // Skip validation for optional variables that aren't set
    if (!config.required && !value) {
      return;
    }

    // Type validation
    if (!this.validateType(value, config.type)) {
      this.errors.push({
        variable: key,
        message: `Expected type ${config.type}, got ${typeof value}`,
        value: isPublic ? '[HIDDEN]' : value,
      });
      return;
    }

    // Pattern validation
    if (config.pattern && !config.pattern.test(value)) {
      this.errors.push({
        variable: key,
        message: `Invalid format for ${config.description}`,
        pattern: config.pattern.toString(),
        value: isPublic ? '[HIDDEN]' : value,
      });
      return;
    }

    // Length validation
    if (config.minLength && value.length < config.minLength) {
      this.errors.push({
        variable: key,
        message: `Too short (minimum ${config.minLength} characters)`,
        expected: config.minLength,
        actual: value.length,
      });
      return;
    }

    // Enum validation
    if (config.enum && !config.enum.includes(value)) {
      this.errors.push({
        variable: key,
        message: `Invalid value, must be one of: ${config.enum.join(', ')}`,
        expected: config.enum,
        actual: value,
      });
      return;
    }

    // Specific validations
    this.validateSpecificVariable(key, value, config);
  }

  validateType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'url':
        return typeof value === 'string' && this.isValidUrl(value);
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'enum':
        return typeof value === 'string';
      default:
        return true;
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  validateSpecificVariable(key, value, _config) {
    switch (key) {
      case 'APP_URL':
        if (value.endsWith('/')) {
          this.warnings.push({
            variable: key,
            message: 'URL should not end with trailing slash',
          });
        }
        break;

      case 'DATABASE_URL':
        if (value && !value.includes('sslmode=')) {
          this.warnings.push({
            variable: key,
            message: 'Database URL should include SSL mode',
          });
        }
        break;

      case 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY':
        if (value && value.startsWith('sk_')) {
          this.errors.push({
            variable: key,
            message: 'Secret key exposed in public variable',
          });
        }
        break;
    }
  }

  checkDeprecatedVariables() {
    const deprecated = [
      'API_KEY',
      'SECRET_KEY',
      'DATABASE_PASSWORD',
      'JWT_SECRET',
    ];

    deprecated.forEach(key => {
      if (this.getEnvValue(key)) {
        this.warnings.push({
          variable: key,
          message: 'Deprecated variable name',
          suggestion: `Use specific naming instead`,
        });
      }
    });
  }

  checkSecurityIssues() {
    const secrets = this.getSecretVariables();

    secrets.forEach(secret => {
      const value = this.getEnvValue(secret);
      if (value && this.isWeakSecret(value)) {
        this.errors.push({
          variable: secret,
          message: 'Weak or default secret detected',
          severity: 'high',
        });
      }
    });

    // Check for exposed secrets in public variables
    const publicVars = this.getPublicVariables();
    publicVars.forEach(pubVar => {
      const value = this.getEnvValue(pubVar);
      if (value && this.isSecretPattern(value)) {
        this.errors.push({
          variable: pubVar,
          message: 'Secret pattern detected in public variable',
          severity: 'critical',
        });
      }
    });
  }

  getSecretVariables() {
    // Browser environment doesn't have access to server-side environment variables
    // This method is not applicable in browser context
    return [];
  }

  getPublicVariables() {
    // Browser environment doesn't have access to server-side environment variables
    // This method is not applicable in browser context
    return [];
  }

  isWeakSecret(value) {
    const weakPatterns = [
      /test/i,
      /demo/i,
      /example/i,
      /default/i,
      /123456/,
      /password/i,
      /secret/i,
    ];

    return weakPatterns.some(pattern => pattern.test(value));
  }

  isSecretPattern(value) {
    const secretPatterns = [
      /^sk_/,
      /^pk_/,
      /-----BEGIN/,
      /-----END/,
      /^[A-Za-z0-9_-]{20,}$/,
    ];

    return secretPatterns.some(pattern => pattern.test(value));
  }

  validateNodeVersion() {
    // Browser environment doesn't have Node.js version
    // This method is not applicable in browser context
    return;
  }

  getEnvValue(key) {
    // In browser context, check for global window variables or import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || null;
    }
    return window[key] || null;
  }

  reportResults() {
    console.log('\n=== Environment Validation Results ===');
    console.log(`Status: ${this.isValid ? '✅ VALID' : '❌ INVALID'}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.variable}: ${error.message}`);
        if (error.severity) {
          console.log(`   Severity: ${error.severity}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.variable}: ${warning.message}`);
        if (warning.suggestion) {
          console.log(`   Suggestion: ${warning.suggestion}`);
        }
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All environment variables are valid!');
    }

    console.log('=====================================\n');
  }

  // Generate .env.example file
  generateEnvExample() {
    const example = {};

    Object.entries(this.schema).forEach(([key, config]) => {
      if (config.required) {
        example[key] = this.generateExampleValue(config);
      } else {
        example[key] = `# ${config.description} (optional)`;
      }
    });

    const content = Object.entries(example)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    return content;
  }

  generateExampleValue(config) {
    switch (config.type) {
      case 'url':
        return 'https://example.com';
      case 'string':
        return config.description.toLowerCase().replace(/\s+/g, '_');
      case 'number':
        return '123';
      case 'boolean':
        return 'true';
      case 'enum':
        return config.enum[0];
      default:
        return 'example_value';
    }
  }

  // Get validation schema as JSON
  getSchemaAsJson() {
    return JSON.stringify(this.schema, null, 2);
  }

  // Runtime validation for production
  validateForProduction() {
    const result = this.validate();

    const isProduction =
      typeof import.meta !== 'undefined' &&
      import.meta.env?.MODE === 'production';
    if (isProduction) {
      // Additional production checks
      if (this.getEnvValue('NODE_ENV') !== 'production') {
        this.errors.push({
          variable: 'NODE_ENV',
          message: 'NODE_ENV must be "production" in production',
          severity: 'critical',
        });
      }

      // Check for development variables in production
      const devVars = ['localhost', '127.0.0.1', '0.0.0.0'];
      const appUrl = this.getEnvValue('APP_URL');
      if (appUrl && devVars.some(devVar => appUrl.includes(devVar))) {
        this.errors.push({
          variable: 'APP_URL',
          message: 'Development URL detected in production',
          severity: 'critical',
        });
      }
    }

    return result;
  }
}

// Global validator instance
export const envValidator = new EnvValidator();

// Auto-validate on import
if (typeof window !== 'undefined') {
  const result = envValidator.validateForProduction();

  if (!result.isValid) {
    console.error(
      '❌ Environment validation failed. Please fix the issues above.'
    );
    const isProduction =
      typeof import.meta !== 'undefined' &&
      import.meta.env?.MODE === 'production';
    if (isProduction) {
      console.error('🚨 Production environment has validation errors!');
    }
  }
}
