import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getRazorpayCredentials, razorpayRequest } from "../_shared/razorpay.ts";
import { getSupabaseAdmin, normalizePhone } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = getSupabaseAdmin();
    const { keyId } = getRazorpayCredentials();

    const isSevaOrder = body?.type === "seva" || body?.isPaise === true || (body?.amountInPaise !== undefined && !body?.phone);

    if (isSevaOrder) {
      const amountPaise = Math.round(Number(body?.amountInPaise ?? body?.amount));
      const currency = String(body?.currency || "INR").trim().toUpperCase();
      const receipt = String(body?.receipt || `gk_seva_${Date.now()}`).trim().slice(0, 40);
      const notes = typeof body?.notes === "object" && body?.notes !== null ? body.notes : {};

      if (!Number.isInteger(amountPaise) || amountPaise < 100) {
        return jsonResponse(req, { error: "Minimum order amount must be at least 100 paise (₹1)." }, 400);
      }

      const order = await razorpayRequest<{ id: string; amount: number; currency: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          amount: amountPaise,
          currency,
          receipt,
          notes
        })
      });

      const { error: dbErr } = await supabase.from("razorpay_seva_orders").insert({
        order_id: order.id,
        amount_paise: amountPaise,
        currency: order.currency || currency,
        receipt,
        notes,
        status: "created"
      });
      if (dbErr) throw dbErr;

      return jsonResponse(req, {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId
      });
    }

    // Wallet Recharge Order
    const amountRupees = Number(body?.amount);
    const phone = normalizePhone(body?.phone);
    const customerName = String(body?.name || "Devotee").trim().slice(0, 80);
    const email = String(body?.email || "").trim().slice(0, 120);

    if (!Number.isInteger(amountRupees) || amountRupees < 50 || amountRupees > 100000) {
      return jsonResponse(
        req,
        { error: "Wallet recharge must be a whole-rupee amount of at least ₹50 (maximum ₹1,00,000)." },
        400
      );
    }
    if (phone.length < 10) {
      return jsonResponse(
        req,
        { error: "Please add a valid 10-digit mobile number to your profile before recharging." },
        400
      );
    }

    const amountPaise = amountRupees * 100;
    const order = await razorpayRequest<{ id: string; amount: number; currency: string }>("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `gk_${Date.now()}`.slice(0, 40),
        notes: {
          purpose: "GauKripa wallet recharge",
          wallet_phone: phone,
          customer_name: customerName,
          customer_email: email
        }
      })
    });

    const { error: insertError } = await supabase.from("razorpay_wallet_orders").insert({
      order_id: order.id,
      phone,
      name: customerName,
      email,
      amount: amountRupees,
      amount_paise: amountPaise,
      currency: "INR",
      status: "created"
    });

    if (insertError) throw insertError;

    return jsonResponse(req, {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId
    });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return jsonResponse(req, { error: error?.message || "Unable to create Razorpay payment order." }, 500);
  }
});
