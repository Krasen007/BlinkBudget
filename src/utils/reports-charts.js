/**
 * Reports Chart Components
 * 
 * Chart creation and rendering functions for reports view.
 */

import { COLORS, SPACING, BREAKPOINTS } from './constants.js';
import { getChartColors } from '../core/chart-config.js';
import { StorageService } from '../core/storage.js';
import { generateMonthlyTrendData } from './reports-utils.js';

/**
 * Create interactive category breakdown pie chart
 */
export async function createCategoryBreakdownChart(chartRenderer, currentData, categoryColorMap, getCategoryColors, onCategoryClick) {
    const section = document.createElement('div');
    section.className = 'chart-section category-breakdown-section';
    section.setAttribute('data-chart-type', 'category-breakdown');
    section.style.background = COLORS.SURFACE;
    section.style.borderRadius = 'var(--radius-lg)';
    section.style.border = `1px solid ${COLORS.BORDER}`;
    section.style.padding = SPACING.LG;

    // Section header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = SPACING.MD;

    const title = document.createElement('h3');
    title.textContent = 'Spending by Category';
    title.style.margin = '0';
    title.style.color = COLORS.TEXT_MAIN;

    // Chart type toggle
    const chartTypeToggle = document.createElement('div');
    chartTypeToggle.style.display = 'flex';
    chartTypeToggle.style.gap = SPACING.XS;

    const pieBtn = createToggleButton('Pie', true);
    const doughnutBtn = createToggleButton('Doughnut', false);

    chartTypeToggle.appendChild(pieBtn);
    chartTypeToggle.appendChild(doughnutBtn);

    header.appendChild(title);
    header.appendChild(chartTypeToggle);
    section.appendChild(header);

    // Chart container
    const chartDiv = document.createElement('div');
    chartDiv.style.position = 'relative';
    chartDiv.style.height = '400px';
    chartDiv.style.marginBottom = SPACING.MD;

    const canvas = document.createElement('canvas');
    canvas.id = 'category-breakdown-chart';
    canvas.style.maxHeight = '100%';
    chartDiv.appendChild(canvas);

    section.appendChild(chartDiv);

    // Prepare chart data
    const categoryData = currentData.categoryBreakdown;
    
    // Get consistent colors for all categories
    const categoryColors = getCategoryColors(categoryData.categories, categoryColorMap);
    
    const chartData = {
        labels: categoryData.categories.map(cat => cat.name),
        datasets: [{
            data: categoryData.categories.map(cat => cat.amount),
            backgroundColor: categoryColors,
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };

    // Create initial pie chart
    let currentChart = await chartRenderer.createPieChart(canvas, chartData, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: window.innerWidth < 768 ? 'bottom' : 'right'
            }
        }
    });

    // Add click handler for category selection
    canvas.addEventListener('chartSegmentClick', (event) => {
        const clickData = event.detail;
        if (onCategoryClick) {
            onCategoryClick(clickData.label, clickData.value, clickData.percentage);
        }
    });

    // Toggle between pie and doughnut
    pieBtn.addEventListener('click', async () => {
        if (!pieBtn.classList.contains('active')) {
            chartRenderer.destroyChart(currentChart);
            currentChart = await chartRenderer.createPieChart(canvas, chartData);
            setActiveToggle(pieBtn, doughnutBtn);
        }
    });

    doughnutBtn.addEventListener('click', async () => {
        if (!doughnutBtn.classList.contains('active')) {
            chartRenderer.destroyChart(currentChart);
            currentChart = await chartRenderer.createDoughnutChart(canvas, chartData);
            setActiveToggle(doughnutBtn, pieBtn);
        }
    });

    return { section, chart: currentChart };
}

/**
 * Create income vs expenses bar chart
 */
