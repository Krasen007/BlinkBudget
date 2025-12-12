import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('CSS Architecture Foundation', () => {
  const stylesDir = 'src/styles';
  
  it('should have all required directory structure', () => {
    const requiredDirs = [
      'tokens',
      'base', 
      'components',
      'mobile',
      'utilities'
    ];
    
    requiredDirs.forEach(dir => {
      expect(existsSync(join(stylesDir, dir))).toBe(true);
    });
  });
  
  it('should have all token files', () => {
    const tokenFiles = [
      'colors.css',
      'typography.css', 
      'spacing.css',
      'breakpoints.css',
      'index.css'
    ];
    
    tokenFiles.forEach(file => {
      expect(existsSync(join(stylesDir, 'tokens', file))).toBe(true);
    });
  });
  
  it('should have base files', () => {
    const baseFiles = [
      'reset.css',
      'typography.css',
      'index.css'
    ];
    
    baseFiles.forEach(file => {
      expect(existsSync(join(stylesDir, 'base', file))).toBe(true);
    });
  });
  
  it('should have main CSS entry point', () => {
    expect(existsSync(join(stylesDir, 'main.css'))).toBe(true);
  });
  
  it('should have proper import structure in main.css', () => {
    const mainCss = readFileSync(join(stylesDir, 'main.css'), 'utf-8');
    
    // Check that imports are in correct order
    expect(mainCss).toContain("@import './tokens/index.css'");
    expect(mainCss).toContain("@import './base/index.css'");
    expect(mainCss).toContain("@import './components/index.css'");
    expect(mainCss).toContain("@import './mobile/index.css'");
    expect(mainCss).toContain("@import './utilities/index.css'");
  });
  
  it('should have CSS custom properties defined in tokens', () => {
    const colorsCss = readFileSync(join(stylesDir, 'tokens/colors.css'), 'utf-8');
    const typographyCss = readFileSync(join(stylesDir, 'tokens/typography.css'), 'utf-8');
    const spacingCss = readFileSync(join(stylesDir, 'tokens/spacing.css'), 'utf-8');
    
    // Check for key CSS custom properties
    expect(colorsCss).toContain('--color-primary');
    expect(colorsCss).toContain('--color-background');
    expect(typographyCss).toContain('--font-body');
    expect(typographyCss).toContain('--font-size-base');
    expect(spacingCss).toContain('--spacing-lg');
  });
});