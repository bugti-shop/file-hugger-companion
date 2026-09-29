import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronsUp, Square } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { playRingtone, stopRingtone, RingtoneType } from '@/utils/urgentRingtones';
import { getSetting } from '@/utils/settingsStorage';
import { loadTodoItems, saveTodoItems } from '@/utils/todoItemsStorage';
import { Button } from '@/components/ui/button';
import appLogo from '@/assets/app-logo.webp';

interface UrgentReminder {
  id: string;
  taskName: string;
  triggeredAt: Date;
  reminderTime?: string;
  scheduledAt?: string;
}

export const UrgentReminderOverlay = () => {
  const [reminder, setReminder] = useState<UrgentReminder | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const handleUrgentReminder = (e: CustomEvent<UrgentReminder>) => {
      setReminder(e.detail);
      triggerUrgentHaptics();
      getSetting<RingtoneType>('urgentRingtone', 'alarm').then(tone => {
        playRingtone(tone);
      });
    };

    window.addEventListener('urgentReminderTriggered', handleUrgentReminder as EventListener);
    return () => window.removeEventListener('urgentReminderTriggered', handleUrgentReminder as EventListener);
  }, []);

  const triggerUrgentHaptics = async () => {
    try {
      for (let i = 0; i < 3; i++) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await new Promise(r => setTimeout(r, 100));
      }
    } catch {}
  };

  const dismiss = useCallback(() => {
    stopRingtone();
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    setReminder(null);
  }, []);

  const handleComplete = useCallback(async () => {
    if (!reminder) return;
    try {
      const items = await loadTodoItems();
      const updated = items.map(item =>
        item.id === reminder.id ? { ...item, completed: true, completedAt: new Date() } : item
      );
      await saveTodoItems(updated);
      // Dispatch tasksRestored so Today page reloads its state from storage
      window.dispatchEvent(new CustomEvent('tasksRestored', { detail: updated }));
      // Also notify Firebase sync and other listeners
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
    } catch (e) {
      console.error('[UrgentReminder] Failed to complete task:', e);
    }
    dismiss();
  }, [reminder, dismiss]);

  if (!reminder) return null;

  const scheduled = reminder.scheduledAt ? new Date(reminder.scheduledAt) : reminder.triggeredAt;
  const scheduledLabel = new Intl.DateTimeFormat(undefined, {
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(scheduled instanceof Date && !Number.isNaN(scheduled.getTime()) ? scheduled : new Date());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-label="Alarm"
        onTouchStart={(e) => { startY.current = e.touches[0]?.clientY ?? null; }}
        onTouchEnd={(e) => {
          const endY = e.changedTouches[0]?.clientY;
          if (startY.current !== null && endY !== undefined && startY.current - endY > 80) dismiss();
          startY.current = null;
        }}
        className="alarm-screen fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto px-6 py-8"
      >
        <div className="alarm-content w-full max-w-[390px] text-center">
          <div className="alarm-deck relative pt-10">
            <div className="alarm-ghost alarm-ghost-back absolute inset-x-10 top-0 h-24" aria-hidden="true" />
            <div className="alarm-ghost alarm-ghost-front absolute inset-x-5 top-5 h-24" aria-hidden="true" />
            <div className="alarm-card relative flex flex-col items-center px-7 pb-9 pt-11">
              <img src={appLogo} alt="" className="h-[76px] w-[76px] object-contain" />
              <p className="mt-1 text-[23px] font-semibold leading-tight">Flowist</p>
              <h2 className="alarm-title mt-10 w-full break-words font-bold leading-tight">{reminder.taskName}</h2>
              <p className="alarm-muted mt-6 max-w-full text-base leading-snug">{scheduledLabel}</p>
              <Button onClick={dismiss} className="mt-9 h-[60px] w-full rounded-full border-0 text-lg font-semibold shadow-none active:translate-y-0">
                <Square className="fill-current" /> Stop
              </Button>
              {reminder.id !== 'test-alarm' && (
                <Button variant="ghost" onClick={handleComplete} className="alarm-muted mt-3 text-sm">Complete task</Button>
              )}
            </div>
          </div>
          <div className="alarm-muted mt-7 flex flex-col items-center gap-1 text-sm">
            <ChevronsUp className="alarm-swipe-cue h-6 w-6" aria-hidden="true" />
            <span>Swipe up to dismiss</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
