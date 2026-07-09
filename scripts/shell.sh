#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

export DOCKER_UID="$(id -u)"
export DOCKER_GID="$(id -g)"

docker compose run --rm shell
