// Legacy Wix route compatibility: keep /booking links working while the page is removed.
// The full booking journey is compiled into the public Home embed.
import wixLocationFrontend from 'wix-location-frontend';
import { SITE_MAP } from 'public/siteMap';

$w.onReady(() => {
  const query=wixLocationFrontend.query||{};
  const params=new URLSearchParams();
  for(const [key,value] of Object.entries(query)) {
    if(Array.isArray(value)) for(const item of value) params.append(key,String(item));
    else if(value!==undefined&&value!==null&&String(value)!=='') params.set(key,String(value));
  }
  const suffix=params.toString();
  wixLocationFrontend.to(SITE_MAP.home+(suffix?'?'+suffix:''));
});
