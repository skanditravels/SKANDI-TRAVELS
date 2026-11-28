// Presentation rules for assets already attached to a canonical inventory record.
const token = value => String(value ?? "").trim().toUpperCase();

export function inventoryMediaRows(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }
  return [];
}

export function inventoryMediaUrl(asset) {
  const value = typeof asset === "string" ? asset :
    asset?.url || asset?.publicUrl || asset?.public_url || asset?.imageUrl || asset?.image_url;
  const url = String(value ?? "").trim();
  const wix = /^wix:(image|vector):\/\/v1\/([A-Za-z0-9_.~-]+)(?=[/#]|$)/.exec(url);
  if (wix) return `https://static.wixstatic.com/${wix[1] === "vector" ? "shapes" : "media"}/${wix[2]}`;
  return /^https?:\/\/[^\s]+$/i.test(url) ? url.slice(0, 3000) : "";
}

export function isSupplierInventoryMedia(asset) {
  return [asset?.payload?.provider, asset?.provider, asset?.source, asset?.sourceKind, asset?.source_kind]
    .some(value => ["DUFFEL", "SUPPLIER", "PROVIDER"].includes(token(value)));
}

export function isManualInventoryMedia(asset) {
  return !isSupplierInventoryMedia(asset) && (Boolean(asset?.assetId || asset?.payload?.assetId) ||
    ["UPLOAD", "ASSET_LIBRARY"].includes(token(asset?.sourceKind || asset?.source_kind)));
}

export function preferredInventoryMedia(value, roles) {
  const ranked = inventoryMediaRows(value).flatMap(asset => {
    if (!asset || token(asset.active) === "FALSE" || !inventoryMediaUrl(asset) ||
      token(asset.mediaType ?? asset.media_type ?? "IMAGE") !== "IMAGE") return [];
    const assigned = roles.indexOf(token(asset.role));
    const position = assigned < 0 && (asset.isCard === true || asset.is_card === true) ? roles.indexOf("CARD") : assigned;
    if (position < 0) return [];
    const authority = isManualInventoryMedia(asset) ? 0 : isSupplierInventoryMedia(asset) ? 1 : 2;
    return [{ asset, authority, position, order: Number(asset.sortOrder ?? asset.sort_order ?? 100) }];
  });
  ranked.sort((a, b) => a.authority - b.authority || a.position - b.position || a.order - b.order);
  return ranked[0]?.asset;
}

export function inventoryCardImage(value) {
  return inventoryMediaUrl(preferredInventoryMedia(value, ["THUMBNAIL", "CARD"]));
}

export function referenceInventoryMedia(row = {}) {
  const rows = inventoryMediaRows(row.media_assets ?? row.media);
  const defaults = [];
  const details = row.inventory_details ?? row.details;
  const supplier = row.payload?.duffel?.normalized || details?.duffel || {};
  for (const [roles, delivered, legacy] of [
    [["LOGO"], supplier.logoLockupUrl || details?.logoLockupUrl, row.logoFile || row.logoUrl],
    [["THUMBNAIL", "ICON"], supplier.logoSymbolUrl || details?.logoSymbolUrl, row.logoIcon || row.logoIconUrl]
  ]) {
    if (inventoryMediaUrl(delivered) && !rows.some(asset => roles.includes(token(asset?.role)) &&
      token(asset.active) !== "FALSE" && isSupplierInventoryMedia(asset) && inventoryMediaUrl(asset))) {
      defaults.push({ role: roles[0], url: delivered, mediaType: "IMAGE", active: true, sourceKind: "DUFFEL" });
    }
    // Older records can have a logo in the compatibility column alone.
    // A URL already represented in the record belongs to that asset.
    const legacyUrl = inventoryMediaUrl(legacy);
    if (legacyUrl && ![...rows, ...defaults].some(asset => inventoryMediaUrl(asset) === legacyUrl)) {
      defaults.push({ role: roles[0], url: legacy, mediaType: "IMAGE", active: true, sourceKind: "LEGACY_PROJECTION_BACKFILL" });
    }
  }
  return [...rows, ...defaults];
}

export function referenceInventoryBrand(row = {}) {
  const media = referenceInventoryMedia(row);
  const logoUrl = inventoryMediaUrl(preferredInventoryMedia(media, ["LOGO"]));
  const thumbnailUrl = inventoryMediaUrl(preferredInventoryMedia(media, ["THUMBNAIL", "ICON", "LOGO"]));
  return { logoUrl: logoUrl || thumbnailUrl, thumbnailUrl };
}
