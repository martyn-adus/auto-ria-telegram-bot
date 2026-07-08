import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { subscriptionsPath } from "./config.js";
import type { Subscription } from "./types.js";

export function loadSubscriptions(): Subscription[] {
  if (!existsSync(subscriptionsPath)) return [];
  const raw = readFileSync(subscriptionsPath, "utf-8");
  return raw.trim() ? (JSON.parse(raw) as Subscription[]) : [];
}

export function saveSubscriptions(subs: Subscription[]): void {
  writeFileSync(subscriptionsPath, JSON.stringify(subs, null, 2) + "\n", "utf-8");
}

export function nextId(subs: Subscription[]): number {
  return subs.reduce((max, s) => Math.max(max, s.id), 0) + 1;
}
