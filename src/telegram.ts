import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS } from "./config.js";
import type { AutoInfo } from "./types.js";

export async function sendListingToTelegram(watchLabel: string, info: AutoInfo): Promise<void> {
  const priceText = info.price ? `${info.price.toLocaleString("uk-UA")} $` : "ціна не вказана";
  const text = [
    `🚗 <b>${watchLabel}</b>`,
    `${info.title}`,
    `💵 ${priceText}`,
    info.link,
  ].join("\n");

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  for (const chatId of TELEGRAM_CHAT_IDS) {
    const res = await fetch(url, {
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
}
