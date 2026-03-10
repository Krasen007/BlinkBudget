# BlinkBudget Master Development Task List
## Intelligence & Retention Layer Implementation

**Project Goal:** Transform BlinkBudget from a passive logger to an active financial co-pilot while maintaining 3-click speed and 100kb PWA budget.

---

## 🎯 Core Strategic Priorities

### 1. Retention Foundation (Highest Priority)
**Problem:** Users abandon app after missing 2-3 days of logging  
**Solution:** Smart Catch-up workflow to reduce return friction

### 2. Predictive Intelligence (Core Value)  
**Problem:** Users log data but don't understand future impact
**Solution:** Real-time "Safe to Spend" forecasting

### 3. Technical Foundations (Enablers)
**Problem:** Need privacy-first, high-performance architecture
**Solution:** Local calculations with Web Workers + IndexedDB

---

## 📋 Sprint 1: Intelligence & Retention (2 Weeks)

### Phase A: Retention Foundation (Days 1-4)

#### ST-05: Catch-up Detection (48h) - **HIGH PRIORITY**
**Owner:** Full Stack Developer  
**Effort:** 2 days  
**Acceptance Criteria:**
- [ ] System triggers "Catch-up Mode" on app launch if last log >48hrs
- [ ] UI changes to focus exclusively on missing days
- [ ] `last_login` timestamp stored in LocalStorage
- [ ] Anonymous telemetry: "Catch-up_Triggered" event logged

**Technical Implementation:**
```javascript
// Service: CatchUpService
- detectGaps() -> boolean
- triggerCatchUpMode() -> void
- getLastLoginTimestamp() -> timestamp
```

#### ST-07: 3-Tap Catch-up Flow - **HIGH PRIORITY**
**Owner:** Full Stack Developer + UX Designer  
**Effort:** 2 days  
**Acceptance Criteria:**
- [ ] Tap 1: Select "Quick Estimate"
- [ ] Tap 2: Confirm amount  
- [ ] Tap 3: Close/Finish
- [ ] Total workflow <5 seconds
- [ ] Telemetry: "Catch-up_Completed" vs "Catch-up_Dismissed"

**UI Components Needed:**
- `CatchUpModal` - Main catch-up interface
- `QuickEstimateButton` - Primary action button
- `ConfirmationScreen` - Final step

#### ST-06: Bulk Estimate Option - **MEDIUM PRIORITY**
**Owner:** Full Stack Developer  
**Effort:** 1 day  
**Acceptance Criteria:**
- [ ] Prompt: "Estimate spending for [Date range]?"
- [ ] Single-click entry using historical average
- [ ] Label entries as "Estimated" for filtering
- [ ] Apply to multiple missed days

---

### Phase B: Prediction Engine (Days 5-10)

#### ST-01: Real-time Balance Projection - **HIGH PRIORITY**
**Owner:** Full Stack Developer  
**Effort:** 3 days  
**Acceptance Criteria:**
- [ ] Forecast updates <100ms after transaction save
- [ ] Displays "Safe to Spend" daily average for remaining days
- [ ] Logic runs client-side via Web Worker
- [ ] Available in Offline Mode

**Technical Architecture:**
```javascript
// Web Worker: ForecastWorker.js
- calculateSafeToSpend(transactions, dateRange) -> number
- generate30DayProjection(transactions) -> array
- useHistoricalBaseline(transactions, mode) -> number
```

#### ST-04: Client-side/Local Calculation - **HIGH PRIORITY**
**Owner:** Full Stack Developer  
**Effort:** 2 days  
**Acceptance Criteria:**
- [ ] IndexedDB used for historical trend caching
- [ ] No plain-text financial projections in Firebase payloads
- [ ] Forecast available offline
- [ ] Bundle size impact <10kb

**Technical Implementation:**
```javascript
// Service: LocalCalculationService  
- cacheHistoricalData(transactions) -> void
- getProjectionFromCache() -> object
- syncWithFirebase() -> Promise<void>
```

---

### Phase C: Insight & Infrastructure (Days 11-14)

#### ST-02: Future-cast Sparkline - **LOW-MEDIUM PRIORITY**
**Owner:** UX Designer + Full Stack Developer  
**Effort:** 2 days  
**Acceptance Criteria:**
- [ ] Uses neutral/blue tones (no red/green)
- [ ] Sparkline fits within 3-click UI flow
- [ ] Graph reflects current transaction's impact on slope
- [ ] SVG-native implementation (no D3.js)

