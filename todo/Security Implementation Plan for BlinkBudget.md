# Security Implementation Plan for BlinkBudget

**Last Updated**: August 9, 2026
**Version**: 2.0

## Introduction

This document outlines the current security posture of BlinkBudget and the roadmap for hardening it. It describes the implemented security controls, the remaining known gaps, and a prioritized plan to close them. It supersedes the April 7, 2026 version, which contained several outdated claims relative to the current codebase.

## Architecture & Threat Model

BlinkBudget is a mobile-first, vanilla JavaScript (ES6 Modules) + Vite application. Data is stored in **browser localStorage** (plain text) with **Firebase Authentication** and **Firestore** providing optional cloud sync.

### Runtime Modes

The app operates in two distinct modes, which materially changes the threat model:

1. **Local-only mode**: When no Firebase environment variables are configured, the app runs entirely offline with all data in localStorage. Auth and sync are disabled. This is the default when Firebase is not configured, and is handled gracefully by `config/app.config.js` and `src/core/auth-service.js`.
2. **Connected mode**: When Firebase is configured, users can authenticate and sync to Firestore. This adds cloud storage, realtime listeners, and a merge/conflict-resolution layer.

### Data Model

Stored localStorage keys (see `src/utils/constants.js`) and synced to Firestore under `users/{userId}/{key}/data`:

- `transactions` — expenses, income, transfers
- `accounts` — checking/savings/etc.
- `customCategories` — user-defined categories (incl. checkbox flag categories)
- `settings` — app preferences
- `investments` — portfolio positions
- `goals` — savings goals
- `budgets` — budget envelopes

### Cloud Sync Surface

`src/core/sync-service.js` implements:

- Offline-first **push** (debounced, rate-limited, with exponential backoff + jitter) and **pull**
- Realtime `onSnapshot` listeners per data type
- Per-item **Last-Write-Wins (LWW)** merge with conflict detection and user-driven resolution
- Connection monitoring and background sync on reconnect

This layer is the primary incremental security surface beyond the base app, and should be treated as such in reviews and testing.

## Implemented Security Controls

### 1. Input Sanitization & Validation

`src/utils/security-utils.js` provides and the app actively uses:

- **`sanitizeInput`** — strips HTML via `DOMParser` (with regex fallback) and enforces length limits. Wired into transaction forms (`src/utils/form-utils/submission.js`), account creation (`src/components/AccountSection.js`), and transaction tags (`src/utils/form-utils/transaction-tags.js`).
- **`escapeHtml`** — escapes dynamic values before `innerHTML` insertion in views (e.g. `src/views/SettingsView.js`, `src/views/FinancialPlanningView.js`, `src/utils/reports-charts.js`, `src/utils/reports-ui.js`).
- **`safeJsonParse`** — parses JSON while stripping `__proto__` / `constructor` / `prototype` keys to prevent **prototype pollution**. Used across all core services (storage, sync, settings, transactions, budgets, goals, investments, etc.).
- **`validatePasswordStrength`** — enforces min 8 chars with letter + number.
- **`validateEmail`** — basic email format check.

### 2. XSS Hardening

- All user-provided text is rendered via `textContent` or `escapeHtml()`; `innerHTML` is used only with static strings or escaped values.
- `src/core/lazy-loader.js` performs multi-layer sanitization (sanitize + DOM-based filtering + dangerous element removal) before injecting HTML.
- `src/core/emergency-export-service.js` sanitizes filenames and validates blob URLs before download.
- `src/views/financial-planning/GoalsSection.js` consciously uses safe DOM creation (`textContent`) instead of `innerHTML`.

### 3. Authentication

`src/core/auth-service.js`:

- Email/password, Google sign-in, and password reset via Firebase Auth
- **In-memory client-side rate limiting** (5 attempts / 15 min per email) as a defense-in-depth layer
- **`Object.freeze` on user objects** to prevent tampering
- **Sanitized error messages** returned to users (no raw Firebase error leak)
- **Local-only fallback** when Firebase is unavailable

### 4. Firebase Security Rules

`firestore.rules` enforces tenant isolation at the server level:

- `users/{userId}` — read/write only by the owning user
- `transactions`, `accounts`, `investments`, `goals`, `budgets` — create requires `userId == auth.uid`, and read/update/delete additionally require `userId` to be unchanged (prevents ownership reassignment)
- `settings/{userId}` — read/write only by the owning user
- **Deny-all default** for any unmatched path

These rules are stricter than the example in the prior version of this document (which omitted `investments`/`goals` and did not prevent `userId` mutation).

### 5. Transport Security & Headers

`netlify.toml` applies globally:

- `Content-Security-Policy` — scoped to self + Firebase/Google/Fonts origins
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HSTS with preload)
- `Permissions-Policy` (geolocation/mic/camera denied)
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- CORS restricted to `https://blinkbudget.netlify.app`
- HTTPS enforced via Netlify/Firebase

### 6. Environment & Configuration Validation

Two complementary validators:

- **`config/validate-env.cjs`** (build-time / CI) — checks required Firebase vars, rejects placeholders, validates format. Run via `yarn validate-env`.
- **`config/app.config.js`** (runtime) — validates on import, detects a full absence of Firebase vars to enable **local-only mode**, and shows a clear dev error on invalid config.

