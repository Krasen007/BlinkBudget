/**
 * Tutorial Configuration - BlinkBudget Interactive Tutorial
 * Defines tutorial steps, content, and behavior
 */

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    type: 'welcome',
    title: 'Track expenses in 3 clicks',
    description: 'Let us show you how BlinkBudget makes budgeting effortless',
    primaryAction: {
      id: 'start',
      text: 'Start Tutorial',
      variant: 'primary',
    },
    secondaryAction: {
      id: 'skip',
      text: 'Skip',
      variant: 'secondary',
    },
  },
  {
    id: 'amount-input',
    type: 'spotlight',
    target: '[data-tutorial-target="amount-input"]',
    title: 'Start with the amount',
    content: "Enter how much you spent. We'll suggest the rest!",
    position: 'top',
    actions: [
      {
        id: 'next',
        text: 'Next',
        variant: 'primary',
      },
      {
        id: 'skip',
        text: 'Skip Tutorial',
        variant: 'secondary',
      },
    ],
  },
  {
    id: 'category-selection',
    type: 'spotlight',
    target: '[data-tutorial-target="category-selector"]',
    title: 'Smart categorization',
    content: 'We learn your habits. Watch as we suggest the right category!',
    position: 'auto',
    actions: [
      {
        id: 'next',
        text: 'Next',
        variant: 'primary',
      },
      {
        id: 'previous',
        text: 'Previous',
        variant: 'secondary',
      },
    ],
  },
  {
    id: 'transaction-complete',
    type: 'celebration',
    title: "That's it! 🎉",
    description:
      'Your transaction is saved. Just 3 clicks to better budgeting!',
    illustration: 'success-check',
    actions: [
      {
        id: 'complete',
        text: 'Add Another',
        variant: 'primary',
      },
      {
        id: 'dashboard',
        text: 'View Dashboard',
        variant: 'secondary',
      },
    ],
  },
];

export const TUTORIAL_CONFIG = {
  // Tutorial behavior settings
  autoStart: true,
  showOnFirstVisit: true,
  allowSkip: true,
  allowDismiss: true,

  // Animation settings
  animationDuration: 300,
  spotlightPadding: 8,

  // Positioning settings
  tooltipMaxWidth: 280,
  tooltipOffset: 10,

  // Mobile settings
  mobileBreakpoint: 768,
  mobileTooltipMaxWidth: 'calc(100vw - 32px)',

  // Accessibility settings
  enableKeyboardNavigation: true,
  enableScreenReaderSupport: true,
  announceChanges: true,

  // Storage settings
  storageKey: 'blinkbudget_tutorial',
  completedKey: 'tutorial_completed',
  seenStepsKey: 'tutorial_seen_steps',
  dismissedKey: 'tutorial_dismissed',
};

export const TUTORIAL_TRIGGERS = {
  // When to show tutorial
  firstVisit: 'first-visit',
  zeroTransactions: 'zero-transactions',
  userRequested: 'user-requested',

  // Contextual triggers
  afterFirstTransaction: 'after-first-transaction',
  afterThreeTransactions: 'after-three-transactions',
  afterOneWeek: 'after-one-week',
};

export const TUTORIAL_EVENTS = {
  // Tutorial lifecycle events
  STARTED: 'tutorial-started',
  COMPLETED: 'tutorial-completed',
  SKIPPED: 'tutorial-skipped',
  DISMISSED: 'tutorial-dismissed',

  // Step events
  STEP_STARTED: 'tutorial-step-started',
  STEP_COMPLETED: 'tutorial-step-completed',
  STEP_SKIPPED: 'tutorial-step-skipped',

  // Interaction events
  ACTION_TRIGGERED: 'tutorial-action-triggered',
  TARGET_NOT_FOUND: 'tutorial-target-not-found',
};
