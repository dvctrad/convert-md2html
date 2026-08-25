# convert-md2html 設計書兼機能仕様書

| 項目 | 内容 |
|------|------|
| ドキュメント種別 | 設計書兼機能仕様書 |
| 対象システム | convert-md2html |
| 対象バージョン | 1.0.1 |
| 対象読者 | 開発者・保守担当者 |
| 関連ドキュメント | README.md（利用者向け使用方法）、docs/html-in-markdown.md（Markdown内HTML記述ガイド）、docs/theming.md（デザインカスタマイズ）、CONTRIBUTING.md（変更提案の手引き） |

---

## 1. システム概要

### 1.1 目的

本ツールは、Markdown（`.md`）ファイルおよびCSV（`.csv`）ファイルを、スタイル付きHTMLファイルに変換するNode.js製コマンドラインツールである。技術文書の一括HTML化を主な用途とし、シンタックスハイライト・LaTeX数式・Mermaidダイアグラムなどの拡張記法に対応する。

### 1.2 主要機能

| 機能 | 説明 |
|------|------|
| Markdown→HTML変換 | markdown-itによる高機能変換（HTML埋め込み・コードハイライト・数式・図表） |
| CSV→HTMLテーブル変換 | ヘッダー行付きHTMLテーブルへの変換（クォート対応CSV解析） |
| ディレクトリ一括変換 | 再帰的ファイル検索によるバッチ変換（ディレクトリ構造維持） |
| ナビゲーションサイドバー | 階層ツリー型サイドバー付きHTML生成（`--nav`オプション） |
| PJAX遷移 | ページ全体リロードなしのSPA風ページ遷移 |
| レスポンシブデザイン | 768pxブレークポイントでのモバイル対応 |

### 1.3 動作環境

| 項目 | 要件 |
|------|------|
| OS | Windows 10以降 / Linux / macOS |
| ランタイム | Node.js 14.0.0以降 |
| ブラウザ | モダンブラウザ（Microsoft Edge、Chrome、Safari など） |

---

## 2. アーキテクチャ

### 2.1 全体構成

```text
┌─────────────────────────────────────────────────────┐
│                   CLI（process.argv）                │
│          引数解析・入力パス種別判定                    │
└──────────┬──────────────────────┬────────────────────┘
           │                      │
     ファイル入力            ディレクトリ入力
           │                      │
           ▼                      ▼
   processSingleFile()     processDirectory()
           │                      │
           │               findConvertibleFiles()
           │               collectNavigationData()  ← --nav時のみ
           │                      │
           ▼                      ▼
  ┌────────────────────────────────────────┐
  │        ファイル形式別変換処理            │
  │  .md → markdown-it (md.render)         │
  │  .csv → parseCSV() → csvToHTML()       │
  └────────────────┬───────────────────────┘
                   │
                   ▼
          generateHTML()
          └─ generateNavigationHTML()  ← --nav時のみ
                   │
                   ▼
            HTMLファイル出力
```

### 2.2 ファイル構成

| ファイル | 役割 |
|----------|------|
| `convert-md2html.js` | メインスクリプト（全処理ロジック、HTMLテンプレート、クライアントサイドJSを含む単一ファイル構成） |
| `styles/base.css` | 生成HTMLに埋め込まれる既定スタイル（デザイントークン定義を含む） |
| `convert-md2html.bat` | Windows用バッチラッパー（Node.jsの呼び出しを簡略化） |
| `convert-md2html.sh` | macOS / Linux用シェルラッパー |
| `package.json` | パッケージ定義（依存パッケージ・`bin`・npm 公開設定） |
| `README.md` | 利用者向け使用方法ドキュメント |
| `docs/html-in-markdown.md` | Markdown内HTML記述のベストプラクティスガイド |
| `docs/theming.md` | CSSによるデザインカスタマイズの手引き |
| `CONTRIBUTING.md` | 不具合報告・Pull Requestの手引き |
| `LICENSE` | MIT License 全文 |
| `mac/bin/convert-finder.sh` | macOS Finder クイックアクションのエントリポイント。Node.js 解決・出力先選択・変換ループ・通知を担う |
| `mac/bin/notify.sh` | `osascript` で通知センター / ダイアログを表示する薄いラッパー |
| `mac/services/Convert to HTML.workflow/` | Finder 右クリック用 Quick Action（通常変換） |
| `mac/services/Convert to HTML (with Nav).workflow/` | Finder 右クリック用 Quick Action（ナビ付き変換） |
| `mac/install.sh` / `mac/uninstall.sh` | `~/Library/Services/` への配置・撤去スクリプト |

