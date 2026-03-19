/**
 * Build Optimizer - WebApp.md Build Pipeline Enhancement
 * Advanced build optimization and bundle analysis
 */

export class BuildOptimizer {
  constructor() {
    this.metrics = {
      bundleSize: 0,
      chunkCount: 0,
      loadTime: 0,
      compressionRatio: 0,
    };

    this.optimizations = {
      treeshaking: true,
      minification: true,
      compression: true,
      codeSplitting: true,
      imageOptimization: true,
      cssPurging: true,
    };

    this._bundleObserver = null;
    this._interactionInterval = null;
    this._clickHandler = null;
  }

  // Bundle Analysis
  async analyzeBundle() {
    console.log('[BuildOptimizer] Analyzing bundle...');

    const analysis = {
      mainBundle: await this.analyzeMainBundle(),
      chunks: await this.analyzeChunks(),
      assets: await this.analyzeAssets(),
      dependencies: await this.analyzeDependencies(),
    };

    this.printAnalysis(analysis);
    return analysis;
  }

  async analyzeMainBundle() {
    // Simulate bundle analysis
    return {
      size: this.estimateBundleSize(),
      modules: this.getBundleModules(),
      entryPoints: this.getEntryPoints(),
      treeshaked: this.checkTreeshaking(),
      minified: this.checkMinification(),
    };
  }

  async analyzeChunks() {
    return {
      count: this.estimateChunkCount(),
      sizes: this.getChunkSizes(),
      loading: this.getChunkLoadingStrategy(),
      caching: this.getChunkCachingStrategy(),
    };
  }

  async analyzeAssets() {
    return {
      images: this.analyzeImages(),
      fonts: this.analyzeFonts(),
      css: this.analyzeCssAssets(),
      compression: this.analyzeCompression(),
    };
  }

  async analyzeDependencies() {
    return {
      total: this.getDependencyCount(),
      duplicates: this.findDuplicateDependencies(),
      outdated: this.findOutdatedDependencies(),
      bundleSize: this.getDependencyBundleSize(),
    };
  }

  // Optimization Recommendations
  generateOptimizations(analysis) {
    const recommendations = [];

    // Bundle size optimizations
    if (analysis.mainBundle.size > 200000) {
      // 200KB
      recommendations.push({
        type: 'bundle-size',
        priority: 'high',
        message: 'Main bundle exceeds 200KB target',
        suggestion: 'Implement code splitting and tree shaking',
      });
    }

    // Chunk optimizations
    if (analysis.chunks.count > 10) {
      recommendations.push({
        type: 'chunk-optimization',
        priority: 'medium',
        message: 'Too many chunks may impact performance',
        suggestion: 'Consolidate related chunks',
      });
    }

    // Image optimizations
    const largeImages = analysis.assets.images.filter(img => img.size > 100000); // 100KB
    if (largeImages.length > 0) {
      recommendations.push({
        type: 'image-optimization',
        priority: 'medium',
        message: `${largeImages.length} images exceed 100KB`,
        suggestion: 'Compress images and use modern formats',
      });
    }

    // Dependency optimizations
    if (analysis.dependencies.duplicates.length > 0) {
      recommendations.push({
        type: 'dependency-deduplication',
        priority: 'medium',
        message: 'Duplicate dependencies detected',
        suggestion: 'Use bundle deduplication',
      });
    }

    return recommendations;
  }

  // Bundle Size Estimation
  estimateBundleSize() {
    // This would integrate with build tools
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach(script => {
      if (script.src.includes('/dist/')) {
        totalSize += this.estimateAssetSize(script.src);
      }
    });

    return totalSize;
  }

  estimateChunkCount() {
    const scripts = document.querySelectorAll('script[src]');
    return Array.from(scripts).filter(
      script =>
        script.src.includes('.chunk.') || script.src.includes('/assets/')
    ).length;
  }

  estimateAssetSize(url) {
    // Rough estimation based on file extension
    const extension = url.split('.').pop();
    const sizeMap = {
      js: 50000, // 50KB average
      css: 25000, // 25KB average
      png: 50000, // 50KB average
      jpg: 40000, // 40KB average
      svg: 10000, // 10KB average
    };

    return sizeMap[extension] || 30000;
  }

