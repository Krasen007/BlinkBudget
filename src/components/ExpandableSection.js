/**
 * ExpandableSection Component
 * Part of Feature 3.5.2: Progressive Disclosure Interface
 */

import { getCopyString } from '../utils/copy-strings.js';

export const ExpandableSection = ({
  title,
  defaultExpanded = false,
  storageKey = null,
  content = null,
  icon = null,
}) => {
  let expanded = defaultExpanded;
  if (storageKey) {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        expanded = stored === 'true';
      }
    } catch (error) {
      // Silently ignore localStorage read errors, use default value
      console.warn(
        `[ExpandableSection] Failed to read localStorage key "${storageKey}":`,
        error
      );
    }
  }

  const container = document.createElement('div');
  container.className = 'expandable-section';
  container.style.marginBottom = 'var(--spacing-md)';

  const toggle = document.createElement('button');
  toggle.className = 'expandable-section-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', expanded.toString());
  toggle.setAttribute(
    'aria-label',
    expanded
      ? `${getCopyString('accessibility.collapseSection')}: ${title}`
      : `${getCopyString('accessibility.expandSection')}: ${title}`
  );

  toggle.style.width = '100%';
  toggle.style.display = 'flex';
  toggle.style.alignItems = 'center';
  toggle.style.justifyContent = 'space-between';
  toggle.style.padding = 'var(--spacing-md) var(--spacing-lg)';
  toggle.style.backgroundColor = 'var(--color-surface)';
  toggle.style.border = '1px solid var(--color-border)';
  toggle.style.borderRadius = 'var(--radius-lg)';
  toggle.style.color = 'var(--color-text-main)';
  toggle.style.fontSize = 'var(--font-size-base)';
  toggle.style.fontWeight = '600';
  toggle.style.fontFamily = 'var(--font-body)';
  toggle.style.cursor = 'pointer';
  toggle.style.minHeight = 'var(--touch-target-min)';
  toggle.style.textAlign = 'left';
  toggle.style.transition =
    'background-color var(--transition-fast), border-color var(--transition-fast)';
  toggle.style.outline = '2px solid Highlight';

  toggle.addEventListener('focus', () => {
    toggle.style.boxShadow = 'var(--focus-shadow-strong)';
    toggle.style.borderColor = 'var(--focus-color)';
    toggle.style.outline = '2px solid Highlight';
  });
  toggle.addEventListener('blur', () => {
    toggle.style.boxShadow = 'none';
    toggle.style.borderColor = 'var(--color-border)';
  });

  toggle.addEventListener('mouseenter', () => {
    toggle.style.backgroundColor = 'var(--color-surface-hover)';
  });
  toggle.addEventListener('mouseleave', () => {
    toggle.style.backgroundColor = 'var(--color-surface)';
  });

  const titleContainer = document.createElement('span');
  titleContainer.className = 'expandable-section-title';
  titleContainer.style.display = 'flex';
  titleContainer.style.alignItems = 'center';
  titleContainer.style.gap = 'var(--spacing-sm)';

  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'expandable-section-icon';
    iconSpan.textContent = icon;
    iconSpan.style.fontSize = 'var(--font-size-lg)';
    titleContainer.appendChild(iconSpan);
  }

  const titleText = document.createElement('span');
  titleText.textContent = title;
  titleText.className = 'expandable-section-title-text';
  titleContainer.appendChild(titleText);
  toggle.appendChild(titleContainer);

  const arrow = document.createElement('span');
  arrow.className = 'expandable-section-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = String.fromCharCode(9662);
  arrow.style.fontSize = 'var(--font-size-sm)';
  arrow.style.color = 'var(--color-text-muted)';
  arrow.style.transition = 'transform var(--transition-normal)';
  arrow.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
  toggle.appendChild(arrow);

  const contentContainer = document.createElement('div');
  contentContainer.className = 'expandable-section-content';
  contentContainer.style.overflow = 'hidden';
  contentContainer.style.transition =
    'max-height var(--transition-normal), opacity var(--transition-normal)';
  contentContainer.style.maxHeight = expanded ? '2000px' : '0';
  contentContainer.style.opacity = expanded ? '1' : '0';
  contentContainer.style.padding = expanded ? 'var(--spacing-md) 0' : '0';

  if (content) {
    contentContainer.appendChild(content);
  }

  const toggleSection = () => {
    expanded = !expanded;
    toggle.setAttribute('aria-expanded', expanded.toString());
    toggle.setAttribute(
      'aria-label',
      expanded
        ? `${getCopyString('accessibility.collapseSection')}: ${title}`
        : `${getCopyString('accessibility.expandSection')}: ${title}`
    );
    arrow.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
    if (expanded) {
      contentContainer.style.maxHeight = '2000px';
      contentContainer.style.opacity = '1';
      contentContainer.style.padding = 'var(--spacing-md) 0';
    } else {
      contentContainer.style.maxHeight = '0';
      contentContainer.style.opacity = '0';
      contentContainer.style.padding = '0';
    }
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, expanded.toString());
      } catch (error) {
        console.error(
          `[ExpandableSection] Failed to write localStorage key "${storageKey}":`,
          error
        );
        // Continue without saving - UI still works
      }
    }
  };

  toggle.addEventListener('click', toggleSection);
  toggle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSection();
    }
  });

  toggle.addEventListener(
    'touchstart',
    () => {
      toggle.style.transform = 'scale(0.98)';
    },
    { passive: true }
  );
  toggle.addEventListener(
    'touchend',
    () => {
      toggle.style.transform = 'scale(1)';
    },
    { passive: true }
  );
  toggle.addEventListener(
    'touchcancel',
    () => {
      toggle.style.transform = 'scale(1)';
    },
    { passive: true }
  );

  container.appendChild(toggle);
  container.appendChild(contentContainer);

  return {
    container,
    toggle,
    content: contentContainer,
    expand: () => {
      if (!expanded) toggleSection();
    },
    collapse: () => {
      if (expanded) toggleSection();
    },
    toggleSection,
    isExpanded: () => expanded,
    setContent: newContent => {
      contentContainer.innerHTML = '';
      if (newContent) contentContainer.appendChild(newContent);
    },
    getExpandedState: () => expanded,
  };
};

export const createExpandableSection = (title, content, options = {}) => {
  return ExpandableSection({
    title,
    content,
    defaultExpanded: options.defaultExpanded || false,
    storageKey: options.storageKey || null,
    icon: options.icon || null,
  });
};

export default ExpandableSection;