### 2.3 依存ライブラリ

| ライブラリ | バージョン | 用途 |
|------------|-----------|------|
| `markdown-it` | ^14.1.0 | Markdownパーサー/レンダラー（コア変換エンジン） |
| `prismjs` | ^1.29.0 | コードブロックのシンタックスハイライト |
| `katex` | ^0.16.45 | LaTeX数式のHTML/MathMLレンダリング |
| `markdown-it-texmath` | ^1.0.0 | markdown-it用LaTeX数式プラグイン（`$...$`/`$$...$$`記法） |
| `markdown-it-mermaid` | ^0.2.5 | package.jsonに定義あり（実際にはカスタムfenceレンダラーで独自実装） |

**CDN依存（クライアントサイド）:**

| リソース | バージョン | 用途 |
|----------|-----------|------|
| Prism CSS | 1.24.1 | コードブロック用テーマ（prism-tomorrow） |
| Prism JS | 1.24.1 | クライアントサイドのシンタックスハイライト |
| KaTeX CSS | 0.16.22 | 数式表示用スタイルシート |
| Mermaid JS | 10.6.1 | ダイアグラムのクライアントサイドレンダリング |

---

## 3. 処理フロー

### 3.1 コマンドライン引数解析

```text
process.argv
  │
  ├─ --nav / --navigation フラグ検出 → hasNavigation = true/false
  ├─ --fit-tables フラグ検出 → fitTables = true/false
  ├─ --css <file> / --css=<file> を収集 → customCssFiles[]（複数指定可）
  ├─ フラグ・オプションを除いた位置引数から inputPath, outputPath を取得
  │
  ├─ styles/base.css を読み込み → baseCss
  ├─ customCssFiles を読み込み → customCss（baseCss の後ろに連結）
  │
  ├─ 引数不足 → エラーメッセージ出力 + process.exit(1)
  │
  └─ fs.statSync(inputPath)
       ├─ ディレクトリ → processDirectory()
       └─ ファイル → processSingleFile()
```

### 3.2 単一ファイル変換フロー（processSingleFile: 行295〜356）

```text
1. 出力ディレクトリの自動作成（recursive: true）
2. ファイルサイズチェック（0バイト → エラー終了）
3. 拡張子判定
   ├─ .md → md.render() でHTML変換 → 最初の # 見出しをタイトル抽出
   ├─ .csv → parseCSV() + csvToHTML() → ファイル名をタイトルに使用
   └─ その他 → エラー終了
4. generateHTML(title, content) でHTML文書生成
5. fs.writeFileSync() で出力
```

### 3.3 ディレクトリ一括変換フロー（processDirectory: 行359〜457）

```text
1. 出力ディレクトリの自動作成
2. findConvertibleFiles() で .md/.csv を再帰検索
3. --nav 指定時: collectNavigationData() でメタデータ収集
4. 各ファイルに対して:
   a. 相対パス計算 → 出力パス決定（拡張子を .html に置換）
   b. 出力サブディレクトリの自動作成
   c. 空ファイルチェック（0バイト → スキップ + 警告）
   d. 拡張子別変換（.md / .csv）
   e. generateHTML() でHTML生成（--nav時はナビゲーションデータを渡す）
   f. ファイル書き出し
5. 成功/失敗件数のサマリー出力
```

**エラー継続方式**: 個別ファイルのエラーは try-catch で捕捉し、errorCount をインクリメントして処理を継続する。全体の中断は行わない。

---

## 4. モジュール・関数仕様

### 4.1 parseCSV(csvContent)

| 項目 | 内容 |
|------|------|
| 位置 | 行122〜158 |
| 引数 | `csvContent` (string) — CSV形式の文字列 |
| 戻り値 | `string[][]` — 2次元配列（行×列） |
| 処理 | 1文字ずつ走査し、カンマ区切り・ダブルクォート囲み・エスケープクォート（`""`）に対応したCSVパーサー |

**解析ルール:**
- フィールド区切り: カンマ（`,`）
- クォート: ダブルクォート（`"`）で囲んだフィールド内のカンマはリテラル扱い
- エスケープ: クォート内の `""` は単一の `"` として解釈
- 各フィールドはtrim処理される

### 4.2 csvToHTML(csvContent)

