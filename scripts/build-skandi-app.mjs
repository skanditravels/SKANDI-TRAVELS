#!/usr/bin/env node
/**
 * SKANDI V12 public single-embed compiler.
 * Reads canonical Git HTML/CSS/JS source without rewriting original files.
 * Produces one self-contained HTML document per registered public page.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const postcss = require('postcss');
const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO = path.resolve(THIS_DIR, '..');
const SOURCE_ROOT = process.env.SKANDI_REPO_ROOT ? path.resolve(process.env.SKANDI_REPO_ROOT) : DEFAULT_REPO;
const OUT_DIR = path.resolve(process.env.SKANDI_OUTPUT_DIR || path.join(SOURCE_ROOT, 'dist'));
const BUILD_SHA = (process.env.GITHUB_SHA || 'main').trim();
const CDN_ROOT = `https://cdn.jsdelivr.net/gh/skanditravels/SKANDI-TRAVELS@${encodeURIComponent(BUILD_SHA)}/skandi-embeds/`;

// Only registered, actually implemented pages are published. To add another
// page, specify all 3 verified source files and its established Wix contract.
const PAGES = {
  home: { slug: 'home', dir: 'home', stem: 'skandi-home', source: 'SKANDI_HOME', title: 'SKANDI Travels | Home' }
};
const CHROME = {
  header: { dir: 'global', stem: 'skandi-header', mount: 'skandi-global-header-root' },
  footer: { dir: 'global', stem: 'skandi-footer', mount: 'skandi-global-footer-root' },
  mobileNav: { dir: 'global', stem: 'skandi-mobile-nav', mount: 'skandi-mobile-nav-root' }
};

async function readRequired(relPath) {
  const fullPath = path.join(SOURCE_ROOT, 'skandi-embeds', relPath);
  try { return await fs.readFile(fullPath, 'utf8'); }
  catch (e) { throw new Error(`Required Git source missing: skandi-embeds/${relPath} (${e.code || e.message})`); }
}

function splitSelectors(selector) {
  const list = [];
  let buf = '', sq = false, dq = false, parens = 0, brackets = 0, escape = false;
  for (const c of selector) {
    if (escape) { buf += c; escape = false; continue; }
    if (c === '\\') { buf += c; escape = true; continue; }
    if (!dq && c === "'") sq = !sq;
    else if (!sq && c === '"') dq = !dq;
    if (!sq && !dq) {
      if (c === '(') parens++;
      else if (c === ')') parens--;
      else if (c === '[') brackets++;
      else if (c === ']') brackets--;
      if (c === ',' && !parens && !brackets) { list.push(buf.trim()); buf = ''; continue; }
    }
    buf += c;
  }
  if (buf.trim()) list.push(buf.trim());
  return list;
}

function scopeSelector(selector, mount) {
  const sel = selector.trim();
  if (!sel) return sel;
  if (sel === ':root' || sel === 'html' || sel === 'body') return mount;
  // Body/html state selectors must still observe state added to document.body.
  if (/^(?:html|body)(?=[.#\[:])/i.test(sel)) return `${sel.replace(/^(html|body)/i, (_, element) => element.toLowerCase())} ${mount}`;
  if (/^:root(?=[.#\[:])/i.test(sel)) return `${sel.replace(':root', 'html')} ${mount}`;
  return `${mount} ${sel}`;
}

function rewriteRelativeUrls(css, sourceDir) {
  // Keep data:, fragment, protocol, root-relative and Wix/Supabase URLs unchanged.
  return css.replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/gi, (full, quote, raw) => {
    const asset = raw.trim();
    if (/^(?:data:|blob:|https?:|\/\/|\/|#)/i.test(asset)) return full;
    const normalized = path.posix.normalize(path.posix.join(sourceDir, asset));
    if (normalized.startsWith('../') || normalized.startsWith('/')) {
      throw new Error(`CSS asset escapes skandi-embeds: ${sourceDir}/${asset}`);
    }
    return `url("${CDN_ROOT}${normalized}")`;
  });
}

function cssFor(source, mount, relPath) {
  const ast = postcss.parse(source, { from: relPath });
  ast.walkRules(rule => {
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) return;
    }
    rule.selector = splitSelectors(rule.selector).map(sel => scopeSelector(sel, `#${mount}`)).join(',\n');
  });
  return rewriteRelativeUrls(ast.toString(), path.posix.dirname(relPath));
}

function requireExactlyOne(source, pattern, replacement, label) {
  const matches = [...source.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))];
  if (matches.length !== 1) throw new Error(`${label}: expected one V12 pattern, found ${matches.length}. Do not publish an unverified contract change.`);
  return source.replace(pattern, replacement);
}

function adaptForShell(source, key) {
  if (key === 'header') {
    // This message requests a fixed 118px Wix HTML element. Suppress only
    // the generated copy; the standalone Git source is unchanged.
    return requireExactlyOne(source,
      /post\(\s*["']SKANDI_EMBED_RESIZE["']\s*,\s*\{\s*height\s*:\s*118\s*\}\s*\)\s*;/g,
      '/* Full-viewport shell owns the iframe height. */', 'Header legacy resize');
  }
  if (key === 'home') {
    // Home page's content ResizeObserver is irrelevant inside the viewport
    // shell. Suppress the message, NOT its rendering or data handling.
    return requireExactlyOne(source,
      /send\(\s*["']RESIZE_IFRAME["']\s*,\s*\{\s*height\s*\}\s*\)\s*;/g,
      '/* Full-viewport shell owns the iframe height. */', 'Home legacy resize');
  }
  return source;
}

function safeInlineJS(js) { return js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--'); }
function safeInlineCSS(css) { return css.replace(/<\/style/gi, '<\\/style'); }
function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function embedScript(js, name) { return `<script data-skandi-part="${escapeAttr(name)}">\n(()=>{\n${safeInlineJS(js)}\n})();\n</script>`; }

async function part({dir, stem, mount}) {
  const base = `${dir}/${stem}`;
  const [html, css, js] = await Promise.all(['html', 'css', 'js'].map(ext => readRequired(`${base}.${ext}`)));
  if (/<\s*(?:!doctype|html|head|body|script|style)\b/i.test(html)) {
    throw new Error(`${base}.html must be an HTML fragment (no document, style or script tags)`);
  }
  return { html, css: cssFor(css, mount, `${base}.css`), js, name: stem };
}

async function buildOne(page) {
  const pagePart = await part({dir:page.dir, stem:page.stem, mount:'skandi-app-root'});
  const [header, footer, mobileNav, shellCSS, shellJS] = await Promise.all([
    part(CHROME.header), part(CHROME.footer), part(CHROME.mobileNav),
    readRequired('global/skandi-shell.css'), readRequired('global/skandi-shell.js')
  ]);
  const scriptOrder = [
    embedScript(shellJS, 'skandi-shell-runtime'),
    embedScript(adaptForShell(header.js, 'header'), 'header'),
    embedScript(footer.js, 'footer'),
    embedScript(mobileNav.js, 'mobile-nav'),
    embedScript(adaptForShell(pagePart.js, page.slug), page.slug)
  ];
  const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="theme-color" content="#022e64">\n<title>${escapeAttr(page.title)}</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">\n<style data-skandi-part="header">${safeInlineCSS(header.css)}</style>\n<style data-skandi-part="home">${safeInlineCSS(pagePart.css)}</style>\n<style data-skandi-part="footer">${safeInlineCSS(footer.css)}</style>\n<style data-skandi-part="mobile-nav">${safeInlineCSS(mobileNav.css)}</style>\n<style data-skandi-part="shell">${safeInlineCSS(shellCSS)}</style>\n</head>\n<body>\n<div id="skandi-shell-root" data-skandi-page="${escapeAttr(page.slug)}">\n<div id="skandi-global-header-root">${header.html}</div>\n<main id="skandi-app-root" role="main">${pagePart.html}</main>\n<div id="skandi-global-footer-root">${footer.html}</div>\n<nav id="skandi-mobile-nav-root" aria-label="Mobile application navigation">${mobileNav.html}</nav>\n</div>\n${scriptOrder.join('\n')}\n</body>\n</html>\n`;
  const dest = path.join(OUT_DIR, page.slug, 'index.html');
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, html, 'utf8');
  return { page:page.slug, output:dest, bytes:Buffer.byteLength(html) };
}

export async function build() {
  const results = [];
  for (const page of Object.values(PAGES)) results.push(await buildOne(page));
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build().then(results => results.forEach(r => console.log(`${r.page}: ${r.bytes} bytes -> ${r.output}`))).catch(error => {
    console.error('SKANDI_BUILD_FAILED:', error.message);
    process.exitCode = 1;
  });
}
