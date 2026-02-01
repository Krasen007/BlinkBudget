/**
 * Security Monitor
 *
 * This module provides real-time security monitoring and threat detection
 * for the BlinkBudget application.
 */

import { securityAuditLogger } from './security-audit-logger.js';

export class SecurityMonitor {
  constructor() {
    this.threatThresholds = {
      failedLoginAttempts: 5,
      suspiciousActivityWindow: 300000, // 5 minutes
      dataAccessAnomaly: 50, // Unusual number of data accesses
      ipChangeFrequency: 3, // Number of IP changes considered suspicious
    };

    this.monitoring = {
      failedLogins: new Map(),
      dataAccessPatterns: new Map(),
      ipTracking: new Map(),
      activeSessions: new Map(),
    };

    this.startMonitoring();
  }

  /**
   * Start security monitoring
   */
  startMonitoring() {
    // Monitor authentication events
    this.monitorAuthEvents();

    // Monitor data access patterns
    this.monitorDataAccess();

    // Monitor for suspicious IP changes
    this.monitorIPChanges();

    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Monitor authentication events for suspicious patterns
   */
  monitorAuthEvents() {
    // This would be called by the auth service on login attempts
    window.addEventListener('auth-event', event => {
      const { type, userId, success, ip } = event.detail;

      if (!success && type === 'login') {
        this.trackFailedLogin(userId, ip);
      }
    });
  }

  /**
   * Track failed login attempts
   * @param {string} userId - User ID
   * @param {string} ip - IP address
   */
  trackFailedLogin(userId, ip) {
    const key = `${userId}:${ip}`;
    const attempts = this.monitoring.failedLogins.get(key) || [];

    attempts.push(Date.now());
    this.monitoring.failedLogins.set(key, attempts);

    // Check if threshold exceeded
    if (attempts.length >= this.threatThresholds.failedLoginAttempts) {
      this.handleSuspiciousActivity('brute_force', {
        userId,
        ip,
        attempts: attempts.length,
        timeWindow: this.threatThresholds.suspiciousActivityWindow,
      });
    }
  }

  /**
   * Monitor data access patterns
   */
  monitorDataAccess() {
    // Track data access frequency and patterns
    window.addEventListener('data-access', event => {
      const { userId, operation, resource } = event.detail;

      const key = `${userId}:${operation}`;
      const accesses = this.monitoring.dataAccessPatterns.get(key) || [];

      accesses.push({
        timestamp: Date.now(),
        resource,
      });

      this.monitoring.dataAccessPatterns.set(key, accesses);

      // Check for unusual access patterns
      if (accesses.length > this.threatThresholds.dataAccessAnomaly) {
        this.handleSuspiciousActivity('data_exfiltration', {
          userId,
          operation,
          accessCount: accesses.length,
        });
      }
    });
  }

  /**
   * Monitor IP address changes for users
   */
  monitorIPChanges() {
    window.addEventListener('auth-event', event => {
      const { userId, ip, success } = event.detail;

      if (!success) return;

      const userIPs = this.monitoring.ipTracking.get(userId) || [];

      // Check if this is a new IP
      if (!userIPs.some(entry => entry.ip === ip)) {
        userIPs.push({
          ip,
          timestamp: Date.now(),
        });

        this.monitoring.ipTracking.set(userId, userIPs);

        // Check for frequent IP changes
        const recentIPs = userIPs.filter(
          entry =>
            Date.now() - entry.timestamp <
            this.threatThresholds.suspiciousActivityWindow
        );

        if (recentIPs.length >= this.threatThresholds.ipChangeFrequency) {
          this.handleSuspiciousActivity('account_hijacking', {
            userId,
            ipChanges: recentIPs.length,
            ips: recentIPs.map(entry => entry.ip),
          });
        }
      }
    });
  }

  /**
   * Handle suspicious activity detection
   * @param {string} threatType - Type of threat detected
   * @param {Object} details - Threat details
   */
  handleSuspiciousActivity(threatType, details) {
    const incident = {
      threatType,
      severity: this.getThreatSeverity(threatType),
      timestamp: new Date().toISOString(),
      ...details,
    };

    // Log the security incident
    securityAuditLogger.logSecurityIncident(threatType, {
      ...incident,
      description: this.generateThreatDescription(threatType, details),
    });

    // Take appropriate action based on threat type
    this.respondToThreat(threatType, incident);
  }

  /**
   * Get threat severity level
   * @param {string} threatType - Type of threat
   * @returns {string} Severity level
   */
  getThreatSeverity(threatType) {
    const severityMap = {
      brute_force: 'high',
      data_exfiltration: 'critical',
      account_hijacking: 'critical',
      suspicious_access: 'medium',
      anomaly_detected: 'medium',
    };

    return severityMap[threatType] || 'medium';
  }

  /**
   * Generate human-readable threat description
   * @param {string} threatType - Type of threat
   * @param {Object} details - Threat details
   * @returns {string} Description
   */
  generateThreatDescription(threatType, details) {
    const descriptions = {
      brute_force: `Multiple failed login attempts detected for user ${details.userId} from IP ${details.ip}`,
      data_exfiltration: `Unusual data access pattern detected for user ${details.userId} - ${details.accessCount} accesses`,
      account_hijacking: `Multiple IP address changes detected for user ${details.userId} - possible account hijacking`,
      suspicious_access: `Suspicious access pattern detected`,
      anomaly_detected: `Security anomaly detected in user behavior`,
    };

    return descriptions[threatType] || 'Security threat detected';
  }

  /**
   * Respond to detected threats
   * @param {string} threatType - Type of threat
   * @param {Object} incident - Incident details
   */
  respondToThreat(threatType, incident) {
    switch (threatType) {
      case 'brute_force':
        this.triggerRateLimit(incident.ip);
        this.notifyAdmin('Brute force attack detected', incident);
        break;

      case 'data_exfiltration':
        this.triggerTemporaryLock(incident.userId);
        this.notifyAdmin('Potential data exfiltration', incident);
        break;

      case 'account_hijacking':
        this.triggerAccountLock(incident.userId);
        this.notifyAdmin('Account hijacking suspected', incident);
        break;

      default:
        this.notifyAdmin('Security incident detected', incident);
    }
  }

  /**
   * Trigger rate limiting for IP address
   * @param {string} ip - IP address to rate limit
   */
  triggerRateLimit(ip) {
    // This would integrate with your rate limiting service
    console.warn(`Rate limiting triggered for IP: ${ip}`);

    // Store rate limit info
    const rateLimits = JSON.parse(localStorage.getItem('rate_limits') || '{}');
    rateLimits[ip] = {
      triggered: Date.now(),
      duration: 3600000, // 1 hour
      reason: 'brute_force',
    };
    localStorage.setItem('rate_limits', JSON.stringify(rateLimits));
  }

  /**
   * Trigger temporary account lock
   * @param {string} userId - User ID to lock
   */
  triggerTemporaryLock(userId) {
    console.warn(`Temporary lock triggered for user: ${userId}`);

    const locks = JSON.parse(localStorage.getItem('account_locks') || '{}');
    locks[userId] = {
      triggered: Date.now(),
      duration: 1800000, // 30 minutes
      reason: 'suspicious_activity',
    };
    localStorage.setItem('account_locks', JSON.stringify(locks));
  }

  /**
   * Trigger full account lock
   * @param {string} userId - User ID to lock
   */
  triggerAccountLock(userId) {
    console.warn(`Account lock triggered for user: ${userId}`);

    const locks = JSON.parse(localStorage.getItem('account_locks') || '{}');
    locks[userId] = {
      triggered: Date.now(),
      duration: 86400000, // 24 hours
      reason: 'security_threat',
    };
    localStorage.setItem('account_locks', JSON.stringify(locks));
  }

  /**
   * Notify administrators of security incidents
   * @param {string} message - Notification message
   * @param {Object} incident - Incident details
   */
  notifyAdmin(message, incident) {
    // In production, this would send emails, Slack notifications, etc.
    console.error(`SECURITY ALERT: ${message}`, incident);

    // Store for admin dashboard
    const alerts = JSON.parse(localStorage.getItem('security_alerts') || '[]');
    alerts.push({
      message,
      incident,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
    localStorage.setItem('security_alerts', JSON.stringify(alerts));
  }

  /**
   * Get current security status
   * @returns {Object} Security status overview
   */
  getSecurityStatus() {
    const recentIncidents = securityAuditLogger.getRecentIncidents(24);
    const activeAlerts = JSON.parse(
      localStorage.getItem('security_alerts') || '[]'
    );
    const rateLimits = JSON.parse(localStorage.getItem('rate_limits') || '{}');
    const accountLocks = JSON.parse(
      localStorage.getItem('account_locks') || '{}'
    );

    return {
      timestamp: new Date().toISOString(),
      incidents: {
        last24h: recentIncidents.length,
        highSeverity: recentIncidents.filter(i => i.severity === 'high').length,
        critical: recentIncidents.filter(i => i.severity === 'critical').length,
      },
      alerts: {
        total: activeAlerts.length,
        unacknowledged: activeAlerts.filter(a => !a.acknowledged).length,
      },
      protections: {
        rateLimitedIPs: Object.keys(rateLimits).length,
        lockedAccounts: Object.keys(accountLocks).length,
      },
      monitoring: {
        activeSessions: this.monitoring.activeSessions.size,
        trackedIPs: this.monitoring.ipTracking.size,
        dataAccessPatterns: this.monitoring.dataAccessPatterns.size,
      },
    };
  }

  /**
   * Clean up old monitoring data
   */
  cleanup() {
    const now = Date.now();
    const window = this.threatThresholds.suspiciousActivityWindow;

    // Clean up old failed login attempts
    for (const [key, attempts] of this.monitoring.failedLogins) {
      const recent = attempts.filter(timestamp => now - timestamp < window);
      if (recent.length === 0) {
        this.monitoring.failedLogins.delete(key);
      } else {
        this.monitoring.failedLogins.set(key, recent);
      }
    }

    // Clean up old data access patterns
    for (const [key, accesses] of this.monitoring.dataAccessPatterns) {
      const recent = accesses.filter(access => now - access.timestamp < window);
      if (recent.length === 0) {
        this.monitoring.dataAccessPatterns.delete(key);
      } else {
        this.monitoring.dataAccessPatterns.set(key, recent);
      }
    }

    // Clean up expired rate limits and locks
    this.cleanupExpiredProtections();
  }

  /**
   * Clean up expired rate limits and account locks
   */
  cleanupExpiredProtections() {
    const now = Date.now();

    // Clean up rate limits
    const rateLimits = JSON.parse(localStorage.getItem('rate_limits') || '{}');
    const activeRateLimits = {};

    for (const [ip, limit] of Object.entries(rateLimits)) {
      if (now - limit.triggered < limit.duration) {
        activeRateLimits[ip] = limit;
      }
    }
    localStorage.setItem('rate_limits', JSON.stringify(activeRateLimits));

    // Clean up account locks
    const accountLocks = JSON.parse(
      localStorage.getItem('account_locks') || '{}'
    );
    const activeLocks = {};

    for (const [userId, lock] of Object.entries(accountLocks)) {
      if (now - lock.triggered < lock.duration) {
        activeLocks[userId] = lock;
      }
    }
    localStorage.setItem('account_locks', JSON.stringify(activeLocks));
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();
