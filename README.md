# convert-md2html

Markdown ファイルと CSV ファイルを、そのままブラウザで読める HTML に変換するコマンドラインツールです。

- **Markdown (.md)**: シンタックスハイライト、Mermaid 図表、数式（KaTeX）、見出しリンクに対応
- **CSV (.csv)**: 先頭行をヘッダーとして扱う見やすいテーブルに変換

ディレクトリを指定すると、配下の `.md` / `.csv` を再帰的に探し、ディレクトリ構造を保ったまま一括変換します。サイドバーナビゲーション付きの文書セットも生成できます。

## 動作環境

- Node.js 14.0.0 以降
- Windows 10 以降 / macOS 10.14 (Mojave) 以降 / Linux
- 表示にはモダンブラウザ（Microsoft Edge、Chrome、Safari など）

数式と図表は KaTeX / Mermaid を CDN から読み込むため、それらを含む HTML の閲覧にはインターネット接続が必要です。

## インストール

```bash
git clone <リポジトリURL> convert-md2html
cd convert-md2html
npm install
```

`npm install` は初回のみ必要です。依存パッケージは [package.json](package.json) に記載されており、コマンドで個別に指定する必要はありません。

Node.js が未インストールの場合は、[Node.js 公式サイト](https://nodejs.org/) から LTS 版を導入し、次のコマンドでバージョンを確認してください。

```bash
node --version
npm --version
```

## 使い方

### 単一ファイルの変換

```bash
node convert-md2html.js <入力ファイル> <出力ファイル>
```

```bash
node convert-md2html.js example.md example.html
node convert-md2html.js data.csv table.html
```

Windows では同梱のバッチファイルからも実行できます。

```cmd
convert-md2html.bat example.md example.html
convert-md2html.bat C:\documents\example.md C:\output\example.html
```

PowerShell から実行する場合は `.\convert-md2html.bat` のようにパスを明示してください。

### ディレクトリの一括変換

```bash
node convert-md2html.js <入力ディレクトリ> <出力ディレクトリ>
```

```bash
node convert-md2html.js docs html
```

サブディレクトリも含めて再帰的に変換し、出力先のフォルダが存在しない場合は自動的に作成します。変換に失敗したファイルがあっても、残りの処理は継続します。

### オプション

| オプション | 説明 |
| --- | --- |
| `--nav`, `--navigation` | 左側にサイドバーナビゲーションを付ける（ディレクトリ変換時のみ有効） |
| `--fit-tables` | 横長の表を画面・用紙の幅に収める |
| `--css <ファイル>` | 追加の CSS を埋め込んで見た目を上書きする（複数指定可） |

```bash
node convert-md2html.js docs html --nav --fit-tables --css theme.css
```

### ナビゲーション付きの変換

```bash
node convert-md2html.js docs html --nav
```

- 左側の固定サイドバーに、全ページへのリンクが階層表示されます
- フォルダの展開・折りたたみ状態はブラウザに保存されます
- 表示中のページがハイライトされます
- サイドバーの幅はドラッグで変更でき、幅も保存されます
- Markdown の最初の見出し（`# タイトル`）がメニューの表示名になります
- 画面幅が狭い環境では、サイドバーが上部に折り返して表示されます

### 表の幅の扱い

既定では、横長の表は列幅を保ったまま横スクロールできる形で出力します。印刷などで表全体をページ幅に収めたい場合は `--fit-tables` を指定してください。

```bash
node convert-md2html.js input.md output.html --fit-tables
```

### 見た目のカスタマイズ

配色・フォント・余白は、`--css` で渡した CSS で上書きできます。

```bash
node convert-md2html.js input.md output.html --css theme.css
```

```css
/* theme.css */
:root {
    --color-accent: #c2185b;
    --font-size-base: 16px;
}
```

指定できるデザイントークンの一覧と、より踏み込んだ変更方法は [デザインのカスタマイズ](docs/theming.md) を参照してください。

## macOS の Finder から実行する

macOS では、Finder のクイックアクションメニューから変換できます。

```bash
cd /path/to/convert-md2html
npm install     # 初回のみ
cd mac
./install.sh
```

インストール後、`.md` / `.csv` ファイルやフォルダを右クリックし、「クイックアクション」から次のいずれかを選びます。

- **Convert to HTML**: 通常の変換
- **Convert to HTML (with Nav)**: サイドバーナビ付きの変換（フォルダを選んだときのみナビが付きます）

出力先フォルダは実行のたびにダイアログで指定します。詳しい手順・トラブルシューティング・アンインストール方法は [macOS 連携](mac/README.md) を参照してください。

## 出力例

単一ファイルの変換:

```
Converted README.md to output.html
```

ディレクトリの一括変換:

```
Processing directory: ./docs
Found 3 convertible files (2 markdown, 1 csv)
Converting: readme.md -> readme.html
Converting: guide/setup.md -> guide/setup.html
Converting: data/list.csv -> data/list.html
Conversion completed: 3 files processed successfully
```

## ドキュメント

| ドキュメント | 内容 |
| --- | --- |
| [Markdown 内で HTML を使う](docs/html-in-markdown.md) | Markdown に HTML を埋め込む際の書き方と注意点 |
| [デザインのカスタマイズ](docs/theming.md) | 配色・フォント・レイアウトを CSS で変更する方法 |
| [macOS 連携](mac/README.md) | Finder のクイックアクションから実行する設定 |

## ファイル構成

| パス | 内容 |
| --- | --- |
| `convert-md2html.js` | 変換処理の本体 |
| `convert-md2html.bat` | Windows 用の実行スクリプト |
| `convert-md2html.sh` | macOS / Linux 用の実行スクリプト |
| `styles/base.css` | 生成される HTML の既定スタイル |
| `docs/` | 各種ドキュメント |
| `mac/` | macOS のクイックアクション連携一式 |

## 注意事項

- Markdown ファイルは有効な Markdown 形式である必要があります。
- CSV ファイルはカンマ区切りで、最初の行がヘッダーとして扱われます。ダブルクォートで囲まれた値にも対応しています。
- ページタイトルには、Markdown は最初の見出し、CSV はファイル名が使われます。
- 出力先に同名のファイルがある場合は上書きされます。
- 入力・出力のパスは相対パス・絶対パスのどちらでも指定できます。
- ナビゲーション機能はディレクトリ変換でのみ利用できます。

## トラブルシューティング

| 症状 | 確認すること |
| --- | --- |
| ファイルが見つからないというエラーが出る | 入力ファイルのパスと名前が正しいか |
| モジュールが見つからないというエラーが出る | `npm install` を実行済みか |
| 実行できない | Node.js 14.0.0 以降がインストールされているか |
| 出力されない | 出力先フォルダに書き込み権限があるか |
| 数式や図表が表示されない | インターネットに接続されているか（KaTeX / Mermaid は CDN 参照） |
| HTML がそのまま文字として表示される | [Markdown 内で HTML を使う](docs/html-in-markdown.md) の記法ルール |

## サポート

不具合や要望は、本リポジトリの Issue でご報告ください。

## ライセンス

本ツールは [MIT License](LICENSE) で公開しています。

Copyright (c) 2024-2026 Digital Value Consulting Inc.（デジタルバリューコンサルティング株式会社）

利用・改変・再配布・商用利用のいずれも自由に行えます。ただし、複製物や実質的な部分を再配布する際は、上記の著作権表示と MIT License の全文を含めてください。本ツールは「現状のまま」提供され、いかなる保証もありません。

### 依存ライブラリのライセンス

本ツールが利用する外部パッケージは、すべて許諾型ライセンスです。

| パッケージ | ライセンス |
| --- | --- |
| markdown-it | MIT |
| markdown-it-mermaid | MIT |
| markdown-it-texmath | MIT |
| markdown-it-anchor | Unlicense |
| katex | MIT |
| prismjs | MIT |
| github-slugger | ISC |

生成される HTML は Prism / KaTeX / Mermaid を CDN から読み込みます（ライブラリ本体は同梱していません）。
