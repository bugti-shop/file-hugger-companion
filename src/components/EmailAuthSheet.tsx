import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Loader2, Mail, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  startEmailSignup,
  signInWithEmailPassword,
  sendPasswordReset,
} from '@/utils/emailAuth';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import type { GoogleUser } from '@/utils/googleAuth';

type Mode = 'signin' | 'signup' | 'verify-link' | 'forgot';

interface Props {
  open: boolean;
  onClose: () => void;
  onSignedIn?: (user: GoogleUser) => void;
}

export function EmailAuthSheet({ open, onClose, onSignedIn }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { signIn: signInWithGoogle, isSigningIn: googleSigningIn } = useGoogleAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const cooldownTimer = useRef<number | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownTimer.current = window.setTimeout(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => {
      if (cooldownTimer.current) window.clearTimeout(cooldownTimer.current);
    };
  }, [resendCooldown]);

  const startCooldown = () => setResendCooldown(45);

  const reset = () => {
    setMode('signin');
    setEmail(''); setPassword(''); setName(''); setOtp('');
    setOtpError(null); setResendCooldown(0); setShowPassword(false);
  };

  const close = () => { reset(); onClose(); };

  const handleGoogleSignIn = async () => {
    try {
      const u = await signInWithGoogle(true);
      toast({ title: t('emailAuth.signedIn', 'Signed in') });
      onSignedIn?.(u);
      close();
    } catch (err: any) {
      if (err?.message === '__OAUTH_REDIRECT__') return; // browser is redirecting to Google
      toast({
        title: t('emailAuth.signInFailed', 'Sign-in failed'),
        description: err?.message || '',
        variant: 'destructive',
      });
    }
  };

  const googleButton = (
    <>
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-[#e5e5ea]" />
        <span className="text-[12px] text-[#999]">{t('emailAuth.or', 'or')}</span>
        <div className="h-px flex-1 bg-[#e5e5ea]" />
      </div>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleSigningIn}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-[#d9d9e3] rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50"
      >
        {googleSigningIn ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#666]" />
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-medium text-[#1a1a1a]">
              {t('profile.signInGoogle', 'Sign in with Google')}
            </span>
          </>
        )}
      </button>
    </>
  );

  const isAndroid = Capacitor.getPlatform() === 'android';

  const handleAppleSignIn = async () => {
    try {
      const { isNativeApple, signInWithAppleNative } = await import('@/utils/nativeAppleAuth');
      if (isNativeApple()) {
        const u = await signInWithAppleNative();
        if (u) {
          toast({ title: t('emailAuth.signedIn', 'Signed in') });
          close();
        }
        return;
      }
      const { lovable } = await import('@/integrations/lovable/index');
      const result = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: t('emailAuth.signInFailed', 'Sign-in failed'), description: String(result.error.message || result.error), variant: 'destructive' });
      }
    } catch (err: any) {
      const { explainNativeAppleError } = await import('@/utils/nativeAppleAuth');
      const msg = explainNativeAppleError(err);
      if (msg !== 'CANCELLED') {
        toast({ title: t('emailAuth.signInFailed', 'Sign-in failed'), description: msg, variant: 'destructive' });
      }
    }
  };

  // Apple requires its sign-in option wherever Google sign-in is offered (web/iOS; hidden on Android)
  const appleButton = !isAndroid && (
    <button
      type="button"
      onClick={handleAppleSignIn}
      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-[#d9d9e3] rounded-full shadow-sm hover:shadow-md transition-all"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000000">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
      <span className="text-sm font-medium text-[#1a1a1a]">
        {t('profile.signInApple', 'Sign in with Apple')}
      </span>
    </button>
  );

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({ title: t('emailAuth.missingFields', 'Enter email and password'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const u = await signInWithEmailPassword(email.trim(), password);
      toast({ title: t('emailAuth.signedIn', 'Signed in') });
      onSignedIn?.(u);
      close();
    } catch (err: any) {
      // Supabase returns "Invalid login credentials" for both wrong-password
      // and no-such-account. Nudge the user to Create Account first so a
      // brand-new visitor doesn't get stuck on the sign-in tab.
      const raw = String(err?.message || '').toLowerCase();
      const code = String(err?.code || err?.name || '').toLowerCase();
      const looksLikeNoAccount =
        code.includes('invalid_credentials') ||
        raw.includes('invalid login credentials') ||
        raw.includes('invalid credentials') ||
        raw.includes('user not found') ||
        raw.includes('email not confirmed');
      if (looksLikeNoAccount) {
        toast({
          title: t('emailAuth.noAccountTitle', 'Please create an account first'),
          description: t(
            'emailAuth.noAccountDesc',
            "We couldn't find an account for that email. Tap Create account to sign up.",
          ),
          variant: 'destructive',
        });
        // Prefill the signup form with what they already typed so they can
        // just add a name and hit Send verification code.
        setMode('signup');
      } else {
        toast({
          title: t('emailAuth.signInFailed', 'Sign-in failed'),
          description: err?.message || '',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartSignup = async () => {
    if (!email || !password) {
      toast({ title: t('emailAuth.missingFields', 'Enter email and password'), variant: 'destructive' });
      return;
    }
    if (password.length < 8) {
      toast({ title: t('emailAuth.weakPassword', 'Use at least 8 characters'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await startEmailSignup(email.trim(), password, name.trim() || undefined);
      toast({
        title: t('emailAuth.linkSent', 'Verification email sent'),
        description: t('emailAuth.linkSentDesc', 'Check your inbox and click the link to verify your email.'),
      });
      setOtpError(null);
      setMode('verify-link');
    } catch (err: any) {
      const raw = String(err?.message || '').toLowerCase();
      const code = String(err?.code || err?.name || '').toLowerCase();
      const status = Number(err?.status ?? err?.statusCode ?? 0);
      const looksLikeExisting =
        code.includes('user_already_exists') ||
        code.includes('email_exists') ||
        raw.includes('already registered') ||
        raw.includes('already been registered') ||
        raw.includes('user already') ||
        (status === 422 && raw.includes('registered'));
      if (looksLikeExisting) {
        toast({
          title: t('emailAuth.existingAccountTitle', 'This email already has an account'),
          description: t(
            'emailAuth.existingAccountDesc',
            'Please sign in with your password instead.',
          ),
          variant: 'destructive',
        });
        setMode('signin');
      } else {
        toast({
          title: t('emailAuth.signupFailed', 'Could not create account'),
          description: err?.message || '',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // While the user is on the "check your email" screen, listen for the Supabase
  // session that appears the moment they click the verification link — whether
  // that happens in this same WebView (link opens the app via deep link) or on
  // a different tab (Supabase broadcasts via storage events). When it appears,
  // we're already signed in — just close the sheet.
  useEffect(() => {
    if (mode !== 'verify-link') return;
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return;
      try {
        // Re-hydrate our local GoogleUser cache from the fresh session.
        const u = await signInWithEmailPassword(email.trim(), password).catch(async () => {
          // If password sign-in fails (edge case: user already fully signed in
          // via the link in the same WebView), fall back to session data.
          const meta = (session.user.user_metadata || {}) as Record<string, unknown>;
          return {
            email: session.user.email || email,
            name: (meta.full_name as string) || (meta.name as string) || session.user.email || email,
            picture: '',
            accessToken: session.access_token,
            uid: session.user.id,
            accessTokenExpiresAt: Date.now() + 3500 * 1000,
            expiresAt: Date.now() + 365 * 24 * 3600 * 1000,
          } as GoogleUser;
        });
        toast({
          title: t('emailAuth.accountReady', 'Account verified'),
          description: t('emailAuth.syncEnabled', 'Cloud sync is now active on this device.'),
        });
        onSignedIn?.(u);
        close();
      } catch {
        /* ignore */
      }
    });
    return () => { sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // All hooks are declared above; safe to bail out now.
  if (!open) return null;


  // Manual "I've verified — sign me in" fallback for mobile flows where the
  // link opens an external browser and the app WebView never sees the session.
  // Reuses the password the user just typed — no re-entry needed.
  const handleManualContinue = async () => {
    setLoading(true);
    try {
      const u = await signInWithEmailPassword(email.trim(), password);
      toast({ title: t('emailAuth.accountReady', 'Account verified') });
      onSignedIn?.(u);
      close();
    } catch (err: any) {
      const raw = String(err?.message || '').toLowerCase();
      if (raw.includes('email not confirmed') || raw.includes('not confirmed')) {
        toast({
          title: t('emailAuth.notVerifiedYet', 'Not verified yet'),
          description: t('emailAuth.notVerifiedYetDesc', 'Please click the verification link in your email first, then tap Continue.'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('emailAuth.signInFailed', 'Sign-in failed'),
          description: err?.message || '',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      toast({ title: t('emailAuth.missingEmail', 'Enter your email'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      toast({
        title: t('emailAuth.resetSent', 'Reset email sent'),
        description: t('emailAuth.resetSentDesc', 'Check your inbox for password reset instructions.'),
      });
      setMode('signin');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || '', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'signup' ? t('emailAuth.createAccount', 'Create your Flowist account')
    : mode === 'verify-link' ? t('emailAuth.verifyEmail', 'Verify your email')
    : mode === 'forgot' ? t('emailAuth.resetPassword', 'Reset password')
    : t('emailAuth.signInTitle', 'Sign in with email');

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] bg-white rounded-t-3xl p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: 'max(var(--safe-bottom, 0px), 24px)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {mode !== 'signin' && mode !== 'signup' && (
              <button onClick={() => setMode(mode === 'verify-link' ? 'signup' : 'signin')} className="p-1 -ml-1">
                <ArrowLeft className="h-5 w-5 text-[#1a1a1a]" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <img src="/favicon.webp?v=3" alt="Flowist" className="w-6 h-6" />
              <h2 className="text-[18px] font-black text-[#1a1a1a] font-['Nunito']">{title}</h2>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-full hover:bg-black/5">
            <X className="h-5 w-5 text-[#666]" />
          </button>
        </div>

        {mode === 'signup' && (
          <div className="space-y-3">
            <Input
              type="text"
              placeholder={t('emailAuth.namePlaceholder', 'Your name (optional)')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Input
              type="email"
              autoComplete="email"
              placeholder={t('emailAuth.emailPlaceholder', 'Email address')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('emailAuth.passwordPlaceholder', 'Password (8+ characters)')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={
                  showPassword
                    ? t('emailAuth.hidePassword', 'Hide password')
                    : t('emailAuth.showPassword', 'Show password')
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#666] hover:text-[#1a1a1a] rounded-md"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={handleStartSignup} disabled={loading} className="w-full h-12 rounded-xl font-bold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              {t('emailAuth.sendVerifyLink', 'Send verification link')}
            </Button>
            <p className="text-center text-[13px] text-[#666]">
              {t('emailAuth.alreadyHave', 'Already have an account?')}{' '}
              <button onClick={() => setMode('signin')} className="font-bold text-[#1a1a1a] underline">
                {t('emailAuth.signIn', 'Sign in')}
              </button>
            </p>
            {googleButton}
          </div>
        )}

        {mode === 'signin' && (
          <div className="space-y-3">
            <Input
              type="email"
              autoComplete="email"
              placeholder={t('emailAuth.emailPlaceholder', 'Email address')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('emailAuth.passwordPlaceholder', 'Password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={
                  showPassword
                    ? t('emailAuth.hidePassword', 'Hide password')
                    : t('emailAuth.showPassword', 'Show password')
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#666] hover:text-[#1a1a1a] rounded-md"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={handleSignIn} disabled={loading} className="w-full h-12 rounded-xl font-bold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('emailAuth.signIn', 'Sign in')}
            </Button>
            <div className="flex justify-between text-[13px]">
              <button onClick={() => setMode('forgot')} className="text-[#666] underline">
                {t('emailAuth.forgot', 'Forgot password?')}
              </button>
              <button onClick={() => setMode('signup')} className="font-bold text-[#1a1a1a] underline">
                {t('emailAuth.createAccountShort', 'Create account')}
              </button>
            </div>
            {googleButton}
          </div>
        )}

        {mode === 'verify-link' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center gap-2 pt-1">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-[15px] font-bold text-[#1a1a1a]">
                {t('emailAuth.checkYourInbox', 'Check your inbox')}
              </p>
              <p className="text-[13px] text-[#666] leading-relaxed">
                {t(
                  'emailAuth.linkInstructions',
                  'We sent a verification link to {{email}}. Tap the link in that email — it will open Flowist and sign you in automatically.',
                  { email },
                )}
              </p>
            </div>
            <Button
              onClick={handleManualContinue}
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('emailAuth.iClickedLink', "I've verified — continue")}
            </Button>
            {otpError && (
              <p className="text-[12px] text-red-600 text-center -mt-1">{otpError}</p>
            )}
            <p className="text-[11px] text-[#999] text-center leading-relaxed">
              {t(
                'emailAuth.linkSyncNote',
                "Didn't get it? Check your spam folder. The link expires in 30 minutes.",
              )}
            </p>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="space-y-3">
            <p className="text-[13px] text-[#666]">
              {t('emailAuth.forgotIntro', 'Enter your email and we will send you a link to reset your password.')}
            </p>
            <Input
              type="email"
              placeholder={t('emailAuth.emailPlaceholder', 'Email address')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Button onClick={handleForgot} disabled={loading} className="w-full h-12 rounded-xl font-bold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('emailAuth.sendResetLink', 'Send reset link')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
