import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import type { GoogleUser } from '@/utils/googleAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  onSignedIn?: (user: GoogleUser) => void;
}

export function EmailAuthSheet({ open, onClose, onSignedIn }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { signIn: signInWithGoogle, isSigningIn: googleSigningIn } = useGoogleAuth();
  const [appleSigningIn, setAppleSigningIn] = useState(false);

  const close = () => onClose();

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

  const handleAppleSignIn = async () => {
    setAppleSigningIn(true);
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
    } finally {
      setAppleSigningIn(false);
    }
  };

  if (!open) return null;

  const isAndroid = Capacitor.getPlatform() === 'android';

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
            <img src="/favicon.webp?v=3" alt="Flowist" className="w-6 h-6" />
            <h2 className="text-[18px] font-black text-[#1a1a1a] font-['Nunito']">
              {t('emailAuth.signInTitle', 'Sign in to Flowist')}
            </h2>
          </div>
          <button onClick={close} className="p-1.5 rounded-full hover:bg-black/5">
            <X className="h-5 w-5 text-[#666]" />
          </button>
        </div>

        <div className="space-y-3">
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

          {/* Apple requires its sign-in option wherever Google is offered (web/iOS; hidden on Android) */}
          {!isAndroid && (
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={appleSigningIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-[#d9d9e3] rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {appleSigningIn ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#666]" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000000">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <span className="text-sm font-medium text-[#1a1a1a]">
                    {t('profile.signInApple', 'Sign in with Apple')}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
