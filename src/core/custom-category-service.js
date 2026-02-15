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
   * Reorder categories
   * @param {Array<string>} orderedIds - Array of category IDs in desired order
   * @returns {boolean} True if successful
   */
  reorder(orderedIds) {
    if (!Array.isArray(orderedIds)) {
      throw new Error('orderedIds must be an array');
    }

    const currentUserId = AuthService.getUserId();

    // Load ALL categories from storage (not just current user's)
    const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const allCategories = data ? safeJsonParse(data) : [];

    // Get only current user's categories for reordering
    const userCategories = allCategories.filter(
      cat => !cat.userId || cat.userId === currentUserId
    );

    const categoryMap = new Map(userCategories.map(cat => [cat.id, cat]));

    // Validate that all IDs exist
    const invalidIds = orderedIds.filter(id => !categoryMap.has(id));
    if (invalidIds.length > 0) {
      throw new Error(`Invalid category IDs: ${invalidIds.join(', ')}`);
    }

    // Detect duplicate IDs in the provided order list
    const seen = new Set();
    const duplicates = orderedIds.filter(id => {
      if (seen.has(id)) return true;
      seen.add(id);
      return false;
    });
    if (duplicates.length > 0) {
      const uniqueDups = Array.from(new Set(duplicates));
      throw new Error(
        `Duplicate category IDs in orderedIds: ${uniqueDups.join(', ')}`
      );
    }

    // Create reordered array with sortOrder property (updatedAt left to existing entries)
    const reordered = orderedIds.map((id, index) => ({
      ...categoryMap.get(id),
      sortOrder: index,
      updatedAt: new Date().toISOString(),
    }));

    // Add any categories not in the orderedIds array at the end
    const includedIds = new Set(orderedIds);
    const remaining = userCategories
      .filter(cat => !includedIds.has(cat.id))
      .map((cat, index) => ({
        ...cat,
        sortOrder: orderedIds.length + index,
      }));

    const updatedUserCategories = [...reordered, ...remaining];

    // Merge back: remove old user categories and add updated ones
    const otherUsersCategories = allCategories.filter(
      cat => cat.userId && cat.userId !== currentUserId
    );

    const mergedCategories = [
      ...otherUsersCategories,
      ...updatedUserCategories,
    ];

    this._persist(mergedCategories);

    // Audit log category reordering
    auditService.log(
      auditEvents.DATA_UPDATE,
      {
        entityType: 'categories',
        action: 'reorder',
        count: orderedIds.length,
      },
      AuthService.getUserId(),
      'low'
    );

    return true;
  },

  /**
   * Move a category up or down in the list
   * @param {string} id - Category ID
   * @param {string} direction - 'up' or 'down'
   * @returns {boolean} True if successful
   */
  move(id, direction) {
    if (!['up', 'down'].includes(direction)) {
      throw new Error('Direction must be "up" or "down"');
    }

    const currentUserId = AuthService.getUserId();

    // Load ALL categories from storage
    const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const allCategories = data ? safeJsonParse(data) : [];

    // Get only current user's categories for moving
    const userCategories = allCategories.filter(
      cat => !cat.userId || cat.userId === currentUserId
    );

    // Sort by current sortOrder (or by creation date if no sortOrder)
    const sorted = userCategories.sort((a, b) => {
      const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const currentIndex = sorted.findIndex(cat => cat.id === id);
    if (currentIndex === -1) {
      throw new Error('Category not found');
    }

    // Calculate new index
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Check bounds
    if (newIndex < 0 || newIndex >= sorted.length) {
      return false; // Already at the edge
    }

    // Swap positions
    [sorted[currentIndex], sorted[newIndex]] = [
      sorted[newIndex],
      sorted[currentIndex],
    ];

    // Update sortOrder for all user categories but only touch updatedAt
    // when the sortOrder actually changes (so only swapped items get new timestamps)
    const reordered = sorted.map((cat, index) => {
      if (cat.sortOrder !== index) {
        return {
          ...cat,
          sortOrder: index,
          updatedAt: new Date().toISOString(),
        };
      }
      return cat;
    });

    // Merge back with other users' categories
    const otherUsersCategories = allCategories.filter(
      cat => cat.userId && cat.userId !== currentUserId
    );

    const mergedCategories = [...otherUsersCategories, ...reordered];

    this._persist(mergedCategories);

    // Audit log category move
    auditService.log(
      auditEvents.DATA_UPDATE,
      {
        entityType: 'category',
        action: 'move',
        categoryId: id,
        direction,
      },
      AuthService.getUserId(),
      'low'
    );

    return true;
  },

  /**
   * Get all custom categories
   * @returns {Array} List of custom categories
   */
  getAll() {
    const currentUserId = AuthService.getUserId();
    const initKey = `categories_initialized_${currentUserId}`;

    // Check if migration is needed for this user
    if (!localStorage.getItem(initKey)) {
      this._migrateSystemToCustom();
    }

    const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const categories = data ? safeJsonParse(data) : [];

    // Filter categories for current user and sort by sortOrder
    return categories
      .filter(cat => !cat.userId || cat.userId === currentUserId)
      .sort((a, b) => {
        const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        // Fallback to creation date if sortOrder is the same
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  },

  /**
   * Migrate system categories to custom categories
   * @private
   */
  _migrateSystemToCustom() {
    const currentUserId = AuthService.getUserId();
    console.log('[CategoryService] Initializing default categories...');

    const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const existingCategories = data ? safeJsonParse(data) : [];
    const systemCategories = this.getSystemCategories('all');

    const merged = [...existingCategories];

    // Filter existing categories to only those belonging to current user for duplicate check
    const currentUserCategories = existingCategories.filter(
      c => !c.userId || c.userId === currentUserId
    );

    systemCategories.forEach(systemCat => {
      // Avoid duplication by name FOR CURRENT USER
      const exists = currentUserCategories.find(
        c => c.name.toLowerCase() === systemCat.name.toLowerCase()
      );

      if (!exists) {
        merged.push({
          ...systemCat,
          id: generateId(), // New real ID
          isSystem: false, // Now editable
          isCustom: true,
          userId: currentUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    this._persist(merged, false); // Don't sync yet to avoid flood, main sync will pick it up
    localStorage.setItem(`categories_initialized_${currentUserId}`, 'true');
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
    const filterType = type === 'refund' ? 'expense' : type;
    const filtered = categories.filter(cat => cat.type === filterType);

    // Deduplicate by name (case-insensitive)
    const uniqueMap = new Map();
    filtered.forEach(cat => {
      const key = cat.name.toLowerCase();
      const existing = uniqueMap.get(key);
      if (!existing) {
        uniqueMap.set(key, cat);
      } else if (cat.updatedAt > existing.updatedAt) {
        // Prefer most recently updated
        uniqueMap.set(key, cat);
      }
    });

    return Array.from(uniqueMap.values());
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

    const allowedFields = [
      'name',
      'type',
      'color',
      'icon',
      'description',
      'isActive',
    ];
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    );

    categories[index] = {
      ...categories[index],
      ...sanitizedUpdates,
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
   * Remove a category by ID
   * @param {string} id - Category ID
   * @returns {boolean} True if removed, false otherwise
   */
  remove(id) {
    const categories = this.getAll();
    const category = categories.find(cat => cat.id === id);

    if (!category) {
      return false;
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
      },
      AuthService.getUserId(),
      'medium'
    );

    return true;
  },

  /**
   * Get all category names (including system categories)
   * @param {string} type - Filter by type ('expense', 'income', 'all')
   * @returns {Array} List of category names
   */
  getAllCategoryNames(type = 'all') {
    const categories = this.getByType(type);

    return [...new Set(categories.map(cat => cat.name))];
  },

  /**
   * Get system (built-in) categories
   * @param {string} type - Filter by type ('expense', 'income', 'all')
   * @returns {Array} List of system categories
   */
  getSystemCategories(type = 'all') {
    const systemExpenseCategories = [
      {
        name: 'Храна',
        type: 'expense',
        icon: 'restaurant',
        color: '#22C55E',
        description: 'Supermarket runs, bakery, household supplies.',
      },
      {
        name: 'Заведения',
        type: 'expense',
        icon: 'restaurant',
        color: '#F97316',
        description: 'Restaurants, fast food, coffee shops, food delivery.',
      },
      {
        name: 'Други',
        type: 'expense',
        icon: 'more-horizontal',
        color: '#f19317ff',
        description: "Miscellaneous expenses that don't fit elsewhere.",
      },
      {
        name: 'Гориво',
        type: 'expense',
        icon: 'car',
        color: '#EF4444',
        description: 'Fuel for vehicles.',
      },
      {
        name: 'Подаръци',
        type: 'expense',
        icon: 'gift',
        color: '#A855F7',
        description: 'Gifts for others.',
      },
      {
        name: 'Автомобил',
        type: 'expense',
        icon: 'car',
        color: '#DC2626',
        description: 'Car maintenance, repairs, insurance.',
      },
      {
        name: 'Сметки',
        type: 'expense',
        icon: 'file-text',
        color: '#60A5FA',
        description: 'Utility bills (Electricity, Water, Internet, etc.).',
      },
      {
        name: 'Дрехи',
        type: 'expense',
        icon: 'shopping-bag',
        color: '#8B5CF6',
        description: 'Clothing and apparel.',
      },
      {
        name: 'Лекарства',
        type: 'expense',
        icon: 'heart',
        color: '#10B981',
        description: 'Pharmacy and medicines.',
      },
      {
        name: 'Забавления',
        type: 'expense',
        icon: 'film',
        color: '#7C3AED',
        description: 'Movies, hobbies, subscriptions, fun activities.',
      },
      {
        name: 'Кредит',
        type: 'expense',
        icon: 'credit-card',
        color: '#3B82F6',
        description: 'Loan payments, mortgage, credit card payoff.',
      },
      {
        name: 'Телефон',
        type: 'expense',
        icon: 'phone',
        color: '#0EA5E9',
        description: 'Mobile phone bill and equipment.',
      },
      {
        name: 'Почивка',
        type: 'expense',
        icon: 'plane',
        color: '#06B6D4',
        description: 'Vacations, travel, hotels.',
      },
      {
        name: 'Транспорт',
        type: 'expense',
        icon: 'truck',
        color: '#FB923C',
        description: 'Public transit, taxi, ride-sharing.',
      },
      {
        name: 'Баланс',
        type: 'expense',
        icon: 'refresh-cw',
        color: '#16A34A',
        description: 'Adjustments to account balance.',
      },
      {
        name: 'Лекар',
        type: 'expense',
        icon: 'heart',
        color: '#B91C1C',
        description: 'Doctor visits and medical procedures.',
      },
      {
        name: 'Инвестиции',
        type: 'expense',
        icon: 'trending-up',
        color: '#84CC16',
        description: 'Investment contributions and income.',
      },
      {
        name: 'Ремонти',
        type: 'expense',
        icon: 'tool',
        color: '#F59E0B',
        description: 'Home repairs and maintenance.',
      },
      {
        name: 'Данъци',
        type: 'expense',
        icon: 'file-text',
        color: '#1D4ED8',
        description: 'Taxes and government fees.',
      },
      {
        name: 'Застраховки',
        type: 'expense',
        icon: 'shield',
        color: '#C084FC',
        description: 'Insurance policies (Life, Home, Health).',
      },
      {
        name: 'Зъболекар',
        type: 'expense',
        icon: 'heart',
        color: '#F87171',
        description: 'Dentist visits.',
      },
    ];

    const systemIncomeCategories = [
      {
        name: 'Заплата',
        type: 'income',
        icon: 'briefcase',
        color: '#10b981',
        description: 'Salary and primary income.',
      },
      {
        name: 'Инвестиции',
        type: 'income',
        icon: 'trending-up',
        color: '#84CC16',
        description: 'Investment contributions and income.',
      },
      {
        name: 'Други',
        type: 'income',
        icon: 'more-horizontal',
        color: '#f19317ff',
        description: "Miscellaneous income that don't fit elsewhere.",
      },
      {
        name: 'Подаръци',
        type: 'income',
        icon: 'gift',
        color: '#A855F7',
        description: 'Gifts received.',
      },
    ];

    let systemCategories = [];
    if (type === 'all' || type === 'expense' || type === 'refund') {
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
      '#0891b2', // or another distinct color
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

    if (
      categoryData.name &&
      !/^[a-zA-Z0-9\u0400-\u04FF\s\-_&]+$/.test(categoryData.name)
    ) {
      errors.push(
        'Category name can only contain letters (Latin or Cyrillic), numbers, spaces, hyphens, underscores, and ampersands'
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

    // Deduplicate: Create map of unique categories by name
    const uniqueCategories = new Map();
    [...systemCategories, ...categories].forEach(cat => {
      uniqueCategories.set(cat.name.toLowerCase(), cat);
    });

    return Array.from(uniqueCategories.values()).filter(
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

    // Deduplicate by name to avoid double counting migrated categories
    const allUniqueNames = new Set([
      ...customCategories.map(c => c.name.toLowerCase()),
      ...systemCategories.map(c => c.name.toLowerCase()),
    ]);

    const uniqueExpense = new Set([
      ...customCategories
        .filter(c => c.type === 'expense')
        .map(c => c.name.toLowerCase()),
      ...systemCategories
        .filter(c => c.type === 'expense')
        .map(c => c.name.toLowerCase()),
    ]);

    const uniqueIncome = new Set([
      ...customCategories
        .filter(c => c.type === 'income')
        .map(c => c.name.toLowerCase()),
      ...systemCategories
        .filter(c => c.type === 'income')
        .map(c => c.name.toLowerCase()),
    ]);

    return {
      totalCategories: allUniqueNames.size,
      customCategories: customCategories.length,
      systemCategories: systemCategories.length, // Raw count of system definitions
      expenseCategories: uniqueExpense.size,
      incomeCategories: uniqueIncome.size,
      mostUsedCategories: [], // TODO: Implement usage tracking
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
