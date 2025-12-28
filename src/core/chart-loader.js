/**
 * Chart.js Lazy Loader
 * 
 * Implements lazy loading and code splitting for Chart.js to improve initial bundle size
 * and loading performance. Chart.js is only loaded when the reports view is accessed.
 * 
 * Requirements: 9.2 - Performance optimization
 */

/**
 * Chart.js lazy loading state
 */
let chartJSPromise = null;
let isChartJSLoaded = false;
let chartJSModules = null;

/**
 * Lazy load Chart.js and its components
 * @returns {Promise<Object>} Promise that resolves to Chart.js modules
 */
export async function loadChartJS() {
    // Return cached modules if already loaded
    if (isChartJSLoaded && chartJSModules) {
        return chartJSModules;
    }

    // Return existing promise if already loading
    if (chartJSPromise) {
        return chartJSPromise;
    }

    // Start loading Chart.js
    chartJSPromise = loadChartJSModules();
    
    try {
        chartJSModules = await chartJSPromise;
        isChartJSLoaded = true;
        console.log('[ChartLoader] Chart.js loaded successfully');
        return chartJSModules;
    } catch (error) {
        console.error('[ChartLoader] Failed to load Chart.js:', error);
        // Reset promise so we can retry
        chartJSPromise = null;
        throw error;
    }
}

/**
 * Internal function to load Chart.js modules
 * @returns {Promise<Object>} Chart.js modules
 */
async function loadChartJSModules() {
    const startTime = performance.now();
    
    try {
        // Dynamic import of Chart.js with all required components
        const chartModule = await import('chart.js');
        
        const {
            Chart: ChartJS,
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            ArcElement,
            BarElement,
            Title,
            Tooltip,
            Legend,
            // Chart controllers
            PieController,
            BarController,
            LineController,
        } = chartModule;

        // Register Chart.js components including controllers
        ChartJS.register(
            // Scales
            CategoryScale,    // For bar charts
            LinearScale,      // For line and bar charts
            
            // Elements
            PointElement,     // For line charts
            LineElement,      // For line charts
            ArcElement,       // For pie charts
            BarElement,       // For bar charts
            
            // Plugins
            Title,            // For chart titles
            Tooltip,          // For hover tooltips
            Legend,           // For chart legends
            
            // Controllers
            PieController,    // For pie charts
            BarController,    // For bar charts
            LineController    // For line charts
        );

        const loadTime = performance.now() - startTime;
        console.log(`[ChartLoader] Chart.js loaded in ${loadTime.toFixed(2)}ms`);

        return {
            ChartJS,
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            ArcElement,
            BarElement,
            Title,
            Tooltip,
            Legend,
            PieController,
            BarController,
            LineController,
        };
    } catch (error) {
        const loadTime = performance.now() - startTime;
        console.error(`[ChartLoader] Chart.js loading failed after ${loadTime.toFixed(2)}ms:`, error);
        throw new Error(`Failed to load Chart.js: ${error.message}`);
    }
}

/**
 * Check if Chart.js is already loaded
 * @returns {boolean} True if Chart.js is loaded
 */
export function isChartJSReady() {
    return isChartJSLoaded && chartJSModules !== null;
}

/**
 * Get Chart.js modules if already loaded, otherwise return null
 * @returns {Object|null} Chart.js modules or null if not loaded
 */
export function getChartJSModules() {
    return isChartJSLoaded ? chartJSModules : null;
}

/**
 * Preload Chart.js in the background (optional optimization)
 * This can be called when the user is likely to navigate to reports
 * @returns {Promise<void>} Promise that resolves when preloading is complete
 */
export async function preloadChartJS() {
    if (isChartJSLoaded || chartJSPromise) {
        return; // Already loaded or loading
    }

    try {
        console.log('[ChartLoader] Preloading Chart.js in background');
        await loadChartJS();
        console.log('[ChartLoader] Chart.js preloaded successfully');
    } catch (error) {
        console.warn('[ChartLoader] Chart.js preloading failed:', error);
        // Don't throw error for preloading failures
    }
}

/**
 * Reset the Chart.js loader state (useful for testing)
 */
export function resetChartLoader() {
    chartJSPromise = null;
    isChartJSLoaded = false;
    chartJSModules = null;
}