| 項目 | 内容 |
|------|------|
| 位置 | 行161〜194 |
| 引数 | `csvContent` (string) — CSV形式の文字列 |
| 戻り値 | `string` — HTMLテーブル文字列 |
| 処理 | parseCSV()で解析後、1行目を`<thead>`、2行目以降を`<tbody>`として構造化テーブルHTMLを生成。各セル値はescapeHtml()でエスケープ |

**出力HTML構造:**
```html
<table>
  <thead>
    <tr><th>ヘッダー1</th><th>ヘッダー2</th></tr>
  </thead>
  <tbody>
    <tr><td>データ1</td><td>データ2</td></tr>
  </tbody>
</table>
```

空データの場合は `<p>CSVファイルが空です。</p>` を返す。

### 4.3 escapeHtml(text)

| 項目 | 内容 |
|------|------|
| 位置 | 行197〜206 |
| 引数 | `text` (string) — エスケープ対象の文字列 |
| 戻り値 | `string` — HTMLエスケープ済み文字列 |
| 処理 | XSS防止のため、5種の特殊文字を実体参照に置換 |

**置換マッピング:**

| 文字 | 実体参照 |
|------|----------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#039;` |

### 4.4 processSingleFile(inputFile, outputFile)

| 項目 | 内容 |
|------|------|
| 位置 | 行295〜356 |
| 引数 | `inputFile` (string) — 入力ファイルパス、`outputFile` (string) — 出力ファイルパス |
| 戻り値 | なし（ファイル出力） |
| 処理 | 単一ファイルの変換処理。詳細は「3.2 単一ファイル変換フロー」参照 |
| エラー時 | エラーメッセージ + スタックトレース出力後、process.exit(1) |

### 4.5 processDirectory(inputDir, outputDir)

| 項目 | 内容 |
|------|------|
| 位置 | 行359〜457 |
| 引数 | `inputDir` (string) — 入力ディレクトリパス、`outputDir` (string) — 出力ディレクトリパス |
| 戻り値 | なし（ファイル出力） |
| 処理 | ディレクトリ内の全変換可能ファイルを一括変換。詳細は「3.3 ディレクトリ一括変換フロー」参照 |
| エラー時 | ファイル単位でエラーを捕捉し、処理を継続。最後にサマリー出力 |

### 4.6 findConvertibleFiles(dir)

| 項目 | 内容 |
|------|------|
| 位置 | 行460〜478 |
| 引数 | `dir` (string) — 検索対象ディレクトリパス |
| 戻り値 | `string[]` — 変換可能ファイルの絶対パス配列 |
| 処理 | fs.readdirSync + fs.statSync による再帰的ファイル探索。拡張子が `.md` または `.csv`（大文字小文字不問）のファイルを収集 |

### 4.7 collectNavigationData(convertibleFiles, inputDir, outputDir)

| 項目 | 内容 |
|------|------|
| 位置 | 行481〜544 |
| 引数 | `convertibleFiles` (string[]) — ファイルパス配列、`inputDir` (string) — 入力ディレクトリ、`outputDir` (string) — 出力ディレクトリ |
| 戻り値 | `object` — ナビゲーションデータオブジェクト |
| 処理 | 各ファイルからタイトルを抽出し、ディレクトリ構造を反映したツリー構造を構築 |

**戻り値のデータ構造:**
```javascript
{
  files: {
    "path/to/file.html": {
      title: "ページタイトル",
      path: "path/to/file.html",
      originalPath: "path/to/file.md"
    }
  },
  structure: {
    "dirname": {
      type: "directory",
      children: {
        "filename.html": {
          type: "file",
          title: "ページタイトル",
          path: "path/to/filename.html"
        }
      }
    }
  }
}
```

**タイトル抽出ルール:**
- `.md` ファイル: 最初の `# 見出し` 行からタイトルを取得（正規表現: `/^#\s+(.+)$/m`）。見出しがない場合はファイル名（拡張子除く）
- `.csv` ファイル: ファイル名（拡張子除く）

### 4.8 generateNavigationHTML(navigationData, currentHtmlPath, currentFile, outputDir)

| 項目 | 内容 |
|------|------|
| 位置 | 行547〜619 |
| 引数 | `navigationData` (object) — ナビゲーションデータ、`currentHtmlPath` (string) — 現在のHTML相対パス、`currentFile` (string) — 現在の出力ファイル絶対パス、`outputDir` (string) — 出力ディレクトリ |
| 戻り値 | `string` — サイドバーナビゲーションHTML |
| 処理 | ツリー構造を再帰的にHTML（`<nav>` + `<ul>`/`<li>`）に変換 |

