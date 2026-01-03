/**
 * Progressive Data Loader
 * 
 * Implements progressive loading for large transaction datasets to improve
 * performance and user experience. Data is loaded in chunks and processed
 * incrementally to prevent UI blocking.
 * 
 * Requirements: 9.2 - Performance optimization for large datasets
 */

/**
 * Configuration for progressive loading
 */
const PROGRESSIVE_CONFIG = {
    CHUNK_SIZE: 100,           // Process 100 transactions at a time
    CHUNK_DELAY: 10,           // 10ms delay between chunks to prevent blocking
    LARGE_DATASET_THRESHOLD: 500, // Consider dataset large if > 500 transactions
    MAX_PROCESSING_TIME: 50,   // Max time per chunk in milliseconds
    PRIORITY_CATEGORIES: ['Food', 'Transportation', 'Shopping', 'Bills'], // Load these first
};

/**
 * Progressive data loader class
 */
export class ProgressiveDataLoader {
    constructor() {
        this.isLoading = false;
        this.loadingProgress = 0;
        this.abortController = null;
        this.onProgressCallback = null;
        this.onChunkProcessedCallback = null;
    }

    /**
     * Load and process transaction data progressively
     * @param {Array} transactions - Raw transaction data
     * @param {Object} timePeriod - Time period filter
     * @param {Object} options - Loading options
     * @returns {Promise<Object>} Processed data with progress updates
     */
    async loadTransactionData(transactions, timePeriod, options = {}) {
        const {
            onProgress = null,
            onChunkProcessed = null,
            prioritizeCategories = true,
            enableCaching = true
        } = options;

        // Set callbacks
        this.onProgressCallback = onProgress;
        this.onChunkProcessedCallback = onChunkProcessed;

        // Check if we need progressive loading
        if (transactions.length <= PROGRESSIVE_CONFIG.LARGE_DATASET_THRESHOLD) {
            // Small dataset - process normally
            return this.processDataDirectly(transactions, timePeriod);
        }


        try {
            this.isLoading = true;
            this.loadingProgress = 0;
            this.abortController = new AbortController();

            // Filter transactions by time period first
            const filteredTransactions = this.filterByTimePeriod(transactions, timePeriod);

            if (filteredTransactions.length === 0) {
                return this.createEmptyResult(timePeriod);
            }

            // Sort transactions for optimal processing
            const sortedTransactions = this.sortTransactionsForProcessing(
                filteredTransactions,
                prioritizeCategories
            );

            // Process data in chunks
            const result = await this.processDataInChunks(sortedTransactions, timePeriod);

            this.isLoading = false;
            this.loadingProgress = 100;

            if (this.onProgressCallback) {
                this.onProgressCallback(100, 'Complete');
            }

            return result;

        } catch (error) {
            this.isLoading = false;
            console.error('[ProgressiveLoader] Progressive loading failed:', error);

            if (error.message === 'Data loading was cancelled') {
                throw new Error('Data loading was cancelled');
            }

            // Fallback to direct processing
            console.warn('[ProgressiveLoader] Falling back to direct processing');
            return this.processDataDirectly(transactions, timePeriod);
        }
    }

    /**
     * Process small datasets directly without chunking
     * @param {Array} transactions - Transaction data
     * @param {Object} timePeriod - Time period filter
     * @returns {Object} Processed data
     */
    processDataDirectly(transactions, timePeriod) {
        const filteredTransactions = this.filterByTimePeriod(transactions, timePeriod);

        if (filteredTransactions.length === 0) {
            return this.createEmptyResult(timePeriod);
        }

        return {
            transactions: filteredTransactions,
            categoryBreakdown: this.calculateCategoryBreakdown(filteredTransactions),
            incomeVsExpenses: this.calculateIncomeVsExpenses(filteredTransactions),
            costOfLiving: this.calculateCostOfLiving(filteredTransactions, timePeriod),
            processingTime: 0,
            isProgressive: false
        };
    }

