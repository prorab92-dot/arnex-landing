const TELEGRAM_API = "https://api.telegram.org/bot";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

function getReply(text) {
  if (text === "/start") {
    return [
      "Здравствуйте! Это Арнекс.",
      "",
      "Мы делаем ремонт квартир под ключ: черновые работы, чистовую отделку, дизайн и полный ремонт.",
      "Оставьте заявку на сайте или напишите здесь имя, телефон и коротко про квартиру.",
    ].join("\n");
  }

  return [
    "Спасибо! Это бот Арнекс.",
    "Чтобы мы рассчитали ремонт, отправьте имя, телефон и пару слов о квартире.",
    "Также можно оставить заявку на сайте: https://arnex-landing-prorab92.netlify.app",
  ].join("\n");
}

async function sendMessage(token, chatId, text) {
  return fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(200, { message: "Telegram webhook is ready" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = event.headers["x-telegram-bot-api-secret-token"];

  if (!token) {
    return json(500, { message: "Telegram bot is not configured" });
  }

  if (webhookSecret && receivedSecret !== webhookSecret) {
    return json(401, { message: "Unauthorized" });
  }

  let update;
  try {
    update = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { message: "Bad request" });
  }

  const message = update.message || update.edited_message;
  const chatId = message?.chat?.id;
  const text = String(message?.text || "").trim();

  if (!chatId) {
    return json(200, { message: "No chat to reply" });
  }

  const response = await sendMessage(token, chatId, getReply(text));

  if (!response.ok) {
    return json(502, { message: "Telegram reply failed" });
  }

  return json(200, { message: "Reply sent" });
};
