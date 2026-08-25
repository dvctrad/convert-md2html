#!/bin/bash
# uninstall.sh — ~/Library/Services/ から Quick Action を削除する

set -eu

SERVICES_DIR="$HOME/Library/Services"

if [ "$(uname)" != "Darwin" ]; then
  echo "ERROR: このスクリプトは macOS でのみ動作します。" >&2
  exit 1
fi

removed=0
for name in "Convert to HTML" "Convert to HTML (with Nav)"; do
  target="$SERVICES_DIR/${name}.workflow"
  if [ -d "$target" ]; then
    rm -rf "$target"
    echo "削除: $target"
    removed=$((removed+1))
  fi
done

if [ -x /System/Library/CoreServices/pbs ]; then
  /System/Library/CoreServices/pbs -flush 2>/dev/null || true
fi

if [ "$removed" -eq 0 ]; then
  echo "削除対象は見つかりませんでした。"
else
  echo "アンインストール完了 (${removed} 件)。"
fi
