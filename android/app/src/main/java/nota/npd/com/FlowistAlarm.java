package nota.npd.com;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONObject;
import java.util.Map;

/** Device-local alarm registry; survives process death and device reboot. */
final class FlowistAlarm {
    static final String STORE = "flowist_exact_alarms";
    static final String CHANNEL = "flowist-ringing-alarms-v1";
    static final String ACTION_FIRE = "nota.npd.com.ALARM_FIRE";
    static final String ACTION_DISMISS = "nota.npd.com.ALARM_DISMISS";
    static final String ACTION_SNOOZE = "nota.npd.com.ALARM_SNOOZE";
    private FlowistAlarm() {}

    static Intent alarmIntent(Context ctx, String key) {
        // AlarmClock launches this Activity itself at the exact time. Starting an
        // Activity from a background BroadcastReceiver is blocked on modern Android.
        return new Intent(ctx, FlowistAlarmActivity.class).setAction(ACTION_FIRE)
            .setData(android.net.Uri.parse("flowist-alarm://alarm/" + android.net.Uri.encode(key)))
            .putExtra("key", key).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    }

    static Intent broadcastIntent(Context ctx, String key) {
        return new Intent(ctx, FlowistAlarmReceiver.class).setAction(ACTION_FIRE)
            .setData(android.net.Uri.parse("flowist-alarm://alarm/" + android.net.Uri.encode(key)))
            .putExtra("key", key);
    }

    static void schedule(Context ctx, JSONObject data) throws Exception {
        String key = data.getString("key");
        long when = data.getLong("when");
        if (when <= System.currentTimeMillis()) return;
        AlarmManager manager = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) throw new IllegalStateException("Alarm service unavailable");
        if (android.os.Build.VERSION.SDK_INT >= 31 && !manager.canScheduleExactAlarms()) throw new SecurityException("Exact alarm permission missing");
        // setAlarmClock is a user-visible alarm and is allowed through Doze.
        Intent show = new Intent(ctx, MainActivity.class);
        PendingIntent showIntent = PendingIntent.getActivity(ctx, key.hashCode(), show, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        // Fire into our receiver: setAlarmClock lets it start the ringing foreground
        // service, whose full-screen notification opens the alarm screen. A direct
        // Activity PendingIntent is silently blocked on Android 14+ background launches.
        Intent fire = broadcastIntent(ctx, key).putExtra("title", data.optString("title", "Reminder")).putExtra("scheduledAt", when);
        PendingIntent operation = PendingIntent.getBroadcast(ctx, 0, fire, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        // Remove any Activity-based alarm left by an older app version.
        PendingIntent legacy = PendingIntent.getActivity(ctx, 0, alarmIntent(ctx, key), PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (legacy != null) { manager.cancel(legacy); legacy.cancel(); }
        manager.setAlarmClock(new AlarmManager.AlarmClockInfo(when, showIntent), operation);
        ctx.getSharedPreferences(STORE, Context.MODE_PRIVATE).edit().putString(key, data.toString()).apply();
    }

    static JSONObject get(Context ctx, String key) {
        try {
            String raw = ctx.getSharedPreferences(STORE, Context.MODE_PRIVATE).getString(key, null);
            return raw == null ? null : new JSONObject(raw);
        } catch (Exception ignored) { return null; }
    }

    static void cancel(Context ctx, String key) {
        AlarmManager manager = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        PendingIntent operation = PendingIntent.getActivity(ctx, 0, alarmIntent(ctx, key), PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (operation != null) {
            if (manager != null) manager.cancel(operation);
            operation.cancel();
        }
        // Cancel alarms registered by older app versions using a broadcast trigger.
        Intent old = broadcastIntent(ctx, key);
        PendingIntent previous = PendingIntent.getBroadcast(ctx, 0, old, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (previous != null) {
            if (manager != null) manager.cancel(previous);
            previous.cancel();
        }
        ctx.getSharedPreferences(STORE, Context.MODE_PRIVATE).edit().remove(key).apply();
    }

    static void restore(Context ctx) {
        SharedPreferences store = ctx.getSharedPreferences(STORE, Context.MODE_PRIVATE);
        for (Map.Entry<String, ?> entry : store.getAll().entrySet()) {
            try {
                JSONObject data = new JSONObject((String) entry.getValue());
                if (data.getLong("when") > System.currentTimeMillis()) schedule(ctx, data);
                else store.edit().remove(entry.getKey()).apply();
            } catch (Exception ignored) { store.edit().remove(entry.getKey()).apply(); }
        }
    }
}
