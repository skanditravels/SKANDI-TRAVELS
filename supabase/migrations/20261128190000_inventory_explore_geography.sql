-- Keep public IDs stable when a place changes its classification.
CREATE OR REPLACE FUNCTION public.inventory_smart_entity_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_level text;
  v_generated_public_id text;
  v_public_price numeric;
  v_supplier_cost numeric;
  v_margin numeric;
  v_slug text;
  v_old_generated text;
  v_description text;
begin
  new.code:=upper(btrim(coalesce(new.code,'')));
  new.name:=btrim(coalesce(new.name,''));
  new.source:=coalesce(nullif(btrim(new.source),''),'SKANDI');
  new.details:=coalesce(new.details,'{}'::jsonb);
  new.commercial:=coalesce(new.commercial,'{}'::jsonb);
  new.operations:=coalesce(new.operations,'{}'::jsonb);
  new.seo:=coalesce(new.seo,'{}'::jsonb);
  new.publication:=coalesce(new.publication,'{}'::jsonb);
  new.payload:=coalesce(new.payload,'{}'::jsonb);

  -- Search merchandising is not master data. It lives only in inventory_catalog_entries.
  new.searchable:=false;
  new.collection_type:='NONE';
  new.partner_tier:=null;
  new.search_priority:=100;
  new.search_keywords:='{}'::text[];
  new.details:=new.details - 'collectionType' - 'searchable' - 'partnerTier' - 'searchPriority' - 'searchKeywords';

  if nullif(btrim(coalesce(new.slug,'')),'') is null and new.name<>'' then
    v_slug:=lower(trim(both '-' from regexp_replace(new.name,'[^A-Za-z0-9]+','-','g')));
    new.slug:=v_slug;
  else
    new.slug:=lower(trim(both '-' from regexp_replace(btrim(new.slug),'[^A-Za-z0-9]+','-','g')));
  end if;

  v_level:=upper(coalesce(new.details->>'level',''));
  if new.entity_type='DESTINATION' and v_level in ('COUNTRY','AREA','DESTINATION') then
    v_generated_public_id:=v_level||'-'||new.code;
  else
    v_generated_public_id:=upper(trim(both '-' from regexp_replace(new.entity_type,'[^A-Za-z0-9]+','-','g')))||'-'||new.code;
  end if;

  if tg_op='UPDATE' then
    if old.entity_type='DESTINATION' and upper(coalesce(old.details->>'level','')) in ('COUNTRY','AREA','DESTINATION') then
      v_old_generated:=upper(coalesce(old.details->>'level',''))||'-'||upper(coalesce(old.code,''));
    else
      v_old_generated:=upper(trim(both '-' from regexp_replace(old.entity_type,'[^A-Za-z0-9]+','-','g')))||'-'||upper(coalesce(old.code,''));
    end if;
  end if;

  if nullif(btrim(coalesce(new.public_id,'')),'') is null or (tg_op='UPDATE' and new.code is distinct from old.code and new.public_id=old.public_id and old.public_id=v_old_generated) then
    new.public_id:=v_generated_public_id;
  else
    new.public_id:=btrim(new.public_id);
  end if;

  if new.entity_type in ('SUPPLIER','BRAND','AIRLINE_GROUP') then
    new.customer_visible:=false;
    new.homepage_featured:=false;
    new.featured:=false;
    new.seo:=jsonb_set(new.seo,'{indexable}','false'::jsonb,true);
  end if;

  if new.status='PUBLISHED' then
    new.active:=true;
  elsif new.status in ('ARCHIVED','SUSPENDED') then
    new.active:=false;
    new.customer_visible:=false;
  end if;

  if new.status<>'PUBLISHED' then new.homepage_featured:=false; end if;
  if coalesce(new.homepage_featured,false) then new.featured:=true; new.customer_visible:=true; end if;

  if coalesce(nullif(new.seo->>'canonicalSlug',''),'')='' and coalesce(new.slug,'')<>'' then
    new.seo:=jsonb_set(new.seo,'{canonicalSlug}',to_jsonb(new.slug),true);
  end if;
  if coalesce(nullif(new.seo->>'title',''),'')='' and new.name<>'' then
    new.seo:=jsonb_set(new.seo,'{title}',to_jsonb(left(new.name||' | SKANDI Travels',70)),true);
  end if;
  v_description:=coalesce(nullif(new.details->>'shortDescription',''),nullif(new.details->>'summary',''),nullif(new.details->>'description',''),case when new.entity_type='DESTINATION' then 'Explore '||new.name||' with SKANDI Travels.' else 'Discover '||new.name||' with SKANDI Travels.' end);
  if coalesce(nullif(new.seo->>'description',''),'')='' then
    new.seo:=jsonb_set(new.seo,'{description}',to_jsonb(left(v_description,160)),true);
  end if;
  if coalesce(nullif(new.seo->>'ogTitle',''),'')='' then new.seo:=jsonb_set(new.seo,'{ogTitle}',coalesce(new.seo->'title',to_jsonb(new.name)),true); end if;
  if coalesce(nullif(new.seo->>'ogDescription',''),'')='' then new.seo:=jsonb_set(new.seo,'{ogDescription}',coalesce(new.seo->'description',to_jsonb(left(v_description,160))),true); end if;
  if not(new.seo?'indexable') then new.seo:=jsonb_set(new.seo,'{indexable}','true'::jsonb,true); end if;

  begin v_public_price:=coalesce(nullif(new.commercial->>'publicPrice','')::numeric,0); exception when others then v_public_price:=0; end;
  begin v_supplier_cost:=coalesce(nullif(new.commercial->>'supplierCost','')::numeric,0); exception when others then v_supplier_cost:=0; end;
  if v_public_price>0 then
    v_margin:=round(((v_public_price-v_supplier_cost)/v_public_price)*100,2);
    new.commercial:=jsonb_set(new.commercial,'{marginPct}',to_jsonb(v_margin),true);
  else
    new.commercial:=jsonb_set(new.commercial,'{marginPct}','0'::jsonb,true);
  end if;

  new.payload:=new.payload||jsonb_build_object('smartInventoryVersion','2026-09-08-v6','canonicalSource','inventory_master_entities','searchCatalogSource','inventory_catalog_entries');
  new.updated_at:=now();
  return new;
