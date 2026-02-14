/**
 * Security Test Data for BlinkBudget
 * Contains mock PII and financial data for testing security controls
 *
 * IMPORTANT: This data is for TESTING ONLY and should never be used in production
 */

/* eslint-disable no-script-url */

// Mock PII Data for Privacy Testing
export const mockPII = {
  // Valid test emails (using reserved example domains)
  validEmails: [
    'test.user@example.com',
    'jane.doe@test.org',
    'john.smith@example.net',
    'user123@test-domain.com',
    'first.last@subdomain.example.org',
  ],

  // Invalid email formats for input validation testing
  invalidEmails: [
    '', // Empty
    null, // Null
    undefined, // Undefined
    'plaintext', // No @
    '@domain.com', // No local part
    'user@', // No domain
    'user..name@domain.com', // Double dots
    'user@domain', // No TLD
    'user name@domain.com', // Space
    'user@domain..com', // Double dots in domain
    'very.long.email.address.that.exceeds.normal.limits@domain.com',
  ],

  // Test phone numbers (various formats)
  phoneNumbers: [
    '+1-555-123-4567',
    '(555) 123-4567',
    '555.123.4567',
    '5551234567',
    '1-555-123-4567',
    '+44 20 7123 4567', // UK format
    'invalid-phone-format',
  ],

  // Test addresses for input validation
  addresses: {
    valid: [
      '123 Main St, Anytown, ST 12345',
      '456 Oak Avenue, Suite 100, Big City, NY 10001',
      '789 Pine Rd, Apt 2B, Smalltown, CA 90210',
    ],
    malicious: [
      '<script>alert("XSS")</script> Main St',
      "123 Main St'; DROP TABLE users; --",
      '<img src=x onerror=alert("XSS")> Avenue',
      'javascript:alert("XSS") Street',
    ],
  },

  // Test names for validation
  names: {
    valid: [
      'John Doe',
      'Jane Smith',
      'Émilie Du Châtelet', // Unicode characters
      'José María González', // Accented characters
      '张伟', // Chinese characters
    ],
    malicious: [
      '<script>alert("XSS")</script>',
      "Admin'; DROP TABLE users; --",
      '<img src=x onerror=alert("XSS")>',
      '../../etc/passwd',
    ],
  },
};

// Financial Test Data
export const mockFinancialData = {
  // Valid transaction data
  validTransactions: [
    {
      amount: 25.5,
      category: 'Food & Dining',
      date: '2024-01-15',
      type: 'expense',
      description: 'Lunch at cafe',
    },
    {
      amount: 1500.0,
      category: 'Salary',
      date: '2024-01-01',
      type: 'income',
      description: 'Monthly salary',
    },
    {
      amount: 89.99,
      category: 'Shopping',
      date: '2024-01-10',
      type: 'expense',
      description: 'New shoes',
    },
    {
      amount: 1200.0,
      category: 'Rent',
      date: '2024-01-01',
      type: 'expense',
      description: 'Monthly rent',
    },
    {
      amount: 45.75,
      category: 'Transportation',
      date: '2024-01-12',
      type: 'expense',
      description: 'Gas refill',
    },
  ],

  // Edge case transaction amounts
  edgeCaseAmounts: [
    0, // Zero amount
    0.01, // Minimum positive
    999999999.99, // Very large amount
    -100, // Negative amount (should be rejected)
    100.001, // Extra decimal places
    '100', // String number
    'invalid', // Invalid amount
    null, // Null amount
    undefined, // Undefined amount
    Infinity, // Infinity
    NaN, // Not a Number
  ],

  // Malicious transaction data for injection testing
  maliciousTransactions: [
    {
      amount: '<script>alert("XSS")</script>',
      category: 'Food & Dining',
      date: '2024-01-15',
      type: 'expense',
      description: 'javascript:alert("XSS")',
    },
    {
      amount: '100.00',
      category: 'Food & Dining',
      date: '2024-01-15',
      type: 'expense',
      description: '<svg onload=alert("XSS")> Purchase',
    },
    {
      amount: '50.00',
      category: 'Shopping"; UPDATE users SET password="hacked"; --',
      date: '2024-01-10',
      type: 'expense',
      description: 'Normal description',
    },
  ],

  // Budget test data
  budgets: [
    {
      category: 'Food & Dining',
      amount: 500.0,
      period: 'monthly',
    },
    {
      category: 'Transportation',
      amount: 200.0,
      period: 'monthly',
    },
    {
      category: 'Entertainment',
      amount: 150.0,
      period: 'monthly',
    },
  ],

  // Malicious budget data
  maliciousBudgets: [
    {
      category: '<script>alert("XSS")</script>',
      amount: '500; DROP TABLE budgets; --',
      period: 'monthly',
    },
    {
      category: 'Food & Dining',
      amount: '<img src=x onerror=alert("XSS")>',
      period: 'javascript:alert("XSS")',
    },
  ],

  // Goals test data
  goals: [
    {
      name: 'Emergency Fund',
      targetAmount: 10000.0,
      currentAmount: 2500.0,
      deadline: '2024-12-31',
      category: 'Savings',
    },
    {
      name: 'Vacation Fund',
      targetAmount: 3000.0,
      currentAmount: 750.0,
      deadline: '2024-06-30',
      category: 'Travel',
    },
  ],

  // Malicious goals data
  maliciousGoals: [
    {
      name: '<script>alert("XSS")</script>',
      targetAmount: '10000; DROP TABLE goals; --',
      currentAmount: '<img src=x onerror=alert("XSS")>',
      deadline: '../../etc/passwd',
      category: 'javascript:alert("XSS")',
    },
  ],
};

