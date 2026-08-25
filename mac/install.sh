#!/bin/bash
# install.sh — Finder クイックアクションを ~/Library/Services/ に配置する
# 使い方: cd mac && ./install.sh
#
# このスクリプトは、リポジトリ内の mac/services/*.workflow をユーザの
# ~/Library/Services/ にコピーし、document.wflow 内のプレースホルダ
# (__REPO_PATH__) を実際のリポジトリ絶対パスに置換します。

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICES_DIR="$HOME/Library/Services"

if [ "$(uname)" != "Darwin" ]; then
  echo "ERROR: このスクリプトは macOS でのみ動作します。" >&2
  exit 1
fi

# Node.js の存在チェック（警告だけ）
if ! command -v node >/dev/null 2>&1; then
  echo "WARN: 'node' がパスに見つかりません。Quick Action 起動時に PATH を拡張しますが、" >&2
  echo "      Node.js v14 以上が未インストールなら https://nodejs.org/ から導入してください。" >&2
fi

# 実行権限を付与
chmod +x "$REPO_ROOT/mac/bin/convert-finder.sh" "$REPO_ROOT/mac/bin/notify.sh" "$REPO_ROOT/mac/uninstall.sh" 2>/dev/null || true

mkdir -p "$SERVICES_DIR"

install_one() {
  local name="$1"
  local src="$REPO_ROOT/mac/services/${name}.workflow"
  local dst="$SERVICES_DIR/${name}.workflow"

  if [ ! -d "$src" ]; then
    echo "ERROR: ソースが見つかりません: $src" >&2
    return 1
  fi

  echo "→ ${name}.workflow を配置: $dst"
  rm -rf "$dst"
  cp -R "$src" "$dst"

  # __REPO_PATH__ を実パスに置換（macOS 標準 sed は -i '' が必要）
  /usr/bin/sed -i '' "s|__REPO_PATH__|${REPO_ROOT}|g" "$dst/Contents/document.wflow"

  # 念のため XML plist に統一
  /usr/bin/plutil -convert xml1 "$dst/Contents/document.wflow" 2>/dev/null || true
  /usr/bin/plutil -convert xml1 "$dst/Contents/Info.plist" 2>/dev/null || true
}

install_one "Convert to HTML"
install_one "Convert to HTML (with Nav)"

# サービス登録キャッシュを更新
if [ -x /System/Library/CoreServices/pbs ]; then
  /System/Library/CoreServices/pbs -flush 2>/dev/null || true
fi

cat <<EOF

インストール完了。

次の手順で利用開始してください:
  1. Finder で .md ファイル、.csv ファイル、または任意のフォルダを右クリック
  2. 「クイックアクション」サブメニュー（古い macOS では「サービス」）から
     - 「Convert to HTML」          … 通常変換
     - 「Convert to HTML (with Nav)」… サイドバーナビ付き変換
     を選択
  3. 初回のみ：表示されない場合は
     システム設定 → キーボード → キーボードショートカット → サービス
     から該当項目を有効化してください。

リポジトリパス: ${REPO_ROOT}
インストール先: ${SERVICES_DIR}
EOF
