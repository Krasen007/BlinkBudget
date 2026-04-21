import { Router } from '../core/router.js';
import { ButtonComponent } from '../components/Button.js';

export const LandingView = () => {
  const container = document.createElement('div');
  container.className = 'view-landing';
  // Remove height/overflow constraints to allow document-level scrolling

  const heroSection = document.createElement('section');
  heroSection.className = 'hero-placeholder';

  const heroIcon = document.createElement('div');
  heroIcon.className = 'hero-icon';
  const iconImg = document.createElement('img');
  iconImg.src = '/favicon.png';
  iconImg.alt = 'BlinkBudget Icon';
  heroIcon.appendChild(iconImg);

  const title = document.createElement('h2');
  title.textContent = 'BlinkBudget';

  const tagline = document.createElement('p');
  tagline.className = 'hero-tagline';
  tagline.textContent = 'Track your expenses in 3 clicks max';

  const features = document.createElement('div');
  features.className = 'hero-features';

  const featureItems = [
    { icon: '⚡', text: 'Lightning Fast Entry' },
    { icon: '📱', text: 'Mobile Optimized' },
    { icon: '📊', text: 'Beautiful Insights' },
    { icon: '🔄', text: 'Offline Capable' },
  ];

  featureItems.forEach(({ icon, text }) => {
    const featureItem = document.createElement('div');
    featureItem.className = 'feature-item';
    const iconSpan = document.createElement('span');
    iconSpan.className = 'feature-icon';
    iconSpan.textContent = icon;
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    featureItem.appendChild(iconSpan);
    featureItem.appendChild(textSpan);
    features.appendChild(featureItem);
  });

  const description = document.createElement('p');
  description.className = 'hero-description';
  description.textContent =
    'Transform expense tracking into a swift, almost unconscious habit with actionable insights for smarter financial decisions.';

  // Add prominent Get Started button
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    margin: 2rem 0;
    padding: 1rem 0;
    display: flex;
    justify-content: center;
    width: 100%;
  `;

  const getStartedBtn = ButtonComponent({
    text: 'Get Started',
    variant: 'primary',
    onClick: () => {
      Router.navigate('login');
    },
  });
  getStartedBtn.style.cssText = `
    font-size: 1.25rem;
    padding: 1rem 3rem;
    min-height: 56px;
    font-weight: 600;
    letter-spacing: 0.02em;
  `;

  buttonContainer.appendChild(getStartedBtn);

  // Add tutorial preview section
  const tutorialSection = document.createElement('div');
  tutorialSection.className = 'tutorial-preview';
  tutorialSection.style.cssText = `
    margin: 2rem 0;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;

  const tutorialTitle = document.createElement('h3');
  tutorialTitle.textContent = '🚀 New to BlinkBudget?';
  tutorialTitle.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    font-weight: 600;
  `;

  const tutorialDescription = document.createElement('p');
  tutorialDescription.textContent =
    'Start with our interactive tutorial that guides you through everything you need to know in just a few minutes. Learn the 3-click promise, quick categorization, and powerful insights.';
  tutorialDescription.style.cssText = `
    margin: 0 0 1rem 0;
    line-height: 1.5;
    opacity: 0.9;
  `;

  const tutorialFeatures = document.createElement('div');
  tutorialFeatures.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  `;

  const tutorialItems = [
    '✨ 3-click expense logging',
    '🎯 Interactive walkthrough',
    '📱 Mobile-first experience',
    '🎓 Learn at your own pace',
  ];

  tutorialItems.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.textContent = item;
    itemDiv.style.cssText = `
      font-size: 0.9rem;
      opacity: 0.8;
    `;
    tutorialFeatures.appendChild(itemDiv);
  });

  tutorialSection.appendChild(tutorialTitle);
  tutorialSection.appendChild(tutorialDescription);
  tutorialSection.appendChild(tutorialFeatures);

  heroSection.appendChild(heroIcon);
  heroSection.appendChild(title);
  heroSection.appendChild(tagline);
  heroSection.appendChild(features);
  heroSection.appendChild(description);
  heroSection.appendChild(buttonContainer);
  heroSection.appendChild(tutorialSection);

  container.appendChild(heroSection);

  return container;
};
