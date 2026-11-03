import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { needsWixPublish } from '../scripts/wix-publish-check.mjs';

test('deployment checkpoint captures source changes across unrelated and missed commits', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'skandi-wix-diff-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = message => { git('add', '.'); git('commit', '-m', message); return git('rev-parse', 'HEAD'); };
  try {
    git('init'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid');
    mkdirSync(path.join(dir, 'src')); mkdirSync(path.join(dir, 'skandi-embeds'));
    writeFileSync(path.join(dir, 'src', 'page.js'), 'one');
    const base = commit('base');
    assert.equal(needsWixPublish(dir, ''), true);
    assert.equal(needsWixPublish(dir, base), false);
    writeFileSync(path.join(dir, 'src', 'README.md'), 'notes');
    writeFileSync(path.join(dir, 'skandi-embeds', 'page.html'), '<p>test</p>');
    commit('documentation and embed');
    assert.equal(needsWixPublish(dir, base), false);
    writeFileSync(path.join(dir, 'src', 'page.js'), 'two');
    commit('source');
    writeFileSync(path.join(dir, 'skandi-embeds', 'page.html'), '<p>later</p>');
    const later = commit('later unrelated commit');
    assert.equal(needsWixPublish(dir, base, later), true);
    assert.equal(needsWixPublish(dir, later, later), false);
    assert.throws(() => needsWixPublish(dir, later, base));
    assert.throws(() => needsWixPublish(dir, 'does-not-exist'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
