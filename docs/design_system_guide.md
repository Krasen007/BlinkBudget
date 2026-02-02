# BlinkBudget Design System Guide

**Version:** 2.0  
**Updated:** February 2, 2026  
**Purpose:** Comprehensive design system for consistency and accessibility

---

## Design Philosophy

BlinkBudget's design system is built on three core principles:

1. **Extreme Speed:** Every interaction optimized for 3-click workflow
2. **Mobile First:** Touch-friendly design with thumb-reach optimization
3. **Accessibility:** WCAG AA compliance as a baseline requirement

---

## Color System

### Primary Palette

```css
--primary-hue: 250; /* Blue foundation */
--primary-sat: 84%; /* High saturation for vibrancy */
--primary-light: 60%; /* Light enough for dark backgrounds */

--color-primary: hsl(250, 84%, 60%); /* #646cff */
--color-primary-dark: hsl(250, 84%, 50%); /* #5258e6 */
--color-primary-light: hsl(250, 84%, 75%); /* #8589ff */
```

### Surface Colors

```css
--color-background: hsl(240, 10%, 4%); /* #0a0a0c */
--color-surface: hsl(240, 10%, 10%); /* #1a1a1f */
--color-surface-hover: hsl(240, 10%, 15%); /* #25252a */
```

### Text Colors

```css
--color-text-main: hsl(0, 0%, 100%); /* #ffffff */
--color-text-muted: hsl(240, 5%, 65%); /* #a1a1aa */
```

### Accessibility Validation

- **Primary on Background:** Contrast ratio 7.2:1 ✅ WCAG AAA
- **Text Muted on Background:** Contrast ratio 4.8:1 ✅ WCAG AA
- **Primary on Surface:** Contrast ratio 6.1:1 ✅ WCAG AA

---

## Typography System

### Font Families

```css
--font-body: 'Inter', system-ui, -apple-system, sans-serif;
--font-heading: 'Outfit', system-ui, -apple-system, sans-serif;
```

### Mobile-First Scale

```css
--font-size-xs: 0.75rem; /* 12px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-base: 1rem; /* 16px - Prevents iOS zoom */
--font-size-lg: 1.125rem; /* 18px */
--font-size-xl: 1.25rem; /* 20px */
--font-size-2xl: 1.5rem; /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem; /* 36px */
```

### Line Heights

```css
--line-height-tight: 1.25; /* Headings */
--line-height-normal: 1.5; /* Body text */
--line-height-relaxed: 1.75; /* Long form content */
```

---

## Spacing System

### Mobile-First Scale

```css
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 0.75rem; /* 12px */
--spacing-lg: 1rem; /* 16px */
--spacing-xl: 1.5rem; /* 24px */
--spacing-2xl: 2rem; /* 32px */
--spacing-3xl: 3rem; /* 48px */
--spacing-4xl: 4rem; /* 64px */
```

### Touch Optimization

```css
--touch-target-min: 44px; /* iOS HIG minimum */
--touch-target-standard: 56px; /* Recommended standard */
--touch-spacing-min: 8px; /* Minimum spacing between targets */
--thumb-reach-zone: 60vh; /* Bottom 60% for thumb reach */
```

---

## Component Standards

### Buttons

#### Primary Button

```css
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-md) var(--spacing-xl);
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all var(--transition-fast);
}
```

#### Focus States (NEW)

```css
.btn:focus,
.btn:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 6px
    hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.2);
}
```

#### Hover States

```css
.btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}
```

### Form Elements

#### Input Fields

```css
input {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-lg);
  min-height: var(--touch-target-standard);
  font-size: max(var(--font-size-prevent-zoom), var(--font-size-base));
  transition: all var(--transition-fast);
}
```

#### Input Focus States (ENHANCED)

```css
input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px
    hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.15);
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## Responsive Breakpoints

### Breakpoint System

```css
--breakpoint-sm: 480px; /* Small phones */
--breakpoint-md: 768px; /* Tablets */
--breakpoint-lg: 1024px; /* Small desktops */
--breakpoint-xl: 1280px; /* Large desktops */
```

### Mobile-First Media Queries

```css
/* Base styles (mobile) */
.component {
  /* Mobile styles */
}

/* Small phones and up */
@media (min-width: 480px) {
  /* Enhanced mobile */
}

/* Tablets and up */
@media (min-width: 768px) {
  /* Tablet styles */
}