export async function createIncomeExpenseChart(chartRenderer, currentData) {
    const section = document.createElement('div');
    section.className = 'chart-section income-expense-section';
    section.setAttribute('data-chart-type', 'income-expense');
    section.style.background = COLORS.SURFACE;
    section.style.borderRadius = 'var(--radius-lg)';
    section.style.border = `1px solid ${COLORS.BORDER}`;
    section.style.padding = SPACING.LG;
    section.style.marginBottom = '0 !important';
    section.style.paddingBottom = `calc(${SPACING.MD}) !important`;
    section.style.position = 'relative';
    section.style.zIndex = '2';
    section.style.display = 'block';
    section.style.width = '100%';
    section.style.boxSizing = 'border-box';
    section.style.contain = 'layout';
    section.style.overflow = 'visible';

    const title = document.createElement('h3');
    title.textContent = 'Income vs Expenses';
    title.style.margin = `0 0 ${SPACING.MD} 0`;
    title.style.color = COLORS.TEXT_MAIN;
    section.appendChild(title);

    // Chart container
    const chartDiv = document.createElement('div');
    chartDiv.style.position = 'relative';
    chartDiv.style.width = '100%';
    chartDiv.style.height = '400px';
    chartDiv.style.marginBottom = '0';
    chartDiv.style.padding = SPACING.SM;
    chartDiv.style.paddingBottom = `calc(${SPACING.SM} + 20px)`;
    chartDiv.style.boxSizing = 'border-box';
    chartDiv.style.overflow = 'visible';

    const canvas = document.createElement('canvas');
    canvas.id = 'income-expense-chart';
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    canvas.style.maxWidth = '100%';
    canvas.style.display = 'block';
    chartDiv.appendChild(canvas);
    section.appendChild(chartDiv);

    // Prepare chart data
    const incomeExpenseData = currentData.incomeVsExpenses;
    const chartData = {
        labels: ['Income', 'Expenses', 'Net Balance'],
        datasets: [{
            label: 'Amount (€)',
            data: [
                incomeExpenseData.totalIncome,
                incomeExpenseData.totalExpenses,
                Math.abs(incomeExpenseData.netBalance)
            ],
            backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                incomeExpenseData.netBalance >= 0 
                    ? 'rgba(34, 197, 94, 0.6)'
                    : 'rgba(239, 68, 68, 0.6)'
            ],
            borderColor: [
                'rgba(34, 197, 94, 1)',
                'rgba(239, 68, 68, 1)',
                incomeExpenseData.netBalance >= 0 
                    ? 'rgba(34, 197, 94, 1)'
                    : 'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 1
        }]
    };

    const chart = await chartRenderer.createBarChart(canvas, chartData, {
        responsive: true,
        maintainAspectRatio: false,
        title: undefined,
        plugins: {
            tooltip: {
                position: 'nearest',
                yAlign: 'auto',
                padding: 20,
                caretSize: 8,
                caretPadding: 10
            }
        }
    });

    return { section, chart };
}

/**
 * Create category trends over time chart
 */
export async function createCategoryTrendsChart(chartRenderer, currentData, categoryColorMap) {
    // Get historical data for trends
    const allTransactions = StorageService.getAll();
    
    // Check if we have enough historical data (at least 3 months)
    const oldestTransaction = allTransactions.reduce((oldest, transaction) => {
        const transactionDate = new Date(transaction.date || transaction.timestamp);
        return transactionDate < oldest ? transactionDate : oldest;
    }, new Date());

    const monthsOfData = Math.floor((new Date() - oldestTransaction) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthsOfData < 3) {
        return null; // Not enough data for trends
    }

    const section = document.createElement('div');
    section.className = 'chart-section';
    section.style.background = COLORS.SURFACE;
    section.style.borderRadius = 'var(--radius-lg)';
    section.style.border = `1px solid ${COLORS.BORDER}`;
    section.style.padding = SPACING.LG;

    const title = document.createElement('h3');
    title.textContent = 'Category Trends Over Time';
    title.style.margin = `0 0 ${SPACING.MD} 0`;
    title.style.color = COLORS.TEXT_MAIN;
    section.appendChild(title);

    const chartDiv = document.createElement('div');
    chartDiv.style.position = 'relative';
    chartDiv.style.height = '350px';

    const canvas = document.createElement('canvas');
    canvas.id = 'category-trends-chart';
    chartDiv.appendChild(canvas);
    section.appendChild(chartDiv);

    // Generate monthly data for top 3 categories
    const topCategories = currentData.categoryBreakdown.categories.slice(0, 3);
    const monthlyData = generateMonthlyTrendData(allTransactions, topCategories);

    const chartData = {
        labels: monthlyData.months,
        datasets: topCategories.map((category, index) => ({
            label: category.name,
            data: monthlyData.categoryData[category.name] || [],
            borderColor: categoryColorMap.get(category.name) || getChartColors(topCategories.length)[index],
            backgroundColor: (categoryColorMap.get(category.name) || getChartColors(topCategories.length)[index]).replace(')', ', 0.1)').replace('hsl', 'hsla'),
            borderWidth: 3,
            fill: false,
            tension: 0.4
        }))
    };

    const chart = await chartRenderer.createLineChart(canvas, chartData, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        }
    });

    return { section, chart };
}

