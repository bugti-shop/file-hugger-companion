import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';

const UnlockBody = z.union([
  z.object({ code: z.string().min(1).max(256) }).strict(),
  z.object({ token: z.string().min(1).max(256) }).strict(),
  z.object({ status: z.literal(true) }).strict(),
]);

const respond = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function constantTimeEqual(value: string, expected: string): boolean {
  let mismatch = value.length === expected.length ? 0 : 1;
  for (let i = 0; i < Math.max(value.length, expected.length); i++) {
    mismatch |= (value.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return respond({ error: "Sign in required" }, 401);
    }

    const body = await req.json().catch(() => null);
    const parsed = UnlockBody.safeParse(body);
    if (!parsed.success) return respond({ error: 'Invalid unlock request' }, 400);

    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const accessToken = authHeader.replace("Bearer ", "");
    if (!accessToken || accessToken === anonKey) {
      return respond({ error: "Sign in required" }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey || !anonKey) return respond({ error: 'Unlock not configured' }, 500);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      return respond({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(
      supabaseUrl,
      serviceKey,
    );

    if ('status' in parsed.data) {
      const { data: entitlement, error: statusError } = await admin
        .from('user_entitlements')
        .select('is_active,expires_at,product_id')
        .eq('app_user_id', userData.user.id)
        .maybeSingle();
      if (statusError) throw statusError;
      const active = entitlement?.product_id === 'web_premium_unlock' && entitlement.is_active === true
        && !!entitlement.expires_at && new Date(entitlement.expires_at).getTime() > Date.now();
      return respond({ active }, 200);
    }

    const expected = 'token' in parsed.data
      ? Deno.env.get('PRO_LINK_TOKEN')
      : Deno.env.get('ADMIN_UNLOCK_CODE');
    if (!expected) return respond({ error: 'Unlock not configured' }, 500);
    const input = 'token' in parsed.data ? parsed.data.token : parsed.data.code;
    if (!constantTimeEqual(input, expected)) return respond({ error: 'Invalid unlock code' }, 403);

    const expiresAt = new Date("2099-12-31T23:59:59.000Z").toISOString();
    const rows = [
      {
        app_user_id: String(userData.user.id),
        is_active: true,
        product_id: "web_premium_unlock",
        expires_at: expiresAt,
        grace_period_expires_at: null,
      },
    ];
    if (userData.user.email) {
      rows.push({
        app_user_id: String(userData.user.email).toLowerCase(),
        is_active: true,
        product_id: "web_premium_unlock",
        expires_at: expiresAt,
        grace_period_expires_at: null,
      });
    }

    const { error } = await admin
      .from("user_entitlements")
      .upsert(rows, { onConflict: "app_user_id" });

    if (error) throw error;

    return respond({ ok: true }, 200);
  } catch (e) {
    console.error("premium-web-unlock error", e);
    return respond({ error: "Could not unlock premium" }, 500);
  }
});