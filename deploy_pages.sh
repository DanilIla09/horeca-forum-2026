#!/usr/bin/env bash
# Публикация на GitHub Pages: создаёт публичный репозиторий horeca-forum-2026 в аккаунте gh
# и включает Pages с ветки main. Повторный запуск — просто пушит изменения.
# Адрес после первой сборки (1–2 минуты): https://<логин>.github.io/horeca-forum-2026/
set -euo pipefail
cd "$(dirname "$0")"
LOGIN=$(gh api user -q .login)
REPO="horeca-forum-2026"
if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$REPO" --public --source=. --remote=origin --push \
    --description "Лендинг Coca-Cola HoReCa Forum 2026 — 9 декабря, Swiss Hotel, Алматы"
  gh api -X POST "repos/$LOGIN/$REPO/pages" -f 'source[branch]=main' -f 'source[path]=/' >/dev/null \
    || gh api -X PUT "repos/$LOGIN/$REPO/pages" -f 'source[branch]=main' -f 'source[path]=/' >/dev/null
else
  git push origin main
fi
echo "Сайт: https://$(echo "$LOGIN" | tr '[:upper:]' '[:lower:]').github.io/$REPO/"
