import {parse} from 'parse5';
import {createHash} from 'node:crypto';

export const digest = text => createHash('sha256').update(text).digest('hex');
export function extractDocument(markdown) {
  const blocks=[...markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)^```\s*$/gm)]
    .filter(m=>/<!doctype|<html\b|<style\b/i.test(m[2]));
  if(blocks.length>1)throw new Error('Multiple HTML payloads require an explicit source choice.');
  if(blocks.length===1) {
    const payload=blocks[0][2],start=payload.search(/<!doctype\s+html/i);
    // Reservations contains a Markdown change log inside its HTML fence.
    // It is documentation, not part of the intended HTML document.
    if(start>0 && /^\s*##\s/.test(payload))return payload.slice(start);
    return payload;
  }
  const start=markdown.search(/<!doctype\s+html/i),end=markdown.toLowerCase().lastIndexOf('</html>');
  if(start>=0&&end>start)return markdown.slice(start,end+7)+'\n';
  return null;
}

// Change only the actual inline style/script ranges. No HTML serialization,
// formatting, source repair, script concatenation or execution-order changes.
// Additional blocks use .part-NN files so each original script keeps its own
// global execution boundary and its original position among markup/libraries.
export function splitDocument(source,stem) {
  if(!/^[a-z0-9-]+$/.test(stem))throw new Error('Unsafe output stem.');
  const errors=[],tree=parse(source,{sourceCodeLocationInfo:true,onParseError:e=>errors.push({code:e.code,line:e.startLine})});
  const replacements=[],files={},counts={css:0,js:0};
  const walk=(n,inert=false)=>{
    const attrs=n.attrs||[],get=k=>attrs.find(a=>a.name===k)?.value;
    const type=(get('type')||'').toLowerCase();
    const isStyle=n.tagName==='style';
    const isScript=n.tagName==='script'&&get('src')===undefined&&['','text/javascript','application/javascript','module'].includes(type);
    if(!inert&&(isStyle||isScript)) {
      const loc=n.sourceCodeLocation;
      if(!loc?.startTag||!loc.endTag)throw new Error('Unclosed inline source block.');
      const ext=isStyle?'css':'js',index=++counts[ext];
      const name=stem+(index===1?'':`.part-${String(index).padStart(2,'0')}`)+'.'+ext;
      const opening=source.slice(loc.startOffset,loc.startTag.endOffset),closing=source.slice(loc.endTag.startOffset,loc.endOffset);
      files[name]=source.slice(loc.startTag.endOffset,loc.endTag.startOffset);
      const replacement=isStyle
        ? opening.replace(/^<style\b/i,'<link rel="stylesheet" href="'+name+'"').replace(/\s*\/?>$/,'>')
        : opening.replace(/>$/,' src="'+name+'">')+closing;
      replacements.push({start:loc.startOffset,end:loc.endOffset,name,opening,closing,replacement,type:type||'classic',sourceLine:loc.startLine});
    }
    for(const c of n.childNodes||[])walk(c,inert);
    if(n.content)walk(n.content,true);
  };
  walk(tree);
  let html=source;
  for(const r of [...replacements].sort((a,b)=>b.start-a.start))html=html.slice(0,r.start)+r.replacement+html.slice(r.end);
  files[stem+'.html']=html;
  for(const ext of ['css','js'])if(!counts[ext])files[stem+'.'+ext]=`/* This HTML_REF payload contains no inline ${ext==='css'?'CSS':'JavaScript'} to extract. */\n`;
  return {files,replacements,errors,counts};
}

export function restoreDocument(html,files,replacements) {
  let restored=html;
  for(const r of [...replacements].sort((a,b)=>b.start-a.start)) {
    const at=restored.indexOf(r.replacement);
    if(at<0||restored.indexOf(r.replacement,at+r.replacement.length)>=0)throw new Error('Missing or ambiguous split-source reference: '+r.name);
    restored=restored.slice(0,at)+r.opening+files[r.name]+r.closing+restored.slice(at+r.replacement.length);
  }
  return restored;
}
