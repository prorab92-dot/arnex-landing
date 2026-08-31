const TELEGRAM_API = "https://api.telegram.org/bot";
const { callArnexApi } = require("./api-client");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { message: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return json(500, { message: "Telegram bot is not configured" });
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { message: "Bad request" });
  }

  const name = clean(data.name, 80);
  const phone = clean(data.phone, 40);
  const message = clean(data.message, 600);

  if (!name || !phone) {
    return json(400, { message: "Name and phone are required" });
  }

  const text = [
    "Новая заявка с сайта Арнекс",
    "",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    message ? `Комментарий: ${message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await callArnexApi("/leads", {
    name,
    phone,
    message,
    source: "site",
  });

  const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
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

  if (!response.ok) {
    return json(502, { message: "Telegram delivery failed" });
  }

  return json(200, { message: "Lead sent" });
};
