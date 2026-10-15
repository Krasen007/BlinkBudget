/**
 * AccountTypeCard Component
 *
 * Card for a single account type (Cash, Checking Account, ...) inside the
 * "Explore Accounts" section of Reports. Visually mirrors CategoryCard so the
 * three Explore sections read as one surface, and reuses the `category-card`
 * class for the shared border/hover treatment.
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';

/**
 * Create an account-type card
 * @param {Object} accountType - Account type breakdown entry
 * @param {Function} onClick - Click handler receiving the entry
 * @returns {HTMLButtonElement}
 */
export const AccountTypeCard = (accountType, onClick = () => {}) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'category-card account-type-card';
  card.setAttribute('data-account-type', accountType.type || 'other');
  card.style.setProperty(
    '--category-color',
    accountType.color || COLORS.PRIMARY
  );

  card.addEventListener('click', () => onClick(accountType));

  const name = document.createElement('div');
  name.className = 'category-name';
  name.textContent = accountType.name;
  name.style.fontSize = FONT_SIZES.SM;
  name.style.fontWeight = 'bold';
  name.style.color = COLORS.TEXT_MAIN;
  name.style.textAlign = 'center';
  card.appendChild(name);

  const isNetCredit = accountType.amount <= 0;

  const amount = document.createElement('div');
  amount.className = 'category-amount';
  amount.textContent = formatCurrency(Math.abs(accountType.amount));
  amount.style.fontSize = FONT_SIZES.LG;
  amount.style.fontWeight = 'bold';
  // Green for net refund/credit types, default text otherwise
  amount.style.color = isNetCredit ? COLORS.SUCCESS : COLORS.TEXT_MAIN;
  amount.style.textAlign = 'center';
  card.appendChild(amount);

  if (isNetCredit) {
    const creditLabel = document.createElement('div');
    creditLabel.style.fontSize = '0.7rem';
    creditLabel.style.color = COLORS.SUCCESS;
    creditLabel.style.textAlign = 'center';
    creditLabel.style.fontWeight = 'bold';
    creditLabel.style.textTransform = 'uppercase';
    creditLabel.style.letterSpacing = '0.05em';
    creditLabel.textContent = 'Net Refund';
    card.appendChild(creditLabel);
  }

  if (!isNetCredit && accountType.percentage > 0) {
    const percentage = document.createElement('div');
    percentage.className = 'category-percentage';
    percentage.textContent = `${accountType.percentage.toFixed(1)}% of expenses`;
    percentage.style.fontSize = '0.75rem';
    percentage.style.color = COLORS.TEXT_MUTED;
    percentage.style.textAlign = 'center';
    card.appendChild(percentage);
  }

  const count = document.createElement('div');
  count.style.fontSize = '0.75rem';
  count.style.color = COLORS.TEXT_MUTED;
  count.style.textAlign = 'center';
  const transactionCount = accountType.transactionCount ?? 0;
  if (transactionCount > 0) {
    count.textContent = `${transactionCount} transaction${transactionCount > 1 ? 's' : ''}`;
  }
  card.appendChild(count);

  // Only worth spelling out when the type covers more than one account
  if (accountType.accountCount > 1) {
    const accountsLabel = document.createElement('div');
    accountsLabel.style.fontSize = '0.75rem';
    accountsLabel.style.color = COLORS.TEXT_MUTED;
    accountsLabel.style.textAlign = 'center';
    accountsLabel.style.marginTop = SPACING.XS;
    accountsLabel.textContent = `across ${accountType.accountCount} accounts`;
    card.appendChild(accountsLabel);
  }

  return card;
};