end $function$;

-- Move an explicit set of direct children in one transaction. Staff authorization
-- is checked at the Inventory web-method boundary. Public callers cannot use this RPC.
CREATE OR REPLACE FUNCTION public.inventory_insert_geography_level(
  p_new_parent uuid, p_old_parent uuid, p_children uuid[], p_actor uuid
) RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  place public.inventory_master_entities%ROWTYPE;
  levels text[] := ARRAY['COUNTRY','STATE','REGION','DESTINATION','CITY','AREA'];
  child_count integer;
  level_position integer;
BEGIN
  SELECT * INTO STRICT place FROM public.inventory_master_entities
    WHERE id=p_new_parent AND parent_entity_id=p_old_parent FOR UPDATE;
  level_position := array_position(levels, place.entity_type);
  IF level_position IS NULL OR level_position <= 1 OR cardinality(p_children) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Invalid geography insertion';
  END IF;

  PERFORM id FROM public.inventory_master_entities WHERE id=ANY(p_children) ORDER BY id FOR UPDATE;
  IF (place.status<>'PUBLISHED' OR NOT place.active OR NOT place.customer_visible) AND EXISTS (
    SELECT FROM public.inventory_master_entities WHERE id=ANY(p_children) AND status='PUBLISHED' AND active AND customer_visible
  ) THEN
    RAISE EXCEPTION 'Publish the new parent before moving published children.';
  END IF;
  UPDATE public.inventory_master_entities AS child
  SET parent_entity_id=place.id,
      details=child.details || jsonb_build_object(
        lower(place.entity_type)||'Id',place.id,'parentPublicId',place.public_id
      ),
      updated_by_agent_user_id=p_actor
  WHERE child.id=ANY(p_children) AND child.parent_entity_id IN (p_old_parent,p_new_parent)
    AND (
      array_position(levels,child.entity_type)>level_position
      OR child.entity_type IN ('HOTEL','FLIGHT','GUIDED_TOUR','ACTIVITY','PARTNER_TICKET','TRANSFER','CAR_RENTAL','PACKAGE','ANCILLARY')
    );
  GET DIAGNOSTICS child_count=ROW_COUNT;
  IF child_count<>cardinality(p_children) THEN
    RAISE EXCEPTION 'The selected children have changed. Reopen the record and try again.';
  END IF;
  RETURN child_count;
END
$function$;
REVOKE ALL ON FUNCTION public.inventory_insert_geography_level(uuid,uuid,uuid[],uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_insert_geography_level(uuid,uuid,uuid[],uuid) TO service_role;

-- Reclassify catalog records in place. UUIDs, public IDs, slugs, assets and
-- booking/provider mappings continue to refer to the same records.
UPDATE public.inventory_master_entities
SET entity_type='STATE', details=details || jsonb_build_object('level','STATE','subdivisionCode',code),
    name=CASE code WHEN 'US-CA' THEN 'California' WHEN 'US-NY' THEN 'New York' ELSE name END
WHERE entity_type='REGION' AND code IN ('US-CA','US-FL','US-NY');

UPDATE public.inventory_master_entities
SET entity_type='CITY', details=details || jsonb_build_object('level','CITY')
WHERE entity_type='DESTINATION' AND code IN (
  'AGIA-MARINA','AGP','ALC','ALCALA-TF','ATH','BKK','BOD','CHI','CHQ','CPH','ELOUNDA',
  'FALIRAKI','FUENGIROLA','GOT','GOUVES','HEL','HER','HERSONISSOS','KRN','LAS','LAX',
  'LLA','LOS-GIGANTES','LPA-CITY','MALIA','MASPALOMAS','MIA','NYC','ORL','OSL','PALMA',
  'PAR','PLATANIAS','PUERTO-CRUZ','RVN','SEA','SKG','STALIS','STO','TORREMOLINOS','TOS','YVR'
);

UPDATE public.inventory_master_entities
SET entity_type='AREA', details=details || jsonb_build_object('level','AREA')
WHERE entity_type='DESTINATION' AND code IN ('CANTERAS','DISNEY-MCO','I-DRIVE','COSTA-ADEJE','PLAYA-AMERICAS','PLAYA-INGLES','PLAYA-PALMA');

UPDATE public.inventory_master_entities
SET entity_type=CASE WHEN code IN ('BALEARIC','CANARY') THEN 'STATE' ELSE 'REGION' END,
    details=details || jsonb_build_object('level',CASE WHEN code IN ('BALEARIC','CANARY') THEN 'STATE' ELSE 'REGION' END)
WHERE entity_type='AREA' AND code IN (
  'BALEARIC','CANARY','COSTA-BLANCA','COSTA-SOL','CRETE','CRETE-CENTRAL-EAST','CRETE-WEST',
  'FUE','LPA','PMI','TFS','JMK','JSI','JTR','RHO','HKT','KBV','USM'
);

INSERT INTO public.inventory_master_entities(entity_type,code,name,slug,status,active,customer_visible,parent_entity_id,details)
SELECT 'STATE',states.code,states.name,states.slug,'PUBLISHED',true,true,country.id,
  jsonb_build_object('level','STATE','subdivisionCode',states.code,'countryCode','US','countryName','United States')
FROM (VALUES ('US-IL','Illinois','illinois'),('US-NV','Nevada','nevada'),('US-WA','Washington','washington')) states(code,name,slug)
CROSS JOIN public.inventory_master_entities country
WHERE country.entity_type='COUNTRY' AND country.code='US'
ON CONFLICT (entity_type,code) DO NOTHING;

INSERT INTO public.inventory_master_entities(entity_type,code,name,slug,status,active,customer_visible,parent_entity_id,details)
SELECT 'REGION','US-FL-CENTRAL','Central Florida','central-florida','PUBLISHED',true,true,florida.id,
  jsonb_build_object('level','REGION','countryCode','US','countryName','United States','stateId',florida.id)
FROM public.inventory_master_entities florida
WHERE florida.entity_type='STATE' AND florida.code='US-FL'
ON CONFLICT (entity_type,code) DO NOTHING;

-- The parent chain follows the closest geographic scope. Keep other lookups
-- for consumers that use a place as a search label or a package destination.
UPDATE public.inventory_master_entities child
SET parent_entity_id=parent.id,
    details=child.details || jsonb_build_object(
      lower(parent.entity_type)||'Id',parent.id,'parentPublicId',parent.public_id
    )
FROM (VALUES
  ('CITY','ORL','REGION','US-FL-CENTRAL'),('AREA','DISNEY-MCO','CITY','ORL'),('AREA','I-DRIVE','CITY','ORL'),
  ('CITY','CHI','STATE','US-IL'),('CITY','LAS','STATE','US-NV'),('CITY','SEA','STATE','US-WA'),
  ('CITY','BOD','REGION','SE-NORTH'),('CITY','CHQ','REGION','CRETE-WEST'),
  ('CITY','AGIA-MARINA','REGION','CRETE-WEST'),('CITY','PLATANIAS','REGION','CRETE-WEST'),
  ('AREA','CHANIA-COAST','CITY','CHQ'),('REGION','CRETE-WEST','COUNTRY','GR'),('REGION','CRETE-CENTRAL-EAST','COUNTRY','GR'),
  ('AREA','PLAYA-INGLES','CITY','MASPALOMAS'),
  ('AREA','PLAYA-PALMA','CITY','PALMA')
) move(child_type,child_code,parent_type,parent_code)
JOIN public.inventory_master_entities parent ON parent.entity_type=move.parent_type AND parent.code=move.parent_code
WHERE child.entity_type=move.child_type AND child.code=move.child_code
  AND child.parent_entity_id IS DISTINCT FROM parent.id;

-- Pairing is a public presentation setting on the primary airline. No airline
-- row or operational IATA/ICAO identifier is merged in storage.
CREATE OR REPLACE FUNCTION public.inventory_validate_airline_display()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  config jsonb := NEW.inventory_details->'publicDisplay';
  partner_id text := config->>'partnerId';
BEGIN
  IF TG_OP='UPDATE' AND config IS NOT DISTINCT FROM OLD.inventory_details->'publicDisplay' THEN
    RETURN NEW;
  END IF;
  IF coalesce(config->>'mode','')='' THEN RETURN NEW; END IF;
  -- Serialize pairing edits to prevent two listings from claiming the same member.
  PERFORM pg_advisory_xact_lock(hashtext('inventory_airline_public_display'));
  IF config->>'mode' NOT IN ('SIDE_BY_SIDE','COMBINED') OR partner_id IS NULL OR partner_id=NEW."ID" OR
     NOT EXISTS (SELECT FROM public.travel_info_airlines WHERE "ID"=partner_id AND "iataCode"<>NEW."iataCode") THEN
    RAISE EXCEPTION 'Select another airline with a different operating code.';
  END IF;
  IF EXISTS (
    SELECT FROM public.travel_info_airlines other
    WHERE other."ID"<>NEW."ID" AND (
      other.inventory_details->'publicDisplay'->>'partnerId' IN (partner_id,NEW."ID")
      OR (other."ID"=partner_id AND coalesce(other.inventory_details->'publicDisplay'->>'mode','')<>'')
    )
  ) THEN
    RAISE EXCEPTION 'An airline is already in a shared public listing.';
  END IF;
  RETURN NEW;
END
$function$;
CREATE TRIGGER inventory_validate_airline_display_trg
  BEFORE INSERT OR UPDATE OF inventory_details ON public.travel_info_airlines
  FOR EACH ROW EXECUTE FUNCTION public.inventory_validate_airline_display();

-- The resort confirms this property is within Walt Disney World Resort.
-- https://www.fourseasons.com/orlando/getting-here/
UPDATE public.inventory_master_entities hotel
SET parent_entity_id=area.id,
    details=hotel.details || jsonb_build_object('areaId',area.id,'parentPublicId',area.public_id)
FROM public.inventory_master_entities area, public.inventory_master_entities city
WHERE hotel.entity_type='HOTEL' AND hotel.name='Four Seasons Resort Orlando at Walt Disney World Resort'
  AND area.entity_type='AREA' AND area.code='DISNEY-MCO'
  AND city.entity_type='CITY' AND city.code='ORL' AND hotel.parent_entity_id=city.id;
