/**
 * Core persisted data shapes. These JSDoc typedefs document the model; they
 * are not runtime validators.
 *
 * @typedef {'expense'|'income'|'transfer'|'refund'} TransactionType
 *
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {number} amount
 * @property {string|null} category Transfers may omit a category.
 * @property {TransactionType} type
 * @property {string} accountId
 * @property {string} [toAccountId] Destination account for transfers.
 * @property {string} timestamp ISO date-time.
 * @property {string} [note]
 * @property {string[]} [tags] Optional expense flag; at most one flag name.
 *
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {'expense'|'income'} type
 * @property {string} color
 * @property {boolean} showAsCheckbox Expense flag categories only.
 *
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {boolean} isDefault
 *
 * @typedef {Object} Settings
 * @property {'US'|'EU'|'ISO'} [dateFormat]
 * @property {string} [theme]
 */

export {};
