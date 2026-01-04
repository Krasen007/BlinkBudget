/**
 * DOM Factory Utility
 * Standardizes the creation of DOM elements with styles and attributes.
 */

export const createElement = (tag, options = {}) => {
  const {
    className = '',
    style = {},
    attributes = {},
    textContent = '',
    innerHTML = '',
    children = [],
  } = options;

  const element = document.createElement(tag);

  if (className) {
    if (Array.isArray(className)) {
      className.forEach(c => c && element.classList.add(c));
    } else {
      element.className = className;
    }
  }

  if (Object.keys(style).length > 0) {
    Object.assign(element.style, style);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'selected' && value) {
        element.selected = true;
      } else if (key === 'value') {
        element.value = value;
      } else if (key === 'readOnly' && value) {
        element.readOnly = true;
      } else {
        element.setAttribute(key, value);
      }
    }
  });

  if (textContent) {
    element.textContent = textContent;
  } else if (innerHTML) {
    element.innerHTML = innerHTML;
  }

  children.forEach(child => {
    if (child) {
      element.appendChild(child);
    }
  });

  return element;
};

export const createInput = (options = {}) => {
  const {
    type = 'text',
    id = '',
    name = '',
    placeholder = '',
    value = '',
    className = '',
    style = {},
    attributes = {},
    readOnly = false,
  } = options;

  return createElement('input', {
    className,
    style,
    attributes: {
      type,
      id,
      name,
      placeholder,
      value: value || '',
      readOnly,
      ...attributes,
    },
  });
};

export const createSelect = (options = {}) => {
  const {
    id = '',
    name = '',
    options: selectOptions = [],
    className = '',
    style = {},
    attributes = {},
  } = options;

  const select = createElement('select', {
    className,
    style,
    attributes: { id, name, ...attributes },
  });

  let selectedValue = null;

  selectOptions.forEach(opt => {
    const option = createElement('option', {
      attributes: {
        value: opt.value,
      },
      textContent: opt.text,
    });

    if (opt.selected) {
      selectedValue = opt.value;
    }

    select.appendChild(option);
  });

  // Set the selected value after all options are added
  if (selectedValue !== null) {
    select.value = selectedValue;
  }

  return select;
};

export const createFlexContainer = (options = {}) => {
  const {
    direction = 'row',
    justify = 'flex-start',
    align = 'stretch',
    gap = '0',
    className = '',
    style = {},
    children = [],
  } = options;

  return createElement('div', {
    className,
    style: {
      display: 'flex',
      flexDirection: direction,
      justifyContent: justify,
      alignItems: align,
      gap,
      ...style,
    },
    children,
  });
};

export const createButton = (options = {}) => {
  const {
    text = '',
    className = '',
    style = {},
    onClick = null,
    attributes = {},
  } = options;

  const btn = createElement('button', {
    className,
    style,
    textContent: text,
    attributes,
  });

  if (onClick) {
    btn.addEventListener('click', e => {
      if (options.type !== 'submit') {
        e.preventDefault();
      }
      onClick(e);
    });
  }

  return btn;
};

export const dom = {
  div: options => createElement('div', options),
  span: options => createElement('span', options),
  button: options => createElement('button', options),
  p: options => createElement('p', options),
  h1: options => createElement('h1', options),
  h2: options => createElement('h2', options),
  h3: options => createElement('h3', options),
  ul: options => createElement('ul', options),
  li: options => createElement('li', options),
  nav: options => createElement('nav', options),
  input: options => createElement('input', options),
  label: options => createElement('label', options),
  select: options => createElement('select', options),
  option: options => createElement('option', options),
  canvas: options => createElement('canvas', options),
};
