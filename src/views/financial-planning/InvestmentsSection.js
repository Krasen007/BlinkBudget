/**
 * Investments Section - Portfolio Tracking
 *
 * Extracted from FinancialPlanningView.js for better maintainability.
 * Displays investment portfolio with CRUD operations and charts.
 *
 * Responsibilities:
 * - Portfolio composition chart
 * - Complex investment form with type-specific fields
 * - Investment CRUD operations (Create, Read, Update, Delete)
 * - Investment list management and editing
 */

import { COLORS, SPACING } from '../../utils/constants.js';
import { createPortfolioCompositionChart } from '../../utils/financial-planning-charts.js';
import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
} from '../../utils/financial-planning-helpers.js';
import { refreshChart } from '../../utils/chart-refresh-helper.js';

/**
 * Transform portfolio data from StorageService to the format expected by the chart
 * @param {Object} portfolioData - Raw portfolio data from StorageService
 * @returns {Object} Transformed portfolio data for chart rendering
 */
function transformPortfolioData(portfolioData) {
  if (
    !portfolioData ||
    !portfolioData.totalValue ||
    !portfolioData.assetAllocation
  ) {
    return {
      totalValue: 0,
      assetAllocation: {},
    };
  }
  return {
    totalValue: portfolioData.totalValue,
    assetAllocation:
      portfolioData.assetAllocation.assetAllocation ||
      portfolioData.assetAllocation,
  };
}

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
  // Clear both containers
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
function createInvestmentFormControls(chartRenderer, activeCharts) {
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
  invForm.appendChild(nameError); // Added nameError here
  invForm.appendChild(priceInput);
  invForm.appendChild(priceError);
  invForm.appendChild(currentPriceInput);
  invForm.appendChild(currentPriceError);
  invForm.appendChild(typeSpecificFields);
  invForm.appendChild(valueError); // Added valueError here
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

    // Get basic fields dynamically
    const basicInputs = basicFieldsContainer.querySelectorAll('input, select');
    const typeSpecificInputs =
      typeSpecificFields.querySelectorAll('input, select');
    const formData = {};

    // Collect from both containers
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

    // Clear all errors first
    typeError.style.display = 'none';
    nameError.style.display = 'none';
    valueError.style.display = 'none';
    priceError.style.display = 'none';
    currentPriceError.style.display = 'none';

    // Type-specific validation with helpful messages
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

    // Validate price fields
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

  // Event listeners for real-time validation
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

    // Collect basic fields dynamically
    const basicInputs = basicFieldsContainer.querySelectorAll('input, select');
    const typeSpecificFieldsInputs =
      typeSpecificFields.querySelectorAll('input, select');
    const formData = {};

    // Collect from both containers
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

    // Collect type-specific metadata
    const metadata = {
      investmentType,
      notes,
      lastPriceUpdate: currentPrice !== purchasePrice ? new Date() : null,
    };

    // Collect type-specific fields
    const typeSpecificFieldsData = typeSpecificFields.querySelectorAll(
      'input, select, textarea'
    );
    typeSpecificFieldsData.forEach(input => {
      if (input.value && input.name) {
        metadata[input.name] =
          input.type === 'number' ? Number(input.value) : input.value;
      }
    });

    // Type-specific validation
    let valid = true;
    // Reset errors
    typeError.style.display = 'none';
    nameError.style.display = 'none';
    valueError.style.display = 'none';
    priceError.style.display = 'none';
    currentPriceError.style.display = 'none';

    // Clear all dynamic field errors
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

    // Validate based on investment type
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
      // Use appropriate quantity field based on type
      const quantityToUse = shares || units || quantity || 1;

      // Import StorageService dynamically to avoid circular dependency
      const { StorageService } = await import('../../core/storage.js');

      StorageService.addInvestment(
        symbol,
        quantityToUse,
        purchasePrice,
        purchaseDate,
        metadata
      );

      // Refresh portfolio chart using helper
      const updated = StorageService.calculatePortfolioSummary();
      const portfolioToRender = transformPortfolioData(updated);
      await refreshChart({
        createChartFn: createPortfolioCompositionChart,
        chartRenderer,
        data: portfolioToRender,
        section: document.querySelector('.investments-section'),
        chartType: 'portfolio-composition',
        activeCharts,
      });

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

  return { controls, investmentsList: null };
}

/**
 * Create investments list with CRUD operations
 */
