-- Authorized 2026-11-07. Locks and verifies all reviewed records before replacing
-- only their listed English SEO and Signature-tier fields. Prior values are
-- retained in master_inventory_audit within the same transaction.
DO $reconcile$
DECLARE
  item jsonb;
  e public.inventory_master_entities%ROWTYPE;
  l public.inventory_localized_content%ROWTYPE;
  c public.inventory_catalog_entries%ROWTYPE;
  localized_before jsonb;
  catalog_before jsonb;
  expected_master_count integer := 0;
  changed integer;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements($skandi_plan$[{"type":"AREA","code":"USM","name":"Koh Samui","master_updated":"2026-09-16 12:56:29.583906+00","seo":{"localized_updated":"2026-09-09 08:50:06.733144+00","old_master_title":"Koh Samui | SKANDI TRAVELS","old_master_description":"Travel to Koh Samui, Thailand with SKANDI. Destination information, hotels, transfers and travel guidance.","old_en_title":"Koh Samui | SKANDI Travels","old_en_description":null,"title":"Koh Samui | SKANDI TRAVELS","description":"Travel to Koh Samui, Thailand with SKANDI. Destination information, hotels, transfers and travel guidance."}},{"type":"COUNTRY","code":"DK","name":"Denmark","master_updated":"2026-09-16 12:56:29.583906+00","seo":{"localized_updated":"2026-09-09 05:08:43.627527+00","old_master_title":"Denmark | SKANDI TRAVELS","old_master_description":"Explore  with SKANDI TRAVELS.","old_en_title":"Denmark Travel Guide | SKANDI TRAVELS","old_en_description":"Explore Denmark with SKANDI: destinations, practical travel information, currency, language and verified booking guidance.","title":"Denmark Travel Guide | SKANDI TRAVELS","description":"Explore Denmark with SKANDI: destinations, practical travel information, currency and language."}},{"type":"COUNTRY","code":"ES","name":"Spain","master_updated":"2026-09-16 12:56:29.583906+00","seo":{"localized_updated":"2026-09-10 03:49:43.104137+00","old_master_title":"Spain Travel Guide | SKANDI TRAVELS","old_master_description":"Explore Spain with SKANDI. Country reference includes currency, languages, capital and practical travel information.","old_en_title":"Spain Travel Guide | SKANDI TRAVELS","old_en_description":"Explore Spain with SKANDI: destinations, practical travel information.","title":"Spain Travel Guide | SKANDI TRAVELS","description":"Explore Spain with SKANDI: destinations, practical travel information."}},{"type":"COUNTRY","code":"SE","name":"Sweden","master_updated":"2026-09-16 12:56:29.583906+00","seo":{"localized_updated":"2026-09-10 05:36:48.897669+00","old_master_title":"Sweden Travel Guide | SKANDI TRAVELS","old_master_description":"Explore Sweden with SKANDI. Country reference includes currency, languages, capital and practical travel information; live entry rules and local charges are ver","old_en_title":"Sweden Travel Guide | SKANDI TRAVELS","old_en_description":"Explore Sweden with SKANDI: destinations, practical travel information, currency, language and verified booking guidance.","title":"Sweden Travel Guide | SKANDI TRAVELS","description":"Explore Sweden with SKANDI: destinations, practical travel information, currency and language."}},{"type":"COUNTRY","code":"TH","name":"Thailand","master_updated":"2026-09-16 12:56:29.583906+00","seo":{"localized_updated":"2026-09-09 08:55:16.521475+00","old_master_title":"Thailand Travel Guide | SKANDI TRAVELS","old_master_description":"Explore Thailand with SKANDI. Country reference includes currency, languages, capital and practical travel information; live entry rules and local charges are v","old_en_title":"Thailand | SKANDI Travels","old_en_description":null,"title":"Thailand Travel Guide | SKANDI TRAVELS","description":"Explore Thailand with SKANDI: destinations, practical travel information, currency and language."}},{"type":"COUNTRY","code":"US","name":"United States","master_updated":"2026-09-16 12:56:29.583906+00","seo":{"localized_updated":"2026-09-09 08:21:27.767418+00","old_master_title":"United States Travel Guide | SKANDI TRAVELS","old_master_description":"Explore United States with SKANDI. Country reference includes currency, languages, capital and practical travel information; live entry rules and local charges","old_en_title":"United States Travel Guide | SKANDI TRAVELS","old_en_description":"Explore United States with SKANDI: destinations, practical travel information, currency, language and verified booking guidance.","title":"United States Travel Guide | SKANDI TRAVELS","description":"Explore the United States with SKANDI: destinations, practical travel information, currency and language."}},{"type":"DESTINATION","code":"BOD","name":"Boden","master_updated":"2026-10-07 18:19:47.936293+00","seo":{"localized_updated":"2026-09-09 22:43:52.026976+00","old_master_title":"Boden | SKANDI TRAVELS","old_master_description":"Explore Boden with SKANDI Travels.","old_en_title":"Boden | SKANDI Travels","old_en_description":null,"title":"Boden | SKANDI TRAVELS","description":"Explore Boden with SKANDI Travels."},"tier":{"catalog_updated":"2026-10-07 18:19:47.795497+00","catalog_type":"SKANDI_COLLECTION","old_details":"SIGNATURE","old_master":null,"old_catalog":null,"value":"SIGNATURE"}},{"type":"DESTINATION","code":"STO","name":"Stockholm","master_updated":"2026-09-16 12:56:29.583906+00","seo":{"localized_updated":"2026-09-09 22:34:06.349372+00","old_master_title":"Stockholm | SKANDI TRAVELS","old_master_description":"Travel to Stockholm, Sweden with SKANDI. Destination information, hotels, transfers and travel guidance.","old_en_title":"Stockholm | SKANDI TRAVELS","old_en_description":"Travel to Stockholm with SKANDI: hotels, transfers, experiences and practical destination information.","title":"Stockholm | SKANDI TRAVELS","description":"Travel to Stockholm with SKANDI: hotels, transfers, experiences and practical destination information."},"tier":{"catalog_updated":"2026-09-16 12:56:29.583906+00","catalog_type":"SKANDI_COLLECTION","old_details":"SIGNATURE","old_master":null,"old_catalog":null,"value":"SIGNATURE"}},{"type":"GUIDED_TOUR","code":"STO-OLDTOWN-VASA","name":"Stockholm Stories: Old Town & Vasa","master_updated":"2026-09-16 12:56:29.583906+00","seo":{"localized_updated":"2026-09-10 15:46:40.67231+00","old_master_title":"Stockholm Old Town & Vasa Guided Tour | SKANDI TRAVELS","old_master_description":"Explore Stockholm’s Royal Palace exterior, Gamla Stan and the Vasa Museum on a 3.5-hour small-group SKANDI tour with ferry and admission included.","old_en_title":"Stockholm Old Town & Vasa Guided Tour | SKANDI TRAVELS","old_en_description":"Explore Gamla Stan, Stockholm’s royal waterfront and the Vasa Museum on a 3.5-hour small-group tour with ferry, admission and private museum guide.","title":"Stockholm Old Town & Vasa Guided Tour | SKANDI TRAVELS","description":"Explore Stockholm’s Royal Palace exterior, Gamla Stan and the Vasa Museum on a 3.5-hour small-group SKANDI tour with ferry and admission included."},"tier":{"catalog_updated":"2026-09-16 12:56:29.583906+00","catalog_type":"SKANDI_COLLECTION","old_details":"SIGNATURE","old_master":null,"old_catalog":null,"value":"SIGNATURE"}},{"type":"HOTEL","code":"SH LLA868","name":"Scandic Luleå","master_updated":"2026-10-20 14:30:12.428917+00","tier":{"catalog_updated":"2026-10-20 14:30:12.331837+00","catalog_type":"SKANDI_COLLECTION","old_details":null,"old_master":null,"old_catalog":"SIGNATURE","value":"SIGNATURE"}},{"type":"HOTEL","code":"SH STOCON","name":"Scandic Continental","master_updated":"2026-10-15 05:18:47.193839+00","seo":{"localized_updated":"2026-09-08 19:05:39.053069+00","old_master_title":"Scandic Continental Stockholm | SKANDI TRAVELS","old_master_description":"Stay at Scandic Continental in central Stockholm, steps from Stockholm Central Station, shopping, restaurants and major city sights.","old_en_title":"Scandic Continental Stockholm | Hotel with SKANDI","old_en_description":"Book Scandic Continental in central Stockholm with SKANDI, beside Stockholm Central Station and close to shopping, sights and restaurants.","title":"Scandic Continental Stockholm | SKANDI TRAVELS","description":"Discover Scandic Continental in central Stockholm, steps from Stockholm Central Station, shopping, restaurants and major city sights."},"tier":{"catalog_updated":"2026-10-15 05:18:46.858973+00","catalog_type":"SKANDI_COLLECTION","old_details":"SIGNATURE","old_master":null,"old_catalog":"SIGNATURE COLLECTION","value":"SIGNATURE"}},{"type":"TRANSFER","code":"TR-ARN-STO-SHR","name":"ARN → Stockholm · Transfer","master_updated":"2026-10-11 18:03:16.832895+00","tier":{"catalog_updated":"2026-10-11 18:03:16.758634+00","catalog_type":"SKANDI_COLLECTION","old_details":"SIGNATURE","old_master":null,"old_catalog":null,"value":"SIGNATURE"}}]$skandi_plan$::jsonb)
  LOOP
    SELECT * INTO STRICT e FROM public.inventory_master_entities
      WHERE entity_type=item->>'type' AND code=item->>'code'
      FOR UPDATE;
    IF e.name IS DISTINCT FROM item->>'name'
       OR e.updated_at IS DISTINCT FROM (item->>'master_updated')::timestamptz
       OR e.status <> 'PUBLISHED' OR e.active IS NOT TRUE THEN
      RAISE EXCEPTION 'Inventory record changed during review: % %', item->>'type',item->>'code';
    END IF;
    localized_before := 'null'::jsonb;
    catalog_before := 'null'::jsonb;
    IF item ? 'seo' THEN
      SELECT * INTO STRICT l FROM public.inventory_localized_content
        WHERE entity_id=e.id AND upper(language)='EN' FOR UPDATE;
      IF l.updated_at IS DISTINCT FROM (item#>>'{seo,localized_updated}')::timestamptz
        OR e.seo->>'title' IS DISTINCT FROM item#>>'{seo,old_master_title}'
        OR e.seo->>'description' IS DISTINCT FROM item#>>'{seo,old_master_description}'
        OR l.seo_title IS DISTINCT FROM item#>>'{seo,old_en_title}'
        OR l.seo_description IS DISTINCT FROM item#>>'{seo,old_en_description}' THEN
        RAISE EXCEPTION 'English SEO changed during review: % %',item->>'type',item->>'code';
      END IF;
      localized_before := jsonb_build_object('seo_title',l.seo_title,'seo_description',l.seo_description,'updated_at',l.updated_at);
    END IF;
    IF item ? 'tier' THEN
      SELECT * INTO STRICT c FROM public.inventory_catalog_entries
        WHERE target_entity_id=e.id AND active=true FOR UPDATE;
      IF c.updated_at IS DISTINCT FROM (item#>>'{tier,catalog_updated}')::timestamptz
        OR c.catalog_type IS DISTINCT FROM item#>>'{tier,catalog_type}'
        OR c.partner_tier IS DISTINCT FROM item#>>'{tier,old_catalog}'
        OR e.partner_tier IS DISTINCT FROM item#>>'{tier,old_master}'
        OR e.details->>'skandiTier' IS DISTINCT FROM item#>>'{tier,old_details}' THEN
        RAISE EXCEPTION 'Tier changed during review: % %',item->>'type',item->>'code';
      END IF;
      catalog_before := jsonb_build_object('partner_tier',c.partner_tier,'updated_at',c.updated_at);
    END IF;
    INSERT INTO public.master_inventory_audit
      (event_type,domain,entity_table,entity_id,source,message,payload)
    VALUES
      ('INVENTORY_RECONCILIATION_20261107','INVENTORY_CONTROL','inventory_master_entities',e.id::text,'AUTHORIZED_RECONCILIATION',
       'Authorized reconciliation of English SEO and/or Signature tier; prior values retained.',
       jsonb_build_object('type',e.entity_type,'code',e.code,
         'master_before',jsonb_build_object('seo',e.seo,'partner_tier',e.partner_tier,'skandiTier',e.details->'skandiTier','updated_at',e.updated_at),
         'localized_before',localized_before,'catalog_before',catalog_before,
         'selected_seo',item->'seo','selected_tier',item->'tier'));
    UPDATE public.inventory_master_entities m SET
      seo=CASE WHEN item ? 'seo' THEN jsonb_set(jsonb_set(coalesce(m.seo,'{}'::jsonb),'{title}',to_jsonb(item#>>'{seo,title}'),true),'{description}',to_jsonb(item#>>'{seo,description}'),true) ELSE m.seo END,
      details=CASE WHEN item ? 'tier' THEN jsonb_set(coalesce(m.details,'{}'::jsonb),'{skandiTier}',to_jsonb(item#>>'{tier,value}'),true) ELSE m.details END,
      partner_tier=CASE WHEN item ? 'tier' THEN item#>>'{tier,value}' ELSE m.partner_tier END,
      updated_at=now()
      WHERE m.id=e.id;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed <> 1 THEN RAISE EXCEPTION 'Master update failed'; END IF;
    IF item ? 'seo' THEN
      UPDATE public.inventory_localized_content SET seo_title=item#>>'{seo,title}',seo_description=item#>>'{seo,description}',updated_at=now() WHERE id=l.id;
      GET DIAGNOSTICS changed = ROW_COUNT;
      IF changed <> 1 THEN RAISE EXCEPTION 'Localized update failed'; END IF;
    END IF;
    IF item ? 'tier' THEN
      UPDATE public.inventory_catalog_entries SET partner_tier=item#>>'{tier,value}',updated_at=now() WHERE id=c.id;
      GET DIAGNOSTICS changed = ROW_COUNT;
      IF changed <> 1 THEN RAISE EXCEPTION 'Catalog update failed'; END IF;
    END IF;
    expected_master_count:=expected_master_count+1;
  END LOOP;
  IF expected_master_count<>12 THEN RAISE EXCEPTION 'Unexpected reconciliation count'; END IF;
END
$reconcile$;

ALTER FUNCTION public.skandi_inventory_canonical_airline_assets() SET search_path = pg_catalog;

