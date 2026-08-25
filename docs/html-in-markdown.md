# Markdown 内で HTML を使う

Markdown ファイルに HTML を直接埋め込むと、Markdown だけでは表現できないレイアウト（横並び、カード、モックアップなど）を作れます。このドキュメントでは、convert-md2html で正しく変換される HTML の書き方と、避けるべきパターンをまとめます。

変換ツールそのものの使い方は [README](../README.md)、生成される HTML の配色やフォントを変える方法は [デザインのカスタマイズ](theming.md) を参照してください。

## 基本ルール

### ルール 1: HTML ブロックの前後に空行を入れる

HTML ブロックの前後には必ず空行を入れてください。空行がないと、Markdown パーサが HTML として認識せず、タグがそのまま文字として表示されます。

正しい例:

```markdown
## 見出し

<div style="display: flex; gap: 10px;">
  <div style="flex: 1;">左側</div>
  <div style="flex: 1;">右側</div>
</div>

次の段落
```

間違った例:

```markdown
## 見出し
<div style="display: flex; gap: 10px;">
  <div style="flex: 1;">左側</div>
</div>
次の段落
```

### ルール 2: HTML タグは行の先頭から始める

ブロックの開始タグは、行の先頭から書いてください。先頭に半角スペースが 4 つ以上あるとコードブロックとして扱われます。

正しい例:

```markdown
<div style="padding: 20px;">
  内容
</div>
```

間違った例:

```markdown
    <div style="padding: 20px;">
      内容
    </div>
```

### ルール 3: 子要素のインデントは自由

開始タグさえ行頭から始まっていれば、内側の要素は読みやすいようにインデントして構いません。

```markdown
<div style="border: 1px solid #dee2e6; padding: 20px;">
  <h4 style="margin: 0 0 10px 0;">タイトル</h4>
  <p>説明文</p>
  <ul>
    <li>項目 1</li>
    <li>項目 2</li>
  </ul>
</div>
```

## 色の使い方

### 色を使うべき場合

- 状態を示す: エラー（赤）、成功（緑）、警告（黄）、情報（青）
- 重要度を示す: 必須項目、注意事項など
- 種類を区別する: 異なるカテゴリを明確に分ける必要がある場合

### 色の使用を避けるべき場合

- 単なる装飾目的（見栄えを良くしたいだけの場合）
- レイアウトの例示（横並びやカラム分けなど、構造を示すだけの場合）
- 意味のない色分け（左を青、右を赤にする理由がない場合）

### 色以外で区別する方法

- グレー系の背景（`#f8f9fa`、`#e9ecef` など）
- ボーダーのみで区別（`border: 1px solid #dee2e6`）
- 余白やレイアウトで構造を表現

このドキュメントのサンプルコードで使っている色は例示です。実際の文書では、用途に応じて適切な色を選んでください。

## レイアウトの実践例

### 横並びレイアウト（2 カラム）

```markdown
## セクション名

<div style="display: flex; gap: 20px;">
<div style="flex: 1; border: 1px solid #dee2e6; padding: 15px; border-radius: 4px; background: #f8f9fa;">
<h4 style="margin: 0 0 10px 0;">左側のコンテンツ</h4>
<p>ここに説明文を書きます</p>
</div>
<div style="flex: 1; border: 1px solid #dee2e6; padding: 15px; border-radius: 4px; background: #f8f9fa;">
<h4 style="margin: 0 0 10px 0;">右側のコンテンツ</h4>
<p>ここに説明文を書きます</p>
</div>
</div>

次の内容が続きます。
```

### 横並びレイアウト（3 カラム）

カラム数を増やす場合も考え方は同じで、`flex: 1` を指定した子要素を並べるだけです。

```markdown
## 機能比較

<div style="display: flex; gap: 15px;">
<div style="flex: 1; padding: 20px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
<h4>プラン A</h4>
<p>基本機能</p>
<ul>
<li>機能 1</li>
<li>機能 2</li>
</ul>
</div>
<div style="flex: 1; padding: 20px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
<h4>プラン B</h4>
<p>標準機能</p>
<ul>
<li>機能 1</li>
<li>機能 2</li>
<li>機能 3</li>
</ul>
</div>
<div style="flex: 1; padding: 20px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
<h4>プラン C</h4>
<p>全機能</p>
<ul>
<li>機能 1</li>
<li>機能 2</li>
<li>機能 3</li>
</ul>
</div>
</div>
```

### ボックスレイアウト