/**
 * Create interactive category selector
 */
export function createCategorySelector(currentData, categoryColorMap, getCategoryColors, onCategoryClick) {
    const section = document.createElement('div');
    section.className = 'category-selector-section';
    section.style.background = COLORS.SURFACE;
    section.style.borderRadius = 'var(--radius-lg)';
    section.style.border = `1px solid ${COLORS.BORDER}`;
    section.style.padding = SPACING.LG;
    section.style.marginTop = SPACING.XL;
    section.style.marginBottom = SPACING.XL;

    const title = document.createElement('h3');
    title.textContent = 'Explore Categories';
    title.style.margin = `0 0 ${SPACING.MD} 0`;
    title.style.color = COLORS.TEXT_MAIN;
    section.appendChild(title);

    const description = document.createElement('p');
    description.textContent = 'Click on any category below to see detailed spending patterns and trends.';
    description.style.margin = `0 0 ${SPACING.LG} 0`;
    description.style.color = COLORS.TEXT_MUTED;
    section.appendChild(description);

    // Category grid
    const categoryGrid = document.createElement('div');
    categoryGrid.className = 'category-grid';
    categoryGrid.style.display = 'grid';
    categoryGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    categoryGrid.style.gap = SPACING.MD;
    categoryGrid.style.marginTop = SPACING.MD;

    currentData.categoryBreakdown.categories.forEach((category, index) => {
        const categoryCard = createCategoryCard(category, index, categoryColorMap, getCategoryColors, onCategoryClick);
        categoryGrid.appendChild(categoryCard);
    });

    section.appendChild(categoryGrid);

    // Category details section
    const categoryDetailsSection = document.createElement('div');
    categoryDetailsSection.id = 'category-details-section';
    categoryDetailsSection.style.display = 'none';
    categoryDetailsSection.style.marginTop = SPACING.XL;
    categoryDetailsSection.style.paddingTop = SPACING.XL;
    categoryDetailsSection.style.borderTop = `2px solid ${COLORS.BORDER}`;
    section.appendChild(categoryDetailsSection);

    return section;
}

/**
 * Create individual category card
 */
function createCategoryCard(category, index, categoryColorMap, getChartColors, onCategoryClick) {
    const card = document.createElement('button');
    card.className = 'category-card';
    card.style.background = COLORS.SURFACE;
    card.style.border = `2px solid ${COLORS.BORDER}`;
    card.style.borderRadius = 'var(--radius-md)';
    card.style.padding = SPACING.MD;
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.2s ease';
    card.style.textAlign = 'left';
    card.style.width = '100%';

    const categoryColor = categoryColorMap.get(category.name) || getChartColors(1)[0];
    card.style.setProperty('--category-color', categoryColor);

    card.addEventListener('mouseenter', () => {
        card.style.borderColor = COLORS.PRIMARY;
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.borderColor = COLORS.BORDER;
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
    });

    const colorIndicator = document.createElement('div');
    colorIndicator.style.width = '4px';
    colorIndicator.style.height = '40px';
    colorIndicator.style.background = categoryColor;
    colorIndicator.style.borderRadius = '2px';
    colorIndicator.style.marginBottom = SPACING.SM;

    const name = document.createElement('div');
    name.textContent = category.name;
    name.style.fontWeight = '600';
    name.style.color = COLORS.TEXT_MAIN;
    name.style.marginBottom = SPACING.XS;

    const amount = document.createElement('div');
    amount.textContent = `€${category.amount.toFixed(2)}`;
    amount.style.fontSize = '1.25rem';
    amount.style.fontWeight = 'bold';
    amount.style.color = COLORS.PRIMARY;
    amount.style.marginBottom = SPACING.XS;

    const percentage = document.createElement('div');
    percentage.textContent = `${typeof category.percentage === 'string' ? category.percentage : category.percentage.toFixed(1)}% of expenses`;
    percentage.style.fontSize = '0.875rem';
    percentage.style.color = COLORS.TEXT_MUTED;

    const transactionCount = document.createElement('div');
    transactionCount.textContent = `${category.transactionCount} transaction${category.transactionCount !== 1 ? 's' : ''}`;
    transactionCount.style.fontSize = '0.75rem';
    transactionCount.style.color = COLORS.TEXT_MUTED;
    transactionCount.style.marginTop = SPACING.XS;

    card.appendChild(colorIndicator);
    card.appendChild(name);
    card.appendChild(amount);
    card.appendChild(percentage);
    card.appendChild(transactionCount);

    card.addEventListener('click', () => {
        if (onCategoryClick) {
            onCategoryClick(category.name, category.amount, category.percentage);
        }
    });

    return card;
}

