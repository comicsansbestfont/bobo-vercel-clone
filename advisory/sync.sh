#!/bin/zsh
#
# CRM Folder Sync Script
# Syncs files from Blog Migration (CRM) to advisory folder
#
# Usage:
#   ./sync.sh          # Dry run (preview changes)
#   ./sync.sh --apply  # Apply changes
#   ./sync.sh --watch  # Watch for changes and sync automatically
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
SCRIPT_DIR="${0:a:h}"
SOURCE_BASE="/Users/sacheeperera/VibeCoding Projects/Blog Migration"
DEST_BASE="$SCRIPT_DIR"

# Rsync exclude patterns
EXCLUDES=(
    ".DS_Store"
    "*.tmp"
    "*~"
    ".git"
    "_TEMPLATE"
    "_INBOX"
)

# Build exclude arguments
EXCLUDE_ARGS=()
for pattern in "${EXCLUDES[@]}"; do
    EXCLUDE_ARGS+=("--exclude=$pattern")
done

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  CRM Folder Sync${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

check_changes() {
    local source="$1"
    local dest="$2"
    local name="$3"

    echo -e "${YELLOW}Checking: ${name}${NC}"
    echo -e "  Source: ${source}"
    echo -e "  Dest:   ${dest}"
    echo ""

    # Run rsync in dry-run mode to check for changes
    local changes
    changes=$(rsync -avnc --delete "${EXCLUDE_ARGS[@]}" "$source/" "$dest/" 2>/dev/null | grep -v "^$" | grep -v "^sending" | grep -v "^sent" | grep -v "^total" | grep -v "^\.$" || true)

    if [[ -n "$changes" ]]; then
        echo -e "${GREEN}Changes detected:${NC}"
        echo "$changes" | while read -r line; do
            if [[ "$line" == deleting* ]]; then
                echo -e "  ${RED}$line${NC}"
            elif [[ "$line" == */ ]]; then
                echo -e "  ${BLUE}$line${NC}"
            else
                echo -e "  ${GREEN}$line${NC}"
            fi
        done
        echo ""
        return 0
    else
        echo -e "  ${GREEN}✓ Up to date${NC}"
        echo ""
        return 1
    fi
}

apply_sync() {
    local source="$1"
    local dest="$2"
    local name="$3"

    echo -e "${YELLOW}Syncing: ${name}${NC}"

    # Ensure destination exists
    mkdir -p "$dest"

    # Run rsync
    rsync -avc --delete "${EXCLUDE_ARGS[@]}" "$source/" "$dest/"

    echo -e "${GREEN}✓ Synced ${name}${NC}"
    echo ""
}

sync_all() {
    local dry_run=$1
    local has_changes=false

    # Sync Clients → clients
    local source_path="$SOURCE_BASE/Clients"
    local dest_path="$DEST_BASE/clients"

    if [[ ! -d "$source_path" ]]; then
        echo -e "${RED}Warning: Source not found: $source_path${NC}"
    else
        if [[ "$dry_run" == "true" ]]; then
            if check_changes "$source_path" "$dest_path" "Clients → clients"; then
                has_changes=true
            fi
        else
            apply_sync "$source_path" "$dest_path" "Clients → clients"
        fi
    fi

    # Sync Deals → deals
    source_path="$SOURCE_BASE/Deals"
    dest_path="$DEST_BASE/deals"

    if [[ ! -d "$source_path" ]]; then
        echo -e "${RED}Warning: Source not found: $source_path${NC}"
    else
        if [[ "$dry_run" == "true" ]]; then
            if check_changes "$source_path" "$dest_path" "Deals → deals"; then
                has_changes=true
            fi
        else
            apply_sync "$source_path" "$dest_path" "Deals → deals"
        fi
    fi

    if [[ "$dry_run" == "true" ]]; then
        echo ""
        if [[ "$has_changes" == "true" ]]; then
            echo -e "${YELLOW}Run './sync.sh --apply' to apply these changes${NC}"
        else
            echo -e "${GREEN}All folders are in sync!${NC}"
        fi
    fi
}

watch_mode() {
    echo -e "${BLUE}Watching for changes... (Ctrl+C to stop)${NC}"
    echo ""

    # Check if fswatch is installed
    if ! command -v fswatch &> /dev/null; then
        echo -e "${RED}Error: fswatch is not installed${NC}"
        echo "Install with: brew install fswatch"
        exit 1
    fi

    # Watch for changes
    fswatch -o "$SOURCE_BASE/Clients" "$SOURCE_BASE/Deals" | while read -r _; do
        echo ""
        echo -e "${YELLOW}Change detected at $(date '+%H:%M:%S')${NC}"
        sync_all false
    done
}

show_status() {
    echo -e "${BLUE}Current sync status:${NC}"
    echo ""

    # Status for Clients
    local source_path="$SOURCE_BASE/Clients"
    local dest_path="$DEST_BASE/clients"

    echo -e "${YELLOW}Clients → clients${NC}"

    if [[ ! -d "$source_path" ]]; then
        echo -e "  ${RED}Source not found${NC}"
    else
        # Count files
        local source_count=$(find "$source_path" -type f ! -name ".DS_Store" ! -path "*/_TEMPLATE/*" ! -path "*/_INBOX/*" 2>/dev/null | wc -l | tr -d ' ')
        local dest_count=$(find "$dest_path" -type f ! -name ".DS_Store" 2>/dev/null | wc -l | tr -d ' ')

        echo -e "  Source files: $source_count"
        echo -e "  Dest files:   $dest_count"

        # List subfolders
        echo -e "  ${BLUE}Folders:${NC}"
        for dir in "$source_path"/*/; do
            if [[ -d "$dir" ]]; then
                local dirname=$(basename "$dir")
                if [[ "$dirname" != "_TEMPLATE" && "$dirname" != "_INBOX" ]]; then
                    if [[ -d "$dest_path/$dirname" ]]; then
                        echo -e "    ${GREEN}✓${NC} $dirname"
                    else
                        echo -e "    ${RED}✗${NC} $dirname (not synced)"
                    fi
                fi
            fi
        done
    fi
    echo ""

    # Status for Deals
    source_path="$SOURCE_BASE/Deals"
    dest_path="$DEST_BASE/deals"

    echo -e "${YELLOW}Deals → deals${NC}"

    if [[ ! -d "$source_path" ]]; then
        echo -e "  ${RED}Source not found${NC}"
    else
        # Count files
        local source_count=$(find "$source_path" -type f ! -name ".DS_Store" ! -path "*/_TEMPLATE/*" ! -path "*/_INBOX/*" 2>/dev/null | wc -l | tr -d ' ')
        local dest_count=$(find "$dest_path" -type f ! -name ".DS_Store" 2>/dev/null | wc -l | tr -d ' ')

        echo -e "  Source files: $source_count"
        echo -e "  Dest files:   $dest_count"

        # List subfolders
        echo -e "  ${BLUE}Folders:${NC}"
        for dir in "$source_path"/*/; do
            if [[ -d "$dir" ]]; then
                local dirname=$(basename "$dir")
                if [[ "$dirname" != "_TEMPLATE" && "$dirname" != "_INBOX" ]]; then
                    if [[ -d "$dest_path/$dirname" ]]; then
                        echo -e "    ${GREEN}✓${NC} $dirname"
                    else
                        echo -e "    ${RED}✗${NC} $dirname (not synced)"
                    fi
                fi
            fi
        done
    fi
    echo ""
}

# Main
print_header

case "${1:-}" in
    --apply|-a)
        echo -e "${GREEN}Applying sync...${NC}"
        echo ""
        sync_all false
        echo -e "${GREEN}Done!${NC}"
        ;;
    --watch|-w)
        watch_mode
        ;;
    --status|-s)
        show_status
        ;;
    --help|-h)
        echo "Usage: ./sync.sh [option]"
        echo ""
        echo "Options:"
        echo "  (none)      Dry run - preview changes without applying"
        echo "  --apply     Apply changes"
        echo "  --watch     Watch for changes and sync automatically"
        echo "  --status    Show current sync status"
        echo "  --help      Show this help message"
        echo ""
        echo "Source: $SOURCE_BASE"
        echo "Dest:   $DEST_BASE"
        ;;
    *)
        echo -e "${YELLOW}Dry run mode - no changes will be made${NC}"
        echo ""
        sync_all true
        ;;
esac
