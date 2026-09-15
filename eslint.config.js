import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

const localRules = {
  'no-empty-catch': {
    meta: {
      type: 'problem',
      docs: {
        description: 'disallow empty promise catch callbacks',
      },
      schema: [],
    },
    create(context) {
      return {
        CallExpression(node) {
          const callee = node.callee;
          const callback = node.arguments[0];

          if (
            callee.type !== 'MemberExpression' ||
            callee.computed ||
            callee.property.name !== 'catch' ||
            !callback ||
            !['ArrowFunctionExpression', 'FunctionExpression'].includes(
              callback.type
            ) ||
            callback.body.type !== 'BlockStatement' ||
            callback.body.body.length > 0
          ) {
            return;
          }

          context.report({
            node: callback,
            message:
              'Empty .catch() callbacks must handle or report the error.',
          });
        },
      };
    },
  },
  'no-raw-style-values': {
    meta: {
      type: 'suggestion',
      docs: {
        description:
          'disallow raw hex colors and pixel values in style assignments',
      },
      schema: [],
    },
    create(context) {
      const rawStyleValue =
        /(?:^|\s)(?:-?\d+(?:\.\d+)?px\b)|#[\da-fA-F]{3,8}\b/;

      return {
        AssignmentExpression(node) {
          const left = node.left;

          if (
            left.type !== 'MemberExpression' ||
            left.object.type !== 'MemberExpression' ||
            left.object.computed ||
            left.object.property.name !== 'style'
          ) {
            return;
          }

          const value =
            node.right.type === 'Literal'
              ? node.right.value
              : node.right.type === 'TemplateLiteral' &&
                  node.right.expressions.length === 0
                ? node.right.quasis[0].value.cooked
                : null;

          if (typeof value === 'string' && rawStyleValue.test(value)) {
            context.report({
              node: node.right,
              message:
                'Use a design token or CSS variable instead of raw hex or px values in .style assignments.',
            });
          }
        },
      };
    },
  },
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      'vite.config.js',
      'postcss.config.js',
      'vite.config.lightning.js',
      'functions/**',
      '.claude/**',
      '.gemini/**',
      '.opencode/**',
      '.planning/**',
    ],
  },
  js.configs.recommended,
  prettier,
  {
    plugins: {
      local: { rules: localRules },
      'unused-imports': unusedImports,
    },
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
        scheduler: 'readonly',
        PerformanceObserver: 'readonly',
        IntersectionObserver: 'readonly',
        Node: 'readonly',
      },
    },
    rules: {
      // Code quality
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'unused-imports/no-unused-imports': 'error',
      'no-empty': 'error',
      'local/no-empty-catch': 'error',
      'local/no-raw-style-values': 'warn',
      // disabled for dev: 'no-console': 'warn',
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
      'no-new-func': 'error',
    },
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
        exports: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
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
        global: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'unused-imports/no-unused-imports': 'off',
      'no-empty': 'off',
      'local/no-empty-catch': 'off',
      'local/no-raw-style-values': 'off',
    },
  },
];