**ソート順序:**
1. ファイルが先、ディレクトリが後
2. 同種内では `localeCompare` による辞書順

**フォルダ初期状態:**
- デフォルト: 閉じた状態（`collapsed` クラス付与）
- 例外: アクティブページの祖先フォルダは自動的に開いた状態

**リンクパス計算:**
- 現在のファイル位置からターゲットファイルへの相対パスを `path.relative()` で算出
- パス区切りは `/` に正規化（Windows対応）

### 4.9 generateHTML(title, content, navigationData, currentFile, outputDir)

| 項目 | 内容 |
|------|------|
| 位置 | 行622〜885 |
| 引数 | `title` (string) — ページタイトル、`content` (string) — 変換済み本文HTML、`navigationData` (object\|null) — ナビゲーションデータ、`currentFile` (string\|null) — 現在のファイルパス、`outputDir` (string\|null) — 出力ディレクトリ |
| 戻り値 | `string` — 完全なHTML文書文字列 |
| 処理 | HTMLテンプレートにCSS・JavaScript・ナビゲーション・コンテンツを埋め込んだ完全なHTML文書を生成 |

**ナビゲーション有無による分岐:**

| 条件 | bodyClass | layoutClass | ナビゲーション |
|------|-----------|-------------|----------------|
| ナビゲーションなし | `""` | `markdown-body` | 非表示 |
| ナビゲーションあり | `with-navigation` | `content-with-nav` | サイドバー表示 |

---

## 5. Markdown変換仕様

### 5.1 markdown-it設定

| 設定項目 | 値 | 説明 |
|----------|-----|------|
| `html` | `true` | Markdown内のHTMLタグをそのまま出力に含める |
| `highlight` | カスタム関数 | Prism.jsによるシンタックスハイライト |

**対応言語（サーバーサイドハイライト）:**
- JavaScript（`prism-javascript`）
- Python（`prism-python`）
- Bash（`prism-bash`）

未対応言語の場合、highlight関数は空文字列を返し、markdown-itのデフォルトエスケープ処理が適用される。

### 5.2 LaTeX数式サポート

markdown-it-texmath プラグインにより、以下の記法をサポートする。

| 記法 | 種別 | 例 |
|------|------|-----|
| `$...$` | インライン数式 | `$E=mc^2$` |
| `$$...$$` | ブロック数式 | `$$\int_0^1 x\,dx = \frac{1}{2}$$` |

**KaTeX設定:**
- `throwOnError: false` — 不正なLaTeX構文でもエラーを投げずレンダリングを試行

### 5.3 Mermaidダイアグラム処理

markdown-itのfenceレンダラーをカスタムオーバーライドし、言語名が `mermaid` のコードブロックを特別処理する。

**処理フロー:**
```text
コードブロック（```mermaid）検出
  │
  ├─ 全角スペース（U+3000）→ 半角スペース（U+0020）に正規化
  ├─ Unicode矢印の正規化
  │    ├─ ←（U+2190）→ <-
  │    └─ →（U+2192）→ ->
  ├─ JCL構文自動修正（全角括弧【】を含む行は除外）
  │    ├─ =( → : （コロン＋スペース）
  │    ├─ 行末の ) → 削除
  │    ├─ ] 直前の ) → 削除
  │    └─ <br/> 直前の ) → 削除
  ├─ コメント記号（//）の除去
  │
  └─ <div class="mermaid">...</div> として出力
      ※ HTMLエスケープは行わない
```

**通常コードブロック（非mermaid）の処理:**
- highlight関数による言語別ハイライト適用
- ハイライト不可の場合はデフォルトHTMLエスケープ
- `<pre><code class="language-{lang}">...</code></pre>` 形式で出力

---

## 6. CSV変換仕様

### 6.1 CSV解析ロジック

parseCSV関数は、1文字ずつの逐次走査方式でCSVを解析する。RFC 4180に準拠した基本的なCSV形式に対応する。

**状態遷移:**
```text
初期状態 → 文字走査ループ
  │
  ├─ " → クォートモード切替（inQuotes トグル）
  │    └─ クォート内で "" → エスケープされたクォート（" 1文字として追加）
  ├─ , （クォート外）→ フィールド区切り（currentをrowに追加、currentリセット）
  └─ その他 → currentに文字追加
  │
  行末 → 最後のフィールドをrowに追加 → resultにrow追加
