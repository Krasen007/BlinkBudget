/**
 * SecuritySection Component
 * Displays basic security and privacy information
 */

import { SPACING, FONT_SIZES } from '../utils/constants.js';

export const SecuritySection = () => {
  const section = document.createElement('div');
  section.className = 'card mobile-settings-card';
  section.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Security & Privacy';
  title.className = 'mobile-settings-title';
  Object.assign(title.style, {
    marginBottom: SPACING.MD,
    fontSize: FONT_SIZES.XL,
  });
  section.appendChild(title);

  // Basic notice
  const notice = document.createElement('p');
  notice.textContent = 'Your data is encrypted and stored locally. You control your information and can export or delete it at any time.';
  Object.assign(notice.style, {
    fontSize: FONT_SIZES.SM,
    color: 'var(--color-text-muted)',
    marginBottom: SPACING.MD,
    lineHeight: '1.5',
  });
  section.appendChild(notice);

  // Simple features list
  const featuresList = document.createElement('ul');
  featuresList.style.cssText = `
    margin: 0;
    padding-left: ${SPACING.LG};
    color: var(--color-text-muted);
    font-size: ${FONT_SIZES.SM};
    line-height: 1.4;
  `;

  const features = [
    'End-to-end encryption for all data',
    'Local-first storage - data stays on your device',
    'Optional cloud sync with your control',
    'No third-party analytics or tracking',
    'You can export all your data anytime',
    'Secure authentication'
  ];

  features.forEach(feature => {
    const li = document.createElement('li');
    li.textContent = feature;
    li.style.cssText = `
      margin-bottom: ${SPACING.SM};
    `;
    featuresList.appendChild(li);
  });

  section.appendChild(featuresList);

  return section;
};
