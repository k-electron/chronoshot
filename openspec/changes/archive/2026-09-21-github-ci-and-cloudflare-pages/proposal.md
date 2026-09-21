# Proposal: GitHub Free CI and Cloudflare Pages Hosting

## Why

ChronoShot currently lacks automated continuous integration to validate builds and tests on pull requests or pushes, and has no live production deployment pipeline. Establishing GitHub Actions Free CI and configuring the project for Cloudflare Pages will ensure continuous code quality and enable instant, zero-cost global edge web hosting.

## What Changes

- Add GitHub Actions CI workflow (`.github/workflows/ci.yml`) triggering on pushes to `main`, pull requests, and manual triggers, targeting Node 26 with dependency caching, build verification, and Vitest test execution.
- Add workflow concurrency control (`cancel-in-progress: true`) to terminate superseded runs and preserve CI minutes.
- Add `.nvmrc` pinned to Node `26` to align local, CI, and Cloudflare Pages build environments.
- Add `public/_headers` to enforce immutable long-term caching for hashed static assets (`/assets/*`) and essential security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- Add `public/_redirects` to route all fallback requests to `/index.html` with a 200 status for reliable SPA serving.
- Add a custom SVG favicon (`public/favicon.svg`) and update `index.html` with `<link rel="icon">` and Open Graph / Twitter social preview metadata.
- Document the Cloudflare Pages Git-integration setup in `README.md`.

## Capabilities

### New Capabilities
- None. This change focuses on repository infrastructure, automated testing, asset serving, and deployment configuration.

### Modified Capabilities
- None. In-engine simulation, combat mechanics, and audio systems remain unchanged (`skip_specs: true`).

## Impact

- **CI/CD**: Adds `.github/workflows/ci.yml`.
- **Runtime Environment**: Adds `.nvmrc` (Node 26).
- **Public Assets**: Adds `public/_headers`, `public/_redirects`, and `public/favicon.svg`.
- **HTML & Metadata**: Updates `index.html` with favicon link and Open Graph preview tags.
- **Dependencies**: No new npm dependencies required.