```

### 6.2 HTMLテーブル生成

- 1行目: `<thead>` 内の `<th>` 要素として出力
- 2行目以降: `<tbody>` 内の `<td>` 要素として出力
- 全セル値: `escapeHtml()` によるXSS対策済み

---

## 7. ナビゲーションシステム仕様

### 7.1 概要

`--nav`（または `--navigation`）オプションを指定してディレクトリ変換を行うと、各HTMLファイルに左サイドバー型ナビゲーションが付与される。ナビゲーションはディレクトリ構造をツリー形式で表示し、全ページへのリンクを提供する。

### 7.2 ナビゲーションデータ構造

collectNavigationData関数が生成するデータは2つの構造を持つ。

**files**: フラットなファイルマップ（HTMLパス → メタデータ）
- ページ遷移時のタイトル解決に使用

**structure**: 入れ子のディレクトリツリー
- ナビゲーションHTML生成の元データ
- 各ノードは `type`（`"directory"` or `"file"`）で区別

### 7.3 サイドバーHTML構造

```html
<nav class="navigation-sidebar">
  <div class="nav-title">📚 ドキュメント</div>
  <div class="nav-folder-actions">
    <button class="nav-expand-all">▼ すべて開く</button>
    <button class="nav-collapse-all">▶ すべて閉じる</button>
  </div>
  <ul class="nav-tree">
    <li class="nav-folder collapsed">
      <div class="nav-folder-toggle">
        <span class="nav-folder-icon">▼</span>
        フォルダ名
      </div>
      <ul class="nav-folder-children nav-tree">
        <li class="nav-file">
          <a href="相対パス" class="nav-file-link active">ページタイトル</a>
        </li>
      </ul>
    </li>
  </ul>
</nav>
```

### 7.4 フォルダ展開/折りたたみ

| 状態 | CSSクラス | 表示 |
|------|-----------|------|
| 開いた状態 | なし | 子要素を表示、アイコン ▼ |
| 閉じた状態 | `collapsed` | 子要素を非表示（`display: none`）、アイコン ▶（CSS transformで-90deg回転） |

**初期状態の決定ロジック:**
1. デフォルト: すべてのフォルダは閉じた状態（`collapsed`）
2. 例外: アクティブページ（現在表示中のページ）の祖先フォルダは開いた状態
3. LocalStorageに保存された状態があれば、DOMContentLoaded時に復元

**LocalStorageキー:** `nav-folder-{フォルダ名テキスト}` → 値: `"collapsed"` or `"expanded"`

### 7.5 一括展開/折りたたみ

- 「すべて開く」ボタン: 全`.nav-folder`から`collapsed`クラスを除去 + LocalStorage更新
- 「すべて閉じる」ボタン: 全`.nav-folder`に`collapsed`クラスを付与 + LocalStorage更新

---

## 8. HTMLテンプレート仕様

### 8.1 HTML文書構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{タイトル}</title>
  <!-- CDNリソース -->
  <style>/* styles/base.css + --css で指定された追加CSS */</style>
</head>
<body class="{bodyClass}">
  {ナビゲーションHTML}
  <div class="nav-resizer" role="separator" ...></div>
  <div class="{layoutClass}">
    {変換済みコンテンツ}
  </div>
  <script>/* クライアントサイドJS */</script>
</body>
</html>
```

### 8.2 CSS設計

#### 8.2.1 レイアウト

**ナビゲーションなし（`.markdown-body`）:**
- 最大幅: 1012px
- 中央寄せ（`margin: 0 auto`）
- パディング: 32px

**ナビゲーションあり（`.with-navigation` + `.content-with-nav`）:**
- サイドバー: 固定位置（`position: fixed`）、幅はCSS変数で制御
- コンテンツ: `margin-left`でサイドバー分をオフセット
- リサイザー: サイドバーとコンテンツの境界に配置

#### 8.2.2 CSS変数（デザイントークン）

CSSは `styles/base.css` に外部化されており、変換時に読み込んで `<style>` へ埋め込む。冒頭の `:root` に色・タイポグラフィ・寸法のトークンを集約しており、`--css` で渡した CSS は既定スタイルの後ろに連結されるため、同名トークンを再定義するだけで上書きできる（利用者向けの一覧は `docs/theming.md`）。

