#!/usr/bin/env bash

# Script to generate a Mermaid include graph from files in the 'src' directory.
# Runs find and grep internally.
# Highlights includes pointing to non-existent files in red.
# Generates simplified, unquoted node IDs for better parser compatibility.
# Supports focusing on specific files/directories.

# --- Configuration ---
SRC_DIR="src" # Directory to scan
MERMAID_OUTPUT_FILE="include_graph.mmd"
FOCUS_TARGETS=() # Array to store focus paths

# --- Argument Parsing ---
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -f|--focus) FOCUS_TARGETS+=("$2"); shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# --- Dependency Check ---
# On macOS with coreutils installed via Homebrew, use "grealpath".
# On Linux or if realpath is natively GNU-compatible, use "realpath".
# Check common Homebrew paths first for grealpath
if command -v /opt/homebrew/bin/grealpath &> /dev/null; then
    REALPATH_CMD="/opt/homebrew/bin/grealpath"
elif command -v /usr/local/bin/grealpath &> /dev/null; then
     REALPATH_CMD="/usr/local/bin/grealpath"
elif command -v realpath &> /dev/null; then # Fallback for Linux or if grealpath isn't aliased/installed
    REALPATH_CMD="realpath"
else
    echo "Error: Cannot find 'grealpath' (expected from coreutils) or 'realpath'." >&2
    echo "On macOS, try installing coreutils: brew install coreutils" >&2
    exit 1
fi


# --- Helper Functions ---

# Function to clean up temporary files on exit
cleanup() {
  # Keep TMP_NODE_MAP for now, remove others if they exist
  # rm -f "$TMP_GRAPH_LINKS" "$TMP_BROKEN_LINKS"
  rm -f "$TMP_NODE_MAP" # Still used for comments
}
trap cleanup EXIT INT TERM

# Check if source directory exists
if [ ! -d "$SRC_DIR" ]; then
    echo "Error: Source directory '$SRC_DIR' not found." >&2
    exit 1
fi

# Function to sanitize node IDs for Mermaid (creating simple IDs)
# Ensures filenames with special characters are handled correctly.
declare -A node_id_map # Map original paths to simple IDs
declare -A simple_id_used # Track generated simple IDs to avoid collisions
declare -A node_id_to_path_map # Map simple ID back to original path
node_counter=0
TMP_NODE_MAP=$(mktemp) # File to store the mapping for reference

sanitize_id() {
    local original_path="$1"
    local id
    local base_id

    # Check if we already mapped this path
    if [[ -v node_id_map["$original_path"] ]]; then
        echo "${node_id_map["$original_path"]}"
        return
    fi

    # Create a base ID: replace problematic chars with underscore
    base_id="${original_path//\//_}"
    base_id="${base_id//./_}"
    # base_id="${base_id//-/_}"
    # Remove any remaining non-alphanumeric characters (except underscore)
    base_id="${base_id//[^a-zA-Z0-9_-]/}"
    # Remove leading/trailing underscores
    base_id="${base_id#_}"
    base_id="${base_id%_}"
    # Optionally remove src_ prefix if desired (can make IDs cleaner)
    # base_id="${base_id//src_/}"

    # Prepend with a letter if it starts with a number or is empty
    if [[ -z "$base_id" || "$base_id" =~ ^[0-9] ]]; then
      base_id="node_$base_id"
    fi

    # Ensure uniqueness if the base_id was already generated from a DIFFERENT path
    id="$base_id"
    local suffix=1
    while [[ -v simple_id_used["$id"] ]]; do
        id="${base_id}_${suffix}"
        ((suffix++))
    done

    # Store the mapping
    node_id_map["$original_path"]="$id"
    simple_id_used["$id"]=1
    node_id_to_path_map["$id"]="$original_path" # Reverse mapping
    # Log the mapping to a file
    echo "$id == $original_path" >> "$TMP_NODE_MAP"

    echo "$id"
}


# --- Graph Traversal Functions (for Focus) ---

