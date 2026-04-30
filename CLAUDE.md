# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Docusaurus documentation site for the `cordova-plugin-purchase` plugin (v13+) — a unified JavaScript In-App Purchase API for Cordova, Capacitor, and Ionic apps (Apple App Store, Google Play, Braintree, and a built-in Test platform). Self-hosted at `purchase.cordova.fovea.cc`.

## Build

```bash
npm install        # install dependencies (Node 22+ required)
npm start          # local dev server with hot reload at localhost:3000
npm run build      # production build (output in build/)
docker build .     # production Docker image (node:22 + nginx)
```

Note: Local Node v25 is incompatible with Docusaurus. Use Node 22 (see `.nvmrc`) or build via Docker.

## Content

All documentation lives in `docs/`. Edit `.md` files directly — no preprocessor, no source/generated split.

| Directory | Content |
|-----------|---------|
| `docs/discover/` | Conceptual guides (IAP technology, plugin overview, receipt validation) |
| `docs/setup/` | Platform and framework setup (AppStore, Google Play, Capacitor, Braintree, StoreKit 2) |
| `docs/use-cases/` | Implementation guides by product type + advanced features |
| `docs/doc/` | Migration guide, troubleshooting, quick reference |
| `docs/code/` | Shared JS code snippets (imported into pages) |
| `static/img/` | Images |

## Configuration

| File | Purpose |
|------|---------|
| `docusaurus.config.js` | Site config (URL, navbar, footer, plugins, versioning) |
| `sidebars.js` | Navigation sidebar (replaces old SUMMARY.md) |
| `src/css/custom.css` | Theme color overrides |
| `Dockerfile` | Multi-stage build: node:22 → nginx |
| `nginx.conf` | SPA fallback, gzip, cache, legacy `.gitbook/assets/` redirect |

## Commit workflow

Edit content in `docs/`, verify the Docker build passes, commit.

## Versioning

Configured for v13. When v14 ships: `npx docusaurus docs:version 13` to snapshot, then edit `docs/` for v14 content.

## Roadmap

`ROADMAP.md` tracks the documentation review initiative. Epic details live in `docs/epics/`. Both are gitignored.

## Lessons

Project-specific lessons learned are stored as short notes in `./lessons/` (create on first use).
