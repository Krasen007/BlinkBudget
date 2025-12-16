/**
 * Type toggle utilities
 * Creates transaction type toggle buttons (expense, income, transfer, refund)
 */

import { TYPE_COLORS, HAPTIC_PATTERNS } from './constants.js';
import { COLORS } from '../constants.js';
import { addTouchFeedback } from '../touch-utils.js';

/**
 * Create a type toggle button
 * @param {Object} options - Button configuration
 * @param {string} options.type - Transaction type (expense, income, transfer, refund)
 * @param {string} options.label - Button label
 * @param {Function} options.onClick - Click handler
 * @param {Function} options.updateState - State update function
 * @param {string} options.currentType - Currently selected type
 * @returns {HTMLButtonElement} Type toggle button
 */
const createTypeButton = (options) => {
    const { type, label, onClick, updateState, currentType } = options;
    
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = 'btn type-toggle-btn';
    btn.style.flex = '1';
    btn.style.border = '1px solid var(--color-border)';
    
    // Touch-friendly sizing
    btn.style.minHeight = 'var(--touch-target-min)';
    btn.style.margin = 'calc(var(--touch-spacing-min) / 2)';
    
    // State update function - will be called by parent
    const updateButtonState = () => {
        const currentTypeValue = typeof currentType === 'function' ? currentType() : currentType;
        const isActive = currentTypeValue === type;
        const activeColor = TYPE_COLORS[type] || TYPE_COLORS.transfer;
        
        btn.style.background = isActive ? activeColor : 'transparent';
        btn.style.border = isActive ? '1px solid transparent' : '1px solid var(--color-border)';
        btn.style.color = isActive ? 'white' : 'var(--color-text-muted)';
    };
    
    // Click handler
    btn.addEventListener('click', () => {
        onClick(type);
    });
    
    // Enhanced touch feedback
    btn.addEventListener('touchstart', () => {
        btn.style.transform = 'scale(0.96)';
        if (window.mobileUtils) {
            window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.LIGHT);
        }
    }, { passive: true });
    
    btn.addEventListener('touchend', () => {
        btn.style.transform = 'scale(1)';
    }, { passive: true });
    
    btn.addEventListener('touchcancel', () => {
        btn.style.transform = 'scale(1)';
    }, { passive: true });
    
    // Hover effect for desktop
    btn.addEventListener('mouseenter', () => {
        const currentTypeValue = typeof currentType === 'function' ? currentType() : currentType;
        if (currentTypeValue !== type) {
            btn.style.border = '1px solid var(--color-text-muted)';
            btn.style.backgroundColor = 'var(--color-surface-hover)';
        }
    });
    
    btn.addEventListener('mouseleave', () => {
        const currentTypeValue = typeof currentType === 'function' ? currentType() : currentType;
        if (currentTypeValue !== type) {
            btn.style.border = '1px solid var(--color-border)';
            btn.style.backgroundColor = 'transparent';
        }
    });
    
    // Store update function on button
    btn.updateState = updateButtonState;
    
    return btn;
};

/**
 * Create a type toggle group with all transaction types
 * @param {Object} options - Configuration options
 * @param {string} options.initialType - Initial selected type (default: 'expense')
 * @param {Function} options.onTypeChange - Callback when type changes
 * @returns {Object} Type toggle group with container and state management
 */
export const createTypeToggleGroup = (options = {}) => {
    const {
        initialType = 'expense',
        onTypeChange = null
    } = options;
    
    let currentType = initialType;
    
    const typeGroup = document.createElement('div');
    typeGroup.style.display = 'flex';
    typeGroup.style.gap = 'var(--spacing-md)';
    typeGroup.style.marginBottom = 'var(--spacing-xs)';
    
    const buttons = {};
    const buttonConfigs = [
        { type: 'expense', label: 'Expense' },
        { type: 'income', label: 'Income' },
        { type: 'transfer', label: 'Transfer' },
        { type: 'refund', label: 'Refund' }
    ];
    
    // Update all button states
    const updateAllButtons = () => {
        Object.entries(buttons).forEach(([type, btn]) => {
            const isActive = currentType === type;
            const activeColor = TYPE_COLORS[type] || TYPE_COLORS.transfer;
            
            btn.style.background = isActive ? activeColor : 'transparent';
            btn.style.border = isActive ? '1px solid transparent' : '1px solid var(--color-border)';
            btn.style.color = isActive ? 'white' : 'var(--color-text-muted)';
        });
    };
    
    // Create all buttons
    buttonConfigs.forEach(config => {
        const btn = createTypeButton({
            type: config.type,
            label: config.label,
            currentType: () => currentType, // Function to get current type
            onClick: (type) => {
                currentType = type;
                updateAllButtons();
                if (onTypeChange) {
                    onTypeChange(type);
                }
            },
            updateState: updateAllButtons
        });
        
        buttons[config.type] = btn;
        typeGroup.appendChild(btn);
    });
    
    // Initial state
    updateAllButtons();
    
    /**
     * Set the current type programmatically
     * @param {string} type - Type to set
     */
    const setType = (type) => {
        currentType = type;
        updateAllButtons();
        if (onTypeChange) {
            onTypeChange(type);
        }
    };
    
    return {
        container: typeGroup,
        currentType: () => currentType,
        setType,
        buttons
    };
};

