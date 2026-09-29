import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getIOSNotificationPermissions, openIOSNotificationSettings, requestIOSNotificationPermissions } from '@/utils/nativeAlarm';

type Status = { authorized: boolean; timeSensitive: boolean; sound: boolean; status: string };

export function NotificationPermissionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (Capacitor.getPlatform() === 'ios') {
      try { setStatus(await getIOSNotificationPermissions()); }
      catch { setStatus(null); }
    } else if (Capacitor.isNativePlatform()) {
      const permission = await LocalNotifications.checkPermissions();
      setStatus({ authorized: permission.display === 'granted', timeSensitive: false, sound: true, status: permission.display });
    } else {
      const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
      setStatus({ authorized: permission === 'granted', timeSensitive: false, sound: true, status: permission });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [open, refresh]);

  const request = async () => {
    setLoading(true);
    try {
      if (isIOS) await requestIOSNotificationPermissions();
      else if (Capacitor.isNativePlatform()) await LocalNotifications.requestPermissions();
      else if (typeof Notification !== 'undefined') await Notification.requestPermission();
      await refresh();
    } finally { setLoading(false); }
  };

  const isIOS = Capacitor.getPlatform() === 'ios';
  const needsSettings = status?.status === 'denied' || (isIOS && status?.authorized && (!status.timeSensitive || !status.sound));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-background text-foreground">
        <DialogHeader><DialogTitle>Notifications & alarms</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-3 border-b border-border pb-2">
            <span>Reminder notifications</span><span className="font-semibold">{status?.authorized ? 'On' : status?.status === 'notDetermined' || status?.status === 'default' ? 'Not enabled' : 'Off'}</span>
          </div>
          {isIOS && <>
            <div className="flex justify-between gap-3 border-b border-border pb-2">
              <span>Time Sensitive alarms</span><span className="font-semibold">{status?.timeSensitive ? 'On' : 'Off'}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-border pb-2">
              <span>Notification sound</span><span className="font-semibold">{status?.sound ? 'On' : 'Off'}</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">On iPhone, alarm reminders appear as Time Sensitive notifications on the lock screen. Open the alert for the alarm card. iOS does not allow a full-screen lock-screen alarm.</p>
          </>}
          {!status?.authorized && status?.status !== 'denied' && <Button className="w-full" onClick={request} disabled={loading}>{loading ? 'Checking…' : 'Allow notifications'}</Button>}
          {isIOS && needsSettings && <Button className="w-full" onClick={() => void openIOSNotificationSettings()}>Open iPhone Settings</Button>}
          {status?.status === 'denied' && !isIOS && <p className="text-muted-foreground text-xs">Enable notifications in your device or browser settings.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}