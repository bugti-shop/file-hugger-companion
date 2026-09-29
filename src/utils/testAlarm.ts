import { Capacitor, registerPlugin } from '@capacitor/core';

interface FlowistAlarmPlugin {
  testAlarm(o: { title: string }): Promise<void>;
}

const alarm = registerPlugin<FlowistAlarmPlugin>('FlowistAlarm');

/** Shows the full-screen alarm now, without a reminder. */
export const triggerTestAlarm = async () => {
  const title = 'Test Alarm';
  if (Capacitor.getPlatform() === 'android') {
    try { await alarm.testAlarm({ title }); return; } catch (e) { console.warn('[Alarm] native test failed, using in-app preview', e); }
  }
  window.dispatchEvent(new CustomEvent('urgentReminderTriggered', {
    detail: { id: 'test-alarm', taskName: title, triggeredAt: new Date(), reminderTime: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) },
  }));
};