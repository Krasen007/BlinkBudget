/**
 * Lazy Loader - WebApp.md Performance Optimization
 * Implements lazy loading for images, components, and routes
 */

const cssEscape = value => {
  const str = String(value ?? '');
  if (globalThis.CSS && typeof globalThis.CSS.escape === 'function') {
    return globalThis.CSS.escape(str);
  }

  return str.replace(/["\\\]]/g, '\\$&');
};

export class LazyLoader {
  constructor() {
    this.observers = new Map();
    this.loadedItems = new WeakSet();
    this.loadingItems = new WeakSet();
    this.loadedCount = 0;
    this.loadingCount = 0;
    this.config = {
      rootMargin: '50px',
      threshold: 0.1,
      enablePlaceholders: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
    };

    this.init();
  }

  cleanupFailedElement(element) {
    if (!element) return;
    if (this.loadingItems.has(element)) {
      this.loadingItems.delete(element);
      this.loadingCount = Math.max(0, this.loadingCount - 1);
    }
  }

  init() {
    if (!('IntersectionObserver' in window)) {
      console.warn('[LazyLoader] IntersectionObserver not supported');
      return;
    }

    console.log('[LazyLoader] Initializing lazy loading');
    this.setupGlobalObserver();
    this.observeNewElements();
  }

  setupGlobalObserver() {
    // Main intersection observer for lazy loading
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadElement(entry.target);
          }
        });
      },
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold,
      }
    );

    this.observers.set('main', observer);
  }

  observeNewElements() {
    // Watch for new lazy elements
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.observeElement(node);

            // Also observe child elements
            node.querySelectorAll?.('[data-lazy]').forEach(child => {
              this.observeElement(child);
            });
          }
        });
      });
    });

    const startObserving = () => {
      if (!document.body) return;
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    if (document.body) {
      startObserving();
    } else {
      document.addEventListener('DOMContentLoaded', startObserving, {
        once: true,
      });
    }

    this.observers.set('mutation', mutationObserver);
  }

  observeElement(element) {
    if (!element || !element.getAttribute) return;

    const lazyType = element.getAttribute('data-lazy');
    if (!lazyType) return;

    // Add placeholder if enabled
    if (this.config.enablePlaceholders && !this.loadedItems.has(element)) {
      this.addPlaceholder(element, lazyType);
    }

    // Start observing
    const mainObserver = this.observers.get('main');
    if (mainObserver) {
      mainObserver.observe(element);
    }
  }

  addPlaceholder(element, type) {
    switch (type) {
      case 'image':
        this.addImagePlaceholder(element);
        break;
      case 'component':
        this.addComponentPlaceholder(element);
        break;
      case 'route':
        this.addRoutePlaceholder(element);
        break;
    }
  }

  addImagePlaceholder(element) {
    if (element.tagName !== 'IMG') return;

    // Create placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'lazy-image-placeholder';
    placeholder.style.cssText = `
      width: ${element.getAttribute('width') || 'auto'};
      height: ${element.getAttribute('height') || '200px'};
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 14px;
    `;

    placeholder.innerHTML = '📷 Loading...';

    // Replace image with placeholder
    element.style.display = 'none';
    element.parentNode?.insertBefore(placeholder, element);

    // Store reference
    element._placeholder = placeholder;
  }

  addComponentPlaceholder(element) {
    const placeholder = document.createElement('div');
    placeholder.className = 'lazy-component-placeholder';
    placeholder.innerHTML = `
      <div class="skeleton">
        <div class="skeleton-text" style="width: 60%; height: 16px; margin-bottom: 8px;"></div>
        <div class="skeleton-text" style="width: 80%; height: 16px; margin-bottom: 8px;"></div>
        <div class="skeleton-text" style="width: 40%; height: 16px;"></div>
      </div>
    `;

    element.style.display = 'none';
    element.parentNode?.insertBefore(placeholder, element);
    element._placeholder = placeholder;
  }

  addRoutePlaceholder(element) {
    const placeholder = document.createElement('div');
    placeholder.className = 'lazy-route-placeholder';
    placeholder.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading content...</p>
      </div>
    `;

    element.appendChild(placeholder);
    element._placeholder = placeholder;
  }

  async loadElement(element) {
    if (this.loadedItems.has(element) || this.loadingItems.has(element)) return;

    this.loadingItems.add(element);
    this.loadingCount++;

    const lazyType = element.getAttribute('data-lazy');
    const src = element.getAttribute('data-src');

    try {
      switch (lazyType) {
        case 'image':
          await this.loadImage(element, src);
          break;
        case 'component':
          await this.loadComponent(element, src);
          break;
        case 'route':
          await this.loadRoute(element, src);
          break;
        case 'script':
          await this.loadScript(element, src);
          break;
        case 'style':
          await this.loadStyle(element, src);
          break;
      }
    } catch (error) {
      console.error('[LazyLoader] Failed to load element:', error);
      this.cleanupFailedElement(element);
      if (this.config.enableRetry) {
        this.retryLoad(element);
      }
      return;
    }

    this.cleanupFailedElement(element);
  }

  async loadImage(element, src) {
    if (!src) return;

    // Create new image to preload
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        element.src = src;
        element.removeAttribute('data-src');
        this.removePlaceholder(element);
        this.markAsLoaded(element);
        resolve();
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }

  async loadComponent(element, src) {
    // Dynamic import for component
    try {
      const module = await import(src);
      const Component = module.default || module;

      // Instantiate component
      let props = {};
      try {
        props = JSON.parse(element.getAttribute('data-props') || '{}');
      } catch (e) {
        console.warn(
          '[LazyLoader] Invalid data-props JSON, using empty props',
          e
        );
        props = {};
      }

      const component = new Component(element, props);

      this.removePlaceholder(element);
      this.markAsLoaded(element);

      // Emit component loaded event
      element.dispatchEvent(
        new CustomEvent('component-loaded', {
          detail: { component, src },
        })
      );
    } catch (error) {
      throw new Error(`Failed to load component: ${src}`, { cause: error });
    }
  }

  async loadRoute(element, src) {
    // Route loading implementation
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to load route: ${src} (${response.status})`);
      }
      const html = await response.text();

      element.innerHTML = html;
      this.removePlaceholder(element);
      this.markAsLoaded(element);

      // Initialize any components in the loaded content
      this.initializeComponents(element);
    } catch (error) {
      throw new Error(`Failed to load route: ${src}`, { cause: error });
    }
  }

  async loadScript(element, src) {
    return new Promise((resolve, reject) => {
      // Check for existing script with same src
      const escapedSrc = cssEscape(src);
      const existingScript = document.querySelector(
        `script[src="${escapedSrc}"]`
      );

      if (existingScript) {
        // If script is already loaded, resolve immediately
        if (
          existingScript.readyState === 'complete' ||
          existingScript.readyState === 'loaded'
        ) {
          this.markAsLoaded(element);
          resolve();
          return;
        }

        // If script exists but not loaded, attach handlers to existing script
        const handleLoad = () => {
          this.markAsLoaded(element);
          resolve();
        };

        const handleError = () => {
          reject(new Error(`Failed to load script: ${src}`));
        };

        existingScript.addEventListener('load', handleLoad);
        existingScript.addEventListener('error', handleError);
        return;
      }

      // Create new script if none exists
      const script = document.createElement('script');

      script.onload = () => {
        this.markAsLoaded(element);
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    });
  }

  async loadStyle(element, src) {
    return new Promise((resolve, reject) => {
      // Check for existing stylesheet with same href
      const escapedSrc = cssEscape(src);
      const existingLink = document.querySelector(
        `link[rel="stylesheet"][href="${escapedSrc}"]`
      );
      if (existingLink) {
        // If stylesheet is already loaded, resolve immediately
        if (existingLink.sheet) {
          this.markAsLoaded(element);
          resolve();
          return;
        }

        // If stylesheet exists but not loaded, attach handlers to existing link
        const handleLoad = () => {
          this.markAsLoaded(element);
          resolve();
        };

        const handleError = () => {
          reject(new Error(`Failed to load stylesheet: ${src}`));
        };

        existingLink.addEventListener('load', handleLoad);
        existingLink.addEventListener('error', handleError);
        return;
      }

      const link = document.createElement('link');

      link.onload = () => {
        this.markAsLoaded(element);
        resolve();
      };

      link.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${src}`));
      };

      link.rel = 'stylesheet';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  removePlaceholder(element) {
    if (element._placeholder) {
      element._placeholder.remove();
      element._placeholder = null;
    }

    element.style.display = '';
  }

  markAsLoaded(element) {
    if (!this.loadedItems.has(element)) {
      this.loadedItems.add(element);
      this.loadedCount++;
    }

    if (this.loadingItems.has(element)) {
      this.loadingItems.delete(element);
      this.loadingCount--;
    }

    // Stop observing
    const mainObserver = this.observers.get('main');
    if (mainObserver) {
      mainObserver.unobserve(element);
    }

    // Remove loading class and add loaded class
    element.classList.remove('lazy-loading');
    element.classList.add('lazy-loaded');

    // Emit loaded event
    element.dispatchEvent(new CustomEvent('lazy:loaded'));
  }

  async retryLoad(element) {
    const retryCount = parseInt(
      element.getAttribute('data-retry-count') || '0'
    );

    if (retryCount + 1 > this.config.maxRetries) {
      this.cleanupFailedElement(element);
      return;
    }

    element.setAttribute('data-retry-count', (retryCount + 1).toString());

    // Wait before retry
    setTimeout(
      () => {
        // Check if element is still connected to DOM before retry
        if (!element.isConnected || !document.contains(element)) {
          this.cleanupFailedElement(element);
          return;
        }

        this.cleanupFailedElement(element);
        this.loadElement(element);
      },
      this.config.retryDelay * (retryCount + 1)
    );
  }

  initializeComponents(container) {
    // Find and initialize components in loaded content
    container.querySelectorAll('[data-component]').forEach(element => {
      const componentName = element.getAttribute('data-component');

      if (!/^[A-Za-z0-9_-]+$/.test(componentName || '')) {
        console.error('[LazyLoader] Invalid component name:', componentName);
        return;
      }

      let props = {};
      try {
        props = JSON.parse(element.getAttribute('data-props') || '{}');
      } catch (e) {
        console.warn(
          '[LazyLoader] Invalid data-props JSON, using empty props',
          e
        );
        props = {};
      }

      // Dynamic component initialization
      import(`./components/${componentName}.js`)
        .then(module => {
          const Component = module.default || module;
          new Component(element, props);
        })
        .catch(error => {
          console.error(
            `[LazyLoader] Failed to initialize component ${componentName}:`,
            error
          );
        });
    });
  }

  // Utility methods
  preloadImage(src) {
    // Check for existing preload link
    const escapedSrc = cssEscape(src);
    const existingLink = document.querySelector(
      `link[rel="preload"][as="image"][href="${escapedSrc}"]`
    );
    if (existingLink) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }

  preloadComponent(src) {
    // Check for existing modulepreload link
    const escapedSrc = cssEscape(src);
    const existingLink = document.querySelector(
      `link[rel="modulepreload"][href="${escapedSrc}"]`
    );
    if (existingLink) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = src;
    document.head.appendChild(link);
  }

  // Get loading statistics
  getStats() {
    return {
      loaded: this.loadedCount,
      loading: this.loadingCount,
      observers: this.observers.size,
    };
  }

  // Load all lazy elements
  loadAll() {
    document.querySelectorAll('[data-lazy]').forEach(element => {
      this.loadElement(element);
    });
  }

  // Reset and cleanup
  reset() {
    this.observers.forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });
    this.observers.clear();
    this.loadedCount = 0;
    this.loadingCount = 0;
  }

  destroy() {
    this.reset();

    // Remove placeholders
    document
      .querySelectorAll(
        '.lazy-image-placeholder, .lazy-component-placeholder, .lazy-route-placeholder'
      )
      .forEach(placeholder => placeholder.remove());
  }
}

// Global lazy loader instance
export const lazyLoader = new LazyLoader();

// Auto-initialize
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      lazyLoader.init();
    });
  } else {
    lazyLoader.init();
  }
}
