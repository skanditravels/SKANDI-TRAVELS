-- Preserve manually linked logo and thumbnail assets during supplier refresh.
-- Both routines keep the existing signatures, triggers, and security context.

CREATE OR REPLACE FUNCTION public.skandi_reference_media_url(
  media jsonb, role_priority text[],
  allow_primary boolean DEFAULT false, allow_hero boolean DEFAULT false, allow_card boolean DEFAULT false
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'pg_catalog'
AS $function$
  SELECT btrim(asset->>'url')
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(media) = 'array' THEN media ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS m(asset, ord)
  WHERE nullif(btrim(asset->>'url'), '') IS NOT NULL
    AND lower(coalesce(asset->>'active', 'true')) <> 'false'
    AND (
      upper(coalesce(asset->>'role', '')) = ANY(role_priority)
      OR (allow_primary AND lower(coalesce(asset->>'isPrimary', 'false')) = 'true')
      OR (allow_hero AND lower(coalesce(asset->>'isHero', 'false')) = 'true')
      OR (allow_card AND lower(coalesce(asset->>'isCard', 'false')) = 'true')
    )
  ORDER BY
    CASE
      WHEN NOT (role_priority && ARRAY['LOGO', 'THUMBNAIL', 'ICON']) THEN 0
      WHEN upper(coalesce(asset#>>'{payload,provider}', '')) IN ('DUFFEL', 'SUPPLIER', 'PROVIDER')
        OR upper(coalesce(asset->>'provider', '')) IN ('DUFFEL', 'SUPPLIER', 'PROVIDER')
        OR upper(coalesce(asset->>'source', '')) IN ('DUFFEL', 'SUPPLIER', 'PROVIDER')
        OR upper(coalesce(asset->>'sourceKind', asset->>'source_kind', '')) IN ('DUFFEL', 'SUPPLIER', 'PROVIDER') THEN 1
      WHEN upper(coalesce(asset->>'sourceKind', asset->>'source_kind', '')) IN ('UPLOAD', 'ASSET_LIBRARY')
        OR nullif(coalesce(asset->>'assetId', asset#>>'{payload,assetId}', ''), '') IS NOT NULL THEN 0
      ELSE 2
    END,
    CASE
      WHEN upper(coalesce(asset->>'role', '')) = ANY(role_priority)
        THEN coalesce(array_position(role_priority, upper(coalesce(asset->>'role', ''))), 500)
      WHEN allow_hero AND lower(coalesce(asset->>'isHero', 'false')) = 'true' THEN 700
      WHEN allow_primary AND lower(coalesce(asset->>'isPrimary', 'false')) = 'true' THEN 800
      WHEN allow_card AND lower(coalesce(asset->>'isCard', 'false')) = 'true' THEN 900
      ELSE 999
    END,
    CASE
      WHEN role_priority && ARRAY['LOGO', 'THUMBNAIL', 'ICON']
        AND coalesce(asset->>'sortOrder', asset->>'sort_order', '') ~ '^[0-9]{1,12}$'
        THEN coalesce(asset->>'sortOrder', asset->>'sort_order')::bigint
      ELSE 100
    END,
    ord
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.skandi_inventory_canonical_airline_assets()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  assets jsonb := CASE WHEN jsonb_typeof(new.media_assets) = 'array' THEN new.media_assets ELSE '[]'::jsonb END;
  details jsonb := coalesce(new.inventory_details, '{}'::jsonb);
  airline_name text := coalesce(new."Title", new."shortName", new."iataCode", 'Airline');
  slot record;
  existing_asset jsonb;
BEGIN
  IF upper(coalesce(new.source, '')) = 'DUFFEL' THEN
    FOR slot IN
      SELECT * FROM (VALUES
        ('LOGO', 'logo_lockup_url', nullif(btrim(details->>'logoLockupUrl'), ''), 10, ' logo'),
        ('THUMBNAIL', 'logo_symbol_url', nullif(btrim(details->>'logoSymbolUrl'), ''), 20, ' symbol')
      ) AS wanted(role, provider_field, url, sort_order, description)
    LOOP
      IF slot.url IS NULL THEN CONTINUE; END IF;

      -- Reuse an unchanged, fully normalized supplier entry. Leave manual
      -- selections, unrelated artwork, and previously discovered media intact.
      SELECT asset INTO existing_asset
      FROM jsonb_array_elements(assets) AS m(asset)
      WHERE upper(coalesce(asset#>>'{payload,provider}', '')) = 'DUFFEL'
        AND asset#>>'{payload,providerField}' = slot.provider_field
        AND upper(coalesce(asset->>'role', '')) = slot.role
        AND asset->>'url' = slot.url
        AND lower(coalesce(asset->>'active', 'true')) <> 'false'
      LIMIT 1;

      SELECT coalesce(jsonb_agg(asset ORDER BY ord), '[]'::jsonb) INTO assets
      FROM jsonb_array_elements(assets) WITH ORDINALITY AS m(asset, ord)
      WHERE NOT (
        (
          upper(coalesce(asset#>>'{payload,provider}', '')) = 'DUFFEL'
          AND (coalesce(asset#>>'{payload,providerField}', '') = slot.provider_field
            OR (nullif(asset#>>'{payload,providerField}', '') IS NULL AND upper(coalesce(asset->>'role', '')) = slot.role))
        )
        OR (upper(coalesce(asset->>'sourceKind', asset->>'source_kind', '')) = 'DUFFEL'
          AND upper(coalesce(asset->>'role', '')) = slot.role)
      );

      assets := assets || jsonb_build_array(coalesce(existing_asset, jsonb_build_object(
        'mediaType', 'IMAGE', 'role', slot.role, 'url', slot.url,
        'altText', airline_name || slot.description, 'sortOrder', slot.sort_order,
        'active', true, 'sourceKind', 'URL',
        'payload', jsonb_build_object(
          'provider', 'DUFFEL', 'providerField', slot.provider_field,
          'sourceReference', new.source_reference,
          'syncedAt', to_char(clock_timestamp() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        )
      )));
    END LOOP;
  END IF;

  new.media_assets := assets;
  -- The provider rows may have been found or refreshed in this trigger. Mirror
  -- the resulting selections for older airline readers after the merge.
  new."logoFile" := coalesce(public.skandi_reference_media_url(assets, ARRAY['LOGO']), new."logoFile");
  new."logoIcon" := coalesce(public.skandi_reference_media_url(assets, ARRAY['THUMBNAIL', 'ICON', 'LOGO']), new."logoIcon");
  new.inventory_details := details
    - 'logoLockupUrl' - 'logoSymbolUrl' - 'logoUrl' - 'logoIconUrl'
    - 'heroImageUrl' - 'imageUrl' - 'mediaAssets' - 'media_assets';
  RETURN new;
END;
$function$;