主なトークン:

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `--color-text` | `#24292f` | 本文の文字色 |
| `--color-accent` | `#0366d6` | 見出し罫線・リンク・選択項目のアクセント色 |
| `--color-border` | `#e1e4e8` | 標準の罫線色 |
| `--font-size-base` | `14px` | 本文の文字サイズ |
| `--content-max-width` | `1012px` | 本文の最大幅（ナビゲーションなし時） |
| `--nav-width` | `280px` | サイドバー幅 |
| `--nav-min` | `200px` | サイドバー最小幅（リサイズ下限） |
| `--nav-max` | `640px` | サイドバー最大幅（リサイズ上限） |
| `--nav-gap` | `40px` | サイドバーとコンテンツ間のギャップ |
| `--resizer-width` | `6px` | リサイズハンドルの幅 |

#### 8.2.3 見出しスタイル

| レベル | 装飾 |
|--------|------|
| h1 | 2em、下線（`border-bottom: 1px solid #eaecef`） |
| h2 | 1.5em、青枠ボックス（`border: 2px solid #0366d6`、背景`#f6f8fa`、文字色`#0366d6`） |
| h3 | 1.25em、青下線（`border-bottom: 2px solid #0366d6`、文字色`#0366d6`） |
| h4 | 1.25em、青バッジ（白文字`#fff`、背景`#4a90d9`、`display: inline-block`） |
| h5 | 0.875em、装飾なし |
| h6 | 0.85em、グレー文字（`#6a737d`） |

#### 8.2.4 テーブルスタイル

- 角丸（`border-radius: 6px`）+ ドロップシャドウ
- ヘッダー行: 青背景（`#e3f2fd`）、太字
- データ行: 偶数行に交互背景色（`#fafbfc`）
- セルパディング: 12px 16px

#### 8.2.5 コードブロックスタイル

- Prism.jsテーマ: `prism-tomorrow`（ダークテーマ）
- 角丸: 6px
- フォント: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace
- インラインコード: 薄い背景色（`rgba(27,31,35,.05)`）

#### 8.2.6 Mermaidダイアグラムスタイル

- 中央揃え（`text-align: center`）
- パディング: 16px
- 白背景 + 1pxボーダー + ドロップシャドウ
- 角丸: 6px

#### 8.2.7 番号付きリスト

- CSSカウンター方式（`counter-reset: ol-counter`）
- 番号は太字（`font-weight: bold`）
- `list-style: none` + `::before`擬似要素で番号を描画

#### 8.2.8 レスポンシブデザイン（768pxブレークポイント）

| 要素 | デスクトップ | モバイル |
|------|-------------|---------|
| サイドバー | 固定左配置（`position: fixed`） | 相対配置（`position: relative`）、全幅 |
| コンテンツ | サイドバー分をオフセット | `margin-left: 0`、全幅 |
| リサイザー | 表示 | 非表示（`display: none`） |

---

## 9. クライアントサイドJavaScript仕様

### 9.1 Mermaid初期化

```javascript
mermaid.initialize({
  startOnLoad: true,    // ページ読み込み時に自動レンダリング
  theme: 'default',     // デフォルトテーマ
  securityLevel: 'loose', // HTML出力許可（click イベント等に必要）
  fontFamily: 'inherit',  // 親要素のフォントを継承
  errorLevel: 'warn'      // エラー時は警告のみ（描画停止しない）
});
```

### 9.2 フォルダ展開/折りたたみ

**クリックイベント:**
- `.nav-folder-toggle` クリック時、親の `.nav-folder` 要素で `collapsed` クラスをトグル
- 状態をLocalStorageに保存（キー: `nav-folder-{フォルダ名}`）

**状態復元（DOMContentLoaded時）:**
- LocalStorageから各フォルダの保存状態を読み取り
- `expanded` 状態のフォルダのみ `collapsed` クラスを除去

### 9.3 アクティブページ自動スクロール

```javascript
setTimeout(function() {
  var activeLink = document.querySelector('.nav-file-link.active');
  if (activeLink) activeLink.scrollIntoView({ block: 'start' });
}, 0);
```

- `setTimeout(fn, 0)` でDOM描画完了後に実行
- `scrollIntoView({ block: 'start' })` でアクティブリンクをビューポート上部に配置

### 9.4 サイドバーリサイズ機能

