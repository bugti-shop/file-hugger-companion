/**
 * Web-only premium unlock route: /premium-unlock
 *
 * SECURITY: The unlock code is NEVER shipped in the client bundle. The admin
 * must type it into the input below, or arrive via a private URL token.
 * The server (premium-web-unlock edge function) checks its encrypted secrets. If it matches
 * AND the caller has a verified identity (including a guest identity), a real `web_premium_unlock` entitlement is
 * granted server-side. All other clients (AI extract, web clipper, etc.)
 * then see Pro via the normal entitlement path — there is no separate
 * client-supplied bypass anymore.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Keep the token only in memory during app-shell remounts (e.g. onboarding
// hydration); remove it from the address bar before any request is made.
const linkToken = (() => {
  const url = new URL(window.location.href);
  if (url.pathname !== '/premium-unlock') return null;
  const token = url.searchParams.get('token');
  if (token) {
    url.searchParams.delete('token');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return token;
})();
let linkRedemption: Promise<boolean> | null = null;

// Private links work without a login screen: create a scoped anonymous Supabase
// identity only when needed, so the server can bind the entitlement to a real
// verified JWT rather than trusting a browser flag or a user-supplied ID.
const ensureUnlockIdentity = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (session) return;
  const { error: signInError } = await supabase.auth.signInAnonymously();
  if (signInError) throw signInError;
};

const PremiumUnlock = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [linkMode] = useState(!!linkToken);

  const redeem = async (body: { code?: string; token?: string }) => {
    setBusy(true);
    setError(null);
    try {
      await ensureUnlockIdentity();
      const { data, error: fnErr } = await supabase.functions.invoke('premium-web-unlock', { body });
      if (fnErr) throw fnErr;
      if (!data || (data as { ok?: boolean }).ok !== true) throw new Error('Invalid unlock');
      // This event updates the open paywall only after the server has written the entitlement.
      // Do not persist an unverified client-side Pro flag on the device.
      window.dispatchEvent(new Event('webPremiumEntitlementGranted'));
      setOk(true);
      setTimeout(() => navigate('/', { replace: true }), 800);
    } catch {
      setError('Link ya code invalid hai. Dobara try karein.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!linkToken) return;
    let active = true;
    if (!linkRedemption) {
      linkRedemption = ensureUnlockIdentity()
        .then(() => supabase.functions.invoke('premium-web-unlock', { body: { token: linkToken } }))
        .then(({ data, error }) => !error && data?.ok === true)
        .catch(() => false);
    }
    void linkRedemption.then((success) => {
      if (!active) return;
      setBusy(false);
      if (success) {
        window.dispatchEvent(new Event('webPremiumEntitlementGranted'));
        setOk(true);
        setTimeout(() => navigate('/', { replace: true }), 800);
      } else {
        setError('Link invalid hai ya guest access available nahi hai.');
      }
    });
    return () => { active = false; };
    // Redeem just once per navigation, including app-shell remounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    await redeem({ code: code.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Premium Unlock</h1>
        {ok ? (
          <p className="text-sm text-muted-foreground">Unlocked. Redirecting…</p>
        ) : linkMode ? (
          <p className="text-sm text-muted-foreground">{busy || (!error && !ok) ? 'Checking your link…' : (error || 'Link check complete.')}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Enter your admin unlock code. No sign-in needed.
            </p>
            <Input
              type="password"
              autoComplete="off"
              placeholder="Unlock code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || !code.trim()} className="w-full">
              {busy ? 'Unlocking…' : 'Unlock'}
            </Button>
          </>
        )}
      </form>
    </div>
  );
};

export default PremiumUnlock;
