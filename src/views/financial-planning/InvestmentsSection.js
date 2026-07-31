/**
 * Investments Section - Portfolio Tracking
 *
 * Simple holdings list: symbol, shares, purchase price, current value, gain/loss.
 * No charts. No allocation analysis. No type-specific fields.
 */

import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants.js';
import {
  createUsageNote,
  createSectionContainer,
  createPlaceholder,
} from '../../utils/financial-planning-helpers.js';
import {
  createEnhancedEmptyState,
  getProgressiveUnlockMessage,
} from '../../utils/enhanced-empty-states.js';

/**
 * Create investment form controls
 */
function createInvestmentFormControls() {
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = SPACING.SM;
  controls.style.alignItems = 'center';
  controls.style.flexWrap = 'wrap';
  controls.style.marginTop = SPACING.MD;

  const addInvBtn = document.createElement('button');
  addInvBtn.textContent = 'Add Investment';
  addInvBtn.className = 'btn btn-primary add-investment-btn';

  const invForm = document.createElement('div');
  invForm.className = 'investment-form';
  invForm.style.display = 'none';
  invForm.style.gap = SPACING.SM;
  invForm.style.marginTop = SPACING.SM;
  invForm.style.flexWrap = 'wrap';

  // Simple fields: symbol, shares, purchase price, current price, date, notes
  const fields = [
    {
      id: 'inv-symbol',
      name: 'symbol',
      type: 'text',
      placeholder: 'Symbol (e.g. AAPL)',
      required: true,
    },
    {
      id: 'inv-shares',
      name: 'shares',
      type: 'number',
      placeholder: 'Shares',
      required: true,
      step: '0.0001',
    },
    {
      id: 'inv-price',
      name: 'purchasePrice',
      type: 'number',
      placeholder: 'Purchase Price',
      required: true,
      step: '0.01',
    },
    {
      id: 'inv-current',
      name: 'currentPrice',
      type: 'number',
      placeholder: 'Current Price (optional)',
      step: '0.01',
    },
    { id: 'inv-date', name: 'purchaseDate', type: 'date', required: true },
  ];

  const inputs = {};
  fields.forEach(f => {
    const input = document.createElement('input');
    input.id = f.id;
    input.name = f.name;
    input.type = f.type;
    input.placeholder = f.placeholder;
    input.step = f.step || '';
    if (f.required) input.required = true;
    input.setAttribute('aria-label', f.placeholder);
    inputs[f.name] = input;
    invForm.appendChild(input);
  });

  const notesInput = document.createElement('textarea');
  notesInput.id = 'inv-notes';
  notesInput.name = 'notes';
  notesInput.placeholder = 'Notes (optional)';
  notesInput.rows = 2;
  notesInput.style.width = '100%';
  notesInput.style.resize = 'vertical';
  notesInput.setAttribute('aria-label', 'Notes');
  invForm.appendChild(notesInput);

  const saveInvBtn = document.createElement('button');
  saveInvBtn.textContent = 'Save Investment';
  saveInvBtn.className = 'btn btn-primary btn-save';
  saveInvBtn.disabled = true;
  
  const cancelInvBtn = document.createElement('button');
  cancelInvBtn.textContent = 'Cancel';
  cancelInvBtn.className = 'btn btn-ghost';
  cancelInvBtn.addEventListener('click', () => {
    invForm.style.display = 'none';
    // Reset form
    Object.values(inputs).forEach(i => (i.value = ''));
    notesInput.value = '';
  });
  
  invForm.appendChild(saveInvBtn);
  invForm.appendChild(cancelInvBtn);

  // Validation
  function validate() {
    const symbol = inputs.symbol.value.trim().toUpperCase();
    const shares = Number(inputs.shares.value) || 0;
    const price = Number(inputs.purchasePrice.value) || 0;
    const current = Number(inputs.currentPrice.value) || 0;
    const date = inputs.purchaseDate.value;
    const valid = symbol && shares > 0 && price > 0 && current >= 0 && date;
    saveInvBtn.disabled = !valid;
    return valid;
  }

  Object.values(inputs).forEach(input => {
    input.addEventListener('input', validate);
    input.addEventListener('change', validate);
  });

  addInvBtn.addEventListener('click', () => {
    invForm.style.display = invForm.style.display === 'none' ? 'flex' : 'none';
  });

  saveInvBtn.addEventListener('click', async () => {
    if (!validate()) return;
    const symbol = inputs.symbol.value.trim().toUpperCase();
    const shares = Number(inputs.shares.value);
    const purchasePrice = Number(inputs.purchasePrice.value);
    const currentPrice = Number(inputs.currentPrice.value) || purchasePrice;
    const purchaseDate = new Date(inputs.purchaseDate.value);
    const notes = notesInput.value.trim();

    try {
      const { StorageService } = await import('../../core/storage.js');
      StorageService.addInvestment(
        symbol,
        shares,
        purchasePrice,
        purchaseDate,
        {
          name: symbol,
          currentPrice,
          notes,
        }
      );

      // Reset form
      Object.values(inputs).forEach(i => (i.value = ''));
      notesInput.value = '';
      invForm.style.display = 'none';
    } catch (err) {
      console.error('Failed to save investment', err);
    }
  });

  controls.appendChild(addInvBtn);
  controls.appendChild(invForm);
  return { controls };
}

