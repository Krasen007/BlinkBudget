/**
 * Landing View - Marketing landing page for BlinkBudget
 * Features hero, how-it-works, features, screenshots, and CTA sections
 */

import { Router } from '../core/router.js';
import { ButtonComponent } from '../components/Button.js';
import '../styles/hero.css';

/** Attach scroll-reveal animation to all .landing-section elements */
const initScrollReveal = (container, observers) => {
  const sections = container.querySelectorAll('.landing-section');
  if (!sections.length) return;

  // Respect prefers-reduced-motion
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  if (prefersReduced) return;

  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = `opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out)`;
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  sections.forEach(section => observer.observe(section));
  observers.push(observer);
};

const createHeroSection = () => {
  const section = document.createElement('section');
  section.className = 'hero-section';
  section.setAttribute('aria-label', 'Hero');
  section.setAttribute('role', 'region');

  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';

  const heroIcon = document.createElement('div');
  heroIcon.className = 'hero-icon';
  const iconImg = document.createElement('img');
  iconImg.src = '/favicon.png';
  iconImg.alt = 'BlinkBudget Icon';
  iconImg.width = 80;
  iconImg.height = 80;
  heroIcon.appendChild(iconImg);

  const title = document.createElement('h1');
  title.textContent = 'BlinkBudget';
  title.className = 'hero-title';

  const tagline = document.createElement('p');
  tagline.className = 'hero-tagline';
  tagline.textContent = 'Track your expenses in 3 clicks max';

  const description = document.createElement('p');
  description.className = 'hero-description';
  description.textContent =
    'Transform expense tracking into a swift, almost unconscious habit. ' +
    'BlinkBudget gives you beautiful, actionable insights for smarter financial decisions — ' +
    'all without the bloat of traditional budgeting apps.';

  // Feature pills
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
    featureItem.setAttribute('role', 'listitem');
    const iconSpan = document.createElement('span');
    iconSpan.className = 'feature-icon';
    iconSpan.textContent = icon;
    iconSpan.setAttribute('aria-hidden', 'true');
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    featureItem.appendChild(iconSpan);
    featureItem.appendChild(textSpan);
    features.appendChild(featureItem);
  });
  features.setAttribute('role', 'list');

  // CTA button
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'hero-button-container';

  const getStartedBtn = ButtonComponent({
    text: 'Get Started Free',
    variant: 'primary',
    onClick: () => {
      const instance = getStartedBtn.buttonInstance;
      if (instance) instance.setLoading(true);
      // Brief visual feedback before navigation
      setTimeout(() => Router.navigate('login'), 300);
    },
  });
  getStartedBtn.classList.add('hero-button--large');

  const learnMoreLink = document.createElement('a');
  learnMoreLink.className = 'hero-learn-more';
  learnMoreLink.textContent = 'Learn more';
  learnMoreLink.href = '#how-it-works';
  learnMoreLink.setAttribute(
    'aria-label',
    'Learn more about how BlinkBudget works'
  );
  const arrowDown = document.createElement('span');
  arrowDown.textContent = ' ↓';
  arrowDown.setAttribute('aria-hidden', 'true');
  learnMoreLink.appendChild(arrowDown);
  learnMoreLink.addEventListener('click', e => {
    e.preventDefault();
    document
      .querySelector('.how-it-works-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  });

  buttonContainer.appendChild(getStartedBtn);
  buttonContainer.appendChild(learnMoreLink);

  heroContent.appendChild(heroIcon);
  heroContent.appendChild(title);
  heroContent.appendChild(tagline);
  heroContent.appendChild(description);
  heroContent.appendChild(features);
  heroContent.appendChild(buttonContainer);

  section.appendChild(heroContent);
  return section;
};

const createHowItWorksSection = () => {
  const section = document.createElement('section');
  section.className = 'how-it-works-section landing-section';
  section.id = 'how-it-works';
  section.setAttribute('aria-label', 'How It Works');
  section.setAttribute('role', 'region');

  const container = document.createElement('div');
  container.className = 'section-container';

  const heading = document.createElement('h2');
  heading.className = 'section-heading';
  heading.textContent = 'How It Works';

  const subtitle = document.createElement('p');
  subtitle.className = 'section-subtitle';
  subtitle.textContent =
    "Three clicks. That's all it takes to log an expense from purchase to entry.";

  const steps = document.createElement('div');
  steps.className = 'steps-grid';

  const stepData = [
    {
      step: '1',
      icon: '💵',
      title: 'Enter Amount',
      description:
        'Tap the "Add Expense" button and type in the amount. Smart defaults and quick presets make it instant.',
    },
    {
      step: '2',
      icon: '🏷️',
      title: 'Pick Category',
      description:
        'Select from smart categories with time-based suggestions. Custom categories available for your unique needs.',
    },
    {
      step: '3',
      icon: '📈',
      title: 'See Insights',
      description:
        'Watch beautiful visualizations of your spending habits. Know where your money goes without the math.',
    },
  ];

  stepData.forEach(({ step, icon, title, description }) => {
    const stepCard = document.createElement('div');
    stepCard.className = 'step-card';

    const stepNumber = document.createElement('div');
    stepNumber.className = 'step-number';
    stepNumber.textContent = step;

    const stepIcon = document.createElement('div');
    stepIcon.className = 'step-icon';
    stepIcon.textContent = icon;

    const stepTitle = document.createElement('h3');
    stepTitle.className = 'step-title';
    stepTitle.textContent = title;

    const stepDesc = document.createElement('p');
    stepDesc.className = 'step-description';
    stepDesc.textContent = description;

    stepCard.appendChild(stepNumber);
    stepCard.appendChild(stepIcon);
    stepCard.appendChild(stepTitle);
    stepCard.appendChild(stepDesc);
    steps.appendChild(stepCard);
  });

  container.appendChild(heading);
  container.appendChild(subtitle);
  container.appendChild(steps);
  section.appendChild(container);
  return section;
};

const createScreenshotsSection = () => {
  const section = document.createElement('section');
  section.className = 'screenshots-section landing-section';
  section.id = 'screenshots';
  section.setAttribute('aria-label', 'Screenshots');
  section.setAttribute('role', 'region');

  const container = document.createElement('div');
  container.className = 'section-container';

  const heading = document.createElement('h2');
  heading.className = 'section-heading';
  heading.textContent = 'Explore Every View';

  const subtitle = document.createElement('p');
  subtitle.className = 'section-subtitle';
  subtitle.textContent =
    'Designed for extreme speed, powerful insights, and total control over your money.';

  const mockups = document.createElement('div');
  mockups.className = 'screenshots-mockups';

  const viewsData = [
    {
      src: '/screenshots/dashboard.png',
      alt: 'BlinkBudget Main Dashboard View',
      title: 'Main Dashboard',
      desc: 'Instant 3-click expense logging, account balance summaries, and recent activity.',
    },
    {
      src: '/screenshots/reports.png',
      alt: 'BlinkBudget Reports View',
      title: 'Visual Reports & Analytics',
      desc: 'Category breakdowns, spending trends, and clear visual charts to understand your money.',
    },
    {
      src: '/screenshots/financial-planning.png',
      alt: 'BlinkBudget Financial Planning View',
      title: 'Financial Planning',
      desc: 'Track savings rates, emergency fund coverage, forecasts, and long-term goals.',
    },
    {
      src: '/screenshots/settings.png',
      alt: 'BlinkBudget Settings View',
      title: 'Settings & Customization',
      desc: 'Manage accounts, custom transaction categories, offline storage, and app preferences.',
    },
  ];

  viewsData.forEach(({ src, alt, title, desc }) => {
    const mockup = document.createElement('div');
    mockup.className = 'mockup';

    const frame = document.createElement('div');
    frame.className = 'mockup-frame';

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    img.width = 600;
    img.height = 400;

    frame.appendChild(img);

    const label = document.createElement('p');
    label.className = 'mockup-label';
    label.textContent = title;

    const description = document.createElement('p');
    description.className = 'mockup-desc';
    description.textContent = desc;

    mockup.appendChild(frame);
    mockup.appendChild(label);
    mockup.appendChild(description);
    mockups.appendChild(mockup);
  });

  container.appendChild(heading);
  container.appendChild(subtitle);
  container.appendChild(mockups);
  section.appendChild(container);
  return section;
};

const createFeaturesSection = () => {
  const section = document.createElement('section');
  section.className = 'features-section landing-section';
  section.id = 'features';
  section.setAttribute('aria-label', 'Features');
  section.setAttribute('role', 'region');

  const container = document.createElement('div');
  container.className = 'section-container';

  const heading = document.createElement('h2');
  heading.className = 'section-heading';
  heading.textContent = 'Everything You Need';

  const subtitle = document.createElement('p');
  subtitle.className = 'section-subtitle';
  subtitle.textContent = 'Powerful features without the complexity.';

  const grid = document.createElement('div');
  grid.className = 'features-grid';

  const features = [
    {
      icon: '⚡',
      title: '3-Click Expense Entry',
      description:
        'Log any expense in three taps. Open app, enter amount, pick category — done. Faster than writing it down.',
    },
    {
      icon: '📊',
      title: 'Beautiful Reports',
      description:
        'Interactive charts and visualizations that make understanding your spending patterns effortless and even enjoyable.',
    },
    {
      icon: '📱',
      title: 'Mobile First & PWA',
      description:
        'Install on your phone like a native app. Works offline, syncs when online. No app store needed.',
    },
    {
      icon: '🎯',
      title: 'Savings Goals',
      description:
        'Set and track savings goals with visual progress indicators. Stay motivated as you watch your savings grow.',
    },
    {
      icon: '🔄',
      title: 'Offline Capable',
      description:
        'Your data lives on your device first. Log expenses even without internet — syncs seamlessly when you reconnect.',
    },
    {
      icon: '🔒',
      title: 'Privacy First',
      description:
        'Local-first storage with optional encrypted cloud sync. Your financial data stays under your control.',
    },
    {
      icon: '💡',
      title: 'Actionable Insights',
      description:
        'Get smart alerts about unusual spending, budget comparisons, and personalized suggestions to save more.',
    },
    {
      icon: '📈',
      title: 'Financial Planning',
      description:
        'Plan ahead with forecasting tools, balance projections, and cost-of-living summaries that keep you informed.',
    },
  ];

  features.forEach(({ icon, title, description }) => {
    const card = document.createElement('div');
    card.className = 'feature-card';
    card.setAttribute('role', 'article');

    const cardIcon = document.createElement('div');
    cardIcon.className = 'feature-card-icon';
    cardIcon.textContent = icon;
    cardIcon.setAttribute('aria-hidden', 'true');

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'feature-card-title';
    cardTitle.textContent = title;

    const cardDesc = document.createElement('p');
    cardDesc.className = 'feature-card-description';
    cardDesc.textContent = description;

    card.appendChild(cardIcon);
    card.appendChild(cardTitle);
    card.appendChild(cardDesc);
    grid.appendChild(card);
  });

  container.appendChild(heading);
  container.appendChild(subtitle);
  container.appendChild(grid);
  section.appendChild(container);
  return section;
};

const createCTASection = () => {
  const section = document.createElement('section');
  section.className = 'cta-section landing-section';
  section.setAttribute('aria-label', 'Call to Action');
  section.setAttribute('role', 'region');

  const container = document.createElement('div');
  container.className = 'section-container';

  const content = document.createElement('div');
  content.className = 'cta-content';

  const heading = document.createElement('h2');
  heading.className = 'cta-heading';
  heading.textContent = 'Start Tracking Your Money in Seconds';

  const description = document.createElement('p');
  description.className = 'cta-description';
  description.textContent =
    'Join BlinkBudget and transform the way you track expenses. No credit card, no commitment — just a faster way to understand your finances.';

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'cta-button-container';

  const ctaBtn = ButtonComponent({
    text: 'Get Started Free',
    variant: 'primary',
    onClick: () => {
      const instance = ctaBtn.buttonInstance;
      if (instance) instance.setLoading(true);
      // Brief visual feedback before navigation
      setTimeout(() => Router.navigate('login'), 300);
    },
  });
  ctaBtn.classList.add('cta-button--large');

  const secondaryBtn = ButtonComponent({
    text: 'Learn More',
    variant: 'ghost',
    onClick: () => {
      document
        .querySelector('.features-section')
        ?.scrollIntoView({ behavior: 'smooth' });
    },
  });
  secondaryBtn.classList.add('cta-button--secondary');

  buttonContainer.appendChild(ctaBtn);
  buttonContainer.appendChild(secondaryBtn);

  content.appendChild(heading);
  content.appendChild(description);
  content.appendChild(buttonContainer);
  container.appendChild(content);
  section.appendChild(container);
  return section;
};

const createFooter = () => {
  const footer = document.createElement('footer');
  footer.className = 'landing-footer';

  const container = document.createElement('div');
  container.className = 'footer-container';

  const brand = document.createElement('div');
  brand.className = 'footer-brand';

  const brandIcon = document.createElement('img');
  brandIcon.src = '/favicon.png';
  brandIcon.alt = 'BlinkBudget';
  brandIcon.width = 28;
  brandIcon.height = 28;
  brandIcon.className = 'footer-icon';

  const brandName = document.createElement('span');
  brandName.textContent = 'BlinkBudget';
  brandName.className = 'footer-brand-name';

  brand.appendChild(brandIcon);
  brand.appendChild(brandName);

  const links = document.createElement('div');
  links.className = 'footer-links';

  const linkData = [
    { text: 'Privacy Policy', href: '/docs/privacy-policy.md' },
    { text: 'Terms of Service', href: '/docs/terms-of-service.md' },
    { text: 'GitHub', href: 'https://github.com/Krasen007/BlinkBudget' },
  ];

  linkData.forEach(({ text, href }) => {
    const link = document.createElement('a');
    link.textContent = text;
    link.href = href;
    link.className = 'footer-link';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    links.appendChild(link);
  });

  const copyright = document.createElement('div');
  copyright.className = 'footer-copyright';
  copyright.textContent = `© ${new Date().getFullYear()} BlinkBudget. All rights reserved.`;

  container.appendChild(brand);
  container.appendChild(links);
  container.appendChild(copyright);
  footer.appendChild(container);
  return footer;
};

export const LandingView = () => {
  const container = document.createElement('div');
  container.className = 'view-landing';

  /** Per-instance observer tracking for proper cleanup */
  const observers = [];

  container.appendChild(createHeroSection());
  container.appendChild(createHowItWorksSection());
  container.appendChild(createScreenshotsSection());
  container.appendChild(createFeaturesSection());
  container.appendChild(createCTASection());
  container.appendChild(createFooter());

  // Initialize scroll-reveal after elements are in the DOM tree
  // Use rAF to ensure layout is complete before measuring
  requestAnimationFrame(() => initScrollReveal(container, observers));

  /** Cleanup: disconnect all IntersectionObservers */
  container.cleanup = () => {
    observers.forEach(obs => obs.disconnect());
    observers.length = 0;
  };

  return container;
};
