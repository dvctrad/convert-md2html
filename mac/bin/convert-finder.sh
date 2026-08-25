#!/bin/bash
# convert-finder.sh
# Finder のクイックアクションから呼び出される本処理シェル。
#
# 呼び出し例:
#   convert-finder.sh plain "/path/to/foo.md" "/path/to/bar/"
#   convert-finder.sh nav   "/path/to/docs/"
#
# 仕様:
#  - 出力先フォルダを毎回 osascript の choose folder ダイアログで尋ねる
#  - フォルダ入力 → 出力先/<basename>_html/  (MODE=nav なら --nav 付与)
#  - .md / .csv ファイル入力 → 出力先/<stem>.html  (MODE=nav でも単体ファイルには --nav を付けない=仮変換)
#  - 結果サマリを通知センター（失敗時はダイアログ）に表示
#  - macOS bash 3.2 で動く構文に留める

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NOTIFY="$SCRIPT_DIR/notify.sh"
SCRIPT_JS="$REPO_ROOT/convert-md2html.js"

# --- Node.js 探索 ---------------------------------------------------------
# Finder 経由起動は非ログインシェルで ~/.zshrc を読まないため、PATH を明示拡張する
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

find_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi
  for cand in /usr/local/bin/node /opt/homebrew/bin/node; do
    if [ -x "$cand" ]; then
      echo "$cand"
      return 0
    fi
  done
  if [ -d "$HOME/.nvm/versions/node" ]; then
    latest=$(ls -1 "$HOME/.nvm/versions/node" 2>/dev/null | sort -V | tail -n1)
    if [ -n "${latest:-}" ] && [ -x "$HOME/.nvm/versions/node/$latest/bin/node" ]; then
      echo "$HOME/.nvm/versions/node/$latest/bin/node"
      return 0
    fi
  fi
  return 1
}

NODE_BIN=""
if NODE_BIN="$(find_node)"; then :; else
  "$NOTIFY" "convert-md2html" "Node.js が見つかりません。Node.js v14 以上をインストールしてください。" error "" || true
  exit 1
fi

if [ ! -f "$SCRIPT_JS" ]; then
  "$NOTIFY" "convert-md2html" "convert-md2html.js が見つかりません: $SCRIPT_JS" error "" || true
  exit 1
fi

# --- 引数: モード + 入力パス群 -------------------------------------------
MODE="${1:-plain}"
shift || true

case "$MODE" in
  plain|nav) ;;
  *)
    "$NOTIFY" "convert-md2html" "不明なモード: $MODE (plain|nav)" error "" || true
    exit 1
    ;;
esac

if [ "$#" -eq 0 ]; then
  "$NOTIFY" "convert-md2html" "変換対象が選択されていません。" error "" || true
  exit 1
fi

# --- 出力先フォルダ選択ダイアログ ----------------------------------------
# 初期表示位置は最初の入力（ファイル/フォルダ）の親フォルダにする。
# osascript はユーザがキャンセルすると exit 1 を返す → set -e を一時無効化

first_input="${1:-}"
default_dir=""
if [ -n "$first_input" ] && [ -e "$first_input" ]; then
  default_dir="$(cd "$(dirname "$first_input")" 2>/dev/null && pwd)" || default_dir=""
fi

set +e
if [ -n "$default_dir" ]; then
  # AppleScript 文字列内の \ と " をエスケープ
  esc_default=$(printf '%s' "$default_dir" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
  OUTDIR=$(/usr/bin/osascript -e "POSIX path of (choose folder with prompt \"変換結果の出力先フォルダを選択してください\" default location (POSIX file \"$esc_default\"))" 2>/dev/null)
else
  OUTDIR=$(/usr/bin/osascript -e 'POSIX path of (choose folder with prompt "変換結果の出力先フォルダを選択してください")' 2>/dev/null)
fi
OS_RC=$?
set -e
if [ "$OS_RC" -ne 0 ] || [ -z "${OUTDIR:-}" ]; then
  # キャンセル → 無音終了
  exit 0
fi
OUTDIR="${OUTDIR%/}"

if [ ! -d "$OUTDIR" ] || [ ! -w "$OUTDIR" ]; then
  "$NOTIFY" "convert-md2html" "出力先フォルダに書き込めません: $OUTDIR" error "" || true
  exit 1
fi

# --- ログ ----------------------------------------------------------------
LOG="/tmp/convert-md2html-$(date +%Y%m%d-%H%M%S)-$$.log"
{
  echo "==== convert-md2html (mode=$MODE) $(date '+%Y-%m-%d %H:%M:%S') ===="
  echo "REPO_ROOT : $REPO_ROOT"
  echo "NODE_BIN  : $NODE_BIN"
  echo "OUTDIR    : $OUTDIR"
  echo "INPUTS    :"
  for p in "$@"; do
    echo "  - $p"
  done
  echo "-----------------------------------------------------"
} >"$LOG" 2>&1

# --- 変換ループ ----------------------------------------------------------
ok=0
ng=0
skipped=0

run_node() {
  # $1=input $2=output $3=with_nav(0|1)
  local in="$1" out="$2" with_nav="$3"
  if [ "$with_nav" = "1" ]; then
    "$NODE_BIN" "$SCRIPT_JS" "$in" "$out" --nav >>"$LOG" 2>&1
  else
    "$NODE_BIN" "$SCRIPT_JS" "$in" "$out" >>"$LOG" 2>&1
  fi
}

for input in "$@"; do
  if [ ! -e "$input" ]; then
    echo "[SKIP] not found: $input" >>"$LOG"
    skipped=$((skipped+1))
    continue
  fi

  if [ -d "$input" ]; then
    name=$(basename "$input")
    out="$OUTDIR/${name}_html"
    nav_flag=0
    [ "$MODE" = "nav" ] && nav_flag=1
    echo "[DIR ] $input -> $out (nav=$nav_flag)" >>"$LOG"
    if run_node "$input" "$out" "$nav_flag"; then
      ok=$((ok+1))
    else
      ng=$((ng+1))
      echo "[FAIL] $input" >>"$LOG"
    fi
  elif [ -f "$input" ]; then
    lower=$(echo "$input" | tr '[:upper:]' '[:lower:]')
    case "$lower" in
      *.md|*.csv)
        base=$(basename "$input")
        stem="${base%.*}"
        out="$OUTDIR/${stem}.html"
        # ファイル単体は MODE=nav でも --nav 抜きで実行（仮変換）
        echo "[FILE] $input -> $out (forced plain)" >>"$LOG"
        if run_node "$input" "$out" 0; then
          ok=$((ok+1))
        else
          ng=$((ng+1))
          echo "[FAIL] $input" >>"$LOG"
        fi
        ;;
      *)
        echo "[SKIP] unsupported extension: $input" >>"$LOG"
        skipped=$((skipped+1))
        ;;
    esac
  else
    echo "[SKIP] not file/dir: $input" >>"$LOG"
    skipped=$((skipped+1))
  fi
done

# --- 通知 ----------------------------------------------------------------
mode_label="変換"
[ "$MODE" = "nav" ] && mode_label="変換(ナビ付き)"

summary="${mode_label}: OK=${ok} NG=${ng} SKIP=${skipped}"
detail="出力先: $OUTDIR"

if [ "$ng" -gt 0 ]; then
  "$NOTIFY" "convert-md2html (失敗あり)" "${summary} / ${detail}" error "$LOG" || true
  exit 1
else
  "$NOTIFY" "convert-md2html" "${summary} / ${detail}" info "$LOG" || true
fi
