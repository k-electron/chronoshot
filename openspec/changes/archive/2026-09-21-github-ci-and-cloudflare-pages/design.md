# Design: GitHub Free CI and Cloudflare Pages Hosting

## Context

ChronoShot is a pure client-side TypeScript game built with Vite and Vitest. It has zero runtime dependencies, builds entirely to static assets in `dist/`, and requires no server-side execution. Currently, there is no automated CI pipeline in GitHub and no deployment configuration for web hosting. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Provide a fast (<30s), zero-cost GitHub Actions CI workflow triggered on PRs, pushes to `main`, and manual dispatch.
- Enforce Node 26 runtime alignment across local development, GitHub CI, and Cloudflare Pages.
- Configure production asset delivery on Cloudflare Pages using native `_headers` (immutable cache for hashed chunks, security headers) and `_redirects` (SPA fallback).
- Add favicon and social preview meta tags to `index.html` to eliminate 404s and improve link presentation.

**Non-Goals:**
- Direct Wrangler API deployment from GitHub Actions (Choice A / Git integration is selected to avoid secret management).
- Changes to in-game simulation loop, rendering, or audio engine.
- Adding linters or formatters outside the existing TypeScript and Vitest toolchain.

## Decisions

### 1. Node 26 Runtime Pinning
- **Choice**: Add `.nvmrc` containing `26`, and configure `actions/setup-node@v4` with `node-version-file: '.nvmrc'`.
- **Rationale**: Keeps local dev, GitHub Actions runner, and Cloudflare Pages build environment aligned on Node 26 without manual version drift.
- **Alternative Considered**: Hardcoding `node-version: 26` only in `ci.yml`. Rejected because Cloudflare Pages also uses `.nvmrc` to auto-detect Node versions.

### 2. Cloudflare Git Integration (Option A)
- **Choice**: Use Cloudflare Pages' native GitHub integration for building and deploying.
- **Rationale**: Zero GitHub secrets to manage, automated preview URLs on pull requests, and instant rollbacks via Cloudflare's dashboard. GitHub Actions acts strictly as the CI quality gate.
- **Alternative Considered**: Deploying directly via Wrangler in GitHub Actions. Requires storing API tokens in GitHub secrets and writing deployment scripts.

### 3. Edge HTTP Headers via `public/_headers`
- **Choice**: Place `_headers` and `_redirects` in `public/`.
- **Rationale**: Vite copies files in `public/` directly to `dist/` during build. Cloudflare Pages natively parses `_headers` and `_redirects` at the edge to set response headers and routing rules.
- **Rules**:
  - `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (safe because Vite includes content hashes).
  - `/*`: Security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).
  - `/* /index.html 200`: Ensures SPA client reloads never return 404.

### 4. CI Workflow Structure & Concurrency
- **Choice**: Single-job pipeline (`test-and-build`) on `ubuntu-latest` with `concurrency: cancel-in-progress`.
- **Rationale**: Combines `npm ci`, `npm test`, and `npm run build` in ~25 seconds. Parallelizing separate jobs for test and build would add runner boot overhead with no practical speedup. Concurrency cancelation saves GitHub Action minutes.

## Risks / Trade-offs

- **[Risk] Cloudflare Pages default build environment may use an older Node LTS**  
  → **Mitigation**: Commit `.nvmrc` and document setting the `NODE_VERSION: 26` environment variable in the Cloudflare Pages dashboard project settings.

- **[Risk] Missing favicon causes console 404 noise**  
  → **Mitigation**: Provide `public/favicon.svg` and link it in `index.html`.

## Migration Plan

1. Create `.nvmrc` and `.github/workflows/ci.yml`.
2. Create `public/_headers`, `public/_redirects`, and `public/favicon.svg`.
3. Update `index.html` with favicon link and Open Graph metadata.
4. Verify tests and build pass locally.
5. Push to GitHub and verify the Actions workflow passes.
6. Connect the repository in Cloudflare Pages dashboard (Build command: `npm run build`, Output directory: `dist`, Environment: `NODE_VERSION=26`).
