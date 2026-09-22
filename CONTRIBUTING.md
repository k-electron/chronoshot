# Contributing to ChronoShot ⏱️💥

Thank you for your interest in contributing to **ChronoShot**! We welcome contributions ranging from bug fixes and documentation polish to new puzzle room layouts and tactical mechanics.

---

## 🚀 Development Setup

### Prerequisites
- **Node.js**: Node 26 (recommended via `.nvmrc`) or Node 18+
- **npm**: v9+
- **Git**

### Initial Setup
```bash
# 1. Clone your fork of the repository
git clone https://github.com/<your-username>/chronoshot.git
cd chronoshot

# 2. Use the pinned Node version (if using nvm)
nvm use

# 3. Install dependencies
npm install

# 4. Start local Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser. The Vite dev server supports Hot Module Replacement (HMR).

---

## 🛠️ Development Workflow

### Scripts
- `npm run dev`: Launch local Vite dev server.
- `npm test`: Run the Vitest test suite once.
- `npm run test:watch`: Run Vitest in continuous watch mode during development.
- `npm run build`: Typecheck with TypeScript compiler (`tsc`) and bundle production assets with Vite.
- `npm run preview`: Serve the built `dist/` directory locally.

---

## 📐 Code Style & Conventions

1. **TypeScript Standards**:
   - Write strict, fully typed TypeScript code. Avoid `any`.
   - Maintain outcome-based unit tests for all new modules in `src/**/*.test.ts`.
2. **Game Architecture Rules**:
   - Keep simulation logic deterministic inside fixed 60 Hz physics sub-steps.
   - Do not add external audio binaries (`.mp3`, `.wav`)—synthesize audio procedurally via `SoundSynthesizer`.
   - Use design tokens from `src/ui/theme.ts` for consistent colors and typography.
3. **Commit Messages**:
   - We follow [Conventional Commits](https://www.conventionalcommits.org/):
     - `feat: add new shotgun sniper enemy archetype`
     - `fix: prevent projectile clipping across pillar corner`
     - `docs: update controls table in README`
     - `test: add unit coverage for cylinder rotation`
     - `refactor: extract vector utility math`

---

## 📜 OpenSpec Specification Workflow

ChronoShot utilizes [OpenSpec](https://github.com/openspec/openspec) to maintain specification-driven integrity.

- **Capabilities**: Major systems are specified under `openspec/specs/` (`combat-arena`, `time-engine`, `weapon-system`).
- **Changes**: New features or architectural changes are planned and tracked under `openspec/changes/`.
- Verify your changes conform to the OpenSpec schema before opening a PR:
  ```bash
  openspec validate --strict
  ```

---

## 📤 Submitting a Pull Request

1. **Branch**: Create a descriptive feature branch:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. **Verify Locally**:
   Before submitting, ensure all checks pass:
   ```bash
   # Run tests
   npm test

   # Typecheck and build
   npm run build
   ```
3. **Open PR**: Push your branch to GitHub and submit a Pull Request targeting the `main` branch.
4. **CI & Preview**:
   - GitHub Actions CI (`.github/workflows/ci.yml`) will automatically validate compilation and test execution on Node 26.
   - Cloudflare Pages will generate an instant preview deployment to test your build in a live browser.

---

## 📄 License

By contributing to ChronoShot, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
