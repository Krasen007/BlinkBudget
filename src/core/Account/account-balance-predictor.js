/**
 * Account Balance Predictor - Future Balance Projections
 *
 * Projects future account balances and identifies potential financial risks.
 * Uses forecast data to predict balance changes and warn about low balances.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { ForecastEngine } from '../forecast-engine.js';

export class AccountBalancePredictor {
  constructor() {
    this.forecastEngine = new ForecastEngine();
    this.defaultProjectionMonths = 6;
  }

  /**
   * Project account balances for the specified number of months
   * @param {number} currentBalance - Current account balance
   * @param {Array} incomeForecasts - Income forecast data
   * @param {Array} expenseForecasts - Expense forecast data
   * @param {number} months - Number of months to project (default: 6)
   * @returns {Array} Array of balance projections
   */
  projectBalances(
    currentBalance,
    incomeForecasts,
    expenseForecasts,
    months = 6
  ) {
    try {
      const projections = [];
      let runningBalance = currentBalance;

      for (let i = 0; i < months; i++) {
        const incomeForcast = incomeForecasts[i] || {
          predictedAmount: 0,
          confidence: 0,
        };
        const expenseForcast = expenseForecasts[i] || {
          predictedAmount: 0,
          confidence: 0,
        };

        const netCashFlow =
          incomeForcast.predictedAmount - expenseForcast.predictedAmount;
        runningBalance += netCashFlow;

        const projection = {
          month: i + 1,
          period: incomeForcast.period || this._getFutureDate(i + 1),
          projectedBalance: Math.round(runningBalance * 100) / 100,
          netCashFlow: Math.round(netCashFlow * 100) / 100,
          income: incomeForcast.predictedAmount,
          expenses: expenseForcast.predictedAmount,
          confidence: Math.min(
            incomeForcast.confidence,
            expenseForcast.confidence
          ),
          balanceChange: Math.round(netCashFlow * 100) / 100,
        };

        projections.push(projection);
      }

      return projections;
    } catch (error) {
      console.error('Error projecting balances:', error);
      return this._generateFallbackProjections(currentBalance, months);
    }
  }

  /**
   * Calculate net cash flow from forecasts
   * @param {Array} incomeForecasts - Income forecasts
   * @param {Array} expenseForecasts - Expense forecasts
   * @returns {Array} Net cash flow projections
   */
  calculateCashFlow(incomeForecasts, expenseForecasts) {
    try {
      const cashFlows = [];
      const maxLength = Math.max(
        incomeForecasts.length,
        expenseForecasts.length
      );

      for (let i = 0; i < maxLength; i++) {
        const income = incomeForecasts[i]?.predictedAmount || 0;
        const expenses = expenseForecasts[i]?.predictedAmount || 0;
        const netFlow = income - expenses;

        cashFlows.push({
          period:
            incomeForecasts[i]?.period ||
            expenseForecasts[i]?.period ||
            this._getFutureDate(i + 1),
          income,
          expenses,
          netCashFlow: Math.round(netFlow * 100) / 100,
          isPositive: netFlow >= 0,
        });
      }

      return cashFlows;
    } catch (error) {
      console.error('Error calculating cash flow:', error);
      return [];
    }
  }

  /**
   * Identify low balance risks in projections
   * @param {Array} balanceProjections - Balance projection data
   * @param {Object} thresholds - Risk thresholds
   * @returns {Array} Low balance risk warnings
   */
  identifyLowBalanceRisks(balanceProjections, thresholds = {}) {
    const defaultThresholds = {
      critical: 0, // Balance at or below zero
      warning: 100, // Balance below €100
      caution: 500, // Balance below €500
    };

    const riskThresholds = { ...defaultThresholds, ...thresholds };
    const risks = [];

    balanceProjections.forEach(projection => {
      const balance = projection.projectedBalance;

      let riskLevel = null;
      let message = '';
      let recommendation = '';

      if (balance <= riskThresholds.critical) {
        riskLevel = 'critical';
        message = `Account balance projected to reach €${balance.toFixed(2)} in ${projection.period.toLocaleDateString()}`;
        recommendation =
          'Immediate action required: Reduce expenses or increase income to avoid overdraft';
      } else if (balance <= riskThresholds.warning) {
        riskLevel = 'warning';
        message = `Low balance warning: €${balance.toFixed(2)} projected for ${projection.period.toLocaleDateString()}`;
        recommendation =
          'Consider reducing non-essential expenses or finding additional income sources';
      } else if (balance <= riskThresholds.caution) {
        riskLevel = 'caution';
        message = `Balance approaching low levels: €${balance.toFixed(2)} in ${projection.period.toLocaleDateString()}`;
        recommendation =
          'Monitor spending closely and consider building emergency reserves';
      }

      if (riskLevel) {
        risks.push({
          month: projection.month,
          period: projection.period,
          riskLevel,
          projectedBalance: balance,
          message,
          recommendation,
          daysUntil: this._calculateDaysUntil(projection.period),
          confidence: projection.confidence,
        });
      }
    });

    return risks;
  }

  /**
   * Detect potential overdraft risks
   * @param {Array} balanceProjections - Balance projection data
   * @returns {Array} Overdraft risk warnings
   */
  detectOverdraftRisks(balanceProjections) {
    const overdraftRisks = [];

    balanceProjections.forEach(projection => {
      if (projection.projectedBalance < 0) {
        const overdraftAmount = Math.abs(projection.projectedBalance);

        overdraftRisks.push({
          month: projection.month,
          period: projection.period,
          overdraftAmount: Math.round(overdraftAmount * 100) / 100,
          projectedBalance: projection.projectedBalance,
          message: `Overdraft risk: Account projected to be €${overdraftAmount.toFixed(2)} overdrawn`,
          recommendation:
            'Urgent: Adjust spending or arrange additional funds to prevent overdraft fees',
          severity:
            overdraftAmount > 500
              ? 'high'
              : overdraftAmount > 100
                ? 'medium'
                : 'low',
          daysUntil: this._calculateDaysUntil(projection.period),
          confidence: projection.confidence,
        });
      }
    });

    return overdraftRisks;
  }

  /**
   * Assess credit limit risks for credit accounts
   * @param {Array} balanceProjections - Balance projection data
   * @param {number} creditLimit - Credit limit amount
   * @returns {Array} Credit limit risk warnings
   */
  assessCreditLimitRisks(balanceProjections, creditLimit) {
    if (!creditLimit || creditLimit <= 0) return [];

    const creditRisks = [];
    const warningThreshold = creditLimit * 0.8; // 80% of credit limit
    const criticalThreshold = creditLimit * 0.95; // 95% of credit limit

    balanceProjections.forEach(projection => {
      // For credit accounts, negative balance means debt
      const debtAmount = Math.abs(Math.min(0, projection.projectedBalance));
      const utilizationRate = debtAmount / creditLimit;

      let riskLevel = null;
      let message = '';
      let recommendation = '';

      if (debtAmount >= criticalThreshold) {
        riskLevel = 'critical';
        message = `Credit utilization projected at ${(utilizationRate * 100).toFixed(1)}% (€${debtAmount.toFixed(2)} of €${creditLimit})`;
        recommendation =
          'Critical: Reduce spending immediately to avoid exceeding credit limit';
      } else if (debtAmount >= warningThreshold) {
        riskLevel = 'warning';
        message = `High credit utilization: ${(utilizationRate * 100).toFixed(1)}% projected`;
        recommendation =
          'Consider paying down balance or reducing credit card usage';
      }

      if (riskLevel) {
        creditRisks.push({
          month: projection.month,
          period: projection.period,
          riskLevel,
          debtAmount: Math.round(debtAmount * 100) / 100,
          creditLimit,
          utilizationRate: Math.round(utilizationRate * 1000) / 10, // Percentage with 1 decimal
          message,
          recommendation,
          daysUntil: this._calculateDaysUntil(projection.period),
          confidence: projection.confidence,
        });
      }
    });

    return creditRisks;
  }

  /**
   * Model what-if scenarios by adjusting projections
   * @param {Array} baseProjections - Base balance projections
   * @param {Object} scenarioAdjustments - Scenario parameters
   * @returns {Array} Adjusted projections
   */
  modelWhatIfScenarios(baseProjections, scenarioAdjustments) {
    try {
      const {
        incomeChange = 0, // Monthly income change
        expenseChange = 0, // Monthly expense change
        oneTimeIncome = 0, // One-time income (month 1)
        oneTimeExpense = 0, // One-time expense (month 1)
        startMonth = 1, // When changes take effect
      } = scenarioAdjustments;

      const adjustedProjections = [];
      let runningAdjustedBalance;

      for (let index = 0; index < baseProjections.length; index++) {
        const projection = baseProjections[index];
        const month = index + 1;
        let adjustedIncome = projection.income;
        let adjustedExpenses = projection.expenses;

        // Apply ongoing changes from start month
        if (month >= startMonth) {
          adjustedIncome += incomeChange;
          adjustedExpenses += expenseChange;
        }

        // Apply one-time changes in first month
        if (month === 1) {
          adjustedIncome += oneTimeIncome;
          adjustedExpenses += oneTimeExpense;
        }

        const adjustedNetFlow = adjustedIncome - adjustedExpenses;

        // Recalculate running balance
        let adjustedBalance;
        if (index === 0) {
          // First month: start with original balance (before original net flow) and apply changes
          const originalNetFlow = projection.income - projection.expenses;
          adjustedBalance =
            projection.projectedBalance - originalNetFlow + adjustedNetFlow;
        } else {
          // Subsequent months: use previous adjusted balance
          adjustedBalance = runningAdjustedBalance + adjustedNetFlow;
        }

        runningAdjustedBalance = adjustedBalance;

        adjustedProjections.push({
          ...projection,
          income: Math.round(adjustedIncome * 100) / 100,
          expenses: Math.round(adjustedExpenses * 100) / 100,
          netCashFlow: Math.round(adjustedNetFlow * 100) / 100,
          projectedBalance: Math.round(adjustedBalance * 100) / 100,
          balanceChange: Math.round(adjustedNetFlow * 100) / 100,
          isScenario: true,
          scenarioAdjustments: {
            incomeChange: month >= startMonth ? incomeChange : 0,
            expenseChange: month >= startMonth ? expenseChange : 0,
            oneTimeIncome: month === 1 ? oneTimeIncome : 0,
            oneTimeExpense: month === 1 ? oneTimeExpense : 0,
          },
        });
      }

      return adjustedProjections;
    } catch (error) {
      console.error('Error modeling what-if scenario:', error);
      return baseProjections;
    }
  }

  /**
   * Generate consolidated balance view for multiple accounts
   * @param {Array} accountProjections - Array of account projection objects
   * @returns {Array} Consolidated balance projections
   */
  generateConsolidatedView(accountProjections) {
    try {
      if (!accountProjections || accountProjections.length === 0) {
        return [];
      }

      const maxMonths = Math.max(
        ...accountProjections.map(acc => acc.projections.length)
      );
      const consolidated = [];

      for (let month = 0; month < maxMonths; month++) {
        let totalBalance = 0;
        let totalIncome = 0;
        let totalExpenses = 0;
        let totalNetFlow = 0;
        let minConfidence = 1;
        let period = null;

        accountProjections.forEach(account => {
          const projection = account.projections[month];
          if (projection) {
            totalBalance += projection.projectedBalance;
            totalIncome += projection.income;
            totalExpenses += projection.expenses;
            totalNetFlow += projection.netCashFlow;
            minConfidence = Math.min(minConfidence, projection.confidence);
            period = period || projection.period;
          }
        });

        consolidated.push({
          month: month + 1,
          period,
          projectedBalance: Math.round(totalBalance * 100) / 100,
          netCashFlow: Math.round(totalNetFlow * 100) / 100,
          income: Math.round(totalIncome * 100) / 100,
          expenses: Math.round(totalExpenses * 100) / 100,
          confidence: minConfidence,
          balanceChange: Math.round(totalNetFlow * 100) / 100,
          accountCount: accountProjections.length,
        });
      }

      return consolidated;
    } catch (error) {
      console.error('Error generating consolidated view:', error);
      return [];
    }
  }

  /**
   * Get future date for a given number of months ahead
   * @param {number} monthsAhead - Number of months in the future
   * @returns {Date} Future date
   */
  _getFutureDate(monthsAhead) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsAhead);
    return date;
  }

  /**
   * Calculate days until a future date
   * @param {Date} futureDate - Target date
   * @returns {number} Days until the date
   */
  _calculateDaysUntil(futureDate) {
    const now = new Date();
    const diffTime = futureDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate fallback projections when forecasting fails
   * @param {number} currentBalance - Current balance
   * @param {number} months - Number of months
   * @returns {Array} Fallback projections
   */
  _generateFallbackProjections(currentBalance, months) {
    const projections = [];

    for (let i = 0; i < months; i++) {
      projections.push({
        month: i + 1,
        period: this._getFutureDate(i + 1),
        projectedBalance: currentBalance,
        netCashFlow: 0,
        income: 0,
        expenses: 0,
        confidence: 0.1,
        balanceChange: 0,
        isFallback: true,
      });
    }

    return projections;
  }
}
