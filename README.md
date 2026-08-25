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

入手経路によって手順が変わります。

| 入手方法 | 手順 |
| --- | --- |
| npm から入れる | [npm からインストールする](#npm-からインストールする) |
| ZIP ファイルを受け取った・ダウンロードした | [ZIP ファイルから使う](#zip-ファイルから使う) |
| スタイルを編集する・macOS の Finder 連携を使う | [リポジトリから利用する](#リポジトリから利用する) |

いずれの方法でも Node.js 14.0.0 以降が必要です。未インストールの場合は、[Node.js 公式サイト](https://nodejs.org/) から LTS 版を導入し、次のコマンドで確認してください。

```bash
node --version
npm --version
```

### npm からインストールする

```bash
npm install -g convert-md2html
```

`convert-md2html` コマンドがどのディレクトリからでも使えるようになります。

```bash
convert-md2html example.md example.html
```

インストールせずに 1 回だけ試すこともできます。

```bash
npx convert-md2html example.md example.html
```

### ZIP ファイルから使う

配布された ZIP ファイルや、GitHub の [Releases](https://github.com/dvctrad/convert-md2html/releases) からダウンロードした ZIP を使う場合の手順です。

**1. ZIP を展開する**

任意のフォルダに展開してください。展開先のパスに空白や日本語が含まれていても動作します。

Windows でダウンロードした ZIP は、展開する前に**ブロックを解除**してください。解除しないと、展開後のファイルが警告つきで扱われることがあります。

- ZIP ファイルを右クリック → プロパティ → 全般タブ下部の「セキュリティ: このファイルは他のコンピューターから…」にある**「ブロックの解除」にチェック** → OK

**2. 展開したフォルダでコマンドラインを開く**

- **Windows**: エクスプローラで展開先フォルダを開き、アドレスバーに `cmd` と入力して Enter
- **macOS / Linux**: ターミナルで `cd` して移動

**3. 依存パッケージをインストールする**

```bash
npm install
```

展開したフォルダに `node_modules` フォルダが最初から含まれている場合、この手順は不要です。

**4. 変換を実行する**

```bash
node convert-md2html.js example.md example.html
```

以降の使用例に出てくる `convert-md2html` は、この方法では `node convert-md2html.js` に読み替えてください。

**macOS で ZIP を使う場合の追加手順**

ダウンロードしたファイルには隔離属性が付くため、同梱のシェルスクリプトを実行しようとすると「開発元を検証できません」と表示されることがあります。展開先フォルダで次を実行してください。

```bash
xattr -dr com.apple.quarantine .
```

展開に使ったツールによっては実行権限が失われる場合があります。`Permission denied` と表示されたときは、あわせて次を実行してください。

```bash
chmod +x convert-md2html.sh mac/install.sh mac/uninstall.sh mac/bin/*.sh
```

**更新について**

ZIP は自動では更新されません。最新版と変更点は [Releases](https://github.com/dvctrad/convert-md2html/releases) で確認し、新しい ZIP を展開し直してください。

### リポジトリから利用する

スタイルを直接編集したい場合や、macOS の Finder 連携を使う場合はリポジトリを取得してください。

```bash
git clone https://github.com/dvctrad/convert-md2html.git
cd convert-md2html
npm install
```

`npm install` は初回のみ必要です。依存パッケージは [package.json](package.json) に記載されており、コマンドで個別に指定する必要はありません。

この形で使う場合、以降の例の `convert-md2html` は `node convert-md2html.js` に読み替えてください。

## 使い方

### 単一ファイルの変換

```bash
convert-md2html <入力ファイル> <出力ファイル>
```

```bash
convert-md2html example.md example.html
convert-md2html data.csv table.html
```

Windows でリポジトリから利用する場合は、同梱のバッチファイルからも実行できます。

```cmd
convert-md2html.bat example.md example.html
convert-md2html.bat C:\documents\example.md C:\output\example.html
```

PowerShell から実行する場合は `.\convert-md2html.bat` のようにパスを明示してください。

### ディレクトリの一括変換

```bash
convert-md2html <入力ディレクトリ> <出力ディレクトリ>
```

```bash
convert-md2html docs html
```

サブディレクトリも含めて再帰的に変換し、出力先のフォルダが存在しない場合は自動的に作成します。変換に失敗したファイルがあっても、残りの処理は継続します。

### オプション

| オプション | 説明 |
| --- | --- |
| `--nav`, `--navigation` | 左側にサイドバーナビゲーションを付ける（ディレクトリ変換時のみ有効） |
| `--fit-tables` | 横長の表を画面・用紙の幅に収める |
| `--css <ファイル>` | 追加の CSS を埋め込んで見た目を上書きする（複数指定可） |

```bash
convert-md2html docs html --nav --fit-tables --css theme.css
```

### ナビゲーション付きの変換

```bash
convert-md2html docs html --nav
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
convert-md2html input.md output.html --fit-tables
```

### 見た目のカスタマイズ

配色・フォント・余白は、`--css` で渡した CSS で上書きできます。

```bash
convert-md2html input.md output.html --css theme.css
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

macOS では、Finder のクイックアクションメニューから変換できます。この連携はリポジトリを取得して使います。

```bash
git clone https://github.com/dvctrad/convert-md2html.git
cd convert-md2html
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

```text
Converted README.md to output.html
```

ディレクトリの一括変換:

```text
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
| [コントリビューション](CONTRIBUTING.md) | 不具合報告・要望・Pull Request の手引き |
| [設計書兼機能仕様書](DESIGN.md) | 内部構造・処理フロー・各関数の仕様 |

## ファイル構成

| パス | 内容 |
| --- | --- |
| `convert-md2html.js` | 変換処理の本体 |
| `convert-md2html.bat` | Windows 用の実行スクリプト |
| `convert-md2html.sh` | macOS / Linux 用の実行スクリプト |
| `styles/base.css` | 生成される HTML の既定スタイル |
| `docs/` | 利用者向けの補足ドキュメント |
| `mac/` | macOS のクイックアクション連携一式 |
| `DESIGN.md` | 設計書兼機能仕様書 |

npm パッケージ名・コマンド名はいずれも `convert-md2html` です。

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
| モジュールが見つからないというエラーが出る | リポジトリから利用している場合、`npm install` を実行済みか |
| `convert-md2html` コマンドが見つからない | `npm install -g convert-md2html` を実行済みか、npm のグローバル bin が PATH に入っているか（`npm prefix -g` で確認） |
| 実行できない | Node.js 14.0.0 以降がインストールされているか |
| `Error: Cannot find module 'markdown-it'` と表示される | 展開先フォルダで `npm install` を実行済みか（`node_modules` があるか） |
| macOS で `Permission denied` と表示される | `chmod +x convert-md2html.sh mac/bin/*.sh` を実行したか |
| macOS で「開発元を検証できません」と表示される | `xattr -dr com.apple.quarantine .` を実行したか |
| 出力されない | 出力先フォルダに書き込み権限があるか |
| 数式や図表が表示されない | インターネットに接続されているか（KaTeX / Mermaid は CDN 参照） |
| HTML がそのまま文字として表示される | [Markdown 内で HTML を使う](docs/html-in-markdown.md) の記法ルール |

## サポート

不具合の報告や機能の要望は、本リポジトリの Issue でお知らせください。Pull Request も歓迎します。詳しくは [コントリビューション](CONTRIBUTING.md) を参照してください。

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
