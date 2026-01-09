/**
 * Chart Refresh Helper Utility
 * 
 * Centralizes the logic for refreshing charts in the Financial Planning view.
 * This pattern is repeated multiple times across investment and goals sections.
 */

/**
 * Refresh a chart by replacing the existing chart element and updating the active charts map
 * @param {Object} options - Refresh configuration
 * @param {Function} options.createChartFn - Function that creates the chart (returns Promise)
 * @param {Object} options.chartRenderer - ChartRenderer instance
 * @param {*} options.data - Data to pass to chart creation function
 * @param {HTMLElement} options.section - Section element containing the chart
 * @param {string} options.chartType - Chart type selector (e.g., 'portfolio-composition')
 * @param {Map} options.activeCharts - Active charts map to update
 * @returns {Promise<void>}
 */
export async function refreshChart({
    createChartFn,
    chartRenderer,
    data,
    section,
    chartType,
    activeCharts,
}) {
    try {
        const { section: chartSection, chart } = await createChartFn(
            chartRenderer,
            data
        );

        // Replace existing chart section
        const existing = section.querySelector(`[data-chart-type="${chartType}"]`);
        if (existing) {
            existing.replaceWith(chartSection);
        } else {
            // If no existing chart, append it
            section.appendChild(chartSection);
        }

        // Update active charts map
        activeCharts.set(chartType, chart);
    } catch (err) {
        console.error(`Error refreshing ${chartType} chart:`, err);
        throw err; // Re-throw so caller can handle if needed
    }
}

/**
 * Refresh multiple charts in sequence
 * @param {Array<Object>} chartConfigs - Array of chart configurations
 * @returns {Promise<void>}
 */
export async function refreshCharts(chartConfigs) {
    for (const config of chartConfigs) {
        await refreshChart(config);
    }
}
