# Documentation Validation

This document describes the validation system for keeping README references in sync with the actual codebase.

## Overview

The documentation validation script (`scripts/validate-docs.js`) automatically checks that all file and method references in the README actually exist in the codebase. This prevents documentation drift as the code evolves.

## Usage

### Basic Validation

```bash
yarn validate-docs
```

Checks all README references and reports any that don't exist.

### Statistics

```bash
yarn validate-docs:stats
```

Shows statistics about documentation coverage and most referenced files.

## What It Validates

The script extracts and validates references in the format:

```
| src/path/to/file.js:methodName() | src/path/to/another.js:anotherMethod()
```

For each reference, it checks:

1. **File Existence** - Does the file exist in the codebase?
2. **Method Existence** - Does the method/function exist in the file?
3. **Ignore Patterns** - Skips external services, configurations, and concepts

## Ignore Patterns

The script automatically ignores references to:

- External services (Firebase, GitHub, etc.)
- Configuration files (package.json, vite.config.js, etc.)
- External processes (deployment, monitoring, etc.)
- Concepts and strategies (caching strategies, etc.)
- Build and development processes

These are ignored because they're not actual code implementations but rather external dependencies or conceptual descriptions.

## Output

### Valid References

```
✅ VALID: | src/core/click-tracking-service.js:recordClick() (line 25)
```

### Invalid References

```
❌ INVALID: | src/core/nonexistent.js:missingMethod() (line 42)
   → File not found: src/core/nonexistent.js
```

### Ignored References

```
⚪ IGNORED: | Firebase auth configuration (line 178)
```

## Integration with Development

### Pre-commit Hook (Recommended)

Add to your `.git/hooks/pre-commit`:

```bash
#!/bin/sh
yarn validate-docs
```

### CI/CD Pipeline

Add to your CI workflow:

```yaml
- name: Validate Documentation
  run: yarn validate-docs
```

## Maintenance

### Adding New Ignore Patterns

Edit the `ignorePatterns` array in `scripts/validate-docs.js` to add new patterns that should be ignored.

### Updating Reference Patterns

The script uses regex patterns to match different method declaration styles:

- Function declarations: `function methodName()`
- Variable assignments: `const methodName =`
- Object properties: `methodName:`
- Method calls: `methodName(`
- String literals: `'methodName'`

## Troubleshooting

### False Positives

If the script reports valid references as invalid:

1. Check for typos in the README
2. Verify the method name matches exactly
3. Ensure the file path is correct

### False Negatives

If the script misses invalid references:

1. Check the regex pattern in `extractReferences()`
2. Ensure the reference format matches the expected pattern
3. Add new patterns to handle different reference styles

## Benefits

1. **Prevents Documentation Drift** - Catches outdated references immediately
2. **Automated Checking** - No manual verification needed
3. **CI/CD Integration** - Fails builds if documentation is out of sync
4. **Developer Feedback** - Clear error messages and suggestions
5. **Statistics** - Insight into documentation coverage and usage patterns

## Example Output

```
🔍 Validating README documentation references...

Found 156 references to validate

✅ VALID: | src/core/click-tracking-service.js:recordClick() (line 25)
✅ VALID: | src/components/TransactionForm.js:TransactionForm() (line 26)
...
❌ INVALID: | src/core/old-service.js:deprecatedMethod() (line 142)
   → File not found: src/core/old-service.js

📊 Validation Summary:
   Total references: 156
   Valid: 154
   Invalid: 2
   Ignored: 12

❌ Errors found:
   Line 142: | src/core/old-service.js:deprecatedMethod()
     → File not found: src/core/old-service.js

💡 Suggestions:
   1. Check for typos in file paths or method names
   2. Verify that files and methods actually exist
   3. Update README references to match current codebase
   4. Add new files/methods to ignore list if they are external concepts
```
