import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getRazorpayCredentials, razorpayRequest, verifyRazorpaySignature } from "../_shared/razorpay.ts";
import { getSupabaseAdmin, normalizePhone } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.order_id || "").trim();
    const paymentId = String(body?.payment_id || "").trim();
    const signature = String(body?.signature || "").trim();
    const requestedPhone = normalizePhone(body?.phone);
    const isSevaVerification = body?.type === "seva" || (!body?.phone && orderId && paymentId && signature);

    if (!orderId || !paymentId || !signature) {
      return jsonResponse(req, { success: false, verified: false, error: "Missing payment verification fields." }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { keySecret } = getRazorpayCredentials();

    // 1. Verify HMAC-SHA256 signature with Razorpay secret
    const isSignatureValid = await verifyRazorpaySignature(orderId, paymentId, signature, keySecret);
    if (!isSignatureValid) {
      return jsonResponse(req, { success: false, verified: false, error: "Razorpay payment signature is invalid." }, 400);
    }

    // 2. Check Seva order flow vs Wallet recharge order flow
    if (isSevaVerification) {
      const { data: sevaOrder, error: sevaErr } = await supabase
        .from("razorpay_seva_orders")
        .select("order_id, amount_paise, currency, status")
        .eq("order_id", orderId)
        .maybeSingle();

      if (sevaErr) throw sevaErr;
      if (!sevaOrder) {
        return jsonResponse(req, { success: false, verified: false, error: "Seva payment order was not found." }, 404);
      }

      const payment = await razorpayRequest<{
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        captured: boolean;
      }>(`/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });

      if (
        payment.order_id !== orderId ||
        Number(payment.amount) !== Number(sevaOrder.amount_paise) ||
        payment.currency !== (sevaOrder.currency || "INR") ||
        payment.status !== "captured" ||
        payment.captured !== true
      ) {
        return jsonResponse(
          req,
          {
            success: false,
            verified: false,
            error: "Razorpay has not confirmed a captured payment for this Seva order. Ensure auto-capture is enabled in Razorpay."
          },
          400
        );
      }

      await supabase
        .from("razorpay_seva_orders")
        .update({ status: "captured", payment_id: paymentId, paid_at: new Date().toISOString() })
        .eq("order_id", orderId);

      let persistedBooking: Record<string, unknown> | null = null;
      if (body?.booking && typeof body.booking === "object") {
        const b = body.booking as Record<string, unknown>;
        const bookingPhone = normalizePhone(b.phone, "9876543210");
        const generatedBookingId = String(b.bookingId || `GK-${Math.floor(100000 + Math.random() * 900000)}`);
        const bookingRow = {
          id: String(b.id || `bkg-${paymentId}`),
          booking_id: generatedBookingId,
          devotee_name: String(b.devoteeName || "Devotee").slice(0, 120),
          phone: bookingPhone,
          email: String(b.email || "").slice(0, 120),
          gotra: String(b.gotra || "Kashyap").slice(0, 80),
          seva_id: String(b.sevaId || "gau-chara").slice(0, 80),
          seva_title: String(b.sevaTitle || "Gau Seva").slice(0, 160),
          quantity: String(b.quantity || "1 unit").slice(0, 80),
          duration: String(b.duration || "1 Day").slice(0, 80),
          occasion: String(b.occasion || "General Daily Seva").slice(0, 120),
          amount: Number(b.amount ?? Number(sevaOrder.amount_paise) / 100),
          base_amount: Number(b.baseAmount ?? Number(sevaOrder.amount_paise) / 100),
          extra_fee: Number(b.extraFee ?? 0),
          status: "confirmed",
          date: String(b.date || new Date().toISOString().split("T")[0]),
          family_members: Array.isArray(b.familyMembers) ? b.familyMembers : [],
          sankalp_wish: String(b.sankalpWish || "").slice(0, 500),
          goshala: String(b.goshala || "GauKripa Pramanit Goshala").slice(0, 160),
          created_at: new Date().toISOString()
        };

        const { data: savedBkg, error: bkgErr } = await supabase
          .from("bookings")
          .upsert(bookingRow, { onConflict: "id" })
          .select()
          .maybeSingle();

        if (!bkgErr && savedBkg) {
          persistedBooking = savedBkg;
        }
      }

      return jsonResponse(req, {
        success: true,
        verified: true,
        message: "Seva payment verified successfully.",
        booking: persistedBooking
      });
    }

    // Wallet Recharge Verification
    if (requestedPhone.length < 10) {
      return jsonResponse(req, { success: false, verified: false, error: "Valid 10-digit wallet phone is required." }, 400);
    }

    const { data: savedOrder, error: orderError } = await supabase
      .from("razorpay_wallet_orders")
      .select("order_id, phone, name, amount, amount_paise, currency")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!savedOrder) {
      return jsonResponse(req, { success: false, verified: false, error: "Wallet payment order was not found." }, 404);
    }

    if (normalizePhone(savedOrder.phone) !== requestedPhone) {
      return jsonResponse(
        req,
        { success: false, verified: false, error: "This payment order does not belong to this wallet." },
        403
      );
    }

    // 3. Verify live payment status directly with Razorpay API
    const payment = await razorpayRequest<{
      order_id: string;
      amount: number;
      currency: string;
      status: string;
      captured: boolean;
    }>(`/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });

    if (
      payment.order_id !== orderId ||
      Number(payment.amount) !== Number(savedOrder.amount_paise) ||
      payment.currency !== "INR" ||
      payment.status !== "captured" ||
      payment.captured !== true
    ) {
      return jsonResponse(
        req,
        {
          success: false,
          verified: false,
          error: "Razorpay has not confirmed a captured payment for this exact order and amount. Ensure auto-capture is enabled in Razorpay."
        },
        400
      );
    }

    // 4. Atomic idempotent PostgreSQL credit via service_role RPC
    const { data: creditRows, error: rpcError } = await supabase.rpc("credit_wallet_from_verified_payment", {
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_phone: requestedPhone,
      p_name: savedOrder.name || "Devotee",
      p_amount: Number(savedOrder.amount)
    });

    if (rpcError) throw rpcError;

    const row = Array.isArray(creditRows) ? creditRows[0] : creditRows;
    return jsonResponse(req, {
      success: true,
      verified: true,
      credited: Boolean(row?.credited),
      balance: Number(row?.balance ?? 0)
    });
  } catch (error: any) {
    console.error("Razorpay payment verification failed:", error);
    return jsonResponse(
      req,
      { success: false, verified: false, error: "Unable to verify and credit this Razorpay payment. Please contact support." },
      500
    );
  }
});
