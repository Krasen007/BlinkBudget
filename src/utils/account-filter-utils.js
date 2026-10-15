/**
 * Account Filter Utilities
 *
 * The dashboard account filter (persisted in sessionStorage) can hold three
 * shapes of value:
 *   - 'all'                        → every account
 *   - '<accountId>'                → a single account
 *   - 'type:<accountType>'         → every account of one type, set by the
 *                                    "Explore Accounts" section in Reports
 *
 * These helpers keep the parsing/validation in one place so the dashboard,
 * the reports view and the tests agree on the format.
 */

export const ALL_ACCOUNTS_FILTER = 'all';
export const ACCOUNT_TYPE_FILTER_PREFIX = 'type:';

/**
 * Build the filter value that selects every account of a given type.
 * @param {string} accountType - e.g. 'cash', 'checking'
 * @returns {string}
 */
export const buildAccountTypeFilter = accountType =>
  `${ACCOUNT_TYPE_FILTER_PREFIX}${accountType}`;

/**
 * Is this filter value an account-type filter?
 * @param {string} filter
 * @returns {boolean}
 */
export const isAccountTypeFilter = filter =>
  typeof filter === 'string' && filter.startsWith(ACCOUNT_TYPE_FILTER_PREFIX);

/**
 * Extract the account type from a filter value.
 * @param {string} filter
 * @returns {string|null} The account type, or null for non type filters
 */
export const getAccountTypeFromFilter = filter =>
  isAccountTypeFilter(filter)
    ? filter.slice(ACCOUNT_TYPE_FILTER_PREFIX.length)
    : null;

/**
 * Normalize an account type for comparisons ('credit card' vs 'credit').
 * @param {string} accountType
 * @returns {string}
 */
export const normalizeAccountType = accountType => {
  if (!accountType) return 'other';
  return accountType === 'credit card' ? 'credit' : accountType;
};

/**
 * Resolve a filter value into the set of account ids it selects.
 * @param {string} filter - 'all' | account id | 'type:<accountType>'
 * @param {Array} accounts - Accounts list
 * @returns {Set<string>|null} null when the filter covers every account
 */
export const resolveAccountIdsForFilter = (filter, accounts = []) => {
  if (!filter || filter === ALL_ACCOUNTS_FILTER) return null;

  const accountType = getAccountTypeFromFilter(filter);
  if (accountType) {
    const normalizedType = normalizeAccountType(accountType);
    return new Set(
      accounts
        .filter(
          account => normalizeAccountType(account.type) === normalizedType
        )
        .map(account => account.id)
    );
  }

  return new Set([filter]);
};

/**
 * Is the filter still valid for the given accounts? A stale filter (deleted
 * account, or an account type with no accounts left) must fall back to 'all'
 * so the selected name and the shown amount stay in sync.
 * @param {string} filter
 * @param {Array} accounts
 * @returns {boolean}
 */
export const isAccountFilterValid = (filter, accounts = []) => {
  if (!filter || filter === ALL_ACCOUNTS_FILTER) return true;

  const accountType = getAccountTypeFromFilter(filter);
  if (accountType) {
    const normalizedType = normalizeAccountType(accountType);
    return accounts.some(
      account => normalizeAccountType(account.type) === normalizedType
    );
  }

  return accounts.some(account => account.id === filter);
};

/**
 * Does a transaction belong to the accounts selected by the filter?
 * A transfer touches two accounts, so either side counts.
 * @param {string} filter
 * @param {Array} accounts
 * @param {Object} transaction
 * @returns {boolean}
 */
export const transactionMatchesAccountFilter = (
  filter,
  accounts,
  transaction
) => {
  const accountIds = resolveAccountIdsForFilter(filter, accounts);
  if (!accountIds) return true;
  if (!transaction) return false;

  return (
    (transaction.accountId != null && accountIds.has(transaction.accountId)) ||
    (transaction.toAccountId != null && accountIds.has(transaction.toAccountId))
  );
};

/**
 * Single account id that the add-transaction form should be pre-filled with.
 * Returns null when the filter spans several accounts ('all', or an account
 * type with more than one account) so the form falls back to its own default.
 * @param {string} filter
 * @param {Array} accounts
 * @returns {string|null}
 */
export const resolvePreferredAccountId = (filter, accounts = []) => {
  if (!filter || filter === ALL_ACCOUNTS_FILTER) return null;

  const accountType = getAccountTypeFromFilter(filter);
  if (accountType) {
    const normalizedType = normalizeAccountType(accountType);
    const match = accounts.find(
      account => normalizeAccountType(account.type) === normalizedType
    );
    return match ? match.id : null;
  }

  return accounts.some(account => account.id === filter) ? filter : null;
};
