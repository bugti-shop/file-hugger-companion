package nota.npd.com;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.GestureDetector;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class FlowistAlarmActivity extends Activity {
    private String key;
    private GestureDetector gestures;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true); }
        else getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        // True full-screen: hide status & navigation bars
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);

        key = getIntent().getStringExtra("key");
        String title = getIntent().getStringExtra("title");
        String priority = getIntent().getStringExtra("priority");
        if (key == null) { finish(); return; }
        org.json.JSONObject stored = FlowistAlarm.get(this, key);
        if (stored != null) {
            if (title == null) title = stored.optString("title", "Reminder");
            if (priority == null) priority = stored.optString("priority", "None");
        }

        final String finalTitle = title == null ? "Reminder" : title;
        final String finalPriority = priority == null ? "None" : priority;
        buildUi(finalTitle, finalPriority);

        // Swipe up anywhere to stop the alarm
        gestures = new GestureDetector(this, new GestureDetector.SimpleOnGestureListener() {
            @Override public boolean onFling(MotionEvent e1, MotionEvent e2, float vx, float vy) {
                if (e1 != null && e2 != null && e1.getY() - e2.getY() > dp(60) && Math.abs(vy) > Math.abs(vx)) {
                    stop(false);
                    return true;
                }
                return false;
            }
        });
    }

    @Override public boolean onTouchEvent(MotionEvent event) {
        return gestures != null && gestures.onTouchEvent(event) || super.onTouchEvent(event);
    }

    private void buildUi(String title, String priority) {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(dp(30), dp(36), dp(30), dp(36));
        root.setBackgroundColor(Color.BLACK);

        TextView label = text(title, 20, Color.WHITE, false);
        root.addView(label);

        Date now = new Date();
        String time = new SimpleDateFormat("hh:mm", Locale.getDefault()).format(now);
        String ampm = new SimpleDateFormat("a", Locale.getDefault()).format(now);
        LinearLayout timeRow = new LinearLayout(this);
        timeRow.setOrientation(LinearLayout.HORIZONTAL);
        timeRow.setGravity(Gravity.CENTER);
        TextView timeView = text(time, 72, Color.WHITE, false);
        timeView.setTypeface(Typeface.create("sans-serif-light", Typeface.NORMAL));
        TextView ampmView = text(" " + ampm, 22, Color.WHITE, false);
        ampmView.setGravity(Gravity.BOTTOM);
        ampmView.setPadding(0, 0, 0, dp(14));
        timeRow.addView(timeView);
        timeRow.addView(ampmView);
        LinearLayout.LayoutParams timeParams = new LinearLayout.LayoutParams(-1, -2);
        timeParams.topMargin = dp(8);
        root.addView(timeRow, timeParams);

        String date = new SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(now);
        TextView dateView = text(date, 16, Color.rgb(160, 160, 165), false);
        LinearLayout.LayoutParams dateParams = new LinearLayout.LayoutParams(-1, -2);
        dateParams.topMargin = dp(6);
        root.addView(dateView, dateParams);

        View space1 = new View(this);
        root.addView(space1, new LinearLayout.LayoutParams(1, dp(48)));

        ImageView bell = new ImageView(this);
        bell.setImageResource(R.mipmap.ic_launcher);
        bell.setContentDescription("Flowist");
        LinearLayout.LayoutParams bellParams = new LinearLayout.LayoutParams(dp(120), dp(120));
        root.addView(bell, bellParams);

        View space2 = new View(this);
        root.addView(space2, new LinearLayout.LayoutParams(1, dp(56)));

        Button snooze = new Button(this);
        snooze.setText("Snooze for 10 Min");
        snooze.setAllCaps(false);
        snooze.setTextColor(Color.rgb(120, 140, 255));
        snooze.setTextSize(16);
        GradientDrawable pill = new GradientDrawable();
        pill.setCornerRadius(dp(28));
        pill.setColor(Color.TRANSPARENT);
        pill.setStroke(dp(1), Color.rgb(90, 110, 230));
        snooze.setBackground(pill);
        snooze.setOnClickListener(v -> stop(true));
        LinearLayout.LayoutParams snoozeParams = new LinearLayout.LayoutParams(-1, dp(56));
        snoozeParams.leftMargin = dp(40);
        snoozeParams.rightMargin = dp(40);
        root.addView(snooze, snoozeParams);

        View space3 = new View(this);
        root.addView(space3, new LinearLayout.LayoutParams(1, dp(72)));

        TextView chevron = text("^", 22, Color.rgb(160, 160, 165), true);
        root.addView(chevron);
        TextView swipeHint = text("Swipe up to stop alarm", 15, Color.rgb(200, 200, 205), false);
        LinearLayout.LayoutParams hintParams = new LinearLayout.LayoutParams(-1, -2);
        hintParams.topMargin = dp(4);
        root.addView(swipeHint, hintParams);

        setContentView(root);
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(size);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        if (bold) t.setTypeface(null, Typeface.BOLD);
        return t;
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    private void stop(boolean snooze) {
        Intent action = new Intent(this, FlowistAlarmReceiver.class).setAction(snooze ? FlowistAlarm.ACTION_SNOOZE : FlowistAlarm.ACTION_DISMISS).putExtra("key", key);
        sendBroadcast(action);
        finish();
    }
}
