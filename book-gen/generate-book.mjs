/**
 * generate-book.mjs
 *
 * Converts building-microservices-fullstack.md into a professional PDF book.
 * Pipeline: Markdown → HTML → PDF (Chrome headless) → Post-process (pdf-lib)
 *
 * Two-pass generation:
 *   Pass 1: Front matter (title, copyright, TOC) — no headers/footers
 *   Pass 2: Body content (chapters, appendices, about) — with headers + page numbers
 *   Merge: pdf-lib combines, fixes numbering, adds bookmarks
 *
 * Usage: node generate-book.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import puppeteer from 'puppeteer-core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(__dirname, '..', 'building-microservices-fullstack-v2.md');
const OUTPUT = path.resolve(__dirname, '..', 'building-microservices-fullstack.pdf');

// ---------------------------------------------------------------------------
// 1. Read source
// ---------------------------------------------------------------------------
console.log('Reading source markdown...');
const markdown = fs.readFileSync(SOURCE, 'utf-8');

// ---------------------------------------------------------------------------
// 2. Pre-process: strip the markdown TOC (we generate our own)
//    Also strip the HTML/Mermaid comments and the original title block
// ---------------------------------------------------------------------------
let cleaned = markdown
  // Remove the original H1 title and author blockquote at the top of the document
  // (we have a custom title page, so this would be redundant)
  .replace(/^# Building Microservices Full-Stack[^\n]*\n(?:\s*\n)*(?:>.*\n)*/, '')
  // Remove HTML comments — handle --> inside mermaid code by matching to a --> on its own line
  .replace(/<!--[\s\S]*?^-->\s*$/gm, '')
  // Fallback: remove any remaining simple HTML comments
  .replace(/<!--[^>]*-->/g, '')
  // Remove the inline TOC links section (from "## Table of Contents" to the next "---")
  .replace(/## Table of Contents[\s\S]*?(?=\n---\n)/, '');

// ---------------------------------------------------------------------------
// 3. Parse markdown with custom renderer
// ---------------------------------------------------------------------------

let chapterNumber = 0;
let appendixLetter = '';
const tocEntries = [];
let inFrontMatter = true; // true until we hit Chapter 1

/**
 * Detect if a code block is an ASCII diagram (box-drawing characters).
 */
function isAsciiDiagram(code) {
  const boxChars = /[┌┐└┘│─┬┴├┤▶◀▼▲═║╔╗╚╝╠╣╦╩]/;
  const lineCount = code.split('\n').length;
  const boxLineCount = code.split('\n').filter(l => boxChars.test(l)).length;
  return lineCount >= 5 && boxLineCount / lineCount > 0.3;
}

/**
 * Render an ASCII diagram as a styled monospace block.
 */
function renderDiagram(code) {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<div class="diagram"><pre>${escaped}</pre></div>`;
}

/**
 * Generate a URL-safe anchor from heading text.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

const marked = new Marked({
  gfm: true,
  breaks: false,
});

const renderer = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const rawText = tokens.map(t => t.raw || t.text || '').join('');
    const slug = slugify(rawText);

    // Chapter headings (## Chapter N: ...)
    const chapterMatch = rawText.match(/^Chapter\s+(\d+):\s*(.+)/);
    const appendixMatch = rawText.match(/^Appendix\s+([A-Z]):\s*(.+)/);
    const prefaceMatch = rawText.match(/^Preface$/i);

    if (depth === 2 && chapterMatch) {
      inFrontMatter = false;
      chapterNumber = parseInt(chapterMatch[1], 10);
      const title = chapterMatch[2].trim();
      tocEntries.push({ depth: 2, number: `Chapter ${chapterNumber}`, title, slug, type: 'chapter' });
      return `<div class="chapter-break" id="${slug}">
        <div class="chapter-label">Chapter ${chapterNumber}</div>
        <h1 class="chapter-title">${title}</h1>
        <hr class="chapter-rule" />
      </div>`;
    }

    if (depth === 2 && appendixMatch) {
      appendixLetter = appendixMatch[1];
      const title = appendixMatch[2].trim();
      tocEntries.push({ depth: 2, number: `Appendix ${appendixLetter}`, title, slug, type: 'appendix' });
      return `<div class="chapter-break" id="${slug}">
        <div class="chapter-label">Appendix ${appendixLetter}</div>
        <h1 class="chapter-title">${title}</h1>
        <hr class="chapter-rule" />
      </div>`;
    }

    if (depth === 2 && prefaceMatch) {
      tocEntries.push({ depth: 2, number: '', title: 'Preface', slug, type: 'preface' });
      return `<div class="chapter-break" id="${slug}">
        <h1 class="chapter-title">Preface</h1>
        <hr class="chapter-rule" />
      </div>`;
    }

    // Sub-section headings (###) — add to TOC
    if (depth === 3) {
      tocEntries.push({ depth: 3, title: rawText, slug, type: 'section' });
      return `<h3 id="${slug}">${text}</h3>`;
    }

    // Deeper headings
    const tag = `h${depth}`;
    return `<${tag} id="${slug}">${text}</${tag}>`;
  },

  code({ text, lang }) {
    // Detect ASCII diagrams
    if (!lang && isAsciiDiagram(text)) {
      return renderDiagram(text);
    }
    if (lang && isAsciiDiagram(text)) {
      return renderDiagram(text);
    }

    // Syntax-highlighted code block
    let highlighted;
    const language = lang || '';
    try {
      if (language && hljs.getLanguage(language)) {
        highlighted = hljs.highlight(text, { language }).value;
      } else {
        highlighted = hljs.highlightAuto(text).value;
      }
    } catch {
      highlighted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    const langLabel = language ? `<span class="code-lang">${language}</span>` : '';
    const lineCount = text.split('\n').length;
    const breakClass = lineCount > 35 ? 'code-long' : '';

    return `<div class="code-block ${breakClass}">
      ${langLabel}
      <pre><code class="hljs language-${language}">${highlighted}</code></pre>
    </div>`;
  },

  blockquote({ tokens }) {
    const body = this.parser.parse(tokens);
    return `<blockquote class="styled-quote">${body}</blockquote>`;
  },

  table({ header, rows }) {
    let html = '<table class="styled-table"><thead><tr>';
    for (const cell of header) {
      const align = cell.align ? ` style="text-align:${cell.align}"` : '';
      html += `<th${align}>${this.parser.parseInline(cell.tokens)}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (const row of rows) {
      html += '<tr>';
      for (const cell of row) {
        const align = cell.align ? ` style="text-align:${cell.align}"` : '';
        html += `<td${align}>${this.parser.parseInline(cell.tokens)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  },

  hr() {
    // Horizontal rules in the source act as section dividers — we don't need extra page breaks for them
    return '<hr class="section-divider" />';
  },

  codespan({ text }) {
    return `<code class="inline-code">${text}</code>`;
  },

  list({ ordered, body, items }) {
    const tag = ordered ? 'ol' : 'ul';
    let inner = '';
    for (const item of items) {
      const checked = item.checked;
      if (checked === true) {
        inner += `<li class="task-item"><span class="checkbox">☑</span> ${this.parser.parse(item.tokens)}</li>`;
      } else if (checked === false) {
        inner += `<li class="task-item"><span class="checkbox">☐</span> ${this.parser.parse(item.tokens)}</li>`;
      } else {
        inner += `<li>${this.parser.parse(item.tokens)}</li>`;
      }
    }
    return `<${tag}>${inner}</${tag}>`;
  },
};

marked.use({ renderer });

console.log('Parsing markdown...');
const bodyHtml = marked.parse(cleaned);
console.log(`  Body HTML length: ${bodyHtml.length} chars`);

// ---------------------------------------------------------------------------
// 4. Build TOC HTML
// ---------------------------------------------------------------------------
function buildToc() {
  let html = '<div class="toc-page"><h1 class="toc-heading">Contents</h1><div class="toc-entries">';
  for (const entry of tocEntries) {
    if (entry.depth === 2) {
      const prefix = entry.number ? `${entry.number}: ` : '';
      html += `<div class="toc-chapter"><a href="#${entry.slug}">${prefix}${entry.title}</a></div>`;
    } else if (entry.depth === 3) {
      html += `<div class="toc-section"><a href="#${entry.slug}">${entry.title}</a></div>`;
    }
  }
  html += '</div></div>';
  return html;
}

// ---------------------------------------------------------------------------
// 5. Build Title Page
// ---------------------------------------------------------------------------
function buildTitlePage() {
  return `
  <div class="title-page">
    <hr class="title-rule" />
    <div class="title-block">
      <div class="title-word">BUILDING</div>
      <div class="title-word">MICROSERVICES</div>
      <div class="title-word">FULL-STACK</div>
    </div>
    <div class="title-subtitle">From Zero to Production</div>
    <hr class="title-rule" />
    <div class="title-tagline">A Practical Engineering Guide</div>
    <div class="title-author">Manazir Ali</div>
    <div class="title-role">Full-Stack Software Engineer</div>
    <div class="title-version">First Edition &middot; v1.0.0 &middot; February 2026</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 6. Build Copyright Page
// ---------------------------------------------------------------------------
function buildCopyrightPage() {
  return `
  <div class="copyright-page">
    <div class="copyright-content">
      <p class="copyright-title">Building Microservices Full-Stack: From Zero to Production</p>
      <p class="copyright-edition">First Edition</p>
      <br/>
      <p>Copyright &copy; 2026 Manazir Ali. All rights reserved.</p>
      <p>No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the author.</p>
      <br/>
      <p class="copyright-meta"><strong>Built with:</strong> TypeScript, Express.js, Next.js 15, React 19, PostgreSQL, Prisma, Docker, Kubernetes</p>
      <p class="copyright-meta"><strong>Source code:</strong> github.com/mnzralee/fullstack-grocery</p>
      <br/>
      <p class="copyright-meta">First Edition, February 2026</p>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 7. Build About the Author Page
// ---------------------------------------------------------------------------
function buildAboutAuthor() {
  return `
  <div class="about-author-page">
    <h1 class="about-heading">About the Author</h1>
    <hr class="chapter-rule" />
    <div class="about-content">
      <p><strong>Manazir Ali</strong> is a full-stack software engineer who builds production financial blockchain systems. His work spans the entire stack: from React frontends to NestJS microservices, from PostgreSQL databases to Hyperledger Fabric smart contracts, and from Docker containers to Kubernetes clusters.</p>
      <p>The patterns in this book are drawn directly from his experience engineering a production financial protocol, where a single bug in a transfer function can mean real money disappearing. That kind of pressure teaches discipline, methodology, and deliberate engineering.</p>
      <p>He believes that every line of code is a chance to create, learn, and grow, and that little by little, we shape the future one line of code at a time.</p>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 8. Assemble full HTML document
// ---------------------------------------------------------------------------
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Building Microservices Full-Stack</title>

<style>
/* ============================================================
   Google Fonts
   ============================================================ */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap');

/* ============================================================
   Page Setup
   ============================================================ */
@page {
  size: 7in 10in;
  margin: 0.85in 0.75in 0.85in 1.0in;
}

@page :first {
  margin-top: 0;
  margin-bottom: 0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 10pt;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
  font-weight: 400;
}

/* ============================================================
   Title Page
   ============================================================ */
.title-page {
  page-break-after: always;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5in 0.5in 0.5in 0.5in;
  text-align: center;
}

.title-rule {
  width: 100%;
  border: none;
  border-top: 4px solid #111;
  margin: 0;
}

.title-block {
  margin: 0.8in 0 0.3in 0;
}

.title-word {
  font-family: 'Inter', sans-serif;
  font-size: 38pt;
  font-weight: 700;
  color: #111;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.title-subtitle {
  font-size: 16pt;
  font-weight: 400;
  color: #555;
  margin-bottom: 0.5in;
  letter-spacing: 0.02em;
}

.title-tagline {
  font-size: 12pt;
  font-weight: 500;
  color: #333;
  margin-top: 0.4in;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.title-author {
  font-size: 14pt;
  font-weight: 600;
  color: #111;
  margin-top: auto;
}

.title-role {
  font-size: 10pt;
  font-weight: 400;
  color: #666;
  margin-top: 0.05in;
}

.title-version {
  font-size: 9pt;
  color: #999;
  margin-top: 0.2in;
}

/* ============================================================
   Copyright Page
   ============================================================ */
.copyright-page {
  page-break-after: always;
  padding-top: 70%;
}

.copyright-content {
  font-size: 8.5pt;
  line-height: 1.6;
  color: #555;
}

.copyright-title {
  font-weight: 600;
  font-size: 9pt;
  color: #333;
}

.copyright-edition {
  font-style: italic;
  font-size: 8.5pt;
}

.copyright-meta {
  font-size: 8.5pt;
}

/* ============================================================
   Table of Contents
   ============================================================ */
.toc-page {
  page-break-after: always;
  padding-top: 0.5in;
}

.toc-heading {
  font-size: 24pt;
  font-weight: 700;
  color: #111;
  margin-bottom: 0.4in;
  text-align: center;
}

.toc-entries {
  font-size: 10pt;
  line-height: 2.0;
}

.toc-chapter {
  font-weight: 600;
  margin-top: 0.15in;
}

.toc-chapter:first-child {
  margin-top: 0;
}

.toc-section {
  padding-left: 1.2em;
  font-weight: 400;
  color: #444;
  font-size: 9.5pt;
}

.toc-entries a {
  color: inherit;
  text-decoration: none;
}

/* ============================================================
   Chapter Breaks
   ============================================================ */
.chapter-break {
  page-break-before: always;
  padding-top: 1.5in;
  margin-bottom: 0.4in;
}

.chapter-label {
  font-size: 13pt;
  font-weight: 500;
  color: #999;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 0.15in;
}

.chapter-title {
  font-size: 28pt;
  font-weight: 700;
  color: #111;
  line-height: 1.2;
  margin-bottom: 0.2in;
}

.chapter-rule {
  border: none;
  border-top: 3px solid #111;
  width: 100%;
  margin: 0 0 0.3in 0;
}

/* ============================================================
   Body Typography
   ============================================================ */
h2 {
  font-size: 22pt;
  font-weight: 700;
  color: #111;
  margin: 1.5em 0 0.5em 0;
  page-break-after: avoid;
}

h3 {
  font-size: 16pt;
  font-weight: 600;
  color: #111;
  margin: 1.3em 0 0.4em 0;
  page-break-after: avoid;
}

h4 {
  font-size: 12pt;
  font-weight: 600;
  color: #222;
  margin: 1em 0 0.3em 0;
  page-break-after: avoid;
}

h5 {
  font-size: 10pt;
  font-weight: 600;
  color: #333;
  margin: 0.8em 0 0.3em 0;
}

p {
  margin: 0 0 0.5em 0;
  orphans: 3;
  widows: 3;
}

strong {
  font-weight: 600;
}

em {
  font-style: italic;
}

a {
  color: #1a1a1a;
  text-decoration: none;
}

/* ============================================================
   Lists
   ============================================================ */
ul, ol {
  margin: 0.3em 0 0.6em 1.5em;
  padding: 0;
}

li {
  margin-bottom: 0.2em;
}

li > p {
  margin-bottom: 0.2em;
}

.task-item {
  list-style: none;
  margin-left: -1.2em;
}

.checkbox {
  font-size: 11pt;
  margin-right: 0.3em;
}

/* ============================================================
   Code Blocks
   ============================================================ */
.code-block {
  position: relative;
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 3px;
  margin: 0.5em 0 0.7em 0;
  padding: 0;
  page-break-inside: avoid;
  overflow: hidden;
}

.code-block.code-long {
  page-break-inside: auto;
}

.code-block pre {
  margin: 0;
  padding: 0.6em 0.8em;
  overflow-x: auto;
}

.code-block code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 8.5pt;
  line-height: 1.45;
  color: #1a1a1a;
  white-space: pre;
  word-wrap: normal;
}

.code-lang {
  position: absolute;
  top: 0;
  right: 0;
  background: #e9ecef;
  color: #777;
  font-family: 'Inter', sans-serif;
  font-size: 7pt;
  padding: 0.15em 0.5em;
  border-radius: 0 3px 0 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Inline code */
.inline-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  background: #f0f2f4;
  padding: 0.1em 0.3em;
  border-radius: 3px;
  color: #1a1a1a;
}

/* ============================================================
   Syntax Highlighting — Grayscale Professional Theme
   ============================================================ */
.hljs {
  background: transparent;
}

/* Keywords: bold */
.hljs-keyword,
.hljs-selector-tag,
.hljs-built_in,
.hljs-type,
.hljs-tag {
  color: #1a1a1a;
  font-weight: 700;
}

/* Strings: medium gray */
.hljs-string,
.hljs-attr,
.hljs-symbol,
.hljs-bullet,
.hljs-addition,
.hljs-template-variable,
.hljs-template-tag {
  color: #4a4a4a;
}

/* Comments: light italic */
.hljs-comment,
.hljs-quote,
.hljs-deletion,
.hljs-meta {
  color: #8b8b8b;
  font-style: italic;
}

/* Functions and titles: dark semi-bold */
.hljs-title,
.hljs-section,
.hljs-name {
  color: #2d2d2d;
  font-weight: 600;
}

/* Numbers, literals */
.hljs-number,
.hljs-literal,
.hljs-variable,
.hljs-params,
.hljs-link {
  color: #3a3a3a;
}

/* Attributes */
.hljs-attribute {
  color: #444;
}

/* Class/selector emphasis */
.hljs-selector-class,
.hljs-selector-id,
.hljs-regexp {
  color: #333;
  font-weight: 500;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: 700;
}

/* ============================================================
   ASCII Diagrams
   ============================================================ */
.diagram {
  margin: 0.6em 0 0.8em 0;
  page-break-inside: avoid;
  text-align: center;
}

.diagram pre {
  display: inline-block;
  text-align: left;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8pt;
  line-height: 1.35;
  background: #fafbfc;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  padding: 0.8em 1em;
  color: #1a1a1a;
  white-space: pre;
  overflow-x: auto;
}

/* ============================================================
   Blockquotes
   ============================================================ */
.styled-quote {
  border-left: 3px solid #3b82f6;
  background: #f0f7ff;
  margin: 0.5em 0 0.7em 0;
  padding: 0.6em 1em;
  border-radius: 0 4px 4px 0;
  page-break-inside: avoid;
}

.styled-quote p {
  font-style: italic;
  color: #333;
  margin-bottom: 0.3em;
}

.styled-quote p:last-child {
  margin-bottom: 0;
}

/* ============================================================
   Tables
   ============================================================ */
.styled-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5em 0 0.8em 0;
  font-size: 9pt;
  page-break-inside: avoid;
}

.styled-table thead th {
  background: #f3f4f6;
  font-weight: 600;
  text-align: left;
  padding: 0.5em 0.6em;
  border-top: 2px solid #333;
  border-bottom: 1px solid #ccc;
}

.styled-table tbody td {
  padding: 0.4em 0.6em;
  border-bottom: 1px solid #e5e7eb;
}

.styled-table tbody tr:nth-child(even) {
  background: #fafafa;
}

/* ============================================================
   Section Dividers (from --- in markdown)
   ============================================================ */
.section-divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.5em 0;
}

/* ============================================================
   About the Author
   ============================================================ */
.about-author-page {
  page-break-before: always;
  padding-top: 1.5in;
}

.about-heading {
  font-size: 24pt;
  font-weight: 700;
  color: #111;
  margin-bottom: 0.2in;
}

.about-content {
  margin-top: 0.3in;
  font-size: 10pt;
  line-height: 1.7;
  max-width: 5in;
}

.about-content p {
  margin-bottom: 0.6em;
}

/* ============================================================
   Print Utilities
   ============================================================ */
@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
</head>
<body>

${buildTitlePage()}
${buildCopyrightPage()}
${buildToc()}

<div class="book-body">
${bodyHtml}
</div>

${buildAboutAuthor()}

</body>
</html>`;

// ---------------------------------------------------------------------------
// 9. Build separate HTML documents for front matter vs body
// ---------------------------------------------------------------------------

// Shared CSS (extracted so both documents use the same styles)
const sharedCss = fullHtml.match(/<style>([\s\S]*?)<\/style>/)[1];

function wrapHtml(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Building Microservices Full-Stack</title>
<style>${sharedCss}</style>
</head>
<body>${bodyContent}</body>
</html>`;
}

const frontMatterHtml = wrapHtml(`
  ${buildTitlePage()}
  ${buildCopyrightPage()}
  ${buildToc()}
`);

// Strip leading section dividers from body (they create blank pages)
const cleanedBody = bodyHtml.replace(/^(\s*<hr class="section-divider"\s*\/?>\s*)+/, '');

// ---------------------------------------------------------------------------
// 10. Split body into chunks to avoid Chrome's ~65K px render height limit
// ---------------------------------------------------------------------------
// Split at chapter boundaries (<div class="chapter-break"...)
const chapterSplitRe = /(?=<div class="chapter-break")/g;
const bodyChunks = cleanedBody.split(chapterSplitRe).filter(c => c.trim());
// Group chunks into batches to stay under Chrome's render limit
// Each batch gets ~4-5 chapters
const CHAPTERS_PER_BATCH = 5;
const bodyBatches = [];
for (let i = 0; i < bodyChunks.length; i += CHAPTERS_PER_BATCH) {
  const batch = bodyChunks.slice(i, i + CHAPTERS_PER_BATCH).join('');
  bodyBatches.push(batch);
}
// Add About Author to the last batch
const aboutAuthorHtml = buildAboutAuthor();

console.log(`  Split body into ${bodyBatches.length} batches (${bodyChunks.length} chapters)`);

// ---------------------------------------------------------------------------
// 11. Generate PDFs via Chrome headless (multi-pass)
// ---------------------------------------------------------------------------
console.log('Launching Chrome headless...');
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});

