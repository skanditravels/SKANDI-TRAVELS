// Creates editable starting drafts using only information supplied by the editor.
export function createVoyMarketingKit(payload = {}) {
  const kit = payload.kit && typeof payload.kit === 'object' ? payload.kit : {};
  const issue = payload.issue && typeof payload.issue === 'object' ? payload.issue : {};
  const text = (v, max = 300) => String(v || '').trim().slice(0, max);
  const name = text(kit.name || issue.title);
  if (!name) throw new Error('Enter a launch name before preparing the kit.');
  const market = text(kit.market), angle = text(kit.angle, 1500), campaign = text(kit.utmCampaign, 160);
  const pages = (Array.isArray(payload.pages) ? payload.pages : []).map(p => text(p?.title)).filter(Boolean).slice(0, 5);
  let link = text(kit.ctaPath, 2000);
  if (link) {
    let url;
    try { url = new URL(link, 'https://skandi.invalid'); } catch (_) { throw new Error('Enter a valid booking link.'); }
    if (!(link.startsWith('/') && !link.startsWith('//') && url.origin === 'https://skandi.invalid') && !(/^https:\/\//i.test(link) && url.protocol === 'https:' && !url.username && !url.password)) throw new Error('Enter a secure booking link or a site path.');
    if (campaign) url.searchParams.set('utm_campaign', campaign);
    link = url.origin === 'https://skandi.invalid' ? url.pathname + url.search + url.hash : url.href;
  }
  const lines = [angle, pages.length ? `Inside: ${pages.join(' · ')}.` : '', link ? `Explore: ${link}` : 'Add a booking link before publishing.'].filter(Boolean);
  const drafts = [
    {channel:'Newsletter', title:name, copy:[name, ...lines].join('\n\n')},
    {channel:'Social caption', title:name, copy:[name, ...lines].join('\n\n')},
    {channel:'Agency brief', title:name, copy:[name, market ? `Market: ${market}` : '', ...lines].filter(Boolean).join('\n\n')}
  ];
  return {...kit, name, trackedLink:link, drafts, summary:'Editable starting drafts prepared from the information you supplied. Review and adapt each one before use.'};
}
