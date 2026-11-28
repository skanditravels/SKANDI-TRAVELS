import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";
import { inventoryMediaUrl, preferredInventoryMedia } from "public/inventoryMedia";

const ORIGIN = "https://www.skanditravels.com";
const BRAND = "SKANDI Travels";
const INTERNAL = ["SUPPLIER", "BRAND", "AIRLINE_GROUP"];
const LIBRARIES = {
  AIRLINE:"airlines", AIRPORT:"airports", TRANSFER:"transfers",
  GUIDED_TOUR:"tours", ACTIVITY:"activities", PARTNER_TICKET:"tickets"
};

function plain(value) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
}

function clip(value, limit) {
  if (value.length <= limit) return value;
  const word = value.slice(0, limit + 1).lastIndexOf(" ");
  return value.slice(0, word > limit * 0.65 ? word : limit).trim();
}

export function inventoryGuidePath(record) {
  const section = LIBRARIES[record.entityType];
  if (!section) return "";
  const item = ["AIRLINE","AIRPORT"].includes(record.entityType) ? record.code : record.slug || record.id;
  return item ? `${SITE_MAP.travelInfo}?${new URLSearchParams({section,item})}` : "";
}

export function inventorySeo(record, { path = "", location = "", localized = {}, media = record.media, titlePrefix = "" } = {}) {
  const saved = record.seo || {};
  const name = plain(localized.title) || plain(record.name);
  const details = record.details || {};
  const pathValid = isSafeInternalRoute(path) && !/^\/_/.test(path);
  const publicUrl = pathValid ? new URL(path, ORIGIN).href : "";
  const titleName = [titlePrefix, name].filter(Boolean).join(" ");
  const title = `${clip(titleName, 60 - BRAND.length - 3)} | ${BRAND}`;
  const guide = {
    AIRLINE: "Find baggage, check-in and onboard information for",
    AIRPORT: "Plan your arrival or departure at",
    HOTEL: "Explore the property and plan your stay at",
    TRANSFER: "Find pickup, drop-off and journey details for",
    GUIDED_TOUR: "Plan your experience on",
    ACTIVITY: "Find visitor information for",
    PARTNER_TICKET: "Find visitor and ticket information for",
  }[record.entityType] || "Explore";
  const place = location && location !== name ? ` in ${location}` : "";
  const publishedDescription = [localized.shortDescription, localized.short_description, details.shortDescription, details.summary]
    .map(plain).find(Boolean);
  const description = clip(publishedDescription || `${guide} ${name}${place} with ${BRAND}.`, 160);
  const image = preferredInventoryMedia(media, ["OG"]) ||
    preferredInventoryMedia(media, ["HERO","THUMBNAIL","CARD","PRIMARY","GALLERY","LOGO"]);
  const indexable=!!publicUrl && !INTERNAL.includes(record.entityType) && saved.noIndex!==true &&
    (saved.indexable!==false || saved.generated?.indexable===false);
  const editorial = (key,fallback) => {
    const value = plain(saved[key]);
    return value && value !== saved.generated?.[key] ? value : fallback;
  };
  const metaTitle = (titlePrefix?"":plain(localized.seoTitle || localized.seo_title)) || (titlePrefix?title:editorial("title",title));
  const metaDescription = plain(localized.seoDescription || localized.seo_description) || editorial("description",description);
  const generated = {
    pageName:name,canonicalSlug:record.slug || "",title:metaTitle,description:metaDescription,
    ogTitle:metaTitle,ogDescription:metaDescription,
    ogImage:inventoryMediaUrl(image),ogImageAlt:plain(image?.altText || image?.alt_text) || name
  };
  // Established public routes own canonical URLs. Content staff can override
  // generated copy and choose a dedicated social image in the media workspace.
  return {
    ...saved,...generated,
    title:metaTitle,description:metaDescription,
    ogTitle:titlePrefix?metaTitle:editorial("ogTitle",metaTitle),ogDescription:editorial("ogDescription",metaDescription),
    ogImage:inventoryMediaUrl(editorial("ogImage",generated.ogImage)),
    ogImageAlt:editorial("ogImageAlt",generated.ogImageAlt),
    canonicalUrl:publicUrl,ogUrl:publicUrl,ogType:"website",
    indexable,
    generated:{...generated,title,description,ogTitle:metaTitle,ogDescription:metaDescription,indexable}
  };
}

export async function applyInventorySeo(wixSeoFrontend, seo) {
  if (!seo?.title) return;
  const tags = [{ name:"description", content:seo.description }];
  for (const [key, value] of Object.entries({
    title:seo.ogTitle,description:seo.ogDescription,type:seo.ogType,url:seo.ogUrl,
    site_name:BRAND,image:seo.ogImage,"image:alt":seo.ogImage && seo.ogImageAlt
  })) if (value) tags.push({property:`og:${key}`,content:value});
  if (seo.indexable===false) tags.push({name:"robots",content:"noindex, follow"});
  await Promise.all([
    wixSeoFrontend.setTitle(seo.title),
    wixSeoFrontend.setMetaTags(tags),
    seo.canonicalUrl ? wixSeoFrontend.setLinks([{rel:"canonical",href:seo.canonicalUrl}]) : undefined
  ]);
}
