import { ButtonComponent } from './Button.js';
import { CustomCategoryService } from '../core/custom-category-service.js';
import { AccountService } from '../core/Account/account-service.js';
import { TransactionService } from '../core/transaction-service.js';
import { SPACING, COLORS, FONT_SIZES } from '../utils/constants.js';

export const BulkEditDialog = ({ selectedIds, onClose }) => {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  const card = document.createElement('div');
  card.className = 'dialog-card';
  card.style.maxWidth = '520px';
  card.style.width = '92%';

  const title = document.createElement('h3');
  title.textContent = `Edit ${selectedIds.size} Selected Transaction${selectedIds.size > 1 ? 's' : ''}`;
  title.style.marginBottom = SPACING.MD;
  title.style.textAlign = 'center';
  title.style.color = COLORS.TEXT_MAIN;
  card.appendChild(title);

  const form = document.createElement('div');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = SPACING.MD;

  const mkLabel = (text) => {
    const l = document.createElement('label');
    l.textContent = text;
    l.style.fontWeight = '500';
    l.style.fontSize = FONT_SIZES.SM;
    l.style.color = COLORS.TEXT_MUTED;
    return l;
  };

  const mkSelect = (placeholder) => {
    const s = document.createElement('select');
    s.className = 'mobile-form-select';
    s.style.width = '100%';
    s.style.padding = `${SPACING.SM} ${SPACING.MD}`;
    s.style.fontSize = FONT_SIZES.BASE;
    s.style.borderRadius = 'var(--radius-md)';
    s.style.border = `1px solid ${COLORS.BORDER}`;
    s.style.background = COLORS.SURFACE;
    s.style.color = COLORS.TEXT_MAIN;
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    s.appendChild(opt);
    return s;
  };

  form.appendChild(mkLabel('Wallet (Account)'));
  const accountSelect = mkSelect('Keep current wallet...');
  AccountService.getAccounts().forEach(a => {
    const o = document.createElement('option');
    o.value = a.id;
    o.textContent = a.name;
    accountSelect.appendChild(o);
  });
  form.appendChild(accountSelect);

  form.appendChild(mkLabel('Category'));
  const categorySelect = mkSelect('Keep current category...');
  CustomCategoryService.getByType('all').forEach(c => {
    const o = document.createElement('option');
    o.value = c.name;
    o.textContent = c.name;
    categorySelect.appendChild(o);
  });
  form.appendChild(categorySelect);

  form.appendChild(mkLabel('Tags (Labels)'));
  const tagSelect = mkSelect('Keep current tags...');
  CustomCategoryService.getCheckboxCategories().forEach(c => {
    const o = document.createElement('option');
    o.value = c.name;
    o.textContent = c.name;
    tagSelect.appendChild(o);
  });
  form.appendChild(tagSelect);

  card.appendChild(form);

  const btnGroup = document.createElement('div');
  btnGroup.style.display = 'flex';
  btnGroup.style.gap = SPACING.SM;
  btnGroup.style.justifyContent = 'flex-end';
  btnGroup.style.marginTop = SPACING.MD;

  const cancelBtn = ButtonComponent({
    text: 'Cancel',
    variant: 'secondary',
    onClick: () => {
      document.body.removeChild(overlay);
      if (typeof onClose === 'function') onClose();
    },
  });
  cancelBtn.style.flex = '1';
  btnGroup.appendChild(cancelBtn);

  const applyBtn = ButtonComponent({
    text: 'Apply Changes',
    variant: 'primary',
    onClick: () => {
      const newAccount = accountSelect.value || null;
      const newCategory = categorySelect.value || null;
      const newTag = tagSelect.value || null;

      selectedIds.forEach(id => {
        const tx = TransactionService.get(id);
        if (!tx) return;
        const updates = {};
        if (newAccount && tx.accountId !== newAccount) updates.accountId = newAccount;
        if (newCategory && tx.category !== newCategory) updates.category = newCategory;
        if (newTag !== null) updates.tags = newTag ? [newTag] : [];
        if (Object.keys(updates).length > 0) TransactionService.update(id, updates);
      });

      document.body.removeChild(overlay);
      if (typeof onClose === 'function') onClose();
    },
  });
  applyBtn.style.flex = '1';
  btnGroup.appendChild(applyBtn);

  card.appendChild(btnGroup);
  overlay.appendChild(card);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
      if (typeof onClose === 'function') onClose();
    }
  });

  document.body.appendChild(overlay);
  return overlay;
};
