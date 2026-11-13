import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, normalizePhone } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "GET") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const phone = normalizePhone(url.searchParams.get("phone"));
  if (phone.length < 7) {
    return jsonResponse(req, { error: "A valid account phone number is required." }, 400);
  }

  try {
    const supabase = getSupabaseAdmin();

    const [{ data: wallet, error: walletError }, { data: txRows, error: txError }] = await Promise.all([
      supabase
        .from("wallets")
        .select("phone, name, balance")
        .eq("phone", phone)
        .maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("id, type, amount, description, payment_id, order_id, created_at")
        .eq("wallet_phone", phone)
        .order("created_at", { ascending: false })
        .limit(50)
    ]);

    if (walletError) throw walletError;
    if (txError) throw txError;

    return jsonResponse(req, {
      phone,
      name: wallet?.name || "Devotee",
      balance: Number(wallet?.balance ?? 0),
      transactions: (txRows || []).map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description,
        date: tx.created_at,
        paymentId: tx.payment_id || undefined,
        orderId: tx.order_id || undefined
      }))
    });
  } catch (error: any) {
    console.error("Wallet read failed:", error);
    return jsonResponse(req, { error: error?.message || "Unable to load wallet." }, 500);
  }
});
