// tests/utilities/drag-reorder-utils.test.js
// Pure-function coverage for the drag-to-reorder math used by
// CustomCategoryManager. Kept DOM-free on purpose so the ordering rules can
// be verified without simulating native drag events.
import { describe, it, expect } from 'vitest';
import {
  moveIdToIndex,
  buildReorderFromDrop,
} from '../../src/utils/drag-reorder-utils.js';

describe('moveIdToIndex', () => {
  it('moves an id forward to the target index', () => {
    expect(moveIdToIndex(['a', 'b', 'c', 'd'], 'a', 2)).toEqual([
      'b',
      'c',
      'a',
      'd',
    ]);
  });

  it('moves an id backward to the target index', () => {
    expect(moveIdToIndex(['a', 'b', 'c', 'd'], 'd', 1)).toEqual([
      'a',
      'd',
      'b',
      'c',
    ]);
  });

  it('clamps an oversized target index to the end of the list', () => {
    expect(moveIdToIndex(['a', 'b', 'c'], 'a', 99)).toEqual(['b', 'c', 'a']);
  });

  it('clamps a negative target index to the start of the list', () => {
    expect(moveIdToIndex(['a', 'b', 'c'], 'c', -5)).toEqual(['c', 'a', 'b']);
  });

  it('returns a copy when the id is unknown', () => {
    const ids = ['a', 'b'];
    const result = moveIdToIndex(ids, 'zzz', 1);
    expect(result).toEqual(['a', 'b']);
    expect(result).not.toBe(ids);
  });
});

describe('buildReorderFromDrop', () => {
  it('places the dragged card in the target slot when dragging forward', () => {
    expect(buildReorderFromDrop(['a', 'b', 'c'], 'a', 'c')).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('places the dragged card in the target slot when dragging backward', () => {
    expect(buildReorderFromDrop(['a', 'b', 'c'], 'c', 'a')).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('returns null for a self-drop', () => {
    expect(buildReorderFromDrop(['a', 'b'], 'a', 'a')).toBeNull();
  });

  it('returns null when the dragged id is not in the list', () => {
    expect(buildReorderFromDrop(['a', 'b'], 'zzz', 'a')).toBeNull();
  });

  it('returns null when the target id is not in the list', () => {
    expect(buildReorderFromDrop(['a', 'b'], 'a', 'zzz')).toBeNull();
  });

  it('returns null when either id is missing', () => {
    expect(buildReorderFromDrop(['a', 'b'], null, 'a')).toBeNull();
    expect(buildReorderFromDrop(['a', 'b'], 'a', undefined)).toBeNull();
  });

  it('does not mutate the input array', () => {
    const ids = ['a', 'b', 'c'];
    buildReorderFromDrop(ids, 'a', 'c');
    expect(ids).toEqual(['a', 'b', 'c']);
  });
});
