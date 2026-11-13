// Lower values rank first; ties are resolved alphabetically by the search surface.
export function inventorySearchPriority(row={}){
  const type=String(row.catalogType||row.catalog_type||row.collectionType||row.collection_type||'NONE').trim().toUpperCase();
  const tier=String(row.partnerTier||row.partner_tier||row.details?.skandiTier||'').trim().toUpperCase().replace(/[_ ]+COLLECTION$/,'').replace(/^SKANDI[_ ]+/, '');
  const level=type==='SKANDI_PARTNER'?40:type==='SKANDI_COLLECTION'?(({EXCELSIOR:10,SIGNATURE:20,SELECT:30})[tier]??50):50;
  return level+(row.featured===true?0:1);
}

// Used by staff searches that must read private master records rather than the public view.
export async function loadInventoryRankings(select){
  const entries=[];
  for(let offset=0;;offset+=1000){
    const page=await select('inventory_catalog_entries',{select:'id,target_entity_id,catalog_type,partner_tier,featured,valid_from,valid_to',active:'eq.true',order:'id.asc',limit:'1000',offset:String(offset)});
    entries.push(...page);
    if(page.length<1000)break;
  }
  return entries;
}
export function rankInventoryRows(rows,entries,date=new Date().toISOString().slice(0,10)){
  const byId=new Map();
  for(const c of entries||[]){
    if(!c.target_entity_id||(c.valid_from&&c.valid_from>date)||(c.valid_to&&c.valid_to<date))continue;
    if(!byId.has(c.target_entity_id))byId.set(c.target_entity_id,c);
  }
  return (rows||[]).map(row=>{
    const c=byId.get(row.id);
    return {...row,automaticSearchPriority:inventorySearchPriority({catalogType:c?.catalog_type,partnerTier:c?.partner_tier,featured:c?.featured??row.featured})};
  }).sort((a,b)=>a.automaticSearchPriority-b.automaticSearchPriority||String(a.name||a.code||'').localeCompare(String(b.name||b.code||'')));
}

export async function loadAllInventoryRows(select,query){
  const rows=[];
  for(let offset=0;;offset+=1000){
    const page=await select('inventory_master_entities',{...query,limit:'1000',offset:String(offset)});
    rows.push(...page);
    if(page.length<1000)break;
  }
  return rows;
}
