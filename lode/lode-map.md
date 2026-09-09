# Lode Map — Hierarchical Index

Session start: read [summary.md](summary.md) + [terminology.md](terminology.md) + this file. Then jump to the relevant domain.

```
lode/
├── summary.md                        # Living one-paragraph snapshot + quick facts
├── terminology.md                    # Domain language glossary
├── practices.md                      # Patterns & conventions (components, services, events, security, testing)
├── lode-map.md                       # ← this index
├── systemprompt.md                   # The Lode Coding method itself (owner-provided reference)
├── architecture/
│   ├── summary.md                    # Bootstrap order (main.js), module map, init contracts
│   └── routing-and-views.md          # Hash Router, routes table, guard, ViewManager, lazy loading
├── data/
│   ├── data-model.md                 # localStorage schema, STORAGE_KEYS, domain services, bridge
│   ├── sync.md                       # SyncService: debounce, push chains, conflicts, offline
│   └── authentication.md             # Firebase auth, localMode, auth_hint, rate limiting, error sanitization
├── ui/
│   ├── summary.md                    # Components/views inventory + conventions
│   └── styling.md                    # PostCSS pipeline, theming variables, purgecss safelist
├── product/
│   └── three-clicks.md               # One Theory, feature filter, privacy, anti-goals
├── plans/
│   ├── roadmap.md                    # Open TODOs (mirrors todo/ at repo root)
│   ├── ai-slop-report.md             # 23-finding audit of src/ transaction-flow files (Sep 2026)
│   └── ai-slop-guide.md              # 8-rule inspection guide + procedure for auditing new files
└── tmp/                              # git-ignored session scraps & handovers (never commit)
```

## Suggested reading by task

| Task                | Files                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Code quality / slop cleanup | [plans/ai-slop-guide.md](plans/ai-slop-guide.md) → [plans/ai-slop-report.md](plans/ai-slop-report.md) |
| New UI feature      | [practices.md](practices.md) → [ui/summary.md](ui/summary.md) → [ui/styling.md](ui/styling.md)                            |
| Data/storage change | [data/data-model.md](data/data-model.md) → [data/sync.md](data/sync.md)                                                   |
| Auth/routing change | [data/authentication.md](data/authentication.md) → [architecture/routing-and-views.md](architecture/routing-and-views.md) |
| Performance work    | [architecture/routing-and-views.md](architecture/routing-and-views.md) → [ui/styling.md](ui/styling.md)                   |
| Product decision    | [product/three-clicks.md](product/three-clicks.md) → [summary.md](summary.md)                                             |

## Non-lode docs (repo)

- `docs/prd.md` — product requirements (v1.22)
- `AGENTS.md` — agent persona, standards, boundaries
- `todo/` — owner's TODO list (mirrored in [plans/roadmap.md](plans/roadmap.md))
- `docs/security-setup-guide.md`, `docs/disaster-recovery-runbook.md`, `docs/documentation-validation.md` (enforced by `scripts/validate-docs.js` via `yarn run check`)

## Update rules

- Code changed → update the matching domain file **the same session** (current state, not changelog).
- Structure no longer mirrors `src/` → refactor the tree here first.
- Session scraps/handovers → `lode/tmp/` only.
