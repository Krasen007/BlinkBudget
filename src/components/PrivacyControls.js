/**
 * Privacy Controls Component
 *
 * Provides user interface for privacy settings and consent management
 */

// Notification system to replace alerts
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '1rem 1.5rem',
    borderRadius: '6px',
    color: 'white',
    fontWeight: '500',
    zIndex: '10000',
    maxWidth: '400px',
    wordWrap: 'break-word',
  });

  switch (type) {
    case 'success':
      notification.style.background = '#10b981';
      break;
    case 'error':
      notification.style.background = '#ef4444';
      break;
    case 'warning':
      notification.style.background = '#f59e0b';
      break;
    default:
      notification.style.background = '#3b82f6';
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

function showConfirmation(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      text-align: center;
    `;

    dialog.innerHTML = `
      <p style="margin-bottom: 1.5rem; color: #333;">${message}</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="confirm-yes" style="
          padding: 0.5rem 1rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Yes</button>
        <button id="confirm-no" style="
          padding: 0.5rem 1rem;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">No</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    dialog.querySelector('#confirm-yes').addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(true);
    });

    dialog.querySelector('#confirm-no').addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(false);
    });

    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(false);
      }
    });
  });
}

export function createPrivacyControls() {
  const container = document.createElement('div');
  container.className = 'privacy-controls';

  container.innerHTML = `
    <div class="privacy-header">
      <h2>Privacy & Data Controls</h2>
      <p>Manage your privacy settings and data preferences</p>
    </div>

    <div class="privacy-sections">
      <!-- Data Collection Consent -->
      <section class="privacy-section">
        <h3>Data Collection Consent</h3>
        <div class="consent-options">
          <label class="consent-item">
            <input type="checkbox" id="consent-analytics" data-consent="analytics">
            <span class="consent-label">
              <strong>Analytics Data</strong>
              <small>Help us improve the app by collecting anonymous usage statistics</small>
            </span>
          </label>
          
          <label class="consent-item">
            <input type="checkbox" id="consent-crash-reporting" data-consent="crashReporting">
            <span class="consent-label">
              <strong>Crash Reporting</strong>
              <small>Automatically report errors to help us fix bugs</small>
            </span>
          </label>
          
          <label class="consent-item">
            <input type="checkbox" id="consent-feature-usage" data-consent="featureUsage">
            <span class="consent-label">
              <strong>Feature Usage</strong>
              <small>Help us understand which features are most valuable</small>
            </span>
          </label>
          
          <label class="consent-item">
            <input type="checkbox" id="consent-marketing" data-consent="marketing">
            <span class="consent-label">
              <strong>Marketing Communications</strong>
              <small>Receive updates about new features and offers</small>
            </span>
          </label>
        </div>
      </section>

      <!-- Data Minimization -->
      <section class="privacy-section">
        <h3>Data Minimization</h3>
        <div class="minimization-options">
          <label class="consent-item">
            <input type="checkbox" id="minimize-metadata" data-setting="excludeOptionalMetadata">
            <span class="consent-label">
              <strong>Exclude Optional Metadata</strong>
              <small>Remove unnecessary metadata from stored data</small>
            </span>
          </label>
          
          <label class="consent-item">
            <input type="checkbox" id="anonymize-analytics" data-setting="anonymizeAnalytics">
            <span class="consent-label">
              <strong>Anonymize Analytics</strong>
              <small>Remove personally identifiable information from analytics</small>
            </span>
          </label>
          
          <label class="consent-item">
            <input type="checkbox" id="limit-collection" data-setting="limitDataCollection">
            <span class="consent-label">
              <strong>Limit Data Collection</strong>
              <small>Collect only essential data required for functionality</small>
            </span>
          </label>
        </div>
      </section>

      <!-- Data Retention -->
      <section class="privacy-section">
        <h3>Data Retention</h3>
        <div class="retention-options">
          <div class="retention-item">
            <label for="retention-transactions">Transaction History</label>
            <select id="retention-transactions" data-retention="transactions">
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365" selected>1 year</option>
              <option value="1095">3 years</option>
              <option value="-1">Forever</option>
            </select>
          </div>
          
          <div class="retention-item">
            <label for="retention-audit">Audit Logs</label>
            <select id="retention-audit" data-retention="auditLogs">
              <option value="30">30 days</option>
              <option value="90" selected>90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
              <option value="-1">Forever</option>
            </select>
          </div>
          
          <div class="retention-item">
            <label for="retention-analytics">Analytics Data</label>
            <select id="retention-analytics" data-retention="analytics">
              <option value="30" selected>30 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
              <option value="-1">Forever</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Privacy Mode -->
      <section class="privacy-section">
        <h3>Privacy Mode</h3>
        <div class="privacy-modes">
          <label class="mode-item">
            <input type="radio" name="privacy-mode" value="standard" checked>
            <span class="mode-label">
              <strong>Standard</strong>
              <small>Balance between functionality and privacy</small>
            </span>
          </label>
          
          <label class="mode-item">
            <input type="radio" name="privacy-mode" value="enhanced">
            <span class="mode-label">
              <strong>Enhanced</strong>
              <small>Increased privacy with some feature limitations</small>
            </span>
          </label>
          
          <label class="mode-item">
            <input type="radio" name="privacy-mode" value="minimal">
            <span class="mode-label">
              <strong>Minimal</strong>
              <small>Maximum privacy, limited analytics and features</small>
            </span>
          </label>
        </div>
      </section>

      <!-- Data Management -->
      <section class="privacy-section">
        <h3>Data Management</h3>
        <div class="data-actions">
          <button id="export-data" class="btn btn-secondary">
            📥 Export My Data
          </button>
          <button id="view-data-summary" class="btn btn-secondary">
            📊 View Data Summary
          </button>
          <button id="cleanup-old-data" class="btn btn-warning">
            🧹 Cleanup Old Data
          </button>
        </div>
      </section>
    </div>

    <div class="privacy-actions">
      <button id="save-privacy-settings" class="btn btn-primary">Save Settings</button>
      <button id="reset-privacy-settings" class="btn btn-secondary">Reset to Default</button>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .privacy-controls {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--bg-primary);
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .privacy-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .privacy-header h2 {
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .privacy-header p {
      color: var(--text-secondary);
      margin: 0;
    }

    .privacy-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .privacy-section h3 {
      color: var(--text-primary);
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .consent-item, .mode-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
      cursor: pointer;
    }

    .consent-item input, .mode-item input {
      margin-top: 0.25rem;
      flex-shrink: 0;
    }

    .consent-label, .mode-label {
      flex: 1;
    }

    .consent-label strong, .mode-label strong {
      display: block;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .consent-label small, .mode-label small {
      display: block;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .retention-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .retention-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .retention-item label {
      color: var(--text-primary);
      font-weight: 500;
    }

    .retention-item select {
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .privacy-modes {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .data-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .privacy-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-secondary {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--bg-hover);
    }

    .btn-warning {
      background: var(--warning-color);
      color: white;
    }

    .btn-warning:hover {
      background: var(--warning-hover);
    }

    @media (max-width: 768px) {
      .privacy-controls {
        padding: 1rem;
      }

      .data-actions, .privacy-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `;

  container.appendChild(style);
  return container;
}

