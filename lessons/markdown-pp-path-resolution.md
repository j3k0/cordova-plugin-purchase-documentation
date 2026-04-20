markdown-pp resolves ALL include paths (including those in nested !INCLUDE'd files)
relative to the TOP-LEVEL source file's directory, NOT relative to the file containing
the directive.

So in `src/use-cases/sections/foo.src.md`, `!INCLUDECODE "./code/bar.js"` resolves
from `src/use-cases/` (where the top-level file lives), NOT from `src/use-cases/sections/`.

This means `./code/bar.js` → `src/use-cases/code/bar.js` (correct).
Not `../code/bar.js` → `src/use-cases/../code/` → `src/code/` (broken).

The graph utility scripts check paths relative to the containing file — they get this
wrong and flag false positives for code includes in sections/.
