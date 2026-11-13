import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, normalizePhone } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.sessionId || "").trim();
    if (!sessionId) {
      return jsonResponse(req, { error: "sessionId is required" }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: session, error: sessErr } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessErr) throw sessErr;
    if (!session || session.status !== "active") {
      return jsonResponse(req, { status: session?.status || "not_found" });
    }

    const now = Date.now();
    const startTime = session.started_at ? new Date(session.started_at).getTime() : now;
    const elapsedSecs = Math.max(0, Math.floor((now - startTime) / 1000));
    const billedMinutes = Math.max(1, Math.ceil(elapsedSecs / 60));
    const targetCharge = billedMinutes * Number(session.rate_per_min || 20);
    const diff = Number((targetCharge - Number(session.total_charged || 0)).toFixed(2));
    const phone = normalizePhone(session.customer_phone);

    let nextTotalCharged = Number(session.total_charged || 0);
    let nextAstroEarned = Number(session.astrologer_earned || 0);
    let nextStatus = session.status;
    let nextEndedAt = session.ended_at;
    let nextMessages = Array.isArray(session.messages) ? [...session.messages] : [];
    let walletBalance = 0;

    if (diff > 0 && phone) {
      const txId = `chat-${sessionId}-min-${billedMinutes}`;
      const { data: debitRows, error: rpcErr } = await supabase.rpc("debit_wallet_for_chat", {
        p_phone: phone,
        p_amount: diff,
        p_description: `Vedic Consultation with ${session.astrologer_name} (${billedMinutes} min @ ₹${session.rate_per_min}/min)`,
        p_tx_id: txId
      });
      if (rpcErr) throw rpcErr;
      const row = Array.isArray(debitRows) ? debitRows[0] : debitRows;
      walletBalance = Number(row?.balance ?? 0);

      if (row?.debited) {
        nextTotalCharged = Number((nextTotalCharged + diff).toFixed(2));
        nextAstroEarned = Number((nextAstroEarned + diff).toFixed(2));
      } else {
        nextStatus = "ended";
        nextEndedAt = new Date().toISOString();
        nextMessages.push({
          id: `sys-${Date.now()}`,
          sender: "astrologer",
          senderName: "System",
          text: `Consultation session concluded because devotee wallet balance was exhausted. Thank you for seeking Vedic guidance with ${session.astrologer_name}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });
      }
    } else if (phone) {
      const { data: w } = await supabase.from("wallets").select("balance").eq("phone", phone).maybeSingle();
      walletBalance = Number(w?.balance ?? 0);
    }

    await supabase
      .from("chat_sessions")
      .update({
        duration_seconds: elapsedSecs,
        total_charged: nextTotalCharged,
        astrologer_earned: nextAstroEarned,
        status: nextStatus,
        ended_at: nextEndedAt,
        last_heartbeat: new Date().toISOString(),
        messages: nextMessages
      })
      .eq("id", sessionId);

    return jsonResponse(req, {
      success: true,
      durationSeconds: elapsedSecs,
      totalCharged: nextTotalCharged,
      astrologerEarned: nextAstroEarned,
      walletBalance,
      status: nextStatus
    });
  } catch (error: any) {
    console.error("Chat heartbeat error:", error);
    return jsonResponse(req, { error: error?.message || "Heartbeat failed." }, 500);
  }
});
