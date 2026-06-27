import { ButtonComponent } from './Button.js';
import { CustomCategoryService } from '../core/custom-category-service.js';
import { AccountService } from '../core/Account/account-service.js';
import { TransactionService } from '../core/transaction-service.js';
import { SPACING, COLORS } from '../utils/constants.js';

export const BulkEditDialog = ({ selectedIds, onClose }) => {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  const card = document.createElement('div');
  card.className = 'dialog-card';
  card.style.maxWidth = 'var(--modal-max-width)';
  card.style.width = '90%';

  const title = document.createElement('h3');
  title.textContent = `Edit ${selectedIds.size} Selected Transaction${selectedIds.size > 1 ? 's' : ''}`;
  title.style.marginBottom = SPACING.MD;
  title.style.textAlign = 'center';
  title.style.color = COLORS.TEXT_MAIN;
  title.style.fontFamily = 'var(--font-heading)';
  title.style.fontSize = 'var(--font-size-lg)';
  title.style.lineHeight = 'var(--line-height-tight)';
  title.id = 'bulk-edit-dialog-title';
  card.appendChild(title);

  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'bulk-edit-dialog-title');

  const form = document.createElement('div');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = SPACING.MD;

  const mkLabel = (text, htmlFor) => {
    const l = document.createElement('label');
    l.textContent = text;
    l.htmlFor = htmlFor;
    l.style.fontWeight = '500';
    l.style.fontSize = 'var(--font-size-sm)';
    l.style.color = COLORS.TEXT_MUTED;
    l.style.display = 'block';
    l.style.marginBottom = `${SPACING.XS}`;
    return l;
  };

  const mkSelect = (placeholder, id) => {
    const s = document.createElement('select');
    s.className = 'mobile-form-select';
    s.id = id;
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    s.appendChild(opt);
    return s;
  };

  form.appendChild(mkLabel('Wallet (Account)', 'bulk-account'));
  const accountSelect = mkSelect('Keep current wallet...', 'bulk-account');
  AccountService.getAccounts().forEach(a => {
    const o = document.createElement('option');
    o.value = a.id;
    o.textContent = a.name;
    accountSelect.appendChild(o);
  });
  form.appendChild(accountSelect);

  form.appendChild(mkLabel('Category', 'bulk-category'));
  const categorySelect = mkSelect('Keep current category...', 'bulk-category');
  CustomCategoryService.getByType('all').forEach(c => {
    const o = document.createElement('option');
    o.value = c.name;
    o.textContent = c.name;
    categorySelect.appendChild(o);
  });
  form.appendChild(categorySelect);

  form.appendChild(mkLabel('Tags (Labels)', 'bulk-tag'));
  const tagSelect = mkSelect('Keep current tags...', 'bulk-tag');
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
        if (newAccount && tx.accountId !== newAccount)
          updates.accountId = newAccount;
        if (newCategory && tx.category !== newCategory)
          updates.category = newCategory;
        if (newTag !== null) updates.tags = newTag ? [newTag] : [];
        if (Object.keys(updates).length > 0)
          TransactionService.update(id, updates);
      });

      document.body.removeChild(overlay);
      if (typeof onClose === 'function') onClose();
    },
  });
  applyBtn.style.flex = '1';
  btnGroup.appendChild(applyBtn);

  card.appendChild(btnGroup);
  overlay.appendChild(card);

  const close = () => {
    document.body.removeChild(overlay);
    if (typeof onClose === 'function') onClose();
  };

  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  const onKey = e => {
    if (e.key === 'Escape') {
      document.body.removeEventListener('keydown', onKey);
      close();
    }
  };
  document.body.addEventListener('keydown', onKey);

  document.body.appendChild(overlay);
  return overlay;
};
