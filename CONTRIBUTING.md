# Contributing to the Documentation

Thank you for considering contributing to the `cordova-plugin-purchase` documentation! Clear and accurate documentation is vital for the community.

## Editing Files

Please edit the **source markdown files** located under the `src/` directory, primarily:

*   **`src/use-cases/*.src.md`:** These are the main entry points for specific implementation guides (e.g., `subscription-appstore.src.md`). They use a preprocessor syntax to include shared content.
*   **`src/use-cases/sections/*.src.md`:** Reusable sections of documentation included within the `*.src.md` files (e.g., setup steps, platform-specific notes).
*   **`src/use-cases/code/*.js`:** JavaScript code examples included in the documentation. Keeping code in separate `.js` files helps with syntax checking and consistency.
*   **`src/setup/*.src.md`:** Setup and installation guides.
*   **`src/setup/sections/*.src.md`:** Reusable sections for setup guides.
*   **`src/discover/*.src.md`:** Conceptual guides explaining IAP technology, the plugin's approach, and best practices like receipt validation.
*   **`src/doc/*.src.md`:** Supporting documents like the migration guide and troubleshooting tips.
*   **Root files:** `README.md`, `SUMMARY.md` (Table of Contents), etc. — these are edited directly (they have no `.src.md` counterparts).

These source files are processed by [markdown-pp](https://github.com/mcforge/markdown-pp) (a Markdown preprocessor) to generate the final documentation files.

**Do NOT directly edit the `.md` files inside the `use-cases/`, `setup/`, `discover/`, or `doc/` directories (e.g., `use-cases/subscription-appstore.md`). These are generated files and your changes will be overwritten.**

The `!INCLUDE` directive is used within `.src.md` files to pull in content from the `sections/` and `code/` directories.

## Building the Documentation

Before committing your changes, you need to generate the final markdown files.

1.  **Install markdown-pp:** If you don't have it, install it globally:
    ```bash
    npm install -g markdown-pp
    ```
2.  **Run the build script:** From the root directory of the documentation repository, execute:
    ```bash
    ./build.sh
    ```
    This script will find all `*.src.md` files under `src/` and process them using `markdown-pp`, generating the corresponding `.md` output files in the top-level directories (`use-cases/`, `setup/`, `discover/`, `doc/`).

## Committing Changes

1.  Edit the relevant `src/**/*.src.md` or `src/**/code/*.js` files.
2.  Run `./build.sh` to generate the final `.md` files.
3.  **Commit ALL modified files**, including both the source files you edited (e.g., `*.src.md`) and the generated output files (e.g., `*.md`).
4.  Open a Pull Request with your proposed changes against the main repository: [https://github.com/j3k0/cordova-plugin-purchase-documentation](https://github.com/j3k0/cordova-plugin-purchase-documentation)

Thank you for helping improve the documentation!