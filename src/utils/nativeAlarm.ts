import { Capacitor, registerPlugin } from '@capacitor/core';

interface FlowistAlarmPlugin {
  schedule(options: { key: string; title: string; priority: string; when: number; repeatDays?: number; replacementId?: number }): Promise<void>;
  cancel(options: { key: string }): Promise<void>;
  canUseFullScreenIntent(): Promise<{ allowed: boolean }>;
  openFullScreenIntentSettings(): Promise<void>;
}
const alarm = registerPlugin<FlowistAlarmPlugin>('FlowistAlarm');

/** Android 14+ can revoke full-screen alarm permission — check before relying on it. */
export const canUseFullScreenAlarm = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() !== 'android') return true;
  try {
    const { allowed } = await alarm.canUseFullScreenIntent();
    return allowed;
  } catch {
    return true;
  }
};

/** Opens the system settings page where the user grants full-screen alarm access. */
export const openFullScreenAlarmSettings = async (): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return;
  try { await alarm.openFullScreenIntentSettings(); } catch (error) { console.warn('[Alarm] Could not open settings', error); }
};

export const scheduleNativeAlarm = async (key: string, title: string, when: Date, priority = 'None', repeatDays = 0, replacementId?: number) => {
  if (!['android', 'ios'].includes(Capacitor.getPlatform()) || when.getTime() <= Date.now()) return;
  try {
    await alarm.schedule({ key, title, priority, when: when.getTime(), repeatDays, replacementId });
  } catch (error) {
    // Leave the existing local notification scheduled if alarm access is unavailable.
    console.warn('[Alarm] Exact alarm unavailable; local notification remains active', error);
  }
};

export const cancelNativeAlarm = async (key: string) => {
  if (!['android', 'ios'].includes(Capacitor.getPlatform())) return;
  try { await alarm.cancel({ key }); } catch (error) { console.warn('[Alarm] Cancel failed', error); }
};
