import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
export const ALLOWED_CHAT_IDS = requireEnv("ALLOWED_CHAT_IDS")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export const subscriptionsPath = path.join(rootDir, "data", "subscriptions.json");
export const wizardStatePath = path.join(rootDir, "data", "wizard_state.json");
export const telegramOffsetPath = path.join(rootDir, "data", "telegram_offset.json");
export const seenStorePath = path.join(rootDir, "data", "seen.json");
