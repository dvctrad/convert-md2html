#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const Prism = require('prismjs');
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-python');
require('prismjs/components/prism-bash');
// 他の言語のサポートが必要な場合は、ここに追加します
const texmath = require('markdown-it-texmath');
const katex = require('katex');
const anchor = require('markdown-it-anchor');
const GithubSlugger = require('github-slugger');

// 見出しID生成用のスラガー（ファイル単位で .reset() する）
let slugger = new GithubSlugger();

const md = new MarkdownIt({
  html: true, // Markdown内のHTMLタグを有効化
  highlight: function (str, lang) {
    if (lang && Prism.languages[lang]) {
      try {
        return Prism.highlight(str, Prism.languages[lang], lang);
      } catch (__) {}
    }
    return ''; // デフォルトのエスケープを使用
  }
});

// 見出しにGitHub風のslug IDを付与（TOCの #1-概要 などと一致させる）
md.use(anchor, {
  slugify: (s) => slugger.slug(s),
  permalink: false,
  tabIndex: false
});

// LaTeX数式サポート（$$...$$ ブロック数式、$...$ インライン数式）
md.use(texmath, {
  engine: katex,
  delimiters: 'dollars',
  katexOptions: { throwOnError: false }
});

// 本文内の .md / .csv 相対リンクを .html に書き換え（#hash や ?query は保持）
const defaultLinkOpen = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const hrefIndex = token.attrIndex('href');
  if (hrefIndex >= 0) {
    const href = token.attrs[hrefIndex][1];
    // 絶対URL / 特殊スキームは書き換えない
    if (!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
      const rewritten = href.replace(/^([^?#]*)\.(md|csv)(?=$|[?#])/i, '$1.html');
      if (rewritten !== href) {
        token.attrs[hrefIndex][1] = rewritten;
      }
    }
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

// 表自体ではなく外側の要素をスクロールさせ、ブラウザの列幅計算を保つ
md.renderer.rules.table_open = () => '<div class="table-scroll">\n<table>\n';
md.renderer.rules.table_close = () => '</table>\n</div>\n';

// Mermaidコードブロックを処理するカスタムレンダラー
md.renderer.rules.fence = function (tokens, idx, options, env, renderer) {
  const token = tokens[idx];
  const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
  const langName = info ? info.split(/\s+/g)[0] : '';
  
  if (langName === 'mermaid') {
    // Mermaidコードブロックの場合 - HTMLエスケープを行わない
    // JCL構文の自動修正を適用（全角括弧【】は保護）
    let fixedContent = token.content;
    
    // 全角スペース(U+3000)を半角スペース(U+0020)に正規化
    fixedContent = fixedContent.replace(/\u3000/g, ' ');
    
    // Unicode矢印の正規化（←, →）
    fixedContent = fixedContent.replace(/\u2190/g, '<-').replace(/\u2192/g, '->');
    
    // JCL特有のパターンのみを修正（全角括弧を含む行は除外）
    if (fixedContent.includes('=(') && !fixedContent.includes('【') && !fixedContent.includes('】')) {
      fixedContent = fixedContent
        // JCL特有の =(パターンを : に置き換え
        .replace(/=\(/g, ': ')
        // 対応する閉じ括弧を削除（行末の場合）
        .replace(/\)\s*$/gm, '')
        // 中間の閉じ括弧も削除（次の要素がある場合）
        .replace(/\)\s*(?=\])/g, '')
        // その他の孤立した閉じ括弧も削除（改行前）
        .replace(/\)\s*(?=<br\/>)/g, '');
    }
    
    // Mermaidでの // 削除（JCLコメント記号の除去）
    // ノード名内の // を削除して構文エラーを防ぐ
    fixedContent = fixedContent.replace(/\/\//g, '');
    
    return `<div class="mermaid">${fixedContent}</div>\n`;
  }
  
  // 通常のコードブロック処理
  let langClass = '';
  if (info) {
    langClass = ` class="${options.langPrefix}${md.utils.escapeHtml(langName)}"`;
  }
  
  let highlighted = '';
  if (options.highlight) {
    highlighted = options.highlight(token.content, langName) || md.utils.escapeHtml(token.content);
  } else {
    highlighted = md.utils.escapeHtml(token.content);
  }
  
  return `<pre><code${langClass}>${highlighted}</code></pre>\n`;
};

// CSV解析関数
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const result = [];
  
  for (let line of lines) {
    const row = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // エスケープされたクォート
          current += '"';
          i++; // 次の文字をスキップ
        } else {
          // クォートの開始/終了
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // フィールドの区切り
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // 最後のフィールドを追加
    row.push(current.trim());
    result.push(row);
  }
  
  return result;
}

// CSV to HTMLテーブル変換関数
function csvToHTML(csvContent) {
  const rows = parseCSV(csvContent);
  
  if (rows.length === 0) {
    return '<p>CSVファイルが空です。</p>';
  }
  
  let html = '<div class="table-scroll">\n<table>\n';
  
  // ヘッダー行
  if (rows.length > 0) {
    html += '  <thead>\n    <tr>\n';
    for (const cell of rows[0]) {
      html += `      <th>${escapeHtml(cell)}</th>\n`;
    }
    html += '    </tr>\n  </thead>\n';
  }
  
  // データ行
  if (rows.length > 1) {
    html += '  <tbody>\n';
    for (let i = 1; i < rows.length; i++) {
      html += '    <tr>\n';
      for (const cell of rows[i]) {
        html += `      <td>${escapeHtml(cell)}</td>\n`;
      }
      html += '    </tr>\n';
    }
    html += '  </tbody>\n';
  }
  
  html += '</table>\n</div>';
  return html;
}

// HTMLエスケープ関数
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// コマンドライン引数の解析
const args = process.argv.slice(2);
const hasNavigation = args.includes('--nav') || args.includes('--navigation');
const fitTables = args.includes('--fit-tables');

// フラグと --css <ファイル> を取り除き、位置引数だけを残す
const FLAG_OPTIONS = ['--nav', '--navigation', '--fit-tables'];
const customCssFiles = [];
const positionalArgs = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (FLAG_OPTIONS.includes(arg)) continue;

  if (arg === '--css') {
    const value = args[i + 1];
    if (!value || value.startsWith('--')) {
      console.error('エラー: --css にはCSSファイルのパスを指定してください');
      process.exit(1);
    }
    customCssFiles.push(value);
    i++;
    continue;
  }

  if (arg.startsWith('--css=')) {
    const value = arg.slice('--css='.length);
    if (!value) {
      console.error('エラー: --css にはCSSファイルのパスを指定してください');
      process.exit(1);
    }
    customCssFiles.push(value);
    continue;
  }

  positionalArgs.push(arg);
}

