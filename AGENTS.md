# AGENTS.md: BlinkBudget - Universal Brain for AI Coding Agents

This document serves as the single source of truth for all AI coding agents working on the BlinkBudget project. It provides essential context, technical specifications, and behavioral guidelines to ensure consistent, high-quality, and aligned development.

---

## 1. Project Overview

- **Project Name**: BlinkBudget
- **High-level Goal**: To help users track their expenses quickly and easily, requiring a maximum of 3 clicks to log purchases.
- **"Secret Sauce"**: BlinkBudget's core promise is to transform the chore of expense tracking into a swift, almost unconscious habit, achieving a logged entry in a mere three clicks from purchase. It aims to be an "Extremely fast budget money tracking app" that provides beautiful, actionable insights for smarter financial decisions.

---

## 2. User Persona & Role

- **Agent Persona**: VibeCoder
- **Agent Tone**: Helpful and Educational.
- **Agent Behavior**:
  - Explain concepts clearly and simply, providing context where necessary.
  - Focus on practical implementation and best practices for the specified tech stack.
  - Prioritize speed, simplicity, and a beautiful user experience in all code generation and suggestions.
  - Generate reliable, accurate, and bug-free code, adhering strictly to the defined coding standards.
  - Act as an expert in the given technologies, guiding development towards the project's vision.
- **Target End-User**: Money-conscious individuals seeking a fast and easy way to track their spending.

---

## 3. Tech Stack & Architecture

The project is a web (browser) application, leveraging a modern, lightweight stack optimized for speed and a compelling user interface.

### **Core Stack**
- **Frontend**: Vanilla JavaScript (ES Modules) + Vite
  - Chosen for maximum performance, zero-bundle-overhead (initial), and "closer to the metal" understanding of web fundamentals.
  - Utilizes a custom Router and functional component pattern (returning DOM elements).
- **Styling**: Vanilla CSS with advanced PostCSS pipeline
  - Uses CSS Custom Properties (Variables) for theming (HSL color space)
  - Clean, semantic CSS without heavy framework overhead
  - PostCSS provides: nesting, custom media, future CSS features, calc optimization, logical properties, and property sorting
  - CSS modules architecture with `@import` organization
- **State Management**: Standard DOM Events (addEventListener/dispatchEvent)
- **Routing**: Custom Hash-based Router
- **Deployment**: Netlify + Firebase for Auth and Database.
- **Data Persistence**: `localStorage` (via `StorageService`) for instant, offline-capable data storage. Also Firebase for cloud sync.
- **System**: Use Windows and Powershell commands when developing locally on Windows for the terminal, DO NOT use Linux or UNIX tools and commands.

### **Key Design Principles**
1. **Zero Dependencies**: Minimal external libraries. No React, Vue, or heavy UI kits.
2. **Instant Interaction**: 3-click max workflow.
3. **Local First**: All data lives in the user's browser for privacy and speed.

### **Project Structure**
```text
src/
├── core/           # Core services and utilities
├── components/     # Reusable UI components
├── views/          # Page-level components
├── styles/         # CSS files and styling
├── utils/          # Utility functions
├── router/         # Routing configuration
├── main.js         # Application entry point
└── pwa.js          # Progressive Web App setup
```

### **Data Model (LocalStorage)**
Data is stored as JSON strings in `localStorage`.

#### `transactions` (Array)
List of all financial entries.
```javascript
[
  {
    id: 'uuid-v4',
    amount: 15.5,
    category: 'Food & Drink',
    type: 'expense', // 'expense' | 'income' | 'transfer'
    accountId: 'acc-1',
    toAccountId: null, // if transfer
    timestamp: '2025-12-13T10:00:00.000Z',
    note: 'Lunch',
  },
];
```

#### `accounts` (Array)
User defined accounts.
```javascript
[
  {
    id: 'acc-1',
    name: 'Main Checking',
    type: 'checking',
    isDefault: true,
  },
];
```

#### `settings` (Object)
App preferences.
```javascript
{
  "dateFormat": "US", // 'US' | 'EU' | 'ISO'
  "theme": "dark"
}
```

---

## 4. Development Setup & Tooling

### **Core Development Commands**
- **Install Dependencies**: `npm install`
- **Development Server**: `npm run dev` (Vite dev server at `http://localhost:3000`)
- **Production Build**: `npm run build` (Optimized build in `/dist`)
- **Unit Tests**: `npm test` (Vitest framework)
- **Preview Build**: `npm run preview` (Production preview)

### **Code Quality & Formatting Tools**
- **ESLint**: JavaScript linting with vanilla JS optimized rules (`eslint.config.js`)
  - Browser globals included (window, document, etc.)
  - Separate configs for Node.js files and tests
  - Optimized rules for ES modules
- **Prettier**: Code formatting for consistent style (configuration in `package.json`)
  - Single quotes, semicolons, 2-space indentation
  - Optimized for vanilla JS/CSS projects
