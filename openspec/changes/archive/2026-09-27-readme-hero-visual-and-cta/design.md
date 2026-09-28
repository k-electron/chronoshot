# Design

## Context

ChronoShot's codebase is an engine-less TypeScript application rendered to an HTML5 Canvas 2D context (`960x640` virtual coordinate system) with a 60 Hz physics loop driven by `FixedStepSimulator` and `TimeGovernor`. 

Visitors arriving at [`README.md`](../../README.md) currently see a 23-line static ASCII mock UI and a Cloudflare badge pointing to Cloudflare's marketing domain (`https://pages.cloudflare.com/`). The local development machine has Google Chrome installed (`/Applications/Google Chrome.app`) and Node 26, but does not have `ffmpeg` or ImageMagick installed.

See [proposal.md](proposal.md) for background and motivation.

## Goals / Non-Goals

**Goals:**
- Provide a completely automated, zero-manual-effort capture script that boots Room 04 ("The Line of Fire"), executes a choreographed tactical sequence, and outputs an optimized animated GIF to `docs/assets/gameplay-preview.gif`.
- Demonstrate the core time-dilation mechanic cleanly: stationary slow-motion micro-creep (5%) with Marksman laser telegraph $\to$ WASD evasion behind bunker cover $\to$ reticle aim and lethal firearm discharge.
- Optimize the GIF file size (< 3 MB, ~800px width, 20–25 fps) to ensure rapid loading on GitHub desktop and mobile.
- Overhaul the top section of `README.md`:
  - Remove the static 23-line ASCII mock UI.
  - Wrap the hero preview GIF in a clickable link to `https://chronoshot.pages.dev/`.
  - Place a large, high-contrast `▶ PLAY NOW` button badge directly beneath the preview.
  - Update the Cloudflare Pages badge in the top cluster to point to `https://chronoshot.pages.dev`.

**Non-Goals:**
- Changing game physics, weapon systems, or balance.
- Adding runtime dependencies to production `package.json` `dependencies`.
- Retaining or relocating the ASCII UI diagram (it will be fully removed).

## Decisions

### 1. Automated Headless Chrome Capture Pipeline

- **Choice**: Use a standalone Node.js automation script that spins up a local Vite dev instance, connects to headless Google Chrome via Chrome DevTools Protocol (CDP) / WebSocket or Puppeteer, steps through Room 04 with deterministic inputs, and captures canvas image buffers.
- **Rationale**: Completely autonomous (requires zero screen-recording tools or manual gameplay from the user), reproducible, and unaffected by screen resolution or external window occlusion.
- **Alternatives Considered**:
  - *Manual OS screen capture*: Requires the user to record, trim, and compress the video manually. Rejected by user preference ("You do all the work to capture the snippet").
  - *CLI `ffmpeg`*: Not installed on the user's system. Using a pure JavaScript/Node encoder eliminates external system binary dependencies.

### 2. Scenario Choreography (Room 04: The Line of Fire)

- **Choice**: Choreograph a ~3.5–4.0 second loop in Room 04:
  1. **T = 0.0s – 1.2s (Micro-creep slow motion)**: Operative stands stationary. HUD indicates `CHRONO // 0.05x`. Marksman Sniper initiates red charging laser targeting lock. The targeting beam sweeps across the arena in crawling slow-motion.
  2. **T = 1.2s – 2.4s (WASD acceleration & cover evasion)**: Operative accelerates downwards using `KeyS`/`KeyD`. Time HUD surges to `CHRONO // 1.00x`. Operative ducks behind the bottom bunker obstacle right as the laser discharges harmlessly into the obstacle face.
  3. **T = 2.4s – 3.8s (Flank & precision elimination)**: Operative steps out from cover, 360° reticle aligns to the hostile, and revolver fires (+6 tick recoil burst). Bullet connects and shatters the hostile into glowing particles.
- **Rationale**: Tells a complete tactical story (patience, dynamic time surge, tactical cover, and precision combat) within a few seconds.

### 3. GIF Encoding & Palette Optimization

- **Choice**: Compile frames using a lightweight, pure JavaScript GIF encoder (such as `gifenc` or `omggif`) with octree/neuquant color quantization and Floyd-Steinberg dithering.
- **Target Metrics**:
  - Dimensions: ~800px width (scaled proportionally from 960x640).
  - Frame rate: 20–24 fps (sufficient for smooth perception while keeping byte weight low).
  - File size: < 3.0 MB.
  - Storage location: `docs/assets/gameplay-preview.gif`.

### 4. README Header Layout & CTA Placement

- **Choice**:
  - Replace the 23-line ASCII block at lines 14–36 with:
    1. Centered hero link with the animated GIF:
       ```markdown
       <p align="center">
         <a href="https://chronoshot.pages.dev/">
           <img src="docs/assets/gameplay-preview.gif" alt="ChronoShot Tactical Gameplay Demo" width="800" />
         </a>
       </p>
       ```
    2. Centered large Play Now badge:
       ```markdown
       <p align="center">
         <a href="https://chronoshot.pages.dev/">
           <img src="https://img.shields.io/badge/▶%20PLAY%20NOW-chronoshot.pages.dev-00f0ff?style=for-the-badge&logo=googlechrome&logoColor=black&labelColor=0a0e14" alt="Play Now on Cloudflare Pages" height="48" />
         </a>
         <br />
         <sub>⚡ Zero install required &bull; 60 Hz deterministic simulation &bull; Playable in any desktop browser</sub>
       </p>
       ```
    3. Update the badge in lines 5–10:
       Change `[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20with-Cloudflare%20Pages-F38020.svg?logo=cloudflare)](https://pages.cloudflare.com/)` to `[![Cloudflare Pages](https://img.shields.io/badge/Hosted%20on-Cloudflare%20Pages-F38020.svg?logo=cloudflare)](https://chronoshot.pages.dev)`.

## Risks / Trade-offs

- **[Risk: GIF file size balloons over 4MB]** → *Mitigation*: Cap recording duration to ~3.5 seconds, downscale resolution to 800px wide, and optimize palette to 128 or 256 colors.
- **[Risk: Headless Chrome Web Audio autoplay policy blocking]** → *Mitigation*: Run Chrome with `--autoplay-policy=no-user-gesture-required --mute-audio`; capture is purely visual so audio can be safely muted.
- **[Risk: High-DPI canvas backing scale causing frame capture dimension mismatch]** → *Mitigation*: Ensure browser viewport matches fixed 960x640 coordinate space or capture canvas directly via `.toDataURL()`.
