import fs from 'node:fs/promises';
import path from 'node:path';

export const RECEIVER_TEMPLATE = 'skandi-embeds/receiver/skandi-wix-universal-receiver.html';

export function pageReceiverPath(page) {
  return path.posix.join(page.sourceDirectory, `${page.stem}.receiver.html`);
}

function safeJSON(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => ({
    '<': '\\u003c',
    '>': '\\u003e',
    '&': '\\u0026',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
  })[character]);
}

export async function renderPageReceiver(root, page) {
  const expected = {
    key: page.key,
    route: page.route,
    family: page.family,
    chrome: page.chrome,
    embedIds: Array.isArray(page.embedIds) ? page.embedIds.map(id => String(id).trim()) : [],
    receiver: pageReceiverPath(page)
  };
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(expected.key)
    || typeof expected.route !== 'string'
    || !['public', 'riaintra', 'altea'].includes(expected.family)
    || !['none', 'public', 'riaintra', 'altea'].includes(expected.chrome)
    || !/^(?:skandi-embeds|riaintra-embeds)\/[a-z0-9/-]+\/[a-z0-9-]+\.receiver\.html$/.test(expected.receiver)
    || expected.receiver.includes('..')) {
    throw new Error(`Cannot generate a page receiver for invalid route metadata: ${page.key || 'unknown'}`);
  }
  const templatePath = path.join(root, RECEIVER_TEMPLATE);
  const template = await fs.readFile(templatePath, 'utf8');
  const marker = 'const EXPECTED=null;';
  if (template.split(marker).length !== 2) throw new Error(`${RECEIVER_TEMPLATE}: expected exactly one page receiver marker.`);
  return template.replace(marker, `const EXPECTED=Object.freeze(${safeJSON(expected)});`);
}
