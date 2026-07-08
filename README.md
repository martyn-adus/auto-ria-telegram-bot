# auto-ria-telegram-bot

Моніторить нові оголошення на AUTO.RIA за заданими марками/моделями і надсилає посилання в Telegram.

## Як це працює

1. `src/index.ts` читає список фільтрів з `config/watches.json`.
2. Для кожного фільтра викликає офіційний AUTO.RIA API (`/auto/search`), отримує список ID оголошень.
3. Порівнює з раніше побаченими ID (`data/seen.json`).
4. Для кожного нового ID отримує деталі (`/auto/info`) і надсилає повідомлення в Telegram.
5. Зберігає оновлений список побачених ID.

При першому запуску повідомлення не надсилаються (щоб не заспамити всіма існуючими оголошеннями) — лише запам'ятовуються поточні ID.

## Налаштування

### 1. AUTO_RIA_API_KEY

Зареєструйся на https://developers.ria.com/, отримай особистий `api_key`.

### 2. marka_id / model_id

Отримай список марок:
```
GET https://developers.ria.com/auto/categories/1/marks?api_key=YOUR_API_KEY
```

Список моделей для конкретної марки:
```
GET https://developers.ria.com/auto/categories/1/marks/<marka_id>/models?api_key=YOUR_API_KEY
```

Впиши потрібні значення в `config/watches.json` (можна додати кілька фільтрів — по одному об'єкту на кожну марку/модель):

```json
[
  {
    "label": "Toyota Camry 2015-2020",
    "category_id": 1,
    "marka_id": 79,
    "model_id": 2144,
    "s_yers": 2015,
    "po_yers": 2020,
    "price_ot": 10000,
    "price_do": 20000
  }
]
```

`category_id`, `s_yers`/`po_yers` (рік від/до) та `price_ot`/`price_do` (ціна від/до) необов'язкові, крім `category_id` (1 = легкові авто).

### 3. Telegram-бот

1. Напиши [@BotFather](https://t.me/BotFather) → `/newbot` → отримаєш `TELEGRAM_BOT_TOKEN`.
2. Дізнайся `TELEGRAM_CHAT_ID`:
   - напиши боту будь-яке повідомлення;
   - відкрий `https://api.telegram.org/bot<TOKEN>/getUpdates`;
   - знайди `"chat":{"id": ...}` — це і є chat_id.
   - Якщо хочеш надсилати в канал — додай бота адміном каналу і використовуй `@channelusername` або числовий ID каналу.

### 4. Локальний запуск

```bash
cp .env.example .env
# заповни .env своїми значеннями
npm install
npm run check
```

## Автоматичний запуск (безкоштовно, без сервера)

У репозиторії вже є `.github/workflows/check.yml`, який запускає перевірку кожні 15 хвилин через GitHub Actions.

1. Заливаєш цей проєкт у свій GitHub-репозиторій.
2. У `Settings → Secrets and variables → Actions` додаєш секрети:
   - `AUTO_RIA_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
3. Workflow сам зберігатиме `data/seen.json` назад у репозиторій після кожного запуску (для цього не потрібні додаткові дії — `permissions: contents: write` вже виставлено).
4. Можна запустити вручну через вкладку Actions → Check AUTO.RIA → Run workflow.

Мінімальний інтервал cron у GitHub Actions — 5 хв, але фактичний запуск може запізнюватись на кілька хвилин під навантаженням — це нормально.

## Альтернатива без GitHub Actions

Той самий скрипт (`npm run check`) можна запускати через звичайний cron на власному ПК/VPS/Raspberry Pi — тоді `data/seen.json` просто залишається локальним файлом і GitHub Actions не потрібен.
