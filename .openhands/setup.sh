#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

cd "$REPO_ROOT" || exit 1

if [ ! -d node_modules ]; then
  npm ci
fi

if [ ! -f "$ENV_FILE" ]; then
  cp .env.sample "$ENV_FILE"
fi

if ! grep -Eq '^[[:space:]]*VITE_WORKING_DIR=' "$ENV_FILE"; then
  printf '\nVITE_WORKING_DIR="%s"\n' "$REPO_ROOT" >> "$ENV_FILE"
fi

if [ ! -f src/i18n/declaration.ts ]; then
  npm run make-i18n
fi