/**
 * Create investments list with CRUD operations
 */
function createInvestmentsList() {
  const investmentsList = document.createElement('div');
  investmentsList.className = 'investment-list';
  investmentsList.style.marginTop = SPACING.MD;

  async function refreshInvestmentsList() {
    investmentsList.innerHTML = '';
    let items;
    try {
      const { StorageService } = await import('../../core/storage.js');
      items = StorageService.getInvestments() || [];

      if (!items.length) {
        const empty = createEnhancedEmptyState('no-data', { showTips: false });
        investmentsList.appendChild(empty);
        return;
      }

      const ul = document.createElement('ul');
      ul.style.listStyle = 'none';
      ul.style.padding = '0';
      ul.style.margin = '0';
      ul.style.display = 'grid';
      ul.style.gap = SPACING.SM;

      items.forEach(inv => {
        const li = document.createElement('li');
        li.className = 'investment-item';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.background = COLORS.SURFACE;
        li.style.border = `1px solid ${COLORS.BORDER}`;
        li.style.borderRadius = 'var(--radius-lg)';
        li.style.padding = SPACING.MD;

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.flexDirection = 'column';
        left.style.gap = '4px';

        const title = document.createElement('div');
        title.style.fontWeight = '600';
        title.textContent = inv.symbol;
        left.appendChild(title);

        const name = document.createElement('div');
        name.style.fontSize = '0.85rem';
        name.style.color = COLORS.TEXT_MUTED;
        name.textContent = inv.name || inv.symbol;
        left.appendChild(name);

        const meta = document.createElement('div');
        meta.style.fontSize = '0.9rem';
        const currentPrice = inv.currentPrice || inv.purchasePrice;
        const currency = inv.currency || inv.metadata?.currency || 'EUR';
        const currentValue = inv.shares * currentPrice;
        const purchaseValue = inv.shares * inv.purchasePrice;
        const gainLoss = currentValue - purchaseValue;
        const gainPct =
          purchaseValue > 0
            ? ((gainLoss / purchaseValue) * 100).toFixed(1)
            : '0.0';
        const sign = gainLoss >= 0 ? '+' : '';
        meta.innerHTML = `${inv.shares} shares @ ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(currentPrice)} → <strong>${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(currentValue)}</strong> <span style="color:${gainLoss >= 0 ? COLORS.SUCCESS : COLORS.ERROR}">(${sign}${gainPct}%)</span>`;
        left.appendChild(meta);

        if (inv.notes) {
          const notesEl = document.createElement('div');
          notesEl.textContent = inv.notes;
          notesEl.style.cssText = `font-size:0.85rem;color:${COLORS.TEXT_MUTED};font-style:italic;`;
          left.appendChild(notesEl);
        }

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = SPACING.SM;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn btn-ghost';

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'btn btn-ghost';

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(left);
        li.appendChild(actions);
        ul.appendChild(li);

        // Edit handler
        editBtn.addEventListener('click', () => {
          if (li._editing) return;
          li._editing = true;
          left.style.display = 'none';
          actions.style.display = 'none';

          const form = document.createElement('div');
          form.style.display = 'flex';
          form.style.flexDirection = 'column';
          form.style.gap = SPACING.SM;
          form.style.width = '100%';

          const inputStyle = `width:100%;padding:${SPACING.SM};border:1px solid ${COLORS.BORDER};border-radius:var(--radius-md);font-size:var(--font-size-sm);background:${COLORS.BACKGROUND};color:var(--color-text-main);box-sizing:border-box;`;
          const labelStyle = `font-size:var(--font-size-xs);font-weight:500;color:${COLORS.TEXT_MUTED};margin-bottom:2px;`;

          // Symbol field with label
          const symbolWrapper = document.createElement('div');
          symbolWrapper.style.display = 'flex';
          symbolWrapper.style.flexDirection = 'column';
          symbolWrapper.style.gap = '2px';
          const symbolLabel = document.createElement('label');
          symbolLabel.textContent = 'Symbol';
          symbolLabel.style.cssText = labelStyle;
          symbolLabel.setAttribute('for', 'edit-symbol');
          const symbolFld = document.createElement('input');
          symbolFld.id = 'edit-symbol';
          symbolFld.type = 'text';
          symbolFld.value = inv.symbol;
          symbolFld.placeholder = 'e.g. AAPL';
          symbolFld.style.cssText = inputStyle;
          symbolWrapper.appendChild(symbolLabel);
          symbolWrapper.appendChild(symbolFld);

          // Name field with label
          const nameWrapper = document.createElement('div');
          nameWrapper.style.display = 'flex';
          nameWrapper.style.flexDirection = 'column';
          nameWrapper.style.gap = '2px';
          const nameLabel = document.createElement('label');
          nameLabel.textContent = 'Name';
          nameLabel.style.cssText = labelStyle;
          nameLabel.setAttribute('for', 'edit-name');
          const nameFld = document.createElement('input');
          nameFld.id = 'edit-name';
          nameFld.type = 'text';
          nameFld.value = inv.name || '';
          nameFld.placeholder = 'Optional';
          nameFld.style.cssText = inputStyle;
          nameWrapper.appendChild(nameLabel);
          nameWrapper.appendChild(nameFld);

          // Shares field with label
          const sharesWrapper = document.createElement('div');
          sharesWrapper.style.display = 'flex';
          sharesWrapper.style.flexDirection = 'column';
          sharesWrapper.style.gap = '2px';
          const sharesLabel = document.createElement('label');
          sharesLabel.textContent = 'Shares';
          sharesLabel.style.cssText = labelStyle;
          sharesLabel.setAttribute('for', 'edit-shares');
          const sharesFld = document.createElement('input');
          sharesFld.id = 'edit-shares';
          sharesFld.type = 'number';
          sharesFld.value = inv.shares;
          sharesFld.step = '0.0001';
          sharesFld.placeholder = 'Number of shares';
          sharesFld.style.cssText = inputStyle;
          sharesWrapper.appendChild(sharesLabel);
          sharesWrapper.appendChild(sharesFld);

          // Purchase Price field with label
          const purchasePriceWrapper = document.createElement('div');
          purchasePriceWrapper.style.display = 'flex';
          purchasePriceWrapper.style.flexDirection = 'column';
          purchasePriceWrapper.style.gap = '2px';
          const purchasePriceLabel = document.createElement('label');
          purchasePriceLabel.textContent = 'Purchase Price';
          purchasePriceLabel.style.cssText = labelStyle;
          purchasePriceLabel.setAttribute('for', 'edit-purchase-price');
          const purchasePriceFld = document.createElement('input');
          purchasePriceFld.id = 'edit-purchase-price';
          purchasePriceFld.type = 'number';
          purchasePriceFld.value = inv.purchasePrice;
          purchasePriceFld.step = '0.01';
          purchasePriceFld.placeholder = 'Price per share';
          purchasePriceFld.style.cssText = inputStyle;
          purchasePriceWrapper.appendChild(purchasePriceLabel);
          purchasePriceWrapper.appendChild(purchasePriceFld);

          // Current Price field with label
          const currentPriceWrapper = document.createElement('div');
          currentPriceWrapper.style.display = 'flex';
          currentPriceWrapper.style.flexDirection = 'column';
          currentPriceWrapper.style.gap = '2px';
          const currentPriceLabel = document.createElement('label');
          currentPriceLabel.textContent = 'Current Price';
          currentPriceLabel.style.cssText = labelStyle;
          currentPriceLabel.setAttribute('for', 'edit-current-price');
          const currentPriceFld = document.createElement('input');
          currentPriceFld.id = 'edit-current-price';
          currentPriceFld.type = 'number';
          currentPriceFld.value = inv.currentPrice || inv.purchasePrice;
          currentPriceFld.step = '0.01';
          currentPriceFld.placeholder = 'Optional';
          currentPriceFld.style.cssText = inputStyle;
          currentPriceWrapper.appendChild(currentPriceLabel);
          currentPriceWrapper.appendChild(currentPriceFld);

          // Purchase Date field with label
          const dateWrapper = document.createElement('div');
          dateWrapper.style.display = 'flex';
          dateWrapper.style.flexDirection = 'column';
          dateWrapper.style.gap = '2px';
          const dateLabel = document.createElement('label');
          dateLabel.textContent = 'Purchase Date';
          dateLabel.style.cssText = labelStyle;
          dateLabel.setAttribute('for', 'edit-date');
          const dateFld = document.createElement('input');
          dateFld.id = 'edit-date';
          dateFld.type = 'date';
          dateFld.value = inv.purchaseDate
            ? new Date(inv.purchaseDate).toISOString().split('T')[0]
            : '';
          dateFld.style.cssText = inputStyle;
          dateWrapper.appendChild(dateLabel);
          dateWrapper.appendChild(dateFld);

          // Notes field with label
          const notesWrapper = document.createElement('div');
          notesWrapper.style.display = 'flex';
          notesWrapper.style.flexDirection = 'column';
          notesWrapper.style.gap = '2px';
          const notesLabel = document.createElement('label');
          notesLabel.textContent = 'Notes';
          notesLabel.style.cssText = labelStyle;
          notesLabel.setAttribute('for', 'edit-notes');
          const notesFld = document.createElement('textarea');
          notesFld.id = 'edit-notes';
          notesFld.value = inv.notes || '';
          notesFld.rows = 2;
          notesFld.placeholder = 'Optional notes';
          notesFld.style.cssText = `${inputStyle}resize:vertical;`;
          notesWrapper.appendChild(notesLabel);
          notesWrapper.appendChild(notesFld);

          const btnRow = document.createElement('div');
          btnRow.style.display = 'flex';
          btnRow.style.gap = SPACING.SM;

          const saveBtn = document.createElement('button');
          saveBtn.textContent = 'Save';
          saveBtn.className = 'btn btn-primary';
          saveBtn.style.flex = '1';

          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.className = 'btn btn-ghost';
          cancelBtn.style.flex = '1';

          btnRow.appendChild(saveBtn);
          btnRow.appendChild(cancelBtn);

          form.appendChild(symbolWrapper);
          form.appendChild(nameWrapper);
          form.appendChild(sharesWrapper);
          form.appendChild(purchasePriceWrapper);
          form.appendChild(currentPriceWrapper);
          form.appendChild(dateWrapper);
          form.appendChild(notesWrapper);
          form.appendChild(btnRow);
          li.appendChild(form);

          const cleanupEdit = () => {
            li._editing = false;
            form.remove();
            left.style.display = 'flex';
            actions.style.display = 'flex';
          };

          cancelBtn.addEventListener('click', cleanupEdit);

          saveBtn.addEventListener('click', async () => {
            const newSymbol = symbolFld.value.trim().toUpperCase();
            if (!newSymbol) {
              import('../../components/ConfirmDialog.js')
                .then(({ AlertDialog }) => {
                  AlertDialog({
                    title: 'Invalid input',
                    message: 'Symbol is required.',
                  });
                })
                .catch(err => console.error('Failed to show alert:', err));
              return;
            }
            try {
              const { StorageService } = await import('../../core/storage.js');
              StorageService.updateInvestment(inv.id, {
                symbol: newSymbol,
                name: nameFld.value.trim() || newSymbol,
                shares: Number(sharesFld.value) || 0,
                purchasePrice: Number(purchasePriceFld.value) || 0,
                currentPrice:
                  Number(currentPriceFld.value) ||
                  Number(purchasePriceFld.value) ||
                  0,
                purchaseDate: dateFld.value
                  ? new Date(dateFld.value)
                  : inv.purchaseDate,
                notes: notesFld.value.trim(),
              });
              cleanupEdit();
              refreshInvestmentsList();
            } catch (err) {
              console.error('Failed to update investment', err);
            }
          });
        });

        // Delete handler
        delBtn.addEventListener('click', () => {
          import('../../components/ConfirmDialog.js')
            .then(({ ConfirmDialog }) => {
              ConfirmDialog({
                title: 'Delete Investment',
                message: `Are you sure you want to delete ${inv.symbol}? This action cannot be undone.`,
                confirmText: 'Delete',
                variant: 'danger',
                onConfirm: async () => {
                  try {
                    const { StorageService } =
                      await import('../../core/storage.js');
                    StorageService.removeInvestment(inv.symbol);
                    refreshInvestmentsList();
                  } catch (err) {
                    console.error('Failed to remove investment', err);
                    import('../../components/ConfirmDialog.js')
                      .then(({ AlertDialog }) => {
                        AlertDialog({
                          title: 'Error',
                          message:
                            'Could not remove investment. Please try again.',
                        });
                      })
                      .catch(error =>
                        console.error('Error loading AlertDialog:', error)
                      );
                  }
                },
              });
            })
            .catch(err =>
              console.error('Failed to load confirmation dialog:', err)
            );
        });
      });

      investmentsList.appendChild(ul);
    } catch (err) {
      console.warn('Error loading investments for list:', err);
      const empty = document.createElement('div');
      empty.textContent = 'Error loading investments. Please try again later.';
      empty.style.color = COLORS.ERROR;
      investmentsList.appendChild(empty);
    }
  }

  return { investmentsList, refreshInvestmentsList };
}

