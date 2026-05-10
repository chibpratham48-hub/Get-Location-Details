#!/usr/bin/env bash
# Run from anywhere: bash run-local.sh   (or: chmod +x run-local.sh && ./run-local.sh)
set -e
cd "$(dirname "$0")"
exec node server.js
