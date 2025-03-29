#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Function to check if markdown-pp is installed
check_markdown_pp() {
  if ! command -v markdown-pp &> /dev/null; then
    echo "Error: markdown-pp command not found." >&2
    echo "Please install it, e.g., using: npm install -g markdown-pp" >&2
    exit 1
  fi
}

# Function to process a single .src.md file
process_file() {
  local src_file="$1"
  local output_file="${src_file%.src.md}.md"
  echo "Processing $src_file -> $output_file"
  markdown-pp -o "$output_file" "$src_file"
}

echo
echo "##############"
echo "# ./build.sh #"
echo "##############"
echo

if [ "$1" == "--help" ]; then
  echo "Usage: ./build.sh [--help]"
  echo
  echo "./build.sh will generate .md files from .src.md files in the ./use-cases directory."
  echo
  exit 0
fi

# Check dependencies
check_markdown_pp

# Navigate to the use-cases directory
cd use-cases || { echo "Error: Failed to enter use-cases directory." >&2; exit 1; }

# Find and process all .src.md files in the current directory
echo "Processing all *.src.md files in use-cases/ directory..."
find . -maxdepth 1 -name '*.src.md' -print0 | while IFS= read -r -d $'\0' src_file; do
  # Remove './' prefix if present
  src_file_cleaned="${src_file#./}"
  process_file "$src_file_cleaned"
done

echo
echo "#####################"
echo "# Build Complete! #"
echo "#####################"
echo
