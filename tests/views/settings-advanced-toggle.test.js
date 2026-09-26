import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Behavioural half of the todo/ai-slop-report.md #4.1 fix (Round 2).
 *
 * The CSS half — the `@keyframes slideUp` name collision between `ui.css` and
 * `mobile.css` — is guarded structurally in
 * `tests/system/css-architecture.test.js`. That guard cannot see this half: it
 * is about *when the panel is actually displayed*, which is a JS/CSS contract.
 *
 * Before the fix, `SettingsView` dropped `--visible` (the only rule carrying
 * `display: block`) in the same tick it added `--closing`, so the section fell
 * back to the base `display: none` and the exit animation was never observable.
 * The deferred hide added in the same change makes the animation real, and
 * brings a timer-lifecycle obligation with it: a close animation still in flight
 * must not be able to hide a panel the user has since re-opened.
 *
 * This file lives on its own because no other suite renders `SettingsView`, and
 * every child section is mocked — the toggle is the only thing under test.
 */

const stub = () => document.createElement('div');

vi.mock('../../src/components/Button.js', () => ({
  ButtonComponent: ({ text }) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    return btn;
  },
}));

vi.mock('../../src/utils/toast-notifications.js', () => ({
  showSuccessToast: vi.fn(),
  showInfoToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

vi.mock('../../src/core/router.js', () => ({ Router: { navigate: vi.fn() } }));

vi.mock('../../src/components/AccountSection.js', () => ({
  AccountSection: () => stub(),
}));
vi.mock('../../src/components/DataManagementSection.js', () => ({
  DataManagementSection: () => stub(),
}));
vi.mock('../../src/components/GeneralSection.js', () => ({
  GeneralSection: () => stub(),
}));
vi.mock('../../src/components/BackupRestoreSection.js', () => ({
  BackupRestoreSection: () => stub(),
}));
vi.mock('../../src/components/AccountDeletionSection.js', () => ({
  AccountDeletionSection: () => stub(),
}));
vi.mock('../../src/components/SecuritySection.js', () => ({
  SecuritySection: () => stub(),
}));
vi.mock('../../src/components/FeedbackLink.js', () => ({
  FeedbackLink: () => stub(),
}));
vi.mock('../../src/components/DateFormatSection.js', () => ({
  DateFormatSection: () => stub(),
}));

vi.mock('../../src/utils/security-utils.js', () => ({
  escapeHtml: value => String(value),
}));

vi.mock('../../src/core/settings-service.js', () => ({
  SettingsService: { getSetting: vi.fn(() => false), saveSetting: vi.fn() },
}));

vi.mock('../../src/pwa.js', () => ({
  CURRENT_VERSION: '1.0.0-test',
  GITHUB_RELEASES_URL: 'https://example.test/releases',
  checkForUpdatesWithFeedback: vi.fn(async () => false),
}));

vi.mock('../../src/utils/dom-factory.js', () => ({
  createButton: () => document.createElement('button'),
}));

vi.mock('../../src/utils/navigation-helper.js', () => ({
  createNavigationButtons: () => document.createElement('div'),
}));

import { SettingsView } from '../../src/views/SettingsView.js';
import { TIMING } from '../../src/utils/constants.js';
describe('SettingsView advanced settings toggle animation', () => {
  let view;
  let toggle;
  let panel;

  // The panel is displayed when it carries EITHER `--visible` or `--closing` —
  // both rules declare `display: block`. It is collapsed only when it carries
  // neither, falling back to the base `.advanced-settings-section` display:none.
  const isDisplayed = () =>
    panel.classList.contains('advanced-settings-section--visible') ||
    panel.classList.contains('advanced-settings-section--closing');
  const isCollapsed = () => !isDisplayed();

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    view = SettingsView();
    document.body.appendChild(view);
    toggle = view.querySelector('.advanced-toggle');
    panel = view.querySelector('.advanced-settings-section');
  });

  afterEach(() => {
    if (view && typeof view.cleanup === 'function') view.cleanup();
    document.body.innerHTML = '';
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('starts collapsed and reports collapsed to assistive tech', () => {
    expect(isDisplayed()).toBe(false);
    expect(isCollapsed()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the panel immediately when opened', () => {
    toggle.click();

    expect(isDisplayed()).toBe(true);
    expect(panel.classList.contains('advanced-settings-section--visible')).toBe(
      true
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps the panel displayed for the length of the close animation, then hides it', () => {
    toggle.click(); // open
    expect(isDisplayed()).toBe(true);

    toggle.click(); // close — exit animation starts
    // `--visible` is dropped at once, but `--closing` now carries the display, so
    // the panel stays on screen for the length of the exit animation.
    expect(panel.classList.contains('advanced-settings-section--visible')).toBe(
      false
    );
    expect(panel.classList.contains('advanced-settings-section--closing')).toBe(
      true
    );

    // Mid-animation the panel must still be in the DOM-visible state, because
    // `--closing` is what carries `display: block` during the exit. If it ever
    // hides immediately again the exit animation is unobservable — the exact
    // user-visible symptom #4.1 reported.
    vi.advanceTimersByTime(TIMING.ANIMATION_NORMAL - 1);
    expect(isDisplayed()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(isDisplayed()).toBe(false);
    expect(isCollapsed()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('cancels a pending close when the panel is re-opened mid-animation', () => {
    toggle.click(); // open
    toggle.click(); // close — exit animation starts
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(TIMING.ANIMATION_NORMAL - 50); // re-open partway
    toggle.click();

    // The close timer must be cancelled outright. Asserted on the pending-timer
    // count rather than on the DOM: a stale timer that merely removes an
    // already-absent `--closing` is invisible in the markup, and its only real
    // damage is on the *next* close (covered by the test below).
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(TIMING.ANIMATION_NORMAL);

    expect(isDisplayed()).toBe(true);
    expect(panel.classList.contains('advanced-settings-section--visible')).toBe(
      true
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('gives a second close its own full animation after a re-open', () => {
    // open -> close -> reopen -> close. Close #2 must run to completion rather
    // than being cut short by close #1's timer.
    toggle.click();
    toggle.click();
    vi.advanceTimersByTime(TIMING.ANIMATION_NORMAL - 50);
    toggle.click(); // reopen, cancelling close #1
    vi.advanceTimersByTime(10);
    toggle.click(); // close #2

    expect(isDisplayed()).toBe(true); // still in flight
    vi.advanceTimersByTime(TIMING.ANIMATION_NORMAL - 1);
    expect(isDisplayed()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(isDisplayed()).toBe(false);
  });

  it('toggles from the keyboard as well as the pointer', () => {
    toggle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
    expect(isDisplayed()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    );
    expect(panel.classList.contains('advanced-settings-section--visible')).toBe(
      false
    );
    expect(panel.classList.contains('advanced-settings-section--closing')).toBe(
      true
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    vi.advanceTimersByTime(TIMING.ANIMATION_NORMAL);
    expect(isDisplayed()).toBe(false);
  });
});