function createInvestmentsList(chartRenderer, activeCharts) {
  const investmentsList = document.createElement('div');
  investmentsList.className = 'investment-list';
  investmentsList.style.marginTop = SPACING.MD;

  async function refreshInvestmentsList() {
    investmentsList.innerHTML = '';
    let items = [];
    try {
      // Import StorageService dynamically
      const { StorageService } = await import('../../core/storage.js');
      items = StorageService.getInvestments() || [];

      if (!items.length) {
        const empty = document.createElement('div');
        empty.textContent = 'No investments yet.';
        empty.style.color = COLORS.TEXT_MUTED;
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

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.flexDirection = 'column';

        const title = document.createElement('div');
        title.style.display = 'flex';
        title.style.alignItems = 'center';
        title.style.gap = SPACING.SM;

        const titleText = document.createElement('span');
        titleText.textContent = `${inv.symbol} · ${inv.name}`;
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
        const assetClassLabel =
          assetClass.charAt(0).toUpperCase() + assetClass.slice(1);
        const currentPrice = inv.currentPrice || inv.purchasePrice;
        const priceText = assetClass === 'crypto' ? 'units' : 'shares';

        meta.textContent = `${assetClassLabel} · ${inv.shares} ${priceText} @ ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(currentPrice)}`;

        // Add last updated indicator if price was manually updated
        if (inv.metadata?.lastPriceUpdate) {
          const updateIndicator = document.createElement('span');
          updateIndicator.textContent = ' • Updated';
          updateIndicator.style.color = COLORS.SUCCESS;
          updateIndicator.style.fontSize = '0.8rem';
          meta.appendChild(updateIndicator);
        }

        left.appendChild(title);
        left.appendChild(meta);

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

        // Performance chart for each item if data exists
        if (inv.performance && Array.isArray(inv.performance)) {
          const perfContainer = document.createElement('div');
          perfContainer.className = 'performance-chart';
          perfContainer.style.height = '60px';
          perfContainer.style.marginTop = SPACING.XS;
          li.appendChild(perfContainer);

          const perfCanvas = document.createElement('canvas');
          perfContainer.appendChild(perfCanvas);

          const perfData = {
            labels: inv.performance.map((_, i) => i),
            datasets: [
              {
                data: inv.performance,
                borderColor: COLORS.SUCCESS,
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0.4,
              },
            ],
          };

          chartRenderer.createLineChart(perfCanvas, perfData, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false },
            },
            scales: { x: { display: false }, y: { display: false } },
          });
        }

        // Edit handler
        editBtn.addEventListener('click', () => {
          if (li._editing) return;
          li._editing = true;

          // Hide view mode elements
          left.style.display = 'none';
          actions.style.display = 'none';

          const form = document.createElement('div');
          form.style.display = 'flex';
          form.style.gap = SPACING.SM;
          form.style.flexWrap = 'wrap';
          form.style.alignItems = 'center';
          form.style.width = '100%';
          form.style.boxSizing = 'border-box';

          const nameDisplay = document.createElement('div');
          nameDisplay.textContent = `${inv.symbol} · ${inv.name}`;
          nameDisplay.style.fontWeight = '600';
          nameDisplay.style.width = '100%';
          nameDisplay.style.marginBottom = '4px';

          const sharesFld = document.createElement('input');
          sharesFld.type = 'number';
          sharesFld.value = inv.shares;
          sharesFld.style.width = '80px';

          const priceFld = document.createElement('input');
          priceFld.type = 'number';
          priceFld.value = inv.purchasePrice || inv.currentPrice || 0;
          priceFld.style.width = '120px';

          const saveBtn = document.createElement('button');
          saveBtn.textContent = 'Save';
          saveBtn.className = 'btn btn-primary';

          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.className = 'btn btn-ghost';

          form.appendChild(nameDisplay);
          form.appendChild(sharesFld);
          form.appendChild(priceFld);
          form.appendChild(saveBtn);
          form.appendChild(cancelBtn);

          li.appendChild(form);

          const cleanupEdit = () => {
            li._editing = false;
            form.remove();
            left.style.display = 'flex';
            actions.style.display = 'flex';
          };

          cancelBtn.addEventListener('click', cleanupEdit);

          saveBtn.addEventListener('click', async () => {
            const newShares = Number(sharesFld.value) || 0;
            const newPrice = Number(priceFld.value) || 0;

            // Basic validation
            let isValid = true;
            if (!inv.symbol) {
              // Assuming inv.symbol is the 'name' for existing items
              // This error display would need to be added to the edit form if needed
              console.error('Symbol/Name is required for existing investment.');
              isValid = false;
            }
            if (!(newShares > 0 && newPrice > 0)) {
              // This error display would need to be added to the edit form if needed
              console.error('Shares and price must be greater than 0.');
              isValid = false;
            }

            if (!isValid) return;

            try {
              const { StorageService } = await import('../../core/storage.js');
              StorageService.updateInvestment(inv.id, {
                shares: newShares,
                purchasePrice: newPrice,
                currentPrice: newPrice,
              });

              // Refresh chart and list using helper
              const updated = StorageService.calculatePortfolioSummary();
              const portfolioToRender = transformPortfolioData(updated);
              await refreshChart({
                createChartFn: createPortfolioCompositionChart,
                chartRenderer,
                data: portfolioToRender,
                section: document.querySelector('.investments-section'),
                chartType: 'portfolio-composition',
                activeCharts,
              });

              cleanupEdit();
              refreshInvestmentsList();
            } catch (err) {
              console.error('Failed to update investment', err);
            }
          });
        });

        // Delete handler
        delBtn.addEventListener('click', async () => {
          try {
            const { StorageService } = await import('../../core/storage.js');
            StorageService.removeInvestment(inv.symbol);

            // Refresh chart using helper
            const updated = StorageService.calculatePortfolioSummary();
            const portfolioToRender = transformPortfolioData(updated);
            await refreshChart({
              createChartFn: createPortfolioCompositionChart,
              chartRenderer,
              data: portfolioToRender,
              section: document.querySelector('.investments-section'),
              chartType: 'portfolio-composition',
              activeCharts,
            });

            refreshInvestmentsList();
          } catch (err) {
            console.error('Failed to remove investment', err);
          }
        });
      });

      investmentsList.appendChild(ul);
    } catch (err) {
      console.warn('Error loading investments for list:', err);
      const empty = document.createElement('div');
      empty.textContent = 'Error loading investments.';
      empty.style.color = COLORS.ERROR;
      investmentsList.appendChild(empty);
    }
  }

  // Return both the element and a way to populate it
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

  // Add a helper class for tests
  const portfolioChartPlaceholder = document.createElement('div');
  portfolioChartPlaceholder.className = 'portfolio-chart';
  portfolioChartPlaceholder.style.display = 'none';
  section.appendChild(portfolioChartPlaceholder);

  section.appendChild(
    createUsageNote(
      'Track manual investments here. Add holdings with symbol, shares, and purchase price. Edits sync to cloud; deletions remove from cloud. Charts update automatically.'
    )
  );

  // Try to load real portfolio summary from StorageService
  let portfolioData;
  try {
    // Import StorageService dynamically
    const { StorageService } = await import('../../core/storage.js');
    portfolioData = StorageService.calculatePortfolioSummary();
    console.log('Loaded portfolio data:', portfolioData);
  } catch (err) {
    console.warn('Error fetching portfolio summary from StorageService:', err);
    portfolioData = null;
  }

  const portfolioToRender = transformPortfolioData(portfolioData);

  // Create portfolio composition chart
  try {
    const { section: chartSection, chart } =
      await createPortfolioCompositionChart(chartRenderer, portfolioToRender);
    chartSection.classList.add('portfolio-chart'); // Add class for tests
    section.appendChild(chartSection);
    activeCharts.set('portfolio-composition', chart);
  } catch (error) {
    console.error('Error creating portfolio composition chart:', error);
  }

  // Add investment controls
  const { controls } = createInvestmentFormControls(
    chartRenderer,
    activeCharts
  );
  section.appendChild(controls);

  // Add investments list
  const { investmentsList, refreshInvestmentsList } = createInvestmentsList(
    chartRenderer,
    activeCharts
  );
  investmentsList.className = 'investment-list';
  section.appendChild(investmentsList);

  // Initial population of the list
  await refreshInvestmentsList();

  // Add portfolio statistics
  const stats = document.createElement('div');
  stats.className = 'portfolio-stats';
  stats.style.display = 'flex';
  stats.style.gap = SPACING.MD;
  stats.style.marginBottom = SPACING.MD;

  const totalVal = document.createElement('div');
  totalVal.className = 'total-portfolio-value';
  totalVal.innerHTML = `Total: <span class="currency-value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(portfolioToRender.totalValue)}</span>`;

  const assetCnt = document.createElement('div');
  assetCnt.className = 'asset-count';
  assetCnt.textContent = `Assets: ${Object.keys(portfolioToRender.assetAllocation).length}`;

  stats.appendChild(totalVal);
  stats.appendChild(assetCnt);
  section.insertBefore(stats, controls);

  // Add insights
  const insights = document.createElement('div');
  insights.className = 'investment-insights';
  insights.style.marginTop = SPACING.MD;
  insights.style.padding = SPACING.MD;
  insights.style.background = COLORS.SURFACE;
  insights.style.borderRadius = 'var(--radius-md)';

  const highConcentration = Object.values(
    portfolioToRender.assetAllocation
  ).some(val => val / portfolioToRender.totalValue > 0.7);
  if (highConcentration) {
    insights.innerHTML = `
      <h4 style="margin-top:0">Portfolio Insights</h4>
      <p style="font-size:0.9rem; color: ${COLORS.WARNING}"><strong>Concentration Risk:</strong> Consider more diversification to reduce risk.</p>
    `;
  } else {
    insights.innerHTML = `
      <h4 style="margin-top:0">Portfolio Insights</h4>
      <p style="font-size:0.9rem; color: ${COLORS.SUCCESS}"><strong>Good Diversification:</strong> Your portfolio allocation is well-balanced.</p>
    `;
  }
  section.appendChild(insights);

  const hasInvestments =
    portfolioToRender.totalValue > 0 ||
    Object.keys(portfolioToRender.assetAllocation).length > 0;
  if (!hasInvestments) {
    const placeholder = createPlaceholder(
      'No Investments Yet',
      'Start tracking your portfolio by adding your first investment holdings.',
      '💰'
    );
    section.appendChild(placeholder);
  }

  return section;
};
