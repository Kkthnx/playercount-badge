#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

export DOCKER_UID="$(id -u)"
export DOCKER_GID="$(id -g)"

docker compose run --rm build

docker run --rm \
  -v "$PWD:/workspace" \
  alpine:3.20 \
  chown -R "${DOCKER_UID}:${DOCKER_GID}" \
    /workspace/.millennium \
    /workspace/pnpm-lock.yaml
