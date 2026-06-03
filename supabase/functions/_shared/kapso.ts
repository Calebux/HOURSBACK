const KAPSO_API_BASE = "https://api.kapso.ai";

export function getKapsoApiKey(): string | null {
  return Deno.env.get("KAPSO_API_KEY") || null;
}

export async function kapsoFetch(path: string, init: RequestInit = {}) {
  const apiKey = getKapsoApiKey();
  if (!apiKey) {
    throw new Error("KAPSO_API_KEY is not configured");
  }

  const headers = new Headers(init.headers);
  headers.set("X-API-Key", apiKey);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${KAPSO_API_BASE}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  if (!response.ok) {
    const message = json?.error || json?.message || `Kapso request failed with ${response.status}`;
    throw new Error(message);
  }

  return json;
}

export async function sendKapsoText(phoneNumberId: string, to: string, body: string) {
  return kapsoFetch(`/meta/whatsapp/v24.0/${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body },
    }),
  });
}

export async function createKapsoCustomer(name: string, externalCustomerId: string) {
  return kapsoFetch("/platform/v1/customers", {
    method: "POST",
    body: JSON.stringify({
      customer: {
        name,
        external_customer_id: externalCustomerId,
      },
    }),
  });
}

export async function createKapsoSetupLink(customerId: string) {
  return kapsoFetch(`/platform/v1/customers/${customerId}/setup_links`, {
    method: "POST",
    body: JSON.stringify({ setup_link: {} }),
  });
}
