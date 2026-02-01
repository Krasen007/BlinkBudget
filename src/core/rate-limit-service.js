/**
 * Rate limiting service for authentication attempts
 * Prevents brute force attacks and abuse
 */
export class RateLimitService {
  constructor() {
    this.attempts = new Map(); // key -> { count, lastAttempt, lockedUntil }
    this.maxAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.windowDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate a key for rate limiting based on identifier
   * @param {string} identifier - Email, IP, or other identifier
   * @returns {string} Rate limit key
   */
  generateKey(identifier) {
    return `auth_${identifier}`;
  }

  /**
   * Check if an identifier is currently rate limited
   * @param {string} identifier - Email, IP, or other identifier
   * @returns {Object} Rate limit status
   */
  checkRateLimit(identifier) {
    const key = this.generateKey(identifier);
    const now = Date.now();
    const record = this.attempts.get(key);

    // If no record exists, allow
    if (!record) {
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    // Check if currently locked out
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingTime = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        allowed: false,
        locked: true,
        remainingTime,
        error: `Too many failed attempts. Try again in ${remainingTime} seconds.`,
      };
    }

    // Check if window has expired, reset if so
    if (now - record.lastAttempt > this.windowDuration) {
      this.attempts.delete(key);
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    // Check if max attempts reached
    if (record.count >= this.maxAttempts) {
      const lockedUntil = now + this.lockoutDuration;
      record.lockedUntil = lockedUntil;
      this.attempts.set(key, record);

      const remainingTime = Math.ceil(this.lockoutDuration / 1000);
      return {
        allowed: false,
        locked: true,
        remainingTime,
        error: `Too many failed attempts. Try again in ${remainingTime} seconds.`,
      };
    }

    const remainingAttempts = this.maxAttempts - record.count;
    return { allowed: true, remainingAttempts };
  }

  /**
   * Record a failed attempt
   * @param {string} identifier - Email, IP, or other identifier
   * @returns {Object} Updated rate limit status
   */
  recordFailedAttempt(identifier) {
    const key = this.generateKey(identifier);
    const now = Date.now();
    const record = this.attempts.get(key) || { count: 0, lastAttempt: 0 };

    record.count++;
    record.lastAttempt = now;
    this.attempts.set(key, record);

    return this.checkRateLimit(identifier);
  }

  /**
   * Record a successful attempt and clear the rate limit
   * @param {string} identifier - Email, IP, or other identifier
   */
  recordSuccessfulAttempt(identifier) {
    const key = this.generateKey(identifier);
    this.attempts.delete(key);
  }

  /**
   * Get rate limit information for display
   * @param {string} identifier - Email, IP, or other identifier
   * @returns {Object} Rate limit info
   */
  getRateLimitInfo(identifier) {
    const key = this.generateKey(identifier);
    const record = this.attempts.get(key);
    const now = Date.now();

    if (!record) {
      return {
        attempts: 0,
        remainingAttempts: this.maxAttempts,
        lockedUntil: null,
        isLocked: false,
      };
    }

    const isLocked = record.lockedUntil && now < record.lockedUntil;
    const remainingAttempts = isLocked ? 0 : this.maxAttempts - record.count;

    return {
      attempts: record.count,
      remainingAttempts,
      lockedUntil: record.lockedUntil,
      isLocked,
    };
  }

  /**
   * Clear all rate limit data (for testing or admin)
   * @param {string} [identifier] - Specific identifier to clear, or clear all if not provided
   */
  clearRateLimit(identifier = null) {
    if (identifier) {
      const key = this.generateKey(identifier);
      this.attempts.delete(key);
    } else {
      this.attempts.clear();
    }
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (
        now - record.lastAttempt > this.windowDuration &&
        (!record.lockedUntil || now >= record.lockedUntil)
      ) {
        this.attempts.delete(key);
      }
    }
  }
}

// Singleton instance
export const rateLimitService = new RateLimitService();

// Auto-cleanup every 10 minutes
setInterval(
  () => {
    rateLimitService.cleanup();
  },
  10 * 60 * 1000
);
