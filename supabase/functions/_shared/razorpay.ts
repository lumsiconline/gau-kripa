export function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  const keyId = (Deno.env.get("RAZORPAY_KEY_ID") || "").trim();
  const keySecret = (Deno.env.get("RAZORPAY_KEY_SECRET") || "").trim();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay secrets (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured in Supabase Secrets.");
  }

  return { keyId, keySecret };
}

export async function razorpayRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const auth = btoa(`${keyId}:${keySecret}`);

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Razorpay API error:", response.status, body?.error?.description || "Unknown error");
    throw new Error(body?.error?.description || "Razorpay payment request failed.");
  }

  return body as T;
}

export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(keySecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${orderId}|${paymentId}`)
  );

  const expectedHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const received = signature.trim().toLowerCase();
  if (expectedHex.length !== received.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    mismatch |= expectedHex.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return mismatch === 0;
}