    /**
     * Process data in chunks with progress updates
     * @param {Array} transactions - Sorted transaction data
     * @param {Object} timePeriod - Time period filter
     * @returns {Promise<Object>} Processed data
     */
    async processDataInChunks(transactions, timePeriod) {
        const startTime = performance.now();
        const totalTransactions = transactions.length;
        const chunks = this.createChunks(transactions, PROGRESSIVE_CONFIG.CHUNK_SIZE);

        // Initialize accumulators
        const categoryTotals = new Map();
        let totalIncome = 0;
        let totalExpenses = 0;
        let incomeCount = 0;
        let expenseCount = 0;
        const processedTransactions = [];

        // Process chunks progressively
        for (let i = 0; i < chunks.length; i++) {
            // Check for abort signal
            if (this.abortController && this.abortController.signal.aborted) {
                throw new Error('Data loading was cancelled');
            }

            const chunk = chunks[i];
            const chunkStartTime = performance.now();

            // Process current chunk
            await this.processChunk(chunk, {
                categoryTotals,
                totalIncome: (amount) => { totalIncome += amount; },
                totalExpenses: (amount) => { totalExpenses += amount; },
                incomeCount: () => { incomeCount++; },
                expenseCount: () => { expenseCount++; },
                addTransaction: (transaction) => { processedTransactions.push(transaction); }
            });

            // Update progress
            const progress = Math.round(((i + 1) / chunks.length) * 100);
            this.loadingProgress = progress;

            if (this.onProgressCallback) {
                this.onProgressCallback(progress, `Processing chunk ${i + 1} of ${chunks.length}`);
            }

            if (this.onChunkProcessedCallback) {
                this.onChunkProcessedCallback(i + 1, chunks.length, chunk.length);
            }

            // Yield control to prevent blocking
            const chunkTime = performance.now() - chunkStartTime;
            if (chunkTime > PROGRESSIVE_CONFIG.MAX_PROCESSING_TIME) {
                await this.yieldControl(PROGRESSIVE_CONFIG.CHUNK_DELAY * 2);
            } else {
                await this.yieldControl(PROGRESSIVE_CONFIG.CHUNK_DELAY);
            }
        }

        const processingTime = performance.now() - startTime;

        // Build final result
        return {
            transactions: processedTransactions,
            categoryBreakdown: this.buildCategoryBreakdown(categoryTotals, totalExpenses),
            incomeVsExpenses: {
                totalIncome,
                totalExpenses,
                netBalance: totalIncome - totalExpenses,
                incomeCount,
                expenseCount,
                averageIncome: incomeCount > 0 ? totalIncome / incomeCount : 0,
                averageExpense: expenseCount > 0 ? totalExpenses / expenseCount : 0,
                timePeriod
            },
            costOfLiving: this.calculateCostOfLiving(processedTransactions, timePeriod),
            processingTime,
            isProgressive: true,
            chunksProcessed: chunks.length,
            totalTransactions
        };
    }

    /**
     * Process a single chunk of transactions
     * @param {Array} chunk - Transaction chunk
     * @param {Object} accumulators - Data accumulators
     */
    async processChunk(chunk, accumulators) {
        const { categoryTotals, totalIncome, totalExpenses, incomeCount, expenseCount, addTransaction } = accumulators;

        for (const transaction of chunk) {
            // Validate and clean transaction
            const cleanTransaction = this.validateTransaction(transaction);
            if (!cleanTransaction) continue;

            addTransaction(cleanTransaction);

            const amount = Math.abs(cleanTransaction.amount);
            const category = cleanTransaction.category || 'Uncategorized';

            // Update category totals
            if (cleanTransaction.type === 'expense') {
                if (!categoryTotals.has(category)) {
                    categoryTotals.set(category, { amount: 0, count: 0 });
                }
                const categoryData = categoryTotals.get(category);
                categoryData.amount += amount;
                categoryData.count += 1;

                totalExpenses(amount);
                expenseCount();
            } else if (cleanTransaction.type === 'income') {
                totalIncome(amount);
                incomeCount();
            }
        }
    }

