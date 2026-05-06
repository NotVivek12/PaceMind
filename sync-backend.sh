#!/usr/bin/env bash
# sync-backend.sh
# Pull the latest backend from origin/main and rebase your frontend on top.
# Run this whenever teammates push backend changes.
#
# Usage:  bash sync-backend.sh

set -e

echo "→ Fetching origin..."
git fetch origin

echo "→ Rebasing frontend-custom onto origin/main..."
git rebase origin/main

echo "✓ Done. Your frontend changes are on top of the latest backend."
echo "  If there are conflicts, resolve them then run: git rebase --continue"
