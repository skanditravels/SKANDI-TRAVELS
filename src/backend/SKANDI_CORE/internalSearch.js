import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth.js";
import { text, lower } from "backend/SKANDI_CORE/platformValidation.js";


export async function runInternalGlobalSearchCore(input = {}) {
  const session = await requireStaffPortalSessionCore();
  const query = lower(typeof input === "string" ? input : input.query, 300);
  if (!query) return { results: [], items: [], query: "" };
  const results = (session.apps || []).filter(item =>
    [item.title, item.description || item.subtitle, item.id, item.code].join(" ").toLowerCase().includes(query)
  ).slice(0, 25).map(item => ({
    id: text(item.id, 120), title: text(item.title, 200), type: "APP",
    path: text(item.path, 500), summary: text(item.description || item.subtitle, 500)
  }));
  return { results, items: results, query };
}
