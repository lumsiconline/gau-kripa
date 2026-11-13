import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const isStaff = (role: string) => ["admin", "super_admin", "astrologer"].includes(role);
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default;
    if (!url || !key) return json({ error: "Supabase server credentials are not configured." }, 503);
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Please sign in first." }, 401);
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "Your session expired. Please sign in again." }, 401);
    const { data: profile, error: profileError } = await supabase.from("app_users")
      .select("id,email,full_name,phone,role,astrologer_id").eq("auth_user_id", auth.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile.role === "astrologer" && !profile.astrologer_id) return json({ error: "Your astrologer profile is not linked yet. Ask the GauKripa admin to assign your astrologer ID." }, 403);
    if (!profile) return json({ error: "GauKripa profile not found." }, 403);
    const body = await req.json();
    const action = String(body.action ?? "");
    const staff = isStaff(profile.role);

    const loadMessages = async (sessionId: string) => {
      const { data, error } = await supabase.from("chat_messages").select("message")
        .eq("session_id", sessionId).order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => row.message);
    };
    const toSession = async (row: any) => ({ ...row.data, id: row.id, status: row.status, messages: await loadMessages(row.id) });

    if (action === "request") {
      const astroId = String(body.astrologerId ?? "");
      if (!profile.phone) return json({ error: "Add a verified mobile number to your profile before requesting a consultation." }, 400);
      const { data: walletCheck } = await supabase.from("wallets").select("balance").eq("phone", profile.phone).maybeSingle();
      if (Number(walletCheck?.balance || 0) < 1) return json({ error: "Please recharge your GauKripa wallet before starting a paid consultation." }, 402);
      if (!astroId) return json({ error: "Choose an astrologer to start chat." }, 400);
      const { data: astro, error: astroError } = await supabase.from("astrologers")
        .select("data,is_online").eq("id", astroId).maybeSingle();
      if (astroError) throw astroError;
      if (!astro || !astro.is_online) return json({ error: "This astrologer is currently offline." }, 409);
      const { data: settingsRow } = await supabase.from("app_settings").select("data").eq("id", "global").maybeSingle();
      const settings = settingsRow?.data ?? {};
      const { data: priorBooking } = await supabase.from("bookings").select("id")
        .eq("user_id", profile.id).limit(1);
      const hasDiscount = Boolean(settings.discountEnabled && priorBooking?.length);
      const rate = Number(hasDiscount ? settings.discountedRatePerMin : settings.standardRatePerMin) || Number(astro.data.ratePerMin) || 20;
      const sessionId = "CHAT-" + crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const intake = {
        id: "msg-" + crypto.randomUUID(), sender: "customer",
        senderName: profile.full_name || "Devotee",
        text: `📋 VEDIC KUNDALI INTAKE DETAILS:\n• Name: ${profile.full_name}\n• Date of Birth: ${body.birthDate || "Not provided"}\n• Birth Time: ${body.birthTime || "Not provided"}\n• Birth Place: ${body.birthPlace || "Not provided"}\n• Guidance Needed: ${body.customerConcern || "Vedic guidance"}\n\nPranam Guruji! Please guide me.`,
        timestamp: nowTime()
      };
      const welcome = {
        id: "msg-" + crypto.randomUUID(), sender: "astrologer",
        senderName: astro.data.name || "Vedic Astrologer",
        text: `Pranam ${profile.full_name || "ji"}! 🙏 Your consultation request is received. The astrologer will join shortly.`,
        timestamp: nowTime()
      };
      const session = {
        id: sessionId, astrologerId: astroId, astrologerName: astro.data.name || "Vedic Astrologer",
        customerId: auth.user.id, customerName: profile.full_name || "Devotee",
        customerPhone: profile.phone || "", customerConcern: String(body.customerConcern || "Vedic Guidance"),
        birthDate: String(body.birthDate || ""), birthTime: String(body.birthTime || ""), birthPlace: String(body.birthPlace || ""),
        status: "waiting_approval", ratePerMin: rate, hasDiscount, createdAt,
        durationSeconds: 0, totalCharged: 0, astrologerEarned: 0, messages: []
      };
      const { error: insertError } = await supabase.from("chat_sessions").insert({
        id: sessionId, customer_id: auth.user.id, astrologer_id: astroId,
        status: "waiting_approval", data: session
      });
      if (insertError) throw insertError;
      const messages = [intake, welcome].map((message) => ({
        id: message.id, session_id: sessionId, sender_user_id: auth.user.id,
        sender_role: message.sender, message
      }));
      const { error: messageError } = await supabase.from("chat_messages").insert(messages);
      if (messageError) throw messageError;
      return json({ success: true, session: { ...session, messages } });
    }

    if (action === "incoming") {
      if (!staff) return json({ error: "Astrologer access is required." }, 403);
      let q = supabase.from("chat_sessions").select("*").eq("status", "waiting_approval").order("created_at", { ascending: true }).limit(1);
      if (profile.role === "astrologer") q = q.eq("astrologer_id", String(profile.astrologer_id));
      else if (body.astrologerId && body.astrologerId !== "all") q = q.eq("astrologer_id", String(body.astrologerId));
      else if (body.astrologerId && body.astrologerId !== "all") q = q.eq("astrologer_id", String(body.astrologerId));
      const { data, error } = await q;
      if (error) throw error;
      return json({ incoming: data?.[0] ? await toSession(data[0]) : null });
    }

    if (action === "respond") {
      if (!staff) return json({ error: "Astrologer access is required." }, 403);
      const { data: row, error } = await supabase.from("chat_sessions").select("*").eq("id", String(body.sessionId)).maybeSingle();
      if (error) throw error;
      if (!row) return json({ error: "Chat request not found." }, 404);
      if (profile.role === "astrologer" && row.astrologer_id !== profile.astrologer_id) return json({ error: "This chat is assigned to another astrologer." }, 403);
      const nextStatus = body.response === "accept" ? "active" : "rejected";
      const updated = { ...row.data, status: nextStatus, ...(nextStatus === "active" ? { startedAt: new Date().toISOString(), lastHeartbeat: new Date().toISOString() } : { endedAt: new Date().toISOString() }) };
      const { data: saved, error: updateError } = await supabase.from("chat_sessions").update({ status: nextStatus, data: updated, updated_at: new Date().toISOString() }).eq("id", row.id).select("*").single();
      if (updateError) throw updateError;
      return json({ session: await toSession(saved) });
    }

    if (action === "get-session") {
      const { data: row, error } = await supabase.from("chat_sessions").select("*").eq("id", String(body.sessionId)).maybeSingle();
      if (error) throw error;
      if (!row) return json({ error: "Chat session not found." }, 404);
      if (row.customer_id !== auth.user.id && !staff) return json({ error: "Access denied." }, 403);
      if (profile.role === "astrologer" && row.astrologer_id !== profile.astrologer_id) return json({ error: "This chat is assigned to another astrologer." }, 403);
      if (profile.role === "astrologer" && row.astrologer_id !== profile.astrologer_id) return json({ error: "This chat is assigned to another astrologer." }, 403);
      const session = await toSession(row);
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("phone", session.customerPhone).maybeSingle();
      return json({ session, customerWalletBalance: Number(wallet?.balance || 0) });
    }

    if (action === "send-message") {
      const { data: row, error } = await supabase.from("chat_sessions").select("*").eq("id", String(body.sessionId)).maybeSingle();
      if (error) throw error;
      if (!row) return json({ error: "Chat session not found." }, 404);
      if (row.customer_id !== auth.user.id && !staff) return json({ error: "Access denied." }, 403);
      if (profile.role === "astrologer" && row.astrologer_id !== profile.astrologer_id) return json({ error: "This chat is assigned to another astrologer." }, 403);
      if (row.status !== "active") return json({ error: "This consultation is not active." }, 409);
      const text = String(body.text ?? "").trim();
      if (!text || text.length > 4000) return json({ error: "Message must be between 1 and 4,000 characters." }, 400);
      const sender = row.customer_id === auth.user.id ? "customer" : (profile.role === "astrologer" ? "astrologer" : "astrologer");
      const message = {
        id: String(body.clientMessageId || "msg-" + crypto.randomUUID()), sender,
        senderName: sender === "customer" ? (profile.full_name || "Devotee") : (profile.full_name || "Vedic Astrologer"),
        text, timestamp: nowTime(), suggestedSeva: body.suggestedSeva || undefined
      };
      const { error: insertError } = await supabase.from("chat_messages").insert({
        id: message.id, session_id: row.id, sender_user_id: auth.user.id,
        sender_role: sender, message
      });
      if (insertError) throw insertError;
      return json({ success: true, message, session: await toSession(row) });
    }

    if (action === "heartbeat") {
      if (!staff) return json({ error: "Astrologer access is required." }, 403);
      const { data: row, error } = await supabase.from("chat_sessions").select("data,status").eq("id", String(body.sessionId)).maybeSingle();
      if (error) throw error;
      if (!row) return json({ error: "Chat session not found." }, 404);
      const { data: chatRow, error: chatError } = await supabase.from("chat_sessions").select("astrologer_id").eq("id", String(body.sessionId)).maybeSingle();
      if (chatError) throw chatError;
      if (profile.role === "astrologer" && chatRow?.astrologer_id !== profile.astrologer_id) return json({ error: "This chat is assigned to another astrologer." }, 403);
      const { data: billing, error: billingError } = await supabase.rpc("charge_wallet_for_chat_tick", {
        p_session_id: String(body.sessionId), p_elapsed_seconds: 5, p_rate_per_minute: Number(row.data.ratePerMin || 20)
      });
      if (billingError) throw billingError;
      return json(billing);
    }

    if (action === "end") {
      const { data: row, error } = await supabase.from("chat_sessions").select("*").eq("id", String(body.sessionId)).maybeSingle();
      if (error) throw error;
      if (!row) return json({ error: "Chat session not found." }, 404);
      if (row.customer_id !== auth.user.id && !staff) return json({ error: "Access denied." }, 403);
      if (profile.role === "astrologer" && row.astrologer_id !== profile.astrologer_id) return json({ error: "This chat is assigned to another astrologer." }, 403);
      const updated = { ...row.data, status: "ended", endedAt: new Date().toISOString() };
      const { error: updateError } = await supabase.from("chat_sessions").update({ status: "ended", data: updated, updated_at: new Date().toISOString() }).eq("id", row.id);
      if (updateError) throw updateError;
      return json({ session: { ...updated, messages: await loadMessages(row.id) } });
    }

    if (action === "history") {
      if (!staff) return json({ error: "Astrologer access is required." }, 403);
      let q = supabase.from("chat_sessions").select("*").order("created_at", { ascending: false }).limit(100);
      if (profile.role === "astrologer") q = q.eq("astrologer_id", String(profile.astrologer_id));
      else if (body.astrologerId && body.astrologerId !== "all") q = q.eq("astrologer_id", String(body.astrologerId));
      const { data, error } = await q;
      if (error) throw error;
      const sessions = await Promise.all((data ?? []).map(toSession));
      const total = sessions.reduce((sum: number, s: any) => sum + Number(s.astrologerEarned || 0), 0);
      const today = new Date().toISOString().slice(0, 10);
      const todayEarned = sessions.filter((s: any) => String(s.endedAt || s.createdAt).slice(0,10) === today)
        .reduce((sum: number, s: any) => sum + Number(s.astrologerEarned || 0), 0);
      return json({ sessions, analytics: { totalConsultations: sessions.length, todayEarnings: todayEarned, weeklyEarnings: total, monthlyEarnings: total } });
    }

    return json({ error: "Unknown chat action." }, 400);
  } catch (error) {
    console.error("gaukripa-chat error", error);
    return json({ error: "Chat service request failed. Please try again." }, 500);
  }
});
