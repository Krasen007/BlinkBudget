/**
 * Goals Section - Long-term Planning
 *
 * Composes goal entry, progress and recommendation modules.
 */

import { ProgressiveEmptyState } from '../../components/ProgressiveEmptyState.js';
import { COLORS, SPACING } from '../../utils/constants.js';
import { createGoalProgressChart } from '../../utils/financial-planning-charts.js';
import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
} from '../../utils/financial-planning-helpers.js';
import { refreshChart } from '../../utils/chart-refresh-helper.js';
import { SavingsGoalsService } from '../../core/savings-goals-service.js';
import { StorageService } from '../../core/storage.js';
import { showErrorToast } from '../../utils/toast-notifications.js';
import { createGoalFormControls } from './goals-form.js';
import { createGoalsList } from './goals-list.js';
import { createGoalsSummaryCard } from './goals-summary.js';

/**
 * Goals Section Component
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @returns {Promise<HTMLElement>} Goals section element
 */
export const GoalsSection = async (chartRenderer, activeCharts) => {
  const section = createSectionContainer('goals', 'Financial Goals', '🎯');
  section.className += ' goals-section';
  section.appendChild(
    createUsageNote(
      'Create goals with a target amount, date and manually maintained current balance. Progress is not linked to account balances or transactions.'
    )
  );

  try {
    const txCount = (StorageService.getAll() || []).length;
    const unlockCard = ProgressiveEmptyState({
      section: 'goals',
      transactionCount: txCount,
    });
    if (unlockCard) section.appendChild(unlockCard);
  } catch (error) {
    console.warn('[GoalsSection] Progressive unlock check failed:', error);
  }

  let goalsFromStorage;
  try {
    goalsFromStorage = StorageService.getGoals() || [];
  } catch (error) {
    console.warn('Error fetching goals from StorageService:', error);
    goalsFromStorage = [];
  }

  const goalsToRender = Array.isArray(goalsFromStorage) ? goalsFromStorage : [];
  const hasRealGoals = goalsToRender.length > 0;
  const insights = document.createElement('div');
  insights.className = 'goal-insights';
  insights.style.marginTop = SPACING.MD;
  insights.style.padding = SPACING.MD;
  insights.style.background = COLORS.SURFACE;
  insights.style.borderRadius = 'var(--radius-md)';
  insights.style.border = `1px solid ${COLORS.BORDER}`;

  const heading = document.createElement('h4');
  heading.textContent = 'Goal Insights';
  heading.style.marginTop = '0';

  const insightText = document.createElement('p');
  insightText.style.fontSize = '0.9rem';
  const updateGoalInsights = goals => {
    const currentGoals = Array.isArray(goals) ? goals : [];
    const behindSchedule = currentGoals.filter(goal => {
      const progress =
        goal.targetAmount > 0
          ? (goal.currentSavings / goal.targetAmount) * 100
          : 0;
      const targetDate = new Date(goal.targetDate);
      return (
        progress < 20 &&
        targetDate < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      );
    });

    const recommendation = document.createElement('strong');
    recommendation.textContent = 'Recommendation:';
    insightText.replaceChildren(recommendation);

    if (currentGoals.length === 0) {
      insightText.style.color = COLORS.TEXT_MUTED;
      insightText.appendChild(
        document.createTextNode(
          ' Set your first goal above to track your savings pace.'
        )
      );
    } else if (behindSchedule.length > 0) {
      insightText.style.color = COLORS.ERROR;
      insightText.appendChild(
        document.createTextNode(
          ` You have ${behindSchedule.length.toString()} goals that may need more aggressive savings to stay on track.`
        )
      );
    } else {
      insightText.style.color = COLORS.SUCCESS;
      insightText.appendChild(
        document.createTextNode(
          ' Your goals look well-paced. Keep up the consistent saving!'
        )
      );
    }
  };

  if (hasRealGoals) {
    try {
      const { section: chartSection, chart } = await createGoalProgressChart(
        chartRenderer,
        goalsToRender
      );
      chartSection.classList.add('goals-progress-chart');
      section.appendChild(chartSection);
      activeCharts.set('goal-progress', chart);
    } catch (error) {
      console.error('Error creating goal progress chart:', error);
    }
  }

  const summaryCard = createGoalsSummaryCard(goalsToRender);
  section.appendChild(summaryCard);

  const { goalsList, refreshGoalsList } = createGoalsList(
    chartRenderer,
    activeCharts,
    section,
    updateGoalInsights
  );
  section.appendChild(goalsList);

  updateGoalInsights(goalsToRender);
  insights.appendChild(heading);
  insights.appendChild(insightText);
  section.appendChild(insights);

  let emptyPlaceholder = null;
  const refreshAfterGoalSaved = async () => {
    let updatedGoals;
    try {
      updatedGoals = StorageService.getGoals() || [];
    } catch (error) {
      console.error('Goal was saved but its list could not be loaded', error);
      showErrorToast('Goal saved, but the goal list could not refresh.');
      return;
    }

    await refreshGoalsList();
    const currentSummary = section.querySelector('.goals-summary-card');
    if (currentSummary) {
      currentSummary.replaceWith(createGoalsSummaryCard(updatedGoals));
    }
    updateGoalInsights(updatedGoals);
    if (emptyPlaceholder && section.contains(emptyPlaceholder)) {
      emptyPlaceholder.remove();
      emptyPlaceholder = null;
    }

    try {
      const existingChart = section.querySelector(
        '[data-chart-type="goal-progress"]'
      );
      if (existingChart) {
        await refreshChart({
          createChartFn: createGoalProgressChart,
          chartRenderer,
          data: updatedGoals,
          section,
          chartType: 'goal-progress',
          activeCharts,
        });
      } else if (updatedGoals.length > 0) {
        const { section: newChartSection, chart } =
          await createGoalProgressChart(chartRenderer, updatedGoals);
        newChartSection.classList.add('goals-progress-chart');
        const currentSummaryCard = section.querySelector('.goals-summary-card');
        if (currentSummaryCard) {
          section.insertBefore(newChartSection, currentSummaryCard);
        } else {
          section.appendChild(newChartSection);
        }
        activeCharts.set('goal-progress', chart);
      }
    } catch (error) {
      console.error('Failed to refresh goal chart after saving goal', error);
      showErrorToast('Goal saved, but the chart could not refresh.');
    }
  };

  section.insertBefore(
    createGoalFormControls(refreshAfterGoalSaved),
    goalsList
  );

  try {
    const transactions = StorageService.getAll() || [];
    const recommendations =
      await SavingsGoalsService.getGoalRecommendations(transactions);

    if (recommendations.length > 0) {
      const recommendationsSection = document.createElement('div');
      recommendationsSection.className = 'goal-recommendations';
      recommendationsSection.style.marginTop = SPACING.MD;
      recommendationsSection.style.padding = SPACING.MD;
      recommendationsSection.style.background = COLORS.SURFACE;
      recommendationsSection.style.borderRadius = 'var(--radius-md)';
      recommendationsSection.style.border = `1px solid ${COLORS.BORDER}`;

      const recommendationsTitle = document.createElement('h4');
      recommendationsTitle.textContent = 'Recommended Goals';
      recommendationsTitle.style.marginTop = '0';
      recommendationsTitle.style.marginBottom = SPACING.SM;
      recommendationsSection.appendChild(recommendationsTitle);

      recommendations.slice(0, 3).forEach(recommendation => {
        const recommendationCard = document.createElement('div');
        recommendationCard.style.cssText = `
          background: ${COLORS.SURFACE};
          border: 1px solid ${COLORS.BORDER};
          border-radius: var(--radius-sm);
          padding: ${SPACING.SM};
          margin-bottom: ${SPACING.SM};
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: ${SPACING.SM};
        `;

        const content = document.createElement('div');
        content.style.flex = '1';

        const title = document.createElement('div');
        title.textContent = recommendation.title;
        title.style.fontWeight = '600';
        title.style.color = COLORS.TEXT_MAIN;
        content.appendChild(title);

        const description = document.createElement('div');
        description.textContent = recommendation.description;
        description.style.fontSize = '0.85rem';
        description.style.color = COLORS.TEXT_MUTED;
        description.style.marginTop = SPACING.XXS;
        content.appendChild(description);

        const createButton = document.createElement('button');
        createButton.textContent = 'Create Goal';
        createButton.className = 'btn btn-primary';
        createButton.style.padding = `${SPACING.XS} ${SPACING.SM}`;
        createButton.style.fontSize = '0.85rem';
        createButton.addEventListener('click', async () => {
          try {
            const targetDate = new Date();
            targetDate.setFullYear(targetDate.getFullYear() + 1);
            StorageService.createGoal(
              recommendation.title,
              recommendation.target || 1000,
              targetDate,
              0,
              { category: recommendation.category || 'General' }
            );

            await refreshAfterGoalSaved();
            recommendationCard.remove();
            if (
              ![...recommendationsSection.children].some(
                child => child !== recommendationsTitle
              )
            ) {
              recommendationsSection.remove();
            }
          } catch (error) {
            console.error('Failed to create goal from recommendation:', error);
            showErrorToast('Failed to create goal. Please try again.');
          }
        });

        recommendationCard.appendChild(content);
        recommendationCard.appendChild(createButton);
        recommendationsSection.appendChild(recommendationCard);
      });

      section.appendChild(recommendationsSection);
    }
  } catch (error) {
    console.warn('Failed to load goal recommendations:', error);
  }

  await refreshGoalsList();

  if (!hasRealGoals) {
    emptyPlaceholder = createPlaceholder(
      'No Goals Yet',
      'Log more transactions to see what goals are realistic for you.',
      '🎯'
    );
    section.appendChild(emptyPlaceholder);
  }

  return section;
};
