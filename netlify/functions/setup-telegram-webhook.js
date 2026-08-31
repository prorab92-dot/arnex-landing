const SITE_URL = "https://arnex-landing-prorab92.netlify.app";
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

async function telegram(token, method, body) {
  const response = await fetch(`${TELEGRAM_API}${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram ${method} failed`);
  }

  return data.result;
}

exports.handler = async (event) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const setupSecret = process.env.TELEGRAM_SETUP_SECRET;
  const receivedSecret = event.headers["x-arnex-setup-secret"];

  if (!token || !webhookSecret || !setupSecret) {
    return json(500, { message: "Telegram setup is not configured" });
  }

  if (receivedSecret !== setupSecret) {
    return json(401, { message: "Unauthorized" });
  }

  try {
    const me = await telegram(token, "getMe");
    const webhookUrl = `${SITE_URL}/.netlify/functions/telegram-webhook`;

    await telegram(token, "setWebhook", {
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ["message", "edited_message"],
      drop_pending_updates: false,
    });

    const webhook = await telegram(token, "getWebhookInfo");

    return json(200, {
      username: me.username,
      webhookUrl: webhook.url,
      pendingUpdateCount: webhook.pending_update_count,
      lastError: webhook.last_error_message || null,
    });
  } catch (error) {
    return json(502, { message: error.message });
  }
};
