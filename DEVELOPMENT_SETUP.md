# BlinkBudget Development Setup

## Overview

Your BlinkBudget project now includes a professional development setup with ESLint, Prettier, Stylelint, and optional Lightning CSS for optimal performance and code quality.

## Tools Installed

### Code Quality & Formatting

- **ESLint**: JavaScript linting with vanilla JS optimized rules
- **Prettier**: Code formatting for consistent style
- **Stylelint**: CSS linting for your vanilla CSS

### Build & Performance

- **Vite**: Fast build tool and dev server
- **Vitest**: Unit testing framework
- **PWA Plugin**: Progressive Web App capabilities
- **Lightning CSS**: Optional high-performance CSS processor (alternative to PostCSS)

## Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run unit tests
```

### Code Quality

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

## Configuration Files

### ESLint (`eslint.config.js`)

- Configured for vanilla JavaScript ES modules
- Browser globals included (window, document, etc.)
- Optimized rules for your tech stack
- Separate configs for Node.js files and tests

### Prettier (`.prettierrc`)

- Single quotes, semicolons, 2-space indentation
- Optimized for vanilla JS/CSS projects

### Stylelint (`.stylelintrc.js`)

- Standard CSS rules with BlinkBudget-specific customizations
- Allows hex colors and utility patterns
- Supports CSS custom properties

## Lightning CSS (Optional)

To use Lightning CSS instead of PostCSS for better performance:

1. Rename your current `vite.config.js` to `vite.config.postcss.js`
2. Rename `vite.config.lightning.js` to `vite.config.js`
3. Restart your dev server

Lightning CSS provides:

- Faster CSS processing
- Better browser compatibility
- Smaller bundle sizes
- Native CSS nesting and custom media queries

## Pre-commit Workflow

Before committing code, run:

```bash
npm run check  # Verify all code quality checks pass
npm run fix    # Auto-fix any issues found
```

## IDE Integration

### VS Code

Install these extensions for the best experience:

- ESLint
- Prettier - Code formatter
- Stylelint

### Settings

Add to your VS Code settings.json:

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

## Current Status

✅ ESLint configured and working
✅ Prettier configured and working  
✅ Stylelint configured and working
✅ Lightning CSS ready as alternative
✅ All scripts working properly

The setup is now complete and ready for development!
