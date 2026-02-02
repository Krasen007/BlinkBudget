# Category Icons Design - Smart Suggestions

**Date:** February 2, 2026  
**Designer:** UX/UI Designer  
**Deliverable:** Icon System for Smart Suggestions  
**Phase:** 2 Week 4 - Category Icons

---

## Icon Design Principles

### Visual Guidelines

1. **Clarity First:** Icons instantly recognizable at small sizes
2. **Consistent Style:** Unified stroke weight and visual language
3. **Accessibility:** High contrast, distinguishable shapes
4. **Cultural Neutrality:** Universally understood symbols
5. **Scalability:** Clear at 16px to 64px sizes

### Technical Specifications

- **Format:** SVG (vector) for scalability
- **Stroke Weight:** 2px (consistent across all icons)
- **ViewBox:** 24x24 for standardization
- **Colors:** CSS custom properties for theming
- **Size Variants:** 16px, 24px, 32px, 48px

---

## Primary Category Icons

### Food & Drink Categories

#### ☕ Coffee Shop

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M18 6h-1a4 4 0 0 0-4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a4 4 0 0 0-4-4H2"/>
  <path d="M6 6h12"/>
  <path d="M18 10h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2"/>
  <path d="M8 14h.01"/>
  <path d="M8 18h.01"/>
</svg>
```

**Usage:** Coffee shops, cafes, breakfast spots
**Color:** `#F97316` (Orange)

#### 🍽️ Restaurant

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
  <path d="M7 2v20"/>
  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
</svg>
```

**Usage:** Restaurants, dining, food delivery
**Color:** `#F97316` (Orange)

#### 🛒 Groceries

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="8" cy="21" r="1"/>
  <circle cx="19" cy="21" r="1"/>
  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.58l1.03-4.87"/>
  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z"/>
</svg>
```

**Usage:** Supermarkets, grocery stores, household items
**Color:** `#22C55E` (Green)

### Transportation Categories

#### 🚗 Car

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M19 9h-4.79a1 1 0 0 0-.72.31l-3.1 3.1a1 1 0 0 1-.72.31H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z"/>
  <circle cx="7" cy="18" r="2"/>
  <circle cx="17" cy="18" r="2"/>
  <path d="M5 11V9a2 2 0 0 1 2-2h1"/>
</svg>
```

**Usage:** Car maintenance, repairs, insurance
**Color:** `#EF4444` (Red)

#### ⛽ Gas Station

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M5 12V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4"/>
  <path d="M5 12v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8"/>
  <path d="M9 8v2"/>
  <path d="M19 2v10l-2 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-8"/>
  <path d="M19 8h3"/>
</svg>
```

**Usage:** Fuel, gas stations
**Color:** `#EF4444` (Red)

#### 🚌 Public Transport

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M8 6v6"/>
  <path d="M7 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>
  <path d="M5 11h14"/>
  <circle cx="9" cy="15" r="1"/>
  <circle cx="15" cy="15" r="1"/>
</svg>
```

**Usage:** Bus, train, subway, taxi
**Color:** `#3B82F6` (Blue)

### Home & Bills Categories

#### 🏠 Home

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  <polyline points="9,22 9,12 15,12 15,22"/>
</svg>
```

**Usage:** Rent, mortgage, home repairs
**Color:** `#8B5CF6` (Purple)

#### 💡 Utilities

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M15 3v4a3 3 0 0 0 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V10a3 3 0 0 0 3-3V3"/>
  <path d="M9 3v4a3 3 0 0 0 3 3"/>
  <path d="M9 12v6"/>
  <path d="M12 12v6"/>
  <path d="M15 12v6"/>
</svg>
```

**Usage:** Electricity, water, internet, gas bills
**Color:** `#F59E0B` (Amber)

### Personal & Entertainment Categories

#### 🎬 Entertainment

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
  <line x1="7" y1="2" x2="7" y2="22"/>
  <line x1="17" y1="2" x2="17" y2="22"/>
  <line x1="2" y1="12" x2="22" y2="12"/>
  <line x1="2" y1="7" x2="7" y2="7"/>
  <line x1="2" y1="17" x2="7" y2="17"/>
  <line x1="17" y1="17" x2="22" y2="17"/>
  <line x1="17" y1="7" x2="22" y2="7"/>
</svg>
```

**Usage:** Movies, concerts, hobbies, subscriptions
**Color:** `#A855F7` (Purple)

#### 🎮 Gaming

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
  <line x1="12" y1="8" x2="12" y2="12"/>
  <line x1="12" y1="16" x2="12.01" y2="16"/>
  <line x1="8" y1="12" x2="8.01" y2="12"/>
  <line x1="16" y1="12" x2="16.01" y2="12"/>