**UI Components:**
- `SparklineChart` - Lightweight SVG component
- `TrendIndicator` - Visual direction indicator

#### ST-10: Catch-up Telemetry - **MEDIUM PRIORITY**
**Owner:** Full Stack Developer  
**Effort:** 1 day  
**Acceptance Criteria:**
- [ ] Anonymous cohort ID attached to events
- [ ] Track retention metrics for Alpha testers
- [ ] Dashboard for 15% increase validation
- [ ] Privacy-compliant data collection

---

## 🏗️ Technical Architecture Requirements

### Performance Constraints
- **Bundle Size:** Must stay <100kb total
- **Calculation Speed:** <100ms for forecasts
- **UI Response:** <200ms from 3rd click to success screen
- **Offline Support:** Full functionality without network

### Privacy Requirements
- **Local Processing:** All predictive math on device
- **Encryption:** AES-256 for sync (ST-08)
- **Data Minimization:** Only final transactions in Firebase
- **Anonymous Telemetry:** No PII in analytics

### Technology Stack
- **Web Workers:** For forecasting calculations
- **IndexedDB:** Local historical data caching  
- **SVG:** Native charting (no heavy libraries)
- **Firebase:** Auth and sync only

---

## 📊 Success Metrics & Validation

### Primary KPIs
- **Retention:** 60% of week-1 users still logging in week-4
- **Speed:** Average "Time to Log" remains <5 seconds  
- **Engagement:** 40% of users tap "Future-cast" within 5 seconds
- **Conversion:** 5% of Alpha testers show "High Intent" to pay

### Alpha Testing Plan
- **Cohort Size:** 10 "Ex-Mint/YNAB" users
- **Test Duration:** 4 weeks
- **Data Collection:** Video recordings of 3-click flow in wild
- **Success Criteria:** 15% increase in return sessions vs control

---

## 🔄 Future Sprint Planning (Post-V1.1)

### Next Priority Features
- **ST-08:** Encrypted Sync (Premium) - 3 days
- **ST-09:** Value Wall (10-view trigger) - 2 days  
- **ST-03:** Floor vs Average Baseline - 1 day

### Technical Debt & Optimization
- Bundle size audit and optimization
- Performance regression testing
- Accessibility audit (Axe/Lighthouse)
- E2E test expansion

---

## 🚨 Critical Dependencies & Blockers

### Design Dependencies
- UX Designer must provide Figma specs for:
  - Catch-up Modal (Day 1)
  - 3-tap flow interface (Day 2)  
  - Sparkline visual design (Day 8)

### Technical Dependencies  
- DevOps must configure:
  - Firebase project settings (Day 0)
  - CI/CD pipeline for bundle size monitoring (Day 0)
  - Staging environment matching production (Day 0)

### External Dependencies
- Alpha tester recruitment (Product Owner)
- Telemetry analytics setup (DevOps)
- Legal review for privacy policy (Technical Writer)

---

## 📝 Development Guidelines

### Code Quality Standards
- **Framework-less:** Maintain Vanilla JS approach
- **Modular Architecture:** Services + Components pattern
- **Performance First:** Monitor bundle size with every PR
- **Privacy by Design:** Default to local processing

### Testing Requirements
- **Unit Tests:** All new services >80% coverage
- **Integration Tests:** Web Worker communication
- **Manual QA:** 3-click flow validation on real devices
- **Performance:** Lighthouse score >95 maintained

### Git Workflow
- **Branch Strategy:** feature/ST-XX-name
- **PR Requirements:** Size impact analysis, test coverage
- **Merge Policy:** Squash and merge for clean history
- **Release Cadence:** Weekly deployments on Fridays

---

## 🎯 Sprint Definition of Done

A story is complete when:
- [ ] All acceptance criteria met
- [ ] Code reviewed and merged to main
- [ ] Unit tests passing (>80% coverage)
- [ ] Manual QA verified on real devices
- [ ] Bundle size impact documented
- [ ] Performance benchmarks met
- [ ] Telemetry events firing correctly
- [ ] Documentation updated

**Sprint Success Criteria:**
- [ ] User can return after 3 days and "Catch-up" in <5 seconds
- [ ] App displays "Safe to Spend" number immediately after entry
- [ ] PWA Lighthouse performance score >95
- [ ] Alpha tester telemetry data flowing correctly

---

*Last Updated: Sprint Planning - Intelligence & Retention Layer*
*Next Review: End of Sprint 1 (2 weeks)*
