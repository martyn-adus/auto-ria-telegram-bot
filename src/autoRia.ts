import { AUTO_RIA_API_KEY } from "./config.js";
import type { AutoInfo, Watch } from "./types.js";

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

export async function searchNewIds(watch: Watch): Promise<string[]> {
  const params = new URLSearchParams({
    api_key: AUTO_RIA_API_KEY,
    category_id: String(watch.category_id),
    marka_id: String(watch.marka_id),
    model_id: String(watch.model_id),
    countpage: "100",
    page: "0",
  });
  if (watch.s_yers) params.set("s_yers", String(watch.s_yers));
  if (watch.po_yers) params.set("po_yers", String(watch.po_yers));
  if (watch.price_ot) params.set("price_ot", String(watch.price_ot));
  if (watch.price_do) params.set("price_do", String(watch.price_do));

  const res = await fetch(`${SEARCH_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`AUTO.RIA search failed для "${watch.label}": ${res.status} ${res.statusText}`);
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
  };
}