# Function to perform BFS/DFS traversal
# Args: $1=start_nodes_array_name, $2=graph_array_name, $3=result_visited_array_name
traverse_graph() {
    local -n start_nodes_ref=$1
    local -n graph_ref=$2
    local -n visited_ref=$3 # Pass result array by reference

    local queue=("${start_nodes_ref[@]}")
    local current_node
    local neighbor_list
    local neighbor

    # Add start nodes to visited set initially
    for node in "${start_nodes_ref[@]}"; do
        visited_ref["$node"]=1
    done

    local head=0
    while [ "$head" -lt "${#queue[@]}" ]; do
        current_node="${queue[$head]}"
        ((head++))

        neighbor_list="${graph_ref[$current_node]:-}" # Get neighbors or empty string
        # Split neighbor_list string into words for iteration
        read -ra neighbors <<< "$neighbor_list"

        for neighbor in "${neighbors[@]}"; do
            if [[ ! -v visited_ref["$neighbor"] ]]; then
                visited_ref["$neighbor"]=1
                queue+=("$neighbor")
            fi
        done
    done
}


# --- Main Logic ---

echo "Scanning '$SRC_DIR' for files..."

# 1. Find all files and store normalized paths in an associative array
declare -A existing_files # Requires Bash 4+
file_count=0
# Use process substitution to read find output line by line
while IFS= read -r file; do
    # Normalize path using realpath relative to the current directory (.)
    # The -m flag allows non-existent intermediate directories (useful for checking)
    normalized_file=$("$REALPATH_CMD" -m --relative-to=. "$file" 2>/dev/null)
    if [ -n "$normalized_file" ]; then
      existing_files["$normalized_file"]=1 # Requires Bash 4+
      ((file_count++))
      # Pre-sanitize IDs for all existing files
      sanitize_id "$normalized_file" > /dev/null
    else
      echo "Warning: Could not normalize path for file: $file" >&2
    fi
done < <(find "$SRC_DIR" -type f | sort)

echo "Found $file_count unique files."
if [ "$file_count" -eq 0 ]; then
    echo "Warning: No files found in '$SRC_DIR'. Output graph will be empty."
fi

# Create data structures for the full graph
declare -A forward_graph # forward_graph[source_id]="target1 target2 ..."
declare -A backward_graph # backward_graph[target_id]="source1 source2 ..."
declare -A is_broken_link # is_broken_link["source_id->target_id"]=1 if target is broken
declare -A all_links_set # Keep track of unique "source->target" links to avoid duplicates

echo "Scanning for includes and building full graph..."
include_count=0
broken_count=0

