/**
 * Savings Goals Section Component
 *
 * Displays savings goals with visual progress indicators and recommendations.
 * Integrates with budget tracking and financial planning.
 */

import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants.js';
import { SavingsGoalsService } from '../../core/savings-goals-service.js';
import { SavingsGoalCard } from '../../components/ui/ActionCard.js';
import { MobilePrompt, MobileAlert } from '../../components/MobileModal.js';

/**
 * Create savings goals section
 * @param {Object} planningData - Planning data with transactions
 * @param {string} userLocale - User's locale preference (optional)
 * @returns {Promise<HTMLElement>} Savings goals section element
 */
export const SavingsGoalsSection = async (planningData, userLocale) => {
  const container = document.createElement('section');
  container.className = 'savings-goals-section';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = SPACING.LG;

  const transactions = planningData.transactions || [];

  const render = async () => {
    try {
      container.innerHTML = '';

      // Section header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = SPACING.MD;

      const title = document.createElement('h3');
      title.textContent = 'Savings Goals';
      title.style.margin = '0';
      title.style.color = COLORS.TEXT_MAIN;
      header.appendChild(title);

      // Add new goal button
      const addGoalBtn = document.createElement('button');
      addGoalBtn.textContent = '+ Add Goal';
      addGoalBtn.className = 'btn btn-primary';
      addGoalBtn.style.cssText = `
        background: ${COLORS.PRIMARY};
        color: white;
        border: none;
        border-radius: var(--radius-sm);
        padding: ${SPACING.XS} ${SPACING.SM};
        font-size: ${FONT_SIZES.SM};
        cursor: pointer;
        transition: all 0.2s ease;
      `;

      addGoalBtn.addEventListener('click', () => {
        showAddGoalDialog();
      });

      header.appendChild(addGoalBtn);
      container.appendChild(header);

      // Get savings summary
      const savingsSummary = SavingsGoalsService.getSavingsSummary(transactions);

      // Summary card
      const summaryCard = createSummaryCard(savingsSummary);
      container.appendChild(summaryCard);

      // Goals with progress
      if (savingsSummary.goalsWithProgress.length > 0) {
        const goalsSection = document.createElement('div');
        goalsSection.style.display = 'flex';
        goalsSection.style.flexDirection = 'column';
        goalsSection.style.gap = SPACING.MD;

        const goalsTitle = document.createElement('h4');
        goalsTitle.textContent = 'Your Goals';
        goalsTitle.style.margin = '0';
        goalsTitle.style.color = COLORS.TEXT_MAIN;
        goalsSection.appendChild(goalsTitle);

        savingsSummary.goalsWithProgress.forEach(goal => {
          const goalCard = SavingsGoalCard(
            goal,
            goal.progress.currentAmount,
            () => {
              showGoalDetails(goal);
            }
          );
          goalsSection.appendChild(goalCard);
        });

        container.appendChild(goalsSection);
      }

      // Goal recommendations
      const recommendations = await SavingsGoalsService.getGoalRecommendations(transactions);
      if (recommendations.length > 0) {
        const recommendationsSection = document.createElement('div');
        recommendationsSection.style.display = 'flex';
        recommendationsSection.style.flexDirection = 'column';
        recommendationsSection.style.gap = SPACING.MD;

        const recommendationsTitle = document.createElement('h4');
        recommendationsTitle.textContent = 'Recommended Goals';
        recommendationsTitle.style.margin = '0';
        recommendationsTitle.style.color = COLORS.TEXT_MAIN;
        recommendationsSection.appendChild(recommendationsTitle);

        recommendations.slice(0, 3).forEach(recommendation => {
          const recommendationCard = createRecommendationCard(recommendation);
          recommendationsSection.appendChild(recommendationCard);
        });

        container.appendChild(recommendationsSection);
      }
    } catch (error) {
      console.error('[SavingsGoalsSection] Failed to render savings goals:', error);
      container.innerHTML = `
        <div style="text-align: center; padding: ${SPACING.LG}; color: ${COLORS.TEXT_MUTED};">
          <div style="margin-bottom: ${SPACING.MD};">Unable to load savings goals</div>
          <button onclick="location.reload()" style="
            padding: ${SPACING.SM} ${SPACING.MD};
            background: ${COLORS.PRIMARY};
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            cursor: pointer;
          ">Retry</button>
        </div>
      `;
    }
  };

  const createSummaryCard = summary => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: ${COLORS.SURFACE};
      border: 1px solid ${COLORS.BORDER};
      border-radius: var(--radius-md);
      padding: ${SPACING.MD};
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: ${SPACING.MD};
    `;

    const metrics = [
      { label: 'Total Goals', value: summary.totalGoals },
      { label: 'Active', value: summary.activeGoals },
      { label: 'Completed', value: summary.completedGoals },
      {
        label: 'Total Saved',
        value: new Intl.NumberFormat(userLocale || navigator.language || 'en-GB', {
          style: 'currency',
          currency: 'EUR',
        }).format(summary.totalSaved),
      },
      {
        label: 'Overall Progress',
        value: `${Math.round(summary.overallProgress)}%`,
      },
    ];

    metrics.forEach(metric => {
      const metricDiv = document.createElement('div');
      metricDiv.style.textAlign = 'center';

      const value = document.createElement('div');
      value.textContent = metric.value;
      value.style.fontSize = FONT_SIZES.LG;
      value.style.fontWeight = '600';
      value.style.color = COLORS.PRIMARY;

      const label = document.createElement('div');
      label.textContent = metric.label;
      label.style.fontSize = FONT_SIZES.SM;
      label.style.color = COLORS.TEXT_MUTED;

      metricDiv.appendChild(value);
      metricDiv.appendChild(label);
      card.appendChild(metricDiv);
    });

    return card;
  };

  const createRecommendationCard = recommendation => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: ${COLORS.SURFACE};
      border: 1px solid ${COLORS.BORDER};
      border-radius: var(--radius-md);
      padding: ${SPACING.MD};
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${SPACING.MD};
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
    description.style.fontSize = FONT_SIZES.SM;
    description.style.color = COLORS.TEXT_MUTED;
    description.style.marginTop = SPACING.XS;
    content.appendChild(description);

    const actionBtn = document.createElement('button');
    actionBtn.textContent = 'Create Goal';
    actionBtn.style.cssText = `
      background: ${COLORS.PRIMARY};
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      padding: ${SPACING.XS} ${SPACING.SM};
      font-size: ${FONT_SIZES.SM};
      cursor: pointer;
      white-space: nowrap;
    `;

    actionBtn.addEventListener('click', async () => {
      try {
        await createGoalFromRecommendation(recommendation);
      } catch (error) {
        console.error('[SavingsGoalsSection] Failed to create goal from recommendation:', error);
      }
    });

    card.appendChild(content);
    card.appendChild(actionBtn);

    return card;
  };

  const showAddGoalDialog = async () => {
    try {
      // Use MobilePrompt for better UX
      let goalName, targetAmount, category;

      // Get goal name
      await new Promise(resolve => {
        MobilePrompt({
          title: 'Add Savings Goal',
          message: 'Enter goal name:',
          placeholder: 'e.g., Emergency Fund',
          onSave: (value) => {
            goalName = value;
            resolve();
          },
          onCancel: () => {
            goalName = null;
            resolve();
          }
        });
      });

      if (!goalName) return;

      // Get target amount
      await new Promise(resolve => {
        MobilePrompt({
          title: 'Add Savings Goal',
          message: 'Enter target amount:',
          placeholder: 'e.g., 1000',
          initialValue: '',
          onSave: (value) => {
            targetAmount = parseFloat(value);
            resolve();
          },
          onCancel: () => {
            targetAmount = null;
            resolve();
          }
        });
      });

      if (!targetAmount || targetAmount <= 0) return;

      // Get category (optional)
      await new Promise(resolve => {
        MobilePrompt({
          title: 'Add Savings Goal',
          message: 'Enter category (optional):',
          placeholder: 'e.g., General',
          initialValue: 'General',
          onSave: (value) => {
            category = value || 'General';
            resolve();
          },
          onCancel: () => {
            category = 'General';
            resolve();
          }
        });
      });

      const newGoal = {
        id: Date.now().toString(),
        name: goalName,
        target: targetAmount,
        category,
        createdDate: new Date().toISOString(),
        targetDate: null, // Could add target date selection
      };

      await SavingsGoalsService.saveSavingsGoal(newGoal);
      await render();
    } catch (error) {
      console.error('[SavingsGoalsSection] Failed to add new goal:', error);
    }
  };

  const showGoalDetails = goal => {
    // Show detailed goal information
    const details = `
Goal: ${goal.name}
Target: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(goal.target)}
Current: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(goal.progress.currentAmount)}
Progress: ${Math.round(goal.progress.percentage)}%
Remaining: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(goal.progress.remaining)}
    `;
    MobileAlert({
      title: 'Goal Details',
      message: details,
      buttonText: 'OK'
    });
  };

  const createGoalFromRecommendation = recommendation => {
    const newGoal = {
      id: Date.now().toString(),
      name: recommendation.title,
      target: recommendation.target || 1000, // Default target if none specified
      category: recommendation.category || 'General',
      createdDate: new Date().toISOString(),
      targetDate: null,
    };

    SavingsGoalsService.saveSavingsGoal(newGoal).then(() => {
      render();
    });
  };

  await render();

  return container;
};
