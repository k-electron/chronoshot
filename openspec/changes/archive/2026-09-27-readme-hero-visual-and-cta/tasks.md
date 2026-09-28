# Tasks

## 1. Automated Gameplay Capture Pipeline

- [x] 1.1 Implement deterministic Room 04 capture script (`scripts/capture-preview.mjs` or TypeScript utility) using headless Chrome to load the game with simulated player inputs and canvas frame grabbing.
- [x] 1.2 Program the Room 04 tactical choreography: stationary 5% micro-creep with Marksman laser lock, WASD evasion behind bunker cover, and flank peek with firearm elimination.
- [x] 1.3 Compile captured canvas frames into `docs/assets/gameplay-preview.gif` using an optimized palette encoder; verify the GIF renders smoothly and file size is under 3 MB.

## 2. README Modernization & Dual CTA

- [x] 2.1 Remove the 23-line static ASCII mock UI block from lines 14–36 of `README.md`.
- [x] 2.2 Embed `docs/assets/gameplay-preview.gif` wrapped inside a hyperlink to `https://chronoshot.pages.dev/`.
- [x] 2.3 Add the prominent `▶ PLAY NOW` button badge directly below the preview GIF linking to `https://chronoshot.pages.dev/` with tactical subtext.
- [x] 2.4 Update the Cloudflare Pages badge in the top badge cluster of `README.md` to link directly to `https://chronoshot.pages.dev`.

## 3. Verification & Validation

- [x] 3.1 Execute `npm test` and `npm run build` to confirm all 740+ unit/integration tests and production TypeScript builds remain green.
- [x] 3.2 Validate the change artifacts against OpenSpec standards using `openspec validate readme-hero-visual-and-cta --strict`.
