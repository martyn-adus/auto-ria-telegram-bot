import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { lastCheckPath } from "./config.js";

export function loadLastCheck(): number {
  if (!existsSync(lastCheckPath)) return 0;
  const raw = readFileSync(lastCheckPath, "utf-8");
  const data = raw.trim() ? JSON.parse(raw) : {};
  return typeof data.timestamp === "number" ? data.timestamp : 0;
}

export function saveLastCheck(timestamp: number): void {
  writeFileSync(lastCheckPath, JSON.stringify({ timestamp }, null, 2) + "\n", "utf-8");
}
