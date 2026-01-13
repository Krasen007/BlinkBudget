import { OverviewSection } from './src/views/financial-planning/OverviewSection.js';

// Mock dependencies
const mockRiskAssessor = {
  assessEmergencyFundAdequacy: () => ({
    riskLevel: 'low',
    message: 'Emergency fund is adequate',
    status: 'adequate',
    recommendation: 'Your emergency fund is well-funded.',
  }),
  calculateOverallRiskScore: () => ({
    level: 'low',
    message: 'Low financial risk',
  }),
};

const mockPlanningData = {
  transactions: [
    { amount: 5000, type: 'income', timestamp: '2026-01-01T00:00:00Z' },
    { amount: -2000, type: 'expense', timestamp: '2026-01-02T00:00:00Z' },
    { amount: -1500, type: 'expense', timestamp: '2026-01-03T00:00:00Z' },
  ],
  accounts: [],
  investments: [],
  goals: [],
};

const section = OverviewSection(mockPlanningData, mockRiskAssessor);
console.log('Section HTML:', section.innerHTML);
console.log('Stats cards:', section.querySelectorAll('.stats-card').length);

const statsCards = section.querySelectorAll('.stats-card');
statsCards.forEach((card, index) => {
  console.log(`Card ${index}:`, card.textContent);
});
