# デザインのカスタマイズ

生成される HTML の配色・フォント・余白は、CSS で上書きできます。

スタイルの本体は [`styles/base.css`](../styles/base.css) にあり、変換時にその内容が HTML の `<style>` タグへ埋め込まれます。生成物は 1 つの HTML ファイルで完結するため、そのままメールに添付したり共有フォルダに置いたりしても表示が崩れません。

## 変更方法の選び方

| やりたいこと | 方法 |
| --- | --- |
| 色やフォントサイズだけ変えたい | 変換時に `--css` で上書き用の CSS を渡す（推奨） |
| 案件ごとに違う見た目を使い分けたい | 案件ごとに CSS ファイルを用意し、`--css` で切り替える |
| 既定の見た目そのものを変えたい | `styles/base.css` を直接編集する |

`--css` で渡した CSS は既定スタイルの後ろに埋め込まれるため、同じ指定であれば必ず上書きが優先されます。

## --css オプションの使い方

```bash
convert-md2html input.md output.html --css theme.css
```

ディレクトリ一括変換や他のオプションと併用できます。

```bash
convert-md2html ./docs ./html --nav --fit-tables --css theme.css
```

複数指定した場合は、指定した順に埋め込まれます（後のファイルが優先されます）。

```bash
convert-md2html input.md output.html --css base-brand.css --css project.css
```

`--css=theme.css` の形式でも指定できます。指定したファイルが読み込めない場合、変換は実行されずエラー終了します。

## デザイントークン

`styles/base.css` の冒頭では、色や寸法を CSS カスタムプロパティ（デザイントークン）としてまとめて定義しています。多くの場合、このトークンを上書きするだけで見た目を変えられます。

### タイポグラフィ

| トークン | 既定値 | 用途 |
| --- | --- | --- |
| `--font-family-base` | システムフォント | 本文のフォント |
| `--font-family-mono` | SFMono-Regular ほか | コードのフォント |
| `--font-size-base` | `14px` | 本文の文字サイズ |
| `--line-height-base` | `1.5` | 本文の行間 |

### 色

| トークン | 既定値 | 用途 |
| --- | --- | --- |
| `--color-text` | `#24292f` | 本文の文字色 |
| `--color-text-muted` | `#6a737d` | 引用や補足の文字色 |
| `--color-text-subtle` | `#586069` | ナビゲーションの文字色 |
| `--color-bg` | `#ffffff` | ページの背景色 |
| `--color-bg-subtle` | `#f6f8fa` | 見出し・サイドバー・コードブロックの背景色 |
| `--color-bg-alt` | `#fafbfc` | テーブルの偶数行の背景色 |
| `--color-bg-hover` | `#e1e4e8` | ナビゲーションのホバー背景色 |
| `--color-accent` | `#0366d6` | 見出しの罫線・リンク・選択中の項目 |
| `--color-accent-soft` | `#4a90d9` | h4 の背景色 |
| `--color-on-accent` | `#ffffff` | アクセント色の上に載る文字色 |
| `--color-border` | `#e1e4e8` | 標準の罫線 |
| `--color-border-muted` | `#eaecef` | h1 下の罫線 |
| `--color-border-strong` | `#dfe2e5` | 引用の縦線・コードブロックの枠線 |
| `--color-table-header-bg` | `#e3f2fd` | テーブルのヘッダー背景色 |

### 形状・レイアウト

| トークン | 既定値 | 用途 |
| --- | --- | --- |
| `--radius` | `6px` | 角丸（標準） |
| `--radius-sm` | `4px` | 角丸（小） |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | テーブルや図表の影 |
| `--content-max-width` | `1012px` | 本文の最大幅（ナビゲーションなしのとき） |
| `--content-padding` | `32px` | 本文の余白 |
| `--content-padding-narrow` | `16px` | 画面幅 768px 以下での本文余白 |

### ナビゲーション

`--nav` オプションで生成されるサイドバーの寸法です。サイドバー幅は閲覧者がドラッグで変更でき、その値はブラウザに保存されます。ここで指定するのは初期値と可動範囲です。

| トークン | 既定値 | 用途 |
| --- | --- | --- |
| `--nav-width` | `280px` | サイドバーの初期幅 |
| `--nav-min` | `200px` | ドラッグで縮められる下限 |
| `--nav-max` | `640px` | ドラッグで広げられる上限 |
| `--nav-gap` | `40px` | サイドバーと本文の間隔 |
| `--resizer-width` | `6px` | ドラッグ操作の当たり判定の幅 |

## 例 1: 配色とフォントサイズを変える

トークンを `:root` に対して上書きします。

```css
/* brand.css */
:root {
    --color-accent: #c2185b;
    --color-table-header-bg: #fce4ec;
    --font-size-base: 16px;
    --content-max-width: 900px;
}
```

```bash
convert-md2html input.md output.html --css brand.css
```

## 例 2: 見出しの装飾を変える

トークンで足りない場合は、セレクタごと上書きします。既定では h2 が枠線付きのボックス、h4 がバッジ状の装飾になっているため、落ち着いた見た目にしたい場合はここを変更します。

```css
/* plain-heading.css */
h2 {
    border: none;
    background: none;
    padding: 0 0 8px 0;
    border-bottom: 2px solid var(--color-accent);
}

h4 {
    display: block;
    background: none;
    padding: 0;
    color: var(--color-text);
}
```

## 例 3: 印刷用のスタイルを足す

```css
/* print.css */
@media print {
    .navigation-sidebar,
    .nav-resizer {
        display: none;
    }

    .content-with-nav {
        margin-left: 0;
        width: 100%;
    }

    h2 {
        break-after: avoid;
    }

    table {
        break-inside: avoid;
    }
}
```

表が用紙幅に収まらない場合は、`--fit-tables` オプションと併用してください。

## 主なクラス名

トークン以外を細かく調整する場合に使うクラスです。

| クラス | 対象 |
| --- | --- |
| `.markdown-body` | 本文（ナビゲーションなしのとき） |
| `.content-with-nav` | 本文（ナビゲーションありのとき） |
| `.navigation-sidebar` | サイドバー全体 |
| `.nav-title` | サイドバーの見出し |
| `.nav-folder-toggle` | フォルダの開閉行 |
| `.nav-file-link` | ファイルへのリンク（選択中は `.active` が付きます） |
| `.nav-resizer` | サイドバー幅のドラッグ領域 |
| `.table-scroll` | 表を囲む横スクロール領域 |
| `.mermaid` | Mermaid 図表の外枠 |
| `body.with-navigation` | ナビゲーションありのページの body |
| `body.fit-tables` | `--fit-tables` 指定時の body |

## 制約

- **コードのシンタックスハイライトは対象外です。** 配色は Prism のテーマ（`prism-tomorrow`）を CDN から読み込んでいます。変更する場合は、`convert-md2html.js` 内の `<link>` を別テーマの URL に差し替えてください。
- **KaTeX と Mermaid も CDN から読み込みます。** 数式や図表を含む HTML は、閲覧時にインターネット接続が必要です。
- **`--css` で渡した CSS は各 HTML に埋め込まれます。** 一括変換した場合、すべてのファイルに同じ内容が入ります。後からまとめて見た目を変えるには、再変換してください。
