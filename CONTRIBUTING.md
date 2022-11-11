# Edit files

Edit the files named `use-cases/*.src.md`, `use-cases/sections/*` and `discovery` directories. Those markdown files are digested by [mardown-pp](https://github.com/amyreese/markdown-pp), a markdown preprocessor. This allows including files to compile into a single use case, without repeating too much of the same.

- `use-cases/*.src.md` are the entrypoint for the various documented use cases.
- `use-cases/sections` are sections potentially repeated in various use cases.
- `use-cases/code` are code example. Having them in separate files allows code completion (and validation), which minimize risks of typo.

# Build and Commit

To generate the final files, run `./build.sh`. Make sure you have markdown-pp installed on your computer.

This will generate `use-cases/*.md` files for each `.src.md file`.

Then you can open a PR with your proposed changes here: https://github.com/j3k0/cordova-plugin-purchase-documentation
