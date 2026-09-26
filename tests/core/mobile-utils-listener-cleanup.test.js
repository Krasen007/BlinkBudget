import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Collects every listener registered on a stubbed EventTarget so a test can
 * assert on the count that destroy() actually left behind — the defect this
 * file guards against was invisible because registering and storing two
 * different .bind() results both "looked" registered.
 */
class SpyTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }

  count() {
    let total = 0;
    for (const handlers of this.listeners.values()) total += handlers.size;
    return total;
  }
}

describe('MobileUtils listener cleanup', () => {
  const originalAdd = window.addEventListener;
  const originalRemove = window.removeEventListener;
  const originalDocAdd = document.addEventListener;
  const originalDocRemove = document.removeEventListener;
  let originalVisualViewport;
  let windowSpy;
  let documentSpy;

  beforeEach(async () => {
    vi.resetModules();
    originalVisualViewport = window.visualViewport;

    windowSpy = new SpyTarget();
    documentSpy = new SpyTarget();
    window.addEventListener = windowSpy.addEventListener.bind(windowSpy);
    window.removeEventListener = windowSpy.removeEventListener.bind(windowSpy);
    document.addEventListener = documentSpy.addEventListener.bind(documentSpy);
    document.removeEventListener =
      documentSpy.removeEventListener.bind(documentSpy);
  });

  afterEach(() => {
    window.addEventListener = originalAdd;
    window.removeEventListener = originalRemove;
    document.addEventListener = originalDocAdd;
    document.removeEventListener = originalDocRemove;
    Object.defineProperty(window, 'visualViewport', {
      value: originalVisualViewport,
      configurable: true,
      writable: true,
    });
  });

  // Regression for #4.3: bind() returns a new object per call, so four
  // listeners were registered that destroy() could never remove. The contract
  // is load-bearing — initialize() calls destroy() specifically to avoid
  // duplicate listeners.
  it('removes every listener it registered on window and document', async () => {
    const { MobileUtils } = await import('../../src/core/mobile-utils.js');

    const utils = new MobileUtils();
    expect(windowSpy.count() + documentSpy.count()).toBeGreaterThan(0);

    utils.destroy();

    expect(windowSpy.count()).toBe(0);
    expect(documentSpy.count()).toBe(0);
  });

  it('removes the visual viewport scroll listener too', async () => {
    const viewportSpy = new SpyTarget();
    Object.defineProperty(window, 'visualViewport', {
      value: {
        height: window.innerHeight,
        offsetTop: 0,
        addEventListener: viewportSpy.addEventListener.bind(viewportSpy),
        removeEventListener: viewportSpy.removeEventListener.bind(viewportSpy),
      },
      configurable: true,
      writable: true,
    });

    const { MobileUtils } = await import('../../src/core/mobile-utils.js');
    const utils = new MobileUtils();
    expect(viewportSpy.count()).toBeGreaterThan(0);

    utils.destroy();

    expect(viewportSpy.count()).toBe(0);
  });

  it('leaves no listener behind after a re-initialize cycle', async () => {
    const { MobileUtils } = await import('../../src/core/mobile-utils.js');

    const first = new MobileUtils();
    first.destroy();
    const second = new MobileUtils();
    second.destroy();

    // A leaked listener from either instance would show up here as a nonzero
    // count; each cycle must fully clean up after itself.
    expect(windowSpy.count()).toBe(0);
    expect(documentSpy.count()).toBe(0);
  });
});