/**
 * Investments Section Component
 * @param {Object} _chartRenderer - Chart renderer service instance (unused, kept for API compat)
 * @param {Map} _activeCharts - Map to track active chart instances (unused, kept for API compat)
 * @returns {HTMLElement} DOM element containing investments section content
 */
export const InvestmentsSection = async (_chartRenderer, _activeCharts) => {
  const section = createSectionContainer(
    'investments',
    'Investment Portfolio',
    '💰'
  );
  section.className += ' investments-section';

  section.appendChild(
    createUsageNote(
      'Track manual investments here. Add holdings with symbol, shares, and purchase price. Edits sync to cloud; deletions remove from cloud.'
    )
  );

  // Progressive unlock message — connects advanced features to the core logging habit
  try {
    const { StorageService: SS } = await import('../../core/storage.js');
    const txCount = (SS.getAllTransactions() || []).length;
    const unlockMsg = getProgressiveUnlockMessage(txCount);
    if (unlockMsg) {
      const msg = document.createElement('div');
      msg.textContent = unlockMsg;
      msg.style.cssText = `font-size:${FONT_SIZES.SM};color:${COLORS.TEXT_MUTED};padding:${SPACING.SM} 0;text-align:center;`;
      section.appendChild(msg);
    }
  } catch {
    // Non-critical — silently fail
  }

  // Add investment controls
  const { controls } = createInvestmentFormControls();
  section.appendChild(controls);

  // Add investments list
  const { investmentsList, refreshInvestmentsList } = createInvestmentsList();
  investmentsList.className = 'investment-list';
  section.appendChild(investmentsList);

  // Initial population of the list
  await refreshInvestmentsList();

  // Add total portfolio value and gain/loss
  let totalValue = 0;
  let totalGainLoss = 0;
  try {
    const { StorageService } = await import('../../core/storage.js');
    const summary = StorageService.calculatePortfolioSummary();
    totalValue = summary.totalValue || 0;
    totalGainLoss = summary.gainsLosses?.totalGainLoss || 0;
  } catch (err) {
    console.warn('Error fetching portfolio summary:', err);
  }

  const stats = document.createElement('div');
  stats.className = 'portfolio-stats';
  stats.style.display = 'flex';
  stats.style.gap = SPACING.MD;
  stats.style.marginBottom = SPACING.MD;
  stats.style.flexWrap = 'wrap';

  const totalVal = document.createElement('div');
  totalVal.className = 'total-portfolio-value';
  totalVal.textContent = 'Total: ';
  const valueSpan = document.createElement('span');
  valueSpan.className = 'currency-value';
  valueSpan.textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(totalValue);
  totalVal.appendChild(valueSpan);

  const gainLoss = document.createElement('div');
  gainLoss.className = 'total-gain-loss';
  const sign = totalGainLoss >= 0 ? '+' : '';
  gainLoss.textContent = `Gain/Loss: ${sign}${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(totalGainLoss)}`;
  gainLoss.style.color = totalGainLoss >= 0 ? COLORS.SUCCESS : COLORS.ERROR;

  stats.appendChild(totalVal);
  stats.appendChild(gainLoss);
  section.insertBefore(stats, controls);

  if (totalValue === 0) {
    const placeholder = createPlaceholder(
      'No Investments Yet',
      'Start tracking your portfolio by adding your first investment holdings.',
      '💰'
    );
    section.appendChild(placeholder);
  }

  return section;
};
