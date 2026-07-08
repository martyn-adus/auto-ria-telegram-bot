import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { telegramOffsetPath } from "./config.js";

export function loadOffset(): number {
  if (!existsSync(telegramOffsetPath)) return 0;
  const raw = readFileSync(telegramOffsetPath, "utf-8");
  const data = raw.trim() ? JSON.parse(raw) : {};
  return typeof data.offset === "number" ? data.offset : 0;
}

export function saveOffset(offset: number): void {
  writeFileSync(telegramOffsetPath, JSON.stringify({ offset }, null, 2) + "\n", "utf-8");
}
