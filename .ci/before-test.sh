#!/bin/sh
# Clear stale esbuild binary cache on CI runner before installing deps.
# The runner may have an old cached binary that conflicts with vitest's expected version.
rm -rf ~/.cache/esbuild
npm ci
