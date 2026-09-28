# Proposal

## Why

The current `README.md` is 338 lines long and serves as an exhaustive catch-all document containing full enemy stat dumps (speeds, cadences, particle counts), 4-phase boss breakdown guides, a 20-room campaign walkthrough, engine collision proofs, an exhaustive 77-line file tree, and Cloudflare Dashboard deployment instructions. This makes the README bloated, spoils game progression, and duplicates information already tracked authoritatively in `openspec/specs/`, `AGENTS.md`, and `CONTRIBUTING.md`.

Visitors, players, and prospective developers need a concise, high-impact README that immediately explains what the game is, lets them play instantly, provides a quick reference for controls, outlines the tech stack, provides a 30-second quickstart, and links cleanly to deeper documentation.

## What Changes

- **Streamline Overview**: Focus on the core elevator pitch (tactical time-dilation mechanics meet top-down tactical shooter, 5% micro-creep, 30-tick anchored reload windows).
- **Remove Redundant Deep Mechanics**:
  - Remove granular enemy speed, weapon cadence, and bullet velocity dumps (already in `openspec/specs/combat-arena/spec.md`).
  - Remove multi-phase milestone boss breakdowns and Cataclysm Overload channel timings (already in `openspec/specs/boss-encounters/spec.md`).
  - Remove Minkowski swept-circle raycast and watchdog collision proofs (already in `AGENTS.md` and `openspec/specs/combat-arena/spec.md`).
  - Remove the 20-room campaign walkthrough spoiler list (already in `openspec/specs/procedural-levels/spec.md`).
  - Remove itemized upgrade stat formulas (already in `openspec/specs/roguelike-upgrades/spec.md`).
- **Retain & Highlight Core Play Experience**:
  - Keep the live demo badge and banner link to https://chronoshot.pages.dev/ with the animated gameplay preview GIF.
  - Keep the compact, clear keyboard/mouse controls table.
- **Terse Tech Stack & Engine Architecture**:
  - Summarize the zero-engine architecture (TypeScript 5.4+, Vite, HTML5 Canvas 2D, Web Audio API, deterministic 60 Hz physics).
  - Retain the clean 4-box ASCII architecture pipeline diagram (Browser Input -> Time Governor -> Fixed-Step Simulator -> Canvas 2D Renderer).
- **Streamline Quickstart**:
  - Keep essential clone, install, dev, and test commands (`npm run dev`, `npm test`).
  - Move step-by-step Cloudflare Dashboard setup instructions to `CONTRIBUTING.md` / deployment docs.
- **Replace 77-Line File Tree**:
  - Remove the monolithic file-by-file tree.
- **Link to Authoritative Docs**:
  - Provide direct markdown links to `openspec/specs/` (system capabilities), `AGENTS.md` (engine internals & AI workflows), and `CONTRIBUTING.md` (development & PR workflows).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None (pure documentation change; `skip_specs: true` enabled in `.openspec.yaml`).

## Impact

- `README.md`: Reduced by ~70–75% (from 338 lines to ~80–90 lines) for readability and maintainability.
- `CONTRIBUTING.md`: Minor touch-up to absorb any relevant deployment notes if needed.
- No impact on gameplay, simulation, rendering, tests, or APIs.
