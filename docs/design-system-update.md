# 🎨 BlinkBudget Design System Spec (v1.1)

## 1. Principles

- **Efficiency:** 3-Click promise is paramount.
- **Visual Depth:** Use HSL-based colors, subtle borders, and glassmorphism.
- **Mobile First:** All interactive elements must meet the 44px min-touch target.

---

## 2. Core Tokens

Standardized in `src/styles/tokens.css`.

| Token             | Value                | usage                         |
| ----------------- | -------------------- | ----------------------------- |
| `--color-primary` | `hsl(250, 84%, 60%)` | Main Actions, Brand           |
| `--color-surface` | `hsl(240, 10%, 10%)` | Cards, Header backgrounds     |
| `--spacing-md`    | `0.75rem (12px)`     | Standard gap between elements |
| `--radius-lg`     | `0.75rem (12px)`     | Card and Button corners       |

---

## 3. UI Components

### 3.1. The View Header

Every view MUST use a consistent header structure.

- **Class:** `.view-header.view-sticky`
- **Structure:**
  ```html
  <div class="view-header view-sticky">
    <div class="view-top-row">
      <div class="view-header-left">
        <!-- Back Button + H2 Title -->
      </div>
      <div class="view-header-right">
        <!-- Contextual Controls + Global Nav -->
      </div>
    </div>
  </div>
  ```

### 3.2. Primary Actions

- **Class:** `.btn.btn-primary`
- **Behavior:** Scale down to `0.96` on touch/click.
- **Consistency:** Use the `Button` component from `src/components/Button.js`.

---

## 4. Implementation Guidelines

1. **No Inline Spacing:** Avoid `element.style.marginBottom = SPACING.MD`. Use `.view-header` or `.view-section` classes.
2. **Standardized Back Buttons:** Use `←` icon consistently.
3. **Accessibility:**
   - Interactive lists must have `role="list"`.
   - Chips must have `aria-pressed` or `aria-selected` logic.

---

_Created by Antigravity (UX/UI Design Assistant)_
