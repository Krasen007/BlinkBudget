import { Router } from '../core/router.js';
import { Button } from '../components/Button.js';

export const LandingView = () => {
  const container = document.createElement('div');
  container.className = 'view-landing';
  Object.assign(container.style, {
    height: '100vh',
    overflow: 'hidden',
  });

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

  const buttonContainer = document.createElement('div');
  buttonContainer.style.marginTop = '2rem';

  const getStartedBtn = Button({
    text: 'Get Started',
    variant: 'primary',
    onClick: () => {
      Router.navigate('login');
    },
  });

  buttonContainer.appendChild(getStartedBtn);

  heroSection.appendChild(heroIcon);
  heroSection.appendChild(title);
  heroSection.appendChild(tagline);
  heroSection.appendChild(features);
  heroSection.appendChild(description);
  heroSection.appendChild(buttonContainer);

  container.appendChild(heroSection);

  return container;
};
