import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { lastCheckPath } from "./config.js";

type LastCheckStore = Record<string, number>;

export function loadLastCheck(): LastCheckStore {
  if (!existsSync(lastCheckPath)) return {};
  const raw = readFileSync(lastCheckPath, "utf-8");
  if (!raw.trim()) return {};
  const data = JSON.parse(raw);
  // Стара структура { timestamp: N } — ігноруємо, переходимо на по-підписковий трекінг.
  if (typeof data.timestamp === "number") return {};
  return data as LastCheckStore;
}

export function saveLastCheck(store: LastCheckStore): void {
  writeFileSync(lastCheckPath, JSON.stringify(store, null, 2) + "\n", "utf-8");
}
