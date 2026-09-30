import { ArrowLeft, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';

const DeleteAccount = () => {
  const navigate = useNavigate();

  usePageMeta({
    title: 'Delete Your Account | Flowist',
    description: 'Learn how to permanently delete your Flowist account and data, or request deletion by email.',
    path: '/delete-account',
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-accent" aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Delete Your Account</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 pb-24">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Delete your Flowist account</h2>
          <p className="text-muted-foreground leading-relaxed">
            You can delete your Flowist account at any time, directly from the app — no email or
            waiting period required. Deletion is permanent and cannot be undone.
          </p>
        </div>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" /> How to delete your account in the app
          </h3>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 leading-relaxed ml-1">
            <li>Open the Flowist app and sign in with the account you want to delete.</li>
            <li>Go to <strong className="text-foreground">Settings</strong>.</li>
            <li>Scroll to the Account section and tap <strong className="text-foreground">Delete Account</strong>.</li>
            <li>Type <strong className="text-foreground">DELETE</strong> to confirm.</li>
          </ol>
          <p className="text-muted-foreground leading-relaxed">
            Your account is removed immediately, along with all cloud data linked to it.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" /> Request deletion by email
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            If you cannot access the app, email us at{' '}
            <a
              href="mailto:bugtishop@gmail.com?subject=Flowist%20Account%20Deletion%20Request"
              className="text-primary underline underline-offset-4"
            >
              bugtishop@gmail.com
            </a>{' '}
            with the subject <em>"Flowist Account Deletion Request"</em>. Send it from the email
            address linked to your Flowist account so we can verify you. We process deletion
            requests within 7 days.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">What is deleted</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Your Flowist account and sign-in credentials.</li>
            <li>Your cloud-synced notes, tasks, habits, countdowns, and reminders.</li>
            <li>Your preferences, entitlement records, and usage counters.</li>
            <li>Data stored only on your device is removed when you uninstall the app.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> What may be kept
          </h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>
              Payment records held by Google Play, the App Store, or our payment processors, as
              required by law — we never store your payment details.
            </li>
            <li>Anonymous, aggregated statistics that cannot identify you.</li>
          </ul>
        </section>

        <p className="text-sm text-muted-foreground">
          Questions? Visit our{' '}
          <a href="/privacy-policy" className="text-primary underline underline-offset-4">Privacy Policy</a>{' '}
          or contact us at{' '}
          <a href="mailto:bugtishop@gmail.com" className="text-primary underline underline-offset-4">bugtishop@gmail.com</a>.
        </p>
      </main>
    </div>
  );
};

export default DeleteAccount;
