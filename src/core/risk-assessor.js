/**
 * Risk Assessor - Financial Risk Evaluation and Warnings
 *
 * Evaluates financial risks and provides warnings and recommendations.
 * Analyzes emergency fund adequacy, debt levels, spending trends, and investment risks.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

export class RiskAssessor {
  constructor() {
    this.riskThresholds = {
      emergencyFund: {
        minimum: 3, // months of expenses
        recommended: 6, // months of expenses
        optimal: 12 // months of expenses
      },
      debtToIncome: {
        low: 0.2,      // 20% - manageable
        moderate: 0.36, // 36% - concerning
        high: 0.5      // 50% - dangerous
      },
      spendingTrend: {
        warning: 0.15,  // 15% increase month-over-month
        critical: 0.25  // 25% increase month-over-month
      },
      investmentConcentration: {
        singleAsset: 0.2,    // 20% max in single asset
        singleSector: 0.3,   // 30% max in single sector
        singleRegion: 0.4    // 40% max in single region
      }
    };
  }

  /**
   * Assess emergency fund adequacy
   *
   * Calculates emergency fund coverage based on the ratio of emergency fund to monthly expenses.
   * The emergency fund is measured in months of expenses covered, providing a standardized
   * way to evaluate financial preparedness for unexpected events.
   *
   * Calculation Formula:
   * - Months Covered = Emergency Fund Amount ÷ Average Monthly Expenses
   *
   * Threshold Guidelines (based on financial planning best practices):
   * - Minimum (3 months): Basic protection against short-term disruptions like job loss or medical emergencies
   * - Recommended (6 months): Moderate security for most households, covering extended unemployment or major repairs
   * - Optimal (12 months): Comprehensive protection for high-risk situations, career transitions, or economic uncertainty
   *
   * These thresholds align with recommendations from financial experts and organizations like the Consumer
   * Financial Protection Bureau (CFPB) and certified financial planners, who suggest 3-12 months of expenses
   * depending on individual circumstances, risk tolerance, and income stability.
   *
   * @param {number} monthlyExpenses - Average monthly expenses (must be > 0 for valid assessment)
   * @param {number} emergencyFund - Current emergency fund amount (savings designated for emergencies)
   * @returns {Object} Emergency fund assessment with status, risk level, recommendations, and coverage details
   */
  assessEmergencyFundAdequacy(monthlyExpenses, emergencyFund) {
    try {
      if (monthlyExpenses <= 0) {
        return {
          status: 'unknown',
          message: 'Unable to assess emergency fund - insufficient expense data',
          recommendation: 'Track expenses for at least 3 months to get accurate assessment',
          monthsCovered: 0,
          targetAmount: 0,
          shortfall: 0,
          riskLevel: 'unknown'
        };
      }

      const monthsCovered = emergencyFund / monthlyExpenses;
      const recommendedAmount = monthlyExpenses * this.riskThresholds.emergencyFund.recommended;
      const shortfall = Math.max(0, recommendedAmount - emergencyFund);

      let status, riskLevel, message, recommendation;

      if (monthsCovered >= this.riskThresholds.emergencyFund.optimal) {
        status = 'excellent';
        riskLevel = 'low';
        message = `Excellent emergency fund: ${monthsCovered.toFixed(1)} months of expenses covered`;
        recommendation = 'Consider investing excess emergency funds for better returns while maintaining liquidity';
      } else if (monthsCovered >= this.riskThresholds.emergencyFund.recommended) {
        status = 'good';
        riskLevel = 'low';
        message = `Good emergency fund: ${monthsCovered.toFixed(1)} months of expenses covered`;
        recommendation = 'Emergency fund is adequate. Consider building towards 12 months for optimal security';
      } else if (monthsCovered >= this.riskThresholds.emergencyFund.minimum) {
        status = 'adequate';
        riskLevel = 'moderate';
        message = `Minimum emergency fund: ${monthsCovered.toFixed(1)} months of expenses covered`;
        recommendation = `Build emergency fund to €${recommendedAmount.toFixed(2)} (6 months of expenses)`;
      } else if (monthsCovered > 0) {
        status = 'insufficient';
        riskLevel = 'high';
        message = `Insufficient emergency fund: Only ${monthsCovered.toFixed(1)} months covered`;
        recommendation = `Urgent: Build emergency fund to at least €${(monthlyExpenses * 3).toFixed(2)} (3 months minimum)`;
      } else {
        status = 'none';
        riskLevel = 'critical';
        message = 'No emergency fund detected';
        recommendation = `Critical: Start building emergency fund immediately. Target: €${recommendedAmount.toFixed(2)}`;
      }

      return {
        status,
        riskLevel,
        message,
        recommendation,
        monthsCovered: Math.round(monthsCovered * 10) / 10,
        currentAmount: emergencyFund,
        targetAmount: recommendedAmount,
        shortfall: Math.round(shortfall * 100) / 100,
        monthlyExpenses
      };
    } catch (error) {
      console.error('Error assessing emergency fund:', error);
      return {
        status: 'error',
        riskLevel: 'unknown',
        message: 'Error calculating emergency fund assessment',
        recommendation: 'Please check your financial data and try again',
        monthsCovered: 0,
        targetAmount: 0,
        shortfall: 0
      };
    }
  }

  /**
   * Evaluate debt-to-income ratio
   * @param {number} monthlyDebt - Monthly debt payments
   * @param {number} monthlyIncome - Monthly gross income
   * @returns {Object} Debt-to-income assessment
   */
  evaluateDebtToIncomeRatio(monthlyDebt, monthlyIncome) {
    try {
      if (monthlyIncome <= 0) {
        return {
          ratio: 0,
          status: 'unknown',
          riskLevel: 'unknown',
          message: 'Unable to calculate debt-to-income ratio - no income data',
          recommendation: 'Add income transactions to get debt-to-income analysis'
        };
      }

      const ratio = monthlyDebt / monthlyIncome;
      const percentage = ratio * 100;

      let status, riskLevel, message, recommendation;

      if (ratio <= this.riskThresholds.debtToIncome.low) {
        status = 'excellent';
        riskLevel = 'low';
        message = `Excellent debt management: ${percentage.toFixed(1)}% debt-to-income ratio`;
        recommendation = 'Debt levels are very manageable. Consider investing extra income or building emergency fund';
      } else if (ratio <= this.riskThresholds.debtToIncome.moderate) {
        status = 'manageable';
        riskLevel = 'moderate';
        message = `Manageable debt levels: ${percentage.toFixed(1)}% debt-to-income ratio`;
        recommendation = 'Debt is manageable but monitor closely. Avoid taking on additional debt';
      } else if (ratio <= this.riskThresholds.debtToIncome.high) {
        status = 'concerning';
        riskLevel = 'high';
        message = `High debt burden: ${percentage.toFixed(1)}% debt-to-income ratio`;
        recommendation = 'Focus on debt reduction. Consider debt consolidation or payment plan adjustments';
      } else {
        status = 'dangerous';
        riskLevel = 'critical';
        message = `Dangerous debt levels: ${percentage.toFixed(1)}% debt-to-income ratio`;
        recommendation = 'Critical: Seek debt counseling immediately. Consider debt restructuring or professional help';
      }

      const excessDebt = Math.max(0, monthlyDebt - (monthlyIncome * this.riskThresholds.debtToIncome.moderate));

      return {
        ratio: Math.round(ratio * 1000) / 10, // Percentage with 1 decimal
        status,
        riskLevel,
        message,
        recommendation,
        monthlyDebt,
        monthlyIncome,
        excessDebt: Math.round(excessDebt * 100) / 100,
        targetRatio: this.riskThresholds.debtToIncome.moderate * 100
      };
    } catch (error) {
      console.error('Error evaluating debt-to-income ratio:', error);
      return {
        ratio: 0,
        status: 'error',
        riskLevel: 'unknown',
        message: 'Error calculating debt-to-income ratio',
        recommendation: 'Please check your financial data and try again'
      };
    }
  }

  /**
   * Analyze spending trends for risk patterns
   * @param {Array} expenseHistory - Historical expense data by month
   * @returns {Object} Spending trend analysis
   */
  analyzeSpendingTrends(expenseHistory) {
    try {
      if (!expenseHistory || expenseHistory.length < 2) {
        return {
          trend: 'insufficient_data',
          riskLevel: 'unknown',
          message: 'Insufficient data to analyze spending trends',
          recommendation: 'Track expenses for at least 2 months to identify trends',
          monthlyChange: 0,
          averageSpending: 0
        };
      }

      // Calculate month-over-month changes
      const changes = [];
      for (let i = 1; i < expenseHistory.length; i++) {
        const current = expenseHistory[i].amount;
        const previous = expenseHistory[i - 1].amount;
        
        if (previous > 0) {
          const change = (current - previous) / previous;
          changes.push(change);
        }
      }

      if (changes.length === 0) {
        return {
          trend: 'stable',
          riskLevel: 'low',
          message: 'Spending appears stable',
          recommendation: 'Continue monitoring spending patterns',
          monthlyChange: 0,
          averageSpending: 0
        };
      }

      const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
      const averageSpending = expenseHistory.reduce((sum, month) => sum + month.amount, 0) / expenseHistory.length;
      const recentChange = changes[changes.length - 1]; // Most recent month-over-month change

      let trend, riskLevel, message, recommendation;

      if (recentChange >= this.riskThresholds.spendingTrend.critical) {
        trend = 'rapidly_increasing';
        riskLevel = 'critical';
        message = `Critical: Spending increased ${(recentChange * 100).toFixed(1)}% last month`;
        recommendation = 'Immediate action required: Review and cut non-essential expenses';
      } else if (recentChange >= this.riskThresholds.spendingTrend.warning) {
        trend = 'increasing';
        riskLevel = 'high';
        message = `Warning: Spending increased ${(recentChange * 100).toFixed(1)}% last month`;
        recommendation = 'Monitor spending closely and identify areas to reduce expenses';
      } else if (averageChange > 0.05) { // 5% average increase
        trend = 'gradually_increasing';
        riskLevel = 'moderate';
        message = `Spending trending upward: ${(averageChange * 100).toFixed(1)}% average monthly increase`;
        recommendation = 'Review spending categories to identify and control increasing expenses';
      } else if (recentChange < -0.1) { // 10% decrease
        trend = 'decreasing';
        riskLevel = 'low';
        message = `Good: Spending decreased ${Math.abs(recentChange * 100).toFixed(1)}% last month`;
        recommendation = 'Excellent spending control. Continue current financial habits';
      } else {
        trend = 'stable';
        riskLevel = 'low';
        message = 'Spending levels are stable';
        recommendation = 'Maintain current spending discipline';
      }

      return {
        trend,
        riskLevel,
        message,
        recommendation,
        monthlyChange: Math.round(recentChange * 1000) / 10, // Percentage with 1 decimal
        averageChange: Math.round(averageChange * 1000) / 10,
        averageSpending: Math.round(averageSpending * 100) / 100,
        dataPoints: expenseHistory.length,
        analysis: {
          recentTrend: recentChange > 0 ? 'increasing' : recentChange < 0 ? 'decreasing' : 'stable',
          overallTrend: averageChange > 0 ? 'increasing' : averageChange < 0 ? 'decreasing' : 'stable',
          volatility: this._calculateVolatility(changes)
        }
      };
    } catch (error) {
      console.error('Error analyzing spending trends:', error);
      return {
        trend: 'error',
        riskLevel: 'unknown',
        message: 'Error analyzing spending trends',
        recommendation: 'Please check your expense data and try again',
        monthlyChange: 0,
        averageSpending: 0
      };
    }
  }

  /**
   * Generate low balance warnings from balance projections
   * @param {Array} balanceProjections - Future balance projections
   * @returns {Array} Low balance warnings
   */
  generateLowBalanceWarnings(balanceProjections) {
    const warnings = [];

    balanceProjections.forEach(projection => {
      if (projection.projectedBalance <= 0) {
        warnings.push({
          type: 'overdraft',
          severity: 'critical',
          month: projection.month,
          date: projection.period,
          balance: projection.projectedBalance,
          message: `Account projected to be overdrawn by €${Math.abs(projection.projectedBalance).toFixed(2)}`,
          recommendation: 'Urgent action required: Reduce expenses or increase income immediately'
        });
      } else if (projection.projectedBalance <= 100) {
        warnings.push({
          type: 'low_balance',
          severity: 'high',
          month: projection.month,
          date: projection.period,
          balance: projection.projectedBalance,
          message: `Very low balance projected: €${projection.projectedBalance.toFixed(2)}`,
          recommendation: 'Take immediate steps to improve cash flow'
        });
      } else if (projection.projectedBalance <= 500) {
        warnings.push({
          type: 'low_balance',
          severity: 'moderate',
          month: projection.month,
          date: projection.period,
          balance: projection.projectedBalance,
          message: `Low balance warning: €${projection.projectedBalance.toFixed(2)}`,
          recommendation: 'Monitor spending and consider building reserves'
        });
      }
    });

    return warnings;
  }

  /**
   * Generate debt warnings based on debt analysis
   * @param {Object} debtAnalysis - Debt-to-income analysis result
   * @returns {Array} Debt warnings
   */
  generateDebtWarnings(debtAnalysis) {
    const warnings = [];

    if (debtAnalysis.riskLevel === 'critical') {
      warnings.push({
        type: 'debt_critical',
        severity: 'critical',
        message: debtAnalysis.message,
        recommendation: debtAnalysis.recommendation,
        debtRatio: debtAnalysis.ratio,
        monthlyDebt: debtAnalysis.monthlyDebt,
        monthlyIncome: debtAnalysis.monthlyIncome
      });
    } else if (debtAnalysis.riskLevel === 'high') {
      warnings.push({
        type: 'debt_high',
        severity: 'high',
        message: debtAnalysis.message,
        recommendation: debtAnalysis.recommendation,
        debtRatio: debtAnalysis.ratio,
        excessDebt: debtAnalysis.excessDebt
      });
    }

    return warnings;
  }

  /**
   * Generate investment risk warnings
   * @param {Object} portfolioAnalysis - Portfolio analysis data
   * @returns {Array} Investment risk warnings
   */
  generateInvestmentRiskWarnings(portfolioAnalysis) {
    const warnings = [];

    if (!portfolioAnalysis || !portfolioAnalysis.allocations) {
      return warnings;
    }

    // Check for concentration risks
    const { assetAllocation, sectorAllocation } = portfolioAnalysis.allocations;

    // Single asset concentration
    if (assetAllocation) {
      Object.entries(assetAllocation).forEach(([asset, percentage]) => {
        if (percentage > this.riskThresholds.investmentConcentration.singleAsset * 100) {
          warnings.push({
            type: 'concentration_risk',
            severity: 'moderate',
            category: 'asset',
            asset,
            percentage,
            message: `High concentration in ${asset}: ${percentage.toFixed(1)}%`,
            recommendation: `Consider diversifying - limit single asset to ${(this.riskThresholds.investmentConcentration.singleAsset * 100).toFixed(0)}%`
          });
        }
      });
    }

    // Sector concentration
    if (sectorAllocation) {
      Object.entries(sectorAllocation).forEach(([sector, percentage]) => {
        if (percentage > this.riskThresholds.investmentConcentration.singleSector * 100) {
          warnings.push({
            type: 'concentration_risk',
            severity: 'moderate',
            category: 'sector',
            sector,
            percentage,
            message: `High sector concentration in ${sector}: ${percentage.toFixed(1)}%`,
            recommendation: `Consider diversifying across sectors - limit to ${(this.riskThresholds.investmentConcentration.singleSector * 100).toFixed(0)}%`
          });
        }
      });
    }

    return warnings;
  }

  /**
   * Calculate overall risk score
   * @param {Array} riskFactors - Array of risk assessment results
   * @returns {Object} Overall risk score and summary
   */
  calculateOverallRiskScore(riskFactors) {
    try {
      if (!riskFactors || riskFactors.length === 0) {
        return {
          score: 0,
          level: 'unknown',
          message: 'Insufficient data for risk assessment',
          factors: []
        };
      }

      const riskWeights = {
        critical: 4,
        high: 3,
        moderate: 2,
        low: 1,
        unknown: 0
      };

      let totalScore = 0;
      let maxPossibleScore = 0;
      const factorSummary = [];

      riskFactors.forEach(factor => {
        const weight = riskWeights[factor.riskLevel] || 0;
        totalScore += weight;
        maxPossibleScore += 4; // Maximum possible weight
        
        factorSummary.push({
          category: factor.category,
          riskLevel: factor.riskLevel,
          weight,
          message: factor.message
        });
      });

      const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

      let level, message;
      if (normalizedScore >= 75) {
        level = 'critical';
        message = 'Critical financial risks detected - immediate action required';
      } else if (normalizedScore >= 50) {
        level = 'high';
        message = 'High financial risk - take action to improve financial health';
      } else if (normalizedScore >= 25) {
        level = 'moderate';
        message = 'Moderate financial risk - monitor and improve where possible';
      } else {
        level = 'low';
        message = 'Low financial risk - maintain current financial discipline';
      }

      return {
        score: Math.round(normalizedScore),
        level,
        message,
        factors: factorSummary,
        totalFactors: riskFactors.length,
        highRiskFactors: factorSummary.filter(f => f.riskLevel === 'critical' || f.riskLevel === 'high').length
      };
    } catch (error) {
      console.error('Error calculating overall risk score:', error);
      return {
        score: 0,
        level: 'error',
        message: 'Error calculating risk score',
        factors: []
      };
    }
  }

  /**
   * Prioritize risks by severity and impact
   * @param {Array} riskAssessments - Array of risk assessments
   * @returns {Array} Prioritized risks
   */
  prioritizeRisks(riskAssessments) {
    const priorityOrder = {
      critical: 4,
      high: 3,
      moderate: 2,
      low: 1,
      unknown: 0
    };

    return riskAssessments
      .filter(risk => risk.riskLevel && risk.riskLevel !== 'unknown')
      .sort((a, b) => {
        const priorityA = priorityOrder[a.riskLevel] || 0;
        const priorityB = priorityOrder[b.riskLevel] || 0;
        return priorityB - priorityA; // Descending order (highest priority first)
      })
      .map((risk, index) => ({
        ...risk,
        priority: index + 1,
        urgency: risk.riskLevel === 'critical' ? 'immediate' : 
                risk.riskLevel === 'high' ? 'urgent' : 
                risk.riskLevel === 'moderate' ? 'important' : 'monitor'
      }));
  }

  /**
   * Calculate volatility of a data series
   * @param {Array} changes - Array of period-over-period changes
   * @returns {number} Volatility measure
   */
  _calculateVolatility(changes) {
    if (changes.length < 2) return 0;

    const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
    
    return Math.sqrt(variance);
  }
}
