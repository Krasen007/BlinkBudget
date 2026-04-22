/**
 * Tutorial Configuration - BlinkBudget Interactive Tutorial
 * Defines tutorial steps, content, and behavior
 */

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    type: 'welcome',
    title: 'Welcome to BlinkBudget! 🚀',
    description:
      "Track your expenses in just 3 clicks. Let's get you started with the fastest expense tracking experience!",
    content:
      'No complicated forms or endless fields. Quickly categorize your transactions. Beautiful insights to help you make smarter financial decisions.',
    primaryAction: {
      id: 'start',
      text: "Let's start →",
      variant: 'primary',
    },
    secondaryAction: {
      id: 'skip',
      text: 'Skip',
      variant: 'secondary',
    },
  },
  {
    id: 'three-click-promise',
    type: 'info',
    title: 'The Magic of 3 Clicks',
    content:
      'Here\'s how BlinkBudget transforms expense tracking from a chore into a habit:\n\n<br>**Step 1:** Click "Add Transaction"\n<br>**Step 2:** Enter the amount\n<br>**Step 3:** Choose a category - and you\'re done!\n\n**Pro Tip:** The transaction saves automatically when you pick a category. No save button needed!',
    illustration: 'three-clicks',
    actions: [
      {
        id: 'next',
        text: 'Next →',
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
    id: 'amount-input',
    type: 'info',
    title: 'Add Your First Transaction',
    content:
      "Navigate to the add transaction page and enter any amount. Try something like €5.50 for a lunch expense.",
    illustration: 'mobile',
    actions: [
      {
        id: 'next',
        text: 'Next →',
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
    id: 'category-selection',
    type: 'info',
    title: 'Quick Categories',
    content:
      'Just tap a category to save! No need to click a separate save button.\n\n🍔 Food & Groceries • ☕ Dining & Coffee • 🏠 Housing & Bills • 🚗 Transportation • 🛍️ Leisure & Shopping • 💇 Personal Care',
    illustration: 'accounts',
    actions: [
      {
        id: 'next',
        text: 'Next →',
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
    id: 'congratulations',
    type: 'celebration',
    title: 'You\'re All Set! 🎉',
    description:
      "You've learned the basics of BlinkBudget.",
    content:
      '**Key Takeaways:**\n• 3 clicks = expense logged\n• Categories auto-save your transactions\n\n**Start tracking your expenses now!**',
    illustration: 'success-celebration',
    actions: [
      {
        id: 'complete',
        text: 'Start Using BlinkBudget →',
        variant: 'primary',
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
