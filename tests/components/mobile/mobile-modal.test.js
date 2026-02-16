import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MobileModal,
  MobileConfirmDialog,
  MobileBottomSheet,
} from '../../../src/components/MobileModal.js';

// Mock mobile utils
global.window.mobileUtils = {
  supportsHaptic: () => true,
  hapticFeedback: vi.fn(),
};

describe('MobileModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should create modal with correct structure', () => {
    const modal = MobileModal({
      title: 'Test Modal',
      content: 'Test content',
    });

    expect(modal.className).toBe('mobile-modal-overlay');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');

    const modalContent = modal.querySelector('.mobile-modal');
    expect(modalContent).toBeTruthy();

    const title = modal.querySelector('.mobile-modal-title');
    expect(title.textContent).toBe('Test Modal');

    const content = modal.querySelector('.mobile-modal-content');
    expect(content.innerHTML).toBe('Test content');
  });

  it('should create modal with close button', () => {
    const onClose = vi.fn();
    const modal = MobileModal({
      title: 'Test Modal',
      content: 'Test content',
      onClose,
      showCloseButton: true,
    });

    const closeBtn = modal.querySelector('.mobile-modal-close');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.getAttribute('aria-label')).toBe('Close modal');
  });

  it('should handle different modal sizes', () => {
    const fullModal = MobileModal({
      title: 'Full Modal',
      content: 'Content',
      size: 'full',
    });

    const modalContent = fullModal.querySelector('.mobile-modal');
    expect(modalContent.className).toBe('mobile-modal mobile-modal-full');
  });

  it('should be added to document body', () => {
    const modal = MobileModal({
      title: 'Test Modal',
      content: 'Test content',
    });

    expect(document.body.contains(modal)).toBe(true);
  });
});

describe('MobileConfirmDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should create confirm dialog with correct structure', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const dialog = MobileConfirmDialog({
      title: 'Confirm Action',
      message: 'Are you sure?',
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm,
      onCancel,
    });

    expect(dialog.className).toBe('mobile-modal-overlay');

    const message = dialog.querySelector('.mobile-confirm-message');
    expect(message.textContent).toBe('Are you sure?');

    const actions = dialog.querySelector('.mobile-confirm-actions');
    expect(actions).toBeTruthy();

    const buttons = actions.querySelectorAll('.mobile-confirm-btn');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe('No'); // Cancel button
    expect(buttons[1].textContent).toBe('Yes'); // Confirm button
  });

  it('should handle danger variant', () => {
    const dialog = MobileConfirmDialog({
      title: 'Delete Item',
      message: 'This action cannot be undone',
      variant: 'danger',
    });

    const confirmBtn = dialog.querySelectorAll('.mobile-confirm-btn')[1];
    expect(confirmBtn.classList.contains('btn-danger')).toBe(true);
  });
});

describe('MobileBottomSheet', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should create bottom sheet with correct structure', () => {
    const sheet = MobileBottomSheet({
      title: 'Bottom Sheet',
      content: 'Sheet content',
    });

    expect(sheet.className).toBe('mobile-bottom-sheet-overlay');

    const sheetContent = sheet.querySelector('.mobile-bottom-sheet');
    expect(sheetContent).toBeTruthy();

    const handle = sheet.querySelector('.mobile-bottom-sheet-handle');
    expect(handle).toBeTruthy();

    const title = sheet.querySelector('.mobile-bottom-sheet-title');
    expect(title.textContent).toBe('Bottom Sheet');

    const content = sheet.querySelector('.mobile-bottom-sheet-content');
    expect(content.innerHTML).toBe('Sheet content');
  });

  it('should create bottom sheet without handle when disabled', () => {
    const sheet = MobileBottomSheet({
      title: 'Bottom Sheet',
      content: 'Sheet content',
      showHandle: false,
    });

    const handle = sheet.querySelector('.mobile-bottom-sheet-handle');
    expect(handle).toBe(null);
  });
});
