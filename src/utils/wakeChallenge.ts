import { Capacitor, registerPlugin } from '@capacitor/core';

export interface WakeChallenge { goal: string; question: string; answer: string }

interface Plugin {
  setWakeChallenge(o: { question: string; answer: string }): Promise<void>;
  testAlarm(o: { title: string }): Promise<void>;
}
const alarm = registerPlugin<Plugin>('FlowistAlarm');
const KEY = 'flowist_wake_challenge';

export const getWakeChallenge = (): WakeChallenge | null => {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
};

export const saveWakeChallenge = async (c: WakeChallenge | null) => {
  if (c) localStorage.setItem(KEY, JSON.stringify(c)); else localStorage.removeItem(KEY);
  if (Capacitor.getPlatform() === 'android') {
    try { await alarm.setWakeChallenge({ question: c?.question ?? '', answer: c?.answer ?? '' }); } catch (e) { console.warn('[WakeChallenge] native save failed', e); }
  }
};

export const checkAnswer = (input: string, answer: string) =>
  input.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === answer.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** Shows the full-screen alarm now, without a reminder. */
export const triggerTestAlarm = async () => {
  const title = getWakeChallenge()?.goal || 'Test Alarm';
  if (Capacitor.getPlatform() === 'android') {
    try { await alarm.testAlarm({ title }); return; } catch (e) { console.warn('[Alarm] native test failed, using in-app preview', e); }
  }
  window.dispatchEvent(new CustomEvent('urgentReminderTriggered', {
    detail: { id: 'test-alarm', taskName: title, triggeredAt: new Date(), reminderTime: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) },
  }));
};
