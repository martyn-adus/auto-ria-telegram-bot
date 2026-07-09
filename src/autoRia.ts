import { AUTO_RIA_API_KEY } from "./config.js";
import type { AutoInfo, Subscription } from "./types.js";

const SEARCH_URL = "https://developers.ria.com/auto/search";
const INFO_URL = "https://developers.ria.com/auto/info";

interface SearchResponse {
  result?: {
    search_result?: {
      ids?: (string | number)[];
    };
  };
}

interface InfoResponse {
  title?: string;
  markName?: string;
  modelName?: string;
  linkToView?: string;
  USD?: number;
  autoData?: {
    year?: number;
  };
}

// AUTO.RIA не документує точну назву/вкладеність поля з кузовом у /auto/info,
// тож замість покладатись на конкретний шлях (наприклад autoData.bodyName)
// рекурсивно шукаємо ознаку "універсал" будь-де у відповіді: підтверджено,
// що body_id=2 == "Універсал" для category_id=1 (за офіційним
// /auto/categories/1/bodystyles), але саме поле в /auto/info не перевірено
// живим запитом (упирались у HourOverlimit) — тому широка евристика.
const UNIVERSAL_BODY_ID = 2;
const UNIVERSAL_WORDS = ["універсал", "универсал"];

function containsUniversalMarker(value: unknown, depth = 0): boolean {
  if (value == null || depth > 6) return false;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return UNIVERSAL_WORDS.some((w) => lower.includes(w));
  }
  if (typeof value === "object") {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (/body/i.test(key) && (v === UNIVERSAL_BODY_ID || v === String(UNIVERSAL_BODY_ID))) {
        return true;
      }
      if (containsUniversalMarker(v, depth + 1)) return true;
    }
  }
  return false;
}

export async function searchNewIds(sub: Subscription): Promise<string[]> {
  const params = new URLSearchParams({
    api_key: AUTO_RIA_API_KEY,
    category_id: String(sub.category_id),
    marka_id: String(sub.marka_id),
    model_id: String(sub.model_id),
    countpage: "100",
    page: "0",
  });
  if (sub.s_yers) params.set("s_yers", String(sub.s_yers));
  if (sub.po_yers) params.set("po_yers", String(sub.po_yers));
  if (sub.price_ot) params.set("price_ot", String(sub.price_ot));
  if (sub.price_do) params.set("price_do", String(sub.price_do));
  if (sub.fuel_id) params.set("fuel_id", String(sub.fuel_id));
  if (sub.gear_id) params.set("gear_id", String(sub.gear_id));
  if (sub.drive_id) params.set("drive_id", String(sub.drive_id));

  const res = await fetch(`${SEARCH_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`AUTO.RIA search failed для "${sub.label}": ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as SearchResponse | SearchResponse[];
  const payload = Array.isArray(body) ? body[0] : body;
  const ids = payload?.result?.search_result?.ids ?? [];
  return ids.map(String);
}

export async function getInfo(id: string): Promise<AutoInfo> {
  const params = new URLSearchParams({
    api_key: AUTO_RIA_API_KEY,
    auto_id: id,
  });

  const res = await fetch(`${INFO_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`AUTO.RIA info failed для оголошення ${id}: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as InfoResponse;
  const price = typeof data.USD === "number" ? data.USD : null;
  const title = data.title ?? [data.markName, data.modelName, data.autoData?.year].filter(Boolean).join(" ");
  const link = data.linkToView
    ? new URL(data.linkToView, "https://auto.ria.com").toString()
    : `https://auto.ria.com/auto_${id}.html`;

  return {
    id,
    title: title || `Оголошення ${id}`,
    price,
    link,
    isUniversal: containsUniversalMarker(data),
  };
}
