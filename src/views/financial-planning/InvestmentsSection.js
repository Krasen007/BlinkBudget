/**
 * Investments Section - Portfolio Tracking
 *
 * Simple holdings list: symbol, shares, purchase price, current value, gain/loss.
 * No charts. No allocation analysis. No type-specific fields.
 */

import { COLORS, SPACING, CURRENCY_SYMBOL } from '../../utils/constants.js';
import {
  createUsageNote,
  createSectionContainer,
  createPlaceholder,
} from '../../utils/financial-planning-helpers.js';
import { createEnhancedEmptyState } from '../../utils/enhanced-empty-states.js';
import { ProgressiveEmptyState } from '../../components/ProgressiveEmptyState.js';
import { showErrorToast } from '../../utils/toast-notifications.js';

/** Local calendar date as YYYY-MM-DD for <input type="date"> */
function todayLocalDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Create investment form controls
 * @param {Function} [onSaved] - Called after a successful save
 */
function createInvestmentFormControls(onSaved) {
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = SPACING.SM;
  controls.style.alignItems = 'center';
  controls.style.flexWrap = 'wrap';
  controls.style.marginTop = SPACING.MD;

  const addInvBtn = document.createElement('button');
  addInvBtn.textContent = 'Add Investment';
  addInvBtn.className = 'btn btn-primary add-investment-btn';
  addInvBtn.type = 'button';

  const invForm = document.createElement('div');
  invForm.className = 'investment-form';
  invForm.style.display = 'none';
  invForm.style.gap = SPACING.SM;
  invForm.style.marginTop = SPACING.SM;
  invForm.style.flexWrap = 'wrap';
  invForm.style.width = '100%';

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
    input.setAttribute(
      'aria-label',
      f.placeholder || (f.name === 'purchaseDate' ? 'Purchase date' : f.name)
    );
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
  saveInvBtn.type = 'button';
  saveInvBtn.disabled = true;

  const cancelInvBtn = document.createElement('button');
  cancelInvBtn.textContent = 'Cancel';
  cancelInvBtn.className = 'btn btn-ghost';
  cancelInvBtn.type = 'button';

  invForm.appendChild(saveInvBtn);
  invForm.appendChild(cancelInvBtn);

  function resetFormFields() {
    Object.values(inputs).forEach(i => (i.value = ''));
    notesInput.value = '';
    saveInvBtn.disabled = true;
  }

  function closeForm() {
    invForm.style.display = 'none';
    addInvBtn.hidden = false;
    resetFormFields();
  }

  function openForm() {
    // Only open — never toggle closed. Closing is Cancel or a successful save,
    // so a second click on Add Investment cannot look like a successful add.
    if (invForm.style.display !== 'none') {
      inputs.symbol.focus();
      return;
    }
    invForm.style.display = 'flex';
    addInvBtn.hidden = true;
    inputs.purchaseDate.value = todayLocalDate();
    validate();
    inputs.symbol.focus();
  }

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

  addInvBtn.addEventListener('click', openForm);
  cancelInvBtn.addEventListener('click', closeForm);

  saveInvBtn.addEventListener('click', async () => {
    if (!validate()) return;
    const symbol = inputs.symbol.value.trim().toUpperCase();
    const shares = Number(inputs.shares.value);
    const purchasePrice = Number(inputs.purchasePrice.value);
    const currentPrice =
      inputs.currentPrice.value !== ''
        ? Number(inputs.currentPrice.value)
        : purchasePrice;
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

      closeForm();
      if (typeof onSaved === 'function') {
        await onSaved();
      }
    } catch (err) {
      console.error('Failed to save investment', err);
      showErrorToast('Failed to save investment. Please try again.');
    }
  });

  controls.appendChild(addInvBtn);
  controls.appendChild(invForm);
  return { controls };
}

/**
 * Create investments list with CRUD operations
 */

/**
 * Create investments list with CRUD operations
 *
 * Investments are grouped by symbol into holdings. Multiple purchases of
 * the same symbol (e.g. BTC bought at 55000, 54500 and 66000) roll up into
 * one holding showing the average cost per share, while the individual
 * purchases remain visible underneath each holding.
 */
