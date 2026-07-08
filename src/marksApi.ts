import { AUTO_RIA_API_KEY } from "./config.js";
import type { NamedValue } from "./types.js";

const CATEGORY_ID = 1;

let marksCache: NamedValue[] | null = null;
const modelsCache = new Map<number, NamedValue[]>();

async function fetchJson(url: string): Promise<NamedValue[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`AUTO.RIA API помилка: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as NamedValue[];
}

export async function getMarks(): Promise<NamedValue[]> {
  if (!marksCache) {
    marksCache = await fetchJson(
      `https://developers.ria.com/auto/categories/${CATEGORY_ID}/marks?api_key=${AUTO_RIA_API_KEY}`
    );
  }
  return marksCache;
}

export async function getModels(markaId: number): Promise<NamedValue[]> {
  if (!modelsCache.has(markaId)) {
    const models = await fetchJson(
      `https://developers.ria.com/auto/categories/${CATEGORY_ID}/marks/${markaId}/models?api_key=${AUTO_RIA_API_KEY}`
    );
    modelsCache.set(markaId, models);
  }
  return modelsCache.get(markaId)!;
}

function findBest(items: NamedValue[], query: string): NamedValue | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const exact = items.find((item) => item.name.toLowerCase() === q);
  if (exact) return exact;
  const partial = items.find(
    (item) => item.name.toLowerCase().includes(q) || q.includes(item.name.toLowerCase())
  );
  return partial ?? null;
}

export async function findMarka(query: string): Promise<NamedValue | null> {
  return findBest(await getMarks(), query);
}

export async function findModel(markaId: number, query: string): Promise<NamedValue | null> {
  return findBest(await getModels(markaId), query);
}
