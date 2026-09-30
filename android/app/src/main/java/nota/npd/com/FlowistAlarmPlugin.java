package nota.npd.com;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name = "FlowistAlarm")
public class FlowistAlarmPlugin extends Plugin {
    @PluginMethod
    public void schedule(PluginCall call) {
        try {
            JSONObject data = new JSONObject();
            data.put("key", call.getString("key"));
            data.put("title", call.getString("title", "Reminder"));
            data.put("priority", call.getString("priority", "None"));
            data.put("when", call.getLong("when", 0L));
            Integer repeatDays = call.getInt("repeatDays");
            data.put("repeatDays", repeatDays != null ? repeatDays : 0);
            FlowistAlarm.schedule(getContext(), data);
            call.resolve();
        } catch (SecurityException e) {
            // Android 12+: user must allow "Alarms & reminders" once for exact alarms.
            try {
                if (android.os.Build.VERSION.SDK_INT >= 31) {
                    android.content.Intent i = new android.content.Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        android.net.Uri.parse("package:" + getContext().getPackageName())).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(i);
                }
            } catch (Exception ignored) { }
            call.reject("Exact alarm permission missing", e);
        } catch (Exception e) { call.reject("Could not schedule alarm", e); }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String key = call.getString("key");
        if (key == null) { call.reject("Missing alarm key"); return; }
        FlowistAlarm.cancel(getContext(), key);
        FlowistAlarm.cancel(getContext(), key + "-snooze");
        call.resolve();
    }

    @PluginMethod
    public void canUseFullScreenIntent(PluginCall call) {
        boolean allowed = true;
        if (android.os.Build.VERSION.SDK_INT >= 34) {
            android.app.NotificationManager nm = (android.app.NotificationManager) getContext().getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            allowed = nm != null && nm.canUseFullScreenIntent();
        }
        JSObject result = new JSObject();
        result.put("allowed", allowed);
        call.resolve(result);
    }

    @PluginMethod
    public void openFullScreenIntentSettings(PluginCall call) {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 34) {
                android.content.Intent intent = new android.content.Intent(
                    android.provider.Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                    android.net.Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) { call.reject("Could not open full-screen intent settings", e); }
    }

    @PluginMethod
    public void testAlarm(PluginCall call) {
        try {
            android.content.Intent i = new android.content.Intent(getContext(), FlowistAlarmActivity.class)
                .putExtra("key", "flowist-test-alarm")
                .putExtra("title", call.getString("title", "Test Alarm"))
                .putExtra("scheduledAt", System.currentTimeMillis())
                .putExtra("test", true)
                .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            android.content.Intent sound = new android.content.Intent(getContext(), FlowistAlarmService.class)
                .putExtra("key", "flowist-test-alarm")
                .putExtra("title", call.getString("title", "Test Alarm"))
                .putExtra("scheduledAt", System.currentTimeMillis())
                .putExtra("priority", "None")
                .putExtra("test", true);
            if (android.os.Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(sound);
            else getContext().startService(sound);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) { call.reject("Could not open test alarm", e); }
    }

}