### 7. Data Integrity & Privacy

- `src/core/privacy-service.js` — PII handling / data minimization
- `src/core/emergency-export-service.js` — SHA-256 integrity checksums on exported data
- `src/core/data-integrity-service.js` and `src/core/data-cleanup-service.js` — integrity maintenance

### 8. Security Testing

- `tests/security/security-validation.test.js` — covers `sanitizeInput`, `validatePasswordStrength`, `validateEmail`, `safeJsonParse` (proto-pollution), `escapeHtml`
- `tests/security/test-data.js` — PII, financial, auth, XSS/SQLi payload fixtures
- `tests/privacy/privacy-validation-focused.test.js` — privacy validation
- `docs/security-testing-checklist.md` — OWASP Top 10 2021 checklist
- `docs/security-setup-guide.md` — setup instructions for headers, rules, env, tooling

## Known Gaps & Open Items

These are the genuinely remaining areas of work. The items listed under "Recommended Security Enhancements" in the previous version are now largely **implemented** and have been moved into the controls above.

### G1. ~~No Automated CI/CD Security Pipeline~~ ✅ Implemented

A `.github/` directory now provides the full CI/CD security pipeline:

- **`.github/workflows/ci.yml`** — GitHub Actions workflow with:
  - `security-audit` job: `yarn npm audit --all` (blocks on known vulnerabilities)
  - `quality` job: `yarn run check` (ESLint, Stylelint, Prettier, docs validation)
  - `unit-tests` job: full Vitest suite
  - `build` job: production build with output verification
  - `snyk` job: Snyk scan (`snyk test --severity-threshold=high`) with conditional `SNYK_TOKEN` check and Snyk Monitor on master pushes
- **`.github/dependabot.yml`** — weekly dependency updates (npm + GitHub Actions), security alerts, auto PRs
- **`package.json`** — `snyk` script: `snyk test --severity-threshold=high` for local/CI scanning

> **Note**: Dependabot security alerts and the Snyk CI runner require the repo owner to add the `SNYK_TOKEN` secret in GitHub repository settings for the Snyk job to run.

### G2. Stale `.snyk` Exclusions

The `.snyk` file previously referenced three test files that were deleted (`auth-penetration-simple.test.js`, `auth-penetration.test.js`, `comprehensive-security.test.js`). These have been removed. The remaining exclusions (`tests/security/test-data.js`, `tests/privacy/privacy-validation-focused.test.js`, `src/core/emergency-export-service.js`) should be re-verified periodically to confirm they still match real findings.

### G3. CSP Allows `unsafe-inline` / `unsafe-eval`

The current CSP includes `'unsafe-inline'` and `'unsafe-eval'` in `script-src`, required by Vite (dev) and Chart.js (eval). This weakens XSS mitigation. Document the rationale and work toward removal:

- [ ] Investigate removing `'unsafe-eval'` post-build (Chart.js may support a non-eval build)
- [ ] Consider a stricter production-only CSP than the shared dev/prod header

### G4. localStorage Plaintext

Data in localStorage is unencrypted by design (local-first, zero-dependency). This is an accepted tradeoff but should be explicit:

- [ ] Document the accepted risk in the README / privacy policy
- [ ] Note that a compromised XSS or a shared device exposes the data; input sanitization and CSP are the mitigations

### G5. Client-Side Rate Limiting Is Not Server-Enforced

The auth rate limiter is in-memory client-side only — it can be bypassed and does not persist across reloads. Firebase Auth has its own server-side throttling (e.g. `auth/too-many-requests`), which is the real control. Consider documenting this layering and whether Cloud Functions-based enforcement is warranted.

### G6. ~~Documentation Drift~~ ✅ Reconciled

The companion docs (`security-setup-guide.md`, `security-testing-checklist.md`) have been updated to reflect the newly implemented CI pipeline and Dependabot configuration. The claims about "Snyk Integration with GitHub" and "GitHub Dependabot — weekly updates" are now accurate.

## Recommended Roadmap

| Priority | Item                                                                 | Effort |
| -------- | -------------------------------------------------------------------- | ------ |
| ~~High~~ | ~~G1 — CI/CD pipeline~~ ✅ Done                                      | Medium |
| High     | G2 — Keep `.snyk` exclusions accurate (done; re-verify periodically) | Low    |
| Medium   | G3 — Tighten CSP (remove `unsafe-eval`, split prod CSP)              | Medium |
| Medium   | G4 — Document localStorage plaintext risk                            | Low    |
| Low      | G5 — Evaluate server-side rate limiting                              | Medium |
| ~~Low~~  | ~~G6 — Reconcile docs with implemented reality~~ ✅ Done             | Low    |

## Security Monitoring

- **Firebase Console**: authentication events, Firestore access patterns
- **Netlify Dashboard**: deployments, access logs, build status
- **Snyk Dashboard**: dependency scanning via CI (`SNYK_TOKEN` secret) and on-demand `yarn snyk`
- **GitHub Dependabot**: weekly dependency update PRs and security alerts (enabled via `.github/dependabot.yml`)
- **GitHub Actions**: CI status for audits, quality checks, tests, build, and Snyk scan

---

**Note**: This document reflects the current state of BlinkBudget security implementation as of August 9, 2026. Security is an ongoing process that requires regular review and updates.
