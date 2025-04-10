#!/usr/bin/env bash

# Script to generate a Mermaid link graph from specific Markdown files.
# Highlights broken internal links in red.
# Differentiates internal and external links (consolidated by domain).
# Optionally omits external links.

# --- Configuration ---
TARGET_DIRS=("use-cases" "doc" "setup") # Directories to scan
ROOT_FILES=("SUMMARY.md") # Specific files in the root
MERMAID_OUTPUT_FILE="links_graph.mmd" # Hardcoded output file

# --- Option Defaults ---
OMIT_EXTERNAL=0 # 0 = include external, 1 = omit external

# --- Option Parsing ---
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --omit-external) OMIT_EXTERNAL=1 ;;
        -h|--help)
            echo "Usage: $0 [--omit-external]"
            echo "  Generates a Mermaid graph of Markdown links."
            echo "  --omit-external: Exclude external web links from the graph."
            exit 0
            ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# --- Dependency Check ---
# On macOS with coreutils installed via Homebrew, use "grealpath".
# On Linux or if realpath is natively GNU-compatible, use "realpath".
if command -v /opt/homebrew/bin/grealpath &> /dev/null; then
    REALPATH_CMD="/opt/homebrew/bin/grealpath"
elif command -v /usr/local/bin/grealpath &> /dev/null; then
     REALPATH_CMD="/usr/local/bin/grealpath"
elif command -v realpath &> /dev/null; then
    REALPATH_CMD="realpath"
else
    echo "Error: Cannot find 'grealpath' (expected from coreutils) or 'realpath'." >&2
    echo "On macOS, try installing coreutils: brew install coreutils" >&2
    exit 1
fi


# --- Helper Functions ---

# Function to clean up temporary files on exit
cleanup() {
  rm -f "$TMP_NODE_MAP" # Still used for comments
}
trap cleanup EXIT INT TERM

# Associative Arrays - Declared globally
declare -A node_id_map           # Map lookup key (path/domain/placeholder) to simple ID
declare -A simple_id_used        # Track generated simple IDs to avoid collisions
declare -A node_id_to_path_map   # Map simple ID back to DISPLAY LABEL (domain or path)
declare -A node_type             # Map simple ID to type (file, external, broken_placeholder)
node_counter=0
TMP_NODE_MAP=$(mktemp)           # File to store the mapping for reference

# Function to sanitize node IDs for Mermaid (creating simple IDs)
# It ensures only one node per unique lookup_key (path, domain, or placeholder)
sanitize_and_store_id() {
    local original_key="$1" # This is the key we use to check if we've seen this node before (path, domain, or placeholder)
    local node_kind="$2" # 'file', 'external', or 'broken_placeholder'
    local display_label_source="$3" # What to use for the display label (path, domain, or placeholder)

    # Clean the key used for lookup and ID generation
    local lookup_key="$(printf '%s' "$original_key")"

    # Check if we already mapped this lookup key
    if [[ -v node_id_map["$lookup_key"] ]]; then
        # Node for this path/domain/placeholder already exists
        return
    fi

    # Determine display label - clean it too
    local display_label="$(printf '%s' "$display_label_source")"

    # Create a base ID based on the lookup_key
    local base_id
    if [[ "$node_kind" == "external" ]]; then
        # Base ID based on the lookup_key (domain name), sanitize it
         base_id="ext_domain_${lookup_key//[^a-zA-Z0-9_]/_}"
    elif [[ "$node_kind" == "broken_placeholder" ]]; then
        # Base ID for broken is unique anyway as placeholder contains source file
        # Sanitize the placeholder string for the ID base
        base_id="broken_${lookup_key//[^a-zA-Z0-9]/_}"
        # Ensure it's reasonably short if needed, though unlikely collision
        base_id=${base_id:0:50} # Limit length just in case
         # Add counter for absolute uniqueness for broken nodes
        base_id="${base_id}_$((node_counter++))"
    else # It's a file
        # Base ID based on the lookup_key (file path), sanitize it
        base_id="${lookup_key//[^a-zA-Z0-9]/_}"
    fi

    # Ensure base_id is valid Mermaid ID
    if [[ "$base_id" =~ ^[0-9] ]]; then
      base_id="node_$base_id"
    elif [[ -z "$base_id" ]]; then
       base_id="node_empty_$((node_counter++))"
    fi

    # Ensure uniqueness for the final generated ID ('id') across ALL nodes
    local id="$base_id"
    local suffix=1
    while [[ -v simple_id_used["$id"] ]]; do
        id="${base_id}_${suffix}"
        ((suffix++))
    done

    # --- Store the mapping in GLOBAL arrays ---
    node_id_map["$lookup_key"]="$id" # Map the lookup key (domain/path/placeholder) to the generated ID
    simple_id_used["$id"]=1
    node_id_to_path_map["$id"]="$display_label" # Map the generated ID to the desired display label
    node_type["$id"]="$node_kind"
    echo "$id == $display_label ($node_kind, lookup_key: $lookup_key)" >> "$TMP_NODE_MAP"
}