/**
 * Initialize privacy controls functionality
 */
export function initializePrivacyControls(container) {
  import('../core/privacy-service.js').then(({ PrivacyService }) => {
    // Load current settings
    const settings = PrivacyService.getPrivacySettings();

    // Set consent checkboxes
    Object.keys(settings.consent).forEach(consentType => {
      const checkbox = container.querySelector(
        `[data-consent="${consentType}"]`
      );
      if (checkbox) {
        checkbox.checked = settings.consent[consentType];
      }
    });

    // Set data minimization checkboxes
    Object.keys(settings.dataMinimization).forEach(setting => {
      const checkbox = container.querySelector(`[data-setting="${setting}"]`);
      if (checkbox) {
        checkbox.checked = settings.dataMinimization[setting];
      }
    });

    // Set retention period selects
    Object.keys(settings.dataRetention).forEach(retentionType => {
      const select = container.querySelector(
        `[data-retention="${retentionType}"]`
      );
      if (select) {
        select.value = settings.dataRetention[retentionType];
      }
    });

    // Set privacy mode
    const modeRadio = container.querySelector(
      `[value="${settings.privacyMode}"]`
    );
    if (modeRadio) {
      modeRadio.checked = true;
    }

    // Save settings button
    container
      .querySelector('#save-privacy-settings')
      .addEventListener('click', () => {
        const newSettings = {
          consent: {},
          dataMinimization: {},
          dataRetention: {},
          privacyMode: container.querySelector('[name="privacy-mode"]:checked')
            .value,
        };

        // Collect consent settings
        container.querySelectorAll('[data-consent]').forEach(checkbox => {
          newSettings.consent[checkbox.dataset.consent] = checkbox.checked;
        });

        // Collect minimization settings
        container.querySelectorAll('[data-setting]').forEach(checkbox => {
          newSettings.dataMinimization[checkbox.dataset.setting] =
            checkbox.checked;
        });

        // Collect retention settings
        container.querySelectorAll('[data-retention]').forEach(select => {
          newSettings.dataRetention[select.dataset.retention] = parseInt(
            select.value
          );
        });

        try {
          PrivacyService.updatePrivacySettings(newSettings);
          showNotification('Privacy settings saved successfully!', 'success');
        } catch (error) {
          showNotification(
            `Failed to save privacy settings: ${error.message}`,
            'error'
          );
        }
      });

    // Reset settings button
    container
      .querySelector('#reset-privacy-settings')
      .addEventListener('click', async () => {
        const confirmed = await showConfirmation(
          'Reset all privacy settings to default values?'
        );
        if (confirmed) {
          localStorage.removeItem('blinkbudget_privacy_settings');
          showNotification('Privacy settings reset to default', 'info');
          setTimeout(() => location.reload(), 1500);
        }
      });

    // Export data button
    container.querySelector('#export-data').addEventListener('click', () => {
      try {
        const exportData = PrivacyService.exportUserData();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blinkbudget-data-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        showNotification(`Failed to export data: ${error.message}`, 'error');
      }
    });

    // View data summary button
    container
      .querySelector('#view-data-summary')
      .addEventListener('click', () => {
        const dashboard = PrivacyService.getPrivacyDashboard();
        const summary = `Data Summary:\n\nTransactions: ${dashboard.dataSummary.transactions}\nAudit Logs: ${dashboard.dataSummary.auditLogs}\nSettings: ${dashboard.dataSummary.settings}\nTotal Size: ${Math.round(dashboard.dataSummary.totalSize / 1024)} KB`;
        showNotification(summary, 'info');
      });

    // Cleanup old data button
    container
      .querySelector('#cleanup-old-data')
      .addEventListener('click', async () => {
        const confirmed = await showConfirmation(
          'This will permanently delete old data according to your retention settings. Continue?'
        );
        if (confirmed) {
          try {
            PrivacyService.performDataRetentionCleanup();
            showNotification('Data cleanup completed successfully!', 'success');
          } catch (error) {
            showNotification(`Data cleanup failed: ${error.message}`, 'error');
          }
        }
      });
  });
}
