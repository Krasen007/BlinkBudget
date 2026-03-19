/**
 * Performance Monitor - WebApp.md Performance Targets
 * Monitors and optimizes application performance
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // Core Web Vitals
      lcp: null, // Largest Contentful Paint
      fid: null, // First Input Delay
      cls: null, // Cumulative Layout Shift

      // Additional metrics
      ttfb: null, // Time to First Byte
      domContentLoaded: null,
      loadComplete: null,

      // Custom metrics
      componentRenderTime: new Map(),
      userInteractionLatency: [],
      memoryUsage: [],

      // Performance targets from webapp.md
      targets: {
        lcp: 2500, // < 2.5s
        fid: 200, // < 200ms
        cls: 0.1, // < 0.1
        fcp: 1800, // < 1.8s
        tti: 3500, // < 3.5s
      },
    };

    this.observers = new Map();
    this.isMonitoring = false;
    this.performanceSupported = this.checkPerformanceSupport();

    this.continuousMonitorInterval = null;
    this._interactionHandlers = null;
    this._loadListener = null;
  }

  checkPerformanceSupport() {
    if (typeof window === 'undefined') return false;
    return !!(window.performance && window.PerformanceObserver);
  }

  start() {
    if (!this.performanceSupported || this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('[PerformanceMonitor] Starting performance monitoring');

    // Start timing immediately
    this.startTime = performance.now();

    // Initialize observers
    this.initializeObservers();

    // Measure initial page load
    this.measurePageLoad();

    // Start continuous monitoring
    this.startContinuousMonitoring();
  }

  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    console.log('[PerformanceMonitor] Stopping performance monitoring');

    // Disconnect all observers
    this.observers.forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });
    this.observers.clear();

    if (this.continuousMonitorInterval) {
      clearInterval(this.continuousMonitorInterval);
      this.continuousMonitorInterval = null;
    }

    if (this._interactionHandlers) {
      document.removeEventListener('click', this._interactionHandlers.click, {
        passive: true,
      });
      document.removeEventListener(
        'touchstart',
        this._interactionHandlers.touchstart,
        { passive: true }
      );
      this._interactionHandlers = null;
    }

    if (this._loadListener) {
      window.removeEventListener('load', this._loadListener);
      this._loadListener = null;
    }
  }

  initializeObservers() {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.checkThreshold('lcp', this.metrics.lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // First Input Delay (FID) - replaced by INP in newer browsers
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-input') {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.checkThreshold('fid', this.metrics.fid);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
        this.checkThreshold('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);

      // Long Tasks
      const longTaskObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.warn('[PerformanceMonitor] Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (error) {
      console.warn(
        '[PerformanceMonitor] Observer initialization failed:',
        error
      );
    }
  }

  measurePageLoad() {
    if (!window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.metrics.domContentLoaded =
        navigation.domContentLoadedEventEnd - navigation.navigationStart;

      if (navigation.loadEventEnd && navigation.loadEventEnd > 0) {
        this.metrics.loadComplete =
          navigation.loadEventEnd - navigation.navigationStart;
        this.checkThreshold('loadComplete', this.metrics.loadComplete);
      } else if (!this._loadListener) {
        this._loadListener = () => {
          const nav = performance.getEntriesByType('navigation')[0];
          if (!nav || !nav.loadEventEnd) return;
          this.metrics.loadComplete = nav.loadEventEnd - nav.navigationStart;
          this.checkThreshold('loadComplete', this.metrics.loadComplete);
          window.removeEventListener('load', this._loadListener);
          this._loadListener = null;
        };
        window.addEventListener('load', this._loadListener, { once: true });
      }

      // Check thresholds
      this.checkThreshold('ttfb', this.metrics.ttfb);
      this.checkThreshold('domContentLoaded', this.metrics.domContentLoaded);
    }
  }

  startContinuousMonitoring() {
    // Monitor memory usage
    if (performance.memory) {
      this.continuousMonitorInterval = setInterval(() => {
        this.metrics.memoryUsage.push({
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now(),
        });

        // Keep only last 100 measurements
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage.shift();
        }
      }, 10000); // Every 10 seconds
    }

    // Monitor user interaction latency
    this.measureInteractionLatency();
  }

  measureInteractionLatency() {
    const measureLatency = event => {
      const startTime = performance.now();

      requestAnimationFrame(() => {
        const latency = performance.now() - startTime;
        this.metrics.userInteractionLatency.push({
          type: event.type,
          target: event.target.tagName,
          latency,
          timestamp: Date.now(),
        });

        // Keep only last 50 interactions
        if (this.metrics.userInteractionLatency.length > 50) {
          this.metrics.userInteractionLatency.shift();
        }

        // Check if latency is concerning
        if (latency > 100) {
          console.warn('[PerformanceMonitor] High interaction latency:', {
            latency: `${latency.toFixed(2)}ms`,
            target: event.target.tagName,
          });
        }
      });
    };

    // Monitor click events
    this._interactionHandlers = {
      click: measureLatency,
      touchstart: measureLatency,
    };
    document.addEventListener('click', this._interactionHandlers.click, {
      passive: true,
    });
    document.addEventListener(
      'touchstart',
      this._interactionHandlers.touchstart,
      { passive: true }
    );
  }

  // Component performance measurement
  startComponentRender(componentName) {
    if (!this.isMonitoring) return;

    this.metrics.componentRenderTime.set(componentName, {
      startTime: performance.now(),
      endTime: null,
      duration: null,
    });
  }

  endComponentRender(componentName) {
    if (!this.isMonitoring) return;

    const componentData = this.metrics.componentRenderTime.get(componentName);
    if (componentData) {
      componentData.endTime = performance.now();
      componentData.duration = componentData.endTime - componentData.startTime;

      // Log slow components
      if (componentData.duration > 100) {
        console.warn('[PerformanceMonitor] Slow component render:', {
          component: componentName,
          duration: `${componentData.duration.toFixed(2)}ms`,
        });
      }
    }
  }

  checkThreshold(metric, value) {
    const target = this.metrics.targets[metric];
    if (target && value > target) {
      const isUnitless = metric === 'cls';
      const formattedValue = isUnitless
        ? value.toFixed(3)
        : `${value.toFixed(2)}ms`;
      const formattedTarget = isUnitless ? String(target) : `${target}ms`;
      console.warn(
        `[PerformanceMonitor] ${metric.toUpperCase()} threshold exceeded:`,
        {
          value: formattedValue,
          target: formattedTarget,
          exceeded: `${(((value - target) / target) * 100).toFixed(1)}%`,
        }
      );

      // Emit performance warning event
      this.emitPerformanceWarning(metric, value, target);
    }
  }

  emitPerformanceWarning(metric, value, target) {
    const event = new CustomEvent('performance-warning', {
      detail: {
        metric,
        value,
        target,
        percentage: (((value - target) / target) * 100).toFixed(1),
      },
    });
    document.dispatchEvent(event);
  }

  // Get performance report
  getReport() {
    const avgInteractionLatency =
      this.metrics.userInteractionLatency.length > 0
        ? this.metrics.userInteractionLatency.reduce(
            (sum, item) => sum + item.latency,
            0
          ) / this.metrics.userInteractionLatency.length
        : 0;

    const latestMemory =
      this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
        : null;

    return {
      coreWebVitals: {
        lcp: this.metrics.lcp,
        fid: this.metrics.fid,
        cls: this.metrics.cls,
      },
      pageLoad: {
        ttfb: this.metrics.ttfb,
        domContentLoaded: this.metrics.domContentLoaded,
        loadComplete: this.metrics.loadComplete,
      },
      interactions: {
        averageLatency: avgInteractionLatency,
        totalInteractions: this.metrics.userInteractionLatency.length,
      },
      memory: latestMemory,
      components: Object.fromEntries(
        Array.from(this.metrics.componentRenderTime.entries()).map(
          ([name, data]) => [
            name,
            {
              duration: data.duration,
              startTime: data.startTime,
              endTime: data.endTime,
            },
          ]
        )
      ),
      targets: this.metrics.targets,
      status: this.getOverallStatus(),
    };
  }

  getOverallStatus() {
    const scores = [];

    if (this.metrics.lcp !== null) {
      const lcpScore = Math.min(
        1,
        Math.max(
          0,
          (this.metrics.targets.lcp - this.metrics.lcp) /
            this.metrics.targets.lcp
        )
      );
      scores.push(lcpScore);
    }

    if (this.metrics.fid !== null) {
      const fidScore = Math.min(
        1,
        Math.max(
          0,
          (this.metrics.targets.fid - this.metrics.fid) /
            this.metrics.targets.fid
        )
      );
      scores.push(fidScore);
    }

    if (this.metrics.cls !== null) {
      const clsScore = Math.min(
        1,
        Math.max(
          0,
          (this.metrics.targets.cls - this.metrics.cls) /
            this.metrics.targets.cls
        )
      );
      scores.push(clsScore);
    }

    const overallScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 1;

    if (overallScore >= 0.9) return 'excellent';
    if (overallScore >= 0.8) return 'good';
    if (overallScore >= 0.7) return 'fair';
    return 'poor';
  }

  // Optimize performance based on metrics
  optimize() {
    const report = this.getReport();

    // Suggest optimizations based on metrics
    const suggestions = [];

    if (report.coreWebVitals.lcp > this.metrics.targets.lcp) {
      suggestions.push({
        type: 'lcp',
        message: 'Consider optimizing images and critical resources',
        priority: 'high',
      });
    }

    if (report.coreWebVitals.fid > this.metrics.targets.fid) {
      suggestions.push({
        type: 'fid',
        message: 'Reduce JavaScript execution time and main thread work',
        priority: 'high',
      });
    }

    if (report.coreWebVitals.cls > this.metrics.targets.cls) {
      suggestions.push({
        type: 'cls',
        message:
          'Ensure proper dimensions for images and avoid dynamic content shifts',
        priority: 'medium',
      });
    }

    if (report.interactions.averageLatency > 100) {
      suggestions.push({
        type: 'interaction',
        message: 'Optimize event handlers and reduce layout thrashing',
        priority: 'medium',
      });
    }

    return suggestions;
  }

  // Lighthouse integration helper
  async runLighthouse(options = {}) {
    if (!window.lighthouse) {
      console.warn('[PerformanceMonitor] Lighthouse not available');
      return null;
    }

    try {
      const url = options.url || window.location.origin;
      const port = options.port || 9222;
      const report = await window.lighthouse(url, {
        only: ['performance', 'accessibility'],
        port,
      });

      return report;
    } catch (error) {
      console.error('[PerformanceMonitor] Lighthouse run failed:', error);
      return null;
    }
  }

  destroy() {
    this.stop();

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring
if (typeof window !== 'undefined') {
  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceMonitor.start();
    });
  } else {
    performanceMonitor.start();
  }
}
