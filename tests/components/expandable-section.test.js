import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExpandableSection } from '../../src/components/ExpandableSection.js';

describe('ExpandableSection Component', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = mockLocalStorage;
  });

  describe('Rendering', () => {
    it('should render collapsed by default', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: false,
      });
      expect(section.isExpanded()).toBe(false);
    });

    it('should render expanded when defaultExpanded is true', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: true,
      });
      expect(section.isExpanded()).toBe(true);
    });

    it('should have toggle button', () => {
      const section = ExpandableSection({ title: 'Test Section' });
      expect(section.toggle).toBeTruthy();
    });

    it('should have content container', () => {
      const contentDiv = document.createElement('div');
      contentDiv.textContent = 'Test content';
      const section = ExpandableSection({
        title: 'Test Section',
        content: contentDiv,
      });
      expect(section.content).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('should expand on click', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: false,
      });
      section.toggle.click();
      expect(section.isExpanded()).toBe(true);
    });

    it('should collapse when already expanded', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: true,
      });
      section.toggle.click();
      expect(section.isExpanded()).toBe(false);
    });

    it('should toggle on Enter key', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: false,
      });
      section.toggle.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter' })
      );
      expect(section.isExpanded()).toBe(true);
    });

    it('should toggle on Space key', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: false,
      });
      section.toggle.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      expect(section.isExpanded()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-expanded attribute', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: false,
      });
      expect(section.toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('should update aria-expanded on toggle', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: false,
      });
      section.toggle.click();
      expect(section.toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have aria-label', () => {
      const section = ExpandableSection({ title: 'Test Section' });
      expect(section.toggle.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage when storageKey provided', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: false,
        storageKey: 'test_section_expanded',
      });
      section.toggle.click();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should restore state from localStorage', () => {
      mockLocalStorage.getItem = vi.fn().mockReturnValue('true');
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: false,
        storageKey: 'test_section_expanded',
      });
      expect(section.isExpanded()).toBe(true);
    });
  });

  describe('Methods', () => {
    it('should have expand method', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: false,
      });
      section.expand();
      expect(section.isExpanded()).toBe(true);
    });

    it('should have collapse method', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: true,
      });
      section.collapse();
      expect(section.isExpanded()).toBe(false);
    });

    it('should have setContent method', () => {
      const section = ExpandableSection({ title: 'Test Section' });
      const newContent = document.createElement('div');
      newContent.textContent = 'New content';
      section.setContent(newContent);
      expect(section.content.innerHTML).toContain('New content');
    });

    it('should have getExpandedState method', () => {
      const section = ExpandableSection({
        title: 'Test Section',
        defaultExpanded: true,
      });
      expect(section.getExpandedState()).toBe(true);
    });
  });
});
