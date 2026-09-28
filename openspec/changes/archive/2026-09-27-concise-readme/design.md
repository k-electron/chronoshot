# Design: Concise README

## Context

See `proposal.md` for motivation.

The documentation currently has clear boundaries:
- `README.md`: Public storefront for visitors, players, and developers.
- `AGENTS.md`: Technical deep dive for AI agents and engine contributors (physics, collision math, rendering interpolation).
- `CONTRIBUTING.md`: Contributor workflow, commit standards, and deployment setup.
- `openspec/specs/`: Durable, formal capability specifications with testable scenarios.

The current `README.md` violates these boundaries by reproducing large portions of `openspec/specs/` and `AGENTS.md`.

## Goals / Non-Goals

**Goals:**
- Cut `README.md` from 338 lines down to ~80–90 lines (~75% reduction).
- Surface the live playable deployment (`https://chronoshot.pages.dev/`) and gameplay GIF front-and-center.
- Retain the compact keyboard/mouse controls table.
- Provide a terse, high-signal tech stack summary and retain the 4-box ASCII architecture pipeline.
- Provide a clean 4-command quickstart (`git clone`, `cd`, `npm install`, `npm run dev`) and test command.
- Relocate Cloudflare Pages dashboard setup instructions to `CONTRIBUTING.md`.
- Provide clean links to `openspec/specs/`, `AGENTS.md`, and `CONTRIBUTING.md`.

**Non-Goals:**
- Modifying engine code, game assets, or test files.
- Stripping deep technical details from the repository (they remain preserved in `AGENTS.md` and `openspec/specs/`).

## Decisions

### Decision 1: Retain 4-Box ASCII Architecture Diagram
- **Rationale**: An ASCII pipeline diagram (Input -> Time Governor -> Fixed-Step Simulator -> Canvas 2D) communicates the custom, engine-less architecture in 2 seconds without requiring paragraphs of text.
- **Alternative considered**: Removing architecture from README completely and linking to `AGENTS.md`. Rejected because prospective developers appreciate seeing the architectural paradigm immediately.

### Decision 2: Eliminate the 77-Line File Tree
- **Rationale**: Monolithic ASCII file trees are brittle, hard to read on mobile, and duplicate GitHub's native file navigator.
- **Alternative considered**: Collapsible `<details>` file tree or a 5-line summary. A 5-line summary or total removal is much cleaner; developers exploring code will use their IDE or GitHub file browser.

### Decision 3: Relocate Cloudflare Deployment Instructions
- **Rationale**: Step-by-step instructions on setting up a Cloudflare account and dashboard settings are irrelevant to players and open-source contributors cloning the repo.
- **Placement**: Move to a dedicated "Deployment" section in `CONTRIBUTING.md`, leaving only the deployment badge and URL in `README.md`.

### Decision 4: Structure of the Streamlined README
The final layout follows this sequence:
1. Title, Tagline, Badges (CI, Pages, License, TypeScript, Vite, Tests)
2. Gameplay Preview GIF & Play Now CTA
3. Overview (2 concise paragraphs: hook, core loop)
4. Controls Table
5. Tech Stack & Architecture (Terse bullets + ASCII pipeline)
6. Quickstart (Prerequisites, Run Dev, Run Tests)
7. Documentation Pointers (`openspec/specs/`, `AGENTS.md`, `CONTRIBUTING.md`)
8. License

## Risks / Trade-offs

- **[Risk]** Contributors looking for enemy stats or room layouts in README won't find them.
  - **Mitigation:** Explicitly link to `openspec/specs/` (`boss-encounters`, `combat-arena`, `procedural-levels`, etc.) in the Documentation section.
- **[Risk]** Cloudflare setup details might be lost if not cleanly relocated.
  - **Mitigation:** Add a brief "Deployment" subsection in `CONTRIBUTING.md` preserving the Cloudflare Pages build configuration.
