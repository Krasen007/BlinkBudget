# Goal Planning - Future Analysis Todo

## Current Status

- ✅ Core goal management exists (`GoalPlanner.js`)
- ✅ Basic UI exists (`GoalsSection.js`)
- ❌ No transaction-goal integration
- ❌ No automation features

## Actionable Tasks for Future Analysis

### Phase 1: Foundation Integration

- [ ] Add "Спестявания" (Savings) category to `constants.js`
- [ ] Extend transaction data model with `goalId` field
- [ ] Implement automatic goal progress updates in `TransactionService`
- [ ] Add unit tests for transaction-goal integration

### Phase 2: UI Components

- [ ] Create `GoalSelector` component for transaction forms
- [ ] Build `QuickGoalCreation` modal
- [ ] Integrate goal selector in transaction forms (Smart & Classic modes)
- [ ] Mobile optimization for goal selection workflow

### Phase 3: Advanced Features

- [ ] Add feasibility analysis UI to goal creation
- [ ] Implement progress projections chart
- [ ] Build "Apply Recent Savings" feature
- [ ] Create goal insights dashboard

### Phase 4: Intelligence Features

- [ ] Create `GoalIntelligence` service for pattern analysis
- [ ] Implement smart suggestions system
- [ ] Add unlinked savings detection
- [ ] Build automated goal adjustment recommendations

### Phase 5: Analytics & Insights

- [ ] Expand goal insights dashboard
- [ ] Add cohort analytics for goal completion
- [ ] Implement performance optimization
- [ ] Create user documentation and walkthroughs

## Risk Assessment Required

### Technical Risks

- [ ] Assess data consistency between transactions and goals
- [ ] Evaluate performance impact on large transaction histories
- [ ] Review mobile UX complexity implications

### User Experience Risks

- [ ] Evaluate if automation conflicts with 3-click philosophy
- [ ] Assess cognitive load for goal linking workflow
- [ ] Determine if features bloat the core expense tracking experience

## Success Metrics to Define

- [ ] Set target for % of savings transactions linked to goals
- [ ] Define acceptable performance benchmarks for goal updates
- [ ] Establish user engagement metrics for goal features

## Dependencies

- [ ] Review current transaction service architecture
- [ ] Analyze existing category system integration points
- [ ] Assess storage service capacity for new data relationships

## Implementation Decision Required

- [ ] Determine if full automation or minimal integration is appropriate
- [ ] Decide if goal features should remain manual-only
- [ ] Evaluate development priority vs core feature improvements
