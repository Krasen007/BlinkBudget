import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('PostCSS Integration', () => {
  it('should have PostCSS configuration file', () => {
    expect(existsSync('postcss.config.js')).toBe(true);
  });
  
  it('should have Stylelint configuration file', () => {
    expect(existsSync('.stylelintrc.js')).toBe(true);
  });
  
  it('should have updated Vite configuration for CSS processing', () => {
    const viteConfig = readFileSync('vite.config.js', 'utf-8');
    
    // Check that CSS configuration is present
    expect(viteConfig).toContain('css:');
    expect(viteConfig).toContain('postcss:');
    expect(viteConfig).toContain('devSourcemap:');
  });
  
  it('should have CSS linting scripts in package.json', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    
    expect(packageJson.scripts['lint:css']).toBeDefined();
    expect(packageJson.scripts['lint:css:fix']).toBeDefined();
  });
});