import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Watch } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Відсутня змінна оточення ${name}. Заповни .env (див. .env.example)`);
  }
  return value;
}

export const AUTO_RIA_API_KEY = requireEnv("AUTO_RIA_API_KEY");
export const TELEGRAM_BOT_TOKEN = requireEnv("TELEGRAM_BOT_TOKEN");
export const TELEGRAM_CHAT_ID = requireEnv("TELEGRAM_CHAT_ID");

export const watchesPath = path.join(rootDir, "config", "watches.json");
export const seenStorePath = path.join(rootDir, "data", "seen.json");

export function loadWatches(): Watch[] {
  const raw = readFileSync(watchesPath, "utf-8");
  return JSON.parse(raw) as Watch[];
}
