// Text preparation only. The calling service must verify authorization,
// customer/booking association and dispatch idempotency before sending.
import { evaluateTransportReadiness } from './opsTransportReadiness.js';
import { SITE_MAP } from '../../public/siteMap.js';

const clean = (value, limit = 180) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit);
const html = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function problem(code) { const error = new Error(code); error.code = code; return error; }

/** Prepare an own-bus no-host notice, without resolving a recipient or sending. */
export function prepareNoHostNotice({service, customerName = '', supportUrl, now = Date.now()} = {}) {
  const assessment = evaluateTransportReadiness(service, now);
  if (!assessment.valid || !assessment.noticeEligible) throw problem('TRANSPORT_NOTICE_NOT_APPROVED');
  const title = clean(service?.label, 160), timeZone = clean(service?.timeZone, 80);
  if (!title || !timeZone) throw problem('TRANSPORT_NOTICE_SERVICE_DETAILS_REQUIRED');
  let departure;
  try {
    departure = new Intl.DateTimeFormat('en', {dateStyle:'long',timeStyle:'short',timeZone,timeZoneName:undefined}).format(new Date(service.startAt));
  } catch (_) { throw problem('TRANSPORT_NOTICE_TIMEZONE_INVALID'); }
  let url;
  try { url = new URL(String(supportUrl || '')); } catch (_) { throw problem('TRANSPORT_NOTICE_SUPPORT_URL_INVALID'); }
  if (url.protocol !== 'https:' || !['skanditravels.com','www.skanditravels.com'].includes(url.hostname.toLowerCase()) || url.port || url.username || url.password || url.pathname !== SITE_MAP.support || url.search || url.hash) {
    throw problem('TRANSPORT_NOTICE_SUPPORT_URL_INVALID');
  }
  const name = clean(customerName, 120), greeting = name ? `Hello ${name},` : 'Hello,';
  const lines = [greeting, '', `We’re writing about your ${title} bus service on ${departure} (${timeZone}).`, 'There will not be a SKANDI Host on board this service.', 'If you have any questions or concerns, please contact us through Customer Support Chat:', url.href, '', 'SKANDI Travels'];
  const message = `<p>${html(greeting)}</p><p>${html(lines[2])}</p><p>${html(lines[3])}</p><p>If you have any questions or concerns, please contact us through <a href="${html(url.href)}">Customer Support Chat</a>.</p><p>SKANDI Travels</p>`;
  return {subject:'An update about your SKANDI bus service', text:lines.join('\n'), html:message};
}
