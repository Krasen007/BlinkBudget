# Design Specifications Document

## Phase 1: Anti-Deterrent Design & Progressive Disclosure

**Date:** February 22, 2026  
**Project:** BlinkBudget  
**Version:** 1.0

---

## 1. Quick Amount Presets Button Styling

### Visual Design

- **Button Size:** min-width: 60px, height: 36px
- **Border Radius:** 8px (var(--radius-md))
- **Background:** var(--color-surface)
- **Border:** 1px solid var(--color-border)
- **Text:** Bold, 14px (var(--font-size-sm))
- **Spacing:** 8px gap between buttons (var(--spacing-sm))
- **Margin-top:** 12px below amount input (var(--spacing-md))

### Interaction States

- **Default:** Background var(--color-surface), border var(--color-border)
- **Hover:** Background var(--color-surface-hover), border var(--color-primary-light)
- **Active/Pressed:** Scale 0.95, 150ms transition
- **Disabled:** Opacity 0.6

### Touch Target Requirements

- Minimum 44x44px touch target (wrap in container if needed)
- Ensure adequate spacing between buttons for touch

---

## 2. Micro-copy Placement and Styling

### Transaction Form

| Element           | Text                   | Position           | Style               |
| ----------------- | ---------------------- | ------------------ | ------------------- |
| Quick action hint | "Takes only 3 seconds" | Below Add button   | 14px, muted color   |
| Save confirmation | "Saved automatically"  | Near submit button | 14px, success color |
| First launch      | "No account needed"    | On first launch    | 14px, muted color   |

### Reports Section

| Element          | Text                             | Position    | Style               |
| ---------------- | -------------------------------- | ----------- | ------------------- |
| Privacy note     | "Your data stays on this device" | Header area | 14px, muted color   |
| Update indicator | "Updated in real-time"           | Status bar  | 14px, success color |

### Settings Section

| Element           | Text                     | Position         | Style               |
| ----------------- | ------------------------ | ---------------- | ------------------- |
| Security note     | "Your data is encrypted" | Security section | 14px, muted color   |
| Privacy assurance | "Your privacy matters"   | Privacy section  | 14px, primary color |

### Micro-copy Style Guidelines

- **Font:** Same as body (var(--font-body))
- **Size:** 14px (var(--font-size-sm))
- **Color:** var(--color-text-muted) - 40% opacity of primary
- **Iconography:** Small icons (16px) alongside text
- **Spacing:** 8px margin-top (var(--spacing-sm))

---

## 3. Expandable Section Visual Design

### Toggle Button Design

```
┌─────────────────────────────────┐
│ ▼ Advanced Options              │  ← Collapsed (default)
└─────────────────────────────────┘

┌─────────────────────────────────┐
▲ Advanced Options                │  ← Expanded
├─────────────────────────────────┤
│ Content here...                 │
└─────────────────────────────────┘
```

### Visual Specifications

- **Toggle Button:**
  - Width: 100%
  - Padding: 12px 16px (var(--spacing-md) var(--spacing-lg))
  - Background: var(--color-surface)
  - Border: 1px solid var(--color-border)
  - Border-radius: 12px (var(--radius-lg))
  - Font: 14px (var(--font-size-base)), semi-bold (600)
  - Min-height: 44px (var(--touch-target-min))

- **Arrow Indicator:**
  - Character: ▼ (Unicode 9662)
  - Size: 14px (var(--font-size-sm))
  - Color: var(--color-text-muted)
  - Animation: 200ms rotation transition

### Animation Specifications

- **Content fade-in:** 200ms (var(--transition-fast))
- **Height transition:** 300ms ease-in-out (var(--transition-normal))
- **Arrow rotation:** 200ms (var(--transition-normal))

### Mobile Considerations

- Larger touch target for toggle (full width)
- Ensure keyboard accessibility
- Collapse by default on mobile (save space)

### Accessibility Requirements

- ARIA attributes: aria-expanded, aria-label
- Keyboard: Tab to navigate, Enter/Space to toggle
- Focus indicators: var(--focus-shadow-strong)
- Screen reader: Announce "Expand/Collapse section: [title]"

---

## 4. CSS Custom Properties Reference

```css
/* Spacing */
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 0.75rem; /* 12px */
--spacing-lg: 1rem; /* 16px */

/* Colors */
--color-surface: hsl(240, 10%, 10%);
--color-surface-hover: hsl(240, 10%, 15%);
--color-text-main: hsl(0, 0%, 100%);
--color-text-muted: hsl(220, 10%, 75%);
--color-border: hsl(240, 5%, 30%);
--color-primary: hsl(250, 84%, 60%);

/* Typography */
--font-body: Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-size-sm: 0.875rem; /* 14px */
--font-size-base: 1rem; /* 16px */

/* Effects */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--focus-shadow-strong: 0 0 0 4px hsl(250, 84%, 60%, 0.3);
--touch-target-min: 44px;
```

---

## 5. Implementation Notes

### File Structure

- `src/utils/copy-strings.js` - Centralized micro-copy strings
- `src/components/ExpandableSection.js` - Reusable expandable component
- `src/styles/components/expandable-section.css` - Component styles (optional)

### Browser Support

- Modern browsers with ES6+ support
- Progressive enhancement for older browsers

### Testing Checklist

- [ ] Accessibility testing with screen readers (NVDA, VoiceOver)
- [ ] Keyboard navigation testing
- [ ] Mobile responsiveness testing
- [ ] Animation smoothness testing
- [ ] Touch target size verification
- [ ] Color contrast ratio verification (WCAG 2.1 AA)

---

_Document created as part of PRD Implementation Phase 1_
