import { findMarka, findModel } from "./marksApi.js";
import { loadSubscriptions, saveSubscriptions, nextId } from "./subscriptions.js";
import type { Subscription, WizardData, WizardStore } from "./types.js";

const CATEGORY_ID = 1;
const CURRENT_YEAR = new Date().getFullYear();
const SKIP_WORDS = ["пропустити", "skip", "-", "пропуск"];

function parseYear(text: string): number | null {
  const n = Number(text.trim());
  if (!Number.isInteger(n) || n < 1980 || n > CURRENT_YEAR + 1) return null;
  return n;
}

function parsePrice(text: string): number | null {
  const n = Number(text.trim().replace(/\s/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function isSkip(text: string): boolean {
  return SKIP_WORDS.includes(text.trim().toLowerCase());
}

const FUEL_LABELS: Record<number, string> = { 1: "бензин", 2: "дизель" };
const GEAR_LABELS: Record<number, string> = { 2: "автомат" };
const DRIVE_LABELS: Record<number, string> = { 1: "повний", 3: "задній" };

function formatSubscription(s: Subscription): string {
  const parts = [
    `#${s.id} ${s.label}`,
    `рік ${s.s_yers ?? "*"}-${s.po_yers ?? "*"}`,
    `ціна ${s.price_ot ?? "*"}-${s.price_do ?? "*"}`,
  ];
  if (s.fuel_id) parts.push(FUEL_LABELS[s.fuel_id] ?? `паливо #${s.fuel_id}`);
  if (s.gear_id) parts.push(GEAR_LABELS[s.gear_id] ?? `КП #${s.gear_id}`);
  if (s.drive_id) parts.push(DRIVE_LABELS[s.drive_id] ?? `привід #${s.drive_id}`);
  return parts.join(" | ");
}

function summary(data: WizardData): string {
  return [
    `Марка: ${data.markaName}`,
    `Модель: ${data.modelName}`,
    `Рік від: ${data.s_yers ?? "будь-який"}`,
    `Рік до: ${data.po_yers ?? "будь-який"}`,
    `Ціна від: ${data.price_ot ?? "будь-яка"}`,
    `Ціна до: ${data.price_do ?? "будь-яка"}`,
  ].join("\n");
}

export async function handleMessage(
  chatId: string,
  text: string,
  wizardState: WizardStore
): Promise<string> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "/cancel") {
    delete wizardState[chatId];
    return "Скасовано.";
  }

  if (lower === "/list") {
    const subs = loadSubscriptions().filter((s) => s.chatId === chatId);
    if (subs.length === 0) return "У тебе ще немає фільтрів. Напиши /filter щоб додати.";
    return subs.map(formatSubscription).join("\n");
  }

  if (lower.startsWith("/remove")) {
    const id = Number(trimmed.split(/\s+/)[1]);
    if (!id) return "Вкажи номер фільтра: /remove 3 (номер дивись через /list)";
    const subs = loadSubscriptions();
    const target = subs.find((s) => s.id === id && s.chatId === chatId);
    if (!target) return `Фільтр #${id} не знайдено серед твоїх.`;
    saveSubscriptions(subs.filter((s) => s !== target));
    return `Фільтр #${id} (${target.label}) видалено.`;
  }

  if (lower === "/start" || lower === "/filter") {
    wizardState[chatId] = { step: "marka", data: {} };
    return "Введи марку авто (наприклад: Skoda, BMW, Toyota):";
  }

  const entry = wizardState[chatId];
  if (!entry) {
    return "Не зрозумів. Команди:\n/filter — додати новий фільтр\n/list — переглянути свої фільтри\n/remove <номер> — видалити фільтр";
  }

  switch (entry.step) {
    case "marka": {
      const marka = await findMarka(trimmed);
      if (!marka) return `Не знайшов марку "${trimmed}". Спробуй ще раз (наприклад: Skoda, BMW, Toyota):`;
      entry.data.markaId = marka.value;
      entry.data.markaName = marka.name;
      entry.step = "model";
      return `Марка: ${marka.name}. Тепер введи модель:`;
    }

    case "model": {
      const model = await findModel(entry.data.markaId!, trimmed);
      if (!model) return `Не знайшов модель "${trimmed}" для ${entry.data.markaName}. Спробуй ще раз:`;
      entry.data.modelId = model.value;
      entry.data.modelName = model.name;
      entry.step = "yearFrom";
      return `Модель: ${model.name}. Рік випуску ВІД? (число, або "пропустити")`;
    }

    case "yearFrom": {
      if (!isSkip(trimmed)) {
        const year = parseYear(trimmed);
        if (year === null) return `Не схоже на рік. Напиши число (напр. 2015) або "пропустити":`;
        entry.data.s_yers = year;
      }
      entry.step = "yearTo";
      return `Рік випуску ДО? (число, або "пропустити")`;
    }

    case "yearTo": {
      if (!isSkip(trimmed)) {
        const year = parseYear(trimmed);
        if (year === null) return `Не схоже на рік. Напиши число (напр. 2023) або "пропустити":`;
        entry.data.po_yers = year;
      }
      entry.step = "priceFrom";
      return `Ціна від ($)? (число, або "пропустити")`;
    }

    case "priceFrom": {
      if (!isSkip(trimmed)) {
        const price = parsePrice(trimmed);
        if (price === null) return `Не схоже на ціну. Напиши число (напр. 15000) або "пропустити":`;
        entry.data.price_ot = price;
      }
      entry.step = "priceTo";
      return `Ціна до ($)? (число, або "пропустити")`;
    }

    case "priceTo": {
      if (!isSkip(trimmed)) {
        const price = parsePrice(trimmed);
        if (price === null) return `Не схоже на ціну. Напиши число (напр. 30000) або "пропустити":`;
        entry.data.price_do = price;
      }
      entry.step = "confirm";
      return `Перевір фільтр:\n${summary(entry.data)}\n\nВсе вірно? (так/ні)`;
    }

    case "confirm": {
      if (lower === "так" || lower === "yes" || lower === "+") {
        const subs = loadSubscriptions();
        const id = nextId(subs);
        const sub: Subscription = {
          id,
          chatId,
          label: `${entry.data.markaName} ${entry.data.modelName}`,
          category_id: CATEGORY_ID,
          marka_id: entry.data.markaId!,
          model_id: entry.data.modelId!,
          s_yers: entry.data.s_yers,
          po_yers: entry.data.po_yers,
          price_ot: entry.data.price_ot,
          price_do: entry.data.price_do,
        };
        subs.push(sub);
        saveSubscriptions(subs);
        delete wizardState[chatId];
        return `✅ Фільтр #${id} додано: ${sub.label}`;
      }
      delete wizardState[chatId];
      return "Скасовано. Напиши /filter щоб почати знову.";
    }
  }
}
