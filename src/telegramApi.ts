import { TELEGRAM_BOT_TOKEN } from "./config.js";
import type { AutoInfo } from "./types.js";

const API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 409 Conflict trapляється, коли попередній (ще не завершений) запуск воркфлоу
// одночасно тримає getUpdates-з'єднання — минається за пару секунд, тож просто
// повторюємо кілька разів замість того, щоб валити весь check-run.
const GET_UPDATES_MAX_RETRIES = 3;
const GET_UPDATES_RETRY_DELAY_MS = 3000;

export async function getUpdates(offset: number): Promise<TelegramUpdate[]> {
  const params = new URLSearchParams({ offset: String(offset), timeout: "0" });

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_BASE}/getUpdates?${params.toString()}`);
    if (res.ok) {
      const body = (await res.json()) as { ok: boolean; result: TelegramUpdate[] };
      return body.result ?? [];
    }
    if (res.status === 409 && attempt < GET_UPDATES_MAX_RETRIES) {
      await sleep(GET_UPDATES_RETRY_DELAY_MS);
      continue;
    }
    throw new Error(`Telegram getUpdates failed: ${res.status} ${res.statusText}`);
  }
}

export async function sendMessage(chatId: string, text: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram sendMessage failed для chat_id ${chatId}: ${res.status} ${body}`);
  }
}

export async function sendListingToTelegram(
  chatId: string,
  label: string,
  info: AutoInfo
): Promise<void> {
  const priceText = info.price ? `${info.price.toLocaleString("uk-UA")} $` : "ціна не вказана";
  const text = [`🚗 <b>${label}</b>`, info.title, `💵 ${priceText}`, info.link].join("\n");
  await sendMessage(chatId, text);
}