  // Optimization Methods
  optimizeImages() {
    console.log('[BuildOptimizer] Optimizing images...');

    const images = document.querySelectorAll('img');
    const optimizations = [];

    images.forEach((img, _index) => {
      const optimization = {
        element: img,
        original: {
          src: img.src,
          size: this.estimateAssetSize(img.src),
        },
        optimizations: [],
      };

      // Add loading="lazy" if not present
      if (
        (!img.loading || img.loading !== 'lazy') &&
        this.isBelowTheFold(img)
      ) {
        img.loading = 'lazy';
        optimization.optimizations.push('Added lazy loading');
      }

      // Add proper dimensions if missing
      if (!img.width || !img.height) {
        optimization.optimizations.push(
          'Missing dimensions - add width/height'
        );
      }

      // Suggest modern formats
      if (img.src.includes('.jpg') || img.src.includes('.png')) {
        optimization.optimizations.push('Consider WebP/AVIF format');
      }

      optimizations.push(optimization);
    });

    return optimizations;
  }

  optimizeLoading() {
    console.log('[BuildOptimizer] Optimizing loading strategy...');

    // Preload critical resources
    this.preloadCriticalResources();

    // Optimize font loading
    this.optimizeFontLoading();

    // Implement resource hints
    this.addResourceHints();
  }

