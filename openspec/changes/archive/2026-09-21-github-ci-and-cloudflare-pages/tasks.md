# Tasks

## 1. Environment & Edge Asset Configuration

- [x] 1.1 Create `.nvmrc` with Node `26` and verify content
- [x] 1.2 Create `public/_headers` (immutable cache for `/assets/*` and security headers) and `public/_redirects` (SPA fallback `/* /index.html 200`)
- [x] 1.3 Create `public/favicon.svg` with vector crosshair icon and update `index.html` to reference favicon and include Open Graph / Twitter meta tags

## 2. GitHub Actions CI Pipeline

- [x] 2.1 Create `.github/workflows/ci.yml` defining the test and build workflow under Node 26 with npm cache, PR/push triggers, and concurrency cancelation
- [x] 2.2 Verify production build (`npm run build`) bundles cleanly and copies `_headers`, `_redirects`, and `favicon.svg` into `dist/`

## 3. Documentation & Verification

- [x] 3.1 Update `README.md` with CI status info and Cloudflare Pages setup instructions (build command `npm run build`, output `dist`, `NODE_VERSION=26`)
- [x] 3.2 Run test suite (`npm test`) and validate change planning artifacts with `openspec validate "github-ci-and-cloudflare-pages"`
