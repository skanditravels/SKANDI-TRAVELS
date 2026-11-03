import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const revisionPattern = /^\d{1,20}$/;
const commitPattern = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;

export function parsePublishedRevision(html, siteId) {
  if (typeof html !== 'string' || !siteId || !html.toLowerCase().includes(siteId.toLowerCase())) {
    throw new Error('The live page did not identify the expected Wix site.');
  }
  const found = [...html.matchAll(/"siteRevision"\s*:\s*(?:"(\d+)"|(\d+)(?=\s*[,}]))/g)].map(match => match[1] || match[2]);
  const revisions = [...new Set(found)];
  if (revisions.length !== 1 || !revisionPattern.test(revisions[0])) {
    throw new Error('The published Wix revision is missing or ambiguous.');
  }
  return revisions[0];
}

export function parseCheckpointNote(text, checkpoint, siteId) {
  const note = JSON.parse(text);
  if (!commitPattern.test(checkpoint) || note.schemaVersion !== 1 || note.sourceCommit !== checkpoint ||
      note.siteId !== siteId || typeof note.liveRevision !== 'string' || !revisionPattern.test(note.liveRevision)) {
    throw new Error('The Wix publication checkpoint note is invalid or does not match the source checkpoint.');
  }
  return note.liveRevision;
}

export async function readPublishedRevision(config, fetchImpl = fetch) {
  const url = new URL(config.siteUrl);
  if (url.protocol !== 'https:' || url.username || url.password || !config.siteId) {
    throw new Error('The Wix site URL or site ID is invalid.');
  }
  const response = await fetchImpl(url, {
    headers: { 'cache-control': 'no-cache', pragma: 'no-cache' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok || new URL(response.url).origin !== url.origin) {
    throw new Error(`Could not verify the live Wix site (HTTP ${response.status}).`);
  }
  const html = await response.text();
  if (html.length > 10_000_000) throw new Error('The live Wix response is unexpectedly large.');
  return parsePublishedRevision(html, config.siteId);
}

async function main(args) {
  const config = JSON.parse(fs.readFileSync('wix.config.json', 'utf8'));
  const [command = 'read', value, extra] = args;
  if (command === 'read' || command === 'check') {
    if (command === 'check' && !revisionPattern.test(value || '')) throw new Error('An expected live Wix revision is required.');
    const current = await readPublishedRevision(config);
    if (command === 'check' && current !== value) {
      throw new Error(`The live Wix revision changed from ${value} to ${current}; synchronize and review the design before publishing.`);
    }
    console.log(current);
  } else if (command === 'note-expected') {
    console.log(parseCheckpointNote(fs.readFileSync(value, 'utf8'), extra, config.siteId));
  } else if (command === 'make-note') {
    if (!commitPattern.test(value || '') || !revisionPattern.test(extra || '') || !config.siteId) throw new Error('Invalid Wix checkpoint data.');
    console.log(JSON.stringify({ schemaVersion: 1, sourceCommit: value, siteId: config.siteId, liveRevision: extra, uiVersion: String(config.uiVersion) }));
  } else {
    throw new Error('Unknown Wix live revision command.');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
