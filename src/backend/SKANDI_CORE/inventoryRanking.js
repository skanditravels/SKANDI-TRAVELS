// Lower values rank first; ties are resolved alphabetically by the search surface.
export function inventorySearchPriority(row={}){
  const type=String(row.catalogType||row.catalog_type||row.collectionType||row.collection_type||'NONE').trim().toUpperCase();
  const tier=String(row.partnerTier||row.partner_tier||row.details?.skandiTier||'').trim().toUpperCase().replace(/[_ ]+COLLECTION$/,'').replace(/^SKANDI[_ ]+/, '');
  const level=type==='SKANDI_PARTNER'?40:type==='SKANDI_COLLECTION'?(({EXCELSIOR:10,SIGNATURE:20,SELECT:30})[tier]??50):50;
  return level+(row.featured===true?0:1);
}
