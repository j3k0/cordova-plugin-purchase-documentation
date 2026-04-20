# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GitBook-hosted documentation for the `cordova-plugin-purchase` plugin (v13+) — a unified JavaScript In-App Purchase API for Cordova, Capacitor, and Ionic apps (Apple App Store, Google Play, Braintree, and a built-in Test platform). `SUMMARY.md` is the GitBook table of contents.

## Build

```bash
npm install -g markdown-pp   # one-time: required build tool
./build.sh                   # preprocesses src/**/*.src.md -> final .md files
```

`build.sh` runs `markdown-pp` from each source file's directory (so `!INCLUDE` paths resolve relatively), then `rsync`s `src/use-cases/code/` → `use-cases/code/`.

## Source vs generated — DO NOT edit generated files

Authoritative content lives under `src/`. Files in `use-cases/`, `setup/`, `discover/`, and `doc/` are *generated* from matching `src/**/*.src.md` files by `build.sh` and will be overwritten.

| Edit here | Generated output |
|-----------|------------------|
| `src/<area>/foo.src.md` (depth ≤ 2) | `<area>/foo.md` |
| `src/use-cases/code/*.js` | rsynced to `use-cases/code/` |

Shared snippets live in `src/use-cases/sections/` and `src/setup/sections/` and are pulled into page sources via `!INCLUDE "./sections/name.src.md"`. They don't produce standalone output (build.sh uses `-maxdepth 2`).

Root-level files (`README.md`, `introduction.md`, `SUMMARY.md`, `CONTRIBUTING.md`) are edited directly — they have no `.src.md` counterparts.

## Commit workflow

When changing documentation: edit the `.src.md` source, run `./build.sh`, then commit **both** the source and the regenerated `.md` output in the same commit.

## Graph utilities

`generate_include_graph.sh` and `generate_links_graph.sh` emit Mermaid diagrams (`include_graph.mmd`, `links_graph.mmd`, both gitignored) that highlight broken `!INCLUDE` targets or dead internal links in red. Both accept `-f <path>` to focus on a subtree — useful when diagnosing cross-file issues.

## Roadmap

`ROADMAP.md` tracks the documentation review initiative — 6 epics to bring docs to parity with plugin v13.15. Epic details live in `docs/epics/`. Both are gitignored (not part of the published site).

## Lessons

Project-specific lessons learned are stored as short notes in `./lessons/` (create on first use). Add one when something non-obvious bites (build quirks, GitBook rendering surprises, markdown-pp edge cases) so future sessions don't repeat the discovery.
