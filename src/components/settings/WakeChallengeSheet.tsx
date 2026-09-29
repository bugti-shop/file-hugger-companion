import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { checkAnswer, getWakeChallenge, saveWakeChallenge, triggerTestAlarm, WakeChallenge, getWakeStats, recordWakeAttempt, WakeStats } from '@/utils/wakeChallenge';

export const WakeChallengeSheet = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const saved = getWakeChallenge();
  const [goal, setGoal] = useState(saved?.goal ?? '');
  const [challenge, setChallenge] = useState<WakeChallenge | null>(saved);
  const [loading, setLoading] = useState(false);
  const [tryAnswer, setTryAnswer] = useState('');
  const [stats, setStats] = useState<WakeStats>({ shown: 0, solved: 0 });
  const refreshStats = () => getWakeStats().then(setStats);
  useEffect(() => { if (isOpen) refreshStats(); }, [isOpen]);
  const pct = stats.shown ? Math.round((stats.solved / stats.shown) * 100) : 0;

  const check = () => {
    if (!challenge || !tryAnswer.trim()) return;
    const ok = checkAnswer(tryAnswer, challenge.answer);
    recordWakeAttempt(ok);
    refreshStats();
    toast[ok ? 'success' : 'error'](ok ? 'Correct!' : 'Not quite');
    if (ok) setTryAnswer('');
  };

  const generate = async () => {
    if (!goal.trim()) { toast.error('Please write your morning goal first'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wake-challenge', { body: { goal } });
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json())?.error; } catch {}
        throw new Error(msg || 'Could not create a challenge');
      }
      const c = { goal: goal.trim(), question: data.question, answer: data.answer };
      setChallenge(c);
      setTryAnswer('');
      await saveWakeChallenge(c);
      toast.success('Wake-up challenge saved to your alarm');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create a challenge');
    } finally { setLoading(false); }
  };

  const remove = async () => { await saveWakeChallenge(null); setChallenge(null); toast.success('Challenge removed'); };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Wake-up Challenge</SheetTitle></SheetHeader>
        <div className="space-y-4 pt-4 pb-6">
          <p className="text-sm text-muted-foreground">Write your morning goal. AI will create a small challenge you must solve to stop your alarm.</p>
          <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} placeholder="e.g. Go for a 20 minute run" rows={3} />
          <Button className="w-full" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {challenge ? 'Make a new challenge' : 'Create challenge'}
          </Button>

          {challenge && (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Your alarm will ask</p>
              <p className="font-medium">{challenge.question}</p>
              <div className="flex gap-2">
                <Input value={tryAnswer} onChange={(e) => setTryAnswer(e.target.value)} placeholder="Try answering" />
                <Button variant="outline" onClick={check}>Check</Button>
              </div>
              <Button variant="ghost" className="w-full text-destructive" onClick={remove}>Remove challenge</Button>
            </div>
          )}

          {stats.shown > 0 && (
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Challenges completed</span>
                <span className="text-muted-foreground">{pct}% ({stats.solved}/{stats.shown})</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          )}

          <Button variant="secondary" className="w-full" onClick={() => { onClose(); triggerTestAlarm(); }}>Test Alarm</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
