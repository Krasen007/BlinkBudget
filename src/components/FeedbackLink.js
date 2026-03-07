/**
 * Simple Feedback Link Component
 * Provides a single link to GitHub issues with helpful guide
 */

import { SPACING, FONT_SIZES } from '../utils/constants.js';

export const FeedbackLink = () => {
  const section = document.createElement('div');
  section.className = 'card mobile-settings-card';
  section.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Feedback & Support';
  title.className = 'mobile-settings-title';
  Object.assign(title.style, {
    marginBottom: SPACING.MD,
    fontSize: FONT_SIZES.XL,
  });
  section.appendChild(title);

  // Description
  const description = document.createElement('p');
  description.textContent = 'Help us improve BlinkBudget by reporting bugs or sharing your ideas on GitHub.';
  Object.assign(description.style, {
    fontSize: FONT_SIZES.SM,
    color: 'var(--color-text-muted)',
    marginBottom: SPACING.LG,
    lineHeight: '1.5',
  });
  section.appendChild(description);

  // GitHub Link
  const githubLink = document.createElement('a');
  githubLink.href = 'https://github.com/Krasen007/BlinkBudget/issues';
  githubLink.target = '_blank';
  githubLink.rel = 'noopener noreferrer';
  githubLink.textContent = '📝 Open GitHub Issues';
  githubLink.style.cssText = `
    display: inline-block;
    background: var(--color-primary);
    color: white;
    padding: ${SPACING.SM} ${SPACING.LG};
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    font-size: ${FONT_SIZES.BASE};
    transition: background-color 0.2s ease;
    margin-bottom: ${SPACING.LG};
  `;

  githubLink.addEventListener('mouseenter', () => {
    githubLink.style.backgroundColor = 'var(--color-primary-dark)';
  });

  githubLink.addEventListener('mouseleave', () => {
    githubLink.style.backgroundColor = 'var(--color-primary)';
  });

  section.appendChild(githubLink);

  // Guide Section
  const guideSection = document.createElement('div');
  guideSection.style.cssText = `
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: ${SPACING.MD};
    margin-top: ${SPACING.MD};
  `;

  const guideTitle = document.createElement('h4');
  guideTitle.textContent = '📝 How to Report Issues';
  guideTitle.style.cssText = `
    margin: 0 0 ${SPACING.SM} 0;
    font-size: ${FONT_SIZES.BASE};
    font-weight: 600;
    color: var(--color-text);
  `;
  guideSection.appendChild(guideTitle);

  const guideSteps = document.createElement('ul');
  guideSteps.style.cssText = `
    margin: 0;
    padding-left: ${SPACING.LG};
    color: var(--color-text-muted);
    font-size: ${FONT_SIZES.SM};
    line-height: 1.4;
  `;

  const steps = [
    'Click the link above to open GitHub Issues',
    'Click "New issue" to report a bug or request a feature',
    'Describe your issue clearly with steps to reproduce (if applicable)',
    'Add screenshots if helpful',
    'Submit and we\'ll review your feedback'
  ];

  steps.forEach(step => {
    const li = document.createElement('li');
    li.textContent = step;
    li.style.cssText = `
      margin-bottom: ${SPACING.XS};
    `;
    guideSteps.appendChild(li);
  });

  guideSection.appendChild(guideSteps);

  // Additional Info
  const additionalInfo = document.createElement('div');
  additionalInfo.style.cssText = `
    margin-top: ${SPACING.SM};
    padding-top: ${SPACING.SM};
    border-top: 1px solid var(--color-border);
    font-size: ${FONT_SIZES.SM};
    color: var(--color-text-muted);
    text-align: center;
  `;
  additionalInfo.innerHTML = `
    You can also <a href="https://github.com/Krasen007/BlinkBudget/issues" target="_blank" style="color: var(--color-primary);">view existing issues</a> 
    to see if your problem has already been reported.
  `;

  guideSection.appendChild(additionalInfo);
  section.appendChild(guideSection);

  return section;
};