# 2. Grep for includes and process them
# Use process substitution to read grep output line by line
# Use grep -E for extended regex to handle '|'
while IFS= read -r line; do
    ((include_count++))
    # Extract source file (part before the first ':')
    source_file_raw=$(echo "$line" | cut -d: -f1)
    source_file_norm=$("$REALPATH_CMD" -m --relative-to=. "$source_file_raw" 2>/dev/null)

    if [ -z "$source_file_norm" ]; then
        echo "Warning: Could not parse or normalize source file from line: $line" >&2
        continue
    fi

    # Extract included target path (part within the first pair of quotes after INCLUDE/INCLUDECODE)
    # Handle both !INCLUDE "..." and !INCLUDECODE "..." (case-insensitive for safety)
    target_raw=$(echo "$line" | grep -ioE '(!INCLUDE|!INCLUDECODE)[^"]*"[^"]+"' | sed -E 's/.*"([^"]+)".*/\1/' | head -n 1)

    if [ -z "$target_raw" ]; then
        echo "Warning: Could not parse target path from include line: $line" >&2
        continue
    fi

    # Resolve target path: it's relative to the source file's directory
    source_dir=$(dirname "$source_file_raw")
    # Use realpath -m to resolve relative paths like "../" and "./" correctly
    # Run relative to current dir (.) to get paths consistent with existing_files keys
    resolved_target=$("$REALPATH_CMD" -m --relative-to=. "$source_dir/$target_raw" 2>/dev/null)
    is_unresolved=0

    if [ -z "$resolved_target" ]; then
        echo "Warning: Could not resolve target path '$target_raw' relative to '$source_dir' for line: $line" >&2
        # Create a placeholder original path for unresolved targets
        resolved_target="UNRESOLVED($target_raw@$source_file_norm)" # Make it unique
        is_unresolved=1
    fi

    # Get simplified, safe IDs for Mermaid
    source_id=$(sanitize_id "$source_file_norm")
    target_id=$(sanitize_id "$resolved_target") # Sanitize even unresolved ones

    link_key="$source_id->$target_id"

    # Avoid adding duplicate links between the same two nodes
    if [[ -v all_links_set["$link_key"] ]]; then
        ((include_count--)) # Decrement count as it's a duplicate link
        continue
    fi
    all_links_set["$link_key"]=1

    # Add to forward graph (source -> target)
    forward_graph["$source_id"]="${forward_graph[$source_id]:-} $target_id"
    # Add to backward graph (target -> source)
    backward_graph["$target_id"]="${backward_graph[$target_id]:-} $source_id"


    # Check if target exists (only if it wasn't explicitly unresolved)
    # Requires Bash 4+ for '-v' operator
    if [[ "$is_unresolved" -eq 0 ]] && [[ ! -v existing_files["$resolved_target"] ]]; then
        # Target MISSING
        echo "Warning: Included file NOT FOUND: '$resolved_target' (normalized from '$target_raw' in '$source_file_raw')" >&2
        is_broken_link["$link_key"]=1
        ((broken_count++))
    fi

# Grep recursively (-r), use extended regex (-E), match patterns case-insensitively (-i)
done < <(grep -riE '!INCLUDE[^"]*"[^"]+"|!INCLUDECODE[^"]*"[^"]+"' "$SRC_DIR")

echo "Processed $include_count unique include directives."
if [ "$broken_count" -gt 0 ]; then
    echo "Found $broken_count potentially broken include links (target file not found)."
fi

# --- Focus Logic ---
declare -A included_node_ids # Nodes to include in the final graph
declare -A final_links # Links to include: "source_id->target_id"=1