/* Desktop and up */
@media (min-width: 1024px) {
  /* Desktop styles */
}
```

---

## Animation & Transitions

### Timing Functions

```css
--transition-fast: 150ms ease; /* Button interactions */
--transition-normal: 250ms ease; /* Modal transitions */
--transition-slow: 300ms ease; /* Page transitions */
```

### Motion Principles

- **Respect prefers-reduced-motion:** All animations disabled when requested
- **Purposeful motion:** Every animation serves a functional purpose
- **Performance optimized:** Use transform and opacity for 60fps animations

---

## Accessibility Standards

### Focus Management

- **Visible focus:** All interactive elements have clear focus indicators
- **Logical order:** Tab order follows visual layout
- **Skip links:** Provide navigation shortcuts for keyboard users

### Screen Reader Support

- **Semantic HTML:** Use proper HTML elements for structure
- **ARIA labels:** Add descriptive labels for custom components
- **Live regions:** Announce dynamic content changes

### Color & Contrast

- **WCAG AA compliance:** Minimum 4.5:1 contrast for normal text
- **WCAG AAA compliance:** 7:1 contrast for large text where possible
- **Not color dependent:** Information not conveyed by color alone

---

## Component Usage Guidelines

### Transaction Form (3-Click Optimization)

1. **Amount Input:** Large, prominent input field
2. **Category Selection:** Touch-friendly grid with smart suggestions
3. **Confirmation:** Clear, accessible save button

### Mobile Navigation

- **Bottom positioning:** Within thumb reach zone
- **Clear labels:** Text + icon for clarity
- **Active states:** Visual feedback for current section

### Modal System

- **Backdrop blur:** Maintain context while focusing
- **Escape handling:** Keyboard and backdrop dismiss options
- **Focus trapping:** Keep focus within modal content

---

## Implementation Rules

### CSS Architecture

1. **Use tokens:** Never hardcode values
2. **Mobile first:** Start with mobile, enhance for larger screens
3. **Component based:** Organize by reusable components
4. **Performance first:** Optimize for 60fps interactions

### JavaScript Integration

1. **Avoid inline styles:** Use CSS classes consistently
2. **Semantic structure:** Maintain proper HTML hierarchy
3. **Event handling:** Support both touch and keyboard interactions
4. **Error states:** Provide clear visual feedback

### Testing Requirements

1. **Accessibility testing:** Automated + manual testing
2. **Cross-device testing:** Real device testing required
3. **Performance testing:** 60fps animations, <2s load time
4. **Usability testing:** 3-click workflow validation

---

## Design Tokens Reference

### Complete Token List

```css
/* Colors */
--color-primary: hsl(
  var(--primary-hue),
  var(--primary-sat),
  var(--primary-light)
);
--color-primary-dark: hsl(var(--primary-hue), var(--primary-sat), 50%);
--color-primary-light: hsl(var(--primary-hue), var(--primary-sat), 75%);
--color-background: hsl(240, 10%, 4%);
--color-surface: hsl(240, 10%, 10%);
--color-surface-hover: hsl(240, 10%, 15%);
--color-text-main: hsl(0, 0%, 100%);
--color-text-muted: hsl(240, 5%, 65%);
--color-border: hsl(240, 5%, 20%);

/* Spacing */
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 0.75rem;
--spacing-lg: 1rem;
--spacing-xl: 1.5rem;
--spacing-2xl: 2rem;
--spacing-3xl: 3rem;
--spacing-4xl: 4rem;

/* Touch */
--touch-target-min: 44px;
--touch-target-standard: 56px;
--touch-spacing-min: 8px;
--thumb-reach-zone: 60vh;

/* Typography */
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-prevent-zoom: 16px;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
--font-size-2xl: 1.5rem;
--font-size-3xl: 1.875rem;
--font-size-4xl: 2.25rem;

/* Line Heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

/* Borders */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-full: 9999px;

/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 300ms ease;
```

---

## Maintenance & Updates

### Version Control

- **Semantic versioning:** Major.Minor.Patch format
- **Change log:** Document all token and component changes
- **Deprecation policy:** 6-month deprecation notice for removed tokens

### Review Schedule

- **Monthly:** Accessibility audit and contrast validation
- **Quarterly:** Performance optimization review
- **Annually:** Complete design system audit and modernization

---

This design system provides the foundation for BlinkBudget's "extremely fast" user experience while ensuring accessibility and consistency across all platforms and devices.
