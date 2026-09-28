# Proposal

## Why

When visitors land on ChronoShot's repository, they are presented with technical badges and a 23-line static ASCII mock UI diagram. While the text explains that "time moves only when you move," a static diagram cannot show the fluid contrast between stationary 5% micro-creep and full-speed WASD dodging, laser charging, or bullet evasion. Furthermore, the link to the live playable deployment (`https://chronoshot.pages.dev`) is obscured—the top Cloudflare badge mistakenly points to Cloudflare's generic homepage, and there is no prominent call-to-action button above the fold. 

Providing a high-impact animated gameplay preview alongside prominent, direct "Play Now" links will instantly hook players and lower friction to zero.

## What Changes

- **Automated Gameplay Capture Pipeline**:
  - Script a deterministic headless browser scenario running Room 04 ("The Line of Fire") to showcase core mechanics:
    - Standing still in 5% micro-creep while the Marksman Sniper charges its lethal red targeting laser.
    - Accelerating with WASD to sprint behind bunker cover before the laser discharges.
    - Flanking out, aiming the 360° reticle, and firing a precision shot that shatters the hostile into glowing particles.
  - Compile the captured frames into an optimized, high-contrast animated GIF (`docs/assets/gameplay-preview.gif`, ~800px width, target < 3 MB).
- **Hero Visual & Dual Play CTA in `README.md`**:
  - Remove the 23-line static ASCII mock UI box from the top of the README.
  - Embed `docs/assets/gameplay-preview.gif` wrapped inside a clickable link to `https://chronoshot.pages.dev/`.
  - Add a large, high-visibility `▶ PLAY NOW` button badge directly below the image linking to `https://chronoshot.pages.dev/`.
  - Update the Cloudflare Pages badge in the top badge cluster to link directly to `https://chronoshot.pages.dev` instead of `https://pages.cloudflare.com/`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This change focuses on repository presentation, visual documentation, media assets, and capture tooling; gameplay capability specs remain unchanged (`skip_specs: true`).

## Impact

- **Documentation**:
  - `README.md`: Header section streamlined, ASCII diagram removed, hero animated visual and dual play CTAs added.
- **Assets**:
  - `docs/assets/gameplay-preview.gif`: New animated preview asset.
- **Tooling / Scripts**:
  - Headless capture script/utility used to capture frames and encode the preview.
- **APIs & Dependencies**:
  - Zero breaking changes to game architecture, core simulation, or audio systems.
