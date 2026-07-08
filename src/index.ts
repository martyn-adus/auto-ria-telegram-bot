import { ALLOWED_CHAT_IDS } from "./config.js";
import { getUpdates, sendMessage, sendListingToTelegram } from "./telegramApi.js";
import { loadWizardState, saveWizardState } from "./wizard.js";
import { loadOffset, saveOffset } from "./telegramOffset.js";
import { handleMessage } from "./commands.js";
import { loadSubscriptions } from "./subscriptions.js";
import { loadSeen, saveSeen } from "./store.js";
import { searchNewIds, getInfo } from "./autoRia.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function processTelegramMessages(): Promise<void> {
  const offset = loadOffset();
  const updates = await getUpdates(offset);
  if (updates.length === 0) return;

  const wizardState = loadWizardState();
  let maxUpdateId = offset - 1;

  for (const update of updates) {
    maxUpdateId = Math.max(maxUpdateId, update.update_id);
    const message = update.message;
    if (!message?.text) continue;

    const chatId = String(message.chat.id);
    if (!ALLOWED_CHAT_IDS.includes(chatId)) {
      await sendMessage(chatId, "У тебе немає доступу до цього бота.");
      continue;
    }

    try {
      const reply = await handleMessage(chatId, message.text, wizardState);
      if (reply) await sendMessage(chatId, reply);
    } catch (err) {
      console.error(`Помилка обробки повідомлення від ${chatId}:`, err);
      await sendMessage(chatId, "Сталася помилка. Спробуй ще раз пізніше.");
    }
  }

  saveWizardState(wizardState);
  saveOffset(maxUpdateId + 1);
}

async function checkListings(): Promise<void> {
  const subscriptions = loadSubscriptions();
  const seen = loadSeen();

  for (const sub of subscriptions) {
    const key = String(sub.id);
    console.log(`Перевіряю: #${sub.id} ${sub.label} (для ${sub.chatId})`);

    let ids: string[];
    try {
      ids = await searchNewIds(sub);
    } catch (err) {
      console.error(err);
      continue;
    }

    const seenIds = seen[key];
    const isFirstRun = seenIds === undefined;
    const seenSet = new Set(seenIds ?? []);
    const newIds = ids.filter((id) => !seenSet.has(id));

    if (isFirstRun) {
      console.log(`  Перший запуск для #${sub.id} — запам'ятовую ${ids.length} оголошень без сповіщень.`);
    } else if (newIds.length === 0) {
      console.log("  Нових оголошень немає.");
    } else {
      console.log(`  Знайдено нових оголошень: ${newIds.length}`);
      for (const id of newIds) {
        try {
          const info = await getInfo(id);
          await sendListingToTelegram(sub.chatId, sub.label, info);
          console.log(`  Надіслано: ${info.title} (${id})`);
        } catch (err) {
          console.error(`  Помилка для оголошення ${id}:`, err);
        }
        await sleep(500);
      }
    }

    seen[key] = Array.from(new Set([...(seenIds ?? []), ...ids]));
  }

  saveSeen(seen);
}

async function main() {
  await processTelegramMessages();
  await checkListings();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
