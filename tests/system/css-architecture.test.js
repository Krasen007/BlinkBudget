import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Every stylesheet under src/styles, so a guard added here covers files that
// are imported outside main.css (critical.css via index.html, hero.css via
// LandingView.js, integrity-report.css via IntegrityReport.js).
const collectStyleSheets = dir =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectStyleSheets(entryPath);
    return entry.name.endsWith('.css') ? [entryPath] : [];
  });

// Normalise a keyframes body so two definitions compare by *meaning* rather than
// by formatting: whitespace collapsed, declarations reordered, and the `from` /
// `to` keywords canonicalised to their percentage equivalents. CSS defines
// `from` as `0%` and `to` as `100%`, so `@keyframes spin` written with keywords
// and written with percentages animate identically and must not read as a
// conflict.
const KEYWORD_OFFSETS = { from: '0%', to: '100%' };

const normaliseKeyframesBody = body =>
  body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('}')
    .map(block => {
      const selector = (block.match(/^[^{]*/) || [''])[0]
        .trim()
        .split(',')
        .map(part => KEYWORD_OFFSETS[part.trim()] || part.trim())
        .sort()
        .join(',');
      const declarations = (block.match(/\{([\s\S]*)/)?.[1] || '')
        .split(';')
        .map(d => d.trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .sort()
        .join(';');
      return `${selector} => ${declarations}`;
    })
    .join(' | ');

describe('CSS Architecture Foundation', () => {
  const stylesDir = 'src/styles';

  it('should have all required directory structure', () => {
    const requiredDirs = ['components', 'utilities'];

    requiredDirs.forEach(dir => {
      expect(existsSync(join(stylesDir, dir))).toBe(true);
    });
  });

  it('should have core style files', () => {
    const coreFiles = ['tokens.css', 'base.css', 'mobile.css', 'main.css'];

    coreFiles.forEach(file => {
      expect(existsSync(join(stylesDir, file))).toBe(true);
    });
  });

  it('should have proper import structure in main.css', () => {
    const mainCss = readFileSync(join(stylesDir, 'main.css'), 'utf-8');

    // Check that imports are in correct order by verifying their positions
    const imports = [
      "@import './tokens.css'",
      "@import './base.css'",
      "@import './components/ui.css'",
      "@import './mobile.css'",
      "@import './utilities/view-styles.css'",
    ];

    let lastIndex = -1;
    imports.forEach(importStr => {
      const currentIndex = mainCss.indexOf(importStr);
      expect(currentIndex).toBeGreaterThan(-1);
      expect(currentIndex).toBeGreaterThan(lastIndex);
      lastIndex = currentIndex;
    });
  });

  it('should have CSS custom properties defined in tokens', () => {
    const tokensCss = readFileSync(join(stylesDir, 'tokens.css'), 'utf-8');

    // Check for key CSS custom properties
    expect(tokensCss).toContain('--color-primary');
    expect(tokensCss).toContain('--color-background');
    expect(tokensCss).toContain('--font-body');
    expect(tokensCss).toContain('--font-size-base');
    expect(tokensCss).toContain('--spacing-lg');
  });

  /**
   * Regression guard for todo/ai-slop-report.md #4.1 (Round 2).
   *
   * `ui.css` and `mobile.css` both defined `@keyframes slideUp` with opposite
   * meanings. `main.css` imports mobile.css *after* ui.css, so the entrance
   * keyframes won the cascade, the exit keyframes were purged from the
   * production bundle, and the Settings advanced panel lost its close animation.
   *
   * Only *conflicting* definitions are rejected. Byte-identical repeats (`spin`
   * is defined in four files, `fadeIn` in two) are harmless duplication tracked
   * separately as findings #4.5/#4.6, so this guard stays green while that
   * cleanup is outstanding and still blocks the defect class that bites.
   */
  it('never defines the same @keyframes name twice with conflicting bodies', () => {
    const keyframesPattern =
      /@keyframes\s+([A-Za-z0-9_-]+)\s*\{([\s\S]*?)\n\}/g;
    const seen = new Map();
    const conflicts = [];

    for (const file of collectStyleSheets(stylesDir)) {
      const css = readFileSync(file, 'utf-8');
      let match;
      while ((match = keyframesPattern.exec(css)) !== null) {
        const [, name, rawBody] = match;
        const body = normaliseKeyframesBody(rawBody);
        const locations = seen.get(name) || new Map();

        for (const [otherBody, otherFiles] of locations) {
          if (otherBody !== body) {
            conflicts.push(
              `@keyframes ${name} conflicts: ${[...otherFiles, file].join(' vs ')}`
            );
          }
        }

        if (!locations.has(body)) locations.set(body, []);
        locations.get(body).push(file);
        seen.set(name, locations);
      }
    }

    expect(conflicts).toEqual([]);
  });

  /**
   * The other half of the #4.1 fix, and the half that carries the user-visible
   * symptom. `SettingsView` drops `--visible` — the only other rule that declares
   * `display: block` — in the same tick it starts the close. If the close rule
   * does not supply a display of its own, the panel falls straight back to the
   * base `.advanced-settings-section { display: none }` and the exit animation is
   * never observable, however correct the keyframes are.
   *
   * Paired with `tests/views/settings-advanced-toggle.test.js`, which proves the
   * JS actually parks the panel in the `--closing` state awaiting this rule.
   * Neither test alone can see the whole chain.
   */
  it('keeps the advanced-settings close state displayed so the exit animation runs', () => {
    const uiCss = readFileSync(join(stylesDir, 'components/ui.css'), 'utf-8');
    // Comments are stripped first: this rule's own comment explains the
    // `display: block` requirement, and matching against raw text would let the
    // prose satisfy an assertion about the declaration.
    const closingRule = uiCss
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .match(/\.advanced-settings-section--closing\s*\{([^}]*)\}/);

    expect(closingRule).not.toBeNull();
    expect(closingRule[1]).toMatch(/(^|;)\s*display:\s*block/);
  });
});
