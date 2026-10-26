// Shared, data-only contract for Media Control's public website editor.
import { SITE_MAP, APP_ROUTES, getPageFamily, normalizeSitePath } from './siteMap.js';

export const WEBSITE_STYLE_PROPERTIES = Object.freeze([
  'color','background-color','background-image','background-size','background-position',
  'font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-transform','text-decoration',
  'width','height','min-width','max-width','min-height','max-height','padding','padding-top','padding-right','padding-bottom','padding-left',
  'margin','margin-top','margin-right','margin-bottom','margin-left','gap','row-gap','column-gap',
  'border','border-width','border-style','border-color','border-radius','box-shadow','opacity',
  'display','flex-direction','flex-wrap','justify-content','align-items','align-content','flex-grow','flex-shrink','flex-basis',
  'grid-template-columns','grid-template-rows','grid-column','grid-row','order','object-fit','object-position','aspect-ratio'
]);
const object = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
export function publicWebsitePage(key) {
  const routes = {...SITE_MAP,...APP_ROUTES};
  const route = Object.hasOwn(routes,key) ? routes[key] : null;
  if (!route || getPageFamily(route) !== 'public') throw new Error('WEBSITE_PUBLIC_PAGE_REQUIRED');
  const path=normalizeSitePath(route);
  const canonical=Object.keys(routes).find(k=>normalizeSitePath(routes[k])===path);
  return {key:canonical,path};
}
export function validateWebsiteSelector(value) {
  const selector = String(value || '');
  // Targets come from the visual picker. No arbitrary selector lists, pseudo-elements,
  // style blocks, scripts or HTML can be stored as content.
  if (!selector || selector.length > 1200 || !/^[a-zA-Z0-9_\-#\. >:\[\]="()]+$/.test(selector) || /(?:script|style|iframe|object|embed|head|meta|link)(?:\b)/i.test(selector)) throw new Error('WEBSITE_TARGET_INVALID');
  return selector;
}
export function validateWebsiteDesign(input) {
  const data = object(input);
  if (!Array.isArray(data.elements) || data.elements.length > 2000) throw new Error('WEBSITE_ELEMENTS_INVALID');
  const seen = new Set();
  const elements = data.elements.map(raw => {
    const item=object(raw),selector=validateWebsiteSelector(item.selector);
    if(seen.has(selector)) throw new Error('WEBSITE_DUPLICATE_TARGET'); seen.add(selector);
    const out={selector,styles:{}};
    if(Object.hasOwn(item,'text')) { if(typeof item.text!=='string'||item.text.length>40000)throw new Error('WEBSITE_TEXT_INVALID');out.text=item.text; }
    if(Object.hasOwn(item,'alt')) out.alt=String(item.alt).slice(0,1000);
    if(Object.hasOwn(item,'href')) {
      const href=String(item.href);
      if(href.length>2000||!(/^(?:\/(?!\/)|#[\w-]|https:\/\/|mailto:|tel:)/.test(href))||/[<>\u0000-\u0020]/.test(href))throw new Error('WEBSITE_LINK_INVALID');out.href=href;
    }
    if(item.assetId) {
      if(!/^[0-9a-f-]{36}$/i.test(item.assetId))throw new Error('WEBSITE_ASSET_INVALID');
      out.assetId=item.assetId;out.imageMode=item.imageMode==='background'?'background':'image';
    }
    for(const viewport of ['all','tablet','mobile']) {
      const styles=object(object(item.styles)[viewport]);out.styles[viewport]={};
      for(const [name,value] of Object.entries(styles)) {
        if(!WEBSITE_STYLE_PROPERTIES.includes(name))throw new Error('WEBSITE_STYLE_PROPERTY_INVALID');
        if(typeof value!=='string'||value.length>500||/[{};<>\\]|\/\*|url\s*\(|expression\s*\(|@import/i.test(value))throw new Error('WEBSITE_STYLE_VALUE_INVALID');
        out.styles[viewport][name]=value;
      }
    }
    return out;
  });
  const fonts=(Array.isArray(data.fonts)?data.fonts:[]).map(font=>{
    if(!font||!/^[-a-z0-9]{1,80}$/.test(font.id)||!Number.isInteger(font.weight)||font.weight<100||font.weight>900)throw new Error('WEBSITE_FONT_INVALID');
    return {id:font.id,weight:font.weight};
  });
  if(fonts.length>8)throw new Error('WEBSITE_TOO_MANY_FONTS');
  const result={version:1,elements,fonts};
  if(JSON.stringify(result).length>800000)throw new Error('WEBSITE_DESIGN_TOO_LARGE');
  return result;
}