/**
 * Show detailed information for a selected category
 */
export function showCategoryDetails(categoryName, amount, percentage, currentData) {
    const detailsSection = document.getElementById('category-details-section');
    if (!detailsSection) return;

    const categoryTransactions = currentData.transactions.filter(t => 
        (t.category || 'Uncategorized') === categoryName && t.type === 'expense'
    );

    const averageAmount = categoryTransactions.length > 0 ? (amount / categoryTransactions.length) : 0;

    detailsSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${SPACING.MD};">
            <h4 style="margin: 0; color: ${COLORS.TEXT_MAIN};">${categoryName} Details</h4>
            <button id="close-category-details" 
                    style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: ${COLORS.TEXT_MUTED}; padding: ${SPACING.XS};">×</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: ${SPACING.MD}; margin-bottom: ${SPACING.MD};">
            <div>
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Total Spent</div>
                <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">€${amount.toFixed(2)}</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Percentage</div>
                <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">${typeof percentage === 'string' ? percentage : percentage.toFixed(1)}%</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Transactions</div>
                <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">${categoryTransactions.length}</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Average</div>
                <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">€${averageAmount.toFixed(2)}</div>
            </div>
        </div>
        <div style="margin-top: ${SPACING.MD};">
            <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.SM};">Recent Transactions:</div>
            <div style="max-height: 200px; overflow-y: auto;">
                ${categoryTransactions.length > 0 ? categoryTransactions.slice(0, 10).map(t => `
                    <div style="display: flex; justify-content: space-between; padding: ${SPACING.XS} 0; border-bottom: 1px solid ${COLORS.BORDER};">
                        <span style="color: ${COLORS.TEXT_MAIN};">${t.description || 'No description'}</span>
                        <span style="font-weight: 600; color: ${COLORS.ERROR};">€${Math.abs(t.amount).toFixed(2)}</span>
                    </div>
                `).join('') : '<div style="color: ' + COLORS.TEXT_MUTED + ';">No transactions found</div>'}
            </div>
        </div>
    `;

    detailsSection.style.display = 'block';

    const closeBtn = detailsSection.querySelector('#close-category-details');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            detailsSection.style.display = 'none';
        });
    }

    detailsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Create insights section displaying AI-generated financial insights
 */
export function createInsightsSection(currentData) {
    const section = document.createElement('div');
    section.className = 'insights-section';
    section.style.background = COLORS.SURFACE;
    section.style.borderRadius = 'var(--radius-lg)';
    section.style.border = `1px solid ${COLORS.BORDER}`;
    section.style.padding = SPACING.LG;

    const title = document.createElement('h3');
    title.textContent = 'Financial Insights';
    title.style.margin = `0 0 ${SPACING.MD} 0`;
    title.style.color = COLORS.TEXT_MAIN;
    section.appendChild(title);

    const description = document.createElement('p');
    description.textContent = 'AI-powered insights based on your spending patterns and trends.';
    description.style.margin = `0 0 ${SPACING.LG} 0`;
    description.style.color = COLORS.TEXT_MUTED;
    section.appendChild(description);

    const insightsGrid = document.createElement('div');
    insightsGrid.style.display = 'flex';
    insightsGrid.style.flexDirection = 'column';
    insightsGrid.style.gap = SPACING.MD;

    if (currentData.insights && Array.isArray(currentData.insights) && currentData.insights.length > 0) {
        const topInsights = currentData.insights.slice(0, 5);
        topInsights.forEach((insight, index) => {
            const insightCard = createInsightCard(insight, index);
            insightsGrid.appendChild(insightCard);
        });
    } else {
        const noInsights = document.createElement('div');
        noInsights.style.padding = SPACING.MD;
        noInsights.style.textAlign = 'center';
        noInsights.style.color = COLORS.TEXT_MUTED;
        noInsights.textContent = 'No insights available yet. Add more transactions to see personalized insights.';
        insightsGrid.appendChild(noInsights);
    }

    section.appendChild(insightsGrid);

    if (currentData.predictions && currentData.predictions.hasEnoughData) {
        const predictionsSection = createPredictionsSection(currentData);
        section.appendChild(predictionsSection);
    }

    return section;
}

/**
 * Create individual insight card
 */
function createInsightCard(insight, index) {
    const card = document.createElement('div');
    card.className = 'insight-card';
    card.style.background = getInsightBackgroundColor(insight.type);
    card.style.border = `1px solid ${getInsightBorderColor(insight.type)}`;
    card.style.borderRadius = 'var(--radius-md)';
    card.style.padding = SPACING.MD;
    card.style.position = 'relative';

    const icon = document.createElement('div');
    icon.style.fontSize = '1.5rem';
    icon.style.marginBottom = SPACING.SM;
    icon.textContent = getInsightIcon(insight.type);

    const message = document.createElement('div');
    message.textContent = insight.message;
    message.style.color = COLORS.TEXT_MAIN;
    message.style.lineHeight = '1.5';
    message.style.marginBottom = insight.recommendation ? SPACING.SM : '0';

    card.appendChild(icon);
    card.appendChild(message);

    if (insight.recommendation) {
        const recommendation = document.createElement('div');
        recommendation.textContent = `💡 ${insight.recommendation}`;
        recommendation.style.fontSize = '0.875rem';
        recommendation.style.color = COLORS.TEXT_MUTED;
        recommendation.style.fontStyle = 'italic';
        recommendation.style.marginTop = SPACING.SM;
        recommendation.style.paddingTop = SPACING.SM;
        recommendation.style.borderTop = `1px solid ${COLORS.BORDER}`;
        card.appendChild(recommendation);
    }

    if (insight.severity === 'high') {
        const severityIndicator = document.createElement('div');
        severityIndicator.style.position = 'absolute';
        severityIndicator.style.top = SPACING.SM;
        severityIndicator.style.right = SPACING.SM;
        severityIndicator.style.width = '8px';
        severityIndicator.style.height = '8px';
        severityIndicator.style.borderRadius = '50%';
        severityIndicator.style.background = COLORS.ERROR;
        card.appendChild(severityIndicator);
    }

    return card;
}

/**
 * Create predictions section
 */
function createPredictionsSection(currentData) {
    const section = document.createElement('div');
    section.style.marginTop = SPACING.LG;
    section.style.paddingTop = SPACING.LG;
    section.style.borderTop = `1px solid ${COLORS.BORDER}`;

    const title = document.createElement('h4');
    title.textContent = 'Spending Predictions';
    title.style.margin = `0 0 ${SPACING.MD} 0`;
    title.style.color = COLORS.TEXT_MAIN;
    section.appendChild(title);

    const predictionsGrid = document.createElement('div');
    predictionsGrid.style.display = 'grid';
    predictionsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
    predictionsGrid.style.gap = SPACING.MD;

    currentData.predictions.predictions.forEach(prediction => {
        const predictionCard = document.createElement('div');
        predictionCard.style.background = 'rgba(59, 130, 246, 0.05)';
        predictionCard.style.border = '1px solid rgba(59, 130, 246, 0.2)';
        predictionCard.style.borderRadius = 'var(--radius-md)';
        predictionCard.style.padding = SPACING.MD;
        predictionCard.style.textAlign = 'center';

        const monthName = document.createElement('div');
        monthName.textContent = prediction.monthName;
        monthName.style.fontSize = '0.875rem';
        monthName.style.color = COLORS.TEXT_MUTED;
        monthName.style.marginBottom = SPACING.XS;

        const amount = document.createElement('div');
        amount.textContent = `€${prediction.predictedAmount.toFixed(0)}`;
        amount.style.fontSize = '1.25rem';
        amount.style.fontWeight = 'bold';
        amount.style.color = COLORS.PRIMARY;

        const confidence = document.createElement('div');
        confidence.textContent = `${prediction.confidence} confidence`;
        confidence.style.fontSize = '0.75rem';
        confidence.style.color = COLORS.TEXT_MUTED;
        confidence.style.marginTop = SPACING.XS;

        predictionCard.appendChild(monthName);
        predictionCard.appendChild(amount);
        predictionCard.appendChild(confidence);

        predictionsGrid.appendChild(predictionCard);
    });

    section.appendChild(predictionsGrid);
    return section;
}

/**
 * Helper functions for insights
 */
function getInsightIcon(type) {
    const icons = {
        'positive': '✅',
        'warning': '⚠️',
        'pattern': '📈',
        'anomaly': '🔍',
        'increase': '📈',
        'decrease': '📉'
    };
    return icons[type] || '💡';
}

function getInsightBackgroundColor(type) {
    const colors = {
        'positive': 'rgba(34, 197, 94, 0.05)',
        'warning': 'rgba(251, 191, 36, 0.05)',
        'pattern': 'rgba(59, 130, 246, 0.05)',
        'anomaly': 'rgba(239, 68, 68, 0.05)',
        'increase': 'rgba(251, 191, 36, 0.05)',
        'decrease': 'rgba(34, 197, 94, 0.05)'
    };
    return colors[type] || 'rgba(156, 163, 175, 0.05)';
}

function getInsightBorderColor(type) {
    const colors = {
        'positive': 'rgba(34, 197, 94, 0.2)',
        'warning': 'rgba(251, 191, 36, 0.2)',
        'pattern': 'rgba(59, 130, 246, 0.2)',
        'anomaly': 'rgba(239, 68, 68, 0.2)',
        'increase': 'rgba(251, 191, 36, 0.2)',
        'decrease': 'rgba(34, 197, 94, 0.2)'
    };
    return colors[type] || 'rgba(156, 163, 175, 0.2)';
}

/**
 * Helper functions for chart creation
 */
function createToggleButton(text, active = false) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = `${SPACING.XS} ${SPACING.SM}`;
    button.style.border = `1px solid ${COLORS.BORDER}`;
    button.style.borderRadius = 'var(--radius-sm)';
    button.style.background = active ? COLORS.PRIMARY : 'transparent';
    button.style.color = active ? 'white' : COLORS.TEXT_MAIN;
    button.style.cursor = 'pointer';
    button.style.fontSize = '0.875rem';
    button.style.transition = 'all 0.2s ease';
    
    if (active) {
        button.classList.add('active');
    }

    return button;
}

function setActiveToggle(activeBtn, inactiveBtn) {
    activeBtn.style.background = COLORS.PRIMARY;
    activeBtn.style.color = 'white';
    activeBtn.classList.add('active');
    
    inactiveBtn.style.background = 'transparent';
    inactiveBtn.style.color = COLORS.TEXT_MAIN;
    inactiveBtn.classList.remove('active');
}

/**
 * Get consistent colors for categories across all charts and UI elements
 */
export function getCategoryColors(categories, categoryColorMap) {
    if (categoryColorMap.size === 0 || categoryColorMap.size < categories.length) {
        const totalColors = Math.max(categories.length, 12);
        const colors = getChartColors(totalColors);
        
        categories.forEach((category, index) => {
            if (!categoryColorMap.has(category.name)) {
                const colorIndex = index % colors.length;
                categoryColorMap.set(category.name, colors[colorIndex]);
            }
        });
    }
    
    return categories.map(category => categoryColorMap.get(category.name));
}