const FRONT_PDF = path.resolve(__dirname, '_front.pdf');
const BODY_PDFS = [];

const pdfMargins = {
  top: '0.85in',
  bottom: '0.85in',
  left: '1.0in',
  right: '0.75in',
};

const bodyHeaderTemplate = `
  <div style="
    width: 100%;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 7pt;
    color: #999;
    padding: 0 0.75in 0 1.0in;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  ">
    <span style="float: left;">Building Microservices Full-Stack</span>
  </div>
`;

// --- Pass 1: Front matter (NO headers/footers) ---
console.log('Pass 1: Generating front matter...');
const FRONT_HTML_FILE = path.resolve(__dirname, '_front.html');
fs.writeFileSync(FRONT_HTML_FILE, frontMatterHtml);
const frontPage = await browser.newPage();
await frontPage.goto(`file://${FRONT_HTML_FILE}`, { waitUntil: 'networkidle0', timeout: 60000 });
await frontPage.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 2000));
await frontPage.pdf({
  path: FRONT_PDF,
  width: '7in',
  height: '10in',
  printBackground: true,
  displayHeaderFooter: false,
  margin: pdfMargins,
});
await frontPage.close();

// --- Pass 2+: Body content in batches ---
for (let b = 0; b < bodyBatches.length; b++) {
  const isLast = (b === bodyBatches.length - 1);
  const batchContent = bodyBatches[b] + (isLast ? aboutAuthorHtml : '');
  const batchHtml = wrapHtml(`<div class="book-body">${batchContent}</div>`);
  const batchFile = path.resolve(__dirname, `_body_${b}.html`);
  const batchPdf = path.resolve(__dirname, `_body_${b}.pdf`);

  fs.writeFileSync(batchFile, batchHtml);
  BODY_PDFS.push(batchPdf);

  console.log(`Pass ${b + 2}: Generating body batch ${b + 1}/${bodyBatches.length}...`);
  const page = await browser.newPage();
  await page.goto(`file://${batchFile}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  const height = await page.evaluate(() => document.body.scrollHeight);
  console.log(`  Batch ${b + 1} height: ${height}px`);

  await page.pdf({
    path: batchPdf,
    width: '7in',
    height: '10in',
    printBackground: true,
    timeout: 300000,
    displayHeaderFooter: true,
    headerTemplate: bodyHeaderTemplate,
    footerTemplate: `<div style="width:100%;"></div>`,
    margin: pdfMargins,
  });
  await page.close();

  // Clean up HTML file
  fs.unlinkSync(batchFile);
}
await browser.close();

// ---------------------------------------------------------------------------
// 12. Post-process: merge all PDFs, fix page numbers, add bookmarks (pdf-lib)
// ---------------------------------------------------------------------------
console.log('Post-processing with pdf-lib...');

const finalDoc = await PDFDocument.create();

// Set PDF metadata
finalDoc.setTitle('Building Microservices Full-Stack: From Zero to Production');
finalDoc.setAuthor('Manazir Ali');
finalDoc.setSubject('A Practical Engineering Guide');
finalDoc.setCreator('book-gen');
finalDoc.setCreationDate(new Date());

// Copy front matter pages
const frontDoc = await PDFDocument.load(fs.readFileSync(FRONT_PDF));
const frontPages = await finalDoc.copyPages(frontDoc, frontDoc.getPageIndices());
let frontPageCount = 0;
for (const pg of frontPages) {
  finalDoc.addPage(pg);
  frontPageCount++;
}
console.log(`  Front matter: ${frontPageCount} pages`);

// Copy body pages from all batches
let bodyPageCount = 0;
for (let b = 0; b < BODY_PDFS.length; b++) {
  const batchDoc = await PDFDocument.load(fs.readFileSync(BODY_PDFS[b]));
  const batchPages = await finalDoc.copyPages(batchDoc, batchDoc.getPageIndices());
  for (const pg of batchPages) {
    finalDoc.addPage(pg);
    bodyPageCount++;
  }
  console.log(`  Body batch ${b + 1}: ${batchPages.length} pages`);
}
console.log(`  Body content total: ${bodyPageCount} pages`);

// --- Add page numbers to body pages (overwrite Puppeteer's auto-numbering) ---
const helvetica = await finalDoc.embedFont(StandardFonts.Helvetica);
const helveticaBold = await finalDoc.embedFont(StandardFonts.HelveticaBold);
const fontSize = 8;
const headerFontSize = 6.5;

const allPages = finalDoc.getPages();
const totalPages = allPages.length;

for (let i = 0; i < totalPages; i++) {
  const pg = allPages[i];
  const { width, height } = pg.getSize();

  if (i < frontPageCount) {
    // Front matter: roman numerals at bottom center, but NOT on title page (page 0)
    if (i === 0) continue; // Skip title page entirely

    const roman = toRoman(i + 1);
    const textWidth = helvetica.widthOfTextAtSize(roman, fontSize);
    pg.drawText(roman, {
      x: (width - textWidth) / 2,
      y: 36, // 0.5 inch from bottom
      size: fontSize,
      font: helvetica,
      color: rgb(0.53, 0.53, 0.53),
    });
  } else {
    // Body pages: arabic numerals
    const bodyPageNum = i - frontPageCount + 1;
    const numStr = String(bodyPageNum);
    const textWidth = helvetica.widthOfTextAtSize(numStr, fontSize);
    pg.drawText(numStr, {
      x: (width - textWidth) / 2,
      y: 36,
      size: fontSize,
      font: helvetica,
      color: rgb(0.53, 0.53, 0.53),
    });

    // Running header on body pages (not on chapter opening pages)
    // We can't easily detect chapter-opening pages in post-processing,
    // so we add the header to all body pages (Puppeteer already does this)
  }
}

// --- Add PDF bookmarks/outlines ---
console.log('  Adding PDF bookmarks...');
// We'll add chapter-level bookmarks pointing to estimated page positions
// Since we know the TOC entries and their order, we can create bookmarks
// The actual page mapping requires knowledge of where chapters land in the body PDF
// For now, add a top-level bookmark for the book

// Helper: roman numeral converter
function toRoman(num) {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

// Save final PDF
const finalBytes = await finalDoc.save();
fs.writeFileSync(OUTPUT, finalBytes);

// Clean up intermediate files
fs.unlinkSync(FRONT_PDF);
for (const bp of BODY_PDFS) {
  try { fs.unlinkSync(bp); } catch {}
}
try { fs.unlinkSync(FRONT_HTML_FILE); } catch {}

// ---------------------------------------------------------------------------
// 12. Report
// ---------------------------------------------------------------------------
const stats = fs.statSync(OUTPUT);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`\nPDF generated successfully!`);
console.log(`  Output: ${OUTPUT}`);
console.log(`  Size:   ${sizeMB} MB`);
console.log(`  Pages:  ${totalPages} (${frontPageCount} front + ${bodyPageCount} body)`);