    /**
     * Filter transactions by time period
     * @param {Array} transactions - Raw transactions
     * @param {Object} timePeriod - Time period filter
     * @returns {Array} Filtered transactions
     */
    filterByTimePeriod(transactions, timePeriod) {
        if (!timePeriod || !timePeriod.startDate || !timePeriod.endDate) {
            return transactions;
        }

        const startDate = new Date(timePeriod.startDate);
        const endDate = new Date(timePeriod.endDate);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date || transaction.timestamp);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }

    /**
     * Sort transactions for optimal processing
     * @param {Array} transactions - Filtered transactions
     * @param {boolean} prioritizeCategories - Whether to prioritize certain categories
     * @returns {Array} Sorted transactions
     */
    sortTransactionsForProcessing(transactions, prioritizeCategories) {
        if (!prioritizeCategories) {
            return transactions;
        }

        return transactions.sort((a, b) => {
            const aCategoryPriority = PROGRESSIVE_CONFIG.PRIORITY_CATEGORIES.indexOf(a.category || '');
            const bCategoryPriority = PROGRESSIVE_CONFIG.PRIORITY_CATEGORIES.indexOf(b.category || '');

            // Prioritize transactions in priority categories
            if (aCategoryPriority !== -1 && bCategoryPriority === -1) return -1;
            if (bCategoryPriority !== -1 && aCategoryPriority === -1) return 1;
            if (aCategoryPriority !== -1 && bCategoryPriority !== -1) {
                return aCategoryPriority - bCategoryPriority;
            }

            // Then sort by date (newest first)
            const aDate = new Date(a.date || a.timestamp);
            const bDate = new Date(b.date || b.timestamp);
            return bDate - aDate;
        });
    }

    /**
     * Create chunks from transaction array
     * @param {Array} transactions - Transaction array
     * @param {number} chunkSize - Size of each chunk
     * @returns {Array[]} Array of chunks
     */
    createChunks(transactions, chunkSize) {
        const chunks = [];
        for (let i = 0; i < transactions.length; i += chunkSize) {
            chunks.push(transactions.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Validate and clean a transaction
     * @param {Object} transaction - Raw transaction
     * @returns {Object|null} Clean transaction or null if invalid
     */
    validateTransaction(transaction) {
        if (!transaction.id || typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
            return null;
        }

        return {
            id: transaction.id,
            amount: Math.abs(transaction.amount),
            type: transaction.type || 'expense',
            category: transaction.category || 'Uncategorized',
            description: transaction.description || '',
            date: transaction.date || transaction.timestamp,
            timestamp: transaction.timestamp || transaction.date,
            accountId: transaction.accountId || 'main'
        };
    }

    /**
     * Build category breakdown from accumulated data
     * @param {Map} categoryTotals - Category totals map
     * @param {number} totalExpenses - Total expenses amount
     * @returns {Object} Category breakdown
     */
    buildCategoryBreakdown(categoryTotals, totalExpenses) {
        const categories = Array.from(categoryTotals.entries()).map(([name, data]) => ({
            name,
            amount: data.amount,
            transactionCount: data.count,
            percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0
        }));

        // Sort by amount (highest first)
        categories.sort((a, b) => b.amount - a.amount);

        return {
            categories,
            totalAmount: totalExpenses,
            transactionCount: categories.reduce((sum, cat) => sum + cat.transactionCount, 0)
        };
    }

    /**
     * Calculate basic category breakdown (for direct processing)
     * @param {Array} transactions - Filtered transactions
     * @returns {Object} Category breakdown
     */
    calculateCategoryBreakdown(transactions) {
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const categoryTotals = {};
        let totalExpenses = 0;

        expenseTransactions.forEach(transaction => {
            const category = transaction.category || 'Uncategorized';
            const amount = Math.abs(transaction.amount || 0);

            if (!categoryTotals[category]) {
                categoryTotals[category] = { name: category, amount: 0, transactionCount: 0 };
            }

            categoryTotals[category].amount += amount;
            categoryTotals[category].transactionCount += 1;
            totalExpenses += amount;
        });

        const categories = Object.values(categoryTotals).map(category => ({
            ...category,
            percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0
        }));

        categories.sort((a, b) => b.amount - a.amount);

        return {
            categories,
            totalAmount: totalExpenses,
            transactionCount: expenseTransactions.length
        };
    }

    /**
     * Calculate income vs expenses (for direct processing)
     * @param {Array} transactions - Filtered transactions
     * @returns {Object} Income vs expenses data
     */
    calculateIncomeVsExpenses(transactions) {
        let totalIncome = 0;
        let totalExpenses = 0;
        let incomeCount = 0;
        let expenseCount = 0;

        transactions.forEach(transaction => {
            const amount = Math.abs(transaction.amount || 0);

            if (transaction.type === 'income') {
                totalIncome += amount;
                incomeCount += 1;
            } else if (transaction.type === 'expense') {
                totalExpenses += amount;
                expenseCount += 1;
            }
        });

        return {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            incomeCount,
            expenseCount,
            averageIncome: incomeCount > 0 ? totalIncome / incomeCount : 0,
            averageExpense: expenseCount > 0 ? totalExpenses / expenseCount : 0
        };
    }

    /**
     * Calculate cost of living metrics
     * @param {Array} transactions - Filtered transactions
     * @param {Object} timePeriod - Time period
     * @returns {Object} Cost of living data
     */
    calculateCostOfLiving(transactions, timePeriod) {
        const incomeVsExpenses = this.calculateIncomeVsExpenses(transactions);

        const startDate = new Date(timePeriod.startDate);
        const endDate = new Date(timePeriod.endDate);
        const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const dailySpending = durationDays > 0 ? incomeVsExpenses.totalExpenses / durationDays : 0;
        const monthlySpending = dailySpending * 30;

        return {
            totalExpenditure: incomeVsExpenses.totalExpenses,
            dailySpending,
            monthlySpending,
            durationDays,
            timePeriod
        };
    }

    /**
     * Create empty result for no data scenarios
     * @param {Object} timePeriod - Time period
     * @returns {Object} Empty result
     */
    createEmptyResult(timePeriod) {
        return {
            transactions: [],
            categoryBreakdown: { categories: [], totalAmount: 0, transactionCount: 0 },
            incomeVsExpenses: {
                totalIncome: 0,
                totalExpenses: 0,
                netBalance: 0,
                incomeCount: 0,
                expenseCount: 0,
                averageIncome: 0,
                averageExpense: 0,
                timePeriod
            },
            costOfLiving: {
                totalExpenditure: 0,
                dailySpending: 0,
                monthlySpending: 0,
                durationDays: 0,
                timePeriod
            },
            processingTime: 0,
            isProgressive: false
        };
    }

    /**
     * Yield control to prevent UI blocking
     * @param {number} delay - Delay in milliseconds
     * @returns {Promise<void>}
     */
    async yieldControl(delay = 0) {
        return new Promise(resolve => {
            if (delay > 0) {
                setTimeout(resolve, delay);
            } else {
                // Use scheduler.postTask if available, otherwise setTimeout
                if (typeof scheduler !== 'undefined' && scheduler.postTask) {
                    scheduler.postTask(resolve, { priority: 'user-blocking' });
                } else {
                    setTimeout(resolve, 0);
                }
            }
        });
    }

    /**
     * Cancel ongoing progressive loading
     */
    cancelLoading() {
        if (this.abortController) {
            this.abortController.abort();
            this.isLoading = false;
            console.log('[ProgressiveLoader] Loading cancelled');
        }
    }

    /**
     * Get current loading progress
     * @returns {number} Progress percentage (0-100)
     */
    getProgress() {
        return this.loadingProgress;
    }

    /**
     * Check if currently loading
     * @returns {boolean} True if loading
     */
    isCurrentlyLoading() {
        return this.isLoading;
    }
}