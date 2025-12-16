/**
 * DOM Factory utilities
 * Provides standardized DOM element creation to reduce duplication
 */

import { COLORS, FONT_SIZES, TOUCH_TARGETS, SPACING, DIMENSIONS } from './constants.js';

/**
 * Create a standardized button element
 * @param {Object} options - Button configuration
 * @returns {HTMLButtonElement} Button element
 */
export const createButton = (options = {}) => {
    const {
        text = '',
        className = '',
        style = {},
        onClick = null,
        type = 'button'
    } = options;
    
    const btn = document.createElement('button');
    btn.type = type;
    btn.textContent = text;
    btn.className = className;
    
    // Apply styles
    Object.assign(btn.style, style);
    
    if (onClick) {
        btn.addEventListener('click', onClick);
    }
    
    return btn;
};

/**
 * Create a standardized input element
 * @param {Object} options - Input configuration
 * @returns {HTMLInputElement} Input element
 */
export const createInput = (options = {}) => {
    const {
        type = 'text',
        value = '',
        placeholder = '',
        className = '',
        style = {},
        required = false,
        readOnly = false,
        minHeight = TOUCH_TARGETS.MIN_HEIGHT,
        fontSize = FONT_SIZES.PREVENT_ZOOM
    } = options;
    
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.placeholder = placeholder;
    input.className = className;
    input.required = required;
    input.readOnly = readOnly;
    
    // Apply default mobile-friendly styles
    const defaultStyle = {
        width: '100%',
        minHeight,
        fontSize,
        padding: SPACING.MD,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${COLORS.BORDER}`,
        background: COLORS.SURFACE,
        color: COLORS.TEXT_MAIN,
        ...style
    };
    
    Object.assign(input.style, defaultStyle);
    
    return input;
};

/**
 * Create a standardized select element
 * @param {Object} options - Select configuration
 * @returns {HTMLSelectElement} Select element
 */
export const createSelect = (options = {}) => {
    const {
        options: selectOptions = [],
        value = '',
        className = '',
        style = {},
        onChange = null,
        minHeight = TOUCH_TARGETS.MIN_HEIGHT,
        fontSize = FONT_SIZES.PREVENT_ZOOM
    } = options;
    
    const select = document.createElement('select');
    select.className = className;
    
    // Apply default mobile-friendly styles
    const defaultStyle = {
        width: '100%',
        minHeight,
        fontSize,
        padding: SPACING.MD,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${COLORS.BORDER}`,
        background: COLORS.SURFACE,
        color: COLORS.TEXT_MAIN,
        cursor: 'pointer',
        appearance: 'auto',
        ...style
    };
    
    Object.assign(select.style, defaultStyle);
    
    // Add options
    selectOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        if (opt.selected) option.selected = true;
        select.appendChild(option);
    });
    
    if (value) {
        select.value = value;
    }
    
    if (onChange) {
        select.addEventListener('change', onChange);
    }
    
    return select;
};

/**
 * Create a card container element
 * @param {Object} options - Card configuration
 * @returns {HTMLDivElement} Card element
 */
export const createCard = (options = {}) => {
    const {
        className = 'card',
        style = {},
        children = []
    } = options;
    
    const card = document.createElement('div');
    card.className = className;
    
    const defaultStyle = {
        padding: SPACING.LG,
        borderRadius: 'var(--radius-md)',
        background: COLORS.SURFACE,
        border: `1px solid ${COLORS.BORDER}`,
        ...style
    };
    
    Object.assign(card.style, defaultStyle);
    
    children.forEach(child => {
        if (child instanceof HTMLElement) {
            card.appendChild(child);
        }
    });
    
    return card;
};

/**
 * Create a flex container
 * @param {Object} options - Container configuration
 * @returns {HTMLDivElement} Container element
 */
export const createFlexContainer = (options = {}) => {
    const {
        direction = 'row',
        gap = SPACING.MD,
        alignItems = 'stretch',
        justifyContent = 'flex-start',
        className = '',
        style = {},
        children = []
    } = options;
    
    const container = document.createElement('div');
    container.className = className;
    
    const defaultStyle = {
        display: 'flex',
        flexDirection: direction,
        gap,
        alignItems,
        justifyContent,
        ...style
    };
    
    Object.assign(container.style, defaultStyle);
    
    children.forEach(child => {
        if (child instanceof HTMLElement) {
            container.appendChild(child);
        }
    });
    
    return container;
};

/**
 * Create a text element (heading, paragraph, etc.)
 * @param {Object} options - Text element configuration
 * @returns {HTMLElement} Text element
 */
export const createTextElement = (options = {}) => {
    const {
        tag = 'p',
        text = '',
        className = '',
        style = {},
        fontSize = FONT_SIZES.BASE
    } = options;
    
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    
    const defaultStyle = {
        fontSize,
        margin: 0,
        ...style
    };
    
    Object.assign(element.style, defaultStyle);
    
    return element;
};

