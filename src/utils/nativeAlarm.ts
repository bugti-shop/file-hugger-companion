import { Capacitor, registerPlugin } from '@capacitor/core';

interface FlowistAlarmPlugin {
  schedule(options: { key: string; title: string; priority: string; when: number; repeatDays?: number; replacementId?: number }): Promise<void>;
  cancel(options: { key: string }): Promise<void>;
  canUseFullScreenIntent(): Promise<{ allowed: boolean }>;
  openFullScreenIntentSettings(): Promise<void>;
  getOpenedAlarm(): Promise<{ key?: string; title?: string; scheduledAt?: number }>;
  addListener(eventName: 'alarmOpened', listener: (event: { key: string; title: string; scheduledAt: number }) => void): Promise<{ remove(): Promise<void> }>;
}
const alarm = registerPlugin<FlowistAlarmPlugin>('FlowistAlarm');

/** iOS only: a notification tap opens the app, then displays the same alarm card. */
export const listenForOpenedAlarms = (listener: (event: { key: string; title: string; scheduledAt: number }) => void) =>
  alarm.addListener('alarmOpened', listener);

export const getOpenedAlarm = () => alarm.getOpenedAlarm();

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

let fullScreenPromptShown = false;

export const scheduleNativeAlarm = async (key: string, title: string, when: Date, priority = 'None', repeatDays = 0, replacementId?: number) => {
  if (!['android', 'ios'].includes(Capacitor.getPlatform()) || when.getTime() <= Date.now()) return;
  try {
    // Android 14+ revokes full-screen intent for many apps — without it the alarm
    // only vibrates in the shade. Send the user to the grant page once per session.
    if (Capacitor.getPlatform() === 'android' && !fullScreenPromptShown) {
      const allowed = await canUseFullScreenAlarm();
      if (!allowed) {
        fullScreenPromptShown = true;
        await openFullScreenAlarmSettings();
      }
    }
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
