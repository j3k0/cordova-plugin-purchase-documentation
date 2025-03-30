#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Function to check if markdown-pp is installed
check_markdown_pp() {
  if ! command -v markdown-pp &> /dev/null; then
    echo "Error: markdown-pp command not found." >&2
    echo "Please install it, e.g., using: npm install -g markdown-pp" >&2
    exit 1
  fi
  echo "Using markdown-pp version: $(markdown-pp --version)"
}

# Function to process a single .src.md file
process_file() {
  local src_file="$1"
  local output_file="${src_file%.src.md}.md"
  echo "Processing $src_file -> $output_file"
  # Use markdown-pp with options: -o output, source file
  markdown-pp -o "$output_file" "$src_file"
  if [ $? -ne 0 ]; then
    echo "Error processing $src_file" >&2
    exit 1
  fi
}

echo
echo "##############################"
echo "# Building Documentation...  #"
echo "##############################"
echo

if [ "$1" == "--help" ]; then
  echo "Usage: ./build.sh [--help]"
  echo
  echo "This script generates final .md files from .src.md source files"
  echo "in the ./use-cases directory using the markdown-pp preprocessor."
  echo "Ensure markdown-pp is installed ('npm install -g markdown-pp')."
  echo
  exit 0
fi

# Check dependencies
check_markdown_pp

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
USE_CASES_DIR="$SCRIPT_DIR/use-cases"

# Navigate to the use-cases directory
cd "$USE_CASES_DIR" || { echo "Error: Failed to enter use-cases directory: $USE_CASES_DIR" >&2; exit 1; }

# Find and process all .src.md files in the current directory
echo "Processing all *.src.md files in use-cases/sections directory..."
cd sections
find . -name '*.src.md' -print0 | while IFS= read -r -d $'\0' src_file; do
  # Remove './' prefix if present
  src_file_cleaned="${src_file#./}"
  process_file "$src_file_cleaned"
done
cd ..

find . -maxdepth 1 -name '*.src.md' -print0 | while IFS= read -r -d $'\0' src_file; do
  # Remove './' prefix if present
  src_file_cleaned="${src_file#./}"
  process_file "$src_file_cleaned"
done

# Return to the original directory
cd "$SCRIPT_DIR" || exit 1

echo
echo "#####################"
echo "# Build Complete!   #"
echo "#####################"
echo
