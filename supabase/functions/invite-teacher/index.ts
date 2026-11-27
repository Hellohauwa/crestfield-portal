// Crestfield College: invite and manage teachers (admins only).
// Runs on Supabase Edge Functions so the service role key never reaches the browser.
//
// POST JSON body, one of:
//   { action: "invite", email, full_name, redirectTo? }   → { user_id }
//   { action: "list" }                                     → { teachers: [...] }
//   { action: "resend", user_id, redirectTo? }             → { ok: true }
//   { action: "cancel", user_id }                          → { ok: true }   (only invites never accepted)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Who is calling? Must be a logged-in admin.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller?.user) return json({ error: "Please log in again." }, 401);
  const { data: callerRole } = await admin.from("user_roles").select("role").eq("user_id", caller.user.id).maybeSingle();
  if (callerRole?.role !== "admin") return json({ error: "Only admins can invite or manage teachers." }, 403);

  let body: Record<string, string>;
  try { body = await req.json(); } catch { return json({ error: "Send a JSON body." }, 400); }

  // Only accept redirect links that look like a normal web address
  const redirectTo = typeof body.redirectTo === "string" && /^https?:\/\//.test(body.redirectTo) ? body.redirectTo : undefined;

  // Helper: is this user a teacher who has never accepted their invite?
  async function pendingTeacher(userId: string) {
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    if (role?.role !== "teacher") return { ok: false, error: "That account is not a teacher." };
    const { data: u, error } = await admin.auth.admin.getUserById(userId);
    if (error || !u?.user) return { ok: false, error: "Account not found." };
    const pending = !u.user.last_sign_in_at && !u.user.email_confirmed_at;
    return { ok: true, pending, user: u.user };
  }

  switch (body.action) {
    case "invite": {
      const email = String(body.email ?? "").trim().toLowerCase();
      const fullName = String(body.full_name ?? "").trim().replace(/\s+/g, " ");
      if (!EMAIL_RE.test(email)) return json({ error: "Enter a valid email address." }, 400);
      if (fullName.length < 3) return json({ error: "Enter the teacher's full name." }, 400);

      const { data: existing } = await admin.from("profiles").select("id, full_name").ilike("email", email).maybeSingle();
      if (existing) {
        return json({ error: "An account with " + email + " already exists (" + existing.full_name + "). Use \"Make teacher\" on the Teachers tab instead.", code: "exists" }, 409);
      }

      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName }, redirectTo });
      if (error || !data?.user) return json({ error: "The invite email could not be sent: " + (error?.message ?? "unknown error") }, 400);

      // The sign-up trigger made them a student; make them a teacher.
      const { error: roleErr } = await admin.from("user_roles").update({ role: "teacher" }).eq("user_id", data.user.id);
      if (roleErr) return json({ error: "Invite sent, but the teacher role could not be set: " + roleErr.message }, 500);
      return json({ user_id: data.user.id });
    }

    case "list": {
      const { data: roles, error } = await admin.from("user_roles").select("user_id").eq("role", "teacher");
      if (error) return json({ error: error.message }, 500);
      const ids = new Set((roles ?? []).map((r) => r.user_id));
      const teachers: unknown[] = [];
      for (let page = 1; page <= 20 && teachers.length < ids.size; page++) {
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (listErr) return json({ error: listErr.message }, 500);
        list.users.filter((u) => ids.has(u.id)).forEach((u) => teachers.push({
          id: u.id,
          email: u.email,
          full_name: (u.user_metadata?.full_name as string) ?? null,
          invited_at: u.invited_at ?? null,
          last_sign_in_at: u.last_sign_in_at ?? null,
          pending: !u.last_sign_in_at && !u.email_confirmed_at,
        }));
        if (list.users.length < 1000) break;
      }
      return json({ teachers });
    }

    case "resend": {
      const t = await pendingTeacher(String(body.user_id ?? ""));
      if (!t.ok) return json({ error: t.error }, 400);
      if (!t.pending) return json({ error: "This teacher has already accepted the invite." }, 400);
      const { error } = await admin.auth.admin.inviteUserByEmail(t.user!.email!, { data: t.user!.user_metadata, redirectTo });
      if (error) return json({ error: "The invite could not be resent: " + error.message }, 400);
      return json({ ok: true });
    }

    case "cancel": {
      const t = await pendingTeacher(String(body.user_id ?? ""));
      if (!t.ok) return json({ error: t.error }, 400);
      if (!t.pending) return json({ error: "This teacher has already accepted the invite. Remove their teacher role instead." }, 400);
      const { error } = await admin.auth.admin.deleteUser(t.user!.id);
      if (error) return json({ error: "The invite could not be cancelled: " + error.message }, 400);
      return json({ ok: true });
    }

    default:
      return json({ error: "Unknown action." }, 400);
  }
});
