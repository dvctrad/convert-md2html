#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: ./convert-md2html.sh <input file/directory path> <output file/directory path> [--nav] [--fit-tables] [--css <css file>]"
  echo "Supported formats: Markdown, csv"
  echo "Options: --nav or --navigation to add navigation menu; --fit-tables to fit tables to page width"
  echo "         --css <css file> to embed additional CSS (repeatable)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Debug: Starting conversion..."
echo "Debug: Arguments: $*"
echo "Debug: Executing Node.js script..."

node "${SCRIPT_DIR}/convert-md2html.js" "$@"
status=$?

echo "Debug: Node.js script completed with exit code: ${status}"
exit ${status}
