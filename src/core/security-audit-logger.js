/**
 * Security Audit Logger
 *
 * This module provides comprehensive security audit logging for sensitive operations
 * including authentication events, data access, and potential security incidents.
 */

export class SecurityAuditLogger {
  constructor() {
    this.maxLogEntries = 1000; // Keep last 1000 entries
    this.logKey = 'security_audit_log';
  }

  /**
   * Log authentication events
   * @param {string} eventType - Type of auth event (login, logout, signup, etc.)
   * @param {Object} details - Event details
   */
  logAuthEvent(eventType, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'auth',
      eventType,
      userId: details.userId || 'anonymous',
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      success: details.success !== false,
      error: details.error || null,
      sessionId: this.generateSessionId(),
      metadata: {
        method: details.method || 'unknown',
        provider: details.provider || 'email',
        ...details.metadata,
      },
    };

    this.writeLog(logEntry);
  }

  /**
   * Log data access events
   * @param {string} operation - Type of operation (read, write, delete)
   * @param {Object} details - Operation details
   */
  logDataAccess(operation, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'data_access',
      operation,
      userId: details.userId || 'anonymous',
      resource: details.resource || 'unknown',
      resourceId: details.resourceId || null,
      success: details.success !== false,
      error: details.error || null,
      ip: details.ip || 'unknown',
      sessionId: this.generateSessionId(),
      metadata: {
        dataSize: details.dataSize || 0,
        changes: details.changes || [],
        ...details.metadata,
      },
    };

    this.writeLog(logEntry);
  }

  /**
   * Log security incidents
   * @param {string} incidentType - Type of security incident
   * @param {Object} details - Incident details
   */
  logSecurityIncident(incidentType, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'security_incident',
      incidentType,
      severity: details.severity || 'medium',
      userId: details.userId || 'anonymous',
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      description: details.description || '',
      resolved: details.resolved || false,
      metadata: {
        blocked: details.blocked || false,
        ...details.metadata,
      },
    };

    this.writeLog(logEntry);

    // For high severity incidents, also store in separate collection
    if (details.severity === 'high') {
      this.logHighSeverityIncident(logEntry);
    }
  }

  /**
   * Log configuration changes
   * @param {string} configType - Type of configuration changed
   * @param {Object} details - Change details
   */
  logConfigChange(configType, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'config_change',
      configType,
      userId: details.userId || 'anonymous',
      oldValue: details.oldValue || null,
      newValue: details.newValue || null,
      success: details.success !== false,
      error: details.error || null,
      metadata: {
        impact: details.impact || 'unknown',
        ...details.metadata,
      },
    };

    this.writeLog(logEntry);
  }

  /**
   * Write log entry to storage
   * @param {Object} logEntry - Log entry to write
   */
  writeLog(logEntry) {
    try {
      const existingLogs = this.getLogs();
      existingLogs.push(logEntry);

      // Keep only the most recent entries
      if (existingLogs.length > this.maxLogEntries) {
        existingLogs.splice(0, existingLogs.length - this.maxLogEntries);
      }

      localStorage.setItem(this.logKey, JSON.stringify(existingLogs));

      // Also log to console in development
      if (import.meta.env.DEV) {
        console.log('Security Audit:', logEntry);
      }
    } catch (error) {
      console.error('Failed to write security audit log:', error);
    }
  }

  /**
   * Get all audit logs
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of log entries
   */
  getLogs(filters = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.logKey) || '[]');

      if (Object.keys(filters).length === 0) {
        return logs;
      }

      return logs.filter(log => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'startDate') {
            return new Date(log.timestamp) >= new Date(value);
          }
          if (key === 'endDate') {
            return new Date(log.timestamp) <= new Date(value);
          }
          if (key === 'type') {
            return log.type === value;
          }
          if (key === 'userId') {
            return log.userId === value;
          }
          return log[key] === value;
        });
      });
    } catch (error) {
      console.error('Failed to retrieve security audit logs:', error);
      return [];
    }
  }

  /**
   * Get recent security incidents
   * @param {number} hours - Number of hours to look back
   * @returns {Array} Array of recent incidents
   */
  getRecentIncidents(hours = 24) {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return this.getLogs({
      type: 'security_incident',
      startDate: startDate.toISOString(),
    });
  }

  /**
   * Generate session ID for tracking
   * @returns {string} Session ID
   */
  generateSessionId() {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Log high severity incidents separately
   * @param {Object} logEntry - High severity incident log
   */
  logHighSeverityIncident(logEntry) {
    try {
      const highSeverityLogs = JSON.parse(
        localStorage.getItem('high_severity_incidents') || '[]'
      );
      highSeverityLogs.push(logEntry);

      // Keep only last 100 high severity incidents
      if (highSeverityLogs.length > 100) {
        highSeverityLogs.splice(0, highSeverityLogs.length - 100);
      }

      localStorage.setItem(
        'high_severity_incidents',
        JSON.stringify(highSeverityLogs)
      );
    } catch (error) {
      console.error('Failed to log high severity incident:', error);
    }
  }

  /**
   * Export audit logs for analysis
   * @param {Object} filters - Optional filters
   * @returns {string} JSON string of logs
   */
  exportLogs(filters = {}) {
    const logs = this.getLogs(filters);
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalEntries: logs.length,
        filters,
        logs,
      },
      null,
      2
    );
  }

  /**
   * Clear old audit logs
   * @param {number} daysToKeep - Number of days to keep logs for
   */
  clearOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const logs = this.getLogs();
      const filteredLogs = logs.filter(
        log => new Date(log.timestamp) >= cutoffDate
      );

      localStorage.setItem(this.logKey, JSON.stringify(filteredLogs));
    } catch (error) {
      console.error('Failed to clear old audit logs:', error);
    }
  }
}

// Export singleton instance
export const securityAuditLogger = new SecurityAuditLogger();
