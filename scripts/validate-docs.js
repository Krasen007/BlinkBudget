#!/usr/bin/env node

/**
 * Documentation Validation Script
 *
 * This script validates that all README references to files and methods
 * actually exist in the codebase to prevent documentation drift.
 *
 * Usage: node scripts/validate-docs.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const config = {
  readmePath: path.join(projectRoot, 'README.md'),
  srcDir: path.join(projectRoot, 'src'),
  ignorePatterns: [
    'Firebase', // External service
    'package.json', // Build file
    'manifest.webmanifest', // PWA manifest
    'firestore.rules', // Firebase rules
    'public/.well-known/assetlinks.json', // TWA verification
    'vite.config.js', // Build config
    'SSL/TLS configuration', // External service
    'Firebase session handling', // External service
    'Firebase auth configuration', // External service
    'Firebase security configuration', // External service
    'Firebase data minimization', // External service
    'Privacy policy enforcement', // External service
    'Security monitoring', // External service
    'Automated dependency management', // External service
    'Development standards', // Process
    'Feature development guidelines', // Process
    'Privacy documentation', // External
    'Android TWA deployment', // External process
    'Cache hierarchy', // Concept
    'Cache invalidation logic', // Concept
    'Cache TTL management', // Concept
    'Build optimization', // Process
    'Lazy loading strategies', // Concept
    'Adaptive loading strategies', // Concept
    'CSS media queries', // Concept
    'Touch event handlers', // Concept
    'Viewport management', // Concept
    'GitHub integration', // External
    'Mobile touch optimization', // Concept
    'Performance metrics collection', // Concept
    'Service Worker caching strategies', // Concept
    'Service Worker sync API', // Concept
    'PWA configuration', // Concept
    'Push notification system', // Concept
    'TWA configuration', // Concept
    'Firebase HTTPS enforcement', // External service
    'missing-service', // Example reference
    'path/to/file', // Example reference
    'another/file', // Example reference
    'nonexistent-service', // Example reference
    'deprecatedMethod', // Example method
  ],
};

/**
 * Extract file and method references from README content
 */
function extractReferences(readmeContent) {
  const references = [];

  // Pattern to match: | file_path:method() or | file_path:function or | file_path - description
  const referencePattern = /\|\s*([^|\n]+?):([^|\n]*?)(?=\s*\||$)/g;

  let match;
  while ((match = referencePattern.exec(readmeContent)) !== null) {
    const filePath = match[1].trim();
    const methodOrDescription = match[2].trim();

    if (!methodOrDescription) {
      continue;
    }

    references.push({
      filePath,
      methodOrDescription,
      fullMatch: match[0].trim(),
      lineNumber: getLineNumber(readmeContent, match.index),
    });
  }

  return references;
}

/**
 * Get line number for a given index in the content
 */
function getLineNumber(content, index) {
  const beforeIndex = content.substring(0, index);
  return beforeIndex.split('\n').length;
}

/**
 * Check if a file exists in the codebase
 */
function fileExists(filePath) {
  const fullPath = path.resolve(projectRoot, filePath);
  const resolvedProjectRoot = path.resolve(projectRoot);
  if (!fullPath.startsWith(resolvedProjectRoot)) {
    return false;
  }
  return fs.existsSync(fullPath);
}

// Cache for file contents to avoid repeated reads during validation
const fileContentCache = new Map();

/**
 * Get file content with caching
 * @param {string} filePath - Relative path to the file
 * @returns {string|null} File content or null if file doesn't exist
 */
function getFileContent(filePath) {
  if (fileContentCache.has(filePath)) {
    return fileContentCache.get(filePath);
  }
  const fullPath = path.resolve(projectRoot, filePath);
  const resolvedProjectRoot = path.resolve(projectRoot);
  if (!fullPath.startsWith(resolvedProjectRoot) || !fs.existsSync(fullPath)) {
    fileContentCache.set(filePath, null);
    return null;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  fileContentCache.set(filePath, content);
  return content;
}

/**
 * Check if a method exists in a file
 *
 * Validates method-call references (e.g., methodName() or Class.methodName())
 * against the actual file contents. Descriptive-prose references that don't
 * use call syntax (no parentheses) are not checked, since they describe
 * behavior rather than naming a specific callable symbol.
 *
 * @param {string} filePath - Relative path to the file
 * @param {string} methodOrDescription - Method name or descriptive text from README
 * @returns {boolean} True if the method exists or the reference is descriptive prose
 */
function methodExists(filePath, methodOrDescription) {
  // Extract method names that use call syntax: methodName() or Class.methodName()
  const methodPattern = /(\w+)\(\)/g;
  const methodNames = [];
  let match;
  while ((match = methodPattern.exec(methodOrDescription)) !== null) {
    methodNames.push(match[1]);
  }

  // No method() pattern found — it's descriptive prose, can't validate
  if (methodNames.length === 0) {
    return true;
  }

  // If file doesn't exist, let fileExists handle the error
  const content = getFileContent(filePath);
  if (content === null) {
    return true;
  }

  // Check each method name exists as an identifier in the file content
  return methodNames.every(methodName => {
    const escaped = methodName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const identifierRegex = new RegExp(`\\b${escaped}\\b`);
    return identifierRegex.test(content);
  });
}

/**
 * Check if a reference should be ignored
 */
function shouldIgnore(filePath, methodOrDescription) {
  const ignoreTerms = [
    'Android TWA',
    'Cloud Firestore',
    'Firebase',
    'Firebase Auth',
    'Firebase Realtime Database',
    'Google Analytics',
    'GitHub Actions',
    'GitHub Pages',
    'Netlify',
    'Netlify.toml',
    'npm',
    'package.json',
    'PostCSS',
    'PWA',
    'Service Worker',
    'Stripe',
    'Vite',
    'Vitest',
    'Yarn',
    'build tools',
  ];

  return (
    config.ignorePatterns.some(
      pattern =>
        filePath.includes(pattern) || methodOrDescription.includes(pattern)
    ) ||
    ignoreTerms.some(term => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
      return regex.test(methodOrDescription);
    }) ||
    methodOrDescription.length > 50
  ); // Ignore long descriptions
}

