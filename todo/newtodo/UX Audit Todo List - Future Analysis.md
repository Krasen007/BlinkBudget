# UX Audit Todo List - Future Analysis

**Date:** February 16, 2026  
**Status:** Most critical items implemented. Remaining tasks are optional enhancements.

---

## 🎯 Action Items

### 🔄 Medium Priority - Form Consistency

- [ ] **Audit form label associations** across remaining components
  - Check for missing `for` attributes on labels
  - Verify `id` attributes on form inputs
  - Priority: Medium (accessibility improvement)
  - Effort: Low (quick audit)

### 📈 Low Priority - Visual Consistency (Optional)

- [ ] **Button height standardization** - Consider if users report issues
  - Current: Mixed heights (30px vs 56px) across components
  - Risk: May break existing modal layouts
  - Recommendation: Defer unless user complaints

- [ ] **Layout margin consistency** - Minor visual enhancement
  - Current: Header margins vary (8px vs 12px)
  - Impact: Low perceived alignment improvement
  - Recommendation: Nice-to-have, not critical

- [ ] **Sticky header addition** - Add to AddView for consistency
  - Current: Inconsistent application across views
  - Impact: Minor UX enhancement
  - Recommendation: Future polish item

---

## ✅ Completed Items

- [x] `.settings-section` CSS class - Implemented in `src/styles/components/ui.css`
- [x] ARIA labels on TransactionList - Added `role="region"` and `aria-label`
- [x] Skip-to-content link - Added to `index.html`
- [x] Duplicate CSS padding - Resolved or never existed

---

## 📋 Implementation Notes

### Form Label Audit Strategy
```javascript
// Look for patterns like these in remaining components:
<label for="input-id">Label Text</label>
<input id="input-id" type="text" />
```

### Visual Changes - Test Thoroughly
If implementing visual consistency changes:
- Test on mobile and desktop
- Verify modal layouts still work
- Check touch target sizes remain ≥44px
- Validate with existing user workflows

---

## 🎯 Success Criteria

- [ ] Forms have proper label associations where missing
- [ ] Visual consistency maintained if changes implemented
- [ ] No regressions in existing functionality
- [ ] User experience remains fast and intuitive (3-click rule)