**ドラッグリサイズ（Pointer Events API）:**
1. `pointerdown` → ドラッグ開始（モバイル幅では無効化）
2. `pointermove` → マウス位置からサイドバー幅を算出、CSS変数 `--nav-width` を更新
3. `pointerup` → ドラッグ終了、幅をLocalStorageに保存

**キーボード操作（アクセシビリティ）:**

| キー | 動作 |
|------|------|
| ← | 幅を10px縮小（Shift: 50px） |
| → | 幅を10px拡大（Shift: 50px） |
| Home | 最小幅（200px）に設定 |
| End | 最大幅（640px）に設定 |
| Enter | デフォルト幅（280px）にリセット |

**幅制限:** `clamp(value, --nav-min, --nav-max)` で最小〜最大幅の範囲に制約。

**LocalStorageキー:** `nav-width` → 値: ピクセル数（整数）

### 9.5 PJAX（SPA風ページ遷移）

#### 9.5.1 概要

ナビゲーション内のリンクやコンテンツ内部リンクをクリックした際、ページ全体のリロードを行わず、fetchでHTMLを取得してコンテンツ領域のみを差し替える。

#### 9.5.2 動作条件

- `location.protocol !== 'file:'` の場合のみ有効（ローカルファイルではフォールバック）
- `.content-with-nav` と `.navigation-sidebar` の両要素が存在する場合のみ初期化

#### 9.5.3 リンク判定（shouldHandle）

以下のすべてを満たすリンクのみPJAX処理対象:
1. 同一オリジン（`isInternal`）
2. `target` 属性なし（または `_self`）
3. `download` 属性なし
4. `.html` 拡張子で終わるURL
5. 同一ページ内ハッシュ遷移ではない

#### 9.5.4 ページ遷移処理（navigate）

```text
1. fetch(url) でHTMLを取得
2. DOMParser で解析 → .content-with-nav 要素を抽出
   └─ 要素なし → window.location.href で通常遷移にフォールバック
3. コンテンツ領域の innerHTML を差し替え
4. document.title を更新
5. history.pushState() で履歴追加（戻る/進むの場合は replace）
6. ナビゲーションのアクティブ状態を更新（updateActiveNav）
7. Prism.highlightAllUnder() でコードブロック再ハイライト
8. mermaid.run() でMermaidダイアグラム再レンダリング
9. ハッシュ付きURLの場合はターゲット要素にスクロール、それ以外はページ先頭にスクロール
```

#### 9.5.5 ブラウザ履歴対応

- `popstate` イベント（戻る/進むボタン）で `navigate(url, { replace: true })` を呼び出し
- `e.state.url` から遷移先URLを取得

#### 9.5.6 エラーハンドリング

- fetch失敗時・レスポンスエラー時: `window.location.href` で通常遷移にフォールバック

---

## 10. エラーハンドリング仕様

### 10.1 エラーパターンと対応

| 状況 | 対応 | 終了コード |
|------|------|-----------|
| 引数不足（入力/出力パスなし） | 使用方法のエラーメッセージ出力 | 1 |
| サポート外のファイル形式 | エラーメッセージ + 対応形式表示 | 1 |
| 単一ファイルが空（0バイト） | エラーメッセージ出力 | 1 |
| 単一ファイル変換エラー | エラーメッセージ + スタックトレース | 1 |
| ディレクトリ内の空ファイル | 警告メッセージ出力、スキップして処理継続 | — |
| ディレクトリ内の個別ファイルエラー | エラーメッセージ出力、他ファイルは処理継続 | — |
| ナビゲーションデータ収集エラー | エラーメッセージ + スタックトレース | 1 |
| ナビゲーション内の個別ファイルエラー | エラーメッセージ出力、他ファイルは処理継続 | — |

### 10.2 変換結果サマリー

ディレクトリ変換完了時に以下を出力:
```text
Conversion completed: {successCount} files processed successfully
{errorCount} files failed to convert    ← エラーがある場合のみ
```

---

## 11. セキュリティ考慮事項

### 11.1 HTMLエスケープ

- **CSV変換**: `escapeHtml()` 関数により、CSVセル値に含まれる `& < > " '` をすべて実体参照に置換。XSS攻撃を防止する。
- **コードブロック**: markdown-itのデフォルトエスケープ（`md.utils.escapeHtml`）およびPrism.jsのハイライト処理により、コード内容はエスケープされる。

### 11.2 Markdown内HTML許可

markdown-itの `html: true` 設定により、Markdown内に記述されたHTMLタグはエスケープされずそのまま出力される。これは技術文書内でのHTML直接記述（表・レイアウトなど）を可能にするための仕様である。