const inputPath = positionalArgs[0];
const outputPath = positionalArgs[1];

if (!inputPath || !outputPath) {
  console.error('使用方法: node convert-md2html.js <入力ファイル/ディレクトリのパス> <出力ファイル/ディレクトリのパス> [--nav] [--fit-tables] [--css <CSSファイル>]');
  console.error('対応形式: Markdown (.md), CSV (.csv)');
  console.error('オプション: --nav または --navigation でナビゲーションメニューを追加');
  console.error('            --fit-tables で表を画面幅に収める');
  console.error('            --css <CSSファイル> で追加のCSSを埋め込む（複数指定可）');
  process.exit(1);
}

// 既定スタイル（styles/base.css）と --css で指定された追加CSSを読み込む
const BASE_CSS_PATH = path.join(__dirname, 'styles', 'base.css');

let baseCss;
try {
  baseCss = fs.readFileSync(BASE_CSS_PATH, 'utf8');
} catch (error) {
  console.error(`エラー: 既定スタイルを読み込めませんでした: ${BASE_CSS_PATH}`);
  console.error(error.message);
  process.exit(1);
}

const customCss = customCssFiles.map(cssFile => {
  try {
    const content = fs.readFileSync(cssFile, 'utf8');
    console.log(`追加CSSを読み込みました: ${cssFile}`);
    return `\n/* ===== 追加CSS: ${path.basename(cssFile)} ===== */\n${content}`;
  } catch (error) {
    console.error(`エラー: 追加CSSを読み込めませんでした: ${cssFile}`);
    console.error(error.message);
    process.exit(1);
  }
}).join('\n');

