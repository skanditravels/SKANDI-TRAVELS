const SOURCE = 'SKANDI_CUSTOMER_FOOTER';
const PARENT = 'SKANDI_WIX_PARENT';
const $ = id => document.getElementById(id);
let master = null;
let signingUp = false;
const safePath = path => {
  const value = String(path || '').trim();
  return /^\/(?!\/)/.test(value) && !/[\\\u0000-\u0020]/.test(value) && !/%5c|%0[0-9a-f]|%1[0-9a-f]/i.test(value) ? value : '';
};
const safeExternal = url => {
  try { const result = new URL(url); return result.protocol === 'https:' ? result.href : ''; }
  catch (_) { return ''; }
};
const post = (type, payload = {}) => window.parent.postMessage({
  source:SOURCE, type, payload, timestamp:new Date().toISOString()
}, '*');
function link(label, target) {
  const path = safePath(target);
  if (!path) return null;
  const anchor = document.createElement('a');
  anchor.href = path;
  anchor.textContent = String(label || '').slice(0,120);
  anchor.addEventListener('click', e => { e.preventDefault(); post('FOOTER_NAVIGATE', {path}); });
  return anchor;
}
function render() {
  if (!master) return;
  const footer = master.customer?.footer || {};
  const newsletter = footer.newsletter || {};
  if ($('skf-newsletter-heading')) $('skf-newsletter-heading').textContent = newsletter.title || 'Travel inspiration from SKANDI';
  if ($('skf-newsletter-description')) $('skf-newsletter-description').textContent = newsletter.description || '';
  if ($('skf-newsletter-button')) $('skf-newsletter-button').textContent = newsletter.buttonLabel || 'Sign up';
  if ($('skf-newsletter-email')) $('skf-newsletter-email').placeholder = newsletter.placeholder || 'Email address';
  const logos = master.brand?.assets?.logos || {};
  const mainLogo = logos.customerFooter || logos.skandiWhite;
  if (mainLogo && $('skf-logo')) { $('skf-logo').src = mainLogo; $('skf-logo').hidden = false; }
  if (logos.skandiGroupWhite && $('skf-group-mark')) {
    $('skf-group-mark').src = logos.skandiGroupWhite;
    $('skf-group-mark').hidden = false;
  }
  const language = String(master.settings?.language || 'EN').toLowerCase();
  if ($('skf-slogan')) $('skf-slogan').textContent = master.brand?.slogans?.[language] || master.brand?.slogans?.en || '';
  const columns = $('skf-columns');
  if (columns) {
    columns.replaceChildren();
    for (const column of Array.isArray(footer.columns) ? footer.columns : []) {
      const section = document.createElement('section');
      section.className = 'skf-column';
      const heading = document.createElement('h3');
      heading.textContent = String(column.title || '');
      section.appendChild(heading);
      const list = document.createElement('ul');
      for (const item of Array.isArray(column.links) ? column.links : []) {
        const anchor = link(item.label, item.path);
        if (anchor) { const li = document.createElement('li'); li.appendChild(anchor); list.appendChild(li); }
      }
      section.appendChild(list);
      columns.appendChild(section);
    }
  }
  const social = $('skf-social-links');
  if (social) {
    social.replaceChildren();
    for (const item of Array.isArray(footer.socialLinks) ? footer.socialLinks : []) {
      const url = safeExternal(item.url);
      if (!url) continue;
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      const icon = safeExternal(item.iconUrl || master.brand?.assets?.[item.iconAssetKey] || '');
      if (icon) {
        const image = document.createElement('img');
        image.src = icon;
        image.alt = '';
        image.loading = 'lazy';
        anchor.appendChild(image);
      }
      const caption = document.createElement('span');
      caption.textContent = String(item.label || 'Social');
      anchor.appendChild(caption);
      anchor.setAttribute('aria-label',String(item.label || 'Social'));
      social.appendChild(anchor);
    }
  }
  if ($('skf-terms')) $('skf-terms').textContent = String(footer.termsText || '');
  const bottom = $('skf-legal-links');
  if (bottom) {
    bottom.replaceChildren();
    const policies = safePath(master.routes?.policies);
    const legal = safePath(master.routes?.legal);
    const utility = policies ? [
      ['Cookies','skandi-travels-cookies-policy'],
      ['Privacy Policy','privacy-policy'],
      ['Accessibility Statement','accessibility'],
      ['Booking Terms','booking-terms'],
      ['Website Disclaimer','disclaimer']
    ] : [];
    for (const [label,slug] of utility) {
      const anchor = link(label, `${policies}?slug=${encodeURIComponent(slug)}`);
      if (anchor) bottom.appendChild(anchor);
    }
    if (legal) { const anchor = link('Legal', legal); if (anchor) bottom.appendChild(anchor); }
    // Existing footer navigation also exposes Staff Login as a separate link.
    const staffPath = safePath(master.routes?.staffLogin || master.routes?.riaintra);
    if (staffPath) { const anchor = link('Staff Login', staffPath); if (anchor) bottom.appendChild(anchor); }
  }
}
$('skf-year').textContent = String(new Date().getFullYear());
$('skf-newsletter-form')?.addEventListener('submit', e => {
  e.preventDefault();
  if (signingUp) return;
  const email = $('skf-newsletter-email')?.value.trim() || '';
  if (!email || !$('skf-newsletter-email').checkValidity()) {
    $('skf-newsletter-email').reportValidity();
    return;
  }
  signingUp = true;
  $('skf-newsletter-button').disabled = true;
  $('skf-newsletter-result').textContent = 'Submitting…';
  post('FOOTER_NEWSLETTER_SIGNUP', {email,source:'Footer'});
});
window.addEventListener('message', e => {
  if (e.source !== window.parent) return;
  let message = e.data;
  if (typeof message === 'string') { try { message = JSON.parse(message); } catch (_) { return; } }
  if (!message || message.source !== PARENT) return;
  if (message.type === 'SKANDI_MASTER_CONFIG') { master = message.payload || {}; render(); }
  if (message.type === 'FOOTER_NEWSLETTER_RESULT') {
    signingUp = false;
    $('skf-newsletter-button').disabled = false;
    $('skf-newsletter-result').textContent = String(message.payload?.message || 'The request could not be completed.');
  }
});
post('MASTER_CONFIG_REQUEST', {context:'customer-footer'});
post('FOOTER_READY');