function createInvestmentsList() {
  const investmentsList = document.createElement('div');
  investmentsList.className = 'investment-list';
  investmentsList.style.marginTop = SPACING.MD;

  const formatShares = shares => {
    const s = Number(shares) || 0;
    return Number.isInteger(s) ? s : s.toFixed(4);
  };

  async function refreshInvestmentsList() {
    investmentsList.innerHTML = '';
    let holdings;
    try {
      const { StorageService } = await import('../../core/storage.js');
      holdings = StorageService.getHoldingsGrouped() || [];

      if (!holdings.length) {
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

      holdings.forEach(holding => {
        const quotePrice =
          holding.currentPrice > 0 ? holding.currentPrice : holding.averageCost;
        const totalValue = holding.totalShares * quotePrice;
        const gainLoss = totalValue - holding.totalInvested;
        const gainPct =
          holding.totalInvested > 0
            ? (gainLoss / holding.totalInvested) * 100
            : 0;
        const sign = gainLoss >= 0 ? '+' : '';

        const group = document.createElement('li');
        group.className = 'investment-group';
        group.style.background = COLORS.SURFACE;
        group.style.border = `1px solid ${COLORS.BORDER}`;
        group.style.borderRadius = 'var(--radius-lg)';
        group.style.overflow = 'hidden';
        group.style.display = 'flex';
        group.style.flexDirection = 'column';

        // ---- Holding summary: always visible (average cost etc.) ----
        const summary = document.createElement('div');
        summary.className = 'investment-summary';
        summary.style.display = 'flex';
        summary.style.alignItems = 'center';
        summary.style.justifyContent = 'space-between';
        summary.style.padding = SPACING.MD;
        summary.style.cursor = 'pointer';
        summary.style.borderBottom = `1px solid ${COLORS.BORDER}`;

        const summaryLeft = document.createElement('div');
        summaryLeft.style.display = 'flex';
        summaryLeft.style.flexDirection = 'column';
        summaryLeft.style.gap = SPACING.XXS;

        const symbolRow = document.createElement('div');
        symbolRow.style.display = 'flex';
        symbolRow.style.alignItems = 'center';
        symbolRow.style.gap = SPACING.SM;

        const symbolEl = document.createElement('strong');
        symbolEl.textContent = holding.symbol;
        symbolRow.appendChild(symbolEl);

        const lotsBadge = document.createElement('span');
        lotsBadge.textContent = `${holding.lots.length} purchase${
          holding.lots.length !== 1 ? 's' : ''
        }`;
        lotsBadge.style.fontSize = '0.75rem';
        lotsBadge.style.color = COLORS.TEXT_MUTED;
        lotsBadge.style.background = 'rgba(0,0,0,0.06)';
        lotsBadge.style.padding = `${SPACING.XXS} ${SPACING.SM}`;
        lotsBadge.style.borderRadius = 'var(--radius-md)';
        symbolRow.appendChild(lotsBadge);

        summaryLeft.appendChild(symbolRow);

        // Only show a separate name when it differs from the symbol (avoids "TEST" / "TEST")
        const displayName = (holding.name || '').trim();
        if (
          displayName &&
          displayName.toUpperCase() !== String(holding.symbol || '').toUpperCase()
        ) {
          const nameEl = document.createElement('div');
          nameEl.className = 'investment-holding-name';
          nameEl.textContent = displayName;
          nameEl.style.fontSize = '0.85rem';
          nameEl.style.color = COLORS.TEXT_MUTED;
          summaryLeft.appendChild(nameEl);
        }

        const summaryCenter = document.createElement('div');
        summaryCenter.style.display = 'flex';
        summaryCenter.style.flexDirection = 'column';
        summaryCenter.style.gap = SPACING.XXS;
        summaryCenter.style.flex = '1';
        summaryCenter.style.margin = `0 ${SPACING.MD}`;

        const costLine = document.createElement('div');
        costLine.textContent = `${formatShares(
          holding.totalShares
        )} shares @ ${CURRENCY_SYMBOL}${holding.averageCost.toFixed(2)} average cost`;
        costLine.style.fontWeight = '600';

        const valueLine = document.createElement('div');
        valueLine.textContent = `Current value: ${CURRENCY_SYMBOL}${totalValue.toFixed(2)}`;
        valueLine.style.fontSize = '0.9rem';
        valueLine.style.color = COLORS.TEXT_MUTED;

        summaryCenter.appendChild(costLine);
        summaryCenter.appendChild(valueLine);

        const summaryRight = document.createElement('div');
        summaryRight.style.display = 'flex';
        summaryRight.style.alignItems = 'center';
        summaryRight.style.gap = SPACING.SM;

        const gainEl = document.createElement('strong');
        gainEl.textContent = `${sign}${CURRENCY_SYMBOL}${Math.abs(gainLoss).toFixed(2)} (${sign}${gainPct.toFixed(1)}%)`;
        gainEl.style.color = gainLoss >= 0 ? COLORS.SUCCESS : COLORS.ERROR;
        summaryRight.appendChild(gainEl);

        const chevron = document.createElement('span');
        chevron.textContent = '▾';
        chevron.style.fontSize = '0.8rem';
        chevron.style.color = COLORS.TEXT_MUTED;
        summaryRight.appendChild(chevron);

        summary.appendChild(summaryLeft);
        summary.appendChild(summaryCenter);
        summary.appendChild(summaryRight);

        // ---- Individual purchases (lots) underneath the holding ----
        const lotsContainer = document.createElement('div');
        lotsContainer.className = 'investment-lots';
        lotsContainer.style.display = 'grid';
        lotsContainer.style.gap = '0';

        const lotGridColumns =
          'minmax(7rem, 1.4fr) minmax(3.5rem, 0.7fr) minmax(4.5rem, 0.9fr) minmax(4.5rem, 0.9fr) minmax(4.5rem, 0.9fr) minmax(5rem, 1fr) minmax(8.5rem, auto)';
        const lotAlignments = [
          'left',
          'right',
          'right',
          'right',
          'right',
          'right',
          'right',
        ];

        const lotsHeader = document.createElement('div');
        lotsHeader.className = 'investment-lot-header';
        lotsHeader.style.display = 'grid';
        lotsHeader.style.gridTemplateColumns = lotGridColumns;
        lotsHeader.style.gap = SPACING.SM;
        lotsHeader.style.alignItems = 'center';
        lotsHeader.style.padding = `${SPACING.XS} ${SPACING.MD}`;
        lotsHeader.style.background = 'rgba(0,0,0,0.04)';
        lotsHeader.style.fontSize = '0.75rem';
        lotsHeader.style.fontWeight = '600';
        lotsHeader.style.color = COLORS.TEXT_MUTED;
        lotsHeader.style.textTransform = 'uppercase';
        lotsHeader.style.letterSpacing = '0.05em';
        lotsHeader.style.borderBottom = `1px solid ${COLORS.BORDER}`;
        [
          'Date',
          'Shares',
          'Price',
          'Total',
          'Value',
          'Gain/Loss',
          'Actions',
        ].forEach((label, index) => {
          const cell = document.createElement('div');
          cell.textContent = label;
          cell.style.textAlign = lotAlignments[index];
          cell.style.whiteSpace = 'nowrap';
          lotsHeader.appendChild(cell);
        });
        lotsContainer.appendChild(lotsHeader);

        holding.lots.forEach(lot => {
          const lotDate = lot.purchaseDate
            ? new Date(lot.purchaseDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '-';
          const lotShares = Number(lot.shares) || 0;
          const lotPrice = Number(lot.purchasePrice) || 0;
          const lotTotal = lotShares * lotPrice;
          const lotCurrentValue = Number(lot.lotValue) || 0;
          const lotGain = Number(lot.lotGainLoss) || 0;
          const lotSign = lotGain >= 0 ? '+' : '';
          const lotNotes = (lot.notes || '').trim();

          const row = document.createElement('div');
          row.className = 'investment-lot';
          row.style.display = 'grid';
          row.style.gridTemplateColumns = lotGridColumns;
          row.style.gap = SPACING.SM;
          row.style.alignItems = 'center';
          row.style.padding = `${SPACING.SM} ${SPACING.MD}`;
          row.style.borderBottom = `1px solid ${COLORS.BORDER}`;

          const dateCell = document.createElement('div');
          dateCell.style.textAlign = 'left';
          dateCell.style.minWidth = '0';

          const dateText = document.createElement('div');
          dateText.textContent = lotDate;
          dateText.style.fontSize = '0.85rem';
          dateText.style.color = COLORS.TEXT_MUTED;
          dateCell.appendChild(dateText);

          if (lotNotes) {
            const notesText = document.createElement('div');
            notesText.className = 'investment-lot-notes';
            notesText.textContent = lotNotes;
            notesText.title = lotNotes;
            notesText.style.fontSize = '0.75rem';
            notesText.style.color = COLORS.TEXT_MUTED;
            notesText.style.fontStyle = 'italic';
            notesText.style.marginTop = '2px';
            notesText.style.overflow = 'hidden';
            notesText.style.textOverflow = 'ellipsis';
            notesText.style.whiteSpace = 'nowrap';
            dateCell.appendChild(notesText);
          }

          const sharesCell = document.createElement('div');
          sharesCell.textContent = formatShares(lotShares);
          sharesCell.style.fontSize = '0.9rem';
          sharesCell.style.textAlign = 'right';
          sharesCell.style.fontVariantNumeric = 'tabular-nums';

          const priceCell = document.createElement('div');
          priceCell.textContent = `${CURRENCY_SYMBOL}${lotPrice.toFixed(2)}`;
          priceCell.style.fontSize = '0.9rem';
          priceCell.style.textAlign = 'right';
          priceCell.style.fontVariantNumeric = 'tabular-nums';

          const totalCell = document.createElement('div');
          totalCell.textContent = `${CURRENCY_SYMBOL}${lotTotal.toFixed(2)}`;
          totalCell.style.fontSize = '0.9rem';
          totalCell.style.textAlign = 'right';
          totalCell.style.fontVariantNumeric = 'tabular-nums';

          const currentCell = document.createElement('div');
          currentCell.textContent = `${CURRENCY_SYMBOL}${lotCurrentValue.toFixed(2)}`;
          currentCell.style.fontSize = '0.9rem';
          currentCell.style.textAlign = 'right';
          currentCell.style.fontVariantNumeric = 'tabular-nums';

          const gainCell = document.createElement('strong');
          gainCell.textContent = `${lotSign}${CURRENCY_SYMBOL}${Math.abs(
            lotGain
          ).toFixed(2)}`;
          gainCell.style.color = lotGain >= 0 ? COLORS.SUCCESS : COLORS.ERROR;
          gainCell.style.fontSize = '0.9rem';
          gainCell.style.textAlign = 'right';
          gainCell.style.fontVariantNumeric = 'tabular-nums';

          const actions = document.createElement('div');
          actions.style.display = 'flex';
          actions.style.gap = SPACING.XS;
          actions.style.justifyContent = 'flex-end';
          actions.style.flexWrap = 'nowrap';

          const editBtn = document.createElement('button');
          editBtn.textContent = 'Edit';
          editBtn.className = 'btn btn-ghost';
          editBtn.type = 'button';
          editBtn.style.fontSize = '0.85rem';
          editBtn.style.padding = `${SPACING.XXS} ${SPACING.SM}`;

          const delBtn = document.createElement('button');
          delBtn.textContent = 'Delete';
          delBtn.className = 'btn btn-ghost';
          delBtn.type = 'button';
          delBtn.style.fontSize = '0.85rem';
          delBtn.style.padding = `${SPACING.XXS} ${SPACING.SM}`;
          delBtn.style.color = COLORS.ERROR;

          actions.appendChild(editBtn);
          actions.appendChild(delBtn);

          row.appendChild(dateCell);
          row.appendChild(sharesCell);
          row.appendChild(priceCell);
          row.appendChild(totalCell);
          row.appendChild(currentCell);
          row.appendChild(gainCell);
          row.appendChild(actions);

          // Edit this purchase lot
          editBtn.addEventListener('click', () => {
            const form = createLotEditForm(
              lot,
              async () => {
                form.remove();
                row.style.display = 'grid';
                refreshInvestmentsList();
              },
              () => {
                form.remove();
                row.style.display = 'grid';
              }
            );
            row.style.display = 'none';
            lotsContainer.insertBefore(form, row.nextSibling);
          });

          // Delete this purchase lot
          delBtn.addEventListener('click', async () => {
            import('../../components/ConfirmDialog.js')
              .then(({ ConfirmDialog }) => {
                ConfirmDialog({
                  title: 'Delete Purchase',
                  message: `Remove this ${lot.symbol} purchase of ${formatShares(
                    lotShares
                  )} shares?`,
                  confirmText: 'Delete',
                  variant: 'danger',
                  onConfirm: async () => {
                    try {
                      const { StorageService } =
                        await import('../../core/storage.js');
                      StorageService.removeInvestmentById(lot.id);
                      refreshInvestmentsList();
                    } catch (err) {
                      console.error('Failed to remove purchase', err);
                      showErrorToast(
                        'Failed to remove purchase. Please try again.'
                      );
                    }
                  },
                });
              })
              .catch(err =>
                console.error('Failed to load confirmation dialog:', err)
              );
          });

          lotsContainer.appendChild(row);
        });

        summary.addEventListener('click', () => {
          const expanded = lotsContainer.style.display !== 'none';
          lotsContainer.style.display = expanded ? 'none' : 'grid';
          chevron.textContent = expanded ? '▸' : '▾';
        });

        group.appendChild(summary);
        group.appendChild(lotsContainer);
        ul.appendChild(group);
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

  /**
   * Inline edit form for a single purchase lot
   */
  function createLotEditForm(lot, onSave, onCancel) {
    const form = document.createElement('div');
    form.className = 'investment-edit-form';
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = SPACING.SM;
    form.style.padding = `${SPACING.SM} ${SPACING.MD} ${SPACING.MD}`;
    form.style.background = 'rgba(0,0,0,0.03)';
    form.style.borderBottom = `1px solid ${COLORS.BORDER}`;

    const inputStyle = `width:100%;padding:${SPACING.SM};border:1px solid ${COLORS.BORDER};border-radius:var(--radius-md);font-size:var(--font-size-sm);background:${COLORS.BACKGROUND};color:var(--color-text-main);box-sizing:border-box;`;
    const labelStyle = `font-size:var(--font-size-xs);font-weight:500;color:${COLORS.TEXT_MUTED};margin-bottom:2px;`;
    const fieldPrefix = `edit-lot-${String(lot.id || 'investment').replace(/[^a-zA-Z0-9_-]+/g, '-')}-`;

    const field = (labelText, input) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = SPACING.XXS;
      const label = document.createElement('label');
      label.textContent = labelText;
      label.style.cssText = labelStyle;
      label.setAttribute('for', fieldPrefix + labelText.toLowerCase());
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      form.appendChild(wrapper);
      return input;
    };

    const symbolFld = field(
      'Symbol',
      (() => {
        const i = document.createElement('input');
        i.type = 'text';
        i.value = lot.symbol;
        i.placeholder = 'e.g. BTC';
        i.style.cssText = inputStyle;
        return i;
      })()
    );
    const nameFld = field(
      'Name',
      (() => {
        const i = document.createElement('input');
        i.type = 'text';
        i.value = lot.name || lot.symbol;
        i.placeholder = 'Optional';
        i.style.cssText = inputStyle;
        return i;
      })()
    );
    const sharesFld = field(
      'Shares',
      (() => {
        const i = document.createElement('input');
        i.type = 'number';
        i.value = lot.shares;
        i.step = '0.0001';
        i.placeholder = 'Number of shares';
        i.style.cssText = inputStyle;
        return i;
      })()
    );
    const priceFld = field(
      'Purchase Price',
      (() => {
        const i = document.createElement('input');
        i.type = 'number';
        i.value = lot.purchasePrice;
        i.step = '0.01';
        i.placeholder = 'Price per share';
        i.style.cssText = inputStyle;
        return i;
      })()
    );
    const currentFld = field(
      'Current Price',
      (() => {
        const i = document.createElement('input');
        i.type = 'number';
        i.value = lot.currentPrice ?? lot.purchasePrice;
        i.step = '0.01';
        i.placeholder = 'Optional';
        i.style.cssText = inputStyle;
        return i;
      })()
    );
    const dateFld = field(
      'Purchase Date',
      (() => {
        const i = document.createElement('input');
        i.type = 'date';
        if (lot.purchaseDate) {
          const d = new Date(lot.purchaseDate);
          if (!Number.isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            i.value = `${yyyy}-${mm}-${dd}`;
          }
        }
        if (!i.value) i.value = todayLocalDate();
        i.style.cssText = inputStyle;
        return i;
      })()
    );
    const notesFld = field(
      'Notes',
      (() => {
        const i = document.createElement('textarea');
        i.value = lot.notes || '';
        i.rows = 2;
        i.placeholder = 'Optional notes';
        i.style.cssText = `${inputStyle}resize:vertical;`;
        return i;
      })()
    );

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
    form.appendChild(btnRow);

    cancelBtn.addEventListener('click', () => {
      if (typeof onCancel === 'function') onCancel();
    });

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
        StorageService.updateInvestment(lot.id, {
          symbol: newSymbol,
          name: nameFld.value.trim() || newSymbol,
          shares: Number(sharesFld.value) || 0,
          purchasePrice: Number(priceFld.value) || 0,
          currentPrice:
            currentFld.value !== ''
              ? Number(currentFld.value)
              : Number(priceFld.value) || 0,
          purchaseDate: dateFld.value
            ? new Date(dateFld.value)
            : lot.purchaseDate,
          notes: notesFld.value.trim(),
        });
        await onSave();
      } catch (err) {
        console.error('Failed to update purchase', err);
        showErrorToast('Failed to update purchase. Please try again.');
      }
    });

    return form;
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
      'Track manual investments here. Multiple purchases of the same symbol roll up into one holding showing the average cost per share — expand a holding to see its individual purchases. Edits sync to cloud; deletions remove from cloud.'
    )
  );

  // Progressive unlock message — connects advanced features to the core logging habit
  try {
    const { StorageService: SS } = await import('../../core/storage.js');
    const txCount = (SS.getAll() || []).length;
    const unlockCard = ProgressiveEmptyState({
      section: 'investments',
      transactionCount: txCount,
      minTransactions: 30,
    });
    if (unlockCard) {
      section.appendChild(unlockCard);
    }
  } catch {
    // Non-critical — silently fail
  }

  // Investments list first so the form can refresh it after save
  const { investmentsList, refreshInvestmentsList } = createInvestmentsList();
  investmentsList.className = 'investment-list';

  const { controls } = createInvestmentFormControls(refreshInvestmentsList);
  section.appendChild(controls);
  section.appendChild(investmentsList);

  // Initial population of the list
  await refreshInvestmentsList();

  // Add total portfolio value and gain/loss
  let totalValue = 0;
  let totalGainLoss = 0;
  let portfolioSummaryFailed = false;
  try {
    const { StorageService } = await import('../../core/storage.js');
    const summary = StorageService.calculatePortfolioSummary();
    totalValue = summary.totalValue || 0;
    totalGainLoss = summary.gainsLosses?.totalGainLoss || 0;
  } catch (err) {
    console.error('Error fetching portfolio summary:', err);
    portfolioSummaryFailed = true;
  }

  const stats = document.createElement('div');
  stats.className = 'portfolio-stats';
  stats.style.display = 'flex';
  stats.style.gap = SPACING.MD;
  stats.style.marginBottom = SPACING.MD;
  stats.style.flexWrap = 'wrap';

  if (portfolioSummaryFailed) {
    // A failure must not read as "Total: €0.00" — that is a plausible-looking
    // wrong number, indistinguishable from a genuinely empty portfolio. The
    // holdings list above is unaffected, so say so rather than showing figures.
    const summaryError = document.createElement('div');
    summaryError.className = 'portfolio-stats-error';
    summaryError.textContent =
      'Portfolio totals are unavailable. Your holdings are unaffected — try refreshing to see the summary.';
    summaryError.style.color = COLORS.ERROR;
    stats.appendChild(summaryError);
    section.insertBefore(stats, controls);
  } else {
    const totalVal = document.createElement('div');
    totalVal.className = 'total-portfolio-value';
    totalVal.textContent = 'Total: ';
    const valueSpan = document.createElement('span');
    valueSpan.className = 'currency-value';
    valueSpan.textContent = `${CURRENCY_SYMBOL}${totalValue.toFixed(2)}`;
    totalVal.appendChild(valueSpan);

    const gainLoss = document.createElement('div');
    gainLoss.className = 'total-gain-loss';
    const sign = totalGainLoss >= 0 ? '+' : '';
    gainLoss.textContent = `Gain/Loss: ${sign}${CURRENCY_SYMBOL}${Math.abs(totalGainLoss).toFixed(2)}`;
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
  }

  return section;
};
