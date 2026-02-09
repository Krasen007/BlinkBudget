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
      'No complicated forms or endless fields. Smart categorization that learns from your habits. Beautiful insights to help you make smarter financial decisions.',
    primaryAction: {
      id: 'start',
      text: "Let's start your first transaction →",
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
        text: 'Try it now →',
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
    id: 'navigate-to-add',
    type: 'navigation',
    target: 'add-expense',
    title: "Let's Add Your First Transaction",
    content:
      "We'll navigate to add transaction page where you can log expenses in just 3 clicks.",
    actions: [
      {
        id: 'next',
        text: 'Continue →',
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
    id: 'amount-input',
    type: 'spotlight',
    target: '[data-tutorial-target="amount-input"]',
    title: 'Your First Transaction',
    content:
      "Let's log a sample expense together. Notice how simple this is. Enter any amount (try $5.50) and choose where this expense came from.",
    position: 'top',
    delay: 2000, // Wait longer for page to load
    actions: [
      {
        id: 'next',
        text: 'Continue →',
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
    type: 'spotlight',
    target: '[data-tutorial-target="category-selector"]',
    title: 'Smart Categories',
    content:
      'Just tap one to save! We learn your favorite categories and remember typical amounts. No need to click a separate save button.\n\n🍔 Food & Groceries • ☕ Dining & Coffee • 🏠 Housing & Bills • 🚗 Transportation • 🛍️ Leisure & Shopping • 💇 Personal Care',
    position: 'auto',
    delay: 1500, // Wait longer for animations
    actions: [
      {
        id: 'next',
        text: 'Pick a category to save →',
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
    id: 'navigate-to-dashboard',
    type: 'navigation',
    target: 'dashboard',
    title: 'Back to Your Dashboard',
    content:
      "Let's go back to your dashboard to see your complete financial picture.",
    actions: [
      {
        id: 'next',
        text: 'Explore dashboard →',
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
    id: 'dashboard-intro',
    type: 'spotlight',
    target: '[data-tutorial-target="dashboard"]',
    title: 'Your Financial Dashboard',
    content:
      "This is your command center. Everything you need at a glance:\n\n**Balance Cards** - See your total across all accounts\n**Recent Transactions** - Your latest expenses, color-coded by category\n**Quick Stats** - Today's spending, monthly trends\n\n**Pro Tip:** Tap any category name to filter transactions by that category!",
    position: 'bottom',
    delay: 2000, // Wait longer for page to load
    actions: [
      {
        id: 'next',
        text: 'Explore dashboard →',
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
    title: 'Congratulations! 🎉',
    description:
      "You've mastered the basics of BlinkBudget. Here's what to remember:",
    content:
      '**Key Takeaways:**\n• 3 clicks = expense logged\n• Categories auto-save your transactions\n• Dashboard shows your complete financial picture\n\n**Next Steps:**\n• Try adding a few more transactions\n\n**Welcome to effortless expense tracking!**',
    illustration: 'success-celebration',
    actions: [
      {
        id: 'complete',
        text: 'Start using BlinkBudget →',
        variant: 'primary',
      },
      {
        id: 'dashboard',
        text: 'Go to Dashboard',
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