// 入力の種類を判定
const inputStat = fs.statSync(inputPath);

if (inputStat.isDirectory()) {
  // ディレクトリ処理
  processDirectory(inputPath, outputPath);
} else {
  // 単一ファイル処理
  processSingleFile(inputPath, outputPath);
}

// 単一ファイル処理関数
function processSingleFile(inputFile, outputFile) {
  try {
    console.log(`Processing single file: ${inputFile}`);
    
    // 出力ファイルのディレクトリを取得し、存在しない場合は作成
    const outputDir = path.dirname(path.resolve(outputFile));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ファイルサイズをチェック
    const stats = fs.statSync(inputFile);
    if (stats.size === 0) {
      console.error(`Error: Input file is empty: ${inputFile}`);
      process.exit(1);
    }

    const fileExtension = path.extname(inputFile).toLowerCase();
    console.log(`Reading file: ${inputFile} (${stats.size} bytes)`);
    const fileContent = fs.readFileSync(inputFile, 'utf-8');
    let content, title;

    if (fileExtension === '.md') {
      // Markdownファイルの処理
      console.log(`Processing Markdown file: ${inputFile}`);
      slugger.reset();
      content = md.render(fileContent);

      // マークダウンの最初の見出しをタイトルとして抽出
      const titleMatch = fileContent.match(/^#\s+(.+)$/m);
      title = titleMatch ? titleMatch[1] : path.basename(inputFile, '.md');
    } else if (fileExtension === '.csv') {
      // CSVファイルの処理
      console.log(`Processing CSV file: ${inputFile}`);
      try {
        content = csvToHTML(fileContent);
        
        // ファイル名をタイトルとして使用
        title = path.basename(inputFile, '.csv');
      } catch (csvError) {
        console.error(`Error processing CSV file ${inputFile}:`);
        console.error(`CSV Error: ${csvError.message}`);
        console.error(`File content preview: ${fileContent.substring(0, 200)}...`);
        throw csvError;
      }
    } else {
      console.error(`サポートされていないファイル形式: ${fileExtension}`);
      console.error('対応形式: .md (Markdown), .csv (CSV)');
      process.exit(1);
    }

    const html = generateHTML(title, content);
    
    fs.writeFileSync(outputFile, html);
    console.log(`Converted ${inputFile} to ${outputFile}`);
  } catch (error) {
    console.error(`Error processing single file ${inputFile}:`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    process.exit(1);
  }
}

// ディレクトリ処理関数
function processDirectory(inputDir, outputDir) {
  console.log(`Processing directory: ${inputDir}`);
  
  // 出力ディレクトリを作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // .mdと.csvファイルを再帰的に検索
  const convertibleFiles = findConvertibleFiles(inputDir);
  console.log(`Found ${convertibleFiles.length} convertible files (${convertibleFiles.filter(f => f.endsWith('.md')).length} markdown, ${convertibleFiles.filter(f => f.endsWith('.csv')).length} csv)`);

  // ナビゲーション用のメタデータを収集
  let navigationData = null;
  if (hasNavigation) {
    try {
      navigationData = collectNavigationData(convertibleFiles, inputDir, outputDir);
      console.log('Navigation data collected');
    } catch (error) {
      console.error(`Error collecting navigation data: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  }

  let successCount = 0;
  let errorCount = 0;

  convertibleFiles.forEach(inputFile => {
    try {
      console.log(`Processing file: ${inputFile}`);
      
      // 相対パスを計算
      const relativePath = path.relative(inputDir, inputFile);
      const fileExtension = path.extname(inputFile).toLowerCase();
      const outputFile = path.join(outputDir, relativePath.replace(/\.(md|csv)$/i, '.html'));
      
      // 出力ファイルのディレクトリを作成
      const outputFileDir = path.dirname(outputFile);
      if (!fs.existsSync(outputFileDir)) {
        fs.mkdirSync(outputFileDir, { recursive: true });
      }

      // ファイルサイズをチェック
      const stats = fs.statSync(inputFile);
      if (stats.size === 0) {
        console.warn(`Warning: Skipping empty file: ${relativePath}`);
        return;
      }

      // ファイルを変換
      console.log(`Reading file: ${relativePath} (${stats.size} bytes)`);
      const fileContent = fs.readFileSync(inputFile, 'utf-8');
      let content, title;

      if (fileExtension === '.md') {
        // Markdownファイルの処理
        console.log(`Processing Markdown file: ${relativePath}`);
        slugger.reset();
        content = md.render(fileContent);

        // マークダウンの最初の見出しをタイトルとして抽出
        const titleMatch = fileContent.match(/^#\s+(.+)$/m);
        title = titleMatch ? titleMatch[1] : path.basename(inputFile, '.md');
      } else if (fileExtension === '.csv') {
        // CSVファイルの処理
        console.log(`Processing CSV file: ${relativePath}`);
        try {
          content = csvToHTML(fileContent);
          
          // ファイル名をタイトルとして使用
          title = path.basename(inputFile, '.csv');
        } catch (csvError) {
          console.error(`Error processing CSV file ${relativePath}:`);
          console.error(`CSV Error: ${csvError.message}`);
          console.error(`File content preview: ${fileContent.substring(0, 200)}...`);
          throw csvError;
        }
      }

      // ナビゲーション付きHTMLを生成
      const html = generateHTML(title, content, navigationData, outputFile, outputDir);
      
      fs.writeFileSync(outputFile, html);
      console.log(`Converting: ${relativePath} -> ${path.relative(outputDir, outputFile)}`);
      successCount++;
    } catch (error) {
      console.error(`Error converting ${inputFile}:`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
      errorCount++;
    }
  });

  console.log(`Conversion completed: ${successCount} files processed successfully`);
  if (errorCount > 0) {
    console.log(`${errorCount} files failed to convert`);
  }
}

// 変換可能ファイル（.mdと.csv）を再帰的に検索する関数
function findConvertibleFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      // サブディレクトリを再帰的に検索
      results = results.concat(findConvertibleFiles(filePath));
    } else if (file.toLowerCase().endsWith('.md') || file.toLowerCase().endsWith('.csv')) {
      // .mdまたは.csvファイルを結果に追加
      results.push(filePath);
    }
  });

  return results;
}

// ナビゲーション用のメタデータを収集する関数
function collectNavigationData(convertibleFiles, inputDir, outputDir) {
  const navigationData = {
    files: {},
    structure: {}
  };

  convertibleFiles.forEach(inputFile => {
    try {
      // 相対パスを計算
      const relativePath = path.relative(inputDir, inputFile);
      const fileExtension = path.extname(inputFile).toLowerCase();
      const htmlPath = relativePath.replace(/\.(md|csv)$/i, '.html').replace(/\\/g, '/');
      
      let title;
      
      if (fileExtension === '.md') {
        // Markdownファイルを読み込んでタイトルを抽出
        const markdown = fs.readFileSync(inputFile, 'utf-8');
        const titleMatch = markdown.match(/^#\s+(.+)$/m);
        title = titleMatch ? titleMatch[1] : path.basename(inputFile, '.md');
      } else if (fileExtension === '.csv') {
        // CSVファイルの場合はファイル名をタイトルとして使用
        title = path.basename(inputFile, '.csv');
      }
      
      // ファイル情報を保存
      navigationData.files[htmlPath] = {
        title: title,
        path: htmlPath,
        originalPath: relativePath
      };
      
      // ディレクトリ構造を構築
      const pathParts = htmlPath.split('/');
      let currentLevel = navigationData.structure;
      
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        
        if (i === pathParts.length - 1) {
          // ファイル
          currentLevel[part] = {
            type: 'file',
            title: title,
            path: htmlPath
          };
        } else {
          // ディレクトリ
          if (!currentLevel[part]) {
            currentLevel[part] = {
              type: 'directory',
              children: {}
            };
          }
          currentLevel = currentLevel[part].children;
        }
      }
    } catch (error) {
      console.error(`Error processing ${inputFile} for navigation: ${error.message}`);
    }
  });

  return navigationData;
}

// ナビゲーションHTMLを生成する関数
function generateNavigationHTML(navigationData, currentHtmlPath, currentFile, outputDir) {
  // 現在のファイルからの相対パスを計算する関数
  function getRelativePath(targetPath) {
    const currentDir = path.dirname(currentFile);
    const targetFile = path.join(outputDir, targetPath);
    return path.relative(currentDir, targetFile).replace(/\\/g, '/');
  }

  // アクティブページの祖先フォルダパスを収集（デフォルト閉じの例外として開く）
  const activeAncestorParts = currentHtmlPath ? currentHtmlPath.split('/').slice(0, -1) : [];
  const activeAncestorPaths = new Set();
  for (let i = 1; i <= activeAncestorParts.length; i++) {
    activeAncestorPaths.add(activeAncestorParts.slice(0, i).join('/'));
  }

  // ディレクトリ構造を再帰的にHTMLに変換
  function renderStructure(structure, level = 0, currentPath = '') {
    let html = '';

    const entries = Object.entries(structure).sort(([a, aData], [b, bData]) => {
      // ファイルを先に、ディレクトリを後に
      if (aData.type === 'file' && bData.type === 'directory') return -1;
      if (aData.type === 'directory' && bData.type === 'file') return 1;
      return a.localeCompare(b);
    });

    entries.forEach(([name, data]) => {
      if (data.type === 'directory') {
        const folderPath = currentPath ? currentPath + '/' + name : name;
        const isAncestorOfActive = activeAncestorPaths.has(folderPath);
        const collapsedClass = isAncestorOfActive ? '' : ' collapsed';
        html += `
          <li class="nav-folder${collapsedClass}">
            <div class="nav-folder-toggle">
              <span class="nav-folder-icon">▼</span>
              ${name}
            </div>
            <ul class="nav-folder-children nav-tree">
              ${renderStructure(data.children, level + 1, folderPath)}
            </ul>
          </li>
        `;
      } else if (data.type === 'file') {
        const relativePath = getRelativePath(data.path);
        const isActive = data.path === currentHtmlPath;
        const activeClass = isActive ? ' active' : '';
        
        html += `
          <li class="nav-file">
            <a href="${relativePath}" class="nav-file-link${activeClass}">
              ${data.title}
            </a>
          </li>
        `;
      }
    });

    return html;
  }

  return `
    <nav class="navigation-sidebar">
      <div class="nav-title">📚 ドキュメント</div>
      <div class="nav-folder-actions">
        <button class="nav-expand-all" title="すべて開く">▼ すべて開く</button>
        <button class="nav-collapse-all" title="すべて閉じる">▶ すべて閉じる</button>
      </div>
      <ul class="nav-tree">
        ${renderStructure(navigationData.structure)}
      </ul>
    </nav>
  `;
}

// HTML生成関数
function generateHTML(title, content, navigationData = null, currentFile = null, outputDir = null) {
  // ナビゲーションHTMLを生成
  let navigationHtml = '';
  let layoutClass = 'markdown-body';
  let bodyClass = '';
  
  if (navigationData && currentFile && outputDir) {
    const currentHtmlPath = path.relative(outputDir, currentFile).replace(/\\/g, '/');
    navigationHtml = generateNavigationHTML(navigationData, currentHtmlPath, currentFile, outputDir);
    layoutClass = 'content-with-nav';
    bodyClass = 'with-navigation';
  }

  if (fitTables) {
    bodyClass = `${bodyClass} fit-tables`.trim();
  }

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-tomorrow.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
${baseCss}${customCss}
    </style>
</head>
<body class="${bodyClass}">
    ${navigationHtml}
    <div class="nav-resizer" role="separator" aria-orientation="vertical" aria-label="Resize navigation" tabindex="0"></div>
    <div class="${layoutClass}">
        ${content}
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"></script>
    <script>
        // Mermaidの初期化
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'inherit',
            errorLevel: 'warn'
        });
        
        // ナビゲーション機能
        document.addEventListener('DOMContentLoaded', function() {
            // フォルダの展開/折りたたみ機能
            const folderToggles = document.querySelectorAll('.nav-folder-toggle');
            folderToggles.forEach(toggle => {
                toggle.addEventListener('click', function() {
                    const folder = this.parentElement;
                    folder.classList.toggle('collapsed');
                    
                    // 状態をローカルストレージに保存
                    const folderId = this.textContent.trim();
                    const isCollapsed = folder.classList.contains('collapsed');
                    localStorage.setItem('nav-folder-' + folderId, isCollapsed ? 'collapsed' : 'expanded');
                });
            });
            
            // すべて開く/閉じるボタン
            const expandAllBtn = document.querySelector('.nav-expand-all');
            const collapseAllBtn = document.querySelector('.nav-collapse-all');
            if (expandAllBtn) {
                expandAllBtn.addEventListener('click', function() {
                    document.querySelectorAll('.nav-folder').forEach(folder => {
                        folder.classList.remove('collapsed');
                        const folderId = folder.querySelector('.nav-folder-toggle').textContent.trim();
                        localStorage.setItem('nav-folder-' + folderId, 'expanded');
                    });
                });
            }
            if (collapseAllBtn) {
                collapseAllBtn.addEventListener('click', function() {
                    document.querySelectorAll('.nav-folder').forEach(folder => {
                        folder.classList.add('collapsed');
                        const folderId = folder.querySelector('.nav-folder-toggle').textContent.trim();
                        localStorage.setItem('nav-folder-' + folderId, 'collapsed');
                    });
                });
            }

            // ローカルストレージからフォルダ状態を復元（デフォルトは閉じた状態）
            folderToggles.forEach(toggle => {
                const folderId = toggle.textContent.trim();
                const savedState = localStorage.getItem('nav-folder-' + folderId);
                if (savedState === 'expanded') {
                    toggle.parentElement.classList.remove('collapsed');
                }
            });

            // アクティブページをサイドバーの見える位置にスクロール
            setTimeout(function() {
                var activeLink = document.querySelector('.nav-file-link.active');
                if (activeLink) activeLink.scrollIntoView({ block: 'start' });
            }, 0);

            // サイドバー幅の復元とリサイズ（with-navigation時のみ）
            if (document.body.classList.contains('with-navigation')) {
                const host = document.body;
                const css = getComputedStyle(host);
                const minW = parseInt(css.getPropertyValue('--nav-min')) || 200;
                const maxW = parseInt(css.getPropertyValue('--nav-max')) || 640;

                const savedWidth = localStorage.getItem('nav-width');
                if (savedWidth) {
                    host.style.setProperty('--nav-width', savedWidth + 'px');
                }

                const resizer = document.querySelector('.nav-resizer');
                let dragging = false;
                const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

                if (resizer) {
                    // キーボード操作（アクセシビリティ）
                    resizer.addEventListener('keydown', e => {
                        const step = e.shiftKey ? 50 : 10;
                        let cur = parseInt(getComputedStyle(host).getPropertyValue('--nav-width'), 10) || 280;
                        if (e.key === 'ArrowLeft') cur -= step;
                        else if (e.key === 'ArrowRight') cur += step;
                        else if (e.key === 'Home') cur = minW;
                        else if (e.key === 'End') cur = maxW;
                        else if (e.key === 'Enter') cur = 280; // リセット
                        else return;
                        cur = clamp(cur, minW, maxW);
                        host.style.setProperty('--nav-width', cur + 'px');
                        localStorage.setItem('nav-width', cur);
                        e.preventDefault();
                    });

                    // ドラッグ操作（Pointer Events）
                    resizer.addEventListener('pointerdown', e => {
                        if (window.matchMedia('(max-width: 768px)').matches) return;
                        dragging = true;
                        resizer.classList.add('dragging');
                        try { resizer.setPointerCapture(e.pointerId); } catch (_) {}
                    });

                    window.addEventListener('pointermove', e => {
                        if (!dragging) return;
                        const w = clamp(e.clientX, minW, maxW);
                        host.style.setProperty('--nav-width', w + 'px');
                    });

                    window.addEventListener('pointerup', () => {
                        if (!dragging) return;
                        dragging = false;
                        resizer.classList.remove('dragging');
                        const v = getComputedStyle(host).getPropertyValue('--nav-width').trim();
                        const px = parseInt(v, 10);
                        if (!Number.isNaN(px)) localStorage.setItem('nav-width', px);
                    });
                }

                // PJAX（履歴API + fetch）: file:// では無効化し通常遷移
                if (location.protocol !== 'file:') {
                    const contentEl = document.querySelector('.content-with-nav');
                    const navEl = document.querySelector('.navigation-sidebar');

                    if (contentEl && navEl) {
                        function updateActiveNav() {
                            const links = document.querySelectorAll('.navigation-sidebar .nav-file-link');
                            links.forEach(l => l.classList.remove('active'));
                            const current = Array.from(links).find(l => l.href === location.href);
                            if (current) current.classList.add('active');
                        }

                        function isInternal(a) {
                            try {
                                const u = new URL(a.href, location.href);
                                return u.origin === location.origin;
                            } catch (_) { return false; }
                        }

                        function shouldHandle(a) {
                            if (!isInternal(a)) return false;
                            if (a.target && a.target !== '' && a.target !== '_self') return false;
                            if (a.hasAttribute('download')) return false;
                            const u = new URL(a.href, location.href);
                            if (!u.pathname.toLowerCase().endsWith('.html')) return false;
                            // 同一ページ内のハッシュ遷移はそのまま許可
                            if (u.hash && u.pathname === location.pathname && u.search === location.search) return false;
                            return true;
                        }

                        async function navigate(url, opt = {}) {
                            try {
                                const resp = await fetch(url, { credentials: 'same-origin' });
                                if (!resp.ok) throw new Error(resp.status + ' ' + resp.statusText);
                                const text = await resp.text();
                                const doc = new DOMParser().parseFromString(text, 'text/html');
                                const next = doc.querySelector('.content-with-nav');
                                if (!next) { window.location.href = url; return; }

                                // 本文差し替え
                                contentEl.innerHTML = next.innerHTML;

                                // タイトル更新
                                document.title = doc.title || document.title;

                                // 履歴更新
                                if (!opt.replace) history.pushState({ url }, '', url);

                                // ナビactive更新
                                updateActiveNav();

                                // Prism再適用
                                if (window.Prism && window.Prism.highlightAllUnder) {
                                    window.Prism.highlightAllUnder(contentEl);
                                }

                                // Mermaid再適用
                                if (window.mermaid && window.mermaid.run) {
                                    try {
                                        await window.mermaid.run({ nodes: contentEl.querySelectorAll('.mermaid') });
                                    } catch (e) { /* noop */ }
                                }

                                // スクロール
                                const u = new URL(url, location.href);
                                if (u.hash) {
                                    let id = u.hash.slice(1);
                                    try { id = decodeURIComponent(id); } catch (_) {}
                                    let t = document.getElementById(id);
                                    if (!t && window.CSS && CSS.escape) {
                                        t = contentEl.querySelector('#' + CSS.escape(id));
                                    }
                                    if (t) t.scrollIntoView();
                                } else {
                                    window.scrollTo(0, 0);
                                }
                            } catch (e) {
                                // 失敗時は通常遷移
                                window.location.href = url;
                            }
                        }

                        // クリック捕捉（ナビ/本文の内部リンク）
                        document.addEventListener('click', (e) => {
                            const a = e.target.closest('a');
                            if (!a) return;
                            if (!shouldHandle(a)) return;
                            e.preventDefault();
                            navigate(a.href);
                        });

                        // 戻る/進む
                        window.addEventListener('popstate', (e) => {
                            const url = (e.state && e.state.url) ? e.state.url : location.href;
                            navigate(url, { replace: true });
                        });
                    }
                }
            }
        });
    </script>
</body>
</html>
`;
}
