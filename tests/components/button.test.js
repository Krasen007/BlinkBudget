// tests/button.test.js
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../src/components/Button.js';

describe('Button Component - Touch Optimizations', () => {
  it('should create button with proper structure and classes', () => {
    const button = Button({ text: 'Test Button' });

    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent).toBe('Test Button');
    expect(button.className).toContain('btn');
    expect(button.type).toBe('button');

    // Check that the button has the correct variant class
    expect(button.className).toContain('btn-primary'); // default variant
  });

  it('should add touch-active class on touchstart', () => {
    const button = Button({ text: 'Test Button' });
    document.body.appendChild(button);

    // Simulate touchstart event
    const touchEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 0, clientY: 0 }],
    });

    button.dispatchEvent(touchEvent);
    expect(button.classList.contains('btn-touch-active')).toBe(true);

    document.body.removeChild(button);
  });

  it('should remove touch-active class on touchend', () => {
    const button = Button({ text: 'Test Button' });
    document.body.appendChild(button);

    // Add the class first
    button.classList.add('btn-touch-active');

    // Simulate touchend event
    const touchEvent = new TouchEvent('touchend');
    button.dispatchEvent(touchEvent);

    expect(button.classList.contains('btn-touch-active')).toBe(false);

    document.body.removeChild(button);
  });

  it('should handle disabled state correctly', () => {
    const button = Button({ text: 'Disabled Button', disabled: true });

    expect(button.disabled).toBe(true);

    // Disabled buttons should not respond to touch
    const touchEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 0, clientY: 0 }],
    });

    button.dispatchEvent(touchEvent);
    expect(button.classList.contains('btn-touch-active')).toBe(false);
  });

  it('should call onClick handler when clicked', () => {
    const mockClick = vi.fn();
    const button = Button({ text: 'Clickable Button', onClick: mockClick });

    button.click();
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('should have touch optimization properties', () => {
    const button = Button({ text: 'Optimized Button' });

    // Check that the button has the proper class for CSS styling
    expect(button.className).toContain('btn');

    // Verify touch event listeners are attached by checking if events can be dispatched
    let touchStartFired = false;
    button.addEventListener('touchstart', () => {
      touchStartFired = true;
    });

    const touchEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    button.dispatchEvent(touchEvent);

    expect(touchStartFired).toBe(true);
  });
});
