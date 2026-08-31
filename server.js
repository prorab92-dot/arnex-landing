const http = require("node:http");
const { Pool } = require("pg");

const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL;
const apiSecret = process.env.ARNEX_API_SECRET;

let pool;
let schemaReady;

function send(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "https://arnex-landing-prorab92.netlify.app",
    "Access-Control-Allow-Headers": "Content-Type, x-arnex-api-secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function requireSecret(request, response) {
  if (!apiSecret || request.headers["x-arnex-api-secret"] !== apiSecret) {
    send(response, 401, { message: "Unauthorized" });
    return false;
  }

  return true;
}

async function getPool() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("railway.internal")
        ? false
        : { rejectUnauthorized: false },
    });
  }

  if (!schemaReady) {
    schemaReady = pool.query(`
      create table if not exists leads (
        id bigserial primary key,
        name text not null,
        phone text not null,
        message text,
        source text not null default 'site',
        created_at timestamptz not null default now()
      );

      create table if not exists bot_messages (
        id bigserial primary key,
        telegram_chat_id text,
        telegram_user text,
        message text,
        created_at timestamptz not null default now()
      );
    `);
  }

  await schemaReady;
  return pool;
}

async function handleLead(request, response) {
  if (!requireSecret(request, response)) return;

  const data = await readJson(request);
  const name = clean(data.name, 80);
  const phone = clean(data.phone, 40);
  const message = clean(data.message, 600);

  if (!name || !phone) {
    send(response, 400, { message: "Name and phone are required" });
    return;
  }

  const db = await getPool();
  const result = await db.query(
    "insert into leads (name, phone, message, source) values ($1, $2, $3, $4) returning id, created_at",
    [name, phone, message, clean(data.source, 40) || "site"],
  );

  send(response, 200, {
    message: "Lead saved",
    id: result.rows[0].id,
    createdAt: result.rows[0].created_at,
  });
}

async function handleBotMessage(request, response) {
  if (!requireSecret(request, response)) return;

  const data = await readJson(request);
  const db = await getPool();
  const result = await db.query(
    "insert into bot_messages (telegram_chat_id, telegram_user, message) values ($1, $2, $3) returning id, created_at",
    [
      clean(data.chatId, 80),
      clean(data.username, 120),
      clean(data.message, 1000),
    ],
  );

  send(response, 200, {
    message: "Bot message saved",
    id: result.rows[0].id,
    createdAt: result.rows[0].created_at,
  });
}

async function handleDbCheck(request, response) {
  if (!requireSecret(request, response)) return;

  const db = await getPool();
  const result = await db.query(`
    select
      (select count(*)::int from leads) as leads,
      (select count(*)::int from bot_messages) as bot_messages,
      now() as checked_at
  `);

  send(response, 200, result.rows[0]);
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      send(response, 200, { message: "OK" });
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      send(response, 200, { message: "OK" });
      return;
    }

    if (request.method === "POST" && request.url === "/leads") {
      await handleLead(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/bot-messages") {
      await handleBotMessage(request, response);
      return;
    }

    if (request.method === "GET" && request.url === "/db-check") {
      await handleDbCheck(request, response);
      return;
    }

    send(response, 404, { message: "Not found" });
  } catch (error) {
    send(response, 500, { message: error.message });
  }
});

server.listen(port, () => {
  console.log(`Arnex API is listening on ${port}`);
});
