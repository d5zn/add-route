#!/bin/bash

# Simple auto-commit script (no prompts)
# Usage: ./auto-commit-simple.sh [commit message]

COMMIT_MSG="${1:-Auto commit: $(date '+%Y-%m-%d %H:%M:%S')}"

# Check if git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository"
    exit 1
fi

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
    echo "⚠️  No changes to commit"
    exit 0
fi

# Add, commit, and push
git add -A
git commit -m "$COMMIT_MSG"
git push origin main

echo "✅ Done: $COMMIT_MSG"

