/**
 * Investments Section - Portfolio Tracking
 *
 * Extracted from FinancialPlanningView.js for better maintainability.
 * Displays investment portfolio with CRUD operations.
 *
 * Responsibilities:
 * - Investment CRUD operations (Create, Read, Update, Delete)
 * - Investment list management and editing
 */

import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants.js';
import {
  createUsageNote,
  createSectionContainer,
  createPlaceholder,
} from '../../utils/financial-planning-helpers.js';
import { createEnhancedEmptyState, getProgressiveUnlockMessage } from '../../utils/enhanced-empty-states.js';

/**
 * Helper function to create form fields
 */
function createFormField(label, name, type, placeholder = '', step = '') {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '4px';

  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.placeholder = placeholder;
  input.id = `inv-${name}`;
  input.setAttribute('aria-label', label);
  if (step) input.step = step;

  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.style.color = COLORS.ERROR;
  errorDiv.style.fontSize = '0.85rem';
  errorDiv.style.display = 'none';

  container.appendChild(input);
  container.appendChild(errorDiv);

  return { container, input, errorDiv };
}

/**
 * Helper function to create select fields
 */
function createSelectField(label, name, options) {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '4px';

  const select = document.createElement('select');
  select.name = name;
  select.id = `inv-${name}`;
  select.setAttribute('aria-label', label);
  select.className = 'mobile-form-select';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = `Select ${label}`;
  select.appendChild(defaultOption);

  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.toLowerCase().replace(/\s+/g, '');
    optionElement.textContent = option;
    select.appendChild(optionElement);
  });

  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.style.color = COLORS.ERROR;
  errorDiv.style.fontSize = '0.85rem';
  errorDiv.style.display = 'none';

  container.appendChild(select);
  container.appendChild(errorDiv);

  return { container, input: select, errorDiv };
}

/**
 * Function to generate type-specific fields
 */
