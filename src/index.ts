import { loadWatches } from "./config.js";
import { loadSeen, saveSeen } from "./store.js";
import { searchNewIds, getInfo } from "./autoRia.js";
import { sendListingToTelegram } from "./telegram.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const watches = loadWatches();
  const seen = loadSeen();

  for (const watch of watches) {
    console.log(`Перевіряю: ${watch.label}`);

    let ids: string[];
    try {
      ids = await searchNewIds(watch);
    } catch (err) {
      console.error(err);
      continue;
    }

    const seenIds = seen[watch.label];
    const isFirstRun = seenIds === undefined;
    const seenSet = new Set(seenIds ?? []);
    const newIds = ids.filter((id) => !seenSet.has(id));

    if (isFirstRun) {
      console.log(`  Перший запуск для "${watch.label}" — запам'ятовую ${ids.length} оголошень без сповіщень.`);
    } else if (newIds.length === 0) {
      console.log("  Нових оголошень немає.");
    } else {
      console.log(`  Знайдено нових оголошень: ${newIds.length}`);
      for (const id of newIds) {
        try {
          const info = await getInfo(id);
          await sendListingToTelegram(watch.label, info);
          console.log(`  Надіслано: ${info.title} (${id})`);
        } catch (err) {
          console.error(`  Помилка для оголошення ${id}:`, err);
        }
        await sleep(500);
      }
    }

    seen[watch.label] = Array.from(new Set([...(seenIds ?? []), ...ids]));
  }

  saveSeen(seen);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
