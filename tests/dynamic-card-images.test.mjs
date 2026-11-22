import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { JSDOM } = require('jsdom');
const source = readFileSync(new URL('../skandi-embeds/global/skandi-shell.js', import.meta.url), 'utf8');
const runtime = source.slice(source.indexOf('// Keep automatically populated photo cards'));
const css = readFileSync(new URL('../skandi-embeds/global/skandi-shell.css', import.meta.url), 'utf8');
const tick = window => new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

test('dynamic card photos stay unique as sections and image sources change', async () => {
  const dom = new JSDOM(`<!doctype html><style>${css}</style><div id="skandi-shell-root" data-skandi-family="public">
    <article class="hotel-card"><div class="hotel-img" style="background-image:url(https://static.wixstatic.com/media/photo.jpg/v1/fill/w_500/photo.jpg)"></div><button>Book</button></article>
    <article class="offer-card"><div class="offer-img" style="background-image:url(https://static.wixstatic.com/media/photo.jpg/v1/fill/w_900/photo.jpg)"></div><button>View</button></article>
    <section hidden><article class="hs-card"><img src="https://example.com/hidden.jpg"></article></section>
    <article class="hs-card"><img src="https://example.com/hidden.jpg"></article>
  </div>`, {url:'https://example.com/', runScripts:'outside-only', pretendToBeVisual:true});
  const { window } = dom;
  window.eval(`const shellRoot = document.getElementById('skandi-shell-root');\n${runtime}`);
  await tick(window);
  const $ = selector => window.document.querySelector(selector);
  assert.equal($('.hotel-img').classList.contains('skandi-duplicate-card-image'), false);
  assert.equal($('.offer-img').classList.contains('skandi-duplicate-card-image'), true);
  assert.equal($('.offer-card button').textContent, 'View');
  assert.equal(window.document.querySelectorAll('.hs-card img')[1].classList.contains('skandi-duplicate-card-image'), false);
  $('section').hidden = false;
  await tick(window);
  assert.equal(window.document.querySelectorAll('.hs-card img')[1].classList.contains('skandi-duplicate-card-image'), true);
  $('section img').src = 'https://example.com/new.jpg';
  await tick(window);
  assert.equal(window.document.querySelectorAll('.hs-card img')[1].classList.contains('skandi-duplicate-card-image'), false);
  $('.offer-img').style.backgroundImage = 'url(https://example.com/other.jpg)';
  await tick(window);
  assert.equal($('.offer-img').classList.contains('skandi-duplicate-card-image'), false);
  dom.window.close();
});

test('arbitrary image service query parameters retain distinct identities', async () => {
  const dom = new JSDOM('<div id="skandi-shell-root" data-skandi-family="public"><article class="hs-card"><img src="https://example.com/image?q=one"></article><article class="hs-card"><img src="https://example.com/image?q=two"></article></div>', {url:'https://example.com/',runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.eval(`const shellRoot = document.getElementById('skandi-shell-root');\n${runtime}`);
  await tick(dom.window);
  assert.equal(dom.window.document.querySelectorAll('.skandi-duplicate-card-image').length, 0);
  dom.window.close();
});