if [ "${#FOCUS_TARGETS[@]}" -gt 0 ]; then
    echo "Focusing graph on: ${FOCUS_TARGETS[*]}"
    declare -A focus_node_ids_initial # Store the direct focus node IDs

    # 1. Resolve focus targets to node IDs
    for target in "${FOCUS_TARGETS[@]}"; do
        norm_target=$("$REALPATH_CMD" -m --relative-to=. "$target" 2>/dev/null)
        if [ -z "$norm_target" ]; then
            echo "Warning: Could not normalize focus target '$target'. Skipping." >&2
            continue
        fi

        if [ -f "$norm_target" ]; then # Is it a file?
            if [[ -v existing_files["$norm_target"] ]]; then
                 node_id=$(sanitize_id "$norm_target")
                 focus_node_ids_initial["$node_id"]=1
                 echo "  - Focused file: $norm_target (ID: $node_id)"
            else
                 echo "Warning: Focus file '$norm_target' not found within scanned '$SRC_DIR'. Skipping." >&2
            fi
        elif [ -d "$norm_target" ]; then # Is it a directory?
             echo "  - Focused directory: $norm_target"
             found_in_dir=0
             # Iterate over all known files to see if they are within this dir
             for known_file in "${!existing_files[@]}"; do
                 # Check if known_file starts with norm_target/
                 if [[ "$known_file" == "$norm_target"/* ]]; then
                     node_id=$(sanitize_id "$known_file")
                     focus_node_ids_initial["$node_id"]=1
                     echo "    - Including file: $known_file (ID: $node_id)"
                     found_in_dir=1
                 fi
             done
             if [ "$found_in_dir" -eq 0 ]; then
                 echo "    - Warning: No scanned files found within focus directory '$norm_target'." >&2
             fi
        else
            echo "Warning: Focus target '$norm_target' is neither a file nor a directory. Skipping." >&2
        fi
    done

    if [ "${#focus_node_ids_initial[@]}" -eq 0 ]; then
        echo "Error: No valid focus nodes identified from targets: ${FOCUS_TARGETS[*]}" >&2
        exit 1
    fi

    # 2. Perform graph traversal
    declare -A visited_forward
    declare -A visited_backward
    initial_focus_ids_array=("${!focus_node_ids_initial[@]}") # Get keys as array

    echo "  - Traversing forward from focus nodes..."
    traverse_graph initial_focus_ids_array forward_graph visited_forward

    echo "  - Traversing backward from focus nodes..."
    traverse_graph initial_focus_ids_array backward_graph visited_backward

    # Combine results: included nodes are the union of forward and backward traversals
    for node_id in "${!visited_forward[@]}"; do
        included_node_ids["$node_id"]=1
    done
    for node_id in "${!visited_backward[@]}"; do
        included_node_ids["$node_id"]=1
    done
    echo "  - Total nodes included after traversal: ${#included_node_ids[@]}"

    # 3. Filter links: Keep link if BOTH source and target are in included_node_ids
    echo "  - Filtering links..."
    filtered_link_count=0
    for link_key in "${!all_links_set[@]}"; do
        source_id="${link_key%->*}" # Extract source ID
        target_id="${link_key#*->}" # Extract target ID

        if [[ -v included_node_ids["$source_id"] ]] && [[ -v included_node_ids["$target_id"] ]]; then
            final_links["$link_key"]=1
             ((filtered_link_count++))
        fi
    done
    # Calculate broken count based on final links AFTER filtering
    filtered_broken_count=0
    for link_key in "${!final_links[@]}"; do
        if [[ -v is_broken_link["$link_key"] ]]; then
            ((filtered_broken_count++))
        fi
    done
    echo "  - Links included after filtering: $filtered_link_count ($filtered_broken_count broken)"

else
    # No focus: include all nodes and links
    echo "No focus specified, generating full graph."
    included_node_ids=("${!node_id_to_path_map[@]}") # Include all nodes with generated IDs
    final_links=("${all_links_set[@]}") # Include all links

    # Just use the global broken_count calculated earlier
    echo "Including all ${#final_links[@]} links ($broken_count broken)."

fi


# 3. Assemble the final Mermaid file
echo "Writing Mermaid file: $MERMAID_OUTPUT_FILE"

{
    echo "graph LR"
    echo ""
    echo "%% -- Node Definitions --"
    # Define nodes explicitly with their paths as text
    # Sort node IDs for consistent output
    mapfile -t sorted_node_ids < <(printf '%s\n' "${!included_node_ids[@]}" | sort)
    if [ "${#sorted_node_ids[@]}" -gt 0 ]; then
        nodes_shown=0
        for node_id in "${sorted_node_ids[@]}"; do
            # Only define nodes that are part of included links OR were initial focus nodes
            # This avoids defining isolated nodes unless they were explicitly focused on.
            is_relevant=0
            if [[ -v focus_node_ids_initial["$node_id"] ]]; then
                is_relevant=1
            else
                # Check if this node is part of any final link
                for link_key in "${!final_links[@]}"; do
                     source_id="${link_key%->*}"
                     target_id="${link_key#*->}"
                     if [[ "$source_id" == "$node_id" || "$target_id" == "$node_id" ]]; then
                         is_relevant=1
                         break
                     fi
                done
            fi

            if [[ "$is_relevant" -eq 1 ]]; then
                 original_path="${node_id_to_path_map[$node_id]}"
                 # Escape quotes in the path for the Mermaid label string
                 escaped_path="${original_path//\"/\\\"}"
                 if [ ! -z "$escaped_path" ] && [ "$escaped_path" != "" ]; then
                    echo "    $node_id[\"$escaped_path\"]" # Mermaid node definition
                    ((nodes_shown++))
                 fi
            fi
        done
         if [ "$nodes_shown" -eq 0 ] && [ "${#final_links[@]}" -eq 0 ]; then
             # If focus resulted in no nodes/links, show the initial focus node(s)
             if [[ "${#FOCUS_TARGETS[@]}" -gt 0 && "${#focus_node_ids_initial[@]}" -gt 0 ]]; then
                 echo "    %% Displaying initial focus node(s) as no links were found:"
                 for node_id in "${!focus_node_ids_initial[@]}"; do
                    original_path="${node_id_to_path_map[$node_id]}"
                    escaped_path="${original_path//\"/\\\"}"
                    echo "    $node_id[\"$escaped_path\"]"
                 done
             else
                echo "    %% No relevant nodes or links to display."
             fi
         fi
    else
         echo "    %% No nodes included in the graph."
    fi
    echo ""

    final_link_count="${#final_links[@]}"
    echo "%% -- Links ($final_link_count total) --"
    if [ "$final_link_count" -gt 0 ]; then
        # Sort link keys for consistent output order
        mapfile -t sorted_final_link_keys < <(printf '%s\n' "${!final_links[@]}" | sort)
        for link_key in "${sorted_final_link_keys[@]}"; do
            source_id="${link_key%->*}"
            target_id="${link_key#*->}"
            echo "    $source_id --> $target_id" # Indent for readability
        done
    else
        echo "%% No include links to display for the focus."
    fi
    echo ""

    # --- Corrected Broken Link Styling ---
    # Calculate broken indices AFTER sorting the final links
    declare -A final_broken_indices_corrected # Use a new name for clarity
    final_broken_count_corrected=0
    if [ "$final_link_count" -gt 0 ]; then
        # We already have sorted_final_link_keys from the link writing section
        current_index=0
        for link_key in "${sorted_final_link_keys[@]}"; do
            if [[ -v is_broken_link["$link_key"] ]]; then
                final_broken_indices_corrected["$current_index"]=1
                ((final_broken_count_corrected++))
            fi
            ((current_index++))
        done
    fi
    # --- End Corrected Broken Link Styling ---

    if [ "$final_broken_count_corrected" -gt 0 ]; then
        echo "%% -- Styling for Missing Includes ($final_broken_count_corrected links in RED) --"
        # Sort indices for consistent output order (indices are now correct)
        mapfile -t sorted_broken_indices < <(printf '%s\n' "${!final_broken_indices_corrected[@]}" | sort -n)
        for index in "${sorted_broken_indices[@]}"; do
            # Mermaid syntax: linkStyle INDEX stroke:color,stroke-width:pixels;
            echo "linkStyle $index stroke:#ff0000,stroke-width:2px;"
        done
    elif [ "$final_link_count" -gt 0 ]; then
         echo "%% No broken includes found in the displayed graph."
    fi

} > "$MERMAID_OUTPUT_FILE"

# Use the count of links actually written to the file
final_link_count_written="${#final_links[@]}"
# Use the corrected broken count
final_broken_count_written="$final_broken_count_corrected"

echo "Done. Mermaid definition saved to '$MERMAID_OUTPUT_FILE'."
echo "Generated graph contains $final_link_count_written links ($final_broken_count_written broken)."

if [ "${#FOCUS_TARGETS[@]}" -gt 0 ]; then
    echo "Graph focused on: ${FOCUS_TARGETS[*]}"
fi
if [ -s "$TMP_NODE_MAP" ]; then
    echo "Full Node ID mapping saved as comments within the file for reference."
fi
echo "You can view this file using a Mermaid viewer:"
echo " - Online Editor: https://mermaid.live"
echo " - VS Code Plugins (e.g., Markdown Mermaid)"
echo " - Other tools supporting Mermaid"

# Clean up is handled by the trap
exit 0
