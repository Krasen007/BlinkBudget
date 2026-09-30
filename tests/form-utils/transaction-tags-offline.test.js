import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTransactionTagSelector } from '../../src/utils/form-utils/transaction-tags.js';
import { AuthService } from '../../src/core/auth-service.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

/**
 * Offline / cold-start regression tests for the transaction tag selector.
 *
 * Bug this suite guards against: on app start Firebase auth takes a moment to
 * resolve (and can stall entirely when offline). Until then AuthService.user
 * is null and getUserId() returned null, so userId-filtered flag categories
 * came back empty — the Add view showed no selectable tags until "a few
 * moments later" when auth finally resolved.
 *
 * Fix under test (all real code, no mocks):
 *  1. AuthService persists the last known uid and getUserId() falls back to
 *     it while this.user is null, so local reads work synchronously offline.
 *  2. The tag selector re-renders on categories-updated / storage-updated so
 *     tags that arrive late (auth resolve, cloud merge) become selectable
 *     without reopening the form.
 */

const FLAG_CATEGORY = {
  id: 'flag-work',
  name: 'Work',
  type: 'expense',
  color: '#123456',
  showAsCheckbox: true,
  userId: 'user-1',
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// In-memory fake for localStorage (global setup mocks it with vi.fn stubs).
const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: key => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

describe('transaction tag selector — offline cold start', () => {
  let originalLocalStorage;
  let originalUser;
  let attachedRoot;

  const seedFlagCategories = () => {
    localStorage.setItem(
      STORAGE_KEYS.CUSTOM_CATEGORIES,
      JSON.stringify([FLAG_CATEGORY])
    );
    localStorage.setItem('categories_initialized_user-1', 'true');
  };

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    global.localStorage = createMemoryStorage();
    originalUser = AuthService.user;
    AuthService.user = null;

    // Simulate a returning user starting the app offline: auth state has not
    // resolved yet (this.user === null) but the last known uid is persisted.
    localStorage.setItem('last_known_uid', 'user-1');
  });

  afterEach(() => {
    if (attachedRoot) {
      attachedRoot.remove();
      attachedRoot = null;
    }
    AuthService.user = originalUser;
    global.localStorage = originalLocalStorage;
  });

  it('getUserId falls back to the persisted uid while auth is unresolved', () => {
    expect(AuthService.user).toBeNull();
    expect(AuthService.getUserId()).toBe('user-1');
  });

  it('getUserId prefers the live user object once auth resolves', () => {
    AuthService.user = { uid: 'user-2' };
    expect(AuthService.getUserId()).toBe('user-2');
  });

  it('shows selectable tags immediately at cold start (auth unresolved)', () => {
    seedFlagCategories();

    const selector = createTransactionTagSelector();
    expect(selector.container.hidden).toBe(false);

    const option = selector.container.querySelector(
      '.transaction-tag-option__input'
    );
    expect(option).toBeTruthy();
    expect(option.value).toBe('Work');

    // Selecting the tag must work through the real click handler
    option
      .closest('.transaction-tag-option')
      .dispatchEvent(new Event('click', { bubbles: true }));
    expect(selector.getSelectedTag()).toBe('Work');
  });

  it('re-renders when flag categories arrive after the form is open', () => {
    // Form opens before categories are readable (empty list, nothing selected)
    const selector = createTransactionTagSelector();
    expect(selector.container.hidden).toBe(true);

    attachedRoot = document.createElement('div');
    attachedRoot.appendChild(selector.container);
    document.body.appendChild(attachedRoot);

    // Categories become available (auth resolved / cloud merge landed)
    seedFlagCategories();
    window.dispatchEvent(new CustomEvent('categories-updated'));

    expect(selector.container.hidden).toBe(false);
    expect(
      selector.container.querySelector('.transaction-tag-option__input')
    ).toBeTruthy();

    // Selecting the newly arrived tag works without reopening the form
    selector.container
      .querySelector('.transaction-tag-option')
      .dispatchEvent(new Event('click', { bubbles: true }));
    expect(selector.getSelectedTag()).toBe('Work');
  });

  it('re-renders on storage-updated only for the categories key', () => {
    seedFlagCategories();

    const selector = createTransactionTagSelector();
    attachedRoot = document.createElement('div');
    attachedRoot.appendChild(selector.container);
    document.body.appendChild(attachedRoot);

    // Wipe the categories to simulate an empty list, then restore via a
    // categories storage update (the path cloud sync merges take).
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify([]));
    window.dispatchEvent(
      new CustomEvent('storage-updated', {
        detail: { key: STORAGE_KEYS.CUSTOM_CATEGORIES },
      })
    );
    expect(
      selector.container.querySelectorAll('.transaction-tag-option')
    ).toHaveLength(0);

    localStorage.setItem(
      STORAGE_KEYS.CUSTOM_CATEGORIES,
      JSON.stringify([FLAG_CATEGORY])
    );
    window.dispatchEvent(
      new CustomEvent('storage-updated', {
        detail: { key: STORAGE_KEYS.CUSTOM_CATEGORIES },
      })
    );
    expect(
      selector.container.querySelectorAll('.transaction-tag-option')
    ).toHaveLength(1);

    // Unrelated storage updates must not re-render (or crash)
    window.dispatchEvent(
      new CustomEvent('storage-updated', {
        detail: { key: STORAGE_KEYS.TRANSACTIONS },
      })
    );
    expect(
      selector.container.querySelectorAll('.transaction-tag-option')
    ).toHaveLength(1);
  });

  it('stops listening once the form is removed from the DOM', () => {
    seedFlagCategories();

    const selector = createTransactionTagSelector();
    attachedRoot = document.createElement('div');
    attachedRoot.appendChild(selector.container);
    document.body.appendChild(attachedRoot);

    // Event while mounted marks the selector as live...
    window.dispatchEvent(new CustomEvent('categories-updated'));
    expect(
      selector.container.querySelectorAll('.transaction-tag-option')
    ).toHaveLength(1);

    // ...then the form closes. Further events must be harmless no-ops.
    attachedRoot.remove();
    window.dispatchEvent(new CustomEvent('categories-updated'));
    expect(selector.getSelectedTag()).toBeNull();
  });
});
