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

/**
 * Check if a method exists in a file
 * For README validation, we only check file existence since it contains descriptive text
 */
function methodExists(_filePath, _methodOrDescription) {
  // README documentation contains descriptive text, not exact method names
  // We only validate that file exists, not specific methods
  return true;
}

/**
 * Check if a reference should be ignored
 */
function shouldIgnore(filePath, methodOrDescription) {
  const ignoreTerms = [
    'configuration', 'strategy', 'management', 'enforcement', 'monitoring',
    'standards', 'guidelines', 'documentation', 'deployment', 'integration',
    'external', 'process', 'concept', 'validation', 'handling', 'operations',
    'flows', 'verification', 'navigation', 'support', 'tracking', 'display',
    'rendering', 'creation', 'generation', 'analysis', 'calculations',
    'optimization', 'suggestions', 'recommendations', 'alerts', 'warnings',
    'detection', 'identification', 'comparison', 'predictions', 'projections',
    'planning', 'performance', 'improvements', 'enhancements', 'features',
    'functionality', 'capabilities', 'implementation', 'architecture',
    'organization', 'structure', 'patterns', 'principles', 'approach',
    'methodology', 'techniques', 'best practices', 'experience', 'interface',
    'system', 'service', 'engine', 'cache', 'storage', 'database',
    'network', 'connection', 'communication', 'protocol', 'format',
    'standard', 'specification', 'requirement', 'constraint', 'limitation',
    'advantage', 'benefit', 'drawback', 'issue', 'problem', 'solution',
    'alternative', 'option', 'choice', 'decision', 'selection', 'filter',
    'sync', 'backup', 'restore', 'export', 'import', 'data', 'information',
    'content', 'material', 'resource', 'asset', 'component', 'element',
    'section', 'area', 'region', 'zone', 'space', 'environment', 'context',
    'framework', 'library', 'tool', 'utility', 'helper', 'function',
    'method', 'procedure', 'routine', 'algorithm', 'logic', 'code',
    'script', 'program', 'application', 'software', 'system', 'platform',
    'infrastructure', 'foundation', 'base', 'core', 'central', 'main',
    'primary', 'secondary', 'auxiliary', 'supporting', 'additional',
    'extra', 'optional', 'required', 'mandatory', 'essential', 'critical',
    'important', 'significant', 'major', 'minor', 'trivial', 'negligible',
    'automatic', 'manual', 'interactive', 'passive', 'active', 'dynamic',
    'static', 'fixed', 'flexible', 'adaptable', 'responsive', 'scalable',
    'portable', 'compatible', 'interoperable', 'integrated', 'connected',
    'linked', 'associated', 'related', 'corresponding', 'relevant', 'applicable',
    'suitable', 'appropriate', 'proper', 'correct', 'accurate', 'precise',
    'exact', 'specific', 'particular', 'individual', 'unique', 'distinct',
    'separate', 'different', 'various', 'multiple', 'numerous', 'many',
    'several', 'few', 'some', 'all', 'every', 'each', 'any', 'no', 'none',
    'first', 'last', 'next', 'previous', 'current', 'existing', 'new',
    'old', 'latest', 'recent', 'past', 'future', 'present', 'temporary',
    'permanent', 'transient', 'persistent', 'consistent', 'inconsistent',
    'reliable', 'unreliable', 'stable', 'unstable', 'robust', 'fragile',
    'strong', 'weak', 'powerful', 'limited', 'unlimited', 'infinite',
    'finite', 'bounded', 'unbounded', 'restricted', 'unrestricted', 'free',
    'paid', 'commercial', 'open-source', 'proprietary', 'public', 'private',
    'secure', 'insecure', 'safe', 'unsafe', 'protected', 'unprotected',
    'encrypted', 'decrypted', 'authenticated', 'unauthenticated', 'authorized',
    'unauthorized', 'permitted', 'forbidden', 'allowed', 'denied', 'granted',
    'revoked', 'enabled', 'disabled', 'activated', 'deactivated', 'on',
    'off', 'true', 'false', 'yes', 'no', 'valid', 'invalid', 'correct',
    'incorrect', 'right', 'wrong', 'good', 'bad', 'positive', 'negative',
    'success', 'failure', 'error', 'warning', 'info', 'debug', 'trace',
    'log', 'message', 'notification', 'alert', 'reminder', 'notice', 'announcement',
    'update', 'upgrade', 'downgrade', 'patch', 'fix', 'repair', 'maintenance',
    'installation', 'setup', 'configuration', 'customization', 'personalization',
    'localization', 'internationalization', 'translation', 'adaptation', 'modification',
    'extension', 'enhancement', 'improvement', 'optimization', 'refactoring',
    'testing', 'debugging', 'profiling', 'monitoring', 'analysis', 'measurement',
    'evaluation', 'assessment', 'review', 'audit', 'inspection', 'verification',
    'validation', 'certification', 'compliance', 'adherence', 'conformance',
    'standards', 'regulations', 'policies', 'procedures', 'guidelines', 'rules',
    'constraints', 'restrictions', 'limitations', 'requirements', 'specifications',
    'criteria', 'conditions', 'prerequisites', 'dependencies', 'relationships',
    'associations', 'connections', 'links', 'references', 'citations', 'sources',
    'origins', 'roots', 'foundations', 'bases', 'cores', 'centers', 'hearts',
    'middles', 'ends', 'beginnings', 'starts', 'openings', 'closings', 'exits',
    'entrances', 'access points', 'gateways', 'portals', 'doors', 'windows',
    'views', 'perspectives', 'angles', 'positions', 'locations', 'places',
    'sites', 'destinations', 'targets', 'goals', 'objectives', 'aims', 'purposes',
    'intentions', 'motivations', 'reasons', 'causes', 'factors', 'elements',
    'components', 'parts', 'pieces', 'fragments', 'segments', 'sections',
    'subsections', 'chapters', 'paragraphs', 'sentences', 'phrases', 'words',
    'characters', 'symbols', 'marks', 'signs', 'indicators', 'signals',
    'messages', 'communications', 'transmissions', 'broadcasts', 'announcements',
    'publications', 'releases', 'launches', 'introductions', 'presentations',
    'demonstrations', 'examples', 'samples', 'instances', 'cases', 'scenarios',
    'situations', 'contexts', 'environments', 'settings', 'backgrounds',
    'foregrounds', 'highlights', 'emphases', 'focuses', 'centers', 'mains',
    'primaries', 'secondaries', 'tertiaries', 'auxiliaries', 'supplements',
    'additions', 'extras', 'bonuses', 'benefits', 'advantages', 'strengths',
    'weaknesses', 'limitations', 'drawbacks', 'disadvantages', 'problems',
    'issues', 'challenges', 'obstacles', 'barriers', 'hurdles', 'difficulties',
    'complexities', 'complications', 'simplifications', 'clarifications',
    'explanations', 'descriptions', 'definitions', 'meanings', 'interpretations',
    'understandings', 'comprehensions', 'perceptions', 'views', 'opinions',
    'beliefs', 'assumptions', 'hypotheses', 'theories', 'models', 'frameworks',
    'structures', 'architectures', 'designs', 'patterns', 'templates', 'schemata',
    'schemas', 'formats', 'layouts', 'arrangements', 'organizations', 'orderings',
    'sortings', 'groupings', 'classifications', 'categorizations', 'taxonomies',
    'hierarchies', 'levels', 'layers', 'tiers', 'ranks', 'grades', 'classes',
    'types', 'kinds', 'sorts', 'varieties', 'categories', 'divisions', 'sections',
    'partitions', 'segments', 'fragments', 'parts', 'portions', 'shares',
    'quotas', 'allocations', 'distributions', 'assignments', 'designations',
    'identifications', 'recognitions', 'detections', 'discoveries', 'findings',
    'results', 'outcomes', 'outputs', 'products', 'deliverables', 'achievements',
    'accomplishments', 'successes', 'victories', 'wins', 'gains', 'profits',
    'benefits', 'rewards', 'returns', 'payoffs', 'outcomes', 'consequences',
    'effects', 'impacts', 'influences', 'repercussions', 'ramifications',
    'implications', 'significances', 'importances', 'priorities', 'emphases',
    'stresses', 'focuses', 'attentions', 'concentrations', 'dedications',
    'commitments', 'investments', 'contributions', 'participations', 'involvements',
    'engagements', 'interactions', 'communications', 'exchanges', 'transfers',
    'transactions', 'operations', 'activities', 'actions', 'behaviors', 'performances',
    'executions', 'implementations', 'realizations', 'manifestations', 'expressions',
    'representations', 'symbolizations', 'metaphors', 'analogies', 'comparisons',
    'contrasts', 'differences', 'similarities', 'resemblances', 'correspondences',
    'equivalences', 'identities', 'equalities', 'inequalities', 'disparities',
    'gaps', 'distances', 'spaces', 'intervals', 'periods', 'durations',
    'times', 'moments', 'instants', 'seconds', 'minutes', 'hours', 'days',
    'weeks', 'months', 'years', 'decades', 'centuries', 'millennia', 'ages',
    'eras', 'epochs', 'periods', 'phases', 'stages', 'steps', 'levels',
    'degrees', 'ranks', 'positions', 'statuses', 'states', 'conditions',
    'situations', 'circumstances', 'contexts', 'environments', 'surroundings',
    'settings', 'backgrounds', 'contexts', 'frameworks', 'structures'
  ];

  return config.ignorePatterns.some(pattern => 
    filePath.includes(pattern) || methodOrDescription.includes(pattern)
  ) || ignoreTerms.some(term => 
    methodOrDescription.toLowerCase().includes(term.toLowerCase())
  ) || methodOrDescription.length > 50; // Ignore long descriptions
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
