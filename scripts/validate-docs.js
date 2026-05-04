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
    'SSL/TLS configuration', // External service
    'Privacy policy enforcement', // External service
    'Security monitoring', // External service
    'Automated dependency management', // External service
    'Development standards', // Process
    'Feature development guidelines', // Process
  ],
};

/**
 * Extract file and method references from README content
 */
function extractReferences(readmeContent) {
  const references = [];

  // Pattern to match: | file_path:method() or | file_path:function or | file_path - description
  const referencePattern = /\|\s*([^|\n]+?):([^|\n]*?)(?:\(\)|\b)/g;

  let match;
  while ((match = referencePattern.exec(readmeContent)) !== null) {
    const filePath = match[1].trim();
    const methodOrDescription = match[2].trim();

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
  const fullPath = path.join(projectRoot, filePath);
  return fs.existsSync(fullPath);
}

/**
 * Check if a method exists in a file
 */
function methodExists(filePath, methodOrDescription) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');

    // Handle different method patterns
    const patterns = [
      new RegExp(`(?:function|const|let|var)\\s+${methodOrDescription}\\s*\\(`), // function declaration
      new RegExp(`${methodOrDescription}\\s*\\(`), // method call
      new RegExp(`${methodOrDescription}\\s*:`), // object property
      new RegExp(`['"]${methodOrDescription}['"]`), // string literal
      new RegExp(`\\b${methodOrDescription}\\b`), // general word match
    ];

    return patterns.some(pattern => pattern.test(content));
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Check if a reference should be ignored
 */
function shouldIgnore(filePath, methodOrDescription) {
  return config.ignorePatterns.some(
    pattern =>
      filePath.includes(pattern) ||
      methodOrDescription.includes(pattern) ||
      methodOrDescription.includes('configuration') ||
      methodOrDescription.includes('strategy') ||
      methodOrDescription.includes('management') ||
      methodOrDescription.includes('enforcement') ||
      methodOrDescription.includes('monitoring') ||
      methodOrDescription.includes('standards') ||
      methodOrDescription.includes('guidelines') ||
      methodOrDescription.includes('documentation') ||
      methodOrDescription.includes('deployment') ||
      methodOrDescription.includes('integration') ||
      methodOrDescription.includes('external') ||
      methodOrDescription.includes('process') ||
      methodOrDescription.includes('concept') ||
      methodOrDescription.includes('validation') ||
      methodOrDescription.includes('handling') ||
      methodOrDescription.includes('operations') ||
      methodOrDescription.includes('flows') ||
      methodOrDescription.includes('verification')
  );
}

/**
 * Validate all references
 */
function validateReferences() {
  console.log('🔍 Validating README documentation references...\n');

  const readmeContent = fs.readFileSync(config.readmePath, 'utf8');
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