# --- Main Logic ---

echo "Scanning specific files/directories for Markdown links..."
echo "Target Dirs: ${TARGET_DIRS[*]}"
echo "Root Files: ${ROOT_FILES[*]}"
if [[ "$OMIT_EXTERNAL" -eq 1 ]]; then echo "Option: Omitting external links."; fi

# --- Pass 1: Find source files and gather all unique paths/URLs ---
echo "[Pass 1] Finding source files and gathering all unique paths/URLs..."
declare -A source_files_set      # Set of unique normalized source file paths
declare -A target_paths_set      # Set of unique normalized target paths/URLs/placeholders
declare -a initial_files_to_process # Temporary list

# Find files in target directories
if [ ${#TARGET_DIRS[@]} -gt 0 ]; then
    mapfile -d '' -t found_in_dirs < <(find "${TARGET_DIRS[@]}" -name '*.md' -print0 2>/dev/null)
    if [ $? -ne 0 ]; then echo "Warning: Find command encountered issues." >&2; fi
    initial_files_to_process+=("${found_in_dirs[@]}")
fi

# Add root files
for file in "${ROOT_FILES[@]}"; do
    if [ -f "$file" ]; then initial_files_to_process+=("$file"); else echo "Warning: Root file '$file' not found." >&2; fi
done

# Normalize source files and add to set
for file in "${initial_files_to_process[@]}"; do
    normalized_file_raw=$("$REALPATH_CMD" -m --relative-to=. "$file" 2>/dev/null)
    normalized_file="$(printf '%s' "$normalized_file_raw")"
    if [ -n "$normalized_file" ] && [ -f "$normalized_file" ]; then
        source_files_set["$normalized_file"]=1
    else
        echo "Warning: Could not normalize or find initial file '$file'. Skipping." >&2
    fi
done

echo "  Found ${#source_files_set[@]} unique source files."

# Grep for links and gather unique target paths/URLs/placeholders
link_regex='\[([^]]+)\]\(([^)#]+)(#[^)]*)?\)'
unique_targets_count=0
for source_file_norm in "${!source_files_set[@]}"; do
    while IFS=: read -r line_num link_match; do
        if [[ "$link_match" =~ $link_regex ]]; then
            target_raw="${BASH_REMATCH[2]}"
            target_raw=$(echo "$target_raw" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//') # Trim

            if [ -z "$target_raw" ] || [[ "$target_raw" == \#* ]]; then
                continue # Skip empty or anchor links
            fi

            target_node_path="" # This will hold the path/URL/placeholder to add to the set
            is_external=0

            if [[ "$target_raw" =~ :// ]]; then
                # External link
                is_external=1
                # If omitting external, don't add its URL to targets to process
                if [[ "$OMIT_EXTERNAL" -eq 1 ]]; then
                    continue
                fi
                target_node_path="$target_raw" # Use the raw URL as the key in the set for now
            else
                # Internal link - resolve and clean
                source_dir=$(dirname "$source_file_norm")
                resolved_target_raw=$("$REALPATH_CMD" -m --relative-to=. "$source_dir/$target_raw" 2>/dev/null)
                resolved_target="$(printf '%s' "$resolved_target_raw")"

                if [ -z "$resolved_target" ]; then
                    # Broken - resolution failed, create placeholder
                    # Include source file in placeholder to make it unique if target_raw is the same
                    target_node_path="BROKEN($target_raw@$source_file_norm)"
                else
                    # Resolved (might exist or not) - use the cleaned resolved path
                    target_node_path="$resolved_target"
                fi
            fi

            # Add the path/URL/placeholder to the set (unless external omitted)
            if [[ ! -v target_paths_set["$target_node_path"] ]]; then
                 target_paths_set["$target_node_path"]=1
                 ((unique_targets_count++))
            fi
        fi
    done < <(grep -noE "$link_regex" "$source_file_norm")
done
echo "  Found $unique_targets_count unique target paths/URLs/placeholders."


# --- Pass 2: Sanitize all unique paths/URLs to populate global maps ---
echo "[Pass 2] Sanitizing all unique paths and populating maps..."
# Sanitize source files (lookup key = path, label = path)
for path in "${!source_files_set[@]}"; do
    sanitize_and_store_id "$path" "file" "$path"
done

# Sanitize target paths/URLs/placeholders collected in Pass 1
for path_raw in "${!target_paths_set[@]}"; do
    local path="$(printf '%s' "$path_raw")" # Clean path from set key
    local kind=""
    local lookup_key=""
    local display_label_source=""

    if [[ "$path" =~ ^BROKEN\( ]]; then
        kind="broken_placeholder"
        lookup_key="$path" # Key is the unique BROKEN(...) string
        display_label_source="$path" # Label shows the BROKEN(...) string
        sanitize_and_store_id "$lookup_key" "$kind" "$display_label_source"
    elif [[ "$path" =~ :// ]]; then
        # This block will only run if OMIT_EXTERNAL is 0
        kind="external"
        local domain_name=$(echo "$path" | sed -E 's#^https?://([^/]+)/?.*#\1#')
        lookup_key="$domain_name" # Key is the domain
        display_label_source="$domain_name" # Label is the domain
        # Call sanitize only ONCE per unique domain name
        sanitize_and_store_id "$lookup_key" "$kind" "$display_label_source"
    else
        # It's a resolved internal path
        kind="file"
        lookup_key="$path" # Key is the path
        display_label_source="$path" # Label is the path
        sanitize_and_store_id "$lookup_key" "$kind" "$display_label_source"
    fi
done
echo "  Finished sanitizing and storing ${#node_id_map[@]} unique node entries (by path/domain/placeholder)."


# --- Pass 3: Build Link Information ---
echo "[Pass 3] Building link information using pre-generated IDs..."
declare -A all_links_set       # Set of unique "source_id->target_id" links
declare -A is_broken_link      # Mark broken links: is_broken_link["source_id->target_id"]=1
declare -A is_external_link    # Mark external links: is_external_link["source_id->target_id"]=1

link_count=0
broken_count=0
external_links_found_count=0 # Count raw external links found

for source_file_norm in "${!source_files_set[@]}"; do
    while IFS=: read -r line_num link_match; do
        if [[ "$link_match" =~ $link_regex ]]; then
            target_raw="${BASH_REMATCH[2]}"
            target_raw=$(echo "$target_raw" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

            if [ -z "$target_raw" ] || [[ "$target_raw" == \#* ]]; then
                continue
            fi

            # Determine the lookup key for the target node
            target_lookup_key=""
            current_link_is_external=0
            current_link_is_broken=0 # Tracks if THIS link instance is broken

            if [[ "$target_raw" =~ :// ]]; then
                # External link found
                ((external_links_found_count++))
                # If omitting, skip processing this link entirely
                if [[ "$OMIT_EXTERNAL" -eq 1 ]]; then
                    continue
                fi
                # Lookup key is the domain name
                local domain_name=$(echo "$target_raw" | sed -E 's#^https?://([^/]+)/?.*#\1#')
                target_lookup_key="$domain_name"
                current_link_is_external=1
            else
                # Internal link: resolve path or create placeholder
                source_dir=$(dirname "$source_file_norm")
                resolved_target_raw=$("$REALPATH_CMD" -m --relative-to=. "$source_dir/$target_raw" 2>/dev/null)
                resolved_target="$(printf '%s' "$resolved_target_raw")"

                if [ -z "$resolved_target" ]; then
                    # Could not resolve path
                    target_lookup_key="BROKEN($target_raw@$source_file_norm)"
                    current_link_is_broken=1
                    ((broken_count++)) # Increment broken count here
                    echo "Warning: Could not resolve internal path '$target_raw' relative to '$source_dir' (from '$source_file_norm'). Marking link as broken." >&2
                elif [[ ! -f "$resolved_target" ]]; then
                     # Resolved path exists, but is not a file
                     target_lookup_key="$resolved_target" # Use resolved path as key
                     current_link_is_broken=1
                     ((broken_count++)) # Increment broken count here
                     echo "Warning: Broken internal link. Target '$resolved_target' (from '$target_raw' in '$source_file_norm') does not exist or is not a file." >&2
                else
                     # Valid, existing file
                     target_lookup_key="$resolved_target" # Use resolved path as key
                fi
            fi

            # --- Lookup pre-generated IDs ---
            source_id="${node_id_map[$source_file_norm]}" # Source key is always the file path
            target_id="${node_id_map[$target_lookup_key]}" # Target key is path/domain/placeholder

            # Basic check if lookup failed (shouldn't happen with multi-pass)
            if [ -z "$source_id" ] || [ -z "$target_id" ]; then
                 echo "ERROR: Failed ID lookup! source_path='$source_file_norm' -> source_id='$source_id'; target_lookup_key='$target_lookup_key' -> target_id='$target_id'" >&2
                 # Don't adjust counts here, they are incremented when link is first identified as broken
                 continue
            fi
            # --- End Lookup ---

            link_key="$source_id->$target_id"

            # Check if this specific link pair already exists
            if [[ -v all_links_set["$link_key"] ]]; then
                # If we already added this link, don't re-count broken status
                if [[ "$current_link_is_broken" -eq 1 ]]; then ((broken_count--)); fi
                continue
            fi
            all_links_set["$link_key"]=1
            ((link_count++)) # Count unique links added to the graph

            # Mark link type
            if [[ "$current_link_is_broken" -eq 1 ]]; then
                is_broken_link["$link_key"]=1
            fi
            if [[ "$current_link_is_external" -eq 1 ]]; then
                is_external_link["$link_key"]=1
            fi
        fi
    done < <(grep -noE "$link_regex" "$source_file_norm")
done

# Count unique external target NODES present in the final graph links
declare -A unique_external_target_nodes
final_external_node_count=0
if [[ "$OMIT_EXTERNAL" -eq 0 ]]; then # Only count if not omitting
    for link_key in "${!all_links_set[@]}"; do
        if [[ -v is_external_link["$link_key"] ]]; then
            target_id=$(echo "$link_key" | cut -d'>' -f2)
            if [[ ! -v unique_external_target_nodes["$target_id"] ]]; then
                 unique_external_target_nodes["$target_id"]=1
                 ((final_external_node_count++))
            fi
        fi
    done
fi

# Ensure broken count doesn't exceed total link count if errors occur
if (( broken_count > link_count )); then broken_count=$link_count; fi

output_message="  Processed $link_count unique links added to graph ($broken_count broken"
if [[ "$OMIT_EXTERNAL" -eq 1 ]]; then
    output_message+=", $external_links_found_count external links found but omitted)."
else
    output_message+=", $final_external_node_count unique external domains)."
fi
echo "$output_message"


# --- Pass 4: Mermaid Output Generation ---
echo "[Pass 4] Generating Mermaid graph definition to '$MERMAID_OUTPUT_FILE'..."

TMP_MERMAID_FILE=$(mktemp)

# Write Mermaid header and styles
echo "graph LR" > "$TMP_MERMAID_FILE"
echo -e "\n  %% --- Node Definitions & Styling ---\n" >> "$TMP_MERMAID_FILE"
echo "  classDef brokenNode fill:#f99,stroke:#f00,stroke-width:2px,color:#fff;" >> "$TMP_MERMAID_FILE"
echo "  classDef externalNode fill:#ccf,stroke:#99f,stroke-width:1px,color:#000;" >> "$TMP_MERMAID_FILE"
echo "  classDef fileNode fill:#dfd,stroke:#9c9,stroke-width:1px,color:#000;" >> "$TMP_MERMAID_FILE"

declare -A nodes_in_output # Track nodes already defined

# Iterate through all unique links found (external links excluded if flag set)
for link_key in "${!all_links_set[@]}"; do
    source_id=$(echo "$link_key" | cut -d'-' -f1)
    target_id=$(echo "$link_key" | cut -d'>' -f2)

    # Define source and target nodes if not already defined
    for node_id in "$source_id" "$target_id"; do
        if [[ ! -v nodes_in_output["$node_id"] ]]; then
            # Lookups should now be reliable
            display_label="${node_id_to_path_map[$node_id]}" # Holds domain for external, path/placeholder otherwise
            kind="${node_type[$node_id]}"

            if [ -z "$kind" ]; then
                 # Fallback - this shouldn't be reached
                 echo "INTERNAL ERROR: Lookup failed unexpectedly for node_id='$node_id'" >&2
                 kind="file"
                 display_label="(LOOKUP FAILED: $node_id)"
            fi

            # Escape the display label for Mermaid
            label=$(echo "$display_label" | sed -e 's/\\/\\\\/g' -e 's/\"/\\\"/g')

             node_text=""
             node_class=""
             if [[ "$kind" == "external" ]]; then
                  # This node definition will only be reached if OMIT_EXTERNAL is 0
                  node_text="$node_id[\"$label\"]" # Label is domain name
                  node_class="externalNode"
             elif [[ "$kind" == "broken_placeholder" ]]; then
                  # Label is BROKEN(...) string
                  node_text="$node_id{{\"$label\"}}"
                  node_class="brokenNode"
             elif [[ "$kind" == "file" ]]; then
                 # For files, the display_label IS the original path. Check existence using it.
                 if [[ ! -f "$display_label" ]]; then
                     # This styles nodes representing non-existent target files as broken
                     node_text="$node_id{{\"$label\"}}" # Label is file path
                     node_class="brokenNode"
                 else
                     # Existing source or target file
                     node_text="$node_id[\"$label\"]" # Label is file path
                     node_class="fileNode"
                 fi
             else
                 # Should not happen
                 node_text="$node_id[\"$label (INVALID TYPE: $kind)\"]"
                 node_class="fileNode"
             fi

             echo "  $node_text" >> "$TMP_MERMAID_FILE"
             echo "  class $node_id $node_class;" >> "$TMP_MERMAID_FILE"
             nodes_in_output["$node_id"]=1
        fi
    done

    # Write the link itself
    link_style="-->" # Default
    link_label=""

    if [[ -v is_broken_link["$link_key"] ]]; then
        link_style="--x" # Broken link marker
    elif [[ -v is_external_link["$link_key"] ]]; then
        link_style="-.->" # External link marker
    fi

    echo "  $source_id $link_style$link_label $target_id" >> "$TMP_MERMAID_FILE"
done


# --- Add Node ID to Path Mapping as Comments ---
echo -e "\n\n  %% --- Node ID to Path Mapping ---\n" >> "$TMP_MERMAID_FILE"
# Sort the tmp map file for consistent comment output
sort "$TMP_NODE_MAP" | while IFS= read -r mapping_line; do
    node_id_in_map=$(echo "$mapping_line" | awk '{print $1}')
    # Only include nodes that actually appeared in the final graph
    if [[ -v nodes_in_output["$node_id_in_map"] ]]; then
        echo "  %% $mapping_line" >> "$TMP_MERMAID_FILE"
    fi
done


# Move temporary file to final destination
mv "$TMP_MERMAID_FILE" "$MERMAID_OUTPUT_FILE"

echo "Mermaid graph generated successfully: '$MERMAID_OUTPUT_FILE'"
# Keep the map file for debugging if needed, but it's also in comments now
# echo "Node ID mapping saved for reference (and in comments): '$TMP_NODE_MAP'"

# Optional: Suggest command to render
if command -v mmdc &> /dev/null; then
  echo "You can render this graph using: mmdc -i $MERMAID_OUTPUT_FILE -o ${MERMAID_OUTPUT_FILE%.mmd}.png"
  echo "Or SVG: mmdc -i $MERMAID_OUTPUT_FILE -o ${MERMAID_OUTPUT_FILE%.mmd}.svg"
fi

exit 0