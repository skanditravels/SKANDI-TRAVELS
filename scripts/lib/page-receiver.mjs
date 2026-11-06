import fs from 'node:fs/promises';
import path from 'node:path';

export const RECEIVER_TEMPLATE = 'skandi-embeds/receiver/skandi-wix-universal-receiver.html';

// These identities are embedded in receivers that may already be installed in Wix.
// Keep them stable when their editable source files move to a new folder.
const INSTALLED_RECEIVER_IDENTITIES = Object.freeze({
  legalInternal:'skandi-embeds/legal-internal/skandi-legal-internal.receiver.html',
  alteaLaunchpad:'skandi-embeds/altea-launchpad/skandi-altea-launchpad.receiver.html',
  alteaReservations:'skandi-embeds/altea-reservations/skandi-altea-reservations.receiver.html',
  opsControl:'skandi-embeds/ops-control/skandi-ops-control.receiver.html',
  eos:'skandi-embeds/eos/skandi-eos.receiver.html',
  uniformCenter:'skandi-embeds/uniform-center/skandi-uniform-center.receiver.html',
  mail:'skandi-embeds/mail/skandi-mail.receiver.html',
  docunet:'skandi-embeds/docunet/skandi-docunet.receiver.html',
  policyControl:'skandi-embeds/policy-control/skandi-policy-control.receiver.html',
  mediaControl:'skandi-embeds/media-control/skandi-media-control.receiver.html',
  storeControl:'skandi-embeds/store-control/skandi-store-control.receiver.html',
  payroll:'skandi-embeds/payroll/skandi-payroll.receiver.html',
  groupTalk:'skandi-embeds/group-talk/skandi-group-talk.receiver.html'
});
export function pageReceiverPath(page) {
  return path.posix.join(page.sourceDirectory, `${page.stem}.receiver.html`);
}
export function pageReceiverIdentity(page) {
  return INSTALLED_RECEIVER_IDENTITIES[page.key] || pageReceiverPath(page);
}

// Every generated copy is byte-for-byte identical. The controller supplies
// the identity; legacy manifest receiver paths remain stable for installed
// older receivers during migration.
export async function renderPageReceiver(root) {
  return fs.readFile(path.join(root, RECEIVER_TEMPLATE), 'utf8');
}
