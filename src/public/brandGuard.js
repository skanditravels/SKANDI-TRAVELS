// Deterministic editorial checks; this is not AI, fact checking or legal review.
export function checkVoyBrandCopy(payload = {}) {
  const kit = payload.brandKit && typeof payload.brandKit === 'object' ? payload.brandKit : {};
  const phrases = value => (Array.isArray(value) ? value : String(value || '').split(/[,\n]/))
    .map(value => String(value).trim()).filter(Boolean).slice(0, 100);
  const fields = ['title', 'headline', 'deck', 'summary', 'excerpt', 'body', 'kicker', 'caption', 'cta'];
  const rows = [];
  const add = (kind, item, index) => {
    if (!item || typeof item !== 'object') return;
    for (const field of fields) {
      if (typeof item[field] !== 'string' || !item[field].trim()) continue;
      rows.push({kind, item: String(item.title || item.headline || item.pageNo || index + 1).slice(0, 120), field, text:item[field].slice(0, 40000)});
    }
  };
  add('Issue', payload.issue, 0);
  (Array.isArray(payload.pages) ? payload.pages : []).slice(0, 500).forEach((item, index) => add('Page', item, index));
  (Array.isArray(payload.articles) ? payload.articles : []).slice(0, 500).forEach((item, index) => add('Article', item, index));
  const blocked = phrases(kit.blockedWords), required = phrases(kit.requiredWords), findings = [];
  for (const row of rows) for (const phrase of blocked) {
    if (row.text.toLocaleLowerCase().includes(phrase.toLocaleLowerCase())) findings.push({type:'blocked', phrase, location:`${row.kind}: ${row.item} · ${row.field}`});
  }
  const allText = rows.map(row => row.text.toLocaleLowerCase()).join('\n');
  const missing = rows.length ? required.filter(phrase => !allText.includes(phrase.toLocaleLowerCase())) : [];
  for (const phrase of missing) findings.push({type:'missing', phrase, location:'Active issue copy'});
  return {
    checkedFields:rows.length, blockedPhrases:blocked.length, requiredPhrases:required.length,
    findings:findings.slice(0, 200), truncated:findings.length > 200,
    summary:rows.length ? `Checked ${rows.length} text fields. ${findings.length} configured phrase ${findings.length === 1 ? 'finding' : 'findings'}.` : 'No issue copy was available to check.',
    scope:'Checks configured phrases in selected issue, page and article text. This does not verify facts, tone or legal compliance.'
  };
}