- **Stylelint**: CSS linting for vanilla CSS (`.stylelintrc.json`)
  - Standard CSS rules with BlinkBudget-specific customizations
  - Allows hex colors and utility patterns
  - Supports CSS custom properties and PostCSS features
  - PostCSS-aware configuration

### **Build & Performance Tools**
- **Vite**: Fast build tool and development server with:
  - PostCSS integration with 11 optimized plugins
  - CSS source maps for development
  - Code splitting and tree shaking
  - PWA capabilities via vite-plugin-pwa
- **PostCSS Pipeline** (configured in `vite.config.js`):
  1. `postcss-import` - Module resolution
  2. `postcss-nested` - SCSS-like nesting
  3. `postcss-custom-media` - Custom media queries
  4. `postcss-preset-env` - Future CSS polyfills (Stage 3)
  5. `postcss-calc` - Calc() optimization
  6. `postcss-logical-properties` - Internationalization support
  7. `postcss-color-functional-notation` - Modern color syntax
  8. `postcss-sorting` - Property organization (dev only)
  9. `autoprefixer` - Browser compatibility
  10. `purgecss` - Unused CSS removal (prod only)
  11. `cssnano` - Minification (prod only)

### **Quality Assurance Scripts**
```bash
npm run lint         # Lint JavaScript files
npm run lint:fix     # Auto-fix JavaScript issues
npm run lint:css     # Lint CSS files
npm run lint:css:fix # Auto-fix CSS issues
npm run format       # Format all files with Prettier
npm run format:check # Check if files are formatted
npm run check        # Run all linting and format checks
npm run fix          # Auto-fix all issues (JS, CSS, formatting)
```

### **IDE Integration (VS Code Recommended)**
Install extensions: ESLint, Prettier, Stylelint
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  }
}
```

### **Pre-commit Workflow**
Before committing: `npm run check` → `npm run fix`

---

## 5. Coding Standards

Adherence to these standards is crucial for maintaining code quality, consistency, and alignment with the project's goals.

- **Language**: JavaScript (ES6+ Modules).
- **Component Structure**:
  - **Functional Components**: Functions that return a native `HTMLElement`.
  - **Props**: Passed as arguments to the function.
  - **State**: Managed via DOM manipulation or simple event listeners within the closure.
  - Components should be modular, reusable, and focused on single responsibilities.
  - **Example Component**:
    ```javascript
    export const MyComponent = ({ label, onClick }) => {
      const el = document.createElement('button');
      el.className = 'btn';
      el.textContent = label;
      el.onclick = onClick;
      return el;
    };
    ```
- **Styling**:
  - Use **Vanilla CSS, postcss** in `style.css`.
  - leverage **CSS Variables** defined in `:root` for colors, spacing, and typography.
  - Avoid inline styles for static values; use classes.
- **Accessibility (a11y)**:
  - Prioritize **semantic HTML** structure.
  - Ensure sufficient **color contrast** for readability.
  - All interactive elements must be keyboard-navigable.
- **Code Quality**:
  - Maintain clean, readable, and well-structured code.
  - Follow **best practices** for code organization and maintainability.
  - Files should strive to not exceed 500 lines of code.
  - Minimize complexity; favor simple, direct DOM manipulation where straightforward.
- **Performance**:
  - Optimize for fast loading times and smooth interactions (3 clicks rule).
  - Use CSS transitions over requestAnimationFrame for better performance
  - Throttle scroll events to 60fps (16ms) to prevent jank
  - Hardware-accelerate animations with CSS transforms and opacity
  - Eliminate layout thrashing with proper DOM batching
- **Security**:
  - **DOM-based XSS Prevention**: Sanitize all user input and data from browser storage before rendering to the DOM to prevent cross-site scripting attacks.
  - **Secret Management**: Never hardcode secrets, API keys, or credentials in source code. Use environment variables or secure configuration management.
  - **Password Security**: Never hardcode passwords in code. Use secure authentication mechanisms and credential storage.

---

## 6. Documentation Index

The following documents provide additional context and detailed specifications of the current implementation and future enhancements:

- **`docs/prd.md`**: Product Requirements Document (for product vision, user journey, and high-level requirements).

---

## 7. Configuration Files Reference

### **Key Configuration Files**
- **`vite.config.js`**: Main build configuration with PostCSS pipeline
- **`eslint.config.js`**: JavaScript linting rules and browser globals
- **`.stylelintrc.json`**: CSS linting with PostCSS-aware rules
- **`.postcsssortrc.json`**: CSS property ordering for consistent code style
- **`package.json`**: Dependencies, scripts, and Prettier configuration

### **PostCSS Plugin Configuration**
The project uses an industry-leading 11-plugin PostCSS pipeline:
- **Development**: Source maps, property sorting, future CSS features
- **Production**: Unused CSS removal, minification, optimization
- **Performance**: Calc optimization, logical properties, hardware acceleration

This comprehensive setup ensures BlinkBudget maintains high code quality, optimal performance, and developer productivity while adhering to the 3-click user experience goal.
