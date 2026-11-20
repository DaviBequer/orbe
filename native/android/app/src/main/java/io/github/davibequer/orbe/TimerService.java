package io.github.davibequer.orbe;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Cronômetro fora do app: notificação com contagem regressiva (barra e tela de bloqueio) e, com a
 * permissão "aparecer sobre outros apps", uma janelinha preta que fica por cima de tudo quando o
 * Orbe não está na tela. Arrastar move; tocar abre o Orbe.
 */
public class TimerService extends Service {
    private static final String CH = "cronometro";
    private static final int NOTIF = 7;
    private static boolean appVisible = true;
    private static TimerService inst;

    private final Handler h = new Handler(Looper.getMainLooper());
    private WindowManager wm;
    private LinearLayout box;
    private WindowManager.LayoutParams lp;
    private final List<Item> items = new ArrayList<>();
    private String lastNotif = "";

    private static final class Item {
        String id, t;
        long start, end;
        TextView time;
        View bar;
    }

    static void refresh(Context c) {
        boolean any = Store.timers(c).length() > 0;
        Intent i = new Intent(c, TimerService.class);
        try {
            if (any) {
                if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i);
            } else {
                c.stopService(i);
            }
        } catch (Exception ignored) { }
    }

    /** O app abriu ou saiu da tela: mostra/esconde a janelinha sem reiniciar o serviço. */
    static void setAppVisible(Context c, boolean v) {
        appVisible = v;
        TimerService s = inst;
        if (s != null) s.h.post(s::syncOverlay);
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        inst = this;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        load();
        if (items.isEmpty()) {
            stopSelf();
            return START_NOT_STICKY;
        }
        Notification n = notification();
        if (Build.VERSION.SDK_INT >= 34) startForeground(NOTIF, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        else startForeground(NOTIF, n);
        syncOverlay();
        h.removeCallbacks(tick);
        h.post(tick);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        h.removeCallbacks(tick);
        removeOverlay();
        if (inst == this) inst = null;
        super.onDestroy();
    }

    private void load() {
        items.clear();
        JSONArray a = Store.timers(this);
        for (int i = 0; i < a.length(); i++) {
            try {
                JSONObject o = a.getJSONObject(i);
                Item it = new Item();
                it.id = o.optString("id");
                it.t = o.optString("t");
                it.start = Instant.parse(o.getString("start")).toEpochMilli();
                it.end = Instant.parse(o.getString("end")).toEpochMilli();
                items.add(it);
            } catch (Exception ignored) { }
        }
        Collections.sort(items, (x, y) -> Long.compare(x.end, y.end));
    }

    private PendingIntent openApp() {
        Intent i = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private Notification notification() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            NotificationChannel ch = new NotificationChannel(CH, "Cronômetro", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Tempo das tarefas que você está fazendo agora");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        Item f = items.get(0);
        String txt = "até " + new java.text.SimpleDateFormat("HH:mm", java.util.Locale.US).format(new java.util.Date(f.end))
            + (items.size() > 1 ? " · mais " + (items.size() - 1) + (items.size() == 2 ? " tarefa" : " tarefas") : "");
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_stat_orbe)
            .setContentTitle(f.t)
            .setContentText(txt)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(true)
            .setWhen(f.end)
            .setUsesChronometer(true)
            .setColor(Store.color(f.start, f.end, System.currentTimeMillis()))
            .setContentIntent(openApp())
            .setVisibility(Notification.VISIBILITY_PUBLIC);
        if (Build.VERSION.SDK_INT >= 24) b.setChronometerCountDown(true);
        if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        lastNotif = f.id + f.end + items.size();
        return b.build();
    }

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            long now = System.currentTimeMillis();
            for (Item it : items) {
                if (it.time == null) continue;
                long left = it.end - now;
                it.time.setText(left <= 0 ? "+" + Store.clock(-left) : Store.clock(left));
                int col = Store.color(it.start, it.end, now);
                it.time.setTextColor(col);
                if (left <= 0) it.time.setAlpha((now / 600) % 2 == 0 ? 1f : 0.4f); else it.time.setAlpha(1f);
                it.bar.setBackgroundColor(col);
                View track = (View) it.bar.getParent();
                if (track.getWidth() > 0) {
                    double p = Math.max(0, Math.min(1, 1 - (double) left / Math.max(60000, it.end - it.start)));
                    FrameLayout.LayoutParams bl = (FrameLayout.LayoutParams) it.bar.getLayoutParams();
                    bl.width = (int) (track.getWidth() * p);
                    it.bar.setLayoutParams(bl);
                }
            }
            // a cor da notificação acompanha a primeira tarefa
            if (!items.isEmpty()) {
                Item f = items.get(0);
                String key = f.id + f.end + items.size() + Store.color(f.start, f.end, now);
                if (!key.equals(lastNotif)) {
                    ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIF, notification());
                    lastNotif = key;
                }
            }
            h.postDelayed(this, 500);
        }
    };

    private int dp(float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private boolean canOverlay() { return Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(this); }

    private void syncOverlay() {
        removeOverlay();
        if (appVisible || !canOverlay() || items.isEmpty()) return;
        box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0xF0111214);
        bg.setCornerRadius(dp(16));
        box.setBackground(bg);
        box.setPadding(dp(12), dp(6), dp(12), dp(6));
        box.setElevation(dp(6));
        for (Item it : items) {
            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            TextView title = new TextView(this);
            title.setText(it.t);
            title.setTextColor(0xFFFFFFFF);
            title.setTextSize(13);
            title.setSingleLine(true);
            title.setEllipsize(TextUtils.TruncateAt.END);
            title.setTypeface(Typeface.create("sans-serif-light", Typeface.NORMAL));
            row.addView(title, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
            it.time = new TextView(this);
            it.time.setTextSize(17);
            it.time.setTypeface(Typeface.MONOSPACE);
            it.time.setPadding(dp(10), 0, 0, 0);
            row.addView(it.time);
            box.addView(row, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(30)));
            FrameLayout track = new FrameLayout(this);
            track.setBackgroundColor(0x14FFFFFF);
            it.bar = new View(this);
            track.addView(it.bar, new FrameLayout.LayoutParams(0, FrameLayout.LayoutParams.MATCH_PARENT));
            LinearLayout.LayoutParams tl = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(2));
            tl.bottomMargin = dp(4);
            box.addView(track, tl);
        }
        int type = Build.VERSION.SDK_INT >= 26 ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
        lp = new WindowManager.LayoutParams(dp(220), WindowManager.LayoutParams.WRAP_CONTENT, type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        lp.x = Store.prefs(this).getInt("ox", getResources().getDisplayMetrics().widthPixels - dp(232));
        lp.y = Store.prefs(this).getInt("oy", dp(120));
        box.setOnTouchListener(new View.OnTouchListener() {
            float sx, sy; int ox, oy; boolean moved;
            @Override
            public boolean onTouch(View v, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        sx = e.getRawX(); sy = e.getRawY(); ox = lp.x; oy = lp.y; moved = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx = e.getRawX() - sx, dy = e.getRawY() - sy;
                        if (Math.abs(dx) > dp(6) || Math.abs(dy) > dp(6)) moved = true;
                        if (moved) { lp.x = ox + (int) dx; lp.y = oy + (int) dy; try { wm.updateViewLayout(box, lp); } catch (Exception ignored) { } }
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (moved) Store.prefs(TimerService.this).edit().putInt("ox", lp.x).putInt("oy", lp.y).apply();
                        else try { startActivity(new Intent(TimerService.this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)); } catch (Exception ignored) { }
                        return true;
                    default:
                        return false;
                }
            }
        });
        try { wm.addView(box, lp); } catch (Exception e) { box = null; }
    }

    private void removeOverlay() {
        if (box != null) {
            try { wm.removeView(box); } catch (Exception ignored) { }
            box = null;
        }
        for (Item it : items) { it.time = null; it.bar = null; }
    }
}
