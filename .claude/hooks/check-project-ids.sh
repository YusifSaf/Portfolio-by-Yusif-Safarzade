#!/bin/bash
# PostToolUse hook: after edits to HTML/Projects/projects.json, verify every
# project id has a matching (case-sensitive) folder under HTML/Projects/images/.
# Catches the class of bug where portfolio.html links to a lowercase id but
# projects.json keys it with different casing.

set -euo pipefail

file_path=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')

case "$file_path" in
  */HTML/Projects/projects.json) ;;
  *) exit 0 ;;
esac

[ -f "$file_path" ] || exit 0

images_dir="$(dirname "$file_path")/images"
missing=""

for id in $(jq -r 'keys[]' "$file_path"); do
  if [ ! -d "$images_dir/$id" ]; then
    missing="$missing $id"
  fi
done

if [ -n "$missing" ]; then
  msg="projects.json: no matching folder in HTML/Projects/images/ for id(s):$missing (check casing)"
  jq -n --arg msg "$msg" '{systemMessage: $msg}'
fi
