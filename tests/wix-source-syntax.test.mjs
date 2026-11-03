import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { parse } = require('acorn');
const root = fileURLToPath(new URL('..', import.meta.url));

function javascriptFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? javascriptFiles(file) : entry.isFile() && file.endsWith('.js') ? [file] : [];
  });
}

test('Wix site code parses as JavaScript and page controllers do not import React', () => {
  const failures = [];
  for (const folder of ['pages', 'public', 'backend']) {
    for (const file of javascriptFiles(path.join(root, 'src', folder))) {
      const name = path.relative(root, file);
      try {
        const tree = parse(fs.readFileSync(file, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
        if (folder === 'pages') {
          for (const item of tree.body) {
            if (item.type === 'ImportDeclaration' && /^react(?:-dom)?(?:\/|$)/.test(item.source.value)) {
              failures.push(name + ': React belongs in the HTML embed or a custom element, not Wix page code');
            }
          }
        }
      } catch (error) {
        failures.push(name + ': ' + error.message);
      }
    }
  }
  assert.deepEqual(failures, [], failures.join('\n'));
});
