/**
 * Enhanced Test Framework - WebApp.md Testing Strategy
 * Comprehensive testing utilities for unit, component, and E2E tests
 */

export class TestFramework {
  constructor() {
    this.tests = new Map();
    this.suites = new Map();
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };
    this.config = {
      timeout: 5000,
      retries: 3,
      verbose: false,
      stopOnFirstError: false,
    };
  }

  // Test Suite Management
  describe(name, callback) {
    console.log(`\n📋 Test Suite: ${name}`);

    const suite = {
      name,
      tests: [],
      beforeEach: [],
      afterEach: [],
    };

    this.suites.set(name, suite);

    // Execute suite
    callback();

    // Run suite tests
    this.runSuite(suite);
  }

  it(name, callback, options = {}) {
    const test = {
      name,
      callback,
      timeout: options.timeout || this.config.timeout,
      retries: options.retries || this.config.retries,
      skip: options.skip || false,
      only: options.only || false,
    };

    const currentSuite = Array.from(this.suites.values()).pop();
    if (currentSuite) {
      currentSuite.tests.push(test);
    }

    this.tests.set(name, test);
  }

  beforeEach(callback) {
    const currentSuite = Array.from(this.suites.values()).pop();
    if (currentSuite) {
      currentSuite.beforeEach.push(callback);
    }
  }

  afterEach(callback) {
    const currentSuite = Array.from(this.suites.values()).pop();
    if (currentSuite) {
      currentSuite.afterEach.push(callback);
    }
  }

  async runSuite(suite) {
    for (const test of suite.tests) {
      if (test.skip) {
        console.log(`⏭️  Skipping: ${test.name}`);
        this.results.skipped++;
        continue;
      }

      await this.runTest(test, suite);
    }
  }

  async runTest(test, suite) {
    const startTime = performance.now();
    let attempts = 0;

    while (attempts < test.retries) {
      attempts++;

      try {
        // Run beforeEach hooks
        for (const hook of suite.beforeEach) {
          await hook();
        }

        // Run test
        await this.withTimeout(test.callback(), test.timeout);

        // Test passed
        const duration = performance.now() - startTime;
        console.log(`✅ ${test.name} (${duration.toFixed(2)}ms)`);
        this.results.passed++;
        break;
      } catch (error) {
        if (attempts === test.retries) {
          // Test failed after all retries
          const duration = performance.now() - startTime;
          console.log(`❌ ${test.name} (${duration.toFixed(2)}ms)`);
          console.log(`   Error: ${error.message}`);
          this.results.failed++;

          if (this.config.stopOnFirstError) {
            throw error;
          }
        } else {
          console.log(`🔄 Retry ${attempts}/${test.retries} for ${test.name}`);
          await this.delay(100 * attempts); // Exponential backoff
        }
      } finally {
        // Run afterEach hooks
        for (const hook of suite.afterEach) {
          await hook();
        }
      }
    }

    this.results.total++;
  }

  withTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Test timeout after ${timeout}ms`)),
          timeout
        );
      }),
    ]);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Assertion Helpers
  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertNotEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected not ${expected}, got ${actual}`);
    }
  }

  assertDeepEqual(actual, expected, message) {
    if (!this.isDeepEqual(actual, expected)) {
      throw new Error(message || `Objects not deeply equal`);
    }
  }

  assertThrows(callback, expectedError, message) {
    try {
      callback();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(
          message || `Expected error to contain "${expectedError}"`,
          { cause: error }
        );
      }
    }
  }

  assertDoesNotThrow(callback, message) {
    try {
      callback();
    } catch (error) {
      throw new Error(
        message || `Expected function not to throw, but got: ${error.message}`,
        { cause: error }
      );
    }
  }

  isDeepEqual(a, b) {
    if (a === b) return true;

    if (
      typeof a !== 'object' ||
      typeof b !== 'object' ||
      a === null ||
      b === null
    ) {
      return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key) || a[key] !== b[key]) {
        return false;
      }
    }

    return true;
  }

  // DOM Testing Helpers
  createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    });

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);

      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(_mutations => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  async waitForEvent(element, eventType, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        element.removeEventListener(eventType, handler);
        reject(new Error(`Event ${eventType} not fired within ${timeout}ms`));
      }, timeout);

      const handler = event => {
        clearTimeout(timeoutId);
        resolve(event);
      };

      element.addEventListener(eventType, handler);
    });
  }

  // Component Testing Helpers
  async renderComponent(Component, props = {}) {
    const container = this.createElement('div');
    document.body.appendChild(container);

    try {
      const component = new Component(container, props);
      await this.waitFor(
        () => component.element && component.element.children.length > 0,
        1000
      );
      return { component, container };
    } catch (error) {
      document.body.removeChild(container);
      throw error;
    }
  }

  cleanup(container) {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }

  // Performance Testing Helpers
  async measureRenderTime(component, props = {}) {
    const { component: comp, container } = await this.renderComponent(
      component,
      props
    );

    const startTime = performance.now();

    // Force re-render
    comp.render();

    await this.waitFor(() => {
      // Wait for rendering to complete
      return comp.element.children.length > 0;
    }, 1000);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    this.cleanup(container);

    return renderTime;
  }

  // Accessibility Testing Helpers
  checkAccessibility(element) {
    const issues = [];

    // Check for alt text on images
    element.querySelectorAll('img').forEach((img, index) => {
      if (!img.alt) {
        issues.push({
          type: 'missing-alt',
          element: 'img',
          index,
          message: 'Image missing alt text',
        });
      }
    });

    // Check for proper labels on inputs
    element
      .querySelectorAll('input, select, textarea')
      .forEach((input, index) => {
        const hasLabel =
          input.closest('label') ||
          input.getAttribute('aria-label') ||
          input.getAttribute('aria-labelledby');
        if (!hasLabel && input.type !== 'hidden') {
          issues.push({
            type: 'missing-label',
            element: input.tagName,
            index,
            message: 'Form input missing proper label',
          });
        }
      });

    // Check for proper heading structure
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      issues.push({
        type: 'missing-headings',
        element: 'document',
        message: 'No heading structure found',
      });
    }

    return issues;
  }

  // Network Testing Helpers
  mockFetch(response, delay = 0) {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      await this.delay(delay);
      return typeof response === 'function'
        ? response(...args)
        : Promise.resolve(response);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }

  // Reporting
  getResults() {
    const successRate =
      this.results.total > 0
        ? ((this.results.passed / this.results.total) * 100).toFixed(1)
        : '0.0';

    return {
      ...this.results,
      successRate: parseFloat(successRate),
      status: this.results.failed === 0 ? 'PASSED' : 'FAILED',
    };
  }

  printResults() {
    const results = this.getResults();

    console.log('\n=== Test Results ===');
    console.log(`Total: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Success Rate: ${results.successRate}%`);
    console.log(`Status: ${results.status}`);
    console.log('==================\n');

    return results;
  }

  // Reset for new test run
  reset() {
    this.tests.clear();
    this.suites.clear();
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };
  }
}

// Global test framework instance
export const test = new TestFramework();

// Convenience exports for common patterns
export const describe = test.describe.bind(test);
export const it = test.it.bind(test);
export const beforeEach = test.beforeEach.bind(test);
export const afterEach = test.afterEach.bind(test);
export const assert = test.assert.bind(test);
export const assertEqual = test.assertEqual.bind(test);
export const assertNotEqual = test.assertNotEqual.bind(test);
export const assertDeepEqual = test.assertDeepEqual.bind(test);
export const assertThrows = test.assertThrows.bind(test);
export const assertDoesNotThrow = test.assertDoesNotThrow.bind(test);
export const waitForElement = test.waitForElement.bind(test);
export const waitForEvent = test.waitForEvent.bind(test);
export const renderComponent = test.renderComponent.bind(test);
export const measureRenderTime = test.measureRenderTime.bind(test);
export const checkAccessibility = test.checkAccessibility.bind(test);
export const mockFetch = test.mockFetch.bind(test);
