#!/bin/bash
# notify.sh — macOS 通知センター / ダイアログを表示する薄いラッパー
# 使い方: notify.sh <title> <message> <level: info|error> [<log_path>]
# - level=info  : 通知センターにバナー表示のみ
# - level=error : 通知センター + ダイアログ表示。log_path があれば「ログを開く」ボタン付き

set -eu

title="${1:-convert-md2html}"
message="${2:-}"
level="${3:-info}"
logpath="${4:-}"

# AppleScript 文字列内の " と \ をエスケープ
escape_as() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

e_title=$(escape_as "$title")
e_msg=$(escape_as "$message")

# 通知センターのバナー
/usr/bin/osascript -e "display notification \"$e_msg\" with title \"$e_title\"" >/dev/null 2>&1 || true

if [ "$level" = "error" ]; then
  if [ -n "$logpath" ] && [ -f "$logpath" ]; then
    e_log=$(escape_as "$logpath")
    btn=$(/usr/bin/osascript <<APPLESCRIPT 2>/dev/null || echo OK
display dialog "$e_msg

ログ: $e_log" with title "$e_title" buttons {"ログを開く", "OK"} default button "OK" with icon stop
return button returned of result
APPLESCRIPT
)
    if [ "$btn" = "ログを開く" ]; then
      /usr/bin/open "$logpath" >/dev/null 2>&1 || true
    fi
  else
    /usr/bin/osascript -e "display dialog \"$e_msg\" with title \"$e_title\" buttons {\"OK\"} default button \"OK\" with icon stop" >/dev/null 2>&1 || true
  fi
fi
