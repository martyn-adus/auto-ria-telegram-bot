import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { lastCheckPath } from "./config.js";

export interface LastCheckEntry {
  at: number;
  ok: boolean;
}

export type LastCheckStore = Record<string, LastCheckEntry>;

export function loadLastCheck(): LastCheckStore {
  if (!existsSync(lastCheckPath)) return {};
  const raw = readFileSync(lastCheckPath, "utf-8");
  if (!raw.trim()) return {};
  const data = JSON.parse(raw) as Record<string, unknown>;

  const store: LastCheckStore = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "number") {
      // Стара структура (плоский timestamp, вважався успішним) — мігруємо.
      store[key] = { at: value, ok: true };
    } else if (value && typeof value === "object" && "at" in value) {
      store[key] = value as LastCheckEntry;
    }
  }
  return store;
}

export function saveLastCheck(store: LastCheckStore): void {
  writeFileSync(lastCheckPath, JSON.stringify(store, null, 2) + "\n", "utf-8");
}
