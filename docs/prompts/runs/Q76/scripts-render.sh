#!/usr/bin/env bash
# Q76: the render check (app/tests/e2e/content-render.spec.ts, the spec render_check.py drives) on the two new items
# only (CONTENT_ITEMS_JSON), every one rendered fresh, through the port-4393 override with one worker; the report into
# this folder. Usage, from the worktree root: bash docs/prompts/runs/Q76/scripts-render.sh <scratch dir>
set -u
ROOT="$(pwd)"
SCRATCH="$1"
cd "$ROOT/app" || exit 2
CONTENT_RENDER_CHECK=1 \
CONTENT_DIR="$ROOT/app/public/content" \
CONTENT_ITEMS_JSON="$SCRATCH/items.json" \
CONTENT_RENDER_REPORT="$ROOT/docs/prompts/runs/Q76/render-report.json" \
CONTENT_PREVIEW_DIR="$SCRATCH/previews" \
CONTENT_RENDER_MANIFEST="$SCRATCH/manifest.json" \
CONTENT_RENDER_FULL=1 \
npx playwright test tests/e2e/content-render.spec.ts --config playwright.q76-4393.config.ts --workers=1 --reporter=list
