/**
 * Advanced Filtering Settings Section
 * Allows users to toggle the advanced filtering panel on and off
 */

import { SettingsService } from '../core/settings-service.js';
import { showSuccessToast, showInfoToast } from '../utils/toast-notifications.js';


export const AdvancedFilteringSection = () => {
  const container = document.createElement('div');
  container.className = 'settings-section advanced-filtering-section';

  // Section header
  const header = document.createElement('div');
  header.className = 'settings-section-header';
  header.innerHTML = `
    <h3>🔍 Advanced Filtering</h3>
    <p>Enable or disable the comprehensive transaction filtering panel</p>
  `;
  container.appendChild(header);

  // Get current setting
  const currentSetting =
    SettingsService.getSetting('advancedFilteringEnabled') === true; // Default to false

  // Create toggle container
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'advanced-filtering-toggle';

  // Toggle label
  const label = document.createElement('label');
  label.className = 'toggle-label';
  label.textContent = 'Enable Advanced Filtering';

  // Toggle switch
  const toggleSwitch = document.createElement('div');
  toggleSwitch.className = `toggle-switch ${currentSetting ? 'enabled' : 'disabled'}`;
  toggleSwitch.setAttribute('tabindex', '0');
  toggleSwitch.setAttribute('role', 'switch');
  toggleSwitch.setAttribute('aria-checked', currentSetting);

  const toggleSlider = document.createElement('div');
  toggleSlider.className = 'toggle-slider';
  toggleSwitch.appendChild(toggleSlider);

  // Toggle functionality
  const toggleFiltering = e => {
    // Prevent default scrolling for Space
    if (e && e.type === 'keydown' && e.key === ' ') {
      e.preventDefault();
    }

    const isEnabled =
      SettingsService.getSetting('advancedFilteringEnabled') === true;
    const newSetting = !isEnabled;
    SettingsService.saveSetting('advancedFilteringEnabled', newSetting);

    // Update UI
    toggleSwitch.className = `toggle-switch ${newSetting ? 'enabled' : 'disabled'}`;
    toggleSwitch.setAttribute('aria-checked', newSetting);

    // Update description
    updateDescription(newSetting);

    // Show feedback
    showFeedback(newSetting);
  };

  // Add keyboard support
  toggleSwitch.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleFiltering(e);
    }
  });

  // Update description based on setting
  const updateDescription = isEnabled => {
    description.innerHTML = isEnabled
      ? `📈 <strong>Advanced Filters Active</strong><br>
         Access powerful filtering by date range, categories, amount, and text search on Dashboard and Reports.<br>
         <em>Perfect for detailed financial analysis and finding specific transactions.</em>`
      : `⏹️ <strong>Direct View Active</strong><br>
         Hide the filtering panel for a cleaner, more focused interface.<br>
         <em>Standard view with basic account filtering only.</em>`;
  };

  // Show feedback toast
  const showFeedback = isEnabled => {
    if (isEnabled) {
      showSuccessToast('Advanced Filtering enabled');
    } else {
      showInfoToast('Advanced Filtering disabled');
    }
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
  toggleContainer.addEventListener('click', toggleFiltering);
  toggleContainer.style.cursor = 'pointer';

  container.appendChild(toggleContainer);

  // Additional info section
  const infoSection = document.createElement('div');
  infoSection.className = 'advanced-filtering-info';
  infoSection.innerHTML = `
    <div class="info-grid">
      <div class="info-item">
        <h4>🎯 Filter Features</h4>
        <ul>
          <li>Date range selection</li>
          <li>Multiple category inclusion/exclusion</li>
          <li>Min/Max amount filtering</li>
          <li>Transaction type toggles</li>
          <li>Full-text search</li>
        </ul>
      </div>
      <div class="info-item">
        <h4>📱 Performance</h4>
        <ul>
          <li>Optimized for large transaction lists</li>
          <li>Real-time results as you type</li>
          <li>Persistent filter state</li>
          <li>Works across all accounts</li>
          <li>Mobile-friendly sliders</li>
        </ul>
      </div>
    </div>
  `;
  container.appendChild(infoSection);



  return container;
};
