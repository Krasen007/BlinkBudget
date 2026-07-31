import { describe, it, expect } from 'vitest';
import {
  fileExists,
  getFileContent,
  methodExists,
} from '../../scripts/validate-docs.js';

describe('scripts/validate-docs', () => {
  const fixturePath = 'tests/fixtures/validate-docs-methods.js';

  it('should treat a fixture file as existing and readable', () => {
    expect(fileExists(fixturePath)).toBe(true);
    const content = getFileContent(fixturePath);
    expect(typeof content).toBe('string');
    expect(content).toContain('export class ValidateDocsFixture');
  });

  it('should not treat a directory as a file', () => {
    expect(fileExists('tests')).toBe(false);
    expect(getFileContent('tests')).toBe(null);
  });

  it('should match qualified class methods in actual declarations', () => {
    expect(
      methodExists(fixturePath, 'ValidateDocsFixture.declaredStaticMethod()')
    ).toBe(true);
  });

  it('should match standalone function declarations', () => {
    expect(methodExists(fixturePath, 'declaredFunction()')).toBe(true);
  });

  it('should not match methods mentioned only in comments', () => {
    expect(methodExists(fixturePath, 'commentedMethod()')).toBe(false);
  });

  it('should match arrow function declarations with unparenthesized params', () => {
    expect(methodExists(fixturePath, 'arrowFunctionMethod()')).toBe(true);
  });

  it('should match async arrow function declarations', () => {
    expect(methodExists(fixturePath, 'asyncArrowFunction()')).toBe(true);
  });
});
