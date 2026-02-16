import { describe, it, expect, beforeEach } from 'vitest';
import { GoalPlanner } from '../../src/core/goal-planner.js';

describe('GoalPlanner', () => {
  let planner;

  beforeEach(() => {
    localStorage.clear();
    planner = new GoalPlanner();
    planner.clearAllGoals();
  });

  it('calculates required monthly savings for a future goal', () => {
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + 2); // 2 years from now

    const goal = planner.createGoal('Test Goal', 12000, targetDate, 2000, {
      expectedReturn: 0.05,
    });

    // Required monthly savings is stored on the created goal
    expect(typeof goal.requiredMonthlySavings).toBe('number');
    expect(goal.requiredMonthlySavings).toBeGreaterThanOrEqual(0);
  });

  it('projects wealth accumulation over years', () => {
    const projections = planner.projectWealthAccumulation(200, 0.05, 5, 1000);
    expect(Array.isArray(projections)).toBe(true);
    expect(projections.length).toBe(5);
    // Projections should be increasing
    for (let i = 1; i < projections.length; i++) {
      expect(projections[i].projectedWealth).toBeGreaterThanOrEqual(
        projections[i - 1].projectedWealth
      );
    }
  });

  it('assesses goal feasibility under different income/expense scenarios', () => {
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + 3);

    const goal = planner.createGoal('House', 50000, targetDate, 10000, {
      expectedReturn: 0.04,
    });

    // Feasible scenario: income exceeds expenses comfortably
    const feasible = planner.assessGoalFeasibility(goal, 4000, 2000);
    expect(feasible).toHaveProperty('feasibility');
    expect([
      'achieved',
      'easily_achievable',
      'achievable',
      'challenging',
      'not_feasible',
    ]).toContain(feasible.feasibility);

    // Not feasible scenario: expenses >= income
    const notFeasible = planner.assessGoalFeasibility(goal, 2000, 2500);
    expect(notFeasible.feasibility).toBe('not_feasible');
  });
});
