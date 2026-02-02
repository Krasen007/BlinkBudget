/**
 * Smart Suggestions Settings Section
 * Allows users to toggle between smart suggestions and classic categories
 */

import { SettingsService } from '../core/settings-service.js';

export const SmartSuggestionsSection = () => {
  const container = document.createElement('div');
  container.className = 'settings-section smart-suggestions-section';

  // Section header
  const header = document.createElement('div');
  header.className = 'settings-section-header';
  header.innerHTML = `
    <h3>🧠 Smart Suggestions</h3>
    <p>Choose between AI-powered suggestions or classic category selection</p>
  `;
  container.appendChild(header);

  // Get current setting
  const currentSetting =
    SettingsService.getSetting('smartSuggestionsEnabled') !== false; // Default to true

  // Create toggle container
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'smart-suggestions-toggle';

  // Toggle label
  const label = document.createElement('label');
  label.className = 'toggle-label';
  label.textContent = 'Enable Smart Suggestions';

  // Toggle switch
  const toggleSwitch = document.createElement('div');
  toggleSwitch.className = `toggle-switch ${currentSetting ? 'enabled' : 'disabled'}`;

  const toggleSlider = document.createElement('div');
  toggleSlider.className = 'toggle-slider';
  toggleSwitch.appendChild(toggleSlider);

  // Toggle functionality
  const toggleSuggestions = () => {
    const isEnabled =
      SettingsService.getSetting('smartSuggestionsEnabled') !== false;
    const newSetting = !isEnabled;
    SettingsService.saveSetting('smartSuggestionsEnabled', newSetting);

    // Update UI
    toggleSwitch.className = `toggle-switch ${newSetting ? 'enabled' : 'disabled'}`;

    // Update description
    updateDescription(newSetting);

    // Show feedback
    showFeedback(newSetting);
  };

  // Update description based on setting
  const updateDescription = isEnabled => {
    description.innerHTML = isEnabled
      ? `🚀 <strong>Smart Suggestions Active</strong><br>
         Get intelligent amount, category, and note suggestions based on your spending patterns.<br>
         <em>Enables 3-click transaction entry with AI-powered predictions.</em>`
      : `📋 <strong>Classic Categories Active</strong><br>
         Use traditional category selection with fixed options.<br>
         <em>Manual category selection for full control over your transactions.</em>`;
  };

  // Show feedback toast
  const showFeedback = isEnabled => {
    const toast = document.createElement('div');
    toast.className = 'settings-toast';
    toast.textContent = isEnabled
      ? '✅ Smart Suggestions enabled'
      : '📋 Classic categories enabled';

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 2 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  // Description
  const description = document.createElement('div');
  description.className = 'toggle-description';
  updateDescription(currentSetting);

  // Assemble toggle
  label.appendChild(toggleSwitch);
  toggleContainer.appendChild(label);
  toggleContainer.appendChild(description);

  // Add click handler to entire toggle area
  toggleContainer.addEventListener('click', toggleSuggestions);
  toggleContainer.style.cursor = 'pointer';

  container.appendChild(toggleContainer);

  // Additional info section
  const infoSection = document.createElement('div');
  infoSection.className = 'smart-suggestions-info';
  infoSection.innerHTML = `
    <div class="info-grid">
      <div class="info-item">
        <h4>🎯 Smart Suggestions</h4>
        <ul>
          <li>Time-based predictions (coffee in morning, lunch at noon)</li>
          <li>Amount pattern recognition</li>
          <li>Merchant auto-detection</li>
          <li>Note auto-complete</li>
          <li>3-click transaction entry</li>
        </ul>
      </div>
      <div class="info-item">
        <h4>📋 Classic Categories</h4>
        <ul>
          <li>Fixed category selection</li>
          <li>Manual amount entry</li>
          <li>Traditional transaction flow</li>
          <li>Full manual control</li>
          <li>Familiar interface</li>
        </ul>
      </div>
    </div>
    <div class="info-note">
      💡 <strong>Tip:</strong> You can switch between modes anytime. Your preference is saved automatically.
    </div>
  `;
  container.appendChild(infoSection);

  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    .smart-suggestions-section {
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .smart-suggestions-toggle {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
    }

    .toggle-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      font-size: var(--font-size-base);
      color: var(--color-text-main);
      cursor: pointer;
      user-select: none;
    }

    .toggle-switch {
      width: 48px;
      height: 24px;
      background: var(--color-border);
      border-radius: var(--radius-full);
      position: relative;
      transition: background-color var(--transition-fast);
      cursor: pointer;
    }

    .toggle-switch.enabled {
      background: var(--color-primary);
    }

    .toggle-slider {
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform var(--transition-fast);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .toggle-switch.enabled .toggle-slider {
      transform: translateX(24px);
    }

    .toggle-description {
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
      color: var(--color-text-muted);
      padding: var(--spacing-sm);
      background: var(--color-background);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--color-primary);
    }

    .smart-suggestions-info {
      margin-top: var(--spacing-md);
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .info-item h4 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text-main);
    }

    .info-item ul {
      margin: 0;
      padding-left: var(--spacing-md);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .info-item li {
      margin-bottom: var(--spacing-xs);
    }

    .info-note {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      padding: var(--spacing-sm);
      background: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.1);
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--color-primary);
    }

    .settings-toast {
      position: fixed;
      bottom: var(--spacing-lg);
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--color-surface);
      color: var(--color-text-main);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      opacity: 0;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm);
      font-weight: 500;
    }

    .settings-toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    /* Responsive behavior */
    @media (width <= 480px) {
      .info-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-sm);
      }
      
      .toggle-label {
        font-size: var(--font-size-sm);
      }
      
      .toggle-switch {
        width: 44px;
        height: 22px;
      }
      
      .toggle-slider {
        width: 18px;
        height: 18px;
      }
      
      .toggle-switch.enabled .toggle-slider {
        transform: translateX(22px);
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .toggle-switch {
        background: hsla(var(--border-hue), var(--border-sat), var(--border-light), 0.3);
      }
      
      .settings-toast {
        background: hsla(var(--bg-hue), var(--bg-sat), var(--bg-light), 0.95);
        border-color: hsla(var(--border-hue), var(--border-sat), var(--border-light), 0.3);
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .toggle-switch {
        border: 2px solid var(--color-text-main);
      }
      
      .toggle-slider {
        border: 1px solid var(--color-text-main);
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .toggle-switch,
      .toggle-slider,
      .settings-toast {
        transition: none;
      }
    }
  `;
  document.head.appendChild(style);

  return container;
};
