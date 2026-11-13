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
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    const phone = normalizePhone(body?.phone, "9876543210");

    if (!name) {
      return jsonResponse(req, { error: "Please enter your full name." }, 400);
    }
    if (!email || !email.includes("@")) {
      return jsonResponse(req, { error: "Please enter a valid email address." }, 400);
    }
    if (password.length < 4) {
      return jsonResponse(req, { error: "Password must be at least 4 characters long." }, 400);
    }
    if (email === "bankush014@gmail.com") {
      return jsonResponse(req, { error: "This email is already registered. Please sign in." }, 400);
    }

    const supabase = getSupabaseAdmin();

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return jsonResponse(req, { error: "This email is already registered. Please sign in." }, 400);
    }

    const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        role: "devotee"
      }
    });

    if (createErr) {
      const msg = createErr.message?.toLowerCase().includes("already")
        ? "This email is already registered. Please sign in."
        : createErr.message || "Registration failed.";
      return jsonResponse(req, { error: msg }, 400);
    }

    const authUserId = authData?.user?.id;

    const { error: profileErr } = await supabase.from("profiles").upsert(
      {
        auth_user_id: authUserId,
        email,
        name,
        phone,
        role: "devotee"
      },
      { onConflict: "email" }
    );
    if (profileErr) throw profileErr;

    // Preserve any existing wallet balance for this phone; initialize at 0 only if absent
    await supabase
      .from("wallets")
      .upsert(
        {
          phone,
          auth_user_id: authUserId,
          name,
          balance: 0
        },
        { onConflict: "phone", ignoreDuplicates: true }
      );

    return jsonResponse(req, {
      success: true,
      message: "Account created successfully! Please sign in with your email and password."
    });
  } catch (error: any) {
    console.error("Registration failed:", error);
    return jsonResponse(req, { error: error?.message || "Failed to register user." }, 500);
  }
});