// Authentication Test Data
export const mockAuthData = {
  // Valid test credentials (using example.com as per RFC 2606)
  // snyk-ignore: javascript/NoHardcodedPasswords/test - Test fixture passwords
  validCredentials: [
    {
      email: 'test.user@example.com',
    },
    {
      email: 'jane.doe@test.org',
    },
  ],

  // Weak passwords for validation testing
  weakPasswords: [
    '', // Empty
    '123', // Too short
    'password', // No numbers
    '12345678', // No letters
    'qwerty', // Common password and too short
    '11111111', // Repeated characters, no letters
    'aaaaaaa', // Repeated letters, no numbers, too short
    'Pass', // Too short
    null, // Null
    undefined, // Undefined
  ],

  // Strong passwords
  strongPasswords: [
    'SecurePassword123',
    'MyP@ssw0rd!',
    'ComplexPass456',
    'Str0ng#Password',
    'ValidPass789',
  ],

  // SQL injection attempts
  sqlInjectionAttempts: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' UNION SELECT * FROM users --",
    "'; UPDATE users SET password='hacked' --",
    "' OR 'x'='x",
    "1' OR '1'='1' /*",
    "x'; DELETE FROM users WHERE 't'='t",
  ],

  // XSS attempts
  xssAttempts: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<body onload=alert("XSS")>',
    '<input onfocus=alert("XSS") autofocus>',
    '<select onfocus=alert("XSS") autofocus>',
  ],
};

// Rate Limiting Test Data
export const mockRateLimitData = {
  // Test scenarios for rate limiting
  scenarios: [
    {
      description: 'Rapid login attempts',
      email: 'test.user@example.com',
      attempts: 10,
      timeWindow: 60000, // 1 minute
      expectedBehavior: 'Rate limited after 5 attempts',
    },
    {
      description: 'Distributed attack simulation',
      emails: [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
        'user4@example.com',
        'user5@example.com',
      ],
      attemptsPerEmail: 3,
      timeWindow: 60000,
      expectedBehavior: 'Each email rate limited independently',
    },
    {
      description: 'Password reset abuse',
      email: 'test.user@example.com',
      attempts: 5,
      timeWindow: 300000, // 5 minutes
      expectedBehavior: 'Rate limited after 3 attempts',
    },
  ],
};

// File Upload Test Data (if applicable)
export const mockFileData = {
  // Malicious file names
  maliciousFileNames: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    'file.txt; DROP TABLE users; --',
    '<script>alert("XSS")</script>.txt',
    'file.php',
    'file.exe',
    'file.bat',
    'file.sh',
    '.htaccess',
    'web.config',
  ],

  // Large file sizes for testing limits
  largeFileSizes: [
    1024 * 1024 * 10, // 10MB
    1024 * 1024 * 50, // 50MB
    1024 * 1024 * 100, // 100MB
  ],
};

// Network Test Data
export const mockNetworkData = {
  // Malicious URLs
  maliciousUrls: [
    'javascript:alert("XSS")',
    'data:text/html,<script>alert("XSS")</script>',
    'vbscript:msgbox("XSS")',
    'file:///etc/passwd',
    'ftp://malicious.com/exploit',
    'http://evil.com/phishing',
  ],

  // CORS test origins
  testOrigins: [
    'https://malicious.com',
    'http://localhost:3000',
    'null',
    'file://',
    'data://',
  ],
};

// Export all test data
export default {
  mockPII,
  mockFinancialData,
  mockAuthData,
  mockRateLimitData,
  mockFileData,
  mockNetworkData,
};
