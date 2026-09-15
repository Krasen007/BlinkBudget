/**
 * Design Token Contract - Unit Tests
 *
 * Guards the defect class the AI-slop audit found in `src/utils`: a token that
 * call sites reference but that nothing defines. A missing token resolves to
 * `undefined` (JS) or to nothing (CSS), so lint, Prettier and the rest of the
 * suite stay green — e.g. `TIMING.NOTIFICATION_*` silently dropped every toast
 * after ~230ms instead of ~3s.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { extname, join } from 'path';

import { TIMING } from '../../src/utils/constants.js';
import {
  TOAST_TYPES,
  showToast,
  clearAllToasts,
} from '../../src/utils/toast-notifications.js';

const SRC_DIR = 'src';
const STYLES_DIR = 'src/styles';

// Files with pre-existing undefined-token debt, recorded by the round-1 audit's
// verification sweep (see todo/ai-slop-report.md, "Round-1 addendum"). These use
// a foreign token vocabulary that no stylesheet declares, so every one of their
// var() values is silently invalid. Remove a file from this list once migrated —
// the list must not grow.
const KNOWN_TOKEN_DEBT = ['src/components/PrivacyControls.js'];

/**
 * Recursively collect every file with the given extension under a directory
 */
const collectFiles = (dir, extension) =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(entryPath, extension);
    }

    return extname(entry.name) === extension ? [entryPath] : [];
  });

// Every custom property declared by a stylesheet or injected from JS
const declaredTokens = new Set(
  [
    ...collectFiles(STYLES_DIR, '.css'),
    ...collectFiles(SRC_DIR, '.js'),
  ].flatMap(file =>
    [...readFileSync(file, 'utf8').matchAll(/--[a-z0-9-]+\s*:/g)].map(match =>
      match[0].replace(/\s*:$/, '')
    )
  )
);

// `var(--token)` references from JS — only those without a fallback, since
// `var(--token, fallback)` is an intentional optional dependency
const referencedTokens = () =>
  collectFiles(SRC_DIR, '.js')
    .filter(
      file =>
        !file.includes('node_modules') &&
        !KNOWN_TOKEN_DEBT.some(debt => file.replace(/\\/g, '/').endsWith(debt))
    )
    .flatMap(file =>
      [...readFileSync(file, 'utf8').matchAll(/var\((--[a-z0-9-]+)\)/g)].map(
        match => ({ token: match[1], file })
      )
    );

// Tokens referenced by a stylesheet rule. Vite's production purgecss config
// sets `variables: true`, so a custom property declared in tokens.css is kept
// only while a surviving CSS rule references it — a JS-only reference (a
// constant or an inline style string) does not keep it alive. That is how
// `--font-size-md` disappeared from the built CSS.
const tokensUsedInCss = new Set(
  collectFiles(STYLES_DIR, '.css').flatMap(file =>
    [...readFileSync(file, 'utf8').matchAll(/var\((--[a-z0-9-]+)/g)].map(
      match => match[1]
    )
  )
);

const TOAST_DURATIONS = [
  [TOAST_TYPES.SUCCESS, TIMING.NOTIFICATION_SUCCESS],
  [TOAST_TYPES.ERROR, TIMING.NOTIFICATION_ERROR],
  [TOAST_TYPES.WARNING, TIMING.NOTIFICATION_WARNING],
  [TOAST_TYPES.INFO, TIMING.NOTIFICATION_INFO],
];

describe('Design token contract', () => {
  describe('notification timing', () => {
    it('defines a positive duration for every toast type', () => {
      const durationKeys = [
        'NOTIFICATION_SUCCESS',
        'NOTIFICATION_ERROR',
        'NOTIFICATION_WARNING',
        'NOTIFICATION_INFO',
      ];

      durationKeys.forEach(key => {
        expect(typeof TIMING[key]).toBe('number');
        expect(TIMING[key]).toBeGreaterThan(TIMING.ANIMATION_FAST);
      });
    });
  });

  describe('toast auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      clearAllToasts();
      document.body.innerHTML = '';
      vi.useRealTimers();
    });

    it.each(TOAST_DURATIONS)(
      'keeps a %s toast mounted for its whole duration',
      (type, duration) => {
        showToast('Saved!', type);

        // Present immediately and still readable well past the exit animation
        expect(document.querySelectorAll('.toast')).toHaveLength(1);
        vi.advanceTimersByTime(TIMING.ANIMATION_FAST * 5);
        expect(document.querySelectorAll('.toast')).toHaveLength(1);

        // Gone once its own duration plus the exit animation have elapsed
        vi.advanceTimersByTime(
          duration - TIMING.ANIMATION_FAST * 5 + TIMING.ANIMATION_FAST
        );
        expect(document.querySelectorAll('.toast')).toHaveLength(0);
      }
    );
  });

  describe('CSS custom properties', () => {
    it('declares every token referenced from JS without a fallback', () => {
      const unresolved = referencedTokens().filter(
        ({ token }) => !declaredTokens.has(token)
      );

      expect(unresolved).toEqual([]);
    });

    it('keeps every token used from JS alive through the production CSS purge', () => {
      const atRisk = referencedTokens().filter(
        ({ token }) => !tokensUsedInCss.has(token)
      );

      expect(atRisk).toEqual([]);
    });

    it.each([
      '--color-text',
      '--color-text-main',
      '--color-primary-dark',
      '--font-size-base',
      '--spacing-3xl',
    ])('declares %s', token => {
      expect(declaredTokens.has(token)).toBe(true);
    });
  });
});
