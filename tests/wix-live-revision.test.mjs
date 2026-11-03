import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parsePublishedRevision, parseCheckpointNote, readPublishedRevision } from '../scripts/wix-live-revision.mjs';

const siteId = '97bf5405-2507-4744-b53a-0f1a5a61796d';
const commit = 'a'.repeat(40);
const markup = `{"siteId":"${siteId}","siteRevision":"1590"}<script>{"siteRevision":1590}</script>`;

test('the live Wix revision must identify the site and be unambiguous', () => {
  assert.equal(parsePublishedRevision(markup, siteId), '1590');
  assert.throws(() => parsePublishedRevision(markup, 'another-site'));
  assert.throws(() => parsePublishedRevision(`{"siteId":"${siteId}"}`, siteId));
  assert.throws(() => parsePublishedRevision(`${markup}{"siteRevision":1591}`, siteId));
});

test('the checkpoint note must match the source commit and site', () => {
  const note = JSON.stringify({ schemaVersion: 1, sourceCommit: commit, siteId, liveRevision: '1590' });
  assert.equal(parseCheckpointNote(note, commit, siteId), '1590');
  assert.throws(() => parseCheckpointNote(note, 'b'.repeat(40), siteId));
  assert.throws(() => parseCheckpointNote(note, commit, 'different-site'));
  assert.throws(() => parseCheckpointNote('{"schemaVersion":1}', commit, siteId));
});

test('revision reads fail closed on an unexpected site or response', async () => {
  const config = { siteId, siteUrl: 'https://www.skanditravels.com/' };
  const response = { ok: true, status: 200, url: config.siteUrl, text: async () => markup };
  assert.equal(await readPublishedRevision(config, async () => response), '1590');
  await assert.rejects(readPublishedRevision(config, async () => ({ ...response, url: 'https://other.example/' })));
  await assert.rejects(readPublishedRevision(config, async () => ({ ...response, ok: false, status: 503 })));
  await assert.rejects(readPublishedRevision({ ...config, siteUrl: 'http://www.skanditravels.com/' }, async () => response));
});

test('a checkpoint and its revision note survive an atomic push and fresh fetch', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skandi-wix-state-'));
  const repo = path.join(dir, 'repo');
  const remote = path.join(dir, 'remote.git');
  const clone = path.join(dir, 'clone');
  const run = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    fs.mkdirSync(repo); fs.mkdirSync(clone);
    run(dir, 'init', '--bare', remote);
    run(repo, 'init'); run(repo, 'config', 'user.name', 'Test'); run(repo, 'config', 'user.email', 'test@example.invalid');
    fs.writeFileSync(path.join(repo, 'file'), 'source');
    run(repo, 'add', 'file'); run(repo, 'commit', '-m', 'source');
    const sha = run(repo, 'rev-parse', 'HEAD');
    const note = JSON.stringify({ schemaVersion: 1, sourceCommit: sha, siteId, liveRevision: '1590' });
    run(repo, 'notes', '--ref=refs/notes/skandi-wix-published', 'add', '-m', note, sha);
    run(repo, 'push', '--atomic', remote, 'HEAD:refs/heads/automation/wix-published', 'refs/notes/skandi-wix-published:refs/notes/skandi-wix-published');
    run(clone, 'init');
    run(clone, 'fetch', remote, 'refs/heads/automation/wix-published:refs/remotes/origin/automation/wix-published', 'refs/notes/skandi-wix-published:refs/notes/skandi-wix-published');
    const fetched = run(clone, 'rev-parse', 'refs/remotes/origin/automation/wix-published');
    const fetchedNote = run(clone, 'notes', '--ref=refs/notes/skandi-wix-published', 'show', fetched);
    assert.equal(fetched, sha);
    assert.equal(parseCheckpointNote(fetchedNote, fetched, siteId), '1590');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
