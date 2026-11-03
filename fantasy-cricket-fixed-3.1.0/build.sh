#!/usr/bin/env bash
set -euo pipefail
npm ci
npm --prefix frontend ci
npm run build
