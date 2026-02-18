import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
      "@import './utilities/layout.css'",
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
});