</svg>
```

**Usage:** Video games, gaming subscriptions
**Color:** `#A855F7` (Purple)

### Health & Wellness Categories

#### ⚕️ Medical

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
  <path d="M12 8v8"/>
  <path d="M8 12h8"/>
</svg>
```

**Usage:** Doctor visits, medical procedures
**Color:** `#EF4444` (Red)

#### 💊 Pharmacy

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5Z"/>
  <path d="M12 5L8 21l4-7 4 7-4-16Z"/>
</svg>
```

**Usage:** Pharmacy, medicines, prescriptions
**Color:** `#EF4444` (Red)

### Financial Categories

#### 💰 Salary/Income

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="12" y1="1" x2="12" y2="23"/>
  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
</svg>
```

**Usage:** Salary, wages, primary income
**Color:** `#22C55E` (Green)

#### 🎁 Gifts

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="3" y="8" width="18" height="4" rx="1"/>
  <path d="M12 8v13"/>
  <path d="M8 21h8"/>
  <path d="M12 8V2h0a2 2 0 0 1 2 2v4"/>
</svg>
```

**Usage:** Gifts for others, presents
**Color:** `#A855F7` (Purple)

#### 🏦 Bank/Finance

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M3 21h18"/>
  <path d="M5 21V7l8-4v18"/>
  <path d="M19 21V11l-6-4"/>
  <circle cx="9" cy="9" r="2"/>
  <path d="M9 13v6"/>
</svg>
```

**Usage:** Bank fees, financial services, investments
**Color:** `#3B82F6` (Blue)

### Miscellaneous Categories

#### 📱 Technology

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
  <line x1="12" y1="18" x2="12.01" y2="18"/>
</svg>
```

**Usage:** Phone bills, software, tech purchases
**Color:** `#3B82F6` (Blue)

#### 📚 Education

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
</svg>
```

**Usage:** Books, courses, tuition, learning
**Color:** `#3B82F6` (Blue)

#### 📱 Other/Miscellaneous

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="1"/>
  <circle cx="12" cy="5" r="1"/>
  <circle cx="12" cy="19" r="1"/>
</svg>
```

**Usage:** Miscellaneous expenses, uncategorized
**Color:** `#6B7280` (Gray)

---

## Icon Implementation Guide

### CSS Integration

#### Icon Base Styles

```css
.category-icon {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all var(--transition-fast);
}

.category-icon-small {
  width: 16px;
  height: 16px;
}

.category-icon-large {
  width: 32px;
  height: 32px;
}

.category-icon-xl {
  width: 48px;
  height: 48px;
}

/* Category-specific colors */
.category-icon.food-drink {
  color: #f97316;
}

.category-icon.transport {
  color: #ef4444;
}

.category-icon.home {
  color: #8b5cf6;
}

.category-icon.entertainment {
  color: #a855f7;
}

.category-icon.medical {
  color: #ef4444;
}

.category-icon.income {
  color: #22c55e;
}

.category-icon.finance {
  color: #3b82f6;
}

.category-icon.miscellaneous {
  color: #6b7280;
}
```

#### Icon Component System

```javascript
// Icon utility for consistent rendering
export const CategoryIcon = ({ category, size = 'medium', className = '' }) => {
  const iconMap = {
    Храна: 'coffee-shop',
    Заведения: 'restaurant',
    Гориво: 'gas-station',
    Автомобил: 'car',
    Сметки: 'utilities',
    Забавления: 'entertainment',
    Лекар: 'medical',
    Заплата: 'salary',
    Подаръци: 'gifts',
    Други: 'miscellaneous',
  };

  const iconClass = iconMap[category] || 'miscellaneous';
  const sizeClass =
    size === 'small'
      ? 'category-icon-small'
      : size === 'large'
        ? 'category-icon-large'
        : size === 'xl'
          ? 'category-icon-xl'
          : '';

  return `
    <svg class="category-icon ${sizeClass} category-icon-${iconClass} ${className}" 
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${getIconPath(iconClass)}
    </svg>
  `;
};
```

### Icon Path Library