```markdown
## 情報ボックス

<div style="border: 2px solid #333; border-radius: 8px; padding: 20px; max-width: 600px;">
<div style="background: #f0f0f0; padding: 15px; margin: -20px -20px 20px -20px; border-bottom: 2px solid #333;">
<h3 style="margin: 0;">タイトル</h3>
</div>
<div style="border: 1px solid #ccc; padding: 15px; background: #fafafa; border-radius: 4px;">
<div><strong>項目 1:</strong> 値 1</div>
<div><strong>項目 2:</strong> 値 2</div>
</div>
<div style="margin-top: 15px;">
<button style="width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px;">ボタン</button>
</div>
</div>
```

### フォームレイアウト

```markdown
## フォーム例

<div style="max-width: 500px; padding: 20px; border: 1px solid #ddd; border-radius: 6px;">
<div style="margin-bottom: 15px;">
<label style="display: block; margin-bottom: 5px; font-weight: bold;">項目名</label>
<input type="text" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
</div>
<div style="margin-bottom: 15px;">
<label style="display: block; margin-bottom: 5px; font-weight: bold;">選択項目</label>
<select style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
<option>オプション 1</option>
<option>オプション 2</option>
</select>
</div>
<div style="display: flex; gap: 10px;">
<button style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px;">キャンセル</button>
<button style="flex: 1; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px;">送信</button>
</div>
</div>
```

## 避けるべき HTML パターン

生成物は「ブラウザで開いて読む静的なドキュメント」です。次のパターンは、閲覧の妨げになるため使わないでください。

### position: fixed / absolute

画面に固定された要素は、ページを開いた瞬間に本文を覆ってしまい、スクロールしても消えません。

避けるべき書き方:

```html
<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);">
  <div style="background: white; margin: 50px auto; padding: 20px;">
    モーダルの内容
  </div>
</div>
```

推奨する書き方（通常のブロック要素として配置する）:

```html
<div style="border: 2px solid #333; border-radius: 8px; max-width: 800px; margin: 20px auto; padding: 20px; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <h3>モーダル風デザイン</h3>
  <p>モーダルのデザインサンプル</p>
</div>
```

### display: none の多用

HTML には存在するのに表示されない要素は、「書いたはずの内容が見えない」という混乱を招き、ファイルサイズだけが増えます。見せたくない内容は、そもそも書かないか、Markdown のコメントとして残してください。

```markdown
<!--
この部分は実装時に追加予定:
- 項目 1
- 項目 2
-->
```

### JavaScript への依存

`<script>` タグや `onclick` 属性はそのまま出力され、ブラウザで開けば実際に動作します。ただし、次の理由から使わないでください。

- 印刷や PDF 化では動作しないため、内容が読み手に届かない
- 閲覧環境やセキュリティ設定によっては実行されない
- ドキュメントの差分レビューが難しくなる

インタラクションを説明したい場合は、状態ごとの見た目を並べて示すか、スクリーンショットを使ってください。

避けるべき書き方:

```html
<button onclick="alert('クリック')">ボタン</button>
<div id="content"></div>
<script>
  document.getElementById('content').innerHTML = '動的コンテンツ';
</script>
```

推奨する書き方:

```html
<button style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px;">ボタン</button>
<div>コンテンツ</div>
```

## モックアップの表現方法

UI デザインやモックアップを Markdown で表現する場合の書き方です。

### モーダルウィンドウ

`position: fixed` を使わず、枠と影を付けたブロック要素として表現します。

```html
<div style="border: 2px solid #333; border-radius: 8px; max-width: 600px; margin: 40px auto; padding: 20px; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
    <h3 style="margin: 0;">モーダルタイトル</h3>
    <span style="color: #aaa; font-size: 24px;">&times;</span>
  </div>
  <p>モーダルの内容がここに入ります。</p>
  <div style="text-align: right; margin-top: 20px;">
    <button style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; margin-right: 10px;">キャンセル</button>
    <button style="padding: 8px 20px; background: #007bff; color: white; border: none; border-radius: 4px;">確認</button>
  </div>
</div>
```

### 状態の表現（通常・ホバー・無効）

状態の切り替えを再現するのではなく、状態ごとの見た目を横に並べます。

```html
<div style="display: flex; gap: 20px; flex-wrap: wrap;">
  <div style="text-align: center;">
    <div style="margin-bottom: 10px; font-weight: bold;">通常</div>
    <button style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px;">ボタン</button>
  </div>
  <div style="text-align: center;">
    <div style="margin-bottom: 10px; font-weight: bold;">ホバー</div>
    <button style="padding: 10px 20px; background: #0056b3; color: white; border: none; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">ボタン</button>
  </div>
  <div style="text-align: center;">
    <div style="margin-bottom: 10px; font-weight: bold;">無効</div>
    <button style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; opacity: 0.5;">ボタン</button>
  </div>
</div>
```

