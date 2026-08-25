# コントリビューションについて

convert-md2html に関心を持っていただきありがとうございます。

## 不具合の報告・機能の要望

[Issues](https://github.com/dvctrad/convert-md2html/issues) からご報告ください。次の情報があると調査がスムーズです。

- 実行したコマンド（オプションを含む）
- 実際の出力・エラーメッセージ
- 変換元ファイルの該当箇所（差し支えなければ最小の再現例）
- 環境（OS、`node --version` の結果、ブラウザ）

再現用の Markdown や CSV を添付いただく場合は、**機密情報を含まないもの**に置き換えてください。

## Pull Request について

Pull Request を歓迎します。送る前にまず Issue で方針をご相談いただけると、手戻りを避けられます。

### ライセンスの同意

Pull Request を送信された時点で、その内容が本プロジェクトと同じ [MIT License](LICENSE) のもとで配布されることに同意したものとみなします。

## コーディング・記述の方針

変更を提案いただく際は、既存のコードとドキュメントに合わせてください。

### コード

- 依存パッケージは増やさない方針です。追加が必要な場合は、理由を Issue で説明してください
- 生成される HTML は 1 ファイルで完結させます（外部 CSS ファイルを出力しません）
- スタイルは `convert-md2html.js` に直接書かず、[`styles/base.css`](styles/base.css) を編集してください。色・寸法は可能な限り `:root` のデザイントークンとして定義します
- 実行前に `node --check convert-md2html.js` が通ることを確認してください

### ドキュメント

- 見出しに手動で番号を振りません（順序が変わるたびに崩れるため）
- 見出しに絵文字を使いません
- コードブロックには言語を指定します（出力例や図は `text`）
- 文体は「です・ます」調で統一します

[DESIGN.md](DESIGN.md) は設計書という性格上、この方針の例外とし、章番号付きの見出しと「である」調を使っています。同文書内の関数仕様には対応する行番号を記載しているため、`convert-md2html.js` を編集した際は該当箇所の更新もお願いします。

### 動作確認

変更後は、最低限このパターンを確認してください。

```bash
node convert-md2html.js example.md example.html                 # 単一ファイル
node convert-md2html.js docs html --nav                          # ディレクトリ + ナビゲーション
node convert-md2html.js docs html --fit-tables --css theme.css   # オプションの併用
```

## ライセンス

本プロジェクトは [MIT License](LICENSE) で公開されています。