function generateTypeSpecificFields(
  investmentType,
  basicFieldsContainer,
  typeSpecificFields
) {
  // Security: Clearing container content, no user input involved
  basicFieldsContainer.innerHTML = '';
  typeSpecificFields.innerHTML = '';

  const fields = [];
  const basicFields = [];

  switch (investmentType) {
    case 'stocks': {
      const symbolField = createFormField('Symbol', 'symbol', 'text', 'AAPL');
      const sharesField = createFormField('Shares', 'shares', 'number', '100');
      basicFields.push(symbolField, sharesField);
      break;
    }
    case 'bonds': {
      const nameField = createFormField(
        'Bond Name',
        'symbol',
        'text',
        'US Treasury Bond'
      );
      const faceValueField = createFormField(
        'Face Value',
        'faceValue',
        'number',
        '1000'
      );
      const couponRateField = createFormField(
        'Coupon Rate (%)',
        'couponRate',
        'number',
        '5.5',
        '0.1'
      );
      const maturityDateField = createFormField(
        'Maturity Date',
        'maturityDate',
        'date'
      );
      basicFields.push(nameField);
      fields.push(faceValueField, couponRateField, maturityDateField);
      break;
    }
    case 'etf': {
      const symbolField = createFormField(
        'ETF Symbol',
        'symbol',
        'text',
        'VOO'
      );
      const sharesField = createFormField('Shares', 'shares', 'number', '50');
      const expenseRatioField = createFormField(
        'Expense Ratio (%)',
        'expenseRatio',
        'number',
        '0.1',
        '0.01'
      );
      basicFields.push(symbolField, sharesField);
      fields.push(expenseRatioField);
      break;
    }
    case 'realestate': {
      const nameField = createFormField(
        'Property Name',
        'symbol',
        'text',
        '123 Main Street'
      );
      const propertyTypeSelect = createSelectField(
        'Property Type',
        'propertyType',
        ['Residential', 'Commercial', 'Land', 'REIT']
      );
      const addressField = createFormField(
        'Address',
        'address',
        'text',
        '123 Main St'
      );
      const sqftField = createFormField(
        'Square Footage',
        'squareFootage',
        'number',
        '1500'
      );
      basicFields.push(nameField);
      fields.push(propertyTypeSelect, addressField, sqftField);
      break;
    }
    case 'crypto': {
      const symbolField = createFormField(
        'Crypto Symbol',
        'symbol',
        'text',
        'BTC'
      );
      const unitsField = createFormField(
        'Units',
        'units',
        'number',
        '0.5',
        '0.001'
      );
      const exchangeSelect = createSelectField('Exchange', 'exchange', [
        'Binance',
        'Coinbase',
        'Kraken',
        'Other',
      ]);
      basicFields.push(symbolField);
      fields.push(unitsField, exchangeSelect);
      break;
    }
    case 'cash': {
      const nameField = createFormField(
        'Account Name',
        'symbol',
        'text',
        'Savings Account'
      );
      const currencySelect = createSelectField('Currency', 'currency', [
        'EUR',
        'USD',
        'GBP',
        'JPY',
      ]);
      const interestRateField = createFormField(
        'Interest Rate (%)',
        'interestRate',
        'number',
        '2.5',
        '0.1'
      );
      basicFields.push(nameField);
      fields.push(currencySelect, interestRateField);
      break;
    }
    case 'commodities': {
      const nameField = createFormField(
        'Commodity Name',
        'symbol',
        'text',
        'Gold Bars'
      );
      const commodityTypeSelect = createSelectField(
        'Commodity Type',
        'commodityType',
        ['Gold', 'Silver', 'Oil', 'Natural Gas', 'Other']
      );
      const quantityField = createFormField(
        'Quantity',
        'quantity',
        'number',
        '10',
        '0.1'
      );
      basicFields.push(nameField);
      fields.push(commodityTypeSelect, quantityField);
      break;
    }
    case 'other': {
      const nameField = createFormField(
        'Investment Name',
        'symbol',
        'text',
        'Custom Investment'
      );
      const customNameField = createFormField(
        'Custom Type Name',
        'customTypeName',
        'text',
        'Custom Investment'
      );
      basicFields.push(nameField);
      fields.push(customNameField);
      break;
    }
  }

  // Add basic fields to container
  basicFields.forEach(field => {
    basicFieldsContainer.appendChild(field.container);
  });

  // Add type-specific fields to container
  fields.forEach(field => {
    typeSpecificFields.appendChild(field.container);
  });
}

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

  // Investment type dropdown
  const typeSelect = document.createElement('select');
  typeSelect.id = 'inv-type';
  typeSelect.name = 'investmentType';
  typeSelect.required = true;
  typeSelect.setAttribute('aria-label', 'Investment Type');
  typeSelect.className = 'mobile-form-select';

  // Add investment type options
  const investmentTypes = [
    { value: 'stocks', label: 'Stocks' },
    { value: 'bonds', label: 'Bonds' },
    { value: 'etf', label: 'ETFs' },
    { value: 'realestate', label: 'Real Estate' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'cash', label: 'Cash' },
    { value: 'commodities', label: 'Commodities' },
    { value: 'other', label: 'Other' },
  ];

  investmentTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.value;
    option.textContent = type.label;
    typeSelect.appendChild(option);
  });

  const typeError = document.createElement('div');
  typeError.style.color = COLORS.ERROR;
  typeError.style.fontSize = '0.85rem';
  typeError.style.display = 'none';

  // Container for basic fields that will be managed dynamically
  const basicFieldsContainer = document.createElement('div');
  basicFieldsContainer.id = 'basic-fields-container';
  basicFieldsContainer.style.display = 'flex';
  basicFieldsContainer.style.flexDirection = 'column';
  basicFieldsContainer.style.gap = SPACING.SM;
  basicFieldsContainer.style.width = '100%';

  // Common fields
  const priceInput = document.createElement('input');
  priceInput.id = 'inv-price';
  priceInput.name = 'purchasePrice';
  priceInput.type = 'number';
  priceInput.placeholder = 'Purchase Price';
  priceInput.required = true;
  priceInput.setAttribute('aria-label', 'Purchase Price');
  const priceError = document.createElement('div');
  priceError.style.color = COLORS.ERROR;
  priceError.style.fontSize = '0.85rem';
  priceError.style.display = 'none';

  const currentPriceInput = document.createElement('input');
  currentPriceInput.id = 'inv-current-price';
  currentPriceInput.name = 'currentPrice';
  currentPriceInput.type = 'number';
  currentPriceInput.placeholder = 'Current Price (optional)';
  currentPriceInput.setAttribute('aria-label', 'Current Price');
  const currentPriceError = document.createElement('div');
  currentPriceError.style.color = COLORS.ERROR;
  currentPriceError.style.fontSize = '0.85rem';
  currentPriceError.style.display = 'none';

  // Container for type-specific fields
  const typeSpecificFields = document.createElement('div');
  typeSpecificFields.id = 'type-specific-fields';
  typeSpecificFields.style.display = 'flex';
  typeSpecificFields.style.flexDirection = 'column';
  typeSpecificFields.style.gap = SPACING.SM;
  typeSpecificFields.style.width = '100%';

  // Investment notes field
  const notesInput = document.createElement('textarea');
  notesInput.id = 'inv-notes';
  notesInput.name = 'notes';
  notesInput.placeholder = 'Investment notes (optional)';
  notesInput.rows = 2;
  notesInput.style.width = '100%';
  notesInput.style.resize = 'vertical';
  notesInput.setAttribute('aria-label', 'Investment notes');

  const dateInput = document.createElement('input');
  dateInput.id = 'inv-date';
  dateInput.name = 'purchaseDate';
  dateInput.type = 'date';
  dateInput.setAttribute('aria-label', 'Purchase date');

  const saveInvBtn = document.createElement('button');
  saveInvBtn.textContent = 'Save Investment';
  saveInvBtn.className = 'btn btn-primary btn-save';
  saveInvBtn.disabled = true;

  const nameError = document.createElement('div');
  nameError.className = 'error';
  nameError.setAttribute('name', 'name');
  nameError.style.color = COLORS.ERROR;
  nameError.style.fontSize = '0.8rem';
  nameError.style.display = 'none';

  const valueError = document.createElement('div');
  valueError.className = 'error';
  valueError.setAttribute('name', 'value');
  valueError.style.color = COLORS.ERROR;
  valueError.style.fontSize = '0.8rem';
  valueError.style.display = 'none';

  invForm.appendChild(typeSelect);
  invForm.appendChild(typeError);
  invForm.appendChild(basicFieldsContainer);
  invForm.appendChild(nameError);
  invForm.appendChild(priceInput);
  invForm.appendChild(priceError);
  invForm.appendChild(currentPriceInput);
  invForm.appendChild(currentPriceError);
  invForm.appendChild(typeSpecificFields);
  invForm.appendChild(valueError);
  invForm.appendChild(notesInput);
  invForm.appendChild(dateInput);
  invForm.appendChild(saveInvBtn);

  // Add event listener for investment type changes
  typeSelect.addEventListener('change', e => {
    generateTypeSpecificFields(
      e.target.value,
      basicFieldsContainer,
      typeSpecificFields
    );
  });

  // Initialize with stocks as default
  generateTypeSpecificFields(
    'stocks',
    basicFieldsContainer,
    typeSpecificFields
  );

  addInvBtn.addEventListener('click', () => {
    invForm.style.display = invForm.style.display === 'none' ? 'flex' : 'none';
    invForm.style.flexWrap = 'wrap';
  });

  // Validation function with real-time feedback
  function validateInvForm() {
    const investmentType = typeSelect.value;
    const price = Number(priceInput.value) || 0;
    const currentPrice = Number(currentPriceInput.value) || 0;

    const basicInputs = basicFieldsContainer.querySelectorAll('input, select');
    const typeSpecificInputs =
      typeSpecificFields.querySelectorAll('input, select');
    const formData = {};

    [...basicInputs, ...typeSpecificInputs].forEach(input => {
      if (input.value && input.value.trim() !== '') {
        formData[input.name] =
          input.type === 'number' ? Number(input.value) : input.value.trim();
      }
    });

    const symbol = formData.symbol || '';
    const shares = formData.shares || 0;
    const units = formData.units || 0;
    const quantity = formData.quantity || 0;

    let isValid = investmentType && price >= 0 && currentPrice >= 0;

    typeError.style.display = 'none';
    nameError.style.display = 'none';
    valueError.style.display = 'none';
    priceError.style.display = 'none';
    currentPriceError.style.display = 'none';

    switch (investmentType) {
      case 'stocks':
      case 'etf':
        if (!symbol) {
          nameError.textContent = `${investmentType === 'stocks' ? 'Stock' : 'ETF'} symbol required (e.g., ${investmentType === 'stocks' ? 'AAPL' : 'VOO'})`;
          nameError.style.display = 'block';
          isValid = false;
        }
        if (!(shares > 0)) {
          valueError.textContent = 'Number of shares must be greater than 0';
          valueError.style.display = 'block';
          isValid = false;
        }
        break;
      case 'crypto':
        if (!symbol) {
          nameError.textContent = 'Crypto symbol required (e.g., BTC, ETH)';
          nameError.style.display = 'block';
          isValid = false;
        }
        if (!(units > 0)) {
          valueError.textContent = 'Number of units must be greater than 0';
          valueError.style.display = 'block';
          isValid = false;
        }
        break;
      case 'commodities':
        if (!symbol) {
          nameError.textContent = 'Commodity name is required';
          nameError.style.display = 'block';
          isValid = false;
        }
        if (!(quantity > 0)) {
          valueError.textContent = 'Quantity must be greater than 0';
          valueError.style.display = 'block';
          isValid = false;
        }
        break;
      case 'bonds':
      case 'realestate':
      case 'cash':
      case 'other':
        if (!symbol) {
          nameError.textContent = 'Name is required';
          nameError.style.display = 'block';
          isValid = false;
        }
        break;
      default:
        isValid = false;
        break;
    }

    if (price < 0) {
      priceError.textContent = 'Purchase price cannot be negative';
      priceError.style.display = 'block';
      isValid = false;
    }
    if (currentPrice < 0) {
      currentPriceError.textContent = 'Current price cannot be negative';
      currentPriceError.style.display = 'block';
      isValid = false;
    }

    saveInvBtn.disabled = !isValid;
    return isValid;
  }

  typeSelect.addEventListener('change', () => {
    generateTypeSpecificFields(
      typeSelect.value,
      basicFieldsContainer,
      typeSpecificFields
    );
    validateInvForm();
  });

  basicFieldsContainer.addEventListener('input', validateInvForm);
  basicFieldsContainer.addEventListener('change', validateInvForm);
  basicFieldsContainer.addEventListener('blur', validateInvForm, true);
  typeSpecificFields.addEventListener('input', validateInvForm);
  typeSpecificFields.addEventListener('change', validateInvForm);
  typeSpecificFields.addEventListener('blur', validateInvForm, true);
  priceInput.addEventListener('input', validateInvForm);
  priceInput.addEventListener('blur', validateInvForm);
  currentPriceInput.addEventListener('input', validateInvForm);
  currentPriceInput.addEventListener('blur', validateInvForm);

  // Save handler
  saveInvBtn.addEventListener('click', async () => {
    const investmentType = typeSelect.value;
    const purchasePrice = Number(priceInput.value) || 0;
    const currentPrice = Number(currentPriceInput.value) || purchasePrice;
    const purchaseDate = dateInput.value
      ? new Date(dateInput.value)
      : new Date();
    const notes = notesInput.value.trim();

    const basicInputs = basicFieldsContainer.querySelectorAll('input, select');
    const typeSpecificFieldsInputs =
      typeSpecificFields.querySelectorAll('input, select');
    const formData = {};

    [...basicInputs, ...typeSpecificFieldsInputs].forEach(input => {
      if (input.value) {
        formData[input.name] =
          input.type === 'number' ? Number(input.value) : input.value;
      }
    });

    const symbol = formData.symbol || '';
    const shares = formData.shares || 0;
    const units = formData.units || 0;
    const quantity = formData.quantity || 0;

    const metadata = {
      investmentType,
      notes,
      lastPriceUpdate: currentPrice !== purchasePrice ? new Date() : null,
    };

    const typeSpecificFieldsData = typeSpecificFields.querySelectorAll(
      'input, select, textarea'
    );
    typeSpecificFieldsData.forEach(input => {
      if (input.value && input.name) {
        metadata[input.name] =
          input.type === 'number' ? Number(input.value) : input.value;
      }
    });

    let valid = true;
    typeError.style.display = 'none';
    nameError.style.display = 'none';
    valueError.style.display = 'none';
    priceError.style.display = 'none';
    currentPriceError.style.display = 'none';

    basicFieldsContainer
      .querySelectorAll('.field-error')
      .forEach(el => (el.style.display = 'none'));
    typeSpecificFields
      .querySelectorAll('.field-error')
      .forEach(el => (el.style.display = 'none'));

    if (!investmentType) {
      typeError.textContent = 'Investment type is required.';
      typeError.style.display = 'block';
      valid = false;
    }

    switch (investmentType) {
      case 'stocks':
      case 'etf':
        if (!symbol) {
          nameError.textContent = 'Symbol is required.';
          nameError.style.display = 'block';
          valid = false;
        }
        if (!(shares > 0)) {
          valueError.textContent = 'Shares must be greater than 0.';
          valueError.style.display = 'block';
          valid = false;
        }
        break;
      case 'crypto':
        if (!symbol) {
          nameError.textContent = 'Crypto symbol is required.';
          nameError.style.display = 'block';
          valid = false;
        }
        if (!(units > 0)) {
          valueError.textContent = 'Units must be greater than 0.';
          valueError.style.display = 'block';
          valid = false;
        }
        break;
      case 'commodities':
        if (!symbol) {
          nameError.textContent = 'Commodity name is required.';
          nameError.style.display = 'block';
          valid = false;
        }
        if (!(quantity > 0)) {
          valueError.textContent = 'Quantity must be greater than 0.';
          valueError.style.display = 'block';
          valid = false;
        }
        break;
      case 'bonds':
      case 'realestate':
      case 'cash':
      case 'other':
        if (!symbol) {
          nameError.textContent = 'Name is required.';
          nameError.style.display = 'block';
          valid = false;
        }
        break;
    }

    if (!(purchasePrice >= 0)) {
      priceError.textContent = 'Price must be 0 or greater.';
      priceError.style.display = 'block';
      valid = false;
    }
    if (!(currentPrice >= 0)) {
      currentPriceError.textContent = 'Current price must be 0 or greater.';
      currentPriceError.style.display = 'block';
      valid = false;
    }
    if (!valid) return;

    try {
      const quantityToUse = shares || units || quantity || 1;
      const { StorageService } = await import('../../core/storage.js');

      StorageService.addInvestment(
        symbol,
        quantityToUse,
        purchasePrice,
        purchaseDate,
        metadata
      );

      invForm.style.display = 'none';
      priceInput.value = '';
      currentPriceInput.value = '';
      dateInput.value = '';
      typeSelect.value = 'stocks';
      notesInput.value = '';
      generateTypeSpecificFields(
        'stocks',
        basicFieldsContainer,
        typeSpecificFields
      );
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
        const empty = createEnhancedEmptyState('no-data', {
          showTips: false,
        });
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

        const title = document.createElement('div');
        title.style.display = 'flex';
        title.style.alignItems = 'center';
        title.style.gap = SPACING.SM;

        const titleText = document.createElement('span');
        const assetClassRaw =
          inv.assetClass || inv.metadata?.investmentType || 'stocks';
        const assetClassName =
          assetClassRaw.charAt(0).toUpperCase() + assetClassRaw.slice(1);
        titleText.textContent = `${assetClassName} — ${inv.symbol}`;
        titleText.style.fontWeight = '600';

        const investmentType =
          inv.assetClass || inv.metadata?.investmentType || 'stocks';
        const typeBadge = document.createElement('span');
        typeBadge.textContent =
          investmentType.charAt(0).toUpperCase() + investmentType.slice(1);
        typeBadge.style.backgroundColor = COLORS.PRIMARY;
        typeBadge.style.color = '#ffffff';
        typeBadge.style.padding = '2px 8px';
        typeBadge.style.borderRadius = '12px';
        typeBadge.style.fontSize = '0.75rem';
        typeBadge.style.fontWeight = '500';
        typeBadge.style.display = 'inline-block';

        title.appendChild(titleText);
        title.appendChild(typeBadge);

        const meta = document.createElement('div');
        meta.style.fontSize = '0.9rem';
        meta.style.color = COLORS.TEXT_MUTED;

        const assetClass =
          inv.assetClass || inv.metadata?.investmentType || 'stocks';
        const currentPrice = inv.currentPrice || inv.purchasePrice;
        const priceText = assetClass === 'crypto' ? 'units' : 'shares';
        const currency = inv.currency || inv.metadata?.currency || 'EUR';

        meta.textContent = `${inv.shares} ${priceText} @ ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(currentPrice)}`;

        left.appendChild(title);
        left.appendChild(meta);

        const notes = inv.notes || inv.metadata?.notes;
        if (notes) {
          const notesEl = document.createElement('div');
          notesEl.textContent = `${notes}`;
          notesEl.style.cssText = `
            font-size: 0.85rem;
            color: ${COLORS.TEXT_MUTED};
            margin-top: 4px;
            font-style: italic;
          `;
          left.appendChild(notesEl);
        }

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = SPACING.SM;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn btn-ghost edit-investment';

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'btn btn-ghost delete-investment';

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
          form.style.boxSizing = 'border-box';

          const inputStyle = `
            width: 100%;
            padding: var(--spacing-sm);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: var(--font-size-sm);
            background: var(--color-background);
            color: var(--color-text-main);
            box-sizing: border-box;
          `;

          const labelStyle = `
            font-size: 0.8rem;
            font-weight: 500;
            color: ${COLORS.TEXT_MUTED};
            margin-bottom: 2px;
          `;

          const createFieldGroup = (label, element) => {
            const group = document.createElement('div');
            group.style.display = 'flex';
            group.style.flexDirection = 'column';
            group.style.flex = element.style.flex || '1';
            group.style.minWidth = element.style.minWidth || '0';

            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.style.cssText = labelStyle;
            labelEl.htmlFor = element.id || '';

            group.appendChild(labelEl);
            group.appendChild(element);
            return group;
          };

          const typeGroup = document.createElement('div');
          typeGroup.style.width = '100%';

          const typeLabel = document.createElement('label');
          typeLabel.textContent = 'Asset Type';
          typeLabel.style.cssText = labelStyle;

          const typeSelect = document.createElement('select');
          typeSelect.style.cssText = inputStyle;
          const assetTypes = [
            { value: 'stocks', label: 'Stocks' },
            { value: 'bonds', label: 'Bonds' },
            { value: 'etf', label: 'ETFs' },
            { value: 'realestate', label: 'Real Estate' },
            { value: 'crypto', label: 'Cryptocurrency' },
            { value: 'cash', label: 'Cash' },
            { value: 'commodities', label: 'Commodities' },
            { value: 'other', label: 'Other' },
          ];
          assetTypes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.value;
            opt.textContent = t.label;
            if (t.value === (inv.assetClass || 'stocks')) opt.selected = true;
            typeSelect.appendChild(opt);
          });

          typeGroup.appendChild(typeLabel);
          typeGroup.appendChild(typeSelect);

          const row1 = document.createElement('div');
          row1.style.display = 'flex';
          row1.style.gap = SPACING.SM;
          row1.style.width = '100%';
          row1.style.flexWrap = 'wrap';

          const symbolFld = document.createElement('input');
          symbolFld.type = 'text';
          symbolFld.placeholder = 'e.g. BTC';
          symbolFld.value = inv.symbol;
          symbolFld.id = `inv-edit-${inv.id}-symbol`;
          symbolFld.style.cssText = inputStyle;
          symbolFld.style.flex = '1';
          symbolFld.style.minWidth = '100px';

          const nameFld = document.createElement('input');
          nameFld.type = 'text';
          nameFld.placeholder = 'e.g. Bitcoin';
          nameFld.value = inv.name || '';
          nameFld.id = `inv-edit-${inv.id}-name`;
          nameFld.style.cssText = inputStyle;
          nameFld.style.flex = '2';
          nameFld.style.minWidth = '120px';

          row1.appendChild(createFieldGroup('Symbol', symbolFld));
          row1.appendChild(createFieldGroup('Name', nameFld));

          const row2 = document.createElement('div');
          row2.style.display = 'flex';
          row2.style.gap = SPACING.SM;
          row2.style.width = '100%';
          row2.style.flexWrap = 'wrap';

          const qtyLabel = inv.assetClass === 'crypto' ? 'Units' : 'Shares';
          const qtyFld = document.createElement('input');
          qtyFld.type = 'number';
          qtyFld.placeholder = qtyLabel;
          qtyFld.step = inv.assetClass === 'crypto' ? '0.0001' : '1';
          qtyFld.value = inv.shares;
          qtyFld.id = `inv-edit-${inv.id}-qty`;
          qtyFld.style.cssText = inputStyle;
          qtyFld.style.flex = '1';
          qtyFld.style.minWidth = '80px';

          const purchasePriceFld = document.createElement('input');
          purchasePriceFld.type = 'number';
          purchasePriceFld.placeholder = '0.00';
          purchasePriceFld.step = '0.01';
          purchasePriceFld.value = inv.purchasePrice || 0;
          purchasePriceFld.id = `inv-edit-${inv.id}-purchasePrice`;
          purchasePriceFld.style.cssText = inputStyle;
          purchasePriceFld.style.flex = '1';
          purchasePriceFld.style.minWidth = '90px';

          const currentPriceFld = document.createElement('input');
          currentPriceFld.type = 'number';
          currentPriceFld.placeholder = '0.00';
          currentPriceFld.step = '0.01';
          currentPriceFld.value = inv.currentPrice || inv.purchasePrice || 0;
          currentPriceFld.id = `inv-edit-${inv.id}-currentPrice`;
          currentPriceFld.style.cssText = inputStyle;
          currentPriceFld.style.flex = '1';
          currentPriceFld.style.minWidth = '90px';

          row2.appendChild(createFieldGroup(qtyLabel, qtyFld));
          row2.appendChild(
            createFieldGroup('Purchase Price', purchasePriceFld)
          );
          row2.appendChild(createFieldGroup('Current Price', currentPriceFld));

          const row3 = document.createElement('div');
          row3.style.display = 'flex';
          row3.style.gap = SPACING.SM;
          row3.style.width = '100%';
          row3.style.flexWrap = 'wrap';

          const exchangeFld = document.createElement('select');
          exchangeFld.style.cssText = inputStyle;
          exchangeFld.id = `inv-edit-${inv.id}-exchange`;
          exchangeFld.style.flex = '1';
          exchangeFld.style.minWidth = '120px';
          const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Other'];
          const currentExchange = inv.metadata?.exchange || '';
          const defaultOpt = document.createElement('option');
          defaultOpt.value = '';
          defaultOpt.textContent = 'No exchange';
          exchangeFld.appendChild(defaultOpt);
          exchanges.forEach(ex => {
            const opt = document.createElement('option');
            opt.value = ex.toLowerCase();
            opt.textContent = ex;
            if (ex.toLowerCase() === currentExchange.toLowerCase())
              opt.selected = true;
            exchangeFld.appendChild(opt);
          });

          const dateFld = document.createElement('input');
          dateFld.type = 'date';
          dateFld.value = inv.purchaseDate
            ? new Date(inv.purchaseDate).toISOString().split('T')[0]
            : '';
          dateFld.id = `inv-edit-${inv.id}-date`;
          dateFld.style.cssText = inputStyle;
          dateFld.style.flex = '1';
          dateFld.style.minWidth = '120px';

          row3.appendChild(createFieldGroup('Exchange', exchangeFld));
          row3.appendChild(createFieldGroup('Purchase Date', dateFld));

          const notesGroup = document.createElement('div');
          notesGroup.style.width = '100%';
          const notesLabel = document.createElement('label');
          notesLabel.textContent = 'Notes';
          notesLabel.style.cssText = labelStyle;
          const notesTextarea = document.createElement('textarea');
          notesTextarea.placeholder = 'Optional notes...';
          notesTextarea.value = inv.notes || inv.metadata?.notes || '';
          notesTextarea.id = `inv-edit-${inv.id}-notes`;
          notesTextarea.style.cssText = `${inputStyle}
            resize: vertical;
            min-height: 48px;
          `;
          notesGroup.appendChild(notesLabel);
          notesGroup.appendChild(notesTextarea);

          const btnRow = document.createElement('div');
          btnRow.style.display = 'flex';
          btnRow.style.gap = SPACING.SM;
          btnRow.style.width = '100%';

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

          form.appendChild(typeGroup);
          form.appendChild(row1);
          form.appendChild(row2);
          form.appendChild(row3);
          form.appendChild(notesGroup);
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
            const newType = typeSelect.value;
            const newSymbol = symbolFld.value.trim().toUpperCase();
            const newName = nameFld.value.trim() || newSymbol;
            const newQty = Number(qtyFld.value) || 0;
            const newPurchasePrice = Number(purchasePriceFld.value) || 0;
            const newCurrentPrice =
              Number(currentPriceFld.value) || newPurchasePrice;
            const newExchange = exchangeFld.value;
            const newDate = dateFld.value
              ? new Date(dateFld.value)
              : inv.purchaseDate;
            const newNotes = notesTextarea.value.trim();

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
            if (!(newQty > 0)) {
              import('../../components/ConfirmDialog.js')
                .then(({ AlertDialog }) => {
                  AlertDialog({
                    title: 'Invalid input',
                    message: 'Quantity must be greater than 0.',
                  });
                })
                .catch(err => console.error('Failed to show alert:', err));
              return;
            }
            if (!(newPurchasePrice > 0)) {
              import('../../components/ConfirmDialog.js')
                .then(({ AlertDialog }) => {
                  AlertDialog({
                    title: 'Invalid input',
                    message: 'Purchase price must be greater than 0.',
                  });
                })
                .catch(err => console.error('Failed to show alert:', err));
              return;
            }

            try {
              const { StorageService } = await import('../../core/storage.js');
              StorageService.updateInvestment(inv.id, {
                symbol: newSymbol,
                name: newName,
                shares: newQty,
                purchasePrice: newPurchasePrice,
                currentPrice: newCurrentPrice,
                assetClass: newType,
                purchaseDate: newDate,
                notes: newNotes,
              });
              const updatedMetadata = {
                ...(inv.metadata || {}),
                notes: newNotes,
              };
              if (newExchange) {
                updatedMetadata.exchange = newExchange;
              }
              StorageService.updateInvestment(inv.id, {
                metadata: updatedMetadata,
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
                      .catch(error => {
                        console.error('Error loading AlertDialog:', error);
                      });
                  }
                },
                onCancel: () => {
                  console.log(
                    `[InvestmentsSection] Cancelled deletion of: ${inv.symbol}`
                  );
                },
              });
            })
            .catch(err => {
              console.error('Failed to load confirmation dialog:', err);
              import('../../components/ConfirmDialog.js')
                .then(({ AlertDialog }) => {
                  AlertDialog({
                    title: 'Error',
                    message:
                      'Unable to open confirmation dialog — please try again.',
                  });
                })
                .catch(error => {
                  console.error('Error loading AlertDialog:', error);
                });
            });
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
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @returns {HTMLElement} DOM element containing investments section content
 */
export const InvestmentsSection = async (chartRenderer, activeCharts) => {
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

  // Add total portfolio value
  let totalValue = 0;
  try {
    const { StorageService } = await import('../../core/storage.js');
    const summary = StorageService.calculatePortfolioSummary();
    totalValue = summary.totalValue || 0;
  } catch (err) {
    console.warn('Error fetching portfolio summary:', err);
  }

  const stats = document.createElement('div');
  stats.className = 'portfolio-stats';
  stats.style.display = 'flex';
  stats.style.gap = SPACING.MD;
  stats.style.marginBottom = SPACING.MD;

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

  stats.appendChild(totalVal);
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