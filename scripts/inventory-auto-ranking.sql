-- Automatically calculate merchandising search order from the catalog authority.
-- The public view keeps its existing shape and permissions; no product data is replaced.
begin;
create or replace function public.skandi_inventory_auto_priority(catalog_type text, partner_tier text, featured boolean)
returns integer language sql immutable parallel safe set search_path = pg_catalog as $$
  select (case upper(btrim(coalesce(catalog_type,'')))
    when 'SKANDI_PARTNER' then 40
    when 'SKANDI_COLLECTION' then case
      regexp_replace(regexp_replace(upper(btrim(coalesce(partner_tier,''))), '[_ ]+COLLECTION$', ''), '^SKANDI[_ ]+', '')
      when 'EXCELSIOR' then 10 when 'SIGNATURE' then 20 when 'SELECT' then 30 else 50 end
    else 50 end) + case when coalesce(featured,false) then 0 else 1 end;
$$;

create or replace function public.skandi_catalog_auto_priority_trigger()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  new.search_priority := public.skandi_inventory_auto_priority(new.catalog_type,new.partner_tier,new.featured);
  return new;
end;
$$;
revoke all on function public.skandi_inventory_auto_priority(text,text,boolean) from public, anon, authenticated;
revoke all on function public.skandi_catalog_auto_priority_trigger() from public, anon, authenticated;
grant execute on function public.skandi_inventory_auto_priority(text,text,boolean) to service_role;
drop trigger if exists z_skandi_catalog_auto_priority on public.inventory_catalog_entries;
create trigger z_skandi_catalog_auto_priority before insert or update on public.inventory_catalog_entries
for each row execute function public.skandi_catalog_auto_priority_trigger();

-- Existing catalog entries now use the same calculation as new and edited entries.
update public.inventory_catalog_entries c set search_priority=public.skandi_inventory_auto_priority(c.catalog_type,c.partner_tier,c.featured)
where c.search_priority is distinct from public.skandi_inventory_auto_priority(c.catalog_type,c.partner_tier,c.featured);

-- Other inventory pages already consume sort_priority from this public-safe view.
-- Calculate it from the current catalog entry on every read, including old records.
create or replace view public.inventory_public_entities_v as
select e.id,e.public_id,e.entity_type,e.code,e.name,e.slug,e.featured,e.homepage_featured,
  public.skandi_inventory_auto_priority(c.catalog_type,c.partner_tier,coalesce(c.featured,e.featured)) as sort_priority,
  e.parent_entity_id,e.details,
  jsonb_build_object('publicPrice',coalesce(e.commercial->'publicPrice','0'::jsonb), 'currency',coalesce(e.commercial->'currency','"USD"'::jsonb), 'priceBasis',coalesce(e.commercial->'priceBasis','null'::jsonb), 'depositAmount',coalesce(e.commercial->'depositAmount','0'::jsonb)) as commercial,
  jsonb_build_object('title',coalesce(e.seo->'title','""'::jsonb), 'description',coalesce(e.seo->'description','""'::jsonb), 'canonicalSlug',coalesce(e.seo->'canonicalSlug','""'::jsonb), 'ogTitle',coalesce(e.seo->'ogTitle','""'::jsonb), 'ogDescription',coalesce(e.seo->'ogDescription','""'::jsonb), 'ogImage',coalesce(e.seo->'ogImage','""'::jsonb), 'indexable',coalesce(e.seo->'indexable','true'::jsonb)) as seo,
  e.localized,e.media,e.relations,e.updated_at
from public.inventory_canonical_entities_v e
left join lateral (
  select x.catalog_type,x.partner_tier,x.featured from public.inventory_catalog_entries x
  where x.active = true and (x.valid_from is null or x.valid_from<=current_date) and (x.valid_to is null or x.valid_to>=current_date)
    and (x.target_entity_id=e.id or (x.target_entity_id is null and x.target_record_type=e.entity_type and x.target_record_id=e.id::text))
  order by x.updated_at desc,x.id limit 1
) c on true
where e.status='PUBLISHED' and e.active=true and e.customer_visible=true;
commit;
