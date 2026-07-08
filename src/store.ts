import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { seenStorePath } from "./config.js";
import type { SeenStore } from "./types.js";

export function loadSeen(): SeenStore {
  if (!existsSync(seenStorePath)) {
    return {};
  }
  const raw = readFileSync(seenStorePath, "utf-8");
  return raw.trim() ? (JSON.parse(raw) as SeenStore) : {};
}

export function saveSeen(store: SeenStore): void {
  writeFileSync(seenStorePath, JSON.stringify(store, null, 2) + "\n", "utf-8");
}
