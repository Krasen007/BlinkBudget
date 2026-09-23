/**
 * Key Takeaways
 * Extracted from InsightsSection.js to maintain file size constraints (<500 lines)
 *
 * A compact feed of the most important textual insights for the selected
 * month, reusing InsightsGenerator + InsightCard (the same engine Reports
 * uses) so the charts always come with a plain-language takeaway.
 */

import { InsightCard } from '../../components/InsightCard.js';
import { InsightsGenerator } from '../../core/insights-generator.js';

/** Sort rank: high severity first, then medium, then low. */
const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

/**
 * Build a time period for a month relative to the shared month offset.
 * @param {number} offset - Months relative to the current month
 * @returns {{ startDate: Date, endDate: Date, label: string }}
 */
function getMonthPeriod(offset) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const startDate = new Date(target.getFullYear(), target.getMonth(), 1);
  const endDate = new Date(target.getFullYear(), target.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  return {
    startDate,
    endDate,
    label: target.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  };
}

/**
 * Create the Key Takeaways card
 * @param {Object} planningData - Financial planning data (transactions)
 * @param {Object} sharedMonthState - Shared month navigation state
 * @returns {{ element: HTMLElement, render: Function }}
 */
export function createTakeawaysSection(planningData, sharedMonthState) {
  const container = document.createElement('div');
  container.className = 'card insights-card insights-takeaways';

  // Header — title + selected month label
  const header = document.createElement('div');
  header.className = 'insights-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'insights-card-title-group';

  const title = document.createElement('h3');
  title.className = 'insights-card-title';
  title.textContent = 'Key Takeaways';

  const subtitle = document.createElement('p');
  subtitle.className = 'insights-card-subtitle';

  titleGroup.appendChild(title);
  titleGroup.appendChild(subtitle);
  header.appendChild(titleGroup);
  container.appendChild(header);

  const list = document.createElement('div');
  list.className = 'insights-takeaways-list';
  container.appendChild(list);

  function render() {
    const offset = Number(sharedMonthState?.offset) || 0;
    const currentPeriod = getMonthPeriod(offset);
    const previousPeriod = getMonthPeriod(offset - 1);
    subtitle.textContent = currentPeriod.label;

    const insights = InsightsGenerator.generateSpendingInsights(
      planningData?.transactions || [],
      currentPeriod,
      previousPeriod
    )
      // Budget statuses always describe the live month — hide them while
      // browsing history so takeaways never contradict the selected month.
      .filter(insight => offset === 0 || !insight.id.startsWith('budget_'))
      .sort(
        (a, b) =>
          (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3) ||
          Number(Boolean(b.actionable)) - Number(Boolean(a.actionable))
      )
      .slice(0, 3);

    if (insights.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'insights-takeaways-empty';
      empty.textContent =
        'Not enough activity this month for takeaways yet — keep logging your expenses.';
      list.replaceChildren(empty);
      return;
    }

    list.replaceChildren(
      ...insights.map((insight, index) => InsightCard(insight, index))
    );
  }

  render();

  return { element: container, render };
}