### テーブルの選択状態

```html
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background: #f8f9fa;">
      <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">項目</th>
      <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">値</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: #e7f3ff; border-left: 4px solid #007bff;">
      <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">選択中の行</td>
      <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">データ</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">通常の行</td>
      <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">データ</td>
    </tr>
  </tbody>
</table>
```

### アコーディオン・展開可能セクション

開閉の動作は再現せず、開いた状態と閉じた状態を並べて示します。

```html
<div style="border: 1px solid #dee2e6; border-radius: 4px; margin-bottom: 10px;">
  <div style="padding: 15px; background: #f8f9fa; font-weight: bold; border-bottom: 1px solid #dee2e6;">
    ▼ 展開された状態
  </div>
  <div style="padding: 15px;">
    この内容が表示されています。
  </div>
</div>

<div style="border: 1px solid #dee2e6; border-radius: 4px;">
  <div style="padding: 15px; background: #f8f9fa; font-weight: bold;">
    ▶ 閉じられた状態
  </div>
</div>
```

### 処理フローの表現

```html
<div style="display: flex; gap: 20px; align-items: center;">
  <div style="flex: 1; padding: 20px; border: 2px solid #6c757d; border-radius: 6px; text-align: center; background: #f8f9fa;">
    <div style="font-weight: bold;">1. 入力</div>
  </div>
  <div style="font-size: 24px; color: #6c757d;">→</div>
  <div style="flex: 1; padding: 20px; border: 2px solid #6c757d; border-radius: 6px; text-align: center; background: #f8f9fa;">
    <div style="font-weight: bold;">2. 処理</div>
  </div>
  <div style="font-size: 24px; color: #6c757d;">→</div>
  <div style="flex: 1; padding: 20px; border: 2px solid #6c757d; border-radius: 6px; text-align: center; background: #f8f9fa;">
    <div style="font-weight: bold;">3. 完了</div>
  </div>
</div>
```

なお、フローチャートやシーケンス図を描きたい場合は、HTML よりも Mermaid 記法のほうが簡潔に書けます。

### スクリーンショットの併用

複雑なインタラクションは、無理に HTML で再現せず画像で示すほうが正確に伝わります。

```markdown
## 実装例

以下は実際の動作イメージです。

![操作フロー](./images/ui-flow.png)

### 主要な操作

1. ボタンをクリックする
2. モーダルが表示される
3. フォームに入力する
4. 送信して完了
```

## トラブルシューティング

### HTML がそのまま文字として表示される

HTML ブロックの前に空行がないか、行頭にスペースが入っています。空行を入れ、開始タグを行頭から書いてください（[ルール 1](#ルール-1-html-ブロックの前後に空行を入れる)、[ルール 2](#ルール-2-html-タグは行の先頭から始める)）。

### 横並びにならず縦に並ぶ

親要素に `display: flex` が指定されているか、子要素に `flex: 1` が指定されているかを確認してください。

```html
<div style="display: flex; gap: 10px;">
  <div style="flex: 1;">左</div>
  <div style="flex: 1;">右</div>
</div>
```

### インラインスタイルが効かない

プロパティの区切りにセミコロンが抜けているか、プロパティ名が間違っています。

```html
<!-- 間違い: セミコロンがない -->
<div style="color: red background: blue">

<!-- 正しい -->
<div style="color: red; background: blue;">
```

## チェックリスト

### 基本ルール

- [ ] HTML ブロックの前後に空行がある
- [ ] 開始タグが行頭から始まっている（インデントなし）
- [ ] style 属性のプロパティがセミコロンで区切られている
- [ ] 閉じタグが正しく配置されている

### レイアウト

- [ ] 横並びは `display: flex` と `gap` で表現している
- [ ] `display: flex` の子要素に `flex: 1` などの幅指定がある

### 静的ドキュメントとしての制約

- [ ] `position: fixed` / `position: absolute` を使っていない
- [ ] `display: none` を多用していない
- [ ] `<script>` タグや `onclick` などのイベント属性を使っていない

### モックアップ

- [ ] モーダルを通常のブロック要素として表現している
- [ ] 状態の違いは要素を並べて表現している
- [ ] 動きの説明が必要な箇所はスクリーンショットを使っている

## 動作確認の方法

このガイドの例を試すには、Markdown ファイルを作成して変換し、ブラウザで開きます。

```bash
convert-md2html example.md example.html

# ブラウザで開く
start example.html      # Windows
open example.html       # macOS
xdg-open example.html   # Linux
```
