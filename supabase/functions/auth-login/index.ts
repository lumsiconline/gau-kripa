import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, normalizePhone } from "../_shared/supabaseAdmin.ts";

const SUPER_ADMIN_EMAIL = "bankush014@gmail.com";
const SUPER_ADMIN_SHA256 = "f20a5b4a1228638e06651aa7c17522834328bf543cb8b222ddbc352ad7a855f2";

async function sha256Hex(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();

    if (!email) {
      return jsonResponse(req, { error: "Please enter your email address." }, 400);
    }
    if (!password) {
      return jsonResponse(req, { error: "Please enter your password." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = getSupabaseAdmin();
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const inputHash = await sha256Hex(password);

    // Super Admin login & first-time Supabase Auth provisioning
    if (email === SUPER_ADMIN_EMAIL) {
      if (inputHash !== SUPER_ADMIN_SHA256) {
        return jsonResponse(req, { error: "Invalid email or password. Please try again." }, 401);
      }

      let signInRes = await authClient.auth.signInWithPassword({ email, password });
      if (signInRes.error || !signInRes.data.session) {
        const { data: existingAdmin } = await supabaseAdmin
          .from("profiles")
          .select("auth_user_id")
          .eq("email", SUPER_ADMIN_EMAIL)
          .maybeSingle();

        let adminAuthId = existingAdmin?.auth_user_id || null;
        if (!adminAuthId) {
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: SUPER_ADMIN_EMAIL,
            password,
            email_confirm: true,
            user_metadata: { name: "Super Admin", phone: "7838031067", role: "super_admin" }
          });
          if (!createErr && created?.user) {
            adminAuthId = created.user.id;
          } else {
            const { data: list } = await supabaseAdmin.auth.admin.listUsers();
            adminAuthId = list?.users?.find((u) => u.email?.toLowerCase() === SUPER_ADMIN_EMAIL)?.id || null;
          }
        }

        if (adminAuthId) {
          await supabaseAdmin.auth.admin.updateUserById(adminAuthId, {
            password,
            email_confirm: true,
            user_metadata: { name: "Super Admin", phone: "7838031067", role: "super_admin" }
          });
          await supabaseAdmin.from("profiles").upsert(
            {
              auth_user_id: adminAuthId,
              email: SUPER_ADMIN_EMAIL,
              name: "Super Admin",
              phone: "7838031067",
              role: "super_admin"
            },
            { onConflict: "email" }
          );
          signInRes = await authClient.auth.signInWithPassword({ email, password });
        }
      }

      return jsonResponse(req, {
        success: true,
        user: {
          name: "Super Admin",
          email: SUPER_ADMIN_EMAIL,
          role: "super_admin",
          phone: "7838031067",
          isAdmin: true
        },
        session: signInRes.data?.session || null
      });
    }

    // Standard devotee sign in via Supabase Auth
    let signInRes = await authClient.auth.signInWithPassword({ email, password });

    // Check profile record (including any legacy migrated user not yet in auth.users)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, auth_user_id, name, email, phone, role, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (signInRes.error && profile && profile.password_hash) {
      if (inputHash !== profile.password_hash) {
        return jsonResponse(req, { error: "Invalid email or password. Please try again." }, 401);
      }
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: profile.name,
          phone: normalizePhone(profile.phone, "9876543210"),
          role: profile.role || "devotee"
        }
      });
      if (!createErr && created?.user) {
        await supabaseAdmin
          .from("profiles")
          .update({ auth_user_id: created.user.id, password_hash: null })
          .eq("id", profile.id);
        signInRes = await authClient.auth.signInWithPassword({ email, password });
      }
    }

    if (signInRes.error || !signInRes.data.user) {
      if (!profile) {
        return jsonResponse(req, { error: "Account not found. Please sign up first, then sign in." }, 401);
      }
      return jsonResponse(req, { error: "Invalid email or password. Please try again." }, 401);
    }

    const authUser = signInRes.data.user;
    const resolvedName = profile?.name || authUser.user_metadata?.name || "Devotee";
    const resolvedPhone = normalizePhone(profile?.phone || authUser.user_metadata?.phone, "9876543210");
    const resolvedRole = profile?.role === "super_admin" ? "super_admin" : "devotee";

    return jsonResponse(req, {
      success: true,
      user: {
        name: resolvedName,
        email,
        role: resolvedRole,
        phone: resolvedPhone,
        isAdmin: resolvedRole === "super_admin"
      },
      session: signInRes.data.session
    });
  } catch (error: any) {
    console.error("Login failed:", error);
    return jsonResponse(req, { error: error?.message || "Authentication failed." }, 500);
  }
});
