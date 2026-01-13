/**
 * Scenarios Section - What-if Modeling
 *
 * Extracted from FinancialPlanningView.js for better maintainability.
 * Displays scenario planning with wealth accumulation projections.
 *
 * Responsibilities:
 * - What-if scenario modeling
 * - Wealth accumulation projections
 * - Scenario form handling
 * - Chart integration for scenario results
 */

import { SPACING } from '../../utils/constants.js';
import {
  createSectionContainer,
  createUsageNote,
} from '../../utils/financial-planning-helpers.js';
import { createProjectedBalanceChart } from '../../utils/financial-planning-charts.js';

/**
 * Scenarios Section Component
 * @param {Object} goalPlanner - Goal planner service instance
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @returns {HTMLElement} DOM element containing scenarios section content
 */
export const ScenariosSection = (goalPlanner, chartRenderer, activeCharts) => {
  const section = createSectionContainer(
    'scenarios',
    'Scenario Planning',
    '🔄'
  );
  section.appendChild(
    createUsageNote(
      'Run what-if scenarios by adjusting savings, income or expenses. Compare scenarios side-by-side to see impact on goals and projected balances.'
    )
  );

  const form = document.createElement('div');
  form.className = 'scenario-form';
  form.style.display = 'grid';
  form.style.gridTemplateColumns = '1fr 1fr';
  form.style.gap = SPACING.MD;

  const monthlyLabel = document.createElement('label');
  monthlyLabel.textContent = 'Monthly Savings (€)';
  monthlyLabel.htmlFor = 'scenario-monthly-savings';
  const monthlyInput = document.createElement('input');
  monthlyInput.id = 'scenario-monthly-savings';
  monthlyInput.name = 'monthlySavings';
  monthlyInput.type = 'number';
  monthlyInput.value = '200';
  monthlyInput.style.padding = SPACING.SM;

  const returnLabel = document.createElement('label');
  returnLabel.textContent = 'Annual Return (%)';
  returnLabel.htmlFor = 'scenario-annual-return';
  const returnInput = document.createElement('input');
  returnInput.id = 'scenario-annual-return';
  returnInput.name = 'annualReturn';
  returnInput.type = 'number';
  returnInput.value = '5';
  returnInput.style.padding = SPACING.SM;

  const yearsLabel = document.createElement('label');
  yearsLabel.textContent = 'Years';
  yearsLabel.htmlFor = 'scenario-years';
  const yearsInput = document.createElement('input');
  yearsInput.id = 'scenario-years';
  yearsInput.name = 'years';
  yearsInput.type = 'number';
  yearsInput.value = '10';
  yearsInput.style.padding = SPACING.SM;

  const initialLabel = document.createElement('label');
  initialLabel.textContent = 'Initial Amount (€)';
  initialLabel.htmlFor = 'scenario-initial-amount';
  const initialInput = document.createElement('input');
  initialInput.id = 'scenario-initial-amount';
  initialInput.name = 'initialAmount';
  initialInput.type = 'number';
  initialInput.value = '1000';
  initialInput.style.padding = SPACING.SM;

  const runBtn = document.createElement('button');
  runBtn.textContent = 'Run Scenario';
  runBtn.className = 'btn btn-primary';
  runBtn.style.gridColumn = '1 / -1';
  runBtn.style.padding = `${SPACING.SM} ${SPACING.MD}`;

  form.appendChild(monthlyLabel);
  form.appendChild(monthlyInput);
  form.appendChild(returnLabel);
  form.appendChild(returnInput);
  form.appendChild(yearsLabel);
  form.appendChild(yearsInput);
  form.appendChild(initialLabel);
  form.appendChild(initialInput);
  form.appendChild(runBtn);

  section.appendChild(form);

  const outputContainer = document.createElement('div');
  outputContainer.className = 'scenario-output';
  outputContainer.style.marginTop = SPACING.LG;
  section.appendChild(outputContainer);

  runBtn.addEventListener('click', () => {
    const monthly = Number(monthlyInput.value) || 0;
    const yearlyReturn = (Number(returnInput.value) || 0) / 100;
    const years = Math.max(1, Number(yearsInput.value) || 1);
    const initial = Number(initialInput.value) || 0;

    // Use GoalPlanner projection utility to generate yearly projections
    const projections = goalPlanner.projectWealthAccumulation(
      monthly,
      yearlyReturn,
      years,
      initial
    );

    // Convert to series for chart helper
    const now = new Date();
    const series = projections.map(p => {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() + p.year);
      return {
        period: d,
        projectedBalance: p.projectedWealth,
      };
    });

    // Cleanup previous scenario chart
    if (activeCharts.has('scenario-chart')) {
      const existing = activeCharts.get('scenario-chart');
      if (existing && typeof existing.destroy === 'function')
        existing.destroy();
      activeCharts.delete('scenario-chart');
    }

    createProjectedBalanceChart(chartRenderer, series)
      .then(({ section: chartSection, chart }) => {
        // Replace output
        outputContainer.innerHTML = '';
        outputContainer.appendChild(chartSection);
        if (chart) activeCharts.set('scenario-chart', chart);
      })
      .catch(err => console.error('Scenario chart error', err));
  });

  return section;
};
