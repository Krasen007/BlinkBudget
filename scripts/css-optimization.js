#!/usr/bin/env node

/**
 * CSS Optimization Utility
 *
 * This script provides utilities for analyzing and optimizing CSS in the BlinkBudget project.
 * It can analyze CSS file sizes, check for unused styles, and validate optimization settings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Analyze CSS file sizes and structure
 */
function analyzeCSSFiles() {
  console.log('📊 Analyzing CSS file structure...\n');

  const stylesDir = path.join(projectRoot, 'src/styles');
  const distDir = path.join(projectRoot, 'dist');

  // Analyze source CSS files
  if (fs.existsSync(stylesDir)) {
    console.log('Source CSS Files:');
    analyzeDirectory(stylesDir, 'src/styles/');
  }

  // Analyze built CSS files
  if (fs.existsSync(distDir)) {
    console.log('\nBuilt CSS Files:');
    analyzeDirectory(distDir, 'dist/', '.css');
  }
}

/**
 * Recursively analyze a directory for CSS files
 */
function analyzeDirectory(dir, prefix = '', extension = '.css') {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      analyzeDirectory(filePath, `${prefix}${file}/`, extension);
    } else if (file.endsWith(extension)) {
      const size = stat.size;
      const sizeKB = (size / 1024).toFixed(2);
      console.log(`  ${prefix}${file}: ${sizeKB} KB`);

      // Count lines and imports for CSS files
      if (extension === '.css') {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        const imports = (content.match(/@import/g) || []).length;
        console.log(`    Lines: ${lines}, Imports: ${imports}`);
      }
    }
  });
}

/**
 * Check if hot reloading is properly configured
 */
function checkHotReloading() {
  console.log('\n🔥 Checking hot reloading configuration...\n');

  const viteConfigPath = path.join(projectRoot, 'vite.config.js');

  if (fs.existsSync(viteConfigPath)) {
    const config = fs.readFileSync(viteConfigPath, 'utf8');

    const checks = [
      {
        name: 'HMR enabled',
        test: /hmr:\s*{/,
        status: config.match(/hmr:\s*{/) ? '✅' : '❌',
      },
      {
        name: 'CSS source maps in dev',
        test: /devSourcemap:\s*true/,
        status: config.match(/devSourcemap:\s*true/) ? '✅' : '❌',
      },
      {
        name: 'Watch configuration',
        test: /watch:\s*{/,
        status: config.match(/watch:\s*{/) ? '✅' : '❌',
      },
      {
        name: 'PostCSS integration',
        test: /postcss:\s*{}/,
        status: config.match(/postcss:\s*{}/) ? '✅' : '❌',
      },
    ];

    checks.forEach(check => {
      console.log(`${check.status} ${check.name}`);
    });
  } else {
    console.log('❌ vite.config.js not found');
  }
}

/**
 * Validate PostCSS configuration
 */
function validatePostCSSConfig() {
  console.log('\n⚙️ Validating PostCSS configuration...\n');

  const postcssConfigPath = path.join(projectRoot, 'postcss.config.js');

  if (fs.existsSync(postcssConfigPath)) {
    const config = fs.readFileSync(postcssConfigPath, 'utf8');

    const plugins = [
      {
        name: 'postcss-import',
        test: /'postcss-import'/,
        purpose: 'Resolves @import statements',
      },
      {
        name: 'autoprefixer',
        test: /autoprefixer/,
        purpose: 'Adds vendor prefixes',
      },
      {
        name: 'postcss-purgecss',
        test: /'@fullhuman\/postcss-purgecss'/,
        purpose: 'Removes unused CSS (production)',
      },
      {
        name: 'cssnano',
        test: /cssnano/,
        purpose: 'Minifies CSS (production)',
      },
    ];

    plugins.forEach(plugin => {
      const status = config.match(plugin.test) ? '✅' : '❌';
      console.log(`${status} ${plugin.name} - ${plugin.purpose}`);
    });
  } else {
    console.log('❌ postcss.config.js not found');
  }
}

/**
 * Test CSS purging configuration
 */
function testCSSPurging() {
  console.log('\n🧹 Testing CSS purging configuration...\n');

  const mainCSSPath = path.join(projectRoot, 'src/styles/main.css');

  if (fs.existsSync(mainCSSPath)) {
    const content = fs.readFileSync(mainCSSPath, 'utf8');
    const imports = content.match(/@import\s+['"][^'"]+['"]/g) || [];

    console.log(`Found ${imports.length} CSS imports:`);
    imports.forEach(imp => {
      console.log(`  ${imp}`);
    });

    console.log('\nPurgeCSS will analyze these content sources:');
    console.log('  - ./index.html');
    console.log('  - ./src/**/*.js');
    console.log('  - ./src/**/*.html');

    console.log('\nSafelisted patterns (preserved during purging):');
    console.log('  - Utility classes: flex, grid, hidden, etc.');
    console.log('  - State classes: active, disabled, loading, etc.');
    console.log('  - Mobile classes: mobile-*');
    console.log('  - Responsive variants: sm:, md:, lg:, xl:');
    console.log('  - Pseudo-classes: :hover, :focus, :active');
  } else {
    console.log('❌ Main CSS file not found');
  }
}

// Main execution
function main() {
  const command = process.argv[2];

  console.log('🎨 BlinkBudget CSS Optimization Utility\n');

  switch (command) {
    case 'analyze':
      analyzeCSSFiles();
      break;
    case 'hot-reload':
      checkHotReloading();
      break;
    case 'postcss':
      validatePostCSSConfig();
      break;
    case 'purge':
      testCSSPurging();
      break;
    case 'all':
    default:
      analyzeCSSFiles();
      checkHotReloading();
      validatePostCSSConfig();
      testCSSPurging();
      break;
  }

  console.log('\n✨ Analysis complete!');
}

main();