**影響**: 入力Markdownに悪意あるスクリプトが含まれる場合、出力HTMLにそのまま反映される。本ツールは信頼できる入力を前提としている。

### 11.3 Mermaid securityLevel

`securityLevel: 'loose'` に設定されている。これにより、Mermaidダイアグラム内のHTMLラベルやクリックイベントが有効になる。

---

## 12. macOS 連携アーキテクチャ

`mac/` 配下は、本ツールを macOS Finder のクイックアクションから呼び出すための統合層である。`convert-md2html.js` 本体には一切手を加えず、既存の CLI インターフェース (`<input> <output> [--nav]`) を外部からラップする設計とする。

### 12.1 呼び出しフロー

```text
Finder で対象を選択 + 右クリック
    │  ファイル/フォルダの絶対パス群を渡す
    ▼
~/Library/Services/Convert to HTML[ (with Nav)].workflow
    │  Automator Run Shell Script: "<REPO>/mac/bin/convert-finder.sh" plain|nav "$@"
    ▼
mac/bin/convert-finder.sh
    │  1. PATH を明示拡張し node を解決（command -v → /usr/local/bin → /opt/homebrew/bin → ~/.nvm/versions/node/*）
    │  2. osascript で choose folder ダイアログ → 出力先 OUTDIR を取得（初期位置=最初の入力の親フォルダ、キャンセル時は無音終了）
    │  3. 入力ループ:
    │       - ディレクトリ      → node convert-md2html.js <in> <OUTDIR/basename_html> [--nav]
    │       - .md / .csv ファイル → node convert-md2html.js <in> <OUTDIR/stem.html>   (--nav は付けない)
    │       - その他              → SKIP
    │  4. /tmp/convert-md2html-*.log に詳細記録
    │  5. 結果サマリを notify.sh 経由で通知
    ▼
mac/bin/notify.sh
    │  osascript で「通知センターバナー」、エラー時は「ダイアログ + ログを開くボタン」
    ▼
convert-md2html.js（既存 CLI、無改変）
```

### 12.2 Quick Action (`.workflow`) の仕様

- バンドル構造: `Contents/Info.plist`（NSServices 登録）+ `Contents/document.wflow`（Automator アクション本体、XML plist）
- 入力タイプ: `com.apple.Automator.fileSystemObject`（ファイル/フォルダ、複数選択可）
- 対象アプリ: `com.apple.finder` のみ
- 呼び出しシェル: `/bin/bash`、入力受け渡し: `as arguments` (`$@`)
- リポジトリ絶対パスは `document.wflow` 内のプレースホルダ `__REPO_PATH__` として保持し、`install.sh` 実行時に `sed` で実パスに置換する。これにより `.workflow` をテキストとして diff 可能にしつつ、リポジトリ移動にも対応できる。

### 12.3 `--nav` の扱い

`--nav` はディレクトリ全体をサイドバー付きサイトとして変換するためのモードであり、単一ファイルに対しては意味を成さない。したがって「Convert to HTML (with Nav)」を **ファイル単体** に適用した場合は、`convert-finder.sh` 側で `--nav` を黙って外して通常変換にフォールバックする。フォルダ入力時のみ `--nav` を付与する。

### 12.4 ログとエラー通知

- 1 回の起動ごとに `/tmp/convert-md2html-YYYYMMDD-HHMMSS-<pid>.log` を生成
- 通知センターには `OK:N NG:M SKIP:K / 出力先: <path>` のサマリを表示
- 失敗があれば追加でダイアログを出し、「ログを開く」ボタンから `open` コマンドでログを起動アプリに渡す

### 12.5 Node.js 解決

Finder 経由起動のシェルは非ログインシェルであり、`~/.zshrc` を読まず GUI 環境の `PATH` のみを継承する。そのため nvm のように `~/.nvm/versions/node/<ver>/bin` でしか node を提供しない構成では失敗する。`convert-finder.sh` は以下の順で node を探索する:

1. 拡張済み `PATH` 上の `command -v node`
2. `/usr/local/bin/node`（Homebrew Intel / 公式 pkg）
3. `/opt/homebrew/bin/node`（Homebrew Apple Silicon）
4. `~/.nvm/versions/node/<最新 SemVer 順>/bin/node`

いずれも見つからない場合は、通知センターおよびダイアログで Node.js 未導入のエラーを表示し終了する。
