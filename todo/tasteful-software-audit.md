# BlinkAudit: Tasteful Software Review of src/

**Rev 2 — 2026-08-26, after the subtraction pass.**
Rev 1's findings were executed the same day: 13 modules deleted, one home each for caching / toasts / anomaly detection / insights, data safety collapsed to two services, class layer replaced by a functional button factory, ClickTracker excised. Suite 48 files/414 tests green, build + ESLint clean — see git history.
Scope now: `src/` = 138 JS modules ≈ 1.47 MB unminified. This revision keeps only what is still true and still undone.

Audit baseline: `todo/tasteful-software-guide.md`.
Companion documents: `todo/findings.txt` (line-level bugs), `todo/design-implementation-plan.md` (UI fixes).

---

## Verdict

The core product — log an expense in 3 clicks, see where money went — is genuinely tasteful, and after subtraction the plumbing around it finally matches: single cache regime, single toast system, two data-safety services instead of five, no advice engine, no ghost framework.

What remains untasteful sits in three places: **two leftover duplicate subsystems**, a **dashboard doing Reports' job**, and **chronic hygiene debt** (oversized files, inline styles, console noise, CDN fonts). Grade card:

| Area | Grade | Note |
| --- | --- | --- |
| Critical path (add/edit/list) | A | Untouched by cleanup; still lean |
| Empty state & first run | B− | CTA exists; greeting bug unfixed; 3 empty-state implementations |
| Views (Reports/Dashboard size) | C− | Dashboard filter sprawl intact |
| Analytics/planning layer | B− | Advice engine gone; forecasting gated pending judgment call (§4) |
| Codebase hygiene | C | Inline styles, ~390 console statements, Google Fonts CDN |

---

## 1. What passes the taste test (protect these)

Do not subtract these while cleaning house:

- **The 3-click flow itself.** `AddView.js` is ~120 lines. Bottom nav has a dedicated ➕ item; `manifest.webmanifest` ships an OS-level "Add" shortcut. Amount input auto-focuses (with retry timers), Escape cancels, Enter submits. `TransactionForm.js` + extracted `form-utils/` remain "design by subtraction" done right.
- **Local-first with optional sync.** `storage.js` + `sync-service.js`, plus `config.localMode` for offline/dev.
- **Progressive unlock** (`ProgressiveEmptyState.js`, gated at 30/90 transactions): advanced features framed as the *payoff of the logging habit* — "The One Theory."
- **Tiny infrastructure primitives.** `router.js`, `view-manager.js`, `guard.js`. No framework, no ceremony.
- **Zero-dependency discipline.** Only Chart.js + Firebase at runtime.
- **Sane route strategy.** Dashboard/Add statically imported for instant launch; heavy views lazy-loaded and preloaded while idle.
- **Single homes (post-cleanup).** One cache (`AnalyticsCache` + invalidator hook), one toast util, one anomaly detector (`AnomalyService`, incl. transaction outliers), one insights module (`insights-generator.js`), one export/restore/recovery service (`backup-service.js`) beside one integrity checker.

---

## 2. Remaining violations

### V1 — Leftover duplicate subsystems

| Problem | Implementation A | Implementation B | Extra |
| --- | --- | --- | --- |
| Empty states | `utils/enhanced-empty-states.js` | `components/ProgressiveEmptyState.js` | third variant in `utils/reports-ui.js` |
| Budget planning | `core/budget-planner.js` (~70 lines) | `core/budget-service.js` (~140 lines, persistence + IDOR filter) | split purpose unclear |

Everything else from rev 1's table is resolved. These two pairs still double testing surface and confuse contributors; empty states are the worse externality since all three render to users.

### V2 — Dashboard scope creep (interaction surface)

`DashboardView.js` — now 1,121 lines — still carries **seven concurrent filter dimensions** (account, month, date-range, category, tag, type, multi-select/bulk-edit) plus anomaly cards, presets, and preload wiring inside the view file. The dashboard's theory should be: *this month at a glance + fastest path to Add.* Category/tag/type/date-range filtering belongs in Reports, which owns the time-period machinery already.

### V3 — Files violating the 500-line rule

Fourteen-plus offenders, worst today:
`ReportsView.js` 1379 · `DashboardView.js` 1121 · `InsightsSection.js` 1021 · `ChartRenderer.js` 971 · `TimePeriodSelector.js` 961 · `GoalsSection.js` 950 · `CustomCategoryManager.js` 854 · `data-integrity-service.js` 843 · `reports-charts.js` 802 · `custom-category-service.js` 790 · `TrendService.js` 715 · `lazy-loader.js` 701.
Newly-minted files hover just over the line too (`AnomalyService.js` ≈ 509) — acceptable short-term, but nothing enforces the ceiling yet, so it will erode again without lint.

### V4 — Execution hygiene

- **~390 console statements** in `src/` — many on hot paths (preload, sync, storage). Rev 1 badly understated this as "86"; corrected here. Quiet is part of the product promise ("works quietly").
- **Inline styles** still dominate major views (`AddView`, `TransactionForm`, InsightsSection, charts helpers) against the written standard; `design-implementation-plan.md` item 6 plans the migration but hasn't run.
- **Google Fonts CDN** in `index.html` violates *local first*, not just performance (already queued in todo.md).
- `main.js` hand-wires ~12 services plus a `window.mobileUtils` global — workable at this size, invisible coupling per addition.
