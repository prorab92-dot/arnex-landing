# Памятка проекта Arnex

Дата: 2026-09-01

## Что уже сделано

- Сайт: `https://arnex-landing-prorab92.netlify.app`
- GitHub: `https://github.com/prorab92-dot/arnex-landing`
- Netlify project: `arnex-landing-prorab92`
- Railway project: `arnex-landing`
- Railway API: `https://arnex-api-production.up.railway.app`
- Telegram bot: `@test_Aneks_bot`

## Как устроено

- Файлы лендинга лежат в корне проекта: `index.html`, `styles.css`, `script.js`.
- Заявка с сайта идёт в Netlify Function `netlify/functions/lead.js`.
- Заявка отправляется в Telegram и сохраняется в Railway Postgres через Railway API.
- Telegram webhook работает через `netlify/functions/telegram-webhook.js`.
- Railway API живёт в `server.js` и хранит данные в Postgres.

## Секреты

Секреты не хранить в GitHub и не писать в чат открытым текстом.

В Netlify используются:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_SETUP_SECRET`
- `ARNEX_API_URL`
- `ARNEX_API_SECRET`

В Railway используются:

- `DATABASE_URL`
- `ARNEX_API_SECRET`

## Для следующих сайтов

1. Создать простой лендинг в корне проекта.
2. Завести публичный GitHub-репозиторий.
3. Подключить Netlify к GitHub и сделать production deploy.
4. Для заявок добавить Netlify Function.
5. Для Telegram добавить webhook, а не long polling.
6. Для постоянного хранения данных использовать Railway Postgres.
7. Секреты хранить только в Netlify/Railway environment variables.
8. После настройки проверить:
   - сайт открывается публично;
   - форма отправляет заявку;
   - сообщение приходит в Telegram;
   - запись появилась в Postgres;
   - после restart Railway-сервиса данные остались.

## Важные правила

- Пользователь не работает с терминалом, всё делает Codex.
- Объяснять простыми словами, коротко.
- Не использовать старые засвеченные токены.
- Не открывать Postgres напрямую наружу, если можно сделать Railway API рядом с базой.
- Перед финалом всегда проверять публичную ссылку и сохранение данных.