  preloadCriticalResources() {
    const criticalResources = [
      // Critical CSS
      { href: '/assets/main.css', as: 'style' },
      // Critical fonts
      { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2' },
      // Critical images
      { href: '/images/logo.svg', as: 'image' },
    ];

    criticalResources.forEach(resource => {
      const existing = document.head.querySelector(
        `link[rel="preload"][href="${resource.href}"][as="${resource.as}"]`
      );
      if (existing) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;

      if (resource.as === 'font') {
        link.crossOrigin = 'anonymous';
      }

      if (resource.type) {
        link.type = resource.type;
      }

      document.head.appendChild(link);
    });
  }

  optimizeFontLoading() {
    const fonts = document.querySelectorAll(
      'link[rel="stylesheet"][href*="font"]'
    );

    fonts.forEach(font => {
      if (!font.href.includes('woff2')) {
        console.log('Consider using WOFF2 for better compression:', font.href);
      }
    });
  }

  addResourceHints() {
    // DNS prefetch for external domains
    const domains = ['fonts.googleapis.com', 'cdn.jsdelivr.net'];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }

  // Performance Monitoring
  startPerformanceMonitoring() {
    console.log('[BuildOptimizer] Starting performance monitoring...');

    // Monitor bundle loading performance
    this.monitorBundleLoading();

    // Monitor resource loading
    this.monitorResourceLoading();

    // Monitor user interaction performance
    this.monitorInteractionPerformance();
  }

  monitorBundleLoading() {
    if (this._bundleObserver) {
      this._bundleObserver.disconnect();
    }

    this._bundleObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name.includes('bundle') || entry.name.includes('chunk')) {
          console.log(
            `Bundle loaded: ${entry.name} (${entry.duration.toFixed(2)}ms)`
          );

          if (entry.duration > 1000) {
            console.warn('Slow bundle loading detected:', {
              bundle: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
            });
          }
        }
      });
    });

    this._bundleObserver.observe({ entryTypes: ['resource'] });
  }

  monitorResourceLoading() {
    const resources = performance.getEntriesByType('resource');

    const analysis = {
      total: resources.length,
      slow: resources.filter(r => r.duration > 1000),
      large: resources.filter(r => r.transferSize > 100000),
      failed: resources.filter(r => r.decodedBodySize === 0),
    };

    if (analysis.slow.length > 0) {
      console.warn(`${analysis.slow.length} slow resources detected (>1s)`);
    }

    if (analysis.large.length > 0) {
      console.warn(
        `${analysis.large.length} large resources detected (>100KB)`
      );
    }

    if (analysis.failed.length > 0) {
      console.error(`${analysis.failed.length} failed resources detected`);
    }
  }

  monitorInteractionPerformance() {
    let interactionCount = 0;
    let totalResponseTime = 0;

    if (this._clickHandler) {
      document.removeEventListener('click', this._clickHandler);
    }

    this._clickHandler = event => {
      const startTime = performance.now();

      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;
        totalResponseTime += responseTime;
        interactionCount++;

        if (responseTime > 100) {
          console.warn('Slow interaction detected:', {
            type: 'click',
            target: event.target.tagName,
            responseTime: `${responseTime.toFixed(2)}ms`,
          });
        }
      });
    };

    document.addEventListener('click', this._clickHandler);

    // Report average interaction time
    if (this._interactionInterval) {
      clearInterval(this._interactionInterval);
    }

    this._interactionInterval = setInterval(() => {
      if (interactionCount > 0) {
        const avgResponseTime = totalResponseTime / interactionCount;
        console.log(
          `Average interaction response time: ${avgResponseTime.toFixed(2)}ms`
        );
      }
    }, 10000);
  }

  // Reporting
  printAnalysis(analysis) {
    console.log('\n=== Bundle Analysis ===');
    console.log('Main Bundle:', analysis.mainBundle);
    console.log('Chunks:', analysis.chunks);
    console.log('Assets:', analysis.assets);
    console.log('Dependencies:', analysis.dependencies);
    console.log('=====================\n');
  }

  async generateReport() {
    const analysis = await this.analyzeBundle();
    const optimizations = this.generateOptimizations(analysis);

    return {
      timestamp: new Date().toISOString(),
      analysis,
      optimizations,
      recommendations: optimizations.map(opt => ({
        ...opt,
        impact: this.calculateImpact(opt),
        effort: this.calculateEffort(opt),
      })),
      summary: {
        totalIssues: optimizations.length,
        highPriority: optimizations.filter(opt => opt.priority === 'high')
          .length,
        mediumPriority: optimizations.filter(opt => opt.priority === 'medium')
          .length,
        lowPriority: optimizations.filter(opt => opt.priority === 'low').length,
      },
    };
  }

  calculateImpact(optimization) {
    switch (optimization.type) {
      case 'bundle-size':
        return optimization.suggestion.includes('code splitting')
          ? 'high'
          : 'medium';
      case 'image-optimization':
        return 'medium';
      case 'dependency-deduplication':
        return 'high';
      default:
        return 'low';
    }
  }

  calculateEffort(optimization) {
    switch (optimization.type) {
      case 'bundle-size':
        return optimization.suggestion.includes('code splitting')
          ? 'high'
          : 'medium';
      case 'image-optimization':
        return 'medium';
      case 'dependency-deduplication':
        return 'low';
      default:
        return 'low';
    }
  }

  // Utility methods
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (!Number.isFinite(bytes) || bytes < 0) return '0 Bytes';
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = Math.round((bytes / Math.pow(1024, i)) * 100) / 100;

    return `${size} ${sizes[i]}`;
  }

  formatDuration(_ms) {
    if (_ms < 1000) return `${_ms.toFixed(0)}ms`;
    return `${(_ms / 1000).toFixed(2)}s`;
  }

  // Missing helper methods (safe defaults)
  getBundleModules() {
    return [];
  }

  getEntryPoints() {
    return [];
  }

  checkTreeshaking() {
    return Boolean(this.optimizations.treeshaking);
  }

  checkMinification() {
    return Boolean(this.optimizations.minification);
  }

  getChunkSizes() {
    return [];
  }

  getChunkLoadingStrategy() {
    return 'default';
  }

  getChunkCachingStrategy() {
    return 'default';
  }

  analyzeImages() {
    const images = Array.from(document.querySelectorAll('img'));
    return images.map(img => ({
      src: img.src,
      size: this.estimateAssetSize(img.src || ''),
    }));
  }

  analyzeFonts() {
    const fonts = Array.from(
      document.querySelectorAll(
        'link[rel="preload"][as="font"], link[rel="stylesheet"]'
      )
    );
    return fonts.map(link => ({
      href: link.href,
      type: link.type || null,
    }));
  }

  analyzeCssAssets() {
    const css = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return css.map(link => ({ href: link.href }));
  }

  analyzeCompression() {
    return { enabled: Boolean(this.optimizations.compression) };
  }

  getDependencyCount() {
    return 0;
  }

  findDuplicateDependencies() {
    return [];
  }

  findOutdatedDependencies() {
    return [];
  }

  getDependencyBundleSize() {
    return 0;
  }

  isBelowTheFold(img) {
    if (!img) return true;
    if (img.getAttribute('fetchpriority') === 'high') return false;
    if (img.hasAttribute('data-nolazy')) return false;
    const cls = img.className || '';
    if (typeof cls === 'string' && /(hero|logo|above-the-fold)/i.test(cls)) {
      return false;
    }
    return true;
  }

  stopMonitoring() {
    if (this._bundleObserver) {
      this._bundleObserver.disconnect();
      this._bundleObserver = null;
    }

    if (this._clickHandler) {
      document.removeEventListener('click', this._clickHandler);
      this._clickHandler = null;
    }

    if (this._interactionInterval) {
      clearInterval(this._interactionInterval);
      this._interactionInterval = null;
    }
  }
}

// Global build optimizer instance
export const buildOptimizer = new BuildOptimizer();

// Auto-initialize in development mode
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  document.addEventListener('DOMContentLoaded', () => {
    buildOptimizer.startPerformanceMonitoring();
  });
}
