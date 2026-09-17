import { Linter } from 'eslint';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import * as constants from '../../src/utils/constants.js';

const collect = directory =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collect(path) : path.endsWith('.js') ? [path] : [];
  });

it('defines every statically referenced member of imported design-token objects', () => {
  const names = new Set([
    'COLORS', 'FONT_SIZES', 'SPACING', 'DIMENSIONS', 'TIMING',
    'Z_INDEX', 'TOUCH_TARGETS', 'BREAKPOINTS',
  ]);
  const linter = new Linter();
  const failures = [];
  for (const file of collect('src')) {
    const messages = linter.verify(readFileSync(file, 'utf8'), {
      linterOptions: { reportUnusedDisableDirectives: false },
      plugins: {
        contract: {
          rules: {
            tokens: {
              create(context) {
                const imports = new Map();
                return {
                  ImportDeclaration(node) {
                    if (!node.source.value.endsWith('/constants.js')) return;
                    for (const specifier of node.specifiers) {
                      if (specifier.type === 'ImportSpecifier' && names.has(specifier.imported.name)) {
                        imports.set(specifier.local.name, specifier.imported.name);
                      }
                    }
                  },
                  MemberExpression(node) {
                    const name = imports.get(node.object.name);
                    const key = node.computed ? node.property.value : node.property.name;
                    if (name && typeof key === 'string' && !Object.hasOwn(constants[name], key)) {
                      context.report({ node, message: `Undefined token ${name}.${key}` });
                    }
                  },
                };
              },
            },
          },
        },
      },
      rules: { 'contract/tokens': 'error' },
    });
    failures.push(...messages.map(message => `${file}:${message.line}: ${message.message}`));
  }
  expect(failures).toEqual([]);
});
