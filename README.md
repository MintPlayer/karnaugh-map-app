# Karnaugh Map Solver

Interactive Boolean logic minimization tool using the Quine-McCluskey algorithm.

[![CI](https://github.com/MintPlayer/karnaugh-map-app/actions/workflows/ci.yml/badge.svg)](https://github.com/MintPlayer/karnaugh-map-app/actions/workflows/ci.yml)

## Features

- Interactive Karnaugh map editor (2-6 variables)
- Automatic Boolean expression minimization using Quine-McCluskey algorithm
- Sum of Products (SOP) and Product of Sums (POS) output
- Don't care conditions support
- Visual loop highlighting with interactive term selection
- Export/import state as JSON
- Dark mode support
- Keyboard navigation

## Quick Start

```bash
# Install dependencies
npm install

# Serve the Karnaugh Map demo application
npx nx serve karnaugh-demo

# Open http://localhost:4200 in your browser
```

## Published Libraries

This repository contains two publishable npm packages:

### @mintplayer/quine-mccluskey

Core algorithm library for Boolean function minimization using the Quine-McCluskey method.

```bash
npm install @mintplayer/quine-mccluskey
```

### @mintplayer/ng-karnaugh-map

Angular component library providing an interactive Karnaugh map UI.

```bash
npm install @mintplayer/ng-karnaugh-map
```

## Docker

The karnaugh-demo application is available as a Docker image on GitHub Container Registry.

### Pull and run the image

```bash
docker pull ghcr.io/mintplayer/karnaugh-map-app:main
docker run -p 8080:80 ghcr.io/mintplayer/karnaugh-map-app:main

# Open http://localhost:8080
```

### Build locally

```bash
docker build --tag karnaugh-demo .
docker run -p 8080:80 karnaugh-demo
```

## Development

### Project Structure

```
├── apps/
│   ├── karnaugh-demo/         - Karnaugh Map Solver application
│   ├── karnaugh-demo-e2e/     - E2E tests for karnaugh-demo
│   ├── shop/                  - Example e-commerce app (Angular SSR)
│   ├── shop-e2e/              - E2E tests for shop
│   └── api/                   - Example backend API
├── libs/
│   ├── mintplayer/
│   │   ├── ng-karnaugh-map/   - Angular Karnaugh map component library
│   │   └── quine-mccluskey/   - Quine-McCluskey algorithm library
│   ├── shop/                  - Shop feature libraries
│   ├── api/                   - API libraries
│   └── shared/                - Shared models
├── Dockerfile                 - Docker build for karnaugh-demo
└── nx.json                    - Nx workspace configuration
```

### Common Commands

```bash
# Development
npx nx serve karnaugh-demo              # Serve the app
npx nx build karnaugh-demo              # Build for production
npx nx test quine-mccluskey             # Run unit tests
npx nx lint ng-karnaugh-map             # Lint a library

# E2E Testing
npx playwright install chromium         # Install browser (first time)
npx nx e2e karnaugh-demo-e2e            # Run e2e tests

# Build all projects
npx nx run-many -t build

# Run all tests
npx nx run-many -t test

# Visualize project dependencies
npx nx graph
```

### E2E Testing

The karnaugh-demo application has Playwright e2e tests covering:

- Page title and layout
- Variable add/remove functionality
- Edit/Solve mode switching
- Solve functionality with result display
- UI component visibility

```bash
# Install Playwright browsers (required once)
npx playwright install chromium

# Run e2e tests
npx nx e2e karnaugh-demo-e2e

# Run e2e tests with UI
npx nx e2e karnaugh-demo-e2e -- --ui
```

### Building Libraries

```bash
# Build the Quine-McCluskey library
npx nx build quine-mccluskey

# Build the Angular Karnaugh map library
npx nx build ng-karnaugh-map

# Build outputs are in dist/libs/mintplayer/
```

### Release

The repository uses Nx Release for versioning and publishing:

```bash
# Release libraries
npx nx release
```

## CI/CD

### GitHub Actions Workflows

- **CI** (`ci.yml`) - Runs on PRs and main branch pushes
  - Linting, testing, building, type checking
  - E2E tests with Playwright

- **Publish** (`publish.yml`) - Runs on main branch pushes
  - Builds Docker image
  - Pushes to GitHub Container Registry
  - Generates build provenance attestation

## Technology Stack

- **Frontend**: Angular 21
- **Build System**: Nx 22
- **Testing**: Vitest (unit), Playwright (e2e)
- **Styling**: Bootstrap 5, SCSS
- **Container**: Docker with nginx

## Learn More

- [Nx Documentation](https://nx.dev)
- [Angular Documentation](https://angular.dev)
- [Quine-McCluskey Algorithm](https://en.wikipedia.org/wiki/Quine%E2%80%93McCluskey_algorithm)
- [Karnaugh Maps](https://en.wikipedia.org/wiki/Karnaugh_map)

## License

MIT
