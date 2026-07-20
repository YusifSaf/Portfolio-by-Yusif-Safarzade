#!/usr/bin/env bash
# Commit + tag + push the current state as the next version (v1, v1.1, v1.2, ...).
# Usage: npm run save -- "short description of what changed"
set -euo pipefail

DESC="${1:-}"
if [ -z "$DESC" ]; then
  echo "Usage: npm run save -- \"short description of what changed\"" >&2
  exit 1
fi

if [ -z "$(git status --porcelain)" ]; then
  echo "Nothing to commit — working tree is clean." >&2
  exit 1
fi

LATEST="$(git tag -l 'v*' | sort -V | tail -n 1)"

if [ -z "$LATEST" ]; then
  NEXT="v1"
elif [[ "$LATEST" == *.* ]]; then
  MAJOR="${LATEST%%.*}"
  MINOR="${LATEST##*.}"
  NEXT="${MAJOR}.$((MINOR + 1))"
else
  NEXT="${LATEST}.1"
fi

echo "Latest version: ${LATEST:-none}"
echo "Next version:   $NEXT"
echo "Description:    $DESC"
echo

git add -A
git commit -m "$NEXT: $DESC"
git tag -a "$NEXT" -m "$DESC"
git push origin HEAD
git push origin "$NEXT"

echo
echo "Done. Pushed commit + tag $NEXT to origin."
echo "To revert to this point later: git checkout $NEXT"
