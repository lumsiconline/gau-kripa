import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });
const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-10);
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmacSha256(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default;
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!supabaseUrl || !serviceKey) return json({ error: "Supabase server secret is not configured." }, 503);

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const authHeader = req.headers.get("Authorization") ?? "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!accessToken) return json({ error: "Please sign in to continue." }, 401);
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) return json({ error: "Your session is invalid or expired. Please sign in again." }, 401);

    const { data: profile, error: profileError } = await supabase
      .from("app_users").select("id,email,full_name,phone,role")
      .eq("auth_user_id", authData.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return json({ error: "Your GauKripa profile is not ready. Please sign in again." }, 403);

    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "get-wallet") {
      const phone = digits(body.phone);
      if (!phone || phone !== digits(profile.phone)) return json({ error: "Phone number does not match your account." }, 403);
      const { data: wallet, error: walletError } = await supabase.from("wallets")
        .select("phone,name,balance").eq("phone", phone).maybeSingle();
      if (walletError) throw walletError;
      const { data: transactions, error: txError } = await supabase.from("wallet_transactions")
        .select("id,type,amount,description,created_at").eq("phone", phone)
        .order("created_at", { ascending: false }).limit(50);
      if (txError) throw txError;
      return json({
        phone, name: wallet?.name || profile.full_name || "Devotee",
        balance: Number(wallet?.balance || 0),
        transactions: (transactions || []).map((tx) => ({
          id: tx.id, type: tx.type, amount: Number(tx.amount),
          description: tx.description || "", date: tx.created_at
        }))
      });
    }

    if (action === "create-seva-order") {
      if (!razorpayKeyId || !razorpaySecret) return json({ error: "Razorpay secrets are not configured." }, 503);
      const phone = digits(body.phone);
      const amountPaise = Number(body.amount_paise);
      if (!phone || phone !== digits(profile.phone)) return json({ error: "Booking phone must match your verified account phone number." }, 403);
      if (!Number.isInteger(amountPaise) || amountPaise < 100 || amountPaise > 100000000) return json({ error: "Invalid seva payment amount." }, 400);
      const receipt = String(body.receipt || ("gks_" + crypto.randomUUID().replaceAll("-", "").slice(0, 20))).slice(0, 40);
      const rpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpaySecret}`), "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountPaise, currency: String(body.currency || "INR"), receipt,
          notes: { customer_name: String(profile.full_name || "Devotee"), phone, purpose: "GauKripa Seva Booking",
            seva_title: String(body.seva_title || "").slice(0, 100) } })
      });
      const order = await rpResponse.json();
      if (!rpResponse.ok) return json({ error: order.error?.description ?? "Razorpay order creation failed." }, 502);
      const { error: insertError } = await supabase.from("payment_orders").insert({
        order_id: order.id, phone, amount_paise: amountPaise, currency: order.currency,
        data: { receipt, purpose: "seva", notes: body.notes || {} }
      });
      if (insertError) throw insertError;
      return json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: razorpayKeyId });
    }

    if (action === "verify-seva-payment") {
      if (!razorpayKeyId || !razorpaySecret) return json({ error: "Razorpay secrets are not configured." }, 503);
      const orderId = String(body.order_id || "");
      const paymentId = String(body.payment_id || "");
      const signature = String(body.signature || "");
      const phone = digits(body.phone);
      if (!orderId || !paymentId || !signature || !phone) return json({ error: "Missing payment verification details." }, 400);
      if (phone !== digits(profile.phone)) return json({ error: "Booking phone does not match your verified account." }, 403);
      const { data: orderRow, error: orderError } = await supabase.from("payment_orders").select("*").eq("order_id", orderId).maybeSingle();
      if (orderError) throw orderError;
      if (!orderRow || orderRow.phone !== phone || orderRow.data?.purpose !== "seva") return json({ error: "Seva payment order not found." }, 404);
      const expected = await hmacSha256(razorpaySecret, `${orderId}|${paymentId}`);
      if (!safeEqual(expected, signature)) return json({ error: "Invalid Razorpay payment signature." }, 400);
      const rpResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpaySecret}`) }
      });
      const payment = await rpResponse.json();
      if (!rpResponse.ok || payment.order_id !== orderId || payment.status !== "captured" ||
          Number(payment.amount) !== Number(orderRow.amount_paise) || payment.currency !== orderRow.currency) {
        return json({ error: "Razorpay payment is not captured or does not match the seva order." }, 400);
      }
      const { error: updateError } = await supabase.from("payment_orders").update({
        status: "paid", payment_id: paymentId, verified_at: new Date().toISOString(),
        data: { ...(orderRow.data || {}), payment_status: payment.status, payment_method: payment.method || null }
      }).eq("order_id", orderId);
      if (updateError) throw updateError;
      return json({ success: true, verified: true, payment_id: paymentId, order_id: orderId });
    }

    if (action === "create-order") {
      if (!razorpayKeyId || !razorpaySecret) return json({ error: "Razorpay secrets are not configured." }, 503);
      const phone = digits(body.phone);
      const amount = Number(body.amount);
      if (!phone || phone !== digits(profile.phone)) return json({ error: "Phone number does not match your account." }, 403);
      if (!Number.isInteger(amount) || amount < 50 || amount > 100000) {
        return json({ error: "Wallet recharge must be between ₹50 and ₹1,00,000." }, 400);
      }
      const amountPaise = amount * 100;
      const receipt = `gkw_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
      const rpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpaySecret}`),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise, currency: "INR", receipt,
          notes: { phone, customer_name: String(profile.full_name || "Devotee").slice(0, 100) },
        }),
      });
      const order = await rpResponse.json();
      if (!rpResponse.ok) return json({ error: order.error?.description ?? "Razorpay order creation failed." }, 502);
      const { error: insertError } = await supabase.from("payment_orders").insert({
        order_id: order.id, phone, amount_paise: amountPaise, currency: "INR",
        data: { receipt, customer_name: profile.full_name },
      });
      if (insertError) throw insertError;
      return json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: razorpayKeyId });
    }

    if (action === "verify-payment") {
      if (!razorpayKeyId || !razorpaySecret) return json({ error: "Razorpay secrets are not configured." }, 503);
      const orderId = String(body.order_id ?? "");
      const paymentId = String(body.payment_id ?? "");
      const signature = String(body.signature ?? "");
      const phone = digits(body.phone);
      if (!orderId || !paymentId || !signature || !phone) return json({ error: "Missing valid payment verification details." }, 400);
      if (phone !== digits(profile.phone)) return json({ error: "Phone number does not match your account." }, 403);

      const { data: orderRow, error: orderError } = await supabase.from("payment_orders")
        .select("*").eq("order_id", orderId).maybeSingle();
      if (orderError) throw orderError;
      if (!orderRow || orderRow.phone !== phone) return json({ error: "Payment order not found for this account." }, 404);

      const expected = await hmacSha256(razorpaySecret, `${orderId}|${paymentId}`);
      if (!safeEqual(expected, signature)) return json({ error: "Invalid Razorpay payment signature." }, 400);

      const rpResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpaySecret}`) },
      });
      const payment = await rpResponse.json();
      if (!rpResponse.ok || payment.order_id !== orderId || payment.status !== "captured" ||
          Number(payment.amount) !== Number(orderRow.amount_paise) || payment.currency !== "INR") {
        return json({ error: "Razorpay payment is not captured or does not match the order." }, 400);
      }
      const { data: credit, error: creditError } = await supabase.rpc("credit_wallet_from_verified_payment", {
        p_order_id: orderId, p_payment_id: paymentId, p_phone: phone,
        p_amount_paise: Number(payment.amount), p_payment_data: {
          payment_status: payment.status, method: payment.method ?? null,
        },
      });
      if (creditError) throw creditError;
      return json({ success: true, verified: true, credited: Boolean(credit?.credited),
        already_credited: Boolean(credit?.already_credited), balance: credit?.balance });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("gaukripa-payments error", error);
    return json({ error: "Payment request failed. Please try again or contact support." }, 500);
  }
});
