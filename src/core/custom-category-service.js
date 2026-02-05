/**
 * CustomCategoryService
 * Manages custom categories, their properties, and persistence.
 * Allows users to create, edit, delete, and organize categories.
 */

import { STORAGE_KEYS } from '../utils/constants.js';
import { SyncService } from './sync-service.js';
import { AuthService } from './auth-service.js';
import { generateId } from '../utils/id-utils.js';
import { safeJsonParse } from '../utils/security-utils.js';
import { auditService, auditEvents } from './audit-service.js';

const CUSTOM_CATEGORIES_KEY =
  STORAGE_KEYS.CUSTOM_CATEGORIES || 'custom_categories';

export const CustomCategoryService = {
  /**
   * Get all custom categories
   * @returns {Array} List of custom categories
   */
  getAll() {
    const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const categories = data ? safeJsonParse(data) : [];

    // Filter categories for current user
    const currentUserId = AuthService.getUserId();
    return categories.filter(
      cat => !cat.userId || cat.userId === currentUserId
    );
  },

  /**
   * Get a specific category by ID
   * @param {string} id - Category ID
   * @returns {Object|null} Category or null if not found
   */
  get(id) {
    const categories = this.getAll();
    return categories.find(cat => cat.id === id) || null;
  },

  /**
   * Get categories by type (expense/income)
   * @param {string} type - Category type ('expense', 'income', 'all')
   * @returns {Array} List of categories of specified type
   */
  getByType(type = 'all') {
    const categories = this.getAll();
    if (type === 'all') {
      return categories;
    }
    return categories.filter(cat => cat.type === type);
  },

  /**
   * Add a new custom category
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.name - Category name
   * @param {string} categoryData.type - Category type ('expense' or 'income')
   * @param {string} categoryData.color - Category color (hex)
   * @param {string} categoryData.icon - Category icon name
   * @param {string} categoryData.description - Category description (optional)
   * @returns {Object} Created category
   */
  add(categoryData) {
    const categories = this.getAll();

    // Check for duplicate names
    const existingCategory = categories.find(
      cat => cat.name.toLowerCase() === categoryData.name.toLowerCase()
    );

    if (existingCategory) {
      throw new Error(`Category "${categoryData.name}" already exists`);
    }

    const newCategory = {
      id: generateId(),
      name: categoryData.name.trim(),
      type: categoryData.type || 'expense',
      color: categoryData.color || this.generateDefaultColor(),
      icon: categoryData.icon || 'default',
      description: categoryData.description || '',
      isCustom: true,
      isSystem: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: AuthService.getUserId(),
      usageCount: 0,
    };

    categories.push(newCategory);
    this._persist(categories);

    // Audit log category creation
    auditService.log(
      auditEvents.DATA_CREATE,
      {
        entityType: 'category',
        entityId: newCategory.id,
        name: newCategory.name,
        type: newCategory.type,
      },
      AuthService.getUserId(),
      'low'
    );

    return newCategory;
  },

  /**
   * Update an existing category
   * @param {string} id - Category ID
   * @param {Object} updates - Updated fields
   * @returns {Object|null} Updated category or null if not found
   */
  update(id, updates) {
    const categories = this.getAll();
    const index = categories.findIndex(cat => cat.id === id);

    if (index === -1) {
      return null;
    }

    const originalCategory = categories[index];

    // Don't allow updating system categories
    if (originalCategory.isSystem) {
      throw new Error('Cannot update system categories');
    }

    // Check for duplicate names (excluding current category)
    if (updates.name) {
      const duplicateCategory = categories.find(
        cat =>
          cat.id !== id && cat.name.toLowerCase() === updates.name.toLowerCase()
      );

      if (duplicateCategory) {
        throw new Error(`Category "${updates.name}" already exists`);
      }
    }

    categories[index] = {
      ...categories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this._persist(categories);

    // Audit log category update
    auditService.log(
      auditEvents.DATA_UPDATE,
      {
        entityType: 'category',
        entityId: id,
        changes: Object.keys(updates),
        originalName: originalCategory.name,
        newName: updates.name || originalCategory.name,
      },
      AuthService.getUserId(),
      'low'
    );

    return categories[index];
  },

  /**
   * Delete a category
   * @param {string} id - Category ID
   * @param {boolean} force - Force delete even if category is in use
   * @returns {boolean} True if deleted successfully
   */
  remove(id, force = false) {
    const categories = this.getAll();
    const category = categories.find(cat => cat.id === id);

    if (!category) {
      return false;
    }

    // Don't allow deleting system categories
    if (category.isSystem) {
      throw new Error('Cannot delete system categories');
    }

    // Check if category is in use (unless force delete)
    if (!force && category.usageCount > 0) {
      throw new Error(
        `Cannot delete category "${category.name}" as it is used in ${category.usageCount} transactions`
      );
    }

    const filteredCategories = categories.filter(cat => cat.id !== id);
    this._persist(filteredCategories);

    // Audit log category deletion
    auditService.log(
      auditEvents.DATA_DELETE,
      {
        entityType: 'category',
        entityId: id,
        name: category.name,
        usageCount: category.usageCount,
      },
      AuthService.getUserId(),
      'medium'
    );

    return true;
  },

  /**
   * Increment usage count for a category
   * @param {string} categoryName - Category name
   */
  incrementUsage(categoryName) {
    const categories = this.getAll();
    const category = categories.find(cat => cat.name === categoryName);

    if (category) {
      category.usageCount = (category.usageCount || 0) + 1;
      category.updatedAt = new Date().toISOString();
      this._persist(categories);
    }
  },

  /**
   * Decrement usage count for a category
   * @param {string} categoryName - Category name
   */
  decrementUsage(categoryName) {
    const categories = this.getAll();
    const category = categories.find(cat => cat.name === categoryName);

    if (category && category.usageCount > 0) {
      category.usageCount = Math.max(0, category.usageCount - 1);
      category.updatedAt = new Date().toISOString();
      this._persist(categories);
    }
  },

  /**
   * Get all category names (including system categories)
   * @param {string} type - Filter by type ('expense', 'income', 'all')
   * @returns {Array} List of category names
   */
  getAllCategoryNames(type = 'all') {
    const customCategories = this.getByType(type);
    const systemCategories = this.getSystemCategories(type);

    return [
      ...systemCategories.map(cat => cat.name),
      ...customCategories.map(cat => cat.name),
    ];
  },

  /**
   * Get system (built-in) categories
   * @param {string} type - Filter by type ('expense', 'income', 'all')
   * @returns {Array} List of system categories
   */
  getSystemCategories(type = 'all') {
    const systemExpenseCategories = [
      {
        name: 'Food & Dining',
        type: 'expense',
        icon: 'restaurant',
        color: '#ef4444',
      },
      {
        name: 'Transportation',
        type: 'expense',
        icon: 'car',
        color: '#f59e0b',
      },
      {
        name: 'Shopping',
        type: 'expense',
        icon: 'shopping-bag',
        color: '#8b5cf6',
      },
      {
        name: 'Entertainment',
        type: 'expense',
        icon: 'film',
        color: '#ec4899',
      },
      {
        name: 'Bills & Utilities',
        type: 'expense',
        icon: 'file-text',
        color: '#3b82f6',
      },
      { name: 'Healthcare', type: 'expense', icon: 'heart', color: '#10b981' },
      { name: 'Education', type: 'expense', icon: 'book', color: '#6366f1' },
      { name: 'Travel', type: 'expense', icon: 'plane', color: '#14b8a6' },
      { name: 'Personal', type: 'expense', icon: 'user', color: '#f97316' },
      {
        name: 'Gifts & Donations',
        type: 'expense',
        icon: 'gift',
        color: '#a855f7',
      },
      {
        name: 'Investments',
        type: 'expense',
        icon: 'trending-up',
        color: '#059669',
      },
      {
        name: 'Other Expenses',
        type: 'expense',
        icon: 'more-horizontal',
        color: '#6b7280',
      },
    ];

    const systemIncomeCategories = [
      { name: 'Salary', type: 'income', icon: 'briefcase', color: '#10b981' },
      { name: 'Freelance', type: 'income', icon: 'laptop', color: '#3b82f6' },
      {
        name: 'Investments',
        type: 'income',
        icon: 'trending-up',
        color: '#059669',
      },
      { name: 'Business', type: 'income', icon: 'briefcase', color: '#8b5cf6' },
      { name: 'Rental Income', type: 'income', icon: 'home', color: '#f59e0b' },
      { name: 'Gifts', type: 'income', icon: 'gift', color: '#ec4899' },
      {
        name: 'Other Income',
        type: 'income',
        icon: 'plus-circle',
        color: '#6b7280',
      },
    ];

    let systemCategories = [];
    if (type === 'all' || type === 'expense') {
      systemCategories = [...systemCategories, ...systemExpenseCategories];
    }
    if (type === 'all' || type === 'income') {
      systemCategories = [...systemCategories, ...systemIncomeCategories];
    }

    return systemCategories.map(cat => ({
      ...cat,
      id: `system_${cat.name.toLowerCase().replace(/\s+/g, '_')}`,
      isSystem: true,
      isCustom: false,
      isActive: true,
      usageCount: 0,
    }));
  },

  /**
   * Generate a default color for new categories
   * @returns {string} Hex color code
   */
  generateDefaultColor() {
    const colors = [
      '#ef4444',
      '#f59e0b',
      '#10b981',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
      '#f97316',
      '#6366f1',
      '#a855f7',
      '#059669',
      '#dc2626',
      '#d97706',
      '#059669',
      '#2563eb',
    ];

    const usedColors = this.getAll().map(cat => cat.color);
    const availableColors = colors.filter(color => !usedColors.includes(color));

    return availableColors.length > 0
      ? availableColors[Math.floor(Math.random() * availableColors.length)]
      : colors[Math.floor(Math.random() * colors.length)];
  },

  /**
   * Validate category data
   * @param {Object} categoryData - Category data to validate
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validate(categoryData) {
    const errors = [];

    if (!categoryData.name || categoryData.name.trim() === '') {
      errors.push('Category name is required');
    }

    if (categoryData.name && categoryData.name.length > 50) {
      errors.push('Category name must be 50 characters or less');
    }

    if (categoryData.name && !/^[a-zA-Z0-9\s\-_&]+$/.test(categoryData.name)) {
      errors.push(
        'Category name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands'
      );
    }

    if (
      !categoryData.type ||
      !['expense', 'income'].includes(categoryData.type)
    ) {
      errors.push('Category type must be either "expense" or "income"');
    }

    if (categoryData.description && categoryData.description.length > 200) {
      errors.push('Category description must be 200 characters or less');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Search categories by name or description
   * @param {string} query - Search query
   * @param {string} type - Filter by type ('expense', 'income', 'all')
   * @returns {Array} Matching categories
   */
  search(query, type = 'all') {
    const categories = this.getByType(type);
    const systemCategories = this.getSystemCategories(type);
    const allCategories = [...systemCategories, ...categories];

    if (!query || query.trim() === '') {
      return allCategories;
    }

    const searchTerm = query.toLowerCase();
    return allCategories.filter(
      category =>
        category.name.toLowerCase().includes(searchTerm) ||
        (category.description &&
          category.description.toLowerCase().includes(searchTerm))
    );
  },

  /**
   * Get category statistics
   * @returns {Object} Category statistics
   */
  getStatistics() {
    const customCategories = this.getAll();
    const systemCategories = this.getSystemCategories();

    return {
      totalCategories: customCategories.length + systemCategories.length,
      customCategories: customCategories.length,
      systemCategories: systemCategories.length,
      expenseCategories:
        customCategories.filter(cat => cat.type === 'expense').length +
        systemCategories.filter(cat => cat.type === 'expense').length,
      incomeCategories:
        customCategories.filter(cat => cat.type === 'income').length +
        systemCategories.filter(cat => cat.type === 'income').length,
      mostUsedCategories: customCategories
        .filter(cat => cat.usageCount > 0)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5),
    };
  },

  /**
   * Private helper to persist categories
   */
  _persist(categories, sync = true) {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
    if (sync) {
      SyncService.pushToCloud(CUSTOM_CATEGORIES_KEY, categories);
    }
  },
};
