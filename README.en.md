**English** | [简体中文](./README.md)

# TwinFlow Studio

[![CI](https://github.com/hunterwalks/twinflow-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/hunterwalks/twinflow-studio/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/hunterwalks/twinflow-studio?sort=semver)](https://github.com/hunterwalks/twinflow-studio/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

> A local-first workbench for digital-twin data modeling and quality governance

TwinFlow Studio covers the early stage of a digital-twin project, entirely in the browser: import Excel / CSV, map fields, build the four-object model, validate, explore relationships, apply safe fixes, export a governance report, and compare projects. No backend, no API key — your work is restored automatically after a refresh.

**Current version: v1.5.3.** The single source of truth is `package.json`; `src/lib/version.ts`, the footer, and report metadata are kept in sync with it.

> **Maturity note.** This is an early-stage project maintained by a single maintainer. Adoption is still limited, so the strongest signals today are the deterministic rule engine, the test suite, CI, and the release history — not user counts.

## Who it is for

| Role | Question they bring | What they do here |
|---|---|---|
| Product manager | Can this dataset go straight into the project? | Import a sheet → read the quality score and severity breakdown → decide whether governance work is needed first |
| Solution owner | How do I produce a reportable, deliverable conclusion? | Validate → review the relationship graph → export the HTML / JSON report |
| Developer | I want to run it locally or extend it. | `npm ci && npm run dev`, then read [`CONTRIBUTING`](./.github/CONTRIBUTING.md) |

## Highlights

- **Four-object model** — Space / Asset / Sensor / Observation (site → equipment → point → measurement), matching how digital-twin assets are actually organized.
- **Browser-side import** — parses `.csv`, `.xlsx`, and `.xls`; multi-sheet switching, automatic field mapping with confidence hints.
- **24 deterministic rules** — completeness, uniqueness, references, hierarchy, coverage, and convention. Every issue is graded and traceable to a table / row / field.
- **Explainable quality score** — 0–100 with an A–E grade, aggregated across six dimensions with the main deductions called out.
- **Guided fixes** — for problems that can be inferred safely (blank values, over-length text, self-references, inconsistent units), a before→after preview with one-click apply.
- **Relationship graph** — React Flow visualization of hierarchy, references, and orphaned objects.
- **Governance report** — self-contained HTML plus a structured JSON export, generated in the browser.
- **Cross-project comparison** — scale, score, issue distribution, and most-triggered rules side by side against built-in samples.
- **Offline help** — a built-in `/help` page with quick start, data model, and FAQ; no network required.

## Quick start

Pick whichever of the three fits.

### 1. Use it online (zero install)

1. Open the [hosted version](https://hunterwalks.github.io/twinflow-studio/).
2. Click **从 Demo 开始** ("Start from the demo") to load the synthetic industrial-park dataset.
3. Walk through validate → relationship graph → export report → cross-project comparison.

### 2. No-install offline package (no Node.js)

Download the static web package from [Releases](https://github.com/hunterwalks/twinflow-studio/releases/latest) (named like `twinflow-studio-v1.5.3-web.zip`) and serve the extracted folder with any static server. It runs fully offline and never uploads data.

### 3. Run from source (for development)

Requires Node.js ≥ 18.18 (20+ recommended) and npm ≥ 9.

```bash
git clone https://github.com/hunterwalks/twinflow-studio.git
cd twinflow-studio
npm ci
npm run dev        # http://localhost:3000
```

Available scripts:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (not the static export) |
| `npm run start` | Serve a production build |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests (`npx playwright install chromium` first) |

CI status is the first badge above. To run all five gates locally in one go:

```bash
npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e
```

## Screenshots

Captured locally by `scripts/capture-screenshots.mjs` against the built-in synthetic data. Nothing leaves the browser.

![Home](screenshots/01-home.png)

| Validation | Relationship graph |
|---|---|
| ![Rule engine and issue traceability](screenshots/04-validate.png) | ![Object hierarchy and references](screenshots/05-graph.png) |

| Governance report | Model configuration |
|---|---|
| ![Exported HTML / JSON governance report](screenshots/06-report.png) | ![Four-object model and rule packages](screenshots/model.png) |

![Cross-project governance comparison](screenshots/compare.png)

## Repository layout

```
twinflow-studio/
├── .github/
│   ├── workflows/        # CI and GitHub Pages deployment
│   ├── ISSUE_TEMPLATE/   # Issue forms
│   ├── CONTRIBUTING.md   # Contribution guide (includes the AI-assistance policy)
│   ├── SECURITY.md       # Security policy and private disclosure
│   ├── CODE_OF_CONDUCT.md
│   └── pull_request_template.md
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # UI components
│   ├── lib/              # Rule engine, import, report, project, graph, quality score
│   └── test/             # Vitest unit tests
├── e2e/                  # Playwright end-to-end tests
├── scripts/              # Build and screenshot helpers
├── screenshots/          # Images used by the READMEs
├── README.md             # Chinese (default)
├── README.en.md          # English
├── CHANGELOG.md          # Full version history
├── PRIVACY.md            # Privacy and the local-first boundary
├── ROADMAP.md            # Roadmap
└── LICENSE               # MIT
```

## Privacy and local processing

- Everything happens in the browser: CSV / XLSX parsing, field mapping, validation, graph layout, fixes, and report export are all computed locally and are never sent to a business backend.
- The core engine is a set of deterministic pure functions. No API key is required for any feature.
- The current dataset is persisted to browser `localStorage` (key `twinflow-project-v1`) and restored on reload. To remove it, use "清空项目" on the graph page or clear site data in your browser.
- If `localStorage` is unavailable, a banner explains that the session will not survive a refresh; the app still works.
- See [PRIVACY.md](./PRIVACY.md) and the [security policy](./.github/SECURITY.md) for details.

## Contributing

Issues, pull requests, and discussion are all welcome. The development workflow, the AI-assistance policy, and the quality gates are documented in [CONTRIBUTING.md](./.github/CONTRIBUTING.md); please also read the [Code of Conduct](./.github/CODE_OF_CONDUCT.md). Report security vulnerabilities privately per the [security policy](./.github/SECURITY.md) rather than opening a public issue.

## Version history

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)
