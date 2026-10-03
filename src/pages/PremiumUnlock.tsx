/**
 * Web-only premium unlock route: /premium-unlock
 *
 * SECURITY: The unlock code is NEVER shipped in the client bundle. The admin
 * must type it into the input below, or arrive via a private URL token.
 * The server (premium-web-unlock edge function) checks its encrypted secrets. If it matches
 * AND the caller is signed in, a real `web_premium_unlock` entitlement is
 * granted server-side. All other clients (AI extract, web clipper, etc.)
 * then see Pro via the normal entitlement path — there is no separate
 * client-supplied bypass anymore.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSetting } from '@/utils/settingsStorage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PremiumUnlock = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [linkMode, setLinkMode] = useState(false);

  const redeem = async (body: { code?: string; token?: string }) => {
    setBusy(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('premium-web-unlock', { body });
      if (fnErr) throw fnErr;
      if (!data || (data as { ok?: boolean }).ok !== true) throw new Error('Invalid unlock');
      // This event updates the open paywall only after the server has written the entitlement.
      // Do not persist an unverified client-side Pro flag on the device.
      window.dispatchEvent(new Event('webPremiumEntitlementGranted'));
      setOk(true);
      setTimeout(() => navigate('/', { replace: true }), 800);
    } catch {
      setError('Link invalid hai ya sign-in zaroori hai.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) return;
    setLinkMode(true);
    url.searchParams.delete('token');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    void redeem({ token });
    // Redeem just once per navigation, even in development StrictMode.
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
          <p className="text-sm text-muted-foreground">{busy ? 'Checking your link…' : (error || 'Link check complete.')}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Enter your admin unlock code. You must be signed in.
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
