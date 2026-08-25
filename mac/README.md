# macOS 連携（Finder 右クリックから変換）

`convert-md2html` を macOS の Finder クイックアクションから呼び出せるようにする一式です。
インストールすると、Finder で `.md` / `.csv` ファイルや任意のフォルダを右クリックして
「Convert to HTML」または「Convert to HTML (with Nav)」を選ぶだけで変換できます。

## 動作要件

- macOS 10.14 (Mojave) 以降
- Node.js v14 以上（[公式サイト](https://nodejs.org/) または Homebrew 経由）
- リポジトリの `node_modules/` が `npm install` 済みであること

## インストール

```bash
cd /path/to/convert-md2html
npm install            # 初回のみ
cd mac
./install.sh
```

`install.sh` は次のことをします:

1. `mac/services/Convert to HTML.workflow` と `Convert to HTML (with Nav).workflow`
   を `~/Library/Services/` にコピー
2. それぞれの `document.wflow` 内のプレースホルダ `__REPO_PATH__` を
   実際のリポジトリ絶対パスに置換
3. `pbs -flush` でサービスキャッシュを更新

## 使い方

1. Finder で対象を選択（複数選択 OK）
   - `.md` ファイル
   - `.csv` ファイル
   - フォルダ
   - これらの混在選択
2. 右クリック → 「クイックアクション」サブメニュー
3. 次のいずれかを選択
   - **Convert to HTML** ... 通常変換
   - **Convert to HTML (with Nav)** ... サイドバーナビ付き変換
4. 出力先フォルダを尋ねるダイアログが出るので保存先を選ぶ（初期位置は最初に選んだファイル/フォルダの親フォルダ）
5. 完了すると通知センターにバナーが表示される

### 出力先の命名規則

| 入力 | 出力 |
|---|---|
| `foo.md` | `<選択フォルダ>/foo.html` |
| `data.csv` | `<選択フォルダ>/data.html` |
| `docs/` フォルダ | `<選択フォルダ>/docs_html/` を作成、再帰変換 |
| 複数選択 | 各々を上記ルールで個別に処理 |

`Convert to HTML (with Nav)` を **ファイル単体** に対して実行した場合は、
ナビゲーションはディレクトリ単位の機能のため `--nav` を無視して通常変換します。
フォルダ入力時のみナビが付与されます。

## 初回起動時に表示されない場合

- システム設定 → キーボード → キーボードショートカット → サービス
- 一覧から「Convert to HTML」「Convert to HTML (with Nav)」のチェックを ON

macOS 12 以前は「システム環境設定」→「キーボード」→「ショートカット」→「サービス」。

## アンインストール

```bash
cd mac
./uninstall.sh
```

## トラブルシューティング

### 「Node.js が見つかりません」と通知される

`/usr/local/bin/node`, `/opt/homebrew/bin/node`, `~/.nvm/versions/node/*` の順で探索しています。
nvm 利用時に違うパスにある場合は、`mac/bin/convert-finder.sh` の `find_node` 関数を
お使いの環境に合わせて編集してください。

### Finder で右クリックしてもメニューに出てこない

- `~/Library/Services/Convert to HTML.workflow` が存在するか確認
- 不在の場合: `./install.sh` を再実行
- 存在する場合: `/System/Library/CoreServices/pbs -flush` してから Finder を再起動
  （`killall Finder`）

### ログを見たい

変換ごとに `/tmp/convert-md2html-YYYYMMDD-HHMMSS-<pid>.log` を生成します。
失敗時のダイアログに「ログを開く」ボタンが表示されます。

### Gatekeeper で警告が出る

`~/Library/Services/` への配置は通常 Gatekeeper 対象外ですが、初回実行時にダイアログが
出た場合は「許可」を選び、必要なら システム設定 → プライバシーとセキュリティ → 
セキュリティ で「このまま開く」を選択してください。

## リポジトリを移動したら

リポジトリ自体を別の場所に移動した場合は、`document.wflow` 内に焼き込まれている
絶対パスが古くなります。`./install.sh` を再実行すれば再置換されます。

## ファイル構成

```
mac/
├── README.md                                ... このドキュメント
├── install.sh                               ... ~/Library/Services/ へ配置
├── uninstall.sh                             ... 配置済みを削除
├── bin/
│   ├── convert-finder.sh                    ... Quick Action から呼ばれる本処理
│   └── notify.sh                            ... 通知センター / ダイアログ表示
└── services/
    ├── Convert to HTML.workflow/            ... 通常変換用 Quick Action
    └── Convert to HTML (with Nav).workflow/ ... ナビ付き変換用 Quick Action
```
