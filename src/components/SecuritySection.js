/**
 * SecuritySection Component
 * Displays basic security and privacy information
 */

import { SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';

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

  // Basic notice — accurate about what is and is not encrypted. Local data is
  // NOT encrypted by the app; only cloud-synced data is encrypted in transit.
  const notice = document.createElement('p');
  notice.textContent =
    'Your data is stored locally on this device by default. The app does not encrypt locally stored data; data synced to the cloud is encrypted in transit (HTTPS). You control your information and can export or delete it at any time.';
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
    'Local-first storage - data stays on your device by default',
    'Cloud-synced data is encrypted in transit (HTTPS) and protected by Firebase security',
    'Optional cloud sync, always under your control',
    'Only anonymous error diagnostics are collected - no cross-site advertising tracking',
    'You can export all your data anytime',
    'Secure authentication with optional sign-in',
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

  // Legal links — reachable from inside the authenticated app so users (and
  // Store reviewers) can access the Privacy Policy and Terms of Service without
  // needing to visit the marketing landing page.
  const legalLinks = document.createElement('div');
  legalLinks.className = 'security-legal-links';
  legalLinks.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: ${SPACING.MD};
    margin-top: ${SPACING.LG};
  `;

  const legalLinkData = [
    { text: 'Privacy Policy', href: '/privacy-policy.html' },
    { text: 'Terms of Service', href: '/terms-of-service.html' },
  ];

  legalLinkData.forEach(({ text, href }) => {
    const link = document.createElement('a');
    link.textContent = text;
    link.href = href;
    link.className = 'btn btn-ghost';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${text} (opens in new tab)`);
    Object.assign(link.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: TOUCH_TARGETS.MIN_HEIGHT,
      padding: `${SPACING.SM} ${SPACING.MD}`,
      fontSize: FONT_SIZES.SM,
      color: 'var(--color-primary, #00d084)',
      textDecoration: 'none',
    });
    legalLinks.appendChild(link);
  });

  section.appendChild(legalLinks);

  return section;
};
