async function callArnexApi(path, payload) {
  const apiUrl = process.env.ARNEX_API_URL;
  const apiSecret = process.env.ARNEX_API_SECRET;

  if (!apiUrl || !apiSecret) {
    return null;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-arnex-api-secret": apiSecret,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Arnex API request failed");
  }

  return response.json();
}

module.exports = { callArnexApi };