```javascript
const iconPaths = {
  'coffee-shop':
    '<path d="M18 6h-1a4 4 0 0 0-4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a4 4 0 0 0-4-4H2"/><path d="M6 6h12"/><path d="M18 10h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2"/><path d="M8 14h.01"/><path d="M8 18h.01"/>',
  restaurant:
    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  'gas-station':
    '<path d="M5 12V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4"/><path d="M5 12v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8"/><path d="M9 8v2"/><path d="M19 2v10l-2 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-8"/><path d="M19 8h3"/>',
  car: '<path d="M19 9h-4.79a1 1 0 0 0-.72.31l-3.1 3.1a1 1 0 0 1-.72.31H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M5 11V9a2 2 0 0 1 2-2h1"/>',
  utilities:
    '<path d="M15 3v4a3 3 0 0 0 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V10a3 3 0 0 0 3-3V3"/><path d="M9 3v4a3 3 0 0 0 3 3"/><path d="M9 12v6"/><path d="M12 12v6"/><path d="M15 12v6"/>',
  entertainment:
    '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
  medical:
    '<path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  salary:
    '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  gifts:
    '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M8 21h8"/><path d="M12 8V2h0a2 2 0 0 1 2 2v4"/>',
  miscellaneous:
    '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
};
```

### Responsive Icon Behavior

#### Mobile Optimization

```css
@media (width <= 480px) {
  .category-icon {
    width: 20px;
    height: 20px;
  }

  .category-card .category-icon {
    width: 18px;
    height: 18px;
  }

  .suggestion-chip .category-icon {
    width: 16px;
    height: 16px;
  }
}

@media (width <= 380px) {
  .category-icon {
    width: 16px;
    height: 16px;
  }
}
```

#### Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
  .category-icon {
    stroke: var(--color-text-main);
  }

  .category-icon.selected {
    stroke: white;
  }
}
```

---

## Icon Usage Guidelines

### Size Recommendations

#### Category Cards (Primary)

- **Large:** 32px (featured categories)
- **Medium:** 24px (standard category grid)
- **Small:** 20px (compact views)

#### Suggestion Chips

- **Standard:** 16px (inline with text)
- **Large:** 20px (standalone chips)

#### Navigation Elements

- **Tabs:** 20px
- **Menu Items:** 18px
- **Buttons:** 16-20px (depending on button size)

### Color Usage

#### Primary Colors

- **Food & Drink:** Orange (#F97316)
- **Transportation:** Red (#EF4444)
- **Home & Utilities:** Purple (#8B5CF6)
- **Entertainment:** Purple (#A855F7)
- **Medical:** Red (#EF4444)
- **Income:** Green (#22C55E)
- **Finance:** Blue (#3B82F6)
- **Miscellaneous:** Gray (#6B7280)

#### State Colors

- **Default:** `var(--color-text-muted)`
- **Hover:** `var(--color-text-main)`
- **Selected:** `var(--color-primary)` or white (depending on background)
- **Disabled:** `var(--color-text-muted)` with 50% opacity

### Animation Guidelines

#### Hover Effects

```css
.category-icon {
  transition: transform var(--transition-fast);
}

.category-card:hover .category-icon {
  transform: scale(1.1);
}

.suggestion-chip:hover .category-icon {
  transform: translateY(-1px);
}
```

#### Selection Feedback

```css
.category-card.selected .category-icon {
  animation: iconPulse 0.3s ease-out;
}

@keyframes iconPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
```

---

## Accessibility Considerations

### Screen Reader Support

```html
<!-- Icon with semantic meaning -->
<div class="category-card" role="option" aria-selected="false">
  <svg class="category-icon" aria-hidden="true">
    <!-- icon paths -->
  </svg>
  <span class="category-name">Food & Drink</span>
</div>

<!-- Icon as standalone button -->
<button class="icon-button" aria-label="Food & Drink category">
  <svg class="category-icon">
    <!-- icon paths -->
  </svg>
</button>
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  .category-icon {
    stroke-width: 3;
  }

  .category-icon.selected {
    stroke: black;
    fill: white;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .category-icon {
    transition: none;
  }

  .category-card:hover .category-icon {
    transform: none;
  }
}
```

---

## Performance Optimization

### SVG Sprites

```html
<!-- Icon sprite for better performance -->
<svg style="display: none;">
  <defs>
    <symbol id="icon-coffee-shop" viewBox="0 0 24 24">
      <path
        d="M18 6h-1a4 4 0 0 0-4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a4 4 0 0 0-4-4H2"
      />
      <!-- rest of paths -->
    </symbol>
    <!-- other symbols -->
  </defs>
</svg>

<!-- Usage -->
<svg class="category-icon">
  <use href="#icon-coffee-shop" />
</svg>
```

### Lazy Loading

```javascript
// Load icons only when needed
const loadIcon = async iconName => {
  if (!iconCache[iconName]) {
    const iconModule = await import(`./icons/${iconName}.svg`);
    iconCache[iconName] = iconModule.default;
  }
  return iconCache[iconName];
};
```

---

This comprehensive icon system provides clear, consistent, and accessible category icons that enhance the Smart Suggestions UI while maintaining the BlinkBudget design standards. The icons are optimized for performance and work seamlessly across all device sizes and accessibility needs.