/**
 * Validate all references
 */
function validateReferences() {
  console.log('🔍 Validating README documentation references...\n');

  let readmeContent;
  try {
    readmeContent = fs.readFileSync(config.readmePath, 'utf8');
  } catch (error) {
    console.error(
      `Error reading README file at ${config.readmePath}:`,
      error.message
    );
    process.exit(1);
  }

  const references = extractReferences(readmeContent);

  let validCount = 0;
  let invalidCount = 0;
  let ignoredCount = 0;
  const errors = [];

  console.log(`Found ${references.length} references to validate\n`);

  for (const ref of references) {
    // Check if reference should be ignored
    if (shouldIgnore(ref.filePath, ref.methodOrDescription)) {
      ignoredCount++;
      console.log(`⚪  IGNORED: ${ref.fullMatch} (line ${ref.lineNumber})`);
      continue;
    }

    const fileValid = fileExists(ref.filePath);
    const methodValid = methodExists(ref.filePath, ref.methodOrDescription);

    if (fileValid && methodValid) {
      validCount++;
      console.log(`✅  VALID: ${ref.fullMatch} (line ${ref.lineNumber})`);
    } else {
      invalidCount++;
      const error = {
        reference: ref,
        fileExists: fileValid,
        methodExists: methodValid,
        lineNumber: ref.lineNumber,
      };
      errors.push(error);

      if (!fileValid && !methodValid) {
        console.log(
          `❌  INVALID: ${ref.fullMatch} (line ${ref.lineNumber}) - File and method not found`
        );
      } else if (!fileValid) {
        console.log(
          `❌  INVALID: ${ref.fullMatch} (line ${ref.lineNumber}) - File not found`
        );
      } else {
        console.log(
          `❌  INVALID: ${ref.fullMatch} (line ${ref.lineNumber}) - Method not found`
        );
      }
    }
  }

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`   Total references: ${references.length}`);
  console.log(`   Valid: ${validCount}`);
  console.log(`   Invalid: ${invalidCount}`);
  console.log(`   Ignored: ${ignoredCount}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(error => {
      console.log(
        `\n   Line ${error.lineNumber}: ${error.reference.fullMatch}`
      );
      if (!error.fileExists) {
        console.log(`     → File not found: ${error.reference.filePath}`);
      }
      if (!error.methodExists) {
        console.log(
          `     → Method not found: ${error.reference.methodOrDescription}`
        );
      }
    });

    console.log('\n💡 Suggestions:');
    console.log('   1. Check for typos in file paths or method names');
    console.log('   2. Verify that files and methods actually exist');
    console.log('   3. Update README references to match current codebase');
    console.log(
      '   4. Add new files/methods to ignore list if they are external concepts'
    );

    process.exit(1);
  } else {
    console.log('\n🎉 All references are valid!');
    process.exit(0);
  }
}

/**
 * Generate statistics about the documentation
 */
function generateStats() {
  if (!config.readmePath || !fs.existsSync(config.readmePath)) {
    console.warn(
      'Warning: README file not found, skipping statistics generation'
    );
    console.log('\n📈 Documentation Statistics:');
    console.log('   Total references: 0');
    console.log('   Unique files: 0');
    console.log('\n📁 Most referenced files:');
    console.log('   No files found');
    return;
  }

  const readmeContent = fs.readFileSync(config.readmePath, 'utf8');
  const references = extractReferences(readmeContent);

  const fileStats = {};

  references.forEach(ref => {
    // Count files
    if (!fileStats[ref.filePath]) {
      fileStats[ref.filePath] = 0;
    }
    fileStats[ref.filePath]++;
  });

  console.log('\n📈 Documentation Statistics:');
  console.log(`   Total references: ${references.length}`);
  console.log(`   Unique files: ${Object.keys(fileStats).length}`);

  console.log('\n📁 Most referenced files:');
  const sortedFiles = Object.entries(fileStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  sortedFiles.forEach(([file, count]) => {
    console.log(`   ${file}: ${count} references`);
  });
}

// Main execution
if (process.argv.includes('--stats')) {
  generateStats();
} else {
  validateReferences();
}
