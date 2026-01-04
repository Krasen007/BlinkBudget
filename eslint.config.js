import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      'vite.config.js',
      'postcss.config.js',
      'vite.config.lightning.js'
    ]
  },
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        TouchEvent: 'readonly',
        MutationObserver: 'readonly',
        AbortController: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Blob: 'readonly',
        HTMLElement: 'readonly',
        getComputedStyle: 'readonly',
        indexedDB: 'readonly',
        IDBKeyRange: 'readonly',
        IDBDatabase: 'readonly',
        IDBObjectStore: 'readonly',
        IDBIndex: 'readonly',
        IDBCursor: 'readonly',
        IDBTransaction: 'readonly',
        IDBRequest: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        DOMException: 'readonly',
        MessageChannel: 'readonly',
        Image: 'readonly',
        scheduler: 'readonly'
      }
    },
    rules: {
      // Code quality
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      
      // Best practices for vanilla JS
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      
      // DOM manipulation best practices
      'no-implied-eval': 'error',
      'no-script-url': 'error',
      
      // Performance considerations
      'no-loop-func': 'error',
      'no-new-func': 'error'
    }
  },
  {
    files: ['**/*.config.js', 'scripts/**/*.js', '.stylelintrc.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['**/*.test.js', 'tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        global: 'readonly'
      }
    }
  }
];