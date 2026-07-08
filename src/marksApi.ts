import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { AUTO_RIA_API_KEY, marksCachePath } from "./config.js";
import type { NamedValue } from "./types.js";

const CATEGORY_ID = 1;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  fetchedAt: string;
  data: NamedValue[];
}

interface MarksCacheFile {
  marks?: CacheEntry;
  models?: Record<string, CacheEntry>;
}

function loadCache(): MarksCacheFile {
  if (!existsSync(marksCachePath)) return {};
  const raw = readFileSync(marksCachePath, "utf-8");
  return raw.trim() ? (JSON.parse(raw) as MarksCacheFile) : {};
}

const cache = loadCache();
let cacheDirty = false;

function isFresh(entry: CacheEntry | undefined): entry is CacheEntry {
  if (!entry) return false;
  return Date.now() - new Date(entry.fetchedAt).getTime() < CACHE_TTL_MS;
}

async function fetchJson(url: string): Promise<NamedValue[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`AUTO.RIA API помилка: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as NamedValue[];
}

export async function getMarks(): Promise<NamedValue[]> {
  if (isFresh(cache.marks)) return cache.marks.data;
  const data = await fetchJson(
    `https://developers.ria.com/auto/categories/${CATEGORY_ID}/marks?api_key=${AUTO_RIA_API_KEY}`
  );
  cache.marks = { fetchedAt: new Date().toISOString(), data };
  cacheDirty = true;
  return data;
}

export async function getModels(markaId: number): Promise<NamedValue[]> {
  const key = String(markaId);
  const existing = cache.models?.[key];
  if (isFresh(existing)) return existing.data;
  const data = await fetchJson(
    `https://developers.ria.com/auto/categories/${CATEGORY_ID}/marks/${markaId}/models?api_key=${AUTO_RIA_API_KEY}`
  );
  cache.models = { ...cache.models, [key]: { fetchedAt: new Date().toISOString(), data } };
  cacheDirty = true;
  return data;
}

export function persistMarksCache(): void {
  if (!cacheDirty) return;
  writeFileSync(marksCachePath, JSON.stringify(cache, null, 2) + "\n", "utf-8");
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
