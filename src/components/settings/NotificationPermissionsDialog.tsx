import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Status = { authorized: boolean; status: string };

export function NotificationPermissionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const isIOS = Capacitor.getPlatform() === 'ios';

  const refresh = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      const permission = await LocalNotifications.checkPermissions();
      setStatus({ authorized: permission.display === 'granted', status: permission.display });
    } else {
      const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
      setStatus({ authorized: permission === 'granted', status: permission });
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
      if (Capacitor.isNativePlatform()) await LocalNotifications.requestPermissions();
      else if (typeof Notification !== 'undefined') await Notification.requestPermission();
      await refresh();
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-background text-foreground">
        <DialogHeader><DialogTitle>{isIOS ? 'Notifications' : 'Notifications & alarms'}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-3 border-b border-border pb-2">
            <span>Reminder notifications</span><span className="font-semibold">{status?.authorized ? 'On' : status?.status === 'prompt' || status?.status === 'default' ? 'Not enabled' : 'Off'}</span>
          </div>
          {!status?.authorized && status?.status !== 'denied' && <Button className="w-full" onClick={request} disabled={loading}>{loading ? 'Checking…' : 'Allow notifications'}</Button>}
          {status?.status === 'denied' && <p className="text-muted-foreground text-xs">Enable notifications in your device or browser settings.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
