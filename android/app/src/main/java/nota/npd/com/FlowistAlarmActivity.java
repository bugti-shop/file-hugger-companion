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
    private boolean isTest;
    private String challengeQ = "", challengeA = "";
    private LinearLayout challengeBox;

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
        isTest = getIntent().getBooleanExtra("test", false);
        android.content.SharedPreferences wp = getSharedPreferences("flowist_wake", MODE_PRIVATE);
        challengeQ = wp.getString("question", "");
        challengeA = wp.getString("answer", "");
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
                    requestStop();
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
        final int bg = Color.rgb(244, 244, 245);
        final int ink = Color.rgb(24, 24, 27);
        final int muted = Color.rgb(140, 140, 148);
        final int red = Color.rgb(219, 37, 45);
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(bg));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(dp(28), dp(24), dp(28), dp(32));
        root.setBackgroundColor(bg);

        // Card deck: two ghost cards behind the main card
        android.widget.FrameLayout deck = new android.widget.FrameLayout(this);
        deck.setClipChildren(false);
        int[][] ghosts = { {dp(36), 0}, {dp(18), dp(20)} };
        for (int[] g : ghosts) {
            View ghost = new View(this);
            ghost.setBackground(card(Color.rgb(250, 250, 250)));
            ghost.setElevation(dp(2));
            android.widget.FrameLayout.LayoutParams gp = new android.widget.FrameLayout.LayoutParams(-1, dp(120));
            gp.leftMargin = g[0]; gp.rightMargin = g[0]; gp.topMargin = g[1];
            deck.addView(ghost, gp);
        }

        LinearLayout main = new LinearLayout(this);
        main.setOrientation(LinearLayout.VERTICAL);
        main.setGravity(Gravity.CENTER_HORIZONTAL);
        main.setPadding(dp(28), dp(36), dp(28), dp(32));
        main.setBackground(card(Color.WHITE));
        main.setElevation(dp(10));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.flowist_alarm_logo);
        logo.setContentDescription("Flowist");
        main.addView(logo, new LinearLayout.LayoutParams(dp(84), dp(84)));

        TextView brand = text("Flowist", 22, ink, true);
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(-1, -2);
        bp.topMargin = dp(8);
        main.addView(brand, bp);

        Date now = new Date();
        LinearLayout timeRow = new LinearLayout(this);
        timeRow.setOrientation(LinearLayout.HORIZONTAL);
        timeRow.setGravity(Gravity.CENTER | Gravity.BOTTOM);
        TextView timeView = text(new SimpleDateFormat("h:mm", Locale.getDefault()).format(now), 64, ink, true);
        TextView ampmView = text(" " + new SimpleDateFormat("a", Locale.getDefault()).format(now), 22, ink, true);
        ampmView.setPadding(0, 0, 0, dp(12));
        timeRow.addView(timeView);
        timeRow.addView(ampmView);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(-1, -2);
        tp.topMargin = dp(20);
        main.addView(timeRow, tp);

        TextView task = text(title, 20, ink, false);
        task.setMaxLines(2);
        task.setEllipsize(android.text.TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams taskP = new LinearLayout.LayoutParams(-1, -2);
        taskP.topMargin = dp(8);
        main.addView(task, taskP);

        Button stopBtn = new Button(this);
        stopBtn.setText("\u25A0  Stop");
        stopBtn.setAllCaps(false);
        stopBtn.setTextColor(Color.WHITE);
        stopBtn.setTextSize(19);
        stopBtn.setStateListAnimator(null);
        GradientDrawable pill = new GradientDrawable();
        pill.setCornerRadius(dp(32));
        pill.setColor(red);
        stopBtn.setBackground(pill);
        stopBtn.setOnClickListener(v -> requestStop());
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-1, dp(60));
        sp.topMargin = dp(32);
        main.addView(stopBtn, sp);

        TextView snooze = text("Snooze 10 min", 15, muted, false);
        snooze.setPadding(dp(12), dp(14), dp(12), dp(2));
        snooze.setOnClickListener(v -> stop(true));
        main.addView(snooze, new LinearLayout.LayoutParams(-1, -2));

        challengeBox = new LinearLayout(this);
        challengeBox.setOrientation(LinearLayout.VERTICAL);
        challengeBox.setVisibility(View.GONE);
        TextView cLabel = text("Wake-up challenge", 13, muted, true);
        challengeBox.addView(cLabel);
        TextView cQ = text(challengeQ, 17, ink, false);
        cQ.setPadding(0, dp(6), 0, dp(10));
        challengeBox.addView(cQ);
        final android.widget.EditText answerIn = new android.widget.EditText(this);
        answerIn.setHint("Your answer");
        answerIn.setSingleLine(true);
        answerIn.setGravity(Gravity.CENTER);
        answerIn.setTextColor(ink);
        challengeBox.addView(answerIn, new LinearLayout.LayoutParams(-1, -2));
        Button check = new Button(this);
        check.setText("Submit & Stop");
        check.setAllCaps(false);
        check.setTextColor(Color.WHITE);
        GradientDrawable pill2 = new GradientDrawable();
        pill2.setCornerRadius(dp(26));
        pill2.setColor(ink);
        check.setBackground(pill2);
        check.setOnClickListener(v -> {
            if (normalize(answerIn.getText().toString()).equals(normalize(challengeA))) showProgressThenStop();
            else { answerIn.setText(""); answerIn.setHint("Not quite — try again"); }
        });
        LinearLayout.LayoutParams chp = new LinearLayout.LayoutParams(-1, dp(52));
        chp.topMargin = dp(10);
        challengeBox.addView(check, chp);
        LinearLayout.LayoutParams cbp = new LinearLayout.LayoutParams(-1, -2);
        cbp.topMargin = dp(20);
        main.addView(challengeBox, cbp);

        android.widget.FrameLayout.LayoutParams mp = new android.widget.FrameLayout.LayoutParams(-1, -2);
        mp.topMargin = dp(40);
        deck.addView(main, mp);
        root.addView(deck, new LinearLayout.LayoutParams(-1, -2));

        TextView chevron = text("\u2303", 24, muted, false);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-1, -2);
        cp.topMargin = dp(36);
        root.addView(chevron, cp);
        root.addView(text("Swipe up to dismiss", 15, muted, false));

        setContentView(root);
    }

    private GradientDrawable card(int color) {
        GradientDrawable d = new GradientDrawable();
        d.setCornerRadius(dp(24));
        d.setColor(color);
        return d;
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

    private String normalize(String v) { return v == null ? "" : v.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", ""); }

    private boolean challengeCounted;

    private void requestStop() {
        if (challengeA.isEmpty()) { stop(false); return; }
        if (!challengeCounted) {
            challengeCounted = true;
            android.content.SharedPreferences wp = getSharedPreferences("flowist_wake", MODE_PRIVATE);
            wp.edit().putInt("shown", wp.getInt("shown", 0) + 1).apply();
        }
        challengeBox.setVisibility(View.VISIBLE);
    }

    // After a correct answer: silence the alarm, show completion progress, then close.
    private void showProgressThenStop() {
        android.content.SharedPreferences wp = getSharedPreferences("flowist_wake", MODE_PRIVATE);
        int solved = wp.getInt("solved", 0) + 1;
        int shown = Math.max(wp.getInt("shown", 0), solved);
        wp.edit().putInt("solved", solved).putInt("shown", shown).apply();
        int pct = Math.round(solved * 100f / shown);
        if (!isTest) sendBroadcast(new Intent(this, FlowistAlarmReceiver.class).setAction(FlowistAlarm.ACTION_DISMISS).putExtra("key", key));

        challengeBox.removeAllViews();
        challengeBox.addView(text("Challenge complete!", 18, Color.rgb(24, 24, 27), true));
        android.widget.ProgressBar bar = new android.widget.ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        bar.setMax(100);
        bar.setProgress(pct);
        bar.setProgressTintList(android.content.res.ColorStateList.valueOf(Color.rgb(219, 37, 45)));
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(-1, dp(10));
        bp.topMargin = dp(14);
        challengeBox.addView(bar, bp);
        TextView info = text(pct + "% challenges completed (" + solved + "/" + shown + ")", 14, Color.rgb(140, 140, 148), false);
        info.setPadding(0, dp(8), 0, 0);
        challengeBox.addView(info);
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(this::finish, 2200);
    }

    private void stop(boolean snooze) {
        if (isTest) { finish(); return; }
        Intent action = new Intent(this, FlowistAlarmReceiver.class).setAction(snooze ? FlowistAlarm.ACTION_SNOOZE : FlowistAlarm.ACTION_DISMISS).putExtra("key", key);
        sendBroadcast(action);
        finish();
    }
}
