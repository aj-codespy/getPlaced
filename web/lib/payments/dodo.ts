import crypto from "crypto";

export const DODO_API_BASE =
  process.env.DODO_PAYMENTS_API_BASE ||
  (process.env.DODO_PAYMENTS_ENVIRONMENT === "test"
    ? "https://test.dodopayments.com"
    : "https://live.dodopayments.com");

type JsonRecord = Record<string, unknown>;

function getDodoApiKey() {
  return process.env.DODO_API_KEY || process.env.DODO_PAYMENTS_API_KEY || "";
}

export async function dodoApiRequest(path: string, body: JsonRecord) {
  const apiKey = getDodoApiKey();
  if (!apiKey) {
    throw new Error("DODO_API_KEY is not configured");
  }

  const response = await fetch(`${DODO_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as JsonRecord;
  if (!response.ok) {
    const message =
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      `Dodo API request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function normalizeSignatureFragments(signatureHeader: string) {
  return signatureHeader
    .split(" ")
    .flatMap((part) => part.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (entry.includes("=") ? entry.split("=")[1] : entry));
}

export function verifyDodoWebhookSignature(args: {
  rawBody: string;
  webhookId: string;
  webhookTimestamp: string;
  webhookSignature: string;
}) {
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || "";
  if (!webhookKey) return false;

  const signedMessage = `${args.webhookId}.${args.webhookTimestamp}.${args.rawBody}`;
  const hmac = crypto.createHmac("sha256", webhookKey);
  hmac.update(signedMessage);

  const digestBase64 = hmac.digest("base64");
  const digestBase64Url = digestBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const digestHex = crypto.createHmac("sha256", webhookKey).update(signedMessage).digest("hex");

  const fragments = normalizeSignatureFragments(args.webhookSignature);
  return fragments.some((candidate) => {
    try {
      return (
        crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(digestBase64)) ||
        crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(digestBase64Url)) ||
        crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(digestHex))
      );
    } catch {
      return false;
    }
  });
}

