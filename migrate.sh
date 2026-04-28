#!/bin/bash
set -e

# migrate.sh <input.md> <output-path-under-docs> [sidebar_position]
# Example: ./migrate.sh setup/setup-appstore.md setup/setup-appstore.md 3
#
# Takes a generated .md file (already expanded by markdown-pp),
# applies mechanical transforms, and writes to docs/.

INPUT="$1"
OUTPUT="docs/$2"
POSITION="${3:-1}"

if [ ! -f "$INPUT" ]; then
  echo "Error: $INPUT not found" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"

# Extract title from first heading (# or ##)
TITLE=$(grep -m1 '^#' "$INPUT" | sed 's/^#* //')

# Build front matter
{
  echo "---"
  echo "title: \"$TITLE\""
  echo "sidebar_position: $POSITION"
  echo "---"
  echo ""
} > "$OUTPUT"

# Skip the first heading line (title is now in front matter)
FIRST_HEADING_LINE=$(grep -n -m1 '^#' "$INPUT" | cut -d: -f1)
tail -n +"$((FIRST_HEADING_LINE + 1))" "$INPUT" | \
  sed -E 's/\{% hint style="([^"]+)"[^%]*%\}/:::\1/g' | \
  sed -E 's/\{% endhint[^%]*%\}/:::/g' | \
  sed -E 's|\.\./\.gitbook/assets/|/img/|g' | \
  sed -E 's|\.gitbook/assets/|/img/|g' >> "$OUTPUT"

echo "Migrated: $INPUT -> $OUTPUT"
