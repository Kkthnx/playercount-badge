#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

docker run --rm -v "$PWD:/workspace" alpine:3.20 sh -c \
  'rm -rf /workspace/.pnpm-store /workspace/node_modules /workspace/.millennium'

docker compose down --volumes --remove-orphans 2>/dev/null || true

echo "Cleaned build artifacts and Docker volumes."
