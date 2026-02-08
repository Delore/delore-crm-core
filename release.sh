#!/usr/bin/env sh
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Uso: $0 \"mensagem do commit\""
  exit 1
fi

COMMIT_MSG="$1"

git add -A
git commit -m "$COMMIT_MSG"

# Incrementa versão patch sem commit/tag automáticos
npm version patch --no-git-tag-version

# Comita a alteração de versão junto com o restante
git add -A
git commit -m "$COMMIT_MSG"

git push

npm publish
