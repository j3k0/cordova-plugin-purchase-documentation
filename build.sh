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

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
SRC_DIR="$SCRIPT_DIR/src"

# Function to process a single .src.md file
process_file() {
  local full_src_path="$1"
  # Directory containing the source file
  local src_file_dir
  src_file_dir=$(dirname "$full_src_path")
  # Basename of the source file (for markdown-pp input)
  local src_file_basename
  src_file_basename=$(basename "$full_src_path")

  # Calculate absolute output path
  local relative_src_path="${full_src_path#"$SCRIPT_DIR/"}"       # e.g., src/discover/about.src.md
  local output_path_relative_to_root="${relative_src_path#src/}" # e.g., discover/about.src.md
  local absolute_output_file="$SCRIPT_DIR/${output_path_relative_to_root%.src.md}.md" # e.g., /path/to/proj/discover/about.md

  # Absolute output directory (for mkdir)
  local absolute_output_dir
  absolute_output_dir=$(dirname "$absolute_output_file")

  echo "Processing (from $src_file_dir) $src_file_basename -> $absolute_output_file"

  # Create the absolute output directory if it doesn't exist
  mkdir -p "$absolute_output_dir"
  if [ $? -ne 0 ]; then
    echo "Error creating directory $absolute_output_dir" >&2
    exit 1
  fi

  # Change to source file's directory, run markdown-pp, change back
  pushd "$src_file_dir" > /dev/null
  # Use absolute output path and source file basename
  markdown-pp -o "$absolute_output_file" "$src_file_basename"
  local status=$?
  popd > /dev/null

  if [ $status -ne 0 ]; then
    echo "Error processing $full_src_path (markdown-pp failed)" >&2
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
  echo "found within the ./src directory using the markdown-pp preprocessor."
  echo "Output files are placed in corresponding directories outside ./src."
  echo "(e.g., src/doc/page.src.md -> doc/page.md)"
  echo "markdown-pp is run from the source file's directory to resolve includes relative to the file."
  echo "Ensure markdown-pp is installed ('npm install -g markdown-pp')."
  echo
  exit 0
fi

# Check dependencies
check_markdown_pp

# Check if src directory exists
if [ ! -d "$SRC_DIR" ]; then
  echo "Error: Source directory not found: $SRC_DIR" >&2
  exit 1
fi

# Find and process all .src.md files within the src directory
echo "Processing all *.src.md files in $SRC_DIR ..."
find "$SRC_DIR" -maxdepth 2 -type f -name '*.src.md' -print0 | while IFS= read -r -d $'\0' src_file; do
  process_file "$src_file"
done

rsync -r "$SRC_DIR/use-cases/code/" "$SCRIPT_DIR/use-cases/code"

echo
echo "#####################"
echo "# Build Complete!   #"
echo "#####################"
echo